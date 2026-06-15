export type WebsiteValidationResult =
  | { ok: true; domain: string; url: string }
  | { ok: false; code: WebsiteValidationCode; message: string };

export type WebsiteValidationCode =
  | "website.empty"
  | "website.invalid_url"
  | "website.invalid_hostname"
  | "website.local_hostname"
  | "website.placeholder_domain";

const PLACEHOLDER_DOMAINS = new Set([
  "company.com",
  "domain.com",
  "example.com",
  "example.org",
  "example.net",
  "test.com",
  "yourcompany.com",
]);

const HOSTNAME_PATTERN =
  /^(?=.{1,253}$)(?!-)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;

export function normalizeWebsiteDomain(input: string): WebsiteValidationResult {
  const rawValue = input.trim().toLowerCase();

  if (!rawValue) {
    return {
      ok: false,
      code: "website.empty",
      message: "Website is required.",
    };
  }

  const urlValue = rawValue.includes("://") ? rawValue : `https://${rawValue}`;

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(urlValue);
  } catch {
    return {
      ok: false,
      code: "website.invalid_url",
      message: "Enter a valid company website.",
    };
  }

  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    return {
      ok: false,
      code: "website.invalid_url",
      message: "Website must use http or https.",
    };
  }

  const domain = parsedUrl.hostname.replace(/\.$/, "").replace(/^www\./, "");

  if (isLocalHostname(domain)) {
    return {
      ok: false,
      code: "website.local_hostname",
      message: "Enter a public company website.",
    };
  }

  if (!HOSTNAME_PATTERN.test(domain)) {
    return {
      ok: false,
      code: "website.invalid_hostname",
      message: "Enter a valid public company website domain.",
    };
  }

  if (PLACEHOLDER_DOMAINS.has(domain)) {
    return {
      ok: false,
      code: "website.placeholder_domain",
      message: "Enter your real company website.",
    };
  }

  return {
    ok: true,
    domain,
    url: `https://${domain}`,
  };
}

function isLocalHostname(hostname: string): boolean {
  if (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.includes(":")
  ) {
    return true;
  }

  const ipv4Match = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);

  if (!ipv4Match) {
    return false;
  }

  const octets = ipv4Match.slice(1).map(Number);

  if (octets.some((octet) => octet < 0 || octet > 255)) {
    return true;
  }

  const [first = 0, second = 0] = octets;

  return (
    first === 0 ||
    first === 10 ||
    first === 127 ||
    first === 169 && second === 254 ||
    first === 172 && second >= 16 && second <= 31 ||
    first === 192 && second === 168
  );
}
