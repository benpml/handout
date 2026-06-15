import type { Request, Response } from "express";
import { Router } from "express";
import {
  renderPublicSiteHtmlDocument,
  renderUnavailablePublicSiteHtmlDocument,
} from "./html";
import type { PublicSiteResolution, PublicSiteService } from "./service";
import { createNoopTrackingEventSink, type TrackingEventSink } from "../tracking/event-sink";
import { recordPublicLinkPreview } from "../tracking/preview";
import type { TrackingRateLimiter } from "../tracking/rate-limit";

export type PublicSiteDocumentRouterOptions = {
  publicSiteOrigin: string;
  publicSiteService: PublicSiteService;
  trackingEvents?: TrackingEventSink;
  trackingRateLimiter?: TrackingRateLimiter;
};

const publicSiteDocumentSecurityHeaders = {
  "content-security-policy": [
    "default-src 'none'",
    "base-uri 'none'",
    "frame-ancestors 'none'",
    "form-action 'none'",
    "object-src 'none'",
    "script-src 'self'",
    "connect-src 'self'",
    "img-src 'self' https: data:",
    "style-src 'unsafe-inline'",
  ].join("; "),
  "referrer-policy": "strict-origin-when-cross-origin",
  "x-content-type-options": "nosniff",
} as const;

export function createPublicSiteDocumentRouter(options: PublicSiteDocumentRouterOptions) {
  const router = Router();
  const trackingEvents = options.trackingEvents ?? createNoopTrackingEventSink();

  router.use((request, _response, next) => {
    if (request.path === "/api" || request.path.startsWith("/api/")) {
      next("router");
      return;
    }

    next();
  });

  router.use((_request, response, next) => {
    for (const [name, value] of Object.entries(publicSiteDocumentSecurityHeaders)) {
      response.setHeader(name, value);
    }

    next();
  });

  router.get("/:workspaceSlug/:siteSlug", (request, response) => {
    void resolveAndSendPublicSiteDocument({
      input: {
        workspaceSlug: request.params.workspaceSlug ?? "",
        siteSlug: request.params.siteSlug ?? "",
      },
      origin: options.publicSiteOrigin,
      publicSiteService: options.publicSiteService,
      request,
      response,
      trackingEvents,
      trackingRateLimiter: options.trackingRateLimiter,
    });
  });

  router.get("/:workspaceSlug/:siteSlug/:variantSlug", (request, response) => {
    void resolveAndSendPublicSiteDocument({
      input: {
        workspaceSlug: request.params.workspaceSlug ?? "",
        siteSlug: request.params.siteSlug ?? "",
        variantSlug: request.params.variantSlug ?? "",
      },
      origin: options.publicSiteOrigin,
      publicSiteService: options.publicSiteService,
      request,
      response,
      trackingEvents,
      trackingRateLimiter: options.trackingRateLimiter,
    });
  });

  return router;
}

async function resolveAndSendPublicSiteDocument(input: {
  input: {
    workspaceSlug: string;
    siteSlug: string;
    variantSlug?: string;
  };
  origin: string;
  publicSiteService: PublicSiteService;
  request: Request;
  response: Response;
  trackingEvents: TrackingEventSink;
  trackingRateLimiter?: TrackingRateLimiter;
}) {
  try {
    sendPublicSiteDocument({
      origin: input.origin,
      request: input.request,
      response: input.response,
      result: await input.publicSiteService.resolve(input.input),
      trackingEvents: input.trackingEvents,
      trackingRateLimiter: input.trackingRateLimiter,
    });
  } catch {
    input.response.setHeader("cache-control", "no-store");
    input.response
      .status(503)
      .type("html")
      .send(renderUnavailablePublicSiteHtmlDocument(input.origin, input.request.path));
  }
}

function sendPublicSiteDocument(input: {
  origin: string;
  request: Request;
  response: Response;
  result: PublicSiteResolution;
  trackingEvents: TrackingEventSink;
  trackingRateLimiter?: TrackingRateLimiter;
}) {
  input.response.setHeader("cache-control", input.result.cacheControl);
  input.response.type("html");

  if (input.result.status !== "available") {
    input.response
      .status(404)
      .send(renderUnavailablePublicSiteHtmlDocument(input.origin, input.request.path));
    return;
  }

  const html = renderPublicSiteHtmlDocument({
    origin: input.origin,
    payload: input.result.payload,
  });

  if (!html) {
    input.response
      .status(404)
      .send(renderUnavailablePublicSiteHtmlDocument(input.origin, input.request.path));
    return;
  }

  void recordPublicLinkPreview({
    payload: input.result.payload,
    resource: "html",
    userAgent: input.request.get("user-agent"),
    eventSink: input.trackingEvents,
    rateLimiter: input.trackingRateLimiter,
  }).catch(() => {
    // Preview tracking is best-effort and must never affect public rendering.
  });

  input.response.status(200).send(html);
}
