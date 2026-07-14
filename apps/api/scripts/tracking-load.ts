import { dirname, resolve } from "node:path";
import { performance } from "node:perf_hooks";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";
import { parse } from "parse5";
import { inArray, sql } from "drizzle-orm";
import {
  TRACKING_V2_RECORDING_SCHEMA_VERSION,
  TRACKING_V2_SESSION_END_ENDPOINT,
  TRACKING_V2_SESSION_HEARTBEAT_ENDPOINT,
  TRACKING_V2_SESSION_START_ENDPOINT,
  TRACKING_V2_VISITOR_NOTICE_VERSION,
  trackingV2SessionStartResponseSchema,
} from "@handout/tracking-schema";
import { parseTrackingReplayStorageEnv } from "@handout/config";
import { createDbTrackingV2Repository } from "../src/tracking/v2/repository";
import { createConfiguredTrackingV2RecordingObjectStore } from "../src/tracking/v2/recording-config";
import { createDbTrackingV2RecordingRepository } from "../src/tracking/v2/recording-repository";
import { createTrackingV2RetentionService } from "../src/tracking/v2/retention";
import { runTrackingV2RetentionUntilIdle } from "../src/tracking/v2/retention-runner";

const scriptDir = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(scriptDir, "../../../.env"), quiet: true });

const publicUrl = requiredFlag("--public-url");
const sessionCount = integerFlag("--sessions", 1_000, 1, 5_000);
const replaySessionCount = integerFlag("--replay-sessions", 25, 0, sessionCount);
const concurrency = integerFlag("--concurrency", 40, 1, 100);
const startP95BudgetMs = integerFlag("--start-p95-ms", 750, 1, 60_000);
const lifecycleP95BudgetMs = integerFlag("--lifecycle-p95-ms", 1_500, 1, 120_000);
const keepData = process.argv.includes("--keep-data");
const allowRemote = process.argv.includes("--allow-remote");
const target = new URL(publicUrl);

if (!isLoopback(target.hostname) && !allowRemote) {
  throw new TrackingLoadInputError("Remote load tests require --allow-remote.");
}
if (!isLoopback(target.hostname) && !keepData) {
  throw new TrackingLoadInputError("Remote load tests require --keep-data because local cleanup cannot verify them.");
}

const publicHtmlResponse = await fetch(target);
if (!publicHtmlResponse.ok) {
  throw new Error(`Published test site returned ${publicHtmlResponse.status}.`);
}
const publicHtml = await publicHtmlResponse.text();
const contextToken = readJsonAttribute(publicHtml, ["data-handout-consent-bootstrap", "data-handout-tracking-v2"], "contextToken");
const initialPageId = readAttribute(publicHtml, "data-handout-page-id");
if (!contextToken || !initialPageId) {
  throw new Error("Published test site does not expose a tracking context and initial page.");
}

const startedAt = performance.now();
const heapBefore = process.memoryUsage().heapUsed;
const results = await mapConcurrent(
  Array.from({ length: sessionCount }, (_, index) => index),
  concurrency,
  (index) => runSession({
    contextToken,
    index,
    initialPageId,
    origin: target.origin,
    replay: index < replaySessionCount,
  }),
);
const durationMs = performance.now() - startedAt;
const heapAfter = process.memoryUsage().heapUsed;
const successful = results.filter((result): result is TrackingLoadSuccess => result.ok);
const failures = results.filter((result): result is TrackingLoadFailure => !result.ok);
const startLatencies = successful.map((result) => result.startLatencyMs);
const lifecycleLatencies = successful.map((result) => result.lifecycleLatencyMs);
const report: TrackingLoadReport = {
  ok: failures.length === 0,
  target: target.origin,
  sessionsRequested: sessionCount,
  sessionsCompleted: successful.length,
  replaySessionsRequested: replaySessionCount,
  concurrency,
  durationMs: round(durationMs),
  sessionsPerSecond: round(successful.length / (durationMs / 1_000)),
  startLatencyMs: latencySummary(startLatencies),
  lifecycleLatencyMs: latencySummary(lifecycleLatencies),
  clientHeapDeltaBytes: heapAfter - heapBefore,
  errors: failures.slice(0, 10).map((failure) => failure.error),
};

