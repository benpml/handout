import { parseTrackingReplayStorageEnv } from "@handout/config";
import { describe, expect, it } from "vitest";
import { createConfiguredTrackingV2RecordingObjectStore } from "./recording-config";

describe("tracking replay storage configuration", () => {
  it("keeps replay storage disabled when it is not configured", () => {
    expect(createConfiguredTrackingV2RecordingObjectStore(
      parseTrackingReplayStorageEnv({ TRACKING_REPLAY_STORAGE: "off" }),
    )).toBeNull();
  });

  it("forbids ephemeral local replay storage in production", () => {
    expect(() => createConfiguredTrackingV2RecordingObjectStore(
      parseTrackingReplayStorageEnv({
        NODE_ENV: "production",
        TRACKING_REPLAY_STORAGE: "local",
      }),
    )).toThrow("not supported in production");
  });

  it("constructs a private S3-compatible store from isolated job configuration", () => {
    expect(createConfiguredTrackingV2RecordingObjectStore(
      parseTrackingReplayStorageEnv({
        NODE_ENV: "production",
        TRACKING_REPLAY_STORAGE: "s3",
        TRACKING_REPLAY_S3_BUCKET: "handout-session-replays",
        TRACKING_REPLAY_S3_REGION: "auto",
        TRACKING_REPLAY_S3_ENDPOINT: "https://account.r2.cloudflarestorage.com",
        TRACKING_REPLAY_S3_ACCESS_KEY_ID: "access-key",
        TRACKING_REPLAY_S3_SECRET_ACCESS_KEY: "secret-key",
      }),
    )).not.toBeNull();
  });
});
