import { afterEach, describe, expect, it, vi } from "vitest";
import { logger } from "./logger";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("logger", () => {
  it("redacts sensitive fields recursively", () => {
    const output = vi.spyOn(console, "log").mockImplementation(() => undefined);

    logger.info("Safe log", {
      requestId: "request-1",
      nested: {
        authorization: "Bearer private",
        ipAddress: "203.0.113.4",
        requestUrl: "https://example.com/private?token=value",
        headers: { cookie: "session=private" },
      },
    });

    const payload = JSON.parse(String(output.mock.calls[0]?.[0])) as Record<string, unknown>;
    expect(payload).toMatchObject({
      requestId: "request-1",
      nested: {
        authorization: "[REDACTED]",
        ipAddress: "[REDACTED]",
        requestUrl: "[REDACTED]",
        headers: "[REDACTED]",
      },
    });
    expect(JSON.stringify(payload)).not.toContain("private");
  });

  it("serializes errors without production stack traces", () => {
    vi.stubEnv("NODE_ENV", "production");
    const output = vi.spyOn(console, "error").mockImplementation(() => undefined);

    logger.error("Failure", { error: new Error("Expected failure") });

    const payload = JSON.parse(String(output.mock.calls[0]?.[0])) as { error: Record<string, unknown> };
    expect(payload.error).toEqual({ name: "Error", message: "Expected failure" });
  });
});
