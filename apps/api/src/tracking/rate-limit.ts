export type TrackingRateLimitInput = {
  key: string;
  eventCount: number;
};

export type TrackingRateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfterSeconds: number };

export interface TrackingRateLimiter {
  check(input: TrackingRateLimitInput): Promise<TrackingRateLimitResult>;
}

export type MemoryTrackingRateLimiterOptions = {
  maxEventsPerWindow?: number;
  windowMs?: number;
  maxKeys?: number;
  nowMs?: () => number;
};

type RateLimitBucket = {
  eventCount: number;
  resetAtMs: number;
  lastSeenAtMs: number;
};

const DEFAULT_MAX_EVENTS_PER_WINDOW = 300;
const DEFAULT_WINDOW_MS = 60_000;
const DEFAULT_MAX_KEYS = 10_000;
const PRUNE_INTERVAL_MS = 30_000;

export function createMemoryTrackingRateLimiter(
  options: MemoryTrackingRateLimiterOptions = {},
): TrackingRateLimiter {
  const maxEventsPerWindow = toPositiveInteger(
    options.maxEventsPerWindow,
    DEFAULT_MAX_EVENTS_PER_WINDOW,
  );
  const windowMs = toPositiveInteger(options.windowMs, DEFAULT_WINDOW_MS);
  const maxKeys = toPositiveInteger(options.maxKeys, DEFAULT_MAX_KEYS);
  const nowMs = options.nowMs ?? Date.now;
  const buckets = new Map<string, RateLimitBucket>();
  let nextPruneAtMs = 0;

  return {
    async check(input) {
      const now = nowMs();
      const eventCount = Math.max(1, Math.floor(input.eventCount));

      if (now >= nextPruneAtMs || buckets.size >= maxKeys) {
        pruneExpiredBuckets(buckets, now);
        nextPruneAtMs = now + Math.min(windowMs, PRUNE_INTERVAL_MS);
      }

      const existingBucket = buckets.get(input.key);
      const bucket =
        existingBucket && existingBucket.resetAtMs > now
          ? existingBucket
          : {
              eventCount: 0,
              resetAtMs: now + windowMs,
              lastSeenAtMs: now,
            };

      if (bucket.eventCount + eventCount > maxEventsPerWindow) {
        bucket.lastSeenAtMs = now;
        buckets.set(input.key, bucket);

        return {
          allowed: false,
          retryAfterSeconds: Math.max(
            1,
            Math.ceil((bucket.resetAtMs - now) / 1000),
          ),
        };
      }

      bucket.eventCount += eventCount;
      bucket.lastSeenAtMs = now;
      buckets.set(input.key, bucket);

      if (buckets.size > maxKeys) {
        evictLeastRecentlySeenBucket(buckets, input.key);
      }

      return { allowed: true };
    },
  };
}

function toPositiveInteger(value: number | undefined, fallback: number) {
  if (value === undefined || !Number.isFinite(value) || value <= 0) {
    return fallback;
  }

  return Math.floor(value);
}

function pruneExpiredBuckets(
  buckets: Map<string, RateLimitBucket>,
  nowMs: number,
) {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAtMs <= nowMs) {
      buckets.delete(key);
    }
  }
}

function evictLeastRecentlySeenBucket(
  buckets: Map<string, RateLimitBucket>,
  protectedKey: string,
) {
  let keyToEvict: string | null = null;
  let oldestSeenAtMs = Number.POSITIVE_INFINITY;

  for (const [key, bucket] of buckets) {
    if (key === protectedKey) {
      continue;
    }

    if (bucket.lastSeenAtMs < oldestSeenAtMs) {
      keyToEvict = key;
      oldestSeenAtMs = bucket.lastSeenAtMs;
    }
  }

  if (keyToEvict) {
    buckets.delete(keyToEvict);
  }
}
