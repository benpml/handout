import { describe, expect, it } from "vitest";
import { createMemoryTrackingRateLimiter } from "./rate-limit";

describe("createMemoryTrackingRateLimiter", () => {
  it("allows events until the configured window budget is exhausted", async () => {
    const limiter = createMemoryTrackingRateLimiter({
      maxEventsPerWindow: 3,
      windowMs: 60_000,
      nowMs: () => 1_000,
    });

    await expect(
      limiter.check({ key: "tracking:session-1", eventCount: 2 }),
    ).resolves.toEqual({ allowed: true });
    await expect(
      limiter.check({ key: "tracking:session-1", eventCount: 1 }),
    ).resolves.toEqual({ allowed: true });
    await expect(
      limiter.check({ key: "tracking:session-1", eventCount: 1 }),
    ).resolves.toEqual({ allowed: false, retryAfterSeconds: 60 });
  });

  it("keeps rate limit windows isolated by key", async () => {
    const limiter = createMemoryTrackingRateLimiter({
      maxEventsPerWindow: 1,
      windowMs: 60_000,
      nowMs: () => 1_000,
    });

    await expect(
      limiter.check({ key: "tracking:session-1", eventCount: 1 }),
    ).resolves.toEqual({ allowed: true });
    await expect(
      limiter.check({ key: "tracking:session-2", eventCount: 1 }),
    ).resolves.toEqual({ allowed: true });
    await expect(
      limiter.check({ key: "tracking:session-1", eventCount: 1 }),
    ).resolves.toEqual({ allowed: false, retryAfterSeconds: 60 });
  });

  it("starts a new budget after the window resets", async () => {
    let nowMs = 1_000;
    const limiter = createMemoryTrackingRateLimiter({
      maxEventsPerWindow: 1,
      windowMs: 60_000,
      nowMs: () => nowMs,
    });

    await expect(
      limiter.check({ key: "tracking:session-1", eventCount: 1 }),
    ).resolves.toEqual({ allowed: true });
    await expect(
      limiter.check({ key: "tracking:session-1", eventCount: 1 }),
    ).resolves.toEqual({ allowed: false, retryAfterSeconds: 60 });

    nowMs = 61_000;

    await expect(
      limiter.check({ key: "tracking:session-1", eventCount: 1 }),
    ).resolves.toEqual({ allowed: true });
  });
});