if (isLoopback(target.hostname)) {
  const database = await import("@handout/db");
  try {
    report.database = await verifyDatabase(successful, database);
    if (!keepData) report.cleanup = await cleanup(successful, database);
  } finally {
    await database.queryClient.end();
  }
}

{
  const databaseVerified = !isLoopback(target.hostname)
    || (report.database?.sessionsCreated === successful.length
      && report.database.siteVisitEventsCreated === successful.length
      && report.database.recordingChunksCreated === replaySessionCount);
  report.ok = report.ok
    && report.startLatencyMs.p95 <= startP95BudgetMs
    && report.lifecycleLatencyMs.p95 <= lifecycleP95BudgetMs
    && databaseVerified
    && (keepData || report.cleanup?.sessionsDeleted === successful.length)
    && (keepData || report.cleanup?.recordingObjectDeletionBacklog === 0);
}

console.log(JSON.stringify(report, null, 2));
if (!report.ok) process.exitCode = 1;

type TrackingLoadSuccess = {
  ok: true;
  publicSessionId: string;
  startLatencyMs: number;
  lifecycleLatencyMs: number;
};

type TrackingLoadFailure = { ok: false; error: string };

type TrackingLoadReport = {
  ok: boolean;
  target: string;
  sessionsRequested: number;
  sessionsCompleted: number;
  replaySessionsRequested: number;
  concurrency: number;
  durationMs: number;
  sessionsPerSecond: number;
  startLatencyMs: ReturnType<typeof latencySummary>;
  lifecycleLatencyMs: ReturnType<typeof latencySummary>;
  clientHeapDeltaBytes: number;
  errors: string[];
  database?: Awaited<ReturnType<typeof verifyDatabase>>;
  cleanup?: Awaited<ReturnType<typeof cleanup>>;
};

