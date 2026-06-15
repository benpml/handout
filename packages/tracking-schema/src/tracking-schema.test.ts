import { describe, expect, it } from "vitest";
import {
  buildPublicCacheKey,
  classifyPreviewRequest,
  extractReferrerHost,
  sanitizeTrackedUrl,
  truncateTrackingLabel,
} from "./index";

describe("preview bot classification", () => {
  it("classifies Slack preview requests separately from human visits", () => {
    expect(
      classifyPreviewRequest({
        userAgent: "Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)",
        resource: "html",
      }),
    ).toEqual({
      isPreviewBot: true,
      platform: "slack",
      resource: "html",
      userAgentFamily: "slackbot",
    });
  });

  it("classifies unknown browsers as non-preview traffic", () => {
    expect(
      classifyPreviewRequest({
        userAgent:
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/126.0 Safari/537.36",
        resource: "html",
      }),
    ).toEqual({
      isPreviewBot: false,
      platform: "unknown",
      resource: "html",
      userAgentFamily: "unknown",
    });
  });
});

describe("public cache keys", () => {
  it("includes the published version and variant revision when present", () => {
    expect(
      buildPublicCacheKey({
        workspaceSlug: " Acme ",
        siteSlug: "Rollout-Brief",
        publishedVersionId: "version_123",
        variantSlug: "Mira",
        variantRevision: 4,
      }),
    ).toBe("public-site:acme:rollout-brief:version_123:mira:4");
  });

  it("does not include a visitor-specific value", () => {
    expect(
      buildPublicCacheKey({
        workspaceSlug: "acme",
        siteSlug: "rollout-brief",
        publishedVersionId: "version_123",
      }),
    ).toBe("public-site:acme:rollout-brief:version_123");
  });
});

describe("tracking payload sanitization", () => {
  it("removes query strings, hashes, and credentials from tracked URLs", () => {
    expect(sanitizeTrackedUrl("https://user:pass@example.com/demo?token=secret#section")).toBe(
      "https://example.com/demo",
    );
  });

  it("rejects dangerous protocols", () => {
    expect(sanitizeTrackedUrl("javascript:alert(1)")).toBeNull();
  });

  it("rejects overlong tracked URLs instead of truncating them", () => {
    const overlongUrl = `https://example.com/${"a".repeat(2_100)}`;

    expect(sanitizeTrackedUrl(overlongUrl)).toBeNull();
  });

  it("stores only the referrer host", () => {
    expect(extractReferrerHost("https://workspace.slack.com/archives/C123?secret=value")).toBe(
      "workspace.slack.com",
    );
  });

  it("returns a safe fallback label for empty click labels", () => {
    expect(truncateTrackingLabel("   ")).toBe("Clicked element");
  });
});
