import type { TrackingContext, TrackingMode } from "@lightsite/tracking-schema";

export const CURRENT_PUBLIC_PAYLOAD_SCHEMA_VERSION = 1;

export type PublicAsset = {
  id: string;
  kind: "image" | "logo" | "avatar" | "og_image";
  src: string;
  alt: string;
  width: number;
  height: number;
};

export type PublicVariable = {
  id: string;
  name: string;
  type: "text" | "image" | "url";
  defaultValue: string;
};

export type PublicVariant = {
  id: string;
  slug: string;
  name: string;
  recipientName: string | null;
  recipientCompany: string | null;
  revisionNumber: number;
  variableValues: Record<string, string>;
};

export type PublicSiteMetadata = {
  title: string;
  description: string;
  ogImage: PublicAsset | null;
  robots: "noindex,nofollow" | "index,follow";
};

export type PublicSiteHeader = {
  avatarAssets: PublicAsset[];
  eyebrow: string | null;
  title: string;
  subtitle: string | null;
};

export type PublicHeadingBlock = {
  id: string;
  type: "heading";
  level: 2 | 3;
  text: string;
};

export type PublicTextBlock = {
  id: string;
  type: "text";
  text: string;
};

export type PublicDividerBlock = {
  id: string;
  type: "divider";
  width: "content" | "full";
  spacing: "sm" | "md" | "lg";
};

export type PublicImageBlock = {
  id: string;
  type: "image";
  asset: PublicAsset;
  caption: string | null;
};

export type PublicCtaBlock = {
  id: string;
  type: "cta";
  label: string;
  href: string;
  style: "primary" | "secondary";
};

export type PublicQuoteBlock = {
  id: string;
  type: "quote";
  quote: string;
  personName: string;
  personTitle: string | null;
  company: string | null;
};

export type PublicLogoStripBlock = {
  id: string;
  type: "logo_strip";
  logos: PublicAsset[];
};

export type PublicBlock =
  | PublicHeadingBlock
  | PublicTextBlock
  | PublicDividerBlock
  | PublicImageBlock
  | PublicCtaBlock
  | PublicQuoteBlock
  | PublicLogoStripBlock;

export type PublishedSitePayload = {
  schemaVersion: 1;
  workspace: {
    id: string;
    slug: string;
    name: string;
    websiteDomain: string;
  };
  site: {
    id: string;
    slug: string;
    name: string;
    publishedVersionId: string;
    publishedAt: string;
  };
  metadata: PublicSiteMetadata;
  header: PublicSiteHeader;
  variables: PublicVariable[];
  selectedVariant: PublicVariant | null;
  blocks: PublicBlock[];
  tracking: TrackingContext;
};

const assetKinds = new Set<PublicAsset["kind"]>(["image", "logo", "avatar", "og_image"]);
const variableTypes = new Set<PublicVariable["type"]>(["text", "image", "url"]);
const trackingModes = new Set<TrackingMode>(["off", "essential_only", "engagement"]);

export function normalizePublishedSitePayload(value: unknown): PublishedSitePayload | null {
  const input = asRecord(value);

  if (!input) {
    return null;
  }

  const workspace = parseWorkspace(input.workspace);
  const site = parseSite(input.site);

  if (!workspace || !site) {
    return null;
  }

  const variables = parseArray(input.variables).map(parseVariable).filter(isPresent);
  const selectedVariant = parseVariant(input.selectedVariant);
  const metadata = parseMetadata(input.metadata, site.name);
  const header = parseHeader(input.header, site.name);

  return {
    schemaVersion: CURRENT_PUBLIC_PAYLOAD_SCHEMA_VERSION,
    workspace,
    site,
    metadata,
    header,
    variables,
    selectedVariant,
    blocks: parseArray(input.blocks).map(parseBlock).filter(isPresent),
    tracking: parseTracking(input.tracking, workspace.id, site.id, site.publishedVersionId, selectedVariant),
  };
}

function parseWorkspace(value: unknown): PublishedSitePayload["workspace"] | null {
  const input = asRecord(value);

  if (!input || !isString(input.id) || !isString(input.slug) || !isString(input.name)) {
    return null;
  }

  return {
    id: input.id,
    slug: input.slug.toLowerCase(),
    name: input.name,
    websiteDomain: isString(input.websiteDomain) ? input.websiteDomain : "",
  };
}

function parseSite(value: unknown): PublishedSitePayload["site"] | null {
  const input = asRecord(value);

  if (
    !input ||
    !isString(input.id) ||
    !isString(input.slug) ||
    !isString(input.name) ||
    !isString(input.publishedVersionId)
  ) {
    return null;
  }

  return {
    id: input.id,
    slug: input.slug.toLowerCase(),
    name: input.name,
    publishedVersionId: input.publishedVersionId,
    publishedAt: isString(input.publishedAt) ? input.publishedAt : new Date(0).toISOString(),
  };
}

function parseMetadata(value: unknown, fallbackTitle: string): PublishedSitePayload["metadata"] {
  const input = asRecord(value);

  return {
    title: isString(input?.title) ? input.title : fallbackTitle,
    description: isString(input?.description) ? input.description : "",
    ogImage: parseAsset(input?.ogImage),
    robots: "noindex,nofollow",
  };
}

