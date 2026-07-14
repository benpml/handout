# Event Tracking Privacy Hardening Specification

**Status:** Implemented; production launch review pending  
**Scope:** Event and session analytics. Session replay is specified separately.  
**Audience:** Product, engineering, security, privacy, and legal reviewers  
**Last reviewed:** 2026-07-12

## Implementation Status

The event-only application architecture in this specification is implemented as of 2026-07-12:

- ID-only browser contracts, immutable historical manifests, explicit modeled controls, bounded memory-only collection, and server-owned event snapshots
- Event/session/settings/manifest persistence with no raw IP, persistent device identity, path, referrer, full destination, or replay storage
- Transient coarse-location and workspace CIDR processing, ephemeral network rate keys, same-origin enforcement, strict body limits, and partial-batch validation
- Session lifecycle, server expiry, bounded retention, Slack preview signals, webhook delivery event integration, authenticated reads, customer settings, and internal-network controls
- Replay remains isolated from the analytics contract and follows `session-replay-architecture-spec.md`

The following remain production launch gates rather than application-code tasks: CDN/WAF/load-balancer/APM access-log verification, production retention scheduling and alerting, realistic peak-load measurement, backup-expiry confirmation, webhook product integration where customer webhooks are enabled, and final legal/security approval of the deployed configuration and notices.

## 1. Purpose

This document defines a clean replacement for Handout's current public-site event tracking. It turns the seven approved privacy decisions into an implementable system with explicit data contracts, ownership boundaries, failure behavior, migration steps, and acceptance criteria.

The system should answer useful customer questions such as:

- Which recipient site was opened?
- Which modeled Handout button, sidebar link, or tab was used?
- When did the activity happen, and in which session?
- What broad device, operating system, and approximate location were involved?
- Which historical published version and recipient-specific rendering did the visitor see?

It must not become a general browser surveillance system. It must not persistently identify visitors, inspect arbitrary page interactions, store raw IP addresses, or reconstruct sensitive content from the browser.

This is a product and engineering specification, not legal advice. Counsel should review the final product behavior, customer terms, privacy notice, subprocessors, retention defaults, and launch jurisdictions before production release.

## 2. Approved Decisions

The implementation must satisfy all seven decisions together. None is optional.

1. **No persistent browser device ID.** Remove the local-storage identifier and do not replace it with cookies, fingerprinting, cache identifiers, or another cross-session identifier.
2. **Server-owned element identity and labels.** The browser sends stable modeled IDs only. It never extracts or submits visible text. Historical labels are resolved from the exact server-generated tracking manifest used to render the page.
3. **No full click destinations in analytics.** Tracking stores only a server-classified destination category and, when useful and safe, a normalized hostname. It never stores URL paths, queries, fragments, credentials, or ports.
4. **Logical page and tab identity only.** Analytics uses stable Handout page/tab IDs and server-owned display labels. It does not submit or store browser paths, document titles, or referrers.
5. **Explicitly modeled interactions only.** Track only supported Handout components that deliberately expose a tracking ID. Never use generic click listeners to infer arbitrary links, form activity, search, rich-text links, selections, keystrokes, or other DOM behavior.
6. **First-party analytics only.** Collection and processing are for the customer's Handout analytics. No advertising, retargeting, third-party enrichment, cross-customer profiling, sale/sharing for behavioral advertising, or model training. Customer-configured webhooks are a separate, customer-directed server export.
7. **Transient IP processing only.** IP may be used in memory for coarse location, abuse prevention, jurisdiction controls, and internal-network suppression. Raw IP and persistent IP hashes must never be stored in application databases, queues, object storage, analytics, metrics, or application logs.

## 3. Product Boundary

### 3.1 Included event types

| Event | Session-bound | Browser source | Required identity | Server-owned display data |
| --- | --- | --- | --- | --- |
| Site visit | Yes | Session start | Page ID, initial tab ID | Site, page, and tab labels |
| Button click | Yes | Explicit modeled element | Element ID | Element label and destination classification |
| Sidebar link click | Yes | Explicit modeled element | Element ID | Link label and destination classification |
| Tab switch | Yes | Explicit tab control | From/to tab IDs | From/to tab labels |
| Slack preview fetch | No | Server OG-image request | Share token/context | Site and recipient context |
| Webhook send | No | Server webhook worker | Webhook ID and delivery ID | Webhook URL in the webhook configuration surface only |

Webhook analytics must not duplicate secrets or complete webhook URLs into general-purpose event rows. The event stores the webhook ID, delivery status, attempt number, and a safe endpoint hostname snapshot. Authorized webhook settings may continue to display the configured URL from the webhook record itself.

The product may label a Slack preview fetch as a **Slack share signal**, but must not state that a human definitely sent or viewed the link. Slack and intermediary caches can fetch an OG image more than once, long after the original action, or for automated unfurling. Validate the expected Slack fetch signature/user agent, treat it as untrusted and spoofable, and deduplicate by share context plus a bounded time window. Do not attribute Slack server IP, location, device, or user-agent data to the recipient.

