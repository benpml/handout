import { useEffect, useMemo } from "react";
import {
  TRACKING_HEARTBEAT_INTERVAL_MS,
  TRACKING_INGEST_ENDPOINT,
  TRACKING_MAX_BATCH_EVENTS,
  TRACKING_MAX_HEARTBEAT_SECONDS,
  TRACKING_MAX_ID_LENGTH,
  TRACKING_MAX_REQUEUED_EVENTS,
  TRACKING_SCRIPT_VERSION,
  extractReferrerHost,
  sanitizeTrackedUrl,
  trackingScrollThresholds,
  truncateTrackingLabel,
  type TrackingBatch,
  type TrackingContext,
  type TrackingEvent,
  type TrackingEventBase,
} from "@lightsite/tracking-schema";

let fallbackBrowserIdSequence = 0;

export type TrackingTransport = (batch: TrackingBatch) => boolean | Promise<void>;

export function usePublicTracking(context: TrackingContext) {
  const {
    mode,
    publishedVersionId,
    siteId,
    token,
    variantId,
    variantRevision,
    workspaceId,
  } = context;
  const sessionScope = useMemo(
    () => ({
      workspaceId,
      siteId,
      publishedVersionId,
      variantId,
      variantRevision,
    }),
    [
      workspaceId,
      siteId,
      publishedVersionId,
      variantId,
      variantRevision,
    ],
  );
  const trackingContext = useMemo(
    () => ({
      ...sessionScope,
      mode,
      token,
    }),
    [mode, sessionScope, token],
  );

  useEffect(() => {
    if (trackingContext.mode !== "engagement" || !trackingContext.token) {
      return;
    }

    const sessionId = getSessionId(sessionScope);
    const queue = new TrackingQueue();
    let maxScrollDepthPercent = calculateScrollDepth();
    const reachedDepths = new Set<number>();
    let lastVisibleAt = document.visibilityState === "visible" ? Date.now() : null;
    let scrollFrameId: number | null = null;

    queue.enqueue({
      ...baseEvent("site_viewed", trackingContext, sessionId),
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      referrerHost: extractReferrerHost(document.referrer),
    });

    const recordScrollDepth = () => {
      scrollFrameId = null;
      maxScrollDepthPercent = Math.max(maxScrollDepthPercent, calculateScrollDepth());

      for (const threshold of trackingScrollThresholds) {
        if (maxScrollDepthPercent >= threshold && !reachedDepths.has(threshold)) {
          reachedDepths.add(threshold);
          queue.enqueue({
            ...baseEvent("scroll_depth_reached", trackingContext, sessionId),
            depthPercent: threshold,
          });
        }
      }
    };

    const onScroll = () => {
      if (scrollFrameId !== null) {
        return;
      }

      scrollFrameId = window.requestAnimationFrame(recordScrollDepth);
    };

    const onClick = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target.closest<HTMLElement>("[data-track-click-id]") : null;

      if (!target) {
        return;
      }

      const elementId = target.dataset.trackClickId;

      if (!elementId) {
        return;
      }

      const anchor = target instanceof HTMLAnchorElement ? target : target.closest<HTMLAnchorElement>("a");
      const href = sanitizeTrackedUrl(anchor?.href);
      const label = truncateTrackingLabel(target.dataset.trackLabel ?? target.textContent);

      queue.enqueue({
        ...baseEvent(href ? "link_clicked" : "element_clicked", trackingContext, sessionId),
        elementId,
        label,
        href,
      });

      if (href) {
        queue.flush();
      }
    };

    const enqueueHeartbeat = () => {
      if (lastVisibleAt === null) {
        return;
      }

      const now = Date.now();
      const elapsedMs = now - lastVisibleAt;
      if (elapsedMs < 1_000) {
        return;
      }

      const engagedSeconds = Math.min(
        TRACKING_MAX_HEARTBEAT_SECONDS,
        Math.round(elapsedMs / 1000),
      );
      lastVisibleAt = now;

      queue.enqueue({
        ...baseEvent("heartbeat", trackingContext, sessionId),
        engagedSeconds,
        maxScrollDepthPercent,
      });
    };

    const flushNow = () => {
      enqueueHeartbeat();
      queue.flush();
    };

    const heartbeatId = window.setInterval(flushNow, TRACKING_HEARTBEAT_INTERVAL_MS);
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        flushNow();
        lastVisibleAt = null;
        return;
      }

      if (lastVisibleAt === null) {
        lastVisibleAt = Date.now();
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pagehide", flushNow);
    document.addEventListener("visibilitychange", onVisibilityChange);
    document.addEventListener("click", onClick);
    onScroll();

    return () => {
      window.clearInterval(heartbeatId);
      if (scrollFrameId !== null) {
        window.cancelAnimationFrame(scrollFrameId);
      }
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pagehide", flushNow);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      document.removeEventListener("click", onClick);
      flushNow();
    };
  }, [sessionScope, trackingContext]);
}

