import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

async function render(path = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${path}`, {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the complete Handout marketing page", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Handout — Build one pagers that close prospects<\/title>/i);
  assert.match(html, /<img src="\/handout-logo\.svg" alt="Handout"/i);
  assert.match(html, /Build one pagers that close prospects\./);
  assert.match(html, /https:\/\/app\.handout\.link\/auth\?mode=sign-up/);
  assert.match(html, /handout\.link\/acme\/launch-plan/);
  assert.match(html, /https:\/\/www\.handout\.link\/og\.png/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton/i);
});

test("ships only Handout production assets and metadata", async () => {
  const [page, layout, packageJson] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(page, /const appOrigin = "https:\/\/app\.handout\.link"/);
  assert.match(page, /\/handout-logo\.svg/);
  assert.match(layout, /metadataBase: new URL\("https:\/\/www\.handout\.link"\)/);
  assert.match(layout, /title: "Handout — Build one pagers that close prospects"/);
  assert.match(packageJson, /"name": "handout-marketing"/);
  assert.doesNotMatch(page, /codex-preview|_sites-preview|SkeletonPreview/);
  assert.doesNotMatch(layout, /codex-preview|_sites-preview/);

  await Promise.all([
    access(new URL("../public/handout-logo.svg", import.meta.url)),
    access(new URL("../public/favicon.svg", import.meta.url)),
    access(new URL("../public/og.png", import.meta.url)),
  ]);
  await assert.rejects(access(new URL("../app/_sites-preview", import.meta.url)));
});
