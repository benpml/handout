import { buildPublicCacheKey } from "@handout/tracking-schema";

import type { PublishedSitePayload } from "./types";

export const PUBLIC_ROUTE_CACHE_POLICY = {
  htmlTtlSeconds: 60,
  staleWhileRevalidateSeconds: 300,
  unavailableTtlSeconds: 15,
} as const;

export type PublicCacheMetadata = {
  key: string;
  tags: string[];
  ttlSeconds: number;
  staleWhileRevalidateSeconds: number;
};

export function getPublicCacheMetadata(payload: PublishedSitePayload): PublicCacheMetadata {
  return {
    key: buildPublicCacheKey({
      workspaceSlug: payload.workspace.slug,
      siteSlug: payload.site.slug,
      publishedVersionId: payload.site.publishedVersionId,
      variantSlug: payload.selectedVariant?.slug ?? null,
      variantRevision: payload.selectedVariant?.revisionNumber ?? null,
    }),
    tags: [
      `workspace:${payload.workspace.id}`,
      `site:${payload.site.id}`,
      `published-version:${payload.site.publishedVersionId}`,
      ...(payload.selectedVariant ? [`variant:${payload.selectedVariant.id}`] : []),
    ],
    ttlSeconds: PUBLIC_ROUTE_CACHE_POLICY.htmlTtlSeconds,
    staleWhileRevalidateSeconds: PUBLIC_ROUTE_CACHE_POLICY.staleWhileRevalidateSeconds,
  };
}