async function runSession(input: {
  contextToken: string;
  index: number;
  initialPageId: string;
  origin: string;
  replay: boolean;
}): Promise<TrackingLoadSuccess | TrackingLoadFailure> {
  const lifecycleStartedAt = performance.now();
  const requestStartedAt = performance.now();
  const timestamp = new Date().toISOString();
  const headers = requestHeaders(input.origin, input.index);

  try {
    const response = await fetch(new URL(TRACKING_V2_SESSION_START_ENDPOINT, input.origin), {
      method: "POST",
      headers,
      body: JSON.stringify({
        contextToken: input.contextToken,
        requestId: `load-request-${crypto.randomUUID()}`,
        startedAt: timestamp,
        initialPageId: input.initialPageId,
        ...(input.replay ? {
          replayConsent: {
            noticeVersion: TRACKING_V2_VISITOR_NOTICE_VERSION,
            grantedAt: timestamp,
            source: "prompt",
          },
        } : {}),
      }),
    });
    const startLatencyMs = performance.now() - requestStartedAt;
    const body = await response.json().catch(() => null);
    if (!response.ok) throw new Error(`Session start returned ${response.status}.`);
    const started = trackingV2SessionStartResponseSchema.parse(body);
    if (!started.accepted) throw new Error(`Session start was ${started.reason}.`);

    await expectStatus(fetch(new URL(TRACKING_V2_SESSION_HEARTBEAT_ENDPOINT, input.origin), {
      method: "POST",
      headers,
      body: JSON.stringify({
        sessionId: started.sessionId,
        eventToken: started.eventToken,
        occurredAt: new Date().toISOString(),
        activeMs: 250,
      }),
    }), 204, "heartbeat");

    if (input.replay) {
      if (!started.recording.enabled) throw new Error("Replay was not accepted for a replay load session.");
      const replayTimestamp = Date.now();
      await expectStatus(fetch(new URL(started.recording.chunkEndpoint, input.origin), {
        method: "POST",
        headers: {
          ...headers,
          authorization: `Bearer ${started.recording.uploadToken}`,
        },
        body: JSON.stringify({
          schemaVersion: TRACKING_V2_RECORDING_SCHEMA_VERSION,
          sessionId: started.sessionId,
          sequence: 0,
          events: [{ type: 2, timestamp: replayTimestamp, data: {} }],
        }),
      }), 201, "replay chunk");
      await expectStatus(fetch(new URL(started.recording.completeEndpoint, input.origin), {
        method: "POST",
        headers: {
          ...headers,
          authorization: `Bearer ${started.recording.uploadToken}`,
        },
        body: JSON.stringify({
          schemaVersion: TRACKING_V2_RECORDING_SCHEMA_VERSION,
          sessionId: started.sessionId,
          finalSequence: 0,
          endedAt: new Date().toISOString(),
          stopReason: "pagehide",
        }),
      }), 200, "replay completion");
    }

    await expectStatus(fetch(new URL(TRACKING_V2_SESSION_END_ENDPOINT, input.origin), {
      method: "POST",
      headers,
      body: JSON.stringify({
        sessionId: started.sessionId,
        eventToken: started.eventToken,
        occurredAt: new Date().toISOString(),
        reason: "pagehide",
        activeMs: 250,
      }),
    }), 204, "session end");

    return {
      ok: true,
      publicSessionId: started.sessionId,
      startLatencyMs: round(startLatencyMs),
      lifecycleLatencyMs: round(performance.now() - lifecycleStartedAt),
    };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

type HandoutDatabaseModule = typeof import("@handout/db");

async function verifyDatabase(results: TrackingLoadSuccess[], database: HandoutDatabaseModule) {
  const { db, trackingRecipientEvents, trackingRecipientSessions, trackingRecordingChunks } = database;
  if (results.length === 0) {
    return { sessionsCreated: 0, siteVisitEventsCreated: 0, recordingChunksCreated: 0 };
  }
  const publicSessionIds = results.map((result) => result.publicSessionId);
  const sessions = await db.select({ id: trackingRecipientSessions.id })
    .from(trackingRecipientSessions)
    .where(inArray(trackingRecipientSessions.publicSessionId, publicSessionIds));
  const internalSessionIds = sessions.map((session) => session.id);
  const [events] = await db.select({ count: sql<number>`count(*)::int` })
    .from(trackingRecipientEvents)
    .where(inArray(trackingRecipientEvents.sessionId, internalSessionIds));
  const [chunks] = await db.select({ count: sql<number>`count(*)::int` })
    .from(trackingRecordingChunks)
    .where(inArray(trackingRecordingChunks.sessionId, internalSessionIds));
  return {
    sessionsCreated: sessions.length,
    siteVisitEventsCreated: events?.count ?? 0,
    recordingChunksCreated: chunks?.count ?? 0,
  };
}

async function cleanup(results: TrackingLoadSuccess[], database: HandoutDatabaseModule) {
  const {
    db,
    trackingRecipientSessions,
    trackingRecordingObjectDeletions,
  } = database;
  const ids = results.map((result) => result.publicSessionId);
  let sessionsDeleted = 0;
  for (const batch of chunks(ids, 500)) {
    sessionsDeleted += (await db.delete(trackingRecipientSessions)
      .where(inArray(trackingRecipientSessions.publicSessionId, batch))
      .returning({ id: trackingRecipientSessions.id })).length;
  }

  const objectStore = createConfiguredTrackingV2RecordingObjectStore(
    parseTrackingReplayStorageEnv(process.env),
  );
  if (objectStore) {
    await runTrackingV2RetentionUntilIdle({
      service: createTrackingV2RetentionService({
        repository: createDbTrackingV2Repository(db),
        recording: {
          objectStore,
          repository: createDbTrackingV2RecordingRepository(db),
        },
      }),
      batchSize: 1_000,
      maxBatches: 20,
    });
  }
  const [deletions] = await db.select({ count: sql<number>`count(*)::int` })
    .from(trackingRecordingObjectDeletions);
  return {
    sessionsDeleted,
    recordingObjectDeletionBacklog: deletions?.count ?? 0,
  };
}

function requestHeaders(origin: string, index: number) {
  const host = 1 + (index % 250);
  const subnet = Math.floor(index / 250) % 2;
  return {
    "content-type": "application/json",
    "origin": origin,
    "user-agent": "Handout tracking load verification",
    "x-forwarded-for": `198.${18 + subnet}.0.${host}`,
  };
}

async function expectStatus(responsePromise: Promise<Response>, expected: number, label: string) {
  const response = await responsePromise;
  if (response.status !== expected) throw new Error(`${label} returned ${response.status}.`);
}

function latencySummary(values: number[]) {
  if (values.length === 0) return { p50: 0, p95: 0, p99: 0, max: 0 };
  const sorted = [...values].sort((left, right) => left - right);
  return {
    p50: percentile(sorted, 0.5),
    p95: percentile(sorted, 0.95),
    p99: percentile(sorted, 0.99),
    max: round(sorted.at(-1) ?? 0),
  };
}

function percentile(sorted: number[], percentileValue: number) {
  return round(sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * percentileValue) - 1)] ?? 0);
}

