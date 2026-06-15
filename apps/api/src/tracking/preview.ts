import { randomUUID } from "node:crypto";
import { normalizePublishedSitePayload } from "@lightsite/content-schema";
import {
  TRACKING_SCRIPT_VERSION,
  classifyPreviewRequest,
  type PreviewResource,
  type TrackingBatch,
} from "@lightsite/tracking-schema";
import type { TrackingEventSink } from "./event-sink";
import type { TrackingRateLimiter } from "./rate-limit";

export type PreviewTrackingInput = {
  payload: Record<string, unknown>;
  resource: PreviewResource;
  userAgent: string | null | undefined;
  eventSink: TrackingEventSink;
  rateLimiter?: TrackingRateLimiter;
  now?: Date;
};

export async function recordPublicLinkPreview(input: PreviewTrackingInput) {
  const payload = normalizePublishedSitePayload(input.payload);

  if (!payload || !payload.tracking.token || payload.tracking.mode === "off") {
    return;
  }

  const classification = classifyPreviewRequest({
    resource: input.resource,
    userAgent: input.userAgent,
  });

  if (!classification.isPreviewBot) {
    return;
  }

  if (input.rateLimiter) {
    const rateLimit = await input.rateLimiter.check({
      key: buildPreviewRateLimitKey({
        context: payload.tracking,
        platform: classification.platform,
        resource: input.resource,
      }),
      eventCount: 1,
    });

    if (!rateLimit.allowed) {
      return;
    }
  }

  await input.eventSink.record(buildPreviewTrackingBatch({
    context: payload.tracking,
    occurredAt: input.now ?? new Date(),
    platform: classification.platform,
    resource: classification.resource,
    source: input.resource === "html" ? "preview_html" : "preview_og_image",
    userAgentFamily: classification.userAgentFamily,
  }), {
    source: input.resource === "html" ? "preview_html" : "preview_og_image",
  });
}

function buildPreviewRateLimitKey(input: {
  context: NonNullable<ReturnType<typeof normalizePublishedSitePayload>>["tracking"];
  platform: ReturnType<typeof classifyPreviewRequest>["platform"];
  resource: PreviewResource;
}) {
  return [
    "tracking-preview",
    input.context.workspaceId,
    input.context.siteId,
    input.context.publishedVersionId,
    input.context.variantId ?? "default",
    input.context.variantRevision ?? 0,
    input.platform,
    input.resource,
  ].join(":");
}

function buildPreviewTrackingBatch(input: {
  context: NonNullable<ReturnType<typeof normalizePublishedSitePayload>>["tracking"];
  occurredAt: Date;
  platform: ReturnType<typeof classifyPreviewRequest>["platform"];
  resource: PreviewResource;
  source: "preview_html" | "preview_og_image";
  userAgentFamily: string;
}): TrackingBatch {
  const timestamp = input.occurredAt.toISOString();
  const suffix = randomUUID();

  return {
    batchId: `batch_preview_${suffix}`,
    sentAt: timestamp,
    events: [
      {
        eventId: `event_preview_${suffix}`,
        type: "link_preview_loaded",
        occurredAt: timestamp,
        sessionId: `session_${input.source}_${suffix}`,
        context: input.context,
        scriptVersion: TRACKING_SCRIPT_VERSION,
        platform: input.platform,
        resource: input.resource,
        userAgentFamily: input.userAgentFamily,
      },
    ],
  };
}
