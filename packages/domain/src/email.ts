export type WorkEmailValidationResult =
  | { ok: true; email: string; domain: string }
  | { ok: false; code: WorkEmailValidationCode; message: string };

export type WorkEmailValidationCode =
  | "email.invalid"
  | "email.plus_addressing_blocked"
  | "email.personal_domain_blocked";

const PERSONAL_EMAIL_DOMAINS = new Set([
  "aol.com",
  "gmail.com",
  "googlemail.com",
  "hotmail.com",
  "icloud.com",
  "live.com",
  "me.com",
  "msn.com",
  "outlook.com",
  "pm.me",
  "proton.me",
  "protonmail.com",
  "yahoo.com",
  "ymail.com",
]);

const BASIC_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(input: string): string {
  return input.trim().toLowerCase();
}

export function validateWorkEmail(input: string): WorkEmailValidationResult {
  const email = normalizeEmail(input);

  if (!BASIC_EMAIL_PATTERN.test(email)) {
    return {
      ok: false,
      code: "email.invalid",
      message: "Enter a valid work email address.",
    };
  }

  const [localPart, domain] = email.split("@");

  if (!localPart || !domain) {
    return {
      ok: false,
      code: "email.invalid",
      message: "Enter a valid work email address.",
    };
  }

  if (localPart.includes("+")) {
    return {
      ok: false,
      code: "email.plus_addressing_blocked",
      message: "Use your work email without a plus alias.",
    };
  }

  if (PERSONAL_EMAIL_DOMAINS.has(domain)) {
    return {
      ok: false,
      code: "email.personal_domain_blocked",
      message: "Use your company email to sign up for Lightsite.",
    };
  }

  return { ok: true, email, domain };
}