async function mapConcurrent<TInput, TOutput>(
  values: TInput[],
  limit: number,
  operation: (value: TInput) => Promise<TOutput>,
) {
  const output = new Array<TOutput>(values.length);
  let nextIndex = 0;
  await Promise.all(Array.from({ length: Math.min(limit, values.length) }, async () => {
    while (nextIndex < values.length) {
      const index = nextIndex++;
      output[index] = await operation(values[index]!);
    }
  }));
  return output;
}

function readJsonAttribute(html: string, attributeNames: string[], key: string) {
  for (const attributeName of attributeNames) {
    const value = readAttribute(html, attributeName);
    if (!value) continue;
    try {
      const parsed = JSON.parse(value) as Record<string, unknown>;
      if (typeof parsed[key] === "string") return parsed[key];
    } catch {
      continue;
    }
  }
  return null;
}

function readAttribute(html: string, attributeName: string) {
  const document = parse(html) as unknown as HtmlNode;
  const pending: HtmlNode[] = [document];
  while (pending.length > 0) {
    const node = pending.pop()!;
    const attribute = node.attrs?.find((candidate) => candidate.name === attributeName);
    if (attribute) return attribute.value;
    pending.push(...(node.childNodes ?? []));
  }
  return null;
}

type HtmlNode = {
  attrs?: Array<{ name: string; value: string }>;
  childNodes?: HtmlNode[];
};

function chunks<T>(values: T[], size: number) {
  return Array.from({ length: Math.ceil(values.length / size) }, (_, index) =>
    values.slice(index * size, (index + 1) * size));
}

function requiredFlag(name: string) {
  const index = process.argv.indexOf(name);
  const value = index >= 0 ? process.argv[index + 1]?.trim() : "";
  if (!value) throw new TrackingLoadInputError(`${name} is required.`);
  return value;
}

function integerFlag(name: string, fallback: number, min: number, max: number) {
  const index = process.argv.indexOf(name);
  if (index < 0) return fallback;
  const value = Number(process.argv[index + 1]);
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new TrackingLoadInputError(`${name} must be an integer between ${min} and ${max}.`);
  }
  return value;
}

function isLoopback(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

function round(value: number) {
  return Math.round(value * 100) / 100;
}

class TrackingLoadInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TrackingLoadInputError";
  }
}
