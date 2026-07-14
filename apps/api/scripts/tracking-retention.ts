import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseTrackingReplayStorageEnv } from "@handout/config";
import { config } from "dotenv";
import { createDbTrackingV2Repository } from "../src/tracking/v2/repository";
import { createConfiguredTrackingV2RecordingObjectStore } from "../src/tracking/v2/recording-config";
import { createDbTrackingV2RecordingRepository } from "../src/tracking/v2/recording-repository";
import {
  createTrackingV2RetentionService,
  TrackingV2RetentionInputError,
} from "../src/tracking/v2/retention";
import {
  runTrackingV2RetentionUntilIdle,
  TrackingV2RetentionUnhealthyError,
} from "../src/tracking/v2/retention-runner";

const scriptDir = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(scriptDir, "../../../.env"), quiet: true });

async function main() {
  const { db, queryClient } = await import("@handout/db");
  const batchSize = readPositiveIntegerFlag("--batch-size") ?? 500;
  const maxBatches = readPositiveIntegerFlag("--max-batches") ?? 20;

  try {
    const objectStore = createConfiguredTrackingV2RecordingObjectStore(
      parseTrackingReplayStorageEnv(process.env),
    );
    const service = createTrackingV2RetentionService({
      repository: createDbTrackingV2Repository(db),
      ...(objectStore ? {
        recording: {
          objectStore,
          repository: createDbTrackingV2RecordingRepository(db),
        },
      } : {}),
    });
    try {
      console.log(JSON.stringify(await runTrackingV2RetentionUntilIdle({
        service,
        batchSize,
        maxBatches,
      }), null, 2));
    } catch (error) {
      if (error instanceof TrackingV2RetentionUnhealthyError) {
        console.log(JSON.stringify(error.result, null, 2));
      }
      throw error;
    }
  } finally {
    await queryClient.end();
  }
}

function readPositiveIntegerFlag(name: string) {
  const index = process.argv.indexOf(name);

  if (index === -1) {
    return undefined;
  }

  const value = process.argv[index + 1];
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new TrackingV2RetentionInputError(`${name} must be a positive integer.`);
  }

  return parsed;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
