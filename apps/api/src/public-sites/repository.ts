import { and, eq, isNotNull } from "drizzle-orm";
import {
  db as defaultDb,
  siteVersions,
  siteVariants,
  sites,
  workspaces,
  type Database,
  type SiteContent,
  type SiteContentBlock,
} from "@lightsite/db";
import type { TrackingMode } from "@lightsite/tracking-schema";

export type PublicSiteLookupInput = {
  workspaceSlug: string;
  siteSlug: string;
  variantSlug: string | null;
};

export type PublicSiteRecord = {
  payload: unknown;
};

export interface PublicSiteRepository {
  findPublishedSite(input: PublicSiteLookupInput): Promise<PublicSiteRecord | null>;
}

export function createDbPublicSiteRepository(database: Database = defaultDb): PublicSiteRepository {
  return {
    async findPublishedSite(input) {
      const [record] = await database
        .select({
          workspace: {
            id: workspaces.id,
            slug: workspaces.slug,
            name: workspaces.name,
            websiteDomain: workspaces.websiteDomain,
          },
          site: {
            id: sites.id,
            slug: sites.slug,
            name: sites.name,
            publishedVersionId: sites.publishedVersionId,
            publishedAt: sites.publishedAt,
          },
          version: {
            id: siteVersions.id,
            versionNumber: siteVersions.versionNumber,
            content: siteVersions.content,
            createdAt: siteVersions.createdAt,
          },
        })
        .from(sites)
        .innerJoin(workspaces, eq(sites.workspaceId, workspaces.id))
        .innerJoin(siteVersions, eq(sites.publishedVersionId, siteVersions.id))
        .where(and(
          eq(workspaces.slug, input.workspaceSlug),
          eq(workspaces.status, "active"),
          eq(sites.slug, input.siteSlug),
          eq(sites.status, "published"),
          isNotNull(sites.publishedVersionId),
          eq(siteVersions.kind, "publish"),
        ))
        .limit(1);

      if (!record || !record.site.publishedAt) {
        return null;
      }

      if (input.variantSlug) {
        const [variant] = await database
          .select({
            id: siteVariants.id,
            slug: siteVariants.slug,
            name: siteVariants.name,
            recipientName: siteVariants.recipientName,
            recipientCompany: siteVariants.recipientCompany,
            variableValues: siteVariants.variableValues,
            revisionNumber: siteVariants.revisionNumber,
          })
          .from(siteVariants)
          .where(and(
            eq(siteVariants.workspaceId, record.workspace.id),
            eq(siteVariants.siteId, record.site.id),
            eq(siteVariants.slug, input.variantSlug),
            eq(siteVariants.status, "active"),
          ))
          .limit(1);

        if (!variant) {
          return null;
        }

        return {
          payload: {
            ...buildPublicSitePayload(record, {
              id: variant.id,
              slug: variant.slug,
              name: variant.name,
              recipientName: variant.recipientName,
              recipientCompany: variant.recipientCompany,
              revisionNumber: variant.revisionNumber,
              variableValues: variant.variableValues,
            }),
          },
        };
      }

      return {
        payload: buildPublicSitePayload(record, null),
      };
    },
  };
}

type PublishedSiteQueryRecord = {
  workspace: {
    id: string;
    slug: string;
    name: string;
    websiteDomain: string | null;
  };
  site: {
    id: string;
    slug: string;
    name: string;
    publishedVersionId: string | null;
    publishedAt: Date | null;
  };
  version: {
    id: string;
    versionNumber: number;
    content: SiteContent;
    createdAt: Date;
  };
};

type PublishedVariantRecord = {
  id: string;
  slug: string;
  name: string;
  recipientName: string | null;
  recipientCompany: string | null;
  revisionNumber: number;
  variableValues: Record<string, unknown>;
};

