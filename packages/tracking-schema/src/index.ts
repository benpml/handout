export const TRACKING_SCRIPT_VERSION = "2026-06-14.v1" as const;

export const TRACKING_SCRIPT_ENDPOINT = `/track/${TRACKING_SCRIPT_VERSION}/script.js` as const;
export const TRACKING_INGEST_ENDPOINT = "/api/public/tracking/events" as const;

export const TRACKING_HEARTBEAT_INTERVAL_MS = 15_000;
export const TRACKING_MAX_BATCH_EVENTS = 5;
export const TRACKING_MAX_REQUEUED_EVENTS = 20;
export const TRACKING_MAX_ID_LENGTH = 160;
export const TRACKING_MAX_CONTEXT_TOKEN_LENGTH = 1_024;
export const TRACKING_MAX_CLICK_LABEL_LENGTH = 160;
export const TRACKING_MAX_URL_LENGTH = 2_000;
export const TRACKING_MAX_REFERRER_HOST_LENGTH = 253;
export const TRACKING_MAX_HEARTBEAT_SECONDS = 60;

export const trackingScrollThresholds = [25, 50, 75, 90, 100] as const;

export const trackingEventTypes = [
  "site_viewed",
  "heartbeat",
  "scroll_depth_reached",
  "element_clicked",
  "button_clicked",
  "link_clicked",
  "calendar_booked",
  "link_preview_loaded",
] as const;

export type TrackingEventType = (typeof trackingEventTypes)[number];
export type TrackingScrollThreshold = (typeof trackingScrollThresholds)[number];

export type TrackingMode = "off" | "essential_only" | "engagement";

export const previewPlatforms = [
  "slack",
  "microsoft_teams",
  "linkedin",
  "x",
  "facebook",
  "discord",
  "search",
  "generic_bot",
  "unknown",
] as const;

export const previewResources = ["html", "og_image"] as const;

export type TrackingContext = {
  workspaceId: string;
  siteId: string;
  publishedVersionId: string;
  variantId: string | null;
  variantRevision: number | null;
  mode: TrackingMode;
  token: string | null;
};

export type UnsignedTrackingContext = Omit<TrackingContext, "token">;

export type TrackingEventBase = {
  eventId: string;
  type: TrackingEventType;
  occurredAt: string;
  sessionId: string;
  context: TrackingContext;
  scriptVersion: typeof TRACKING_SCRIPT_VERSION;
};

export type SiteViewedEvent = TrackingEventBase & {
  type: "site_viewed";
  viewport: {
    width: number;
    height: number;
  };
  referrerHost: string | null;
};

export type HeartbeatEvent = TrackingEventBase & {
  type: "heartbeat";
  engagedSeconds: number;
  maxScrollDepthPercent: number;
};

export type ScrollDepthReachedEvent = TrackingEventBase & {
  type: "scroll_depth_reached";
  depthPercent: TrackingScrollThreshold;
};

export type ElementClickedEvent = TrackingEventBase & {
  type: "element_clicked" | "button_clicked" | "link_clicked" | "calendar_booked";
  elementId: string;
  label: string;
  href: string | null;
};

export type LinkPreviewLoadedEvent = TrackingEventBase & {
  type: "link_preview_loaded";
  platform: PreviewPlatform;
  resource: PreviewResource;
  userAgentFamily: string;
};

export type TrackingEvent =
  | SiteViewedEvent
  | HeartbeatEvent
  | ScrollDepthReachedEvent
  | ElementClickedEvent
  | LinkPreviewLoadedEvent;

export type TrackingBatch = {
  batchId: string;
  sentAt: string;
  events: TrackingEvent[];
};

export function isTrackingEventType(value: string): value is TrackingEventType {
  return trackingEventTypes.includes(value as TrackingEventType);
}

export type PreviewPlatform = (typeof previewPlatforms)[number];

export type PreviewResource = (typeof previewResources)[number];

export type PreviewClassification = {
  isPreviewBot: boolean;
  platform: PreviewPlatform;
  userAgentFamily: string;
  resource: PreviewResource;
};

export type PublicCacheKeyInput = {
  workspaceSlug: string;
  siteSlug: string;
  publishedVersionId: string;
  variantSlug?: string | null;
  variantRevision?: number | null;
};

const previewBotPatterns: Array<{
  platform: PreviewPlatform;
  family: string;
  pattern: RegExp;
}> = [
  { platform: "slack", family: "slackbot", pattern: /\bslackbot\b/i },
  { platform: "microsoft_teams", family: "microsoft-teams", pattern: /\b(microsoft teams|teamsbot|skypeuripreview)\b/i },
  { platform: "linkedin", family: "linkedinbot", pattern: /\blinkedinbot\b/i },
  { platform: "x", family: "twitterbot", pattern: /\btwitterbot\b/i },
  { platform: "facebook", family: "facebookexternalhit", pattern: /\bfacebookexternalhit\b/i },
  { platform: "discord", family: "discordbot", pattern: /\bdiscordbot\b/i },
  { platform: "search", family: "googlebot", pattern: /\bgooglebot\b/i },
  { platform: "search", family: "bingbot", pattern: /\bbingbot\b/i },
  { platform: "generic_bot", family: "generic-crawler", pattern: /\b(bot|crawler|spider|preview|unfurl)\b/i },
];

export function classifyPreviewRequest(input: {
  userAgent: string | null | undefined;
  resource: PreviewResource;
}): PreviewClassification {
  const userAgent = input.userAgent?.trim() ?? "";

  for (const candidate of previewBotPatterns) {
    if (candidate.pattern.test(userAgent)) {
      return {
        isPreviewBot: true,
        platform: candidate.platform,
        userAgentFamily: candidate.family,
        resource: input.resource,
      };
    }
  }

  return {
    isPreviewBot: false,
    platform: "unknown",
    userAgentFamily: "unknown",
    resource: input.resource,
  };
}

export function buildPublicCacheKey(input: PublicCacheKeyInput): string {
  const baseKey = [
    "public-site",
    normalizeSlugPart(input.workspaceSlug),
    normalizeSlugPart(input.siteSlug),
    input.publishedVersionId,
  ];

  if (input.variantSlug) {
    baseKey.push(normalizeSlugPart(input.variantSlug), String(input.variantRevision ?? 0));
  }

  return baseKey.join(":");
}

export function sanitizeTrackedUrl(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  try {
    const url = new URL(value);

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }

    url.username = "";
    url.password = "";
    url.hash = "";
    url.search = "";

    const sanitized = url.toString();
    return sanitized.length > TRACKING_MAX_URL_LENGTH ? null : sanitized;
  } catch {
    return null;
  }
}

export function extractReferrerHost(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  try {
    const url = new URL(value);
    return url.hostname.toLowerCase();
  } catch {
    return null;
  }
}

export function truncateTrackingLabel(value: string | null | undefined): string {
  const label = value?.trim() || "Clicked element";
  return label.length > TRACKING_MAX_CLICK_LABEL_LENGTH ? label.slice(0, TRACKING_MAX_CLICK_LABEL_LENGTH) : label;
}

function normalizeSlugPart(value: string): string {
  return value.trim().toLowerCase();
}
