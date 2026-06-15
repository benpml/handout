import { IconArrowUpRight } from "@tabler/icons-react";

import { cn } from "@/lib/utils";

import { resolvePublicAssetSrc } from "./asset-resolution";
import type { PublishedSitePayload, PublicBlock, PublicCtaBlock } from "./types";
import { buildVariableValueMap, resolveUrl, resolveVariables } from "./variable-resolution";

type PublicSiteRendererProps = {
  payload: PublishedSitePayload;
};

export function PublicSiteRenderer({ payload }: PublicSiteRendererProps) {
  const values = buildVariableValueMap(payload, payload.selectedVariant);
  const eyebrow = payload.header.eyebrow ? resolveVariables(payload.header.eyebrow, values) : null;
  const title = resolveVariables(payload.header.title, values);
  const subtitle = payload.header.subtitle ? resolveVariables(payload.header.subtitle, values) : null;

  return (
    <main className="min-h-svh bg-background font-site text-foreground">
      <article className="mx-auto flex w-full max-w-[760px] flex-col px-5 py-7 sm:px-6 sm:py-10">
        <header className="pb-8 sm:pb-10">
          <div className="mb-7 flex items-center gap-3">
            {payload.header.avatarAssets.map((asset) => {
              const src = resolvePublicAssetSrc(asset.src);

              return src ? (
                <img
                  key={asset.id}
                  src={src}
                  alt={asset.alt}
                  width={asset.width}
                  height={asset.height}
                  className="size-11 rounded-lg border border-border bg-muted object-contain p-1.5"
                />
              ) : null;
            })}
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{payload.workspace.name}</p>
              <p className="truncate text-xs text-muted-foreground">{payload.workspace.websiteDomain}</p>
            </div>
          </div>

          {eyebrow ? (
            <p className="mb-4 w-fit border-l-2 border-primary pl-3 text-sm font-medium text-muted-foreground">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="text-[2.5rem] leading-[1.02] font-semibold tracking-normal text-balance sm:text-6xl">
            {title}
          </h1>
          {subtitle ? <p className="mt-5 max-w-2xl text-lg leading-7 text-muted-foreground">{subtitle}</p> : null}
        </header>

        <div className="flex flex-col">
          {payload.blocks.map((block) => (
            <PublicBlockRenderer key={block.id} block={block} values={values} />
          ))}
        </div>

        <footer className="mt-10 border-t border-border pt-5 text-xs text-muted-foreground">
          <p>
            Published by {payload.workspace.name}. Last updated{" "}
            {new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(
              new Date(payload.site.publishedAt),
            )}
            .
          </p>
        </footer>
      </article>
    </main>
  );
}

function PublicBlockRenderer({
  block,
  values,
}: {
  block: PublicBlock;
  values: ReturnType<typeof buildVariableValueMap>;
}) {
  switch (block.type) {
    case "heading": {
      const text = resolveVariables(block.text, values);
      const Heading = block.level === 2 ? "h2" : "h3";

      return <Heading className="pt-7 pb-3 text-2xl font-semibold tracking-normal sm:text-3xl">{text}</Heading>;
    }

    case "text":
      return <p className="pb-5 text-base leading-7 text-muted-foreground">{resolveVariables(block.text, values)}</p>;

    case "divider":
      return (
        <div
          className={cn(
            block.spacing === "sm" && "py-3",
            block.spacing === "md" && "py-5",
            block.spacing === "lg" && "py-8",
            block.width === "full" ? "-mx-5 sm:-mx-6" : "",
          )}
          aria-hidden="true"
        >
          <div className="h-px bg-border" />
        </div>
      );

    case "image": {
      const imageSrc = resolvePublicAssetSrc(block.asset.src);

      if (!imageSrc) {
        return null;
      }

      return (
        <figure className="py-5">
          <img
            src={imageSrc}
            alt={block.asset.alt}
            width={block.asset.width}
            height={block.asset.height}
            loading="lazy"
            className="aspect-video w-full rounded-lg border border-border bg-muted object-cover"
          />
          {block.caption ? <figcaption className="mt-2 text-sm text-muted-foreground">{block.caption}</figcaption> : null}
        </figure>
      );
    }

    case "cta":
      return <PublicCta block={block} values={values} />;

    case "quote":
      return (
        <figure className="my-5 border-l-2 border-primary pl-5">
          <blockquote className="text-xl leading-8 font-medium text-balance">
            &ldquo;{resolveVariables(block.quote, values)}&rdquo;
          </blockquote>
          <figcaption className="mt-4 text-sm text-muted-foreground">
            {block.personName}
            {block.personTitle ? `, ${block.personTitle}` : ""}
            {block.company ? `, ${block.company}` : ""}
          </figcaption>
        </figure>
      );

    case "logo_strip":
      return (
        <div className="grid grid-cols-3 gap-3 py-5 sm:grid-cols-6">
          {block.logos.map((logo) => {
            const src = resolvePublicAssetSrc(logo.src);

            return src ? (
              <div key={logo.id} className="flex h-16 items-center justify-center rounded-lg border border-border bg-muted/40">
                <img
                  src={src}
                  alt={logo.alt}
                  width={logo.width}
                  height={logo.height}
                  loading="lazy"
                  className="size-8 object-contain opacity-80"
                />
              </div>
            ) : null;
          })}
        </div>
      );
  }
}

function PublicCta({ block, values }: { block: PublicCtaBlock; values: ReturnType<typeof buildVariableValueMap> }) {
  const href = resolveUrl(block.href, values);
  const label = resolveVariables(block.label, values);

  if (!href) {
    return null;
  }

  return (
    <div className="py-5">
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        data-track-click-id={block.id}
        data-track-label={label}
        className={cn(
          "inline-flex h-10 items-center gap-2 rounded-lg border px-3 text-sm font-medium transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
          block.style === "primary"
            ? "border-primary bg-primary text-primary-foreground hover:bg-primary/85"
            : "border-border bg-background hover:bg-muted",
        )}
      >
        {label}
        <IconArrowUpRight data-icon="inline-end" aria-hidden="true" />
      </a>
    </div>
  );
}
