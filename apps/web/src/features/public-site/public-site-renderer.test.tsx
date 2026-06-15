import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { getPublicCacheMetadata } from "./public-cache";
import { getDemoPublishedSite } from "./public-site-fixture";
import { PublicSiteRenderer } from "./public-site-renderer";
import { getResolvedMetadata } from "./public-metadata";
import { normalizePublishedSitePayload } from "./public-payload-adapter";
import type { PublishedSitePayload } from "./types";

describe("public site rendering", () => {
  it("renders the default published snapshot with fallback variable values", () => {
    const payload = requireDemoPayload(null);
    const html = renderPublicSite(payload);

    expect(html).toContain("A focused rollout plan for your team");
    expect(html).toContain("Book implementation review");
    expect(html).toContain('data-track-click-id="cta-primary"');
    expect(html).toContain('rel="noopener noreferrer"');
  });

  it("renders variant overrides and includes variant revision in cache metadata", () => {
    const payload = requireDemoPayload("mira");
    const html = renderPublicSite(payload);
    const metadata = getResolvedMetadata(payload, "https://pages.lightsite.test");
    const cache = getPublicCacheMetadata(payload);

    expect(html).toContain("A focused rollout plan for Acme");
    expect(metadata).toMatchObject({
      title: "Rollout brief for Acme",
      canonicalUrl: "https://pages.lightsite.test/lightsite/rollout-brief/mira",
      robots: "noindex,nofollow",
    });
    expect(cache.key).toBe("public-site:lightsite:rollout-brief:version-rollout-brief-4:mira:3");
    expect(cache.tags).toContain("variant:variant-acme-mira");
  });

  it("fails closed for unknown variant slugs", () => {
    expect(getDemoPublishedSite("unknown")).toBeNull();
  });

  it("omits invalid public media and unsafe URLs without crashing", () => {
    const payload = clonePayload(requireDemoPayload("mira"));
    payload.header.avatarAssets = [
      {
        id: "bad-avatar",
        kind: "avatar",
        src: "javascript:alert(1)",
        alt: "Bad",
        width: 96,
        height: 96,
      },
    ];
    payload.blocks.push({
      id: "bad-image",
      type: "image",
      asset: {
        id: "bad-image-asset",
        kind: "image",
        src: "//evil.example/image.png",
        alt: "Bad image",
        width: 1200,
        height: 675,
      },
      caption: null,
    });
    payload.blocks.push({
      id: "bad-cta",
      type: "cta",
      label: "Unsafe CTA",
      href: "javascript:alert(1)",
      style: "primary",
    });

    const html = renderPublicSite(payload);

    expect(html).not.toContain("javascript:");
    expect(html).not.toContain("//evil.example/image.png");
    expect(html).not.toContain("Unsafe CTA");
  });
});

describe("public payload adapter", () => {
  it("normalizes older payloads with missing optional fields", () => {
    const normalized = normalizePublishedSitePayload({
      workspace: {
        id: "workspace_1",
        slug: "ACME",
        name: "Acme",
      },
      site: {
        id: "site_1",
        slug: "Rollout-Brief",
        name: "Rollout brief",
        publishedVersionId: "version_1",
      },
      header: {
        title: "Hello {{company_name}}",
      },
      variables: [
        {
          id: "company_name",
          name: "Company name",
          defaultValue: "team",
        },
      ],
      blocks: [
        {
          id: "heading_1",
          type: "heading",
          text: "Overview",
        },
        {
          id: "legacy_unknown",
          type: "legacy_embed",
          html: "<script>alert(1)</script>",
        },
      ],
    });

    expect(normalized).toMatchObject({
      schemaVersion: 1,
      workspace: {
        slug: "acme",
        websiteDomain: "",
      },
      site: {
        slug: "rollout-brief",
        publishedAt: "1970-01-01T00:00:00.000Z",
      },
      metadata: {
        title: "Rollout brief",
        robots: "noindex,nofollow",
      },
      tracking: {
        mode: "off",
        variantId: null,
        variantRevision: null,
      },
    });
    expect(normalized?.blocks).toHaveLength(1);
    expect(renderPublicSite(normalized as PublishedSitePayload)).toContain("Hello team");
  });

  it("rejects payloads without required public identity", () => {
    expect(normalizePublishedSitePayload({ site: { id: "site_1" } })).toBeNull();
  });
});

function requireDemoPayload(variantSlug: string | null) {
  const payload = getDemoPublishedSite(variantSlug);

  if (!payload) {
    throw new Error(`Missing demo payload for ${variantSlug ?? "default"}.`);
  }

  return payload;
}

function renderPublicSite(payload: PublishedSitePayload) {
  return renderToStaticMarkup(<PublicSiteRenderer payload={payload} />);
}

function clonePayload(payload: PublishedSitePayload): PublishedSitePayload {
  return structuredClone(payload);
}
