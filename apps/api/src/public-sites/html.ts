import {
  normalizePublishedSitePayload,
  type PublishedSitePayload,
  type PublicAsset,
  type PublicBlock,
  type PublicVariable,
  type PublicVariant,
} from "@lightsite/content-schema";
import { TRACKING_INGEST_ENDPOINT, TRACKING_SCRIPT_ENDPOINT } from "@lightsite/tracking-schema";

type PublicHtmlRenderInput = {
  origin: string;
  payload: Record<string, unknown>;
};

type VariableValueMap = Map<string, string>;

const VARIABLE_TOKEN_PATTERN = /\{\{([a-zA-Z0-9_-]+)\}\}/g;

export function renderPublicSiteHtmlDocument(input: PublicHtmlRenderInput) {
  const payload = normalizePublishedSitePayload(input.payload);

  if (!payload) {
    return null;
  }

  const values = buildVariableValueMap(payload.variables, payload.selectedVariant);
  const metadata = getResolvedMetadata(payload, values, input.origin);
  const headerHtml = renderHeader(payload, values);
  const blocksHtml = payload.blocks.map((block) => renderBlock(block, values, input.origin)).join("");
  const publishedDate = formatPublishedDate(payload.site.publishedAt);
  const trackingScriptHtml = renderTrackingScript(payload);

  return renderHtmlDocument({
    body: `
      <main class="page">
        <article class="sheet">
          ${headerHtml}
          <div class="blocks">${blocksHtml}</div>
          <footer class="footer">Published by ${escapeHtml(payload.workspace.name)}. Last updated ${escapeHtml(publishedDate)}.</footer>
        </article>
      </main>
      ${trackingScriptHtml}
    `,
    metadata,
  });
}

export function renderUnavailablePublicSiteHtmlDocument(origin: string, path = "/") {
  const canonicalUrl = buildAbsoluteUrl(path, origin) ?? origin;

  return renderHtmlDocument({
    body: `
      <main class="page page-center">
        <article class="unavailable">
          <p class="brand">Lightsite</p>
          <h1>This page is unavailable</h1>
          <p>The link may be unpublished, archived, or no longer available.</p>
        </article>
      </main>
    `,
    metadata: {
      title: "Page unavailable | Lightsite",
      description: "This Lightsite page is unavailable.",
      robots: "noindex,nofollow",
      canonicalUrl,
      ogImageUrl: new URL("/lightsite-logo.svg", origin).toString(),
    },
  });
}

function renderHtmlDocument(input: {
  body: string;
  metadata: ResolvedMetadata;
}) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(input.metadata.title)}</title>
  <link rel="canonical" href="${escapeAttribute(input.metadata.canonicalUrl)}">
  <meta name="description" content="${escapeAttribute(input.metadata.description)}">
  <meta name="robots" content="${escapeAttribute(input.metadata.robots)}">
  <meta property="og:title" content="${escapeAttribute(input.metadata.title)}">
  <meta property="og:description" content="${escapeAttribute(input.metadata.description)}">
  <meta property="og:image" content="${escapeAttribute(input.metadata.ogImageUrl)}">
  <meta property="og:url" content="${escapeAttribute(input.metadata.canonicalUrl)}">
  <meta property="og:type" content="website">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeAttribute(input.metadata.title)}">
  <meta name="twitter:description" content="${escapeAttribute(input.metadata.description)}">
  <meta name="twitter:image" content="${escapeAttribute(input.metadata.ogImageUrl)}">
  <style>${PUBLIC_HTML_CSS}</style>