function buildPublicSitePayload(
  record: PublishedSiteQueryRecord,
  variant: PublishedVariantRecord | null,
) {
  if (!record.site.publishedAt || !record.site.publishedVersionId) {
    throw new Error("Published site payload requires a published timestamp.");
  }
  const content = record.version.content;
  const trackingMode: TrackingMode = "engagement";

  return {
    schemaVersion: 1,
    workspace: {
      id: record.workspace.id,
      slug: record.workspace.slug,
      name: record.workspace.name,
      websiteDomain: record.workspace.websiteDomain ?? "",
    },
    site: {
      id: record.site.id,
      slug: record.site.slug,
      name: record.site.name,
      publishedVersionId: record.site.publishedVersionId,
      publishedAt: record.site.publishedAt.toISOString(),
    },
    metadata: {
      title: content.header.title || record.site.name,
      description: content.header.subtitle ?? "",
      ogImage: null,
      robots: "noindex,nofollow",
    },
    header: {
      avatarAssets: [],
      eyebrow: null,
      title: content.header.title || record.site.name,
      subtitle: content.header.subtitle ?? null,
    },
    variables: content.variables.map((variable) => ({
      id: variable.key,
      name: variable.label,
      type: variable.type,
      defaultValue: toPublicString(variable.defaultValue),
    })),
    selectedVariant: variant
      ? {
          id: variant.id,
          slug: variant.slug,
          name: variant.name,
          recipientName: variant.recipientName,
          recipientCompany: variant.recipientCompany,
          revisionNumber: variant.revisionNumber,
          variableValues: toStringRecord(variant.variableValues),
        }
      : null,
    blocks: content.blocks.map(toPublicBlock).filter(isPresent),
    tracking: {
      workspaceId: record.workspace.id,
      siteId: record.site.id,
      publishedVersionId: record.site.publishedVersionId,
      variantId: variant?.id ?? null,
      variantRevision: variant?.revisionNumber ?? null,
      mode: trackingMode,
      token: null,
    },
  };
}

function toPublicBlock(block: SiteContentBlock): Record<string, unknown> | null {
  const fields = block.fields;

  switch (block.type) {
    case "heading": {
      const text = getString(fields, "text") ?? getString(fields, "title");
      return text
        ? {
            id: block.id,
            type: "heading",
            level: fields.level === 3 ? 3 : 2,
            text,
          }
        : null;
    }

    case "text": {
      const text = getString(fields, "text") ?? getString(fields, "body");
      return text ? { id: block.id, type: "text", text } : null;
    }

    case "divider":
      return {
        id: block.id,
        type: "divider",
        width: fields.width === "full" ? "full" : "content",
        spacing: fields.spacing === "sm" || fields.spacing === "lg" ? fields.spacing : "md",
      };

    case "cta": {
      const label = getString(fields, "label");
      const href = getString(fields, "href") ?? getString(fields, "url");
      return label && href
        ? {
            id: block.id,
            type: "cta",
            label,
            href,
            style: fields.style === "secondary" ? "secondary" : "primary",
          }
        : null;
    }

    case "quote": {
      const quote = getString(fields, "quote");
      return quote
        ? {
            id: block.id,
            type: "quote",
            quote,
            personName: getString(fields, "personName") ?? "",
            personTitle: getString(fields, "personTitle"),
            company: getString(fields, "company"),
          }
        : null;
    }

    default:
      return null;
  }
}

function getString(record: Record<string, unknown>, key: string) {
  const value = record[key];
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function toPublicString(value: unknown) {
  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return "";
}

function toStringRecord(value: Record<string, unknown>) {
  const output: Record<string, string> = {};

  for (const [key, entryValue] of Object.entries(value)) {
    const publicValue = toPublicString(entryValue);

    if (publicValue.length > 0) {
      output[key] = publicValue;
    }
  }

  return output;
}

function isPresent<TValue>(value: TValue | null): value is TValue {
  return value !== null;
}

export function createUnavailablePublicSiteRepository(): PublicSiteRepository {
  return {
    async findPublishedSite() {
      return null;
    },
  };
}
