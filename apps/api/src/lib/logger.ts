type LogLevel = "info" | "warn" | "error";

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
  return Object.fromEntries(
    Object.entries(fields).map(([key, value]) => [
      key,
      value instanceof Error ? serializeError(value) : value,
    ]),
  );
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
