export function resolvePublicAssetSrc(src: string): string | null {
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
