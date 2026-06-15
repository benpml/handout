import { gzipSync } from "node:zlib";
import { readdir, readFile, stat } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const MAX_PUBLIC_SITE_CHUNK_BYTES = 25 * 1024;
const MAX_PUBLIC_SITE_CHUNK_GZIP_BYTES = 9 * 1024;

const scriptDir = dirname(fileURLToPath(import.meta.url));
const webRoot = resolve(scriptDir, "..");
const assetsDir = resolve(webRoot, "dist/assets");

const files = await readdir(assetsDir);
const publicSiteChunks = files.filter((file) => /^public-site-page-.+\.js$/.test(file));

if (publicSiteChunks.length === 0) {
  fail("Could not find a public-site-page bundle. Run `pnpm --filter @lightsite/web build` first.");
}

const publicSiteChunk = await getNewestFile(publicSiteChunks);
const source = await readFile(resolve(assetsDir, publicSiteChunk));
const gzipSize = gzipSync(source).byteLength;

assertBudget({
  label: "public-site-page minified",
  actual: source.byteLength,
  max: MAX_PUBLIC_SITE_CHUNK_BYTES,
});
assertBudget({
  label: "public-site-page gzip",
  actual: gzipSize,
  max: MAX_PUBLIC_SITE_CHUNK_GZIP_BYTES,
});

console.log(
  [
    "Public bundle budget passed:",
    `${publicSiteChunk}`,
    `${formatBytes(source.byteLength)} minified`,
    `${formatBytes(gzipSize)} gzip`,
  ].join(" "),
);

async function getNewestFile(fileNames) {
  const filesWithStats = await Promise.all(
    fileNames.map(async (fileName) => ({
      fileName,
      stats: await stat(resolve(assetsDir, fileName)),
    })),
  );

  return filesWithStats
    .sort((left, right) => right.stats.mtimeMs - left.stats.mtimeMs)[0]
    .fileName;
}

function assertBudget({ actual, label, max }) {
  if (actual <= max) {
    return;
  }

  fail(`${label} is ${formatBytes(actual)}, above the ${formatBytes(max)} budget.`);
}

function formatBytes(value) {
  return `${(value / 1024).toFixed(2)} kB`;
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
