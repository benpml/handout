export type SlugValidationResult =
  | { ok: true; slug: string }
  | { ok: false; code: SlugValidationCode; message: string };

export type SlugValidationCode =
  | "slug.empty"
  | "slug.too_short"
  | "slug.too_long"
  | "slug.invalid_characters"
  | "slug.reserved";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const WORKSPACE_RESERVED_SLUGS = new Set([
  "admin",
  "api",
  "app",
  "assets",
  "auth",
  "billing",
  "blog",
  "dashboard",
  "design-system",
  "docs",
  "editor",
  "help",
  "login",
  "logout",
  "new",
  "pricing",
  "public",
  "settings",
  "signup",
  "sites",
  "support",
  "team",
  "tracking",
  "www",
]);

export const SITE_RESERVED_SLUGS = new Set([
  "analytics",
  "assets",
  "edit",
  "new",
  "preview",
  "settings",
  "share",
  "tracking",
  "variants",
]);

export const VARIANT_RESERVED_SLUGS = new Set([
  "analytics",
  "assets",
  "edit",
  "new",
  "preview",
  "settings",
  "share",
  "tracking",
]);

export function slugifyName(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export function validateSlug(
  input: string,
  options: {
    reserved?: ReadonlySet<string>;
    minLength?: number;
    maxLength?: number;
    label?: string;
  } = {},
): SlugValidationResult {
  const slug = slugifyName(input);
  const label = options.label ?? "Slug";
  const minLength = options.minLength ?? 2;
  const maxLength = options.maxLength ?? 64;

  if (!slug) {
    return {
      ok: false,
      code: "slug.empty",
      message: `${label} is required.`,
    };
  }

  if (slug.length < minLength) {
    return {
      ok: false,
      code: "slug.too_short",
      message: `${label} must be at least ${minLength} characters.`,
    };
  }

  if (slug.length > maxLength) {
    return {
      ok: false,
      code: "slug.too_long",
      message: `${label} must be ${maxLength} characters or fewer.`,
    };
  }

  if (!SLUG_PATTERN.test(slug)) {
    return {
      ok: false,
      code: "slug.invalid_characters",
      message: `${label} can contain lowercase letters, numbers, and single hyphens.`,
    };
  }

  if (options.reserved?.has(slug)) {
    return {
      ok: false,
      code: "slug.reserved",
      message: `${label} is reserved.`,
    };
  }

  return { ok: true, slug };
}

export function validateWorkspaceSlug(input: string): SlugValidationResult {
  return validateSlug(input, {
    reserved: WORKSPACE_RESERVED_SLUGS,
    minLength: 2,
    maxLength: 64,
    label: "Workspace slug",
  });
}

export function validateSiteSlug(input: string): SlugValidationResult {
  return validateSlug(input, {
    reserved: SITE_RESERVED_SLUGS,
    minLength: 2,
    maxLength: 96,
    label: "Site slug",
  });
}

export function validateVariantSlug(input: string): SlugValidationResult {
  return validateSlug(input, {
    reserved: VARIANT_RESERVED_SLUGS,
    minLength: 2,
    maxLength: 96,
    label: "Variant slug",
  });
}