function baseEvent<TType extends TrackingEvent["type"]>(
  type: TType,
  context: TrackingContext,
  sessionId: string,
): TrackingEventBase & { type: TType } {
  return {
    eventId: createBrowserId("event"),
    type,
    occurredAt: new Date().toISOString(),
    sessionId,
    context,
    scriptVersion: TRACKING_SCRIPT_VERSION,
  };
}

function calculateScrollDepth() {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;

  if (scrollable <= 0) {
    return 100;
  }

  return Math.min(100, Math.round(((window.scrollY + window.innerHeight) / document.documentElement.scrollHeight) * 100));
}

function createBrowserId(prefix: string) {
  const uuid = globalThis.crypto?.randomUUID?.();

  if (uuid) {
    return `${prefix}_${uuid}`;
  }

  const entropy = new Uint32Array(2);
  globalThis.crypto?.getRandomValues?.(entropy);
  fallbackBrowserIdSequence += 1;

  return `${prefix}_${Date.now().toString(36)}_${fallbackBrowserIdSequence.toString(36)}_${Array.from(entropy)
    .map((value) => value.toString(36))
    .join("")}`;
}

type TrackingSessionScope = Pick<
  TrackingContext,
  "workspaceId" | "siteId" | "publishedVersionId" | "variantId" | "variantRevision"
>;

function getSessionId(context: TrackingSessionScope) {
  const storageKey = [
    "lightsite.session",
    context.workspaceId,
    context.siteId,
    context.publishedVersionId,
    context.variantId ?? "default",
    context.variantRevision ?? 0,
  ].join(":");

  try {
    const existing = window.sessionStorage.getItem(storageKey);

    if (existing && isStoredSessionId(existing)) {
      return existing;
    }

    const next = createBrowserId("session");
    window.sessionStorage.setItem(storageKey, next);
    return next;
  } catch {
    return createBrowserId("session");
  }
}

function isStoredSessionId(value: string) {
  return value.startsWith("session_") && value.length <= TRACKING_MAX_ID_LENGTH;
}

export class TrackingQueue {
  private events: TrackingEvent[] = [];
  private readonly transport: TrackingTransport;

  constructor(transport: TrackingTransport = sendTrackingBatch) {
    this.transport = transport;
  }

  enqueue(event: TrackingEvent) {
    this.events.push(event);

    if (this.events.length >= TRACKING_MAX_BATCH_EVENTS) {
      this.flush();
    }
  }

  flush() {
    while (this.events.length > 0) {
      const batch: TrackingBatch = {
        batchId: createBrowserId("batch"),
        sentAt: new Date().toISOString(),
        events: this.events.splice(0, TRACKING_MAX_BATCH_EVENTS),
      };

      try {
        const result = this.transport(batch);

        if (result === false) {
          this.requeue(batch.events);
          return;
        }

        if (isPromiseLike(result)) {
          result.catch(() => {
            this.requeue(batch.events);
          });
        }
      } catch {
        this.requeue(batch.events);
        return;
      }
    }
  }

  private requeue(events: TrackingEvent[]) {
    this.events.unshift(...events);
    this.events = this.events.slice(0, TRACKING_MAX_REQUEUED_EVENTS);
  }
}

function sendTrackingBatch(batch: TrackingBatch) {
  const body = JSON.stringify(batch);

  if (navigator.sendBeacon?.(TRACKING_INGEST_ENDPOINT, new Blob([body], { type: "application/json" }))) {
    return true;
  }

  return fetch(TRACKING_INGEST_ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
    keepalive: true,
  }).then(() => undefined);
}

function isPromiseLike(value: boolean | Promise<void>): value is Promise<void> {
  return typeof value !== "boolean";
}
