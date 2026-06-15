import type {
  CreateSiteRequest,
  CreateSiteResponse,
  ListSitesResponse,
  SiteListItem,
  SiteStatus,
} from "@lightsite/contracts"

import { apiRequest } from "@/lib/api/client"

export function listSites(signal?: AbortSignal) {
  return apiRequest("/api/sites", {
    responseSchema: listSitesResponseSchema,
    signal,
  })
}

export function createSite(input: CreateSiteRequest) {
  return apiRequest("/api/sites", {
    method: "POST",
    body: normalizeCreateSiteRequest(input),
    responseSchema: createSiteResponseSchema,
  })
}

const siteStatuses = new Set<SiteStatus>(["draft", "published", "archived"])

const listSitesResponseSchema = {
  parse(value: unknown): ListSitesResponse {
    const object = asRecord(value)
    const sites = Array.isArray(object.sites) ? object.sites.map(parseSiteListItem) : null

    if (!sites || typeof object.requestId !== "string") {
      throw new Error("Invalid sites response.")
    }

    return {
      sites,
      nextCursor: typeof object.nextCursor === "string" ? object.nextCursor : null,
      requestId: object.requestId,
    }
  },
}

const createSiteResponseSchema = {
  parse(value: unknown): CreateSiteResponse {
    const object = asRecord(value)
    const site = parseSiteListItem(object.site)

    if (typeof object.requestId !== "string") {
      throw new Error("Invalid create site response.")
    }

    return {
      site: {
        id: site.id,
        name: site.name,
        slug: site.slug,
        status: site.status,
      },
      requestId: object.requestId,
    }
  },
}

function normalizeCreateSiteRequest(input: CreateSiteRequest): CreateSiteRequest {
  const rawName = typeof input.name === "string" ? input.name : ""
  const name = rawName.trim() || "Untitled Lightsite"

  return {
    name,
    ...(input.slug ? { slug: input.slug.trim() } : {}),
  }
}

function parseSiteListItem(value: unknown): SiteListItem {
  const object = asRecord(value)

  if (
    typeof object.id !== "string" ||
    typeof object.name !== "string" ||
    typeof object.slug !== "string" ||
    typeof object.status !== "string" ||
    !siteStatuses.has(object.status as SiteStatus)
  ) {
    throw new Error("Invalid site.")
  }

  return {
    id: object.id,
    name: object.name,
    slug: object.slug,
    status: object.status as SiteStatus,
    updatedAt: typeof object.updatedAt === "string" ? object.updatedAt : null,
    createdAt: typeof object.createdAt === "string" ? object.createdAt : null,
    publishedAt: typeof object.publishedAt === "string" ? object.publishedAt : null,
  }
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Expected object.")
  }

  return value as Record<string, unknown>
}