### 3.2 Explicitly excluded collection

- Typed, pasted, selected, or submitted form values
- Form-field names or validation errors
- Search queries
- Rich-text links unless the editor later introduces a deliberate, modeled tracked-link node
- Arbitrary anchors, clicks, pointer targets, DOM text, CSS selectors, or DOM paths
- Replay data inside the separately enabled, consent-gated session replay subsystem
- Clipboard activity, keyboard activity, or hover behavior
- Full current URL, previous URL, pathname, document title, or referrer
- Persistent visitor/device identifiers or probabilistic fingerprints
- Raw user-agent strings when a normalized server-derived category is sufficient
- Raw IP addresses or stable IP-derived hashes

### 3.3 Product language

The UI may describe **sessions**, **activity**, and **events**. It must not claim **unique visitors**, **unique people**, or cross-session identity because the system intentionally cannot establish those facts.

## 4. Core Architecture

### 4.1 Trust boundary

The browser is an untrusted event transport, not the source of analytics meaning. It may state that element ID `cta_123` was activated; it may not define that element's label, URL, type, site, recipient, or historical version.

The server owns:

- Workspace, site, recipient, published-version, and recipient-revision context
- Logical page and tab identities
- The set of trackable elements
- Element type, display label, block association, and safe destination classification
- Event authorization, validation, idempotency, timestamps, and retention

### 4.2 Request flow

1. The public-site resolver selects the exact published version and recipient revision.
2. A pure resolver creates one canonical `ResolvedPublishedSite` used by both rendering and tracking-manifest generation.
3. The server retrieves or creates the immutable compact tracking manifest for that resolved site.
4. The rendered page receives a short-lived opaque tracking context bound to the manifest. The DOM receives stable IDs and controlled event types only.
5. Session start exchanges that context for an in-memory session/event token.
6. Browser events submit only IDs and event mechanics.
7. The ingestion service validates each event against the session's manifest and snapshots safe server-owned display fields into the event row.
8. The browser discards the session state when the page lifecycle ends. Reloads and new tabs create new sessions.

### 4.3 Canonical resolved-site model

Rendering and manifest generation must share the same pure resolution layer. This avoids the highest-risk correctness failure: analytics describing a different element than the visitor saw.

The canonical resolver must own:

- Recipient-variable substitution
- Visibility and conditional-content decisions
- Stable page, tab, block, and element identities
- Human-readable label derivation and normalization
- Destination parsing and classification
- Supported trackable-component rules

Stable IDs are document identity, not labels. Creating a trackable node assigns a new opaque ID; editing or moving it preserves that ID; duplicating it generates a new ID; deleting and recreating it does not reuse the old ID. Existing IDs must never be derived from mutable text, position, URL, or array index.

The renderer consumes the resolved model to produce HTML. The manifest builder consumes the same model to produce analytics metadata. Neither independently reimplements variable substitution, visibility, labels, or URL classification.

## 5. Historical Tracking Manifest

### 5.1 Why it is required

Published site versions already preserve immutable document content, but recipient values can change after publication. A stable element ID by itself therefore cannot reliably recover what a particular recipient saw in the past. Each rendered recipient/version combination needs an immutable, compact display dictionary.

The manifest is not a duplicate site version. It contains only the safe IDs and display snapshots required to validate and explain analytics.

### 5.2 Manifest identity

A manifest is uniquely identified by:

- `publishedVersionId`
- `recipientId`, nullable for non-recipient public rendering
- `recipientRevision`, nullable when no recipient applies
- `schemaVersion`

Because SQL nullable uniqueness can permit duplicates, use separate partial unique indexes for recipient and non-recipient manifests.

`recipientRevision` already exists as `siteVariants.revisionNumber` and must remain the rendering boundary. Verify that it increments in the same transaction as every recipient field or variable change that can affect public rendering. The public resolver must read recipient data and revision from one consistent database snapshot. A revision must never be reused for different render-affecting values.

### 5.3 Proposed table

`tracking_event_manifests`

| Column | Purpose |
| --- | --- |
| `id` | Opaque primary key |
| `workspace_id` | Ownership and deletion boundary |
| `site_id` | Query and deletion boundary |
| `published_version_id` | Exact immutable published document |
| `recipient_id` | Exact recipient context, nullable |
| `recipient_revision` | Exact recipient-value revision, nullable |
| `schema_version` | Manifest contract version |
| `source_hash` | Deterministic hash of the sanitized canonical manifest payload |
| `payload` | Compact validated JSON manifest |
| `created_at` | Audit and retention time |

The payload contains:

- Site, page, and tab IDs with normalized display labels
- Supported element IDs, controlled element type, block ID when useful, normalized label, destination category, and optional hostname
- No recipient variable map, arbitrary content, complete URLs, paths, queries, fragments, form data, or DOM data. A whitelisted display label may contain a resolved value that was visibly part of that label; it is therefore retained personal data and follows event/session retention.

