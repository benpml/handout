const DEFAULT_PUBLIC_SITE_ORIGIN = "https://handout.link"

export function getPublicSiteOrigin() {
  return normalizeOrigin(
    import.meta.env.VITE_PUBLIC_SITE_ORIGIN?.trim() || DEFAULT_PUBLIC_SITE_ORIGIN
  )
}

export function buildPublicSiteUrl(
  path: string,
  origin = getPublicSiteOrigin()
) {
  const normalizedPath = path
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/")

  return normalizedPath
    ? `${normalizeOrigin(origin)}/${normalizedPath}`
    : normalizeOrigin(origin)
}

export function getPublicSiteDisplayUrl(
  path: string,
  origin = getPublicSiteOrigin()
) {
  return buildPublicSiteUrl(path, origin).replace(/^https?:\/\//, "")
}

function normalizeOrigin(origin: string) {
  return origin.replace(/\/+$/, "")
}
