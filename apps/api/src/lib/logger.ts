type LogLevel = "info" | "warn" | "error";

const REDACTED = "[REDACTED]";
const MAX_DEPTH = 8;
const MAX_ARRAY_ITEMS = 100;
const SENSITIVE_KEY_PATTERN = /(?:authorization|cookie|credential|headers?|href|ip(?:address)?|password|requestbody|secret|token|url)$/i;

export type LogFields = Record<string, unknown>;

export const logger = {
  info(message: string, fields: LogFields = {}) {
    writeLog("info", message, fields);
  },
  warn(message: string, fields: LogFields = {}) {
    writeLog("warn", message, fields);
  },
  error(message: string, fields: LogFields = {}) {
    writeLog("error", message, fields);
  },
};

function writeLog(level: LogLevel, message: string, fields: LogFields) {
  const payload = {
    level,
    time: new Date().toISOString(),
    message,
    ...sanitizeFields(fields),
  };
  const line = safeStringify(payload);

  if (level === "error") {
    console.error(line);
    return;
  }

  console.log(line);
}

function sanitizeFields(fields: LogFields): LogFields {
  return sanitizeRecord(fields, new WeakSet<object>(), 0);
}

function sanitizeRecord(value: Record<string, unknown>, seen: WeakSet<object>, depth: number): LogFields {
  if (seen.has(value)) return { value: "[Circular]" };
  if (depth >= MAX_DEPTH) return { value: "[Maximum depth]" };
  seen.add(value);

  return Object.fromEntries(Object.entries(value).map(([key, nestedValue]) => [
    key,
    SENSITIVE_KEY_PATTERN.test(key.replaceAll(/[^a-z]/gi, ""))
      ? REDACTED
      : sanitizeValue(nestedValue, seen, depth + 1),
  ]));
}

function sanitizeValue(value: unknown, seen: WeakSet<object>, depth: number): unknown {
  if (value instanceof Error) return serializeError(value);
  if (!value || typeof value !== "object") return value;
  if (seen.has(value)) return "[Circular]";
  if (depth >= MAX_DEPTH) return "[Maximum depth]";
  if (Array.isArray(value)) {
    seen.add(value);
    return value.slice(0, MAX_ARRAY_ITEMS).map((item) => sanitizeValue(item, seen, depth + 1));
  }
  return sanitizeRecord(value as Record<string, unknown>, seen, depth);
}

function serializeError(error: Error) {
  return {
    name: error.name,
    message: error.message,
    ...(process.env.NODE_ENV === "production" ? {} : { stack: error.stack }),
  };
}

function safeStringify(value: unknown): string {
  const seen = new WeakSet<object>();

  return JSON.stringify(value, (_key, nestedValue) => {
    if (typeof nestedValue === "bigint") {
      return nestedValue.toString();
    }

    if (nestedValue instanceof Error) {
      return serializeError(nestedValue);
    }

    if (nestedValue && typeof nestedValue === "object") {
      if (seen.has(nestedValue)) {
        return "[Circular]";
      }

      seen.add(nestedValue);
    }

    return nestedValue;
  });
}
