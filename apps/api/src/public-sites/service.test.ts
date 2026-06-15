import { describe, expect, it } from "vitest";
import { createPublicSiteService } from "./service";
import type { PublicSiteLookupInput, PublicSiteRepository } from "./repository";
import { createHmacTrackingContextTokenService } from "../tracking/context-token";

function createRecordingRepository(record: { payload: unknown } | null) {
  const calls: PublicSiteLookupInput[] = [];
  const repository: PublicSiteRepository = {
    async findPublishedSite(input) {
      calls.push(input);
      return record;
    },
  };

  return { calls, repository };
}

describe("public site service", () => {
  it("normalizes route slugs before looking up a published site", async () => {
    const { calls, repository } = createRecordingRepository({
      payload: {
        schemaVersion: 1,
        site: {
          slug: "rollout-brief",
        },
      },
    });
    const service = createPublicSiteService(repository);

    await expect(
      service.resolve({
        workspaceSlug: " Acme ",
        siteSlug: "Rollout Brief",
        variantSlug: "Mira Singh",
      }),
    ).resolves.toMatchObject({
      status: "available",
      cacheControl: "public, max-age=60, stale-while-revalidate=300",
    });

    expect(calls).toEqual([
      {
        workspaceSlug: "acme",
        siteSlug: "rollout-brief",
        variantSlug: "mira-singh",
      },
    ]);
  });

  it("fails invalid public paths before repository lookup", async () => {
    const { calls, repository } = createRecordingRepository({
      payload: { schemaVersion: 1 },
    });
    const service = createPublicSiteService(repository);

    await expect(
      service.resolve({
        workspaceSlug: "api",
        siteSlug: "rollout-brief",
      }),
    ).resolves.toEqual({
      status: "invalid_slug",
      message: "Invalid public site path.",
      cacheControl: "public, max-age=15, stale-while-revalidate=15",
    });

    expect(calls).toEqual([]);
  });

  it("fails closed when the repository returns no public payload", async () => {
    const { repository } = createRecordingRepository({
      payload: null,
    });
    const service = createPublicSiteService(repository);

    await expect(
      service.resolve({
        workspaceSlug: "acme",
        siteSlug: "rollout-brief",
      }),
    ).resolves.toEqual({
      status: "unavailable",
      cacheControl: "public, max-age=15, stale-while-revalidate=15",
    });
  });

  it("signs public tracking context before returning a published payload", async () => {
    const trackingContextTokens = createHmacTrackingContextTokenService(
      "tracking-secret-at-least-32-characters",
      { nowSeconds: () => 100 },
    );
    const { repository } = createRecordingRepository({
      payload: {
        schemaVersion: 1,
        tracking: {
          workspaceId: "workspace_test_123",
          siteId: "site_test_123",
          publishedVersionId: "version_test_123",
          variantId: null,
          variantRevision: null,
          mode: "engagement",
        },
      },
    });
    const service = createPublicSiteService(repository, { trackingContextTokens });
    const result = await service.resolve({
      workspaceSlug: "acme",
      siteSlug: "rollout-brief",
    });

    expect(result).toMatchObject({
      status: "available",
      payload: {
        tracking: {
          token: expect.any(String),
        },
      },
    });

    if (result.status !== "available") {
      throw new Error("Expected public site to resolve.");
    }

    expect(trackingContextTokens.verify({
      workspaceId: "workspace_test_123",
      siteId: "site_test_123",
      publishedVersionId: "version_test_123",
      variantId: null,
      variantRevision: null,
      mode: "engagement",
      token: String(result.payload.tracking && (result.payload.tracking as { token?: unknown }).token),
    })).toBe(true);
  });
});
