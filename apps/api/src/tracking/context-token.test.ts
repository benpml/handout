import { describe, expect, it } from "vitest";
import { createHmacTrackingContextTokenService } from "./context-token";

const unsignedContext = {
  workspaceId: "workspace_test_123",
  siteId: "site_test_123",
  publishedVersionId: "version_test_123",
  variantId: "variant_test_123",
  variantRevision: 3,
  mode: "engagement" as const,
};

describe("createHmacTrackingContextTokenService", () => {
  it("verifies a context that matches its signed token", () => {
    const service = createHmacTrackingContextTokenService("tracking-secret-at-least-32-characters", {
      nowSeconds: () => 100,
      ttlSeconds: 60,
    });
    const token = service.sign(unsignedContext);

    expect(service.verify({ ...unsignedContext, token })).toBe(true);
  });

  it("rejects tampered context fields", () => {
    const service = createHmacTrackingContextTokenService("tracking-secret-at-least-32-characters", {
      nowSeconds: () => 100,
      ttlSeconds: 60,
    });
    const token = service.sign(unsignedContext);

    expect(service.verify({
      ...unsignedContext,
      siteId: "site_forged_123",
      token,
    })).toBe(false);
  });

  it("rejects expired tokens", () => {
    let nowSeconds = 100;
    const service = createHmacTrackingContextTokenService("tracking-secret-at-least-32-characters", {
      nowSeconds: () => nowSeconds,
      ttlSeconds: 60,
    });
    const token = service.sign(unsignedContext);

    nowSeconds = 161;

    expect(service.verify({ ...unsignedContext, token })).toBe(false);
  });

  it("rejects tokens at the exact expiration boundary", () => {
    let nowSeconds = 100;
    const service = createHmacTrackingContextTokenService("tracking-secret-at-least-32-characters", {
      nowSeconds: () => nowSeconds,
      ttlSeconds: 60,
    });
    const token = service.sign(unsignedContext);

    nowSeconds = 160;

    expect(service.verify({ ...unsignedContext, token })).toBe(false);
  });
});
