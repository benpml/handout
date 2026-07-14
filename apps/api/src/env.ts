import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseApiEnv } from "@handout/config";
import { config } from "dotenv";

const apiSrcDir = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(apiSrcDir, "../../../.env"), quiet: true });

export const env = parseApiEnv(process.env);