function parseHeader(value: unknown, fallbackTitle: string): PublishedSitePayload["header"] {
  const input = asRecord(value);

  return {
    avatarAssets: parseArray(input?.avatarAssets).map(parseAsset).filter(isPresent),
    eyebrow: nullableString(input?.eyebrow),
    title: isString(input?.title) ? input.title : fallbackTitle,
    subtitle: nullableString(input?.subtitle),
  };
}

function parseVariable(value: unknown): PublicVariable | null {
  const input = asRecord(value);

  if (!input || !isString(input.id)) {
    return null;
  }

  const type = isString(input.type) && variableTypes.has(input.type as PublicVariable["type"])
    ? input.type as PublicVariable["type"]
    : "text";

  return {
    id: input.id,
    name: isString(input.name) ? input.name : input.id,
    type,
    defaultValue: isString(input.defaultValue) ? input.defaultValue : "",
  };
}

function parseVariant(value: unknown): PublicVariant | null {
  const input = asRecord(value);

  if (!input || !isString(input.id) || !isString(input.slug)) {
    return null;
  }

  return {
    id: input.id,
    slug: input.slug.toLowerCase(),
    name: isString(input.name) ? input.name : input.slug,
    recipientName: nullableString(input.recipientName),
    recipientCompany: nullableString(input.recipientCompany),
    revisionNumber: isNonNegativeInteger(input.revisionNumber) ? input.revisionNumber : 1,
    variableValues: parseStringRecord(input.variableValues),
  };
}

function parseBlock(value: unknown): PublicBlock | null {
  const input = asRecord(value);

  if (!input || !isString(input.id) || !isString(input.type)) {
    return null;
  }

  switch (input.type) {
    case "heading":
      return isString(input.text)
        ? {
            id: input.id,
            type: "heading",
            level: input.level === 3 ? 3 : 2,
            text: input.text,
          }
        : null;

    case "text":
      return isString(input.text) ? { id: input.id, type: "text", text: input.text } : null;

    case "divider":
      return {
        id: input.id,
        type: "divider",
        width: input.width === "full" ? "full" : "content",
        spacing: input.spacing === "sm" || input.spacing === "lg" ? input.spacing : "md",
      };

    case "image": {
      const asset = parseAsset(input.asset);
      return asset ? { id: input.id, type: "image", asset, caption: nullableString(input.caption) } : null;
    }

    case "cta":
      return isString(input.label) && isString(input.href)
        ? {
            id: input.id,
            type: "cta",
            label: input.label,
            href: input.href,
            style: input.style === "secondary" ? "secondary" : "primary",
          }
        : null;

    case "quote":
      return isString(input.quote)
        ? {
            id: input.id,
            type: "quote",
            quote: input.quote,
            personName: isString(input.personName) ? input.personName : "",
            personTitle: nullableString(input.personTitle),
            company: nullableString(input.company),
          }
        : null;

    case "logo_strip": {
      const logos = parseArray(input.logos).map(parseAsset).filter(isPresent);
      return logos.length > 0 ? { id: input.id, type: "logo_strip", logos } : null;
    }

    default:
      return null;
  }
}

function parseAsset(value: unknown): PublicAsset | null {
  const input = asRecord(value);

  if (!input || !isString(input.id) || !isString(input.src)) {
    return null;
  }

  const kind = isString(input.kind) && assetKinds.has(input.kind as PublicAsset["kind"])
    ? input.kind as PublicAsset["kind"]
    : "image";

  return {
    id: input.id,
    kind,
    src: input.src,
    alt: isString(input.alt) ? input.alt : "",
    width: isPositiveNumber(input.width) ? input.width : 1,
    height: isPositiveNumber(input.height) ? input.height : 1,
  };
}

function parseTracking(
  value: unknown,
  workspaceId: string,
  siteId: string,
  publishedVersionId: string,
  selectedVariant: PublicVariant | null,
): PublishedSitePayload["tracking"] {
  const input = asRecord(value);
  const token = nullableString(input?.token);
  const mode = token && isTrackingMode(input?.mode) ? input.mode : "off";

  return {
    workspaceId: isString(input?.workspaceId) ? input.workspaceId : workspaceId,
    siteId: isString(input?.siteId) ? input.siteId : siteId,
    publishedVersionId: isString(input?.publishedVersionId) ? input.publishedVersionId : publishedVersionId,
    variantId: nullableString(input?.variantId) ?? selectedVariant?.id ?? null,
    variantRevision: isNonNegativeInteger(input?.variantRevision)
      ? input.variantRevision
      : selectedVariant?.revisionNumber ?? null,
    mode,
    token,
  };
}

function parseStringRecord(value: unknown): Record<string, string> {
  const input = asRecord(value);

  if (!input) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(input).filter((entry): entry is [string, string] => isString(entry[1])),
  );
}

function isTrackingMode(value: unknown): value is TrackingMode {
  return isString(value) && trackingModes.has(value as TrackingMode);
}

function parseArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function nullableString(value: unknown): string | null {
  return isString(value) ? value : null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isPositiveNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function isNonNegativeInteger(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) >= 0;
}

function isPresent<TValue>(value: TValue | null): value is TValue {
  return value !== null;
}