### 5.4 Manifest invariants

- Maximum 500 tracked elements per rendered site.
- Maximum serialized payload size 128 KiB.
- Labels are trimmed, whitespace-collapsed, stripped of control and bidirectional override characters, and capped at 180 characters.
- Destination hostnames are lowercased, converted to a canonical ASCII representation, stripped of trailing dots, and stored without credentials, path, query, fragment, or port.
- Destination categories are a closed enum such as `external_web`, `email`, `phone`, `calendar`, `download`, `internal_tab`, or `other`.
- Element IDs are unique within a manifest. Duplicate IDs make the manifest invalid and disable tracking for that render.
- `source_hash` covers only the sanitized canonical manifest payload. It must never hash hidden document content, full recipient values, secrets, or complete URLs.
- The same manifest identity must always produce the same `source_hash`. A different hash for the same key is an invariant violation: do not overwrite it, do not guess, disable tracking for that render, and alert engineering.

### 5.5 Creation and caching

Manifest creation is lazy during public-site resolution:

1. Resolve the exact published document and recipient revision.
2. Build the deterministic compact manifest.
3. Read by unique identity or insert idempotently.
4. Verify the stored source hash before issuing tracking context.

Use a bounded in-process cache only as an optimization, for example 1,000 manifests with a 10-minute TTL. The database remains authoritative. Cache keys contain opaque IDs, not customer labels or recipient data.

If the manifest cannot be generated or persisted, the site still renders and works with tracking disabled. Analytics must never become a page-availability dependency.

### 5.6 Version and deletion behavior

- A session is permanently bound to the manifest used for its render.
- Republishing does not reinterpret an existing session against the new version.
- A short-lived valid context for a recently superseded version may start a session if the site, workspace, recipient, and tracking setting remain active.
- The current start-time check that requires the recipient revision to equal the latest revision must be replaced with manifest-bound validation. Recipient status is checked against the current record, while event meaning comes from the immutable historical manifest.
- Unknown, deleted, or expired manifest context never falls back to the current published version.
- Historical event and session rows contain safe display snapshots, so they remain understandable without retaining a manifest forever.
- Deleting a published version must not cascade-delete historical sessions. The current session foreign-key behavior must be changed to a nullable `SET NULL` relationship or an equivalent coordinated archival policy.
- Deleting the owning site or workspace continues to delete all owned tracking records according to the product deletion policy.

## 6. Browser Contract

### 6.1 Storage and lifecycle

Tracking must use no `localStorage`, `sessionStorage`, IndexedDB, cookies, cache identifiers, or service-worker storage. Session ID and tokens exist only in page memory.

Consequences are intentional:

- A reload starts a new session.
- A new browser tab starts a new session.
- Restored browser state may start a new session.
- Cross-session visitor deduplication is unavailable.

### 6.2 DOM attributes

Supported controls may render attributes equivalent to:

```html
data-handout-track-type="button"
data-handout-element-id="cta_123"
```

Do not render analytics labels or analytics destinations into tracking attributes. An anchor still needs its real `href` to function, but the tracking script must never read or submit it.

The click handler must use explicit supported selectors. It must not fall back to `textContent`, `closest('a')`, document-wide generic anchors, DOM paths, CSS selectors, or inferred semantics.

### 6.3 Session-start request

The request contains only:

- Opaque render context
- Client-generated session-start request ID for retry idempotency
- Client start time as advisory data
- Logical initial page ID and tab ID, when the page supports them
- Optional coarse viewport class, if product requirements justify it

It contains no device ID, raw user agent supplied by JavaScript, locale, timezone, path, title, referrer, or IP field.

The server may normalize the HTTP user-agent or trusted client-hint headers into a small device/browser/OS taxonomy, then immediately discard the raw value from product processing. It must not persist or log the raw header.

### 6.4 Browser event envelope

Every event contains:

- `eventId`: random per-event idempotency key
- `type`: closed event enum
- `occurredAt`: advisory client time within a bounded acceptance window
- `sequence`: monotonically increasing within the page-memory session

Type-specific data:

- Button or sidebar-link click: `elementId`
- Tab switch: `fromTabId`, `toTabId`, and controlled trigger enum
- Site visit: created server-side from accepted session start

There is no arbitrary `data`, metadata, label, URL, pathname, title, referrer, CSS selector, or DOM snapshot field.

### 6.5 Batching and delivery

- Batch up to 20 events or approximately 8 KiB, whichever comes first.
- Flush on a short timer and on lifecycle transitions using `sendBeacon` or `fetch(..., { keepalive: true })` where supported.
- Keep the in-memory queue bounded. On overflow, discard the oldest noncritical interaction and increment an in-memory diagnostic only.
- Do not persist failed events in the browser.
- Event loss is acceptable when the alternative is navigation delay, persistent tracking state, or unbounded retries.
- Never block the visitor's click, tab switch, or navigation while waiting for analytics.

## 7. Server Ingestion and Data Model

### 7.1 Validation order

For each request:

1. Apply body-size and batch-count limits before parsing deeply.
2. Verify same-origin policy, token signature, expiry, audience, and session binding.
3. Load the session and its manifest once.
4. Re-check that site tracking is enabled and ownership remains active.
5. Validate each event's schema, time window, sequence, ID, element type, and manifest membership.
6. Resolve server-owned display metadata from the manifest.
7. Insert accepted events idempotently.
8. Return aggregate accepted and rejected counts without revealing manifest contents.

One invalid event must not discard unrelated valid events in the same batch. Rejection reasons are controlled enums for metrics, not echoed attacker input.

### 7.2 Session fields

Keep or add:

- Workspace, site, recipient, published-version, recipient-revision, and manifest IDs
- Server-generated session ID
- Logical initial page and tab IDs plus safe label snapshots
- Normalized device class, operating-system family, and browser family derived server-side
- Coarse city, region, and country when available
- Start, last-seen, end, active-duration, status, and end-reason timestamps
- Event count and other bounded aggregates used by the UI

Remove:

- `deviceIdHash`
- `ipAddress`
- `ipAddressHash`
- `initialPath`
- `referrerHost`
- Any raw browser fingerprint or stable cross-session identity field

### 7.3 Event fields

Common event fields:

- Workspace, site, recipient, session, manifest, and published-version IDs
- Event ID and controlled event type
- Server receipt timestamp and bounded advisory occurrence timestamp
- Logical page/tab IDs and safe label snapshots where applicable
- Server-owned element ID, kind, block ID, and label snapshot where applicable
- Destination category and optional hostname where applicable
- Type-specific server identifiers, such as webhook ID and delivery ID

Remove or prohibit:

- Browser-provided `elementLabel`
- `elementHref`
- Browser path, title, referrer, arbitrary metadata, or DOM-derived fields

The server may keep a field named `elementLabel`, but its only valid writer is manifest resolution. Treat it as an immutable historical snapshot, not browser input.

### 7.4 Ordering and timestamps

- The server receipt timestamp is canonical for retention and default ordering.
- Client `occurredAt` is advisory and accepted only within a bounded skew window.
- `sequence` assists playback of the activity list but does not override server security or retention decisions.
- Event ID is the idempotency key. Duplicate delivery returns success without duplicate insertion.

## 8. IP, Location, Rate Limiting, and Suppression

### 8.1 Trusted network boundary

Do not trust arbitrary public `X-Forwarded-For` values. Centralize client-network extraction and accept forwarding headers only from the explicitly configured ingress/proxy chain. Prefer platform-provided trusted fields such as Cloudflare's verified connection and location metadata.

If trustworthy coarse location is unavailable, store `Unknown`. Do not call a third-party IP enrichment API in the initial implementation.

### 8.2 Transient processing pipeline

Within the request only, a normalized client IP may be used to:

- Select trusted coarse city, region, and country
- Match configured internal CIDR ranges
- Apply abuse and rate controls
- Apply jurisdictional product controls if later required

After these decisions, discard it. The request pipeline must not attach raw IP to durable request context, jobs, error payloads, tracing attributes, or analytics objects.

### 8.3 Ephemeral rate-limit key

If rate limiting needs a network key, calculate an HMAC of the normalized IP with a frequently rotated secret and keep it only in an expiring rate-limit store. Use a maximum TTL of 15 minutes. It must not be written to the product database, logs, metrics, session rows, or event rows, and it must not be reusable for long-term visitor correlation.

### 8.4 Workspace-user suppression

Remove persistent workspace-user IP/device marker collection. Replace it with signals that do not follow a person across public visits:

- Authenticated same-origin workspace-member visits are suppressed.
- Authenticated preview/editor routes are suppressed.
- A short-lived, single-purpose, opaque **open without tracking** token may suppress a specific link open.
- Customer-configured internal CIDR ranges are matched transiently.

An unauthenticated workspace user manually opening a public recipient URL from an unknown network may be counted. That false positive is preferable to creating a persistent identity or fingerprinting system. The product should explain this limitation where internal-traffic controls are configured.

### 8.5 Logging and infrastructure audit

Application logging must redact sensitive keys recursively and must never log request bodies, authorization tokens, cookies, full URLs, raw headers, or client IP for tracking routes. The launch checklist must separately verify CDN, load balancer, WAF, APM, error-reporting, and hosting access-log configuration because application code cannot erase infrastructure logs it does not control.

### 8.6 Jurisdiction policy hook

Session start must pass through a server-owned policy decision before collection begins. The initial policy can return `allow`, `suppress`, or `disabled`; its contract must be extensible to a future `consent_required` result without changing event payloads. Do not silently infer consent, and do not hardcode California-only blocking as a substitute for a reviewed jurisdiction matrix. Location is approximate and laws can depend on the visitor, customer, business, and processing locations.

## 9. First-Party Use and Webhooks

### 9.1 Permitted processing