</head>
<body>
${input.body}
</body>
</html>`;
}

type ResolvedMetadata = {
  title: string;
  description: string;
  robots: "noindex,nofollow" | "index,follow";
  canonicalUrl: string;
  ogImageUrl: string;
};

function getResolvedMetadata(
  payload: PublishedSitePayload,
  values: VariableValueMap,
  origin: string,
): ResolvedMetadata {
  const canonicalPath = [
    "",
    payload.workspace.slug,
    payload.site.slug,
    payload.selectedVariant?.slug ?? null,
  ]
    .filter(Boolean)
    .join("/");
  const ogImageSrc = resolvePublicAssetSrc(payload.metadata.ogImage?.src ?? "");

  return {
    title: resolveVariables(payload.metadata.title, values),
    description: resolveVariables(payload.metadata.description, values),
    robots: payload.metadata.robots,
    canonicalUrl: new URL(canonicalPath, origin).toString(),
    ogImageUrl: ogImageSrc ? new URL(ogImageSrc, origin).toString() : new URL("/lightsite-logo.svg", origin).toString(),
  };
}

function renderHeader(payload: PublishedSitePayload, values: VariableValueMap) {
  const eyebrow = payload.header.eyebrow ? resolveVariables(payload.header.eyebrow, values) : null;
  const title = resolveVariables(payload.header.title, values);
  const subtitle = payload.header.subtitle ? resolveVariables(payload.header.subtitle, values) : null;
  const avatarHtml = payload.header.avatarAssets
    .map((asset) => renderAssetImage(asset, { className: "avatar", loading: "eager" }))
    .filter(Boolean)
    .join("");

  return `
    <header class="hero">
      <div class="workspace">
        ${avatarHtml}
        <div class="workspace-copy">
          <p>${escapeHtml(payload.workspace.name)}</p>
          <span>${escapeHtml(payload.workspace.websiteDomain)}</span>
        </div>
      </div>
      ${eyebrow ? `<p class="eyebrow">${escapeHtml(eyebrow)}</p>` : ""}
      <h1>${escapeHtml(title)}</h1>
      ${subtitle ? `<p class="subtitle">${escapeHtml(subtitle)}</p>` : ""}
    </header>
  `;
}

function renderBlock(block: PublicBlock, values: VariableValueMap, origin: string): string {
  switch (block.type) {
    case "heading": {
      const tag = block.level === 3 ? "h3" : "h2";
      return `<${tag} class="heading">${escapeHtml(resolveVariables(block.text, values))}</${tag}>`;
    }

    case "text":
      return `<p class="text">${escapeHtml(resolveVariables(block.text, values))}</p>`;

    case "divider":
      return `<div class="divider divider-${block.spacing} ${block.width === "full" ? "divider-full" : ""}" aria-hidden="true"><span></span></div>`;

    case "image": {
      const image = renderAssetImage(block.asset, { className: "image", loading: "lazy" });

      if (!image) {
        return "";
      }

      return `<figure class="figure">${image}${block.caption ? `<figcaption>${escapeHtml(block.caption)}</figcaption>` : ""}</figure>`;
    }

    case "cta": {
      const href = resolveUrl(block.href, values);
      const label = resolveVariables(block.label, values);

      if (!href) {
        return "";
      }

      return `<div class="cta-wrap"><a class="cta cta-${block.style}" href="${escapeAttribute(href)}" target="_blank" rel="noopener noreferrer" data-track-click-id="${escapeAttribute(block.id)}" data-track-label="${escapeAttribute(label)}">${escapeHtml(label)}<span aria-hidden="true">&#8599;</span></a></div>`;
    }

    case "quote":
      return `
        <figure class="quote">
          <blockquote>&ldquo;${escapeHtml(resolveVariables(block.quote, values))}&rdquo;</blockquote>
          <figcaption>${escapeHtml(formatQuoteAttribution(block))}</figcaption>
        </figure>
      `;

    case "logo_strip": {
      const logos = block.logos
        .map((asset) => renderAssetImage(asset, { className: "logo", loading: "lazy" }))
        .filter(Boolean)
        .map((image) => `<div class="logo-cell">${image}</div>`)
        .join("");

      return logos ? `<div class="logos">${logos}</div>` : "";
    }
  }
}

function renderAssetImage(
  asset: PublicAsset,
  options: {
    className: string;
    loading: "eager" | "lazy";
  },
) {
  const src = resolvePublicAssetSrc(asset.src);

  if (!src) {
    return "";
  }

  return `<img class="${escapeAttribute(options.className)}" src="${escapeAttribute(src)}" alt="${escapeAttribute(asset.alt)}" width="${asset.width}" height="${asset.height}" loading="${options.loading}">`;
}

function renderTrackingScript(payload: PublishedSitePayload) {
  if (!payload.tracking.token || payload.tracking.mode === "off") {
    return "";
  }

  return `<script src="${TRACKING_SCRIPT_ENDPOINT}" defer data-lightsite-tracking="${escapeAttribute(JSON.stringify(payload.tracking))}" data-lightsite-ingest="${TRACKING_INGEST_ENDPOINT}"></script>`;
}

function buildVariableValueMap(
  variables: PublicVariable[],
  variant: PublicVariant | null,
): VariableValueMap {
  const values = new Map<string, string>();

  for (const variable of variables) {
    const variantValue = variant?.variableValues[variable.id];
    values.set(variable.id, variantValue && variantValue.trim().length > 0 ? variantValue : variable.defaultValue);
  }

  return values;
}

function resolveVariables(value: string, values: VariableValueMap): string {
  if (!value.includes("{{")) {
    return value;
  }

  return value.replace(VARIABLE_TOKEN_PATTERN, (_match, variableId: string) => values.get(variableId) ?? "");
}

