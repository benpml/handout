import { describe, expect, it } from "vitest";
import {
  TRACKING_INGEST_ENDPOINT,
  TRACKING_SCRIPT_ENDPOINT,
} from "@lightsite/tracking-schema";
import {
  renderPublicSiteHtmlDocument,
  renderUnavailablePublicSiteHtmlDocument,
} from "./html";

describe("public site HTML rendering", () => {
  it("renders escaped public metadata and critical content", () => {
    const html = renderPublicSiteHtmlDocument({
      origin: "https://pages.lightsite.test",
      payload: {
        workspace: {
          id: "workspace_test_123",
          slug: "acme",
          name: "Acme <Sales>",
          websiteDomain: "acme.com",
        },
        site: {
          id: "site_test_123",
          slug: "rollout-brief",
          name: "Rollout brief",
          publishedVersionId: "version_test_123",
          publishedAt: "2026-06-14T18:00:00.000Z",
        },
        metadata: {
          title: "Rollout brief for {{company_name}}",
          description: "Plan for {{company_name}}",
          robots: "index,follow",
          ogImage: {
            id: "asset_og",
            src: "/assets/og.webp",
            alt: "OG",
            width: 1200,
            height: 630,
          },
        },
        header: {
          avatarAssets: [],
          eyebrow: "July",
          title: "A focused rollout plan for {{company_name}}",
          subtitle: "A short page for the buying team.",
        },
        variables: [
          {
            id: "company_name",
            defaultValue: "your team",
          },
          {
            id: "primary_url",
            defaultValue: "https://cal.com/lightsite/review?token=secret",
          },
        ],
        selectedVariant: {
          id: "variant_test_123",
          slug: "mira",
          name: "Mira",
          recipientName: "Mira",
          recipientCompany: "Acme",
          revisionNumber: 3,
          variableValues: {
            company_name: "Acme & Co",
          },
        },
        blocks: [
          {
            id: "text_1",
            type: "text",
            text: "Hello {{company_name}} <script>alert(1)</script>",
          },
          {
            id: "cta_1",
            type: "cta",
            label: "Book review",
            href: "{{primary_url}}",
            style: "primary",
          },
        ],
        tracking: {
          workspaceId: "workspace_test_123",
          siteId: "site_test_123",
          publishedVersionId: "version_test_123",
          variantId: "variant_test_123",
          variantRevision: 3,
          mode: "engagement",
          token: "signed-tracking-token",
        },
      },
    });

    expect(html).toContain("<title>Rollout brief for Acme &amp; Co</title>");
    expect(html).toContain('content="noindex,nofollow"');
    expect(html).toContain('content="https://pages.lightsite.test/acme/rollout-brief/mira"');
    expect(html).toContain('content="https://pages.lightsite.test/assets/og.webp"');
    expect(html).toContain("Acme &amp; Co &lt;script&gt;alert(1)&lt;/script&gt;");
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).toContain(`src="${TRACKING_SCRIPT_ENDPOINT}"`);
    expect(html).toContain(`data-lightsite-ingest="${TRACKING_INGEST_ENDPOINT}"`);
    expect(html).toContain("&quot;signed-tracking-token&quot;");
    expect(html).not.toContain("<script>alert");
  });

  it("renders a generic unavailable page with noindex metadata", () => {
    const html = renderUnavailablePublicSiteHtmlDocument(
      "https://pages.lightsite.test",
      "/acme/missing",
    );

    expect(html).toContain("<title>Page unavailable | Lightsite</title>");
    expect(html).toContain('content="noindex,nofollow"');
    expect(html).toContain('content="https://pages.lightsite.test/acme/missing"');
    expect(html).toContain("This page is unavailable");
    expect(html).not.toContain("data-lightsite-tracking");
  });
});
