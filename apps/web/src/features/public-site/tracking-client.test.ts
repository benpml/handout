import { describe, expect, it } from "vitest";
import {
  TRACKING_MAX_BATCH_EVENTS,
  TRACKING_SCRIPT_VERSION,
  type TrackingBatch,
  type TrackingContext,
  type TrackingEvent,
} from "@lightsite/tracking-schema";

import { TrackingQueue } from "./tracking-client";

const trackingContext: TrackingContext = {
  workspaceId: "workspace_test_123",
  siteId: "site_test_123",
  publishedVersionId: "version_test_123",
  variantId: "variant_test_123",
  variantRevision: 3,
  mode: "engagement",
  token: null,
};

describe("TrackingQueue", () => {
  it("flushes events in server-sized batches", () => {
    const sentBatches: TrackingBatch[] = [];
    const queue = new TrackingQueue((batch) => {
      sentBatches.push(batch);
      return true;
    });

    for (let index = 0; index < TRACKING_MAX_BATCH_EVENTS * 2 + 2; index += 1) {
      queue.enqueue(buildViewedEvent(index));
    }

    queue.flush();

    expect(sentBatches.map((batch) => batch.events.length)).toEqual([
      TRACKING_MAX_BATCH_EVENTS,
      TRACKING_MAX_BATCH_EVENTS,
      2,
    ]);
  });

  it("requeues failed batches without allowing the next flush to exceed the batch limit", () => {
    const sentBatches: TrackingBatch[] = [];
    let shouldFail = true;
    const queue = new TrackingQueue((batch) => {
      sentBatches.push(batch);

      if (shouldFail) {
        shouldFail = false;
        return false;
      }

      return true;
    });

    for (let index = 0; index < TRACKING_MAX_BATCH_EVENTS; index += 1) {
      queue.enqueue(buildViewedEvent(index));
    }

    queue.enqueue(buildViewedEvent(99));
    queue.flush();

    expect(sentBatches.map((batch) => batch.events.length)).toEqual([
      TRACKING_MAX_BATCH_EVENTS,
      TRACKING_MAX_BATCH_EVENTS,
      1,
    ]);
    expect(sentBatches.every((batch) => batch.events.length <= TRACKING_MAX_BATCH_EVENTS)).toBe(true);
  });
});

function buildViewedEvent(index: number): TrackingEvent {
  return {
    eventId: `event_test_${index}`,
    type: "site_viewed",
    occurredAt: "2026-06-14T18:00:00.000Z",
    sessionId: "session_test_123",
    context: trackingContext,
    scriptVersion: TRACKING_SCRIPT_VERSION,
    viewport: {
      width: 1440,
      height: 900,
    },
    referrerHost: null,
  };
}