function resolveUrl(value: string, values: VariableValueMap): string | null {
  const resolved = resolveVariables(value, values).trim();

  try {
    const url = new URL(resolved);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function resolvePublicAssetSrc(src: string): string | null {
  const value = src.trim();

  if (!value) {
    return null;
  }

  if (value.startsWith("/")) {
    return value.startsWith("//") ? null : value;
  }

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function buildAbsoluteUrl(path: string, origin: string) {
  try {
    return new URL(path, origin).toString();
  } catch {
    return null;
  }
}

function formatPublishedDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "recently";
  }

  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(date);
}

function formatQuoteAttribution(block: Extract<PublicBlock, { type: "quote" }>) {
  return [
    block.personName,
    block.personTitle,
    block.company,
  ].filter((value): value is string => Boolean(value)).join(", ");
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function escapeAttribute(value: string) {
  return escapeHtml(value)
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

const PUBLIC_HTML_CSS = `
:root{color-scheme:light;--background:#ffffff;--foreground:#18181b;--muted:#f4f4f5;--muted-foreground:#71717a;--border:#e4e4e7;--primary:#18181b;--primary-foreground:#fafafa;--ring:#a1a1aa}
*{box-sizing:border-box}
html{font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:var(--background);color:var(--foreground)}
body{margin:0}
.page{min-height:100svh;background:var(--background);color:var(--foreground)}
.page-center{display:flex;align-items:center;justify-content:center;padding:48px 20px}
.sheet{width:100%;max-width:760px;margin:0 auto;padding:40px 24px}
.hero{padding-bottom:40px}
.workspace{display:flex;align-items:center;gap:12px;margin-bottom:28px}
.workspace-copy{min-width:0}
.workspace-copy p{margin:0;font-size:14px;line-height:20px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.workspace-copy span{display:block;font-size:12px;line-height:16px;color:var(--muted-foreground);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.avatar{width:44px;height:44px;border:1px solid var(--border);border-radius:8px;background:var(--muted);object-fit:contain;padding:6px}
.eyebrow{width:fit-content;margin:0 0 16px;border-left:2px solid var(--primary);padding-left:12px;font-size:14px;line-height:20px;font-weight:500;color:var(--muted-foreground)}
h1{margin:0;font-size:60px;line-height:1.02;font-weight:650;letter-spacing:0;text-wrap:balance}
.subtitle{max-width:672px;margin:20px 0 0;color:var(--muted-foreground);font-size:18px;line-height:28px}
.blocks{display:flex;flex-direction:column}
.heading{margin:0;padding:28px 0 12px;font-size:30px;line-height:36px;font-weight:650;letter-spacing:0}
.text{margin:0;padding-bottom:20px;color:var(--muted-foreground);font-size:16px;line-height:28px}
.divider{padding:20px 0}
.divider-sm{padding:12px 0}
.divider-lg{padding:32px 0}
.divider-full{margin-left:-24px;margin-right:-24px}
.divider span{display:block;height:1px;background:var(--border)}
.figure{margin:0;padding:20px 0}
.image{display:block;width:100%;height:auto;aspect-ratio:16/9;border:1px solid var(--border);border-radius:8px;background:var(--muted);object-fit:cover}
figcaption{margin-top:8px;color:var(--muted-foreground);font-size:14px;line-height:20px}
.cta-wrap{padding:20px 0}
.cta{display:inline-flex;min-height:40px;align-items:center;gap:8px;border:1px solid var(--border);border-radius:8px;padding:8px 12px;color:var(--foreground);font-size:14px;line-height:20px;font-weight:500;text-decoration:none}
.cta-primary{border-color:var(--primary);background:var(--primary);color:var(--primary-foreground)}
.cta:focus-visible{outline:3px solid color-mix(in srgb,var(--ring) 50%,transparent);outline-offset:2px}
.quote{margin:20px 0;border-left:2px solid var(--primary);padding-left:20px}
.quote blockquote{margin:0;font-size:20px;line-height:32px;font-weight:500;text-wrap:balance}
.logos{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:12px;padding:20px 0}
.logo-cell{display:flex;height:64px;align-items:center;justify-content:center;border:1px solid var(--border);border-radius:8px;background:#fafafa}
.logo{width:32px;height:32px;object-fit:contain;opacity:.8}
.footer{margin-top:40px;border-top:1px solid var(--border);padding-top:20px;color:var(--muted-foreground);font-size:12px;line-height:16px}
.unavailable{width:100%;max-width:448px}
.unavailable .brand{margin:0;color:var(--muted-foreground);font-size:14px;line-height:20px;font-weight:500}
.unavailable h1{margin:12px 0 0;font-size:36px;line-height:40px}
.unavailable p:last-child{margin:12px 0 0;color:var(--muted-foreground);font-size:16px;line-height:28px}
@media (max-width:640px){.sheet{padding:28px 20px}.hero{padding-bottom:32px}h1{font-size:40px}.subtitle{font-size:18px;line-height:28px}.heading{font-size:24px;line-height:32px}.divider-full{margin-left:-20px;margin-right:-20px}.logos{grid-template-columns:repeat(3,minmax(0,1fr))}}
`;
