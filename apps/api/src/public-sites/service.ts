import { validateSiteSlug, validateWorkspaceSlug } from "@lightsite/domain";
import type { TrackingMode, UnsignedTrackingContext } from "@lightsite/tracking-schema";
import type { PublicSiteRepository } from "./repository";
import type { TrackingContextTokenService } from "../tracking/context-token";

export const PUBLIC_SITE_AVAILABLE_CACHE_CONTROL = "public, max-age=60, stale-while-revalidate=300";
export const PUBLIC_SITE_UNAVAILABLE_CACHE_CONTROL = "public, max-age=15, stale-while-revalidate=15";

export type PublicSiteRouteInput = {
  workspaceSlug: string;
  siteSlug: string;
  variantSlug?: string;
};

export type PublicSiteResolution =
  | {
    status: "available";
    payload: Record<string, unknown>;
    cacheControl: string;
  }
  | {
    status: "unavailable";
    cacheControl: string;
  }
  | {
    status: "invalid_slug";
    message: string;
    cacheControl: string;
  };

export interface PublicSiteService {
  resolve(input: PublicSiteRouteInput): Promise<PublicSiteResolution>;
}

export type PublicSiteServiceOptions = {
  trackingContextTokens?: TrackingContextTokenService;
};

export function createPublicSiteService(
  repository: PublicSiteRepository,
  options: PublicSiteServiceOptions = {},
): PublicSiteService {
  return {
    async resolve(input) {
      const workspaceSlug = validateWorkspaceSlug(input.workspaceSlug);
      const siteSlug = validateSiteSlug(input.siteSlug);
      const variantSlug = input.variantSlug
        ? validateSiteSlug(input.variantSlug)
        : { ok: true as const, slug: null };

      if (!workspaceSlug.ok || !siteSlug.ok || !variantSlug.ok) {
        return {
          status: "invalid_slug",
          message: "Invalid public site path.",
          cacheControl: PUBLIC_SITE_UNAVAILABLE_CACHE_CONTROL,
        };
      }

      const record = await repository.findPublishedSite({
        workspaceSlug: workspaceSlug.slug,
        siteSlug: siteSlug.slug,
        variantSlug: variantSlug.slug,
      });

      if (!record || !isPublicPayload(record.payload)) {
        return {
          status: "unavailable",
          cacheControl: PUBLIC_SITE_UNAVAILABLE_CACHE_CONTROL,
        };
      }

      return {
        status: "available",
        payload: addSignedTrackingContext(record.payload, options.trackingContextTokens),
        cacheControl: PUBLIC_SITE_AVAILABLE_CACHE_CONTROL,
      };
    },
  };
}

function isPublicPayload(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function addSignedTrackingContext(
  payload: Record<string, unknown>,
  trackingContextTokens: TrackingContextTokenService | undefined,
) {
  const context = parseUnsignedTrackingContext(payload.tracking);
  const tracking = asRecord(payload.tracking);

  if (!context || !tracking || !trackingContextTokens || context.mode === "off") {
    return payload;
  }

  return {
    ...payload,
    tracking: {
      ...tracking,
      token: trackingContextTokens.sign(context),
    },
  };
}

function parseUnsignedTrackingContext(value: unknown): UnsignedTrackingContext | null {
  const input = asRecord(value);

  if (!input) {
    return null;
  }

  if (
    !isString(input.workspaceId) ||
    !isString(input.siteId) ||
    !isString(input.publishedVersionId) ||
    !isTrackingMode(input.mode)
  ) {
    return null;
  }

  return {
    workspaceId: input.workspaceId,
    siteId: input.siteId,
    publishedVersionId: input.publishedVersionId,
    variantId: nullableString(input.variantId),
    variantRevision: isNonNegativeInteger(input.variantRevision) ? input.variantRevision : null,
    mode: input.mode,
  };
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function isString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function nullableString(value: unknown): string | null {
  return isString(value) ? value : null;
}

function isNonNegativeInteger(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) >= 0;
}

function isTrackingMode(value: unknown): value is TrackingMode {
  return value === "off" || value === "essential_only" || value === "engagement";
}
