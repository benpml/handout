import { chromium, type Request } from "playwright";
import {
  TRACKING_V2_EVENTS_ENDPOINT,
  TRACKING_V2_SESSION_START_ENDPOINT,
} from "@handout/tracking-schema";

const publicUrl = process.env.TRACKING_SMOKE_PUBLIC_URL;
if (!publicUrl) {
  throw new Error("TRACKING_SMOKE_PUBLIC_URL must point to a published recipient site.");
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const trackingRequests: Array<{ path: string; body: Record<string, unknown> }> = [];

page.on("request", (request) => {
  const url = new URL(request.url());
  if (url.pathname !== TRACKING_V2_SESSION_START_ENDPOINT && url.pathname !== TRACKING_V2_EVENTS_ENDPOINT) return;
  const body = parseBody(request);
  if (body) trackingRequests.push({ path: url.pathname, body });
});

try {
  await page.goto(publicUrl, { waitUntil: "networkidle" });
  const allowTrackingButton = page.locator('[data-handout-consent="allow"]');
  if (await allowTrackingButton.count() > 0) {
    await allowTrackingButton.first().click();
  }
  await page.locator('[data-handout-track="tab"]').nth(1).click({ timeout: 2_000 }).catch(() => undefined);
  await page.locator('[data-handout-track="button"],[data-handout-track="link"]').first().click({
    modifiers: ["ControlOrMeta"],
    timeout: 2_000,
  }).catch(() => undefined);
  await page.waitForTimeout(1_000);

  const start = trackingRequests.find((request) => request.path === TRACKING_V2_SESSION_START_ENDPOINT);
  assert(start, "No tracking session-start request was observed.");
  const expectedStartKeys = ["contextToken", "initialPageId", "requestId", "startedAt"];
  if ("replayConsent" in start.body) {
    assert(isRecord(start.body.replayConsent), "Replay consent must be an object.");
    assertExactKeys(start.body.replayConsent, ["grantedAt", "noticeVersion", "source"]);
    expectedStartKeys.push("replayConsent");
  }
  assertExactKeys(start.body, expectedStartKeys);

  for (const request of trackingRequests.filter((candidate) => candidate.path === TRACKING_V2_EVENTS_ENDPOINT)) {
    assertExactKeys(request.body, ["batchId", "eventToken", "events", "scriptVersion", "sentAt", "sessionId"]);
    const events = Array.isArray(request.body.events) ? request.body.events : [];
    for (const event of events) {
      assert(isRecord(event), "Tracking events must be objects.");
      const allowed = event.type === "tab_switch"
        ? ["eventId", "fromPageId", "occurredAt", "sequence", "toPageId", "trigger", "type"]
        : ["elementId", "eventId", "occurredAt", "pageId", "sequence", "type"];
      assertExactKeys(event, allowed);
    }
  }

  const serialized = JSON.stringify(trackingRequests).toLowerCase();
  for (const prohibited of ["href", "label", "ipaddress", "deviceid", "referrer", "recording", "rrweb"]) {
    assert(!serialized.includes(prohibited), `Tracking payload unexpectedly contained ${prohibited}.`);
  }
  console.log(JSON.stringify({ ok: true, requestsObserved: trackingRequests.length }, null, 2));
} finally {
  await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent("pagehide"))).catch(() => undefined);
  await page.waitForTimeout(250).catch(() => undefined);
  await browser.close();
}

function parseBody(request: Request) {
  try {
    const value = request.postDataJSON();
    return isRecord(value) ? value : null;
  } catch {
    return null;
  }
}

function assertExactKeys(value: Record<string, unknown>, expected: string[]) {
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  assert(JSON.stringify(actual) === JSON.stringify(wanted), `Unexpected payload keys: ${actual.join(", ")}`);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}
