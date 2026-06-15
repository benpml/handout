import { createHmac, timingSafeEqual } from "node:crypto";
import type { TrackingContext, UnsignedTrackingContext } from "@lightsite/tracking-schema";

export interface TrackingContextTokenService {
  sign(context: UnsignedTrackingContext): string;
  verify(context: TrackingContext): boolean;
}

export type HmacTrackingContextTokenOptions = {
  keyId?: string;
  ttlSeconds?: number;
  nowSeconds?: () => number;
};

type TrackingTokenPayload = {
  v: 1;
  kid: string;
  exp: number;
  ctx: UnsignedTrackingContext;
};

const DEFAULT_KEY_ID = "default";
const DEFAULT_TTL_SECONDS = 60 * 60;

export function createHmacTrackingContextTokenService(
  secret: string,
  options: HmacTrackingContextTokenOptions = {},
): TrackingContextTokenService {
  const keyId = options.keyId ?? DEFAULT_KEY_ID;
  const ttlSeconds = options.ttlSeconds ?? DEFAULT_TTL_SECONDS;
  const nowSeconds = options.nowSeconds ?? (() => Math.floor(Date.now() / 1000));

  return {
    sign(context) {
      const payload: TrackingTokenPayload = {
        v: 1,
        kid: keyId,
        exp: nowSeconds() + ttlSeconds,
        ctx: context,
      };
      const encodedPayload = encodeBase64Url(JSON.stringify(payload));
      const signature = signSegment(encodedPayload, secret);

      return `${encodedPayload}.${signature}`;
    },

    verify(context) {
      if (!context.token) {
        return false;
      }

      const [encodedPayload, signature, extra] = context.token.split(".");

      if (!encodedPayload || !signature || extra !== undefined) {
        return false;
      }

      if (!constantTimeEqual(signature, signSegment(encodedPayload, secret))) {
        return false;
      }

      const payload = decodePayload(encodedPayload);

      if (!payload || payload.v !== 1 || payload.kid !== keyId || payload.exp <= nowSeconds()) {
        return false;
      }

      return trackingContextsMatch(payload.ctx, {
        workspaceId: context.workspaceId,
        siteId: context.siteId,
        publishedVersionId: context.publishedVersionId,
        variantId: context.variantId,
        variantRevision: context.variantRevision,
        mode: context.mode,
      });
    },
  };
}

function signSegment(value: string, secret: string) {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

function encodeBase64Url(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function decodePayload(value: string): TrackingTokenPayload | null {
  try {
    const decoded = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as unknown;

    return isTrackingTokenPayload(decoded) ? decoded : null;
  } catch {
    return null;
  }
}

function isTrackingTokenPayload(value: unknown): value is TrackingTokenPayload {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const input = value as Partial<TrackingTokenPayload>;

  return input.v === 1
    && typeof input.kid === "string"
    && Number.isInteger(input.exp)
    && isUnsignedTrackingContext(input.ctx);
}

function isUnsignedTrackingContext(value: unknown): value is UnsignedTrackingContext {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const input = value as Partial<UnsignedTrackingContext>;

  return typeof input.workspaceId === "string"
    && typeof input.siteId === "string"
    && typeof input.publishedVersionId === "string"
    && (typeof input.variantId === "string" || input.variantId === null)
    && (Number.isInteger(input.variantRevision) || input.variantRevision === null)
    && (input.mode === "off" || input.mode === "essential_only" || input.mode === "engagement");
}

function trackingContextsMatch(
  expected: UnsignedTrackingContext,
  actual: UnsignedTrackingContext,
) {
  return expected.workspaceId === actual.workspaceId
    && expected.siteId === actual.siteId
    && expected.publishedVersionId === actual.publishedVersionId
    && expected.variantId === actual.variantId
    && expected.variantRevision === actual.variantRevision
    && expected.mode === actual.mode;
}

function constantTimeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return leftBuffer.length === rightBuffer.length
    && timingSafeEqual(leftBuffer, rightBuffer);
}