Collected analytics may be used to provide, secure, troubleshoot, aggregate, and improve the customer's Handout service within documented first-party purposes. Operational subprocessors may process data under contract and the applicable data-processing terms.

### 9.2 Prohibited processing

- Advertising or retargeting
- Data-broker or third-party enrichment
- Cross-workspace behavioral profiles
- Sale or sharing for cross-context behavioral advertising
- Inferring sensitive traits
- Training generalized models on identifiable event data
- Republishing recipient activity outside the customer's authorized workspace

### 9.3 Customer-directed webhooks

A configured webhook is an intentional customer export, not a silent analytics recipient. Requirements:

- Explicit workspace configuration and authorization
- Clear event selection and test delivery
- Signed payloads, replay protection, bounded retries, and secret rotation
- Safe SSRF protections and destination validation
- Delivery logs with payload redaction
- Event analytics store webhook ID, safe hostname, delivery ID, status, attempt, and timestamp; not secrets or complete endpoint URLs

## 10. Session Semantics

### 10.1 Start and activity

A session starts when the server accepts a valid session-start request. Site visit is inserted in the same transaction or idempotent unit so a session cannot exist ambiguously without its initial event.

Heartbeats update `lastSeenAt` and active-duration state but carry no page snapshot. Meaningful accepted events also update activity. Heartbeat frequency should adapt to visibility and stop while the page is hidden.

### 10.2 End detection

Use multiple imperfect browser/server signals rather than claiming exact tab-close knowledge:

- Best-effort lifecycle end beacon on `pagehide`
- Visibility transitions
- Periodic visible-page heartbeat
- Server inactivity timeout
- Hard maximum session duration

Store both wall-clock end and accumulated active duration. When hidden, active-duration accumulation pauses. End reasons are controlled values such as `explicit_pagehide`, `idle_timeout`, `hard_cap`, or `administrative_stop`.

Recommended initial limits:

- Visible heartbeat: 15 seconds with bounded jitter
- Hidden-page grace: 60 seconds
- Inactivity timeout: 2 minutes
- Hard session cap: 4 hours

These values must be load-tested and may be tuned without changing event meaning. The UI should present duration as an estimate, not an assertion of continuous attention.

## 11. Retention and Deletion

- Default event and session retention: 90 days.
- Supported customer choices: 30, 90, 180, or 365 days.
- Maximum: 365 days unless a separately reviewed enterprise requirement exists.
- Raw IP retention settings and cleanup logic are removed because raw IP is never stored.
- Manifests may be deleted after no retained session/event references them and after a safety grace period.
- Site/workspace/recipient deletion workflows must define and test cascading analytics deletion. Deleting a session cascades its browser events, recording metadata, and chunk metadata; standalone server events are unaffected because they have no session ID. Replay object keys are first preserved in the durable deletion outbox.
- Data-subject and customer deletion jobs must be idempotent, observable, and bounded in batches.
- Backups follow the documented backup expiry schedule; deletion documentation must disclose delayed backup expiration where applicable.

Retention jobs use indexed server timestamps, delete in bounded batches, avoid table-wide locks, expose low-cardinality progress metrics, and safely resume after interruption.

## 12. Customer Experience

### 12.1 Analytics UI

For each event, display when applicable:

- Event type
- Site
- Logical page/tab
- Server-owned historical element label
- Recipient
- Session ID
- Device class and operating-system family
- Approximate location, labeled approximate
- Timestamp
- Safe destination category or hostname

Never display raw IP, persistent device ID, full destination, path, query, referrer, or inferred unique-person identity.

### 12.2 Settings UI

Remove:

- Raw IP capture toggle
- Raw IP retention control
- IP-address display and related explanatory copy
- Claims that device identity is persistent across sessions

Provide:

- Event tracking on/off control
- Retention selection
- Internal CIDR configuration with clear limitations
- First-party-use explanation
- Data deletion controls or a direct path to them
- Clear disclosure that location is approximate and can be unavailable

Disabling tracking must take effect for new sessions immediately and cause active-session events to be rejected promptly. The public site must continue to function.

## 13. Reliability and Failure Behavior

| Failure | Required behavior |
| --- | --- |
| Manifest generation or persistence fails | Render the site with tracking disabled; alert via low-cardinality operational metric |
| Tracking database unavailable | Visitor interaction and navigation continue; event may be lost |
| Unknown element or type mismatch | Reject that event only; accept other valid batch events |
| Duplicate event delivery | Return success idempotently; insert once |
| Tracking disabled mid-session | Reject subsequent heartbeats/events and stop issuing valid continuation tokens |
| Expired context | Reject; never fall back to current version |
| Republish during an open page | Existing session stays bound to its original manifest |
| Excessive client clock skew | Use server time and flag/drop advisory client time |
| Queue overflow | Drop bounded in-memory events; never block UI or persist a browser queue |
| Untrusted location headers | Store `Unknown`; never guess from spoofable headers |
| Manifest invariant conflict | Disable tracking for that render and alert; never overwrite historical meaning |

## 14. Performance and Cost Budgets

