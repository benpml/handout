import path from "node:path";

import type { TrackingReplayStorageEnv } from "@handout/config";
import {
  createFileTrackingV2RecordingObjectStore,
  createS3TrackingV2RecordingObjectStore,
  type TrackingV2RecordingObjectStore,
} from "./recording-object-store";

export function createConfiguredTrackingV2RecordingObjectStore(
  config: TrackingReplayStorageEnv,
): TrackingV2RecordingObjectStore | null {
  if (config.TRACKING_REPLAY_STORAGE === "off") return null;
  if (config.TRACKING_REPLAY_STORAGE === "local") {
    if (config.NODE_ENV === "production") {
      throw new Error("TRACKING_REPLAY_STORAGE=local is not supported in production.");
    }
    return createFileTrackingV2RecordingObjectStore(
      config.TRACKING_REPLAY_LOCAL_DIR ?? path.resolve(process.cwd(), ".local/tracking-replays"),
    );
  }
  return createS3TrackingV2RecordingObjectStore({
    bucket: config.TRACKING_REPLAY_S3_BUCKET!,
    region: config.TRACKING_REPLAY_S3_REGION!,
    ...(config.TRACKING_REPLAY_S3_ENDPOINT ? { endpoint: config.TRACKING_REPLAY_S3_ENDPOINT } : {}),
    ...(config.TRACKING_REPLAY_S3_ACCESS_KEY_ID ? { accessKeyId: config.TRACKING_REPLAY_S3_ACCESS_KEY_ID } : {}),
    ...(config.TRACKING_REPLAY_S3_SECRET_ACCESS_KEY ? { secretAccessKey: config.TRACKING_REPLAY_S3_SECRET_ACCESS_KEY } : {}),
    forcePathStyle: config.TRACKING_REPLAY_S3_FORCE_PATH_STYLE,
    ...(config.TRACKING_REPLAY_S3_KEY_PREFIX ? { keyPrefix: config.TRACKING_REPLAY_S3_KEY_PREFIX } : {}),
  });
}
