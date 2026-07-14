import type { PublicSiteResponse } from "@handout/contracts"

import { normalizePublishedSitePayload } from "./public-payload-adapter"
import type { PublishedSitePayload } from "./types"

export type PublicSiteLookup = {
  workspaceSlug: string
  siteSlug: string
  variantSlug: string | null
}

export type PublicSiteLookupResult =
  | {
    status: "available"
    payload: PublishedSitePayload
  }
  | {
    status: "unavailable"
  }

export async function getPublicSitePayload(
  input: PublicSiteLookup,
  signal?: AbortSignal,
): Promise<PublicSiteLookupResult> {
  const response = await fetch(getPublicSiteApiPath(input), {
    credentials: "omit",
    headers: {
      accept: "application/json",
    },
    signal,
  })

  if (response.status === 404) {
    return { status: "unavailable" }
  }

  if (!response.ok) {
    return { status: "unavailable" }
  }

  const parsed = parsePublicSiteResponse(await response.json())
  const payload = normalizePublishedSitePayload(parsed?.payload)

  return payload ? { status: "available", payload } : { status: "unavailable" }
}

export function getPublicSiteApiPath(input: PublicSiteLookup) {
  const segments = [
    "api",
    "public",
    "sites",
    input.workspaceSlug,
    input.siteSlug,
    input.variantSlug,
  ].filter((segment): segment is string => Boolean(segment))

  return `/${segments.map(encodeURIComponent).join("/")}`
}

function parsePublicSiteResponse(value: unknown): PublicSiteResponse | null {
  const object = asRecord(value)

  if (!object || typeof object.requestId !== "string" || !asRecord(object.payload)) {
    return null
  }

  return {
    payload: object.payload as PublicSiteResponse["payload"],
    requestId: object.requestId,
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null
}
