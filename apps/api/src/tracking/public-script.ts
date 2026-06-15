import { Router } from "express";
import {
  TRACKING_HEARTBEAT_INTERVAL_MS,
  TRACKING_INGEST_ENDPOINT,
  TRACKING_MAX_BATCH_EVENTS,
  TRACKING_MAX_HEARTBEAT_SECONDS,
  TRACKING_MAX_ID_LENGTH,
  TRACKING_MAX_REQUEUED_EVENTS,
  TRACKING_SCRIPT_ENDPOINT,
  TRACKING_SCRIPT_VERSION,
  trackingScrollThresholds,
} from "@lightsite/tracking-schema";

export const PUBLIC_TRACKING_SCRIPT_CACHE_CONTROL = "public, max-age=31536000, immutable";

export function createPublicTrackingScriptRouter() {
  const router = Router();

  router.get(TRACKING_SCRIPT_ENDPOINT, (_request, response) => {
    response
      .status(200)
      .setHeader("cache-control", PUBLIC_TRACKING_SCRIPT_CACHE_CONTROL);
    response.setHeader("x-content-type-options", "nosniff");
    response.type("application/javascript").send(PUBLIC_TRACKING_SCRIPT);
  });

  return router;
}

export const PUBLIC_TRACKING_SCRIPT = `
;(() => {
  "use strict";

  const script =
    document.currentScript ||
    document.querySelector("script[data-lightsite-tracking]");
  if (!script) return;

  let context;
  try {
    context = JSON.parse(script.dataset.lightsiteTracking || "null");
  } catch {
    return;
  }

  if (!context || !context.token || context.mode === "off") return;

  const config = {
    endpoint: script.dataset.lightsiteIngest || "${TRACKING_INGEST_ENDPOINT}",
    heartbeatIntervalMs: ${TRACKING_HEARTBEAT_INTERVAL_MS},
    maxBatchEvents: ${TRACKING_MAX_BATCH_EVENTS},
    maxHeartbeatSeconds: ${TRACKING_MAX_HEARTBEAT_SECONDS},
    maxIdLength: ${TRACKING_MAX_ID_LENGTH},
    maxRequeuedEvents: ${TRACKING_MAX_REQUEUED_EVENTS},
    scriptVersion: "${TRACKING_SCRIPT_VERSION}",
    scrollThresholds: ${JSON.stringify(trackingScrollThresholds)}
  };

  let idSequence = 0;
  const sessionId = getSessionId(context);
  const queue = [];
  const reachedDepths = new Set();
  let maxScrollDepthPercent = calculateScrollDepth();
  let lastVisibleAt = document.visibilityState === "visible" ? Date.now() : null;
  let scrollFrameId = null;

  enqueue({
    ...baseEvent("site_viewed"),
    viewport: {
      width: Math.max(1, Math.round(window.innerWidth || 1)),
      height: Math.max(1, Math.round(window.innerHeight || 1))
    },
    referrerHost: getReferrerHost(document.referrer)
  });
  flush();

  if (context.mode !== "engagement") {
    return;
  }

  const recordScrollDepth = () => {
    scrollFrameId = null;
    maxScrollDepthPercent = Math.max(maxScrollDepthPercent, calculateScrollDepth());

    for (const threshold of config.scrollThresholds) {
      if (maxScrollDepthPercent >= threshold && !reachedDepths.has(threshold)) {
        reachedDepths.add(threshold);
        enqueue({
          ...baseEvent("scroll_depth_reached"),
          depthPercent: threshold
        });
      }
    }
  };

  const onScroll = () => {
    if (scrollFrameId !== null) return;
    scrollFrameId = window.requestAnimationFrame(recordScrollDepth);
  };

  const onClick = (event) => {
    const target = event.target instanceof Element
      ? event.target.closest("[data-track-click-id]")
      : null;
    if (!target) return;

    const elementId = target.dataset.trackClickId;
    if (!elementId) return;

    const anchor = target instanceof HTMLAnchorElement
      ? target
      : target.closest("a");
    const href = sanitizeTrackedUrl(anchor && anchor.href);
    const label = truncateLabel(target.dataset.trackLabel || target.textContent);

    enqueue({
      ...baseEvent(href ? "link_clicked" : "element_clicked"),
      elementId,
      label,
      href
    });

    if (href) flush();
  };

  const enqueueHeartbeat = () => {
    if (lastVisibleAt === null) return;

    const now = Date.now();
    const elapsedMs = now - lastVisibleAt;
    if (elapsedMs < 1000) return;

    lastVisibleAt = now;
    enqueue({
      ...baseEvent("heartbeat"),
      engagedSeconds: Math.min(config.maxHeartbeatSeconds, Math.round(elapsedMs / 1000)),
      maxScrollDepthPercent
    });
  };

  const flushNow = () => {
    enqueueHeartbeat();
    flush();
  };

  const heartbeatId = window.setInterval(flushNow, config.heartbeatIntervalMs);
  const onVisibilityChange = () => {
    if (document.visibilityState === "hidden") {
      flushNow();
      lastVisibleAt = null;
      return;
    }

    if (lastVisibleAt === null) lastVisibleAt = Date.now();
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("pagehide", flushNow);
  document.addEventListener("visibilitychange", onVisibilityChange);
  document.addEventListener("click", onClick);
  onScroll();

  function enqueue(event) {
    queue.push(event);
    if (queue.length >= config.maxBatchEvents) flush();
  }

  function flush() {
    while (queue.length > 0) {
      const batch = {
        batchId: createBrowserId("batch"),
        sentAt: new Date().toISOString(),
        events: queue.splice(0, config.maxBatchEvents)
      };

      if (!send(batch)) {
        queue.unshift(...batch.events);
        queue.splice(config.maxRequeuedEvents);
        return;
      }
    }
  }

  function send(batch) {
    try {
      const body = JSON.stringify(batch);
      if (navigator.sendBeacon && navigator.sendBeacon(config.endpoint, new Blob([body], { type: "application/json" }))) {
        return true;
      }

      fetch(config.endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body,
        keepalive: true
      }).catch(() => {});
      return true;
    } catch {
      return false;
    }
  }

  function baseEvent(type) {
    return {
      eventId: createBrowserId("event"),
      type,
      occurredAt: new Date().toISOString(),
      sessionId,
      context,
      scriptVersion: config.scriptVersion
    };
  }

  function calculateScrollDepth() {
    const height = document.documentElement.scrollHeight || 0;
    const scrollable = height - window.innerHeight;
    if (scrollable <= 0) return 100;
    return Math.min(100, Math.round(((window.scrollY + window.innerHeight) / height) * 100));
  }

  function getSessionId(trackingContext) {
    const storageKey = [
      "lightsite.session",
      trackingContext.workspaceId,
      trackingContext.siteId,
      trackingContext.publishedVersionId,
      trackingContext.variantId || "default",
      trackingContext.variantRevision || 0
    ].join(":");

    try {
      const existing = window.sessionStorage.getItem(storageKey);
      if (existing && existing.startsWith("session_") && existing.length <= config.maxIdLength) return existing;

      const next = createBrowserId("session");
      window.sessionStorage.setItem(storageKey, next);
      return next;
    } catch {
      return createBrowserId("session");
    }
  }

  function createBrowserId(prefix) {
    if (globalThis.crypto && globalThis.crypto.randomUUID) {
      return prefix + "_" + globalThis.crypto.randomUUID();
    }

    idSequence += 1;
    return prefix + "_" + Date.now().toString(36) + "_" + idSequence.toString(36);
  }

  function getReferrerHost(value) {
    if (!value) return null;
    try {
      return new URL(value).hostname.toLowerCase();
    } catch {
      return null;
    }
  }

  function sanitizeTrackedUrl(value) {
    if (!value) return null;
    try {
      const url = new URL(value);
      if (url.protocol !== "http:" && url.protocol !== "https:") return null;
      url.username = "";
      url.password = "";
      url.hash = "";
      url.search = "";
      const sanitized = url.toString();
      return sanitized.length > 2000 ? null : sanitized;
    } catch {
      return null;
    }
  }

  function truncateLabel(value) {
    const label = String(value || "").trim() || "Clicked element";
    return label.length > 160 ? label.slice(0, 160) : label;
  }
})();
`.trim();