Initial service objectives, measured under production-like load:

- Warm session-start p95 below 75 ms server time.
- Cold manifest/session-start p95 below 150 ms server time.
- Twenty-event batch ingestion p95 below 100 ms server time.
- Browser event batch below 8 KiB.
- Manifest below 128 KiB and 500 elements.
- At most one manifest database read per event batch; zero on a warm bounded cache hit.
- No full site-document parsing, recipient-variable expansion, or URL resolution per event.
- No synchronous third-party network call in rendering or ingestion.

Indexes must support:

- Manifest unique identity and manifest lookup by ID
- Session lookup by token/session ID and retention timestamp
- Event idempotency within workspace/session ownership
- Workspace/site/recipient activity queries used by the UI
- Bounded retention deletion by server timestamp

Before launch, test realistic high-cardinality workspaces, hot recipient links, rapid clicks, retry storms, and retention deletion against a production-sized dataset. Cardinality-heavy values such as workspace ID, site ID, recipient ID, session ID, element ID, hostname, and location must not be metric labels.

## 15. Security and Abuse Controls

- Strict runtime schemas with unknown fields rejected.
- Small request-body, event-count, string-length, and clock-skew limits.
- Short-lived signed contexts and tokens with audience, purpose, expiry, and rotation support.
- Same-origin collection endpoint and restrictive CORS.
- CSRF is not the primary token defense; token binding and origin checks both apply.
- Event IDs are random and scoped so one workspace cannot collide with another.
- Manifest and session lookups always include ownership constraints.
- Webhook SSRF defenses reject private, loopback, link-local, metadata, and disallowed resolved addresses on every connection attempt, including redirects and DNS changes.
- No secrets, tokens, payloads, complete URLs, raw headers, or IP values in logs or exceptions.
- Dependencies and browser bundle are kept minimal; analytics never becomes a privileged script loader.

## 16. Observability

Allowed low-cardinality metrics include:

- Manifest generated, reused, rejected, conflicted, and failed
- Session start accepted, suppressed, disabled, invalid, and rate-limited
- Event accepted, duplicate, unknown-ID, type-mismatch, invalid-schema, expired, and disabled
- Coarse location available or unknown, by trusted source category only
- Retention rows deleted, batches completed, failed, and duration
- Endpoint latency, response status class, and bounded payload-size bucket

Do not attach customer, recipient, session, element, destination, location value, URL, or IP identifiers to metrics. Debug tooling should use authorized database queries and controlled sampling, not permanent high-cardinality telemetry or payload logs.

## 17. Legal and Privacy Review Posture

This design materially reduces risk, but it does not make tracking automatically lawful or anonymous.

- A recipient-specific link and recipient ID can make events personal data even without a name or stored IP.
- First-party, modeled event analytics is less intrusive than replay or arbitrary-content capture, but statutes and case law can still turn on consent, notice, purpose, data roles, technical routing, and whether information is treated as communication content.
- Removing browser storage avoids one major cookie/similar-technology issue, but it does not remove general privacy, interception, consumer-protection, security, or contract obligations.
- Customer acceptance and indemnity do not eliminate Handout's responsibility for its own product design, representations, security, subprocessors, or statutory duties.
- Handout and the customer must document their controller/processor or business/service-provider roles, permitted purposes, deletion assistance, security duties, and webhook-export responsibilities in the applicable agreements.
- Product claims and notices must describe what is actually collected, including recipient association, coarse location, event labels, session timing, and retention.
- A launch matrix reviewed by qualified counsel must decide where notice, consent, opt-out, contractual restrictions, or feature suppression is required. Engineering must support that result; it must not improvise legal conclusions from IP location alone.

