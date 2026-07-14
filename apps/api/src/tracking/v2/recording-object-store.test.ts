import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { createFileTrackingV2RecordingObjectStore } from "./recording-object-store";

const directories: string[] = [];

afterEach(async () => {
  await Promise.all(directories.splice(0).map((directory) => rm(directory, { force: true, recursive: true })));
});

describe("tracking recording file object store", () => {
  it("writes atomically, reads gzip metadata, and deletes idempotently", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "handout-replay-"));
    directories.push(directory);
    const store = createFileTrackingV2RecordingObjectStore(directory);
    const object = {
      key: "tracking/v2/workspaces/workspace/recordings/recording/chunks/000000.json.gz",
      body: Buffer.from([0x1f, 0x8b, 0x01, 0x02]),
      contentType: "application/json; charset=utf-8",
      contentEncoding: "gzip" as const,
    };
    await store.putObject(object);
    await store.putObject(object);
    await expect(store.getObject(object.key)).resolves.toMatchObject({
      body: object.body,
      contentEncoding: "gzip",
    });
    await store.deleteObject(object.key);
    await store.deleteObject(object.key);
    await expect(store.getObject(object.key)).resolves.toBeNull();
  });

  it("rejects traversal and conflicting idempotency keys", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "handout-replay-"));
    directories.push(directory);
    const store = createFileTrackingV2RecordingObjectStore(directory);
    const key = "tracking/chunk.json.gz";
    await store.putObject({ key, body: Buffer.from("first"), contentType: "application/json", contentEncoding: null });
    await expect(store.putObject({ key, body: Buffer.from("second"), contentType: "application/json", contentEncoding: null }))
      .rejects.toThrow("different data");
    await expect(store.putObject({ key: "../outside", body: Buffer.from("x"), contentType: "text/plain", contentEncoding: null }))
      .rejects.toThrow("Invalid recording object key");
  });
});
