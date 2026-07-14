import { describe, expect, it } from "vitest"
import type { TrackingV2EventFeedItem, TrackingV2SessionSummary } from "@handout/tracking-schema"

import {
  buildTrackingDashboardSummary,
  dedupeTrackingV2Events,
  dedupeTrackingV2Sessions,
  filterTrackingV2EventsByQuery,
} from "./model"

const site = { id: "11111111-1111-4111-8111-111111111111", name: "Launch Plan", slug: "launch-plan" }
const recipient = {
  id: "22222222-2222-4222-8222-222222222222",
  name: "Maya at Linear",
  recipientCompany: "Linear",
  recipientName: "Maya",
  slug: "linear-maya",
  website: "linear.app",
}
const device = { browser: "Chrome", os: "macOS", type: "desktop" }
const location = { city: "Tampa", countryCode: "US", region: "FL" }

describe("tracking dashboard model", () => {
  it("builds metrics and safe destination rankings", () => {
    const clickElement = {
      destinationHost: "linear.app",
      destinationKind: "external_web" as const,
      id: "sidebar-pricing",
      kind: "sidebar_link" as const,
      label: "Pricing",
    }
    const events = [
      trackingEvent({ id: "33333333-3333-4333-8333-333333333331", type: "site_visit" }),
      trackingEvent({ id: "33333333-3333-4333-8333-333333333332", type: "link_click", element: clickElement }),
      trackingEvent({ id: "33333333-3333-4333-8333-333333333333", type: "link_click", element: clickElement }),
      trackingEvent({
        id: "33333333-3333-4333-8333-333333333334",
        session: null,
        sessionId: null,
        source: "slack_og_image",
        type: "slack_share",
      }),
    ]
    const summary = buildTrackingDashboardSummary({
      events,
      sessions: [trackingSession({ activeMs: 120_000 })],
    })

    expect(summary.metrics).toEqual({
      averageActiveMs: 120_000,
      clicks: 2,
      sessions: 1,
      slackShares: 1,
      visits: 1,
    })
    expect(summary.topClickedElements).toEqual([{
      clickCount: 2,
      detail: "linear.app",
      key: "sidebar_link:sidebar-pricing",
      kind: "sidebar_link",
      label: "Pricing",
    }])
    expect(summary.recipientActivity[0]).toMatchObject({ clicks: 2, name: "Maya", sessions: 1, slackShares: 1, visits: 1 })
  })

  it("filters by recipient, safe element metadata, device, and approximate location", () => {
    const click = trackingEvent({
      element: {
        destinationHost: "linear.app",
        destinationKind: "external_web",
        id: "sidebar-pricing",
        kind: "sidebar_link",
        label: "Pricing",
      },
      type: "link_click",
    })
    const visit = trackingEvent()
    expect(filterTrackingV2EventsByQuery([click, visit], "linear pricing")).toEqual([click])
    expect(filterTrackingV2EventsByQuery([click, visit], "tampa chrome")).toEqual([click, visit])
  })

  it("dedupes paginated records by stable IDs", () => {
    const event = trackingEvent()
    const session = trackingSession()
    expect(dedupeTrackingV2Events([event, event])).toEqual([event])
    expect(dedupeTrackingV2Sessions([session, session])).toEqual([session])
  })
})

function trackingEvent(overrides: Partial<TrackingV2EventFeedItem> = {}): TrackingV2EventFeedItem {
  const sessionId = overrides.sessionId === undefined ? "session_0001" : overrides.sessionId
  return {
    element: null,
    eventId: "event_0001",
    id: "33333333-3333-4333-8333-333333333330",
    occurredAt: "2026-07-12T15:00:00.000Z",
    receivedAt: "2026-07-12T15:00:01.000Z",
    recipient,
    session: sessionId ? {
      device,
      id: sessionId,
      lastSeenAt: "2026-07-12T15:01:00.000Z",
      location,
      startedAt: "2026-07-12T15:00:00.000Z",
      state: "ended",
    } : null,
    sessionId,
    site,
    source: "browser",
    tab: { id: "page-overview", label: "Overview", fromId: null, fromLabel: null },
    type: "site_visit",
    webhook: null,
    ...overrides,
  }
}

function trackingSession(overrides: Partial<TrackingV2SessionSummary> = {}): TrackingV2SessionSummary {
  return {
    activeMs: 60_000,
    device,
    durationMs: 80_000,
    endedAt: "2026-07-12T15:01:20.000Z",
    endReason: "pagehide",
    id: "session_0001",
    initialPage: { id: "page-overview", label: "Overview" },
    lastSeenAt: "2026-07-12T15:01:00.000Z",
    location,
    recipient,
    site,
    startedAt: "2026-07-12T15:00:00.000Z",
    state: "ended",
    ...overrides,
    recording: overrides.recording ?? { status: "disabled", available: false, durationMs: null },
  }
}
