import type { TrackingBatch } from "@lightsite/tracking-schema";

export type TrackingEventSource =
  | "browser"
  | "preview_html"
  | "preview_og_image";

export type TrackingEventSinkRecordOptions = {
  source: TrackingEventSource;
};

export interface TrackingEventSink {
  record(batch: TrackingBatch, options: TrackingEventSinkRecordOptions): Promise<void>;
}

export function createNoopTrackingEventSink(): TrackingEventSink {
  return {
    async record() {
      // Persistence is owned by the future tracking repository/worker path.
    },
  };
}