Relevant primary/regulatory starting points for counsel include [California Penal Code section 631](https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=PEN&sectionNum=631.), the UK ICO's [cookies and similar technologies guidance](https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guide-to-pecr/cookies-and-similar-technologies/), and the US FTC's [privacy and security business guidance](https://www.ftc.gov/business-guidance/privacy-security). These references are not a complete jurisdictional analysis.

## 18. Implementation Plan

### Phase 1: Contracts and canonical resolution

1. Add the canonical `ResolvedPublishedSite` model and shared pure resolver in `packages/site-document`.
2. Add manifest schemas, normalization helpers, destination classification, deterministic hashing, and invariant tests.
3. Refactor the renderer to consume the canonical model without changing visible output.
4. Change tracking DOM attributes to controlled type plus stable ID only.
5. Add golden tests proving renderer output and manifest entries remain aligned across variables, recipient revisions, hidden content, tabs, buttons, and sidebar links.

**Exit criteria:** The same resolved object drives rendering and analytics identity; no browser-visible tracking label is needed; unsupported elements are absent from the manifest.

### Phase 2: Database replacement

1. Add `tracking_event_manifests` and its partial unique indexes.
2. Add manifest/revision/logical-page references and safe snapshots to sessions and events.
3. Replace full destination fields with destination category and hostname.
4. Remove raw IP, IP hash, device hash, path, referrer, and raw-IP setting columns.
5. Correct published-version deletion behavior so historical sessions are not accidentally cascade-deleted.
6. Add event/session retention configuration and indexes.

Because the system has not been deployed, use a clean incompatible schema migration and reset local tracking test data. Do not write dual-read, dual-write, compatibility, or analytics backfill code. Do not delete site versions or customer site content.

**Exit criteria:** The schema cannot persist prohibited fields and all ownership, uniqueness, deletion, and retention constraints have database tests.

### Phase 3: Public render context and manifest lifecycle

1. Generate or retrieve manifests during public-site resolution.
2. Issue short-lived opaque context bound to exact manifest/version/recipient revision.
3. Add bounded cache and invariant-conflict handling.
4. Ensure manifest failure disables tracking without affecting page rendering.
5. Add concurrency tests for simultaneous first render, republish races, recipient edits, stale contexts, and manifest conflicts.

**Exit criteria:** Every trackable render has one immutable manifest identity, and stale content can never resolve against current content.

### Phase 4: Browser runtime replacement

1. Replace the browser schema with the ID-only contract.
2. Remove local-storage device identity and all browser storage access.
3. Remove DOM label, href, path, title, referrer, locale, timezone, and generic-link collection.
4. Implement bounded memory-only batching and nonblocking lifecycle flush.
5. Implement logical tab events and visibility-aware heartbeat/end signaling.
6. Verify no unsupported component emits tracking attributes.

**Exit criteria:** Automated browser tests show no analytics storage, no prohibited payload fields, correct navigation under endpoint failure, and correct behavior across reload/new-tab/hidden-tab cases.

### Phase 5: Ingestion, IP boundary, and suppression

1. Centralize trusted-proxy and trusted-location extraction.
2. Implement transient CIDR matching and ephemeral HMAC rate keys.
3. Remove persistent workspace-user network/device markers.
4. Implement authenticated preview/member and short-lived no-track-link suppression.
5. Validate events against one loaded manifest and snapshot server-owned metadata.
6. Add partial-batch acceptance, idempotency, bounded clock handling, and immediate settings enforcement.
7. Add recursive log redaction and infrastructure logging checklist.

**Exit criteria:** Raw IP and persistent IP/device hashes cannot reach durable storage or logs; forged forwarding headers cannot control attribution; valid events survive neighboring invalid events.

### Phase 6: Server events, retention, and customer UI

1. Align Slack-preview-fetch and webhook-send events with the new common event model.
2. Harden webhook signing, retries, redaction, and SSRF controls.
3. Replace raw-IP retention with event/session/manifest retention jobs.
4. Update analytics queries and UI for safe historical snapshots and approximate location.
5. Remove raw-IP/device-ID controls and unique-visitor language.
6. Add deletion workflows and authorized export behavior.

**Exit criteria:** Product surfaces expose only supported data; retention/deletion completes reliably at production scale; server-originated events follow the same ownership and privacy rules.

### Phase 7: Production-like verification and launch

1. Run unit, integration, migration, contract, browser, load, failure-injection, security, and deletion tests.
2. Inspect real browser network requests and storage under desktop/mobile, reload, new tab, hidden tab, navigation, endpoint outage, and tracking-disabled scenarios.
3. Verify CDN, proxy, WAF, APM, error-reporting, database, queue, backup, and access-log behavior.
4. Review UI copy, customer terms, privacy notice, DPA/subprocessor disclosures, retention, and launch jurisdictions with counsel.
5. Roll out behind a server kill switch with operational dashboards and alerts.
6. Start with internal synthetic traffic, then a small controlled cohort, then gradual expansion.

**Exit criteria:** All acceptance criteria below pass, operational rollback is proven, and legal/security reviewers approve the actual shipped behavior rather than this document alone.

### Implementation ownership map

| Area | Primary current files | Required direction |
| --- | --- | --- |
| Browser contract | `packages/tracking-schema/src/v2.ts` | Replace browser schemas with the closed ID-only contract |
| Public tracking runtime | `apps/api/src/tracking/public-script.ts` | Remove storage and DOM-derived values; add bounded memory batching and lifecycle handling |
| Canonical rendering and manifest | `packages/site-document/src/model.ts`, `packages/site-document/src/renderer.ts`, new `tracking-manifest.ts` | Share one resolved model and emit only stable tracking IDs |
| Public render context | `apps/api/src/public-sites/repository.ts`, `apps/api/src/public-sites/service.ts` | Retrieve/create exact manifest and issue manifest-bound context |
| Database | `packages/db/src/schema.ts`, a new clean Drizzle migration | Replace prohibited fields, add manifests and constraints, fix deletion behavior |
| Session/event ingestion | `apps/api/src/tracking/v2/router.ts`, `service.ts`, `repository.ts` | Centralize trusted request context and validate IDs against one manifest |
| Suppression and rate limits | `apps/api/src/tracking/v2/suppression.ts`, `apps/api/src/tracking/rate-limit.ts` | Remove durable markers; use request-scoped CIDR checks and expiring rate keys |
| Session expiration and retention | `apps/api/src/tracking/v2/session-expiration.ts`, `retention.ts` | Implement active-time semantics and bounded event/session/manifest cleanup |
| Customer UI | `apps/web/src/features/tracking/*` | Remove prohibited fields and controls; show safe historical snapshots |
| Replay code | `apps/api/src/tracking/v2/recording-*`, `apps/web/src/features/tracking/recording-replay*` | Keep a separately enabled, consent-gated subsystem with independent storage, limits, retention, and lazy playback |

This document supersedes conflicting event/session collection, identity, IP, destination, and historical-label behavior in the broader tracking specification and current implementation. Existing code is migration evidence, not a compatibility requirement. Replay is approved only through the separate controls and boundaries in `session-replay-architecture-spec.md`; it does not expand the event payload contract.

## 19. Required Test Matrix

### Correctness

- Every supported element type resolves to the label and destination category shown in its exact render.
- Recipient-variable changes create a distinct manifest revision without rewriting history.
- Republish races preserve original-session meaning.
- Unknown, duplicate, and wrong-type element IDs behave as specified.
- Logical tab and page labels remain historical after later edits.

### Privacy

- Browser payload snapshots contain no text, URL, path, title, referrer, form value, locale, timezone, or persistent ID.
- The event collector creates no identity or analytics storage. The consent gate may store only the versioned allow/deny choice and decision timestamp described in `session-replay-architecture-spec.md`.
- Database and queue scans find no raw IP, persistent IP hash, device hash, or full destination.
- Log and trace scans find no tracking token, payload, raw header, full URL, or IP.
- Metrics contain no high-cardinality customer or visitor labels.

### Reliability

- Public sites work with tracking JavaScript blocked, manifest persistence down, ingestion down, slow responses, and malformed responses.
- Navigation is never delayed by analytics.
- Session/event start retries are idempotent.
- Retention and deletion jobs resume after interruption.
- Disabling tracking stops active and future collection promptly.

### Security

- Forged origin, token, manifest, ownership, forwarding-header, clock, sequence, and oversized-body attacks are rejected.
- Cross-workspace ID substitution cannot disclose or create data.
- Webhook redirects, DNS rebinding, and private-network targets are blocked.
- Rate limiting resists retry storms without creating durable identity.

### Performance and cost

- Service objectives hold at expected peak plus safety margin.
- Hot links and manifest-creation concurrency do not produce duplicate manifests.
- Queries use expected indexes on production-sized data.
- Retention avoids long locks and runaway transaction/WAL growth.
- Cache remains bounded and behavior remains correct with zero cache hits.

## 20. Launch Acceptance Criteria

The replacement is ready only when all of the following are true:

1. No prohibited browser field exists in TypeScript contracts or emitted network payloads.
2. No application path persists raw IP, persistent IP hash, device hash, path, referrer, or complete click destination.
3. Browser event meaning is resolved exclusively from the exact immutable server manifest.
4. Rendering and manifest generation use one canonical resolved-site model.
5. Unsupported interactions cannot generate accepted analytics events.
6. Tracking failure cannot impair the public site's primary experience.
7. Historical labels remain correct across recipient edits and republishes.
8. Session semantics, duration limitations, location approximation, and lack of unique-visitor identity are accurately represented in the UI.
9. Retention, customer deletion, and workspace/site/recipient deletion are tested end to end.
10. Production infrastructure logging and subprocessor behavior have been verified, not assumed.
11. Performance budgets pass under realistic load and failure injection.
12. Legal and security review covers the actual release configuration, contracts, notices, and jurisdictions.

## 21. Deliberate Tradeoffs

- **More sessions after reload:** Accepted in exchange for eliminating persistent browser identity.
- **Occasional internal false positives:** Accepted when an unauthenticated team member opens a public link outside configured internal networks.
- **Unknown location:** Accepted when trusted coarse location is unavailable; accuracy is not manufactured through riskier enrichment.
- **Some event loss:** Accepted during abrupt close, network failure, or bounded queue overflow to preserve navigation, privacy, and cost control.
- **Small manifest storage cost:** Accepted to preserve historically correct labels without retaining browser text or mutable recipient data in each event.
- **No arbitrary-link analytics:** Accepted until a link type is explicitly modeled, reviewed, and added to the manifest contract.

These are intentional privacy and reliability properties, not implementation gaps.

## 22. Future Changes

Any new tracked interaction type must include:

- A product reason and user-facing value
- An explicit modeled stable ID
- Server-owned safe display metadata
- A closed schema with no arbitrary payload field
- Manifest validation and historical behavior
- Privacy, security, retention, cost, and legal review
- Renderer, ingestion, UI, deletion, and production-like browser tests

Session replay is governed by `session-replay-architecture-spec.md`. Arbitrary rich-text link tracking, persistent identity, third-party analytics, or replay capture beyond that approved boundary requires a new review and explicit approval.
