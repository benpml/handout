# Tracking Production Launch Audit

**Status:** Event tracking and session replay are not approved for real-recipient production use yet  
**Reviewed:** 2026-07-13  
**Scope:** Event tracking, consent-gated rrweb replay, retention, storage, provider controls, security, privacy, cost, and release operations

This is an engineering, security, and operational readiness review. It is not legal advice. Qualified counsel must approve the final customer terms, privacy notice, data-processing terms, subprocessors, launch jurisdictions, and consent design.

## 1. Launch Decision

The application implementation is technically ready for a controlled production release after the blockers in section 2 are closed. It is not ready to collect data from real recipients today because the public privacy and terms URLs return `404`, production replay credentials do not exist, scheduled deletion is not deployed, and counsel has not approved the legal package.

Do not enable production replay merely because the code and object bucket exist. Production replay must remain unavailable until every blocking item below is complete.

## 2. Blocking Items

1. **Publish reviewed legal documents.** `https://handout.link/privacy` and `https://handout.link/terms` currently return `404`. The visitor consent notice and customer replay agreement link to those pages. Final documents require Handout's legal entity name, business/contact details, governing-law choice, privacy-request address, subprocessors, and counsel approval.
2. **Create the replay storage credential.** The Cloudflare form is prepared for an Object Read & Write token restricted only to `handout-session-replays`, but the token has not been submitted. Its key and secret must be stored only in Render.
3. **Deploy reliable retention.** The Blueprint defines `handout-tracking-retention` at minute 17 every six hours. Render cron jobs have a minimum monthly charge and the workspace currently has no payment card, so creation requires an explicit owner decision and payment setup.
4. **Deploy and verify the release.** Run migrations once as a release step, deploy the API configuration, deploy the web/worker changes, and perform the authenticated settings, consent, capture, playback, withdrawal, expiry, and deletion smoke tests against production.
5. **Take a pre-release database snapshot.** Neon Free currently provides a six-hour point-in-time restore window and no scheduled snapshots. Create the available manual snapshot immediately before the release. Scheduled snapshots require a paid plan.
6. **Obtain legal signoff.** Counsel must approve the jurisdiction matrix, privacy notice, Terms of Service, Session Replay Addendum, DPA, subprocessor disclosure, retention wording, consent evidence, children's-data restriction, and incident/deletion procedures.

## 3. Verified Technical State

### Automated verification

- All repository tests pass: 49 test files and 357 tests after the expiry, privacy-notice, and equal-consent hardening.
- Workspace typechecking passes.
- Production builds pass.
- The public rendering boundary check passes.
- The public bundle budget passes at 4.75 kB minified and 1.73 kB gzip for the public-site page chunk.
- Tracking-specific web lint passes.
- Repository-wide lint remains blocked by unrelated editor collaboration code; no tracking lint errors are present.

### Load and cleanup verification

A production-shaped local run used a trusted-proxy API instance, real published HTML, real session/event endpoints, real replay chunk uploads, the production database schema, and local replay object storage:

| Measure | Result |
| --- | ---: |
| Sessions | 1,000 / 1,000 successful |
| Replay sessions | 25 / 25 successful |
| Concurrency | 40 |
| Throughput | 398.28 sessions/second |
| Session-start p95 | 60.44 ms |
| Full-lifecycle p95 | 118.55 ms |
| Database session rows | 1,000 exact |
| Site-visit event rows | 1,000 exact |
| Replay chunk rows | 25 exact |
| Test sessions deleted | 1,000 |
| Object-deletion backlog after cleanup | 0 |

The reusable bounded load runner is `pnpm --filter @handout/api tracking:load`. Remote targets are refused unless explicitly allowed, and remote runs retain their data because a local process cannot safely prove remote deletion.

## 4. Storage And Deletion

### Cloudflare R2

Verified bucket: `handout-session-replays`

- Public `r2.dev` access is disabled.
- No custom domain is attached.
- `delete-expired-replays` expires every object after 30 days.
- Incomplete multipart uploads are aborted after one day.
- The application uses private, no-store object responses and opaque object keys.
- The pending production token is bucket-scoped Object Read & Write, not account administration.

Cloudflare's S3-compatible credential and endpoint model is documented at <https://developers.cloudflare.com/r2/get-started/s3/>.

### Application deletion behavior

- Replay reads enforce `expires_at` against the server clock. An expired replay is unavailable immediately even before cleanup runs.
- Physical object and metadata deletion runs at most six hours after normal expiry.
- A database trigger writes every deleted chunk key to a durable deletion outbox before metadata disappears, including cascade deletion.
- Failed object deletes remain queued with attempt metadata. The scheduled job exits nonzero on any failed delete or undrained safety ceiling, which triggers Render's failure notification.
- The R2 30-day lifecycle is a provider-side final ceiling, not the normal deletion mechanism.
- Deletion from the live database may remain recoverable in Neon's point-in-time history for up to the configured six-hour history window. Privacy and deletion documentation must disclose this bounded backup delay.

## 5. Privacy And Security Controls

Verified application controls:

- No visitor raw IP, IP hash, device identifier, fingerprint, path, referrer, or arbitrary DOM label is stored in tracking sessions or events.
- A raw IP is used transiently for trusted proxy extraction, short-lived rate limiting, and configured internal CIDR suppression, then discarded.
- Coarse city, region, and country are accepted only from trusted Cloudflare ingress metadata.
- Recursive application-log redaction covers authorization, cookies, credentials, headers, URLs, request bodies, IP fields, passwords, secrets, and tokens. Production error stacks are omitted.
- Replay requires a Pro workspace, API-owned enablement, current customer agreement acceptance, configured object storage, and current affirmative visitor consent.
- Replay requires equally prominent Allow and Deny actions plus a valid customer-controlled HTTPS privacy-policy URL; weaker consent variants fail replay closed.
- The server records customer acceptance version, time, and acting user.
- The visitor can deny before tracking begins and can reopen Privacy choices to withdraw. Withdrawal stops replay and event collection for the visit.
- rrweb masks all inputs and textareas; blocks scripts, iframes, and marked regions; disables canvas, cross-origin iframe recording, font collection, and image inlining; and samples mouse/scroll activity.
- Browser and server sanitizers remove input values, placeholders, destinations, URL credentials, query strings, fragments, `srcset`, unsupported protocols, and tooling overlays.
- Replay payloads are bounded by duration, events, uncompressed bytes, per-chunk bytes, daily starts, and daily compressed bytes.
- Authenticated replay reads are workspace-scoped. Upload capabilities are single-recording bearer tokens stored only as HMACs.

Infrastructure limitations and required review:

- Cloudflare, Render, and Neon necessarily process network addresses and operational metadata as infrastructure providers. Application redaction cannot erase provider access logs.
- Neon Free allows public-network database connections and does not offer IP allowlisting. Use TLS, the pooled connection string, a strong credential, least-privilege access, and credential rotation. A paid plan is required for private networking/IP allowlisting.
- Final provider retention, DPA, incident-response, breach-notification, employee-access, and subprocessor terms require security/legal review.
- The production credential must be rotated on a documented schedule and immediately after suspected exposure.

## 6. Cost Controls

- Replay is limited to entitled Pro workspaces.
- Each workspace is limited to 1,000 replay starts and 1 GiB compressed replay data per UTC day.
- Each replay is limited to 10 minutes, 20,000 events, and 5 MiB uncompressed data.
- Replay retention is limited to 7, 14, or 30 days; 14 days is the default.
- R2 hard-deletes objects after 30 days even if application cleanup is unavailable.
- Retention runs every six hours rather than every 15 minutes. This avoids repeatedly waking an otherwise idle Neon Free compute and preserves most of its 100 included monthly compute-hours.
- Neon is on its $0 Free plan with hard included limits, so there is no current usage-based database bill.
- Render is on a legacy Hobby workspace with a free API instance and no card. The proposed cron has Render's documented $1 minimum monthly cron charge: <https://render.com/docs/cronjobs>.
- A Cloudflare $1 monthly billing-budget email alert is prepared but not submitted. A budget alert warns; it is not a hard spending cap.

## 7. Operational Controls

- Render's workspace default is email delivery for failure notifications only. The retention cron will inherit failure notifications unless explicitly overridden.
- The API uses at most five database connections; retention uses at most two.
- Retention processes bounded batches until idle and stops at a defined safety ceiling.
- Object deletion uses bounded concurrency.
- The API has a 256 KiB normal JSON body limit and a separate bounded replay-chunk route.
- Production object storage never falls back to local disk.
- The web service start command does not run migrations. Earlier production restarts repeatedly failed because migrations were coupled to startup; the Blueprint now starts only the API.

## 8. Legal Review Boundary

The consent and agreement design materially reduces risk but does not transfer away Handout's own obligations. California Penal Code section 631 addresses unauthorized interception or reading of communications in transit and contains an all-parties consent requirement in its text: <https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=PEN&sectionNum=631.>. The UK ICO states that cookies and similar technologies can require clear information and consent under PECR: <https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guide-to-pecr/cookies-and-similar-technologies/>. The FTC expects businesses to honor privacy promises, collect only what they need, secure it, and dispose of it safely: <https://www.ftc.gov/business-guidance/privacy-security>.

Engineering must not decide that a visitor is outside a law's reach based only on approximate IP location. Counsel must define where event tracking or replay requires notice, consent, opt-out, suppression, or contractual restrictions. Product policy must then implement that matrix through the existing server-owned policy hook.

## 9. Release Order

1. Obtain entity/contact details and counsel-approved legal documents.
2. Publish `/privacy`, `/terms`, the Session Replay Addendum, DPA, and subprocessor list.
3. Create the bucket-scoped R2 credential and store it in Render without exposing it in source, logs, or chat.
4. Decide whether to add Render billing for the $1 minimum cron. Do not sync the paid cron without approval.
5. Create a Neon manual snapshot.
6. Run `pnpm db:migrate` once against production and verify the migration journal.
7. Deploy the API, web app, and public Worker.
8. Verify health, tracking script delivery, consent deny/allow/withdraw, event ingestion, replay upload/playback, immediate read expiry, physical deletion, and zero outbox backlog.
9. Confirm Render failure email and Cloudflare budget alerts are active.
10. Record owner, date, evidence, and counsel approval for every launch gate.

## 10. Production Approval Record

| Gate | Owner | Status | Evidence |
| --- | --- | --- | --- |
| Application tests/build/load | Engineering | Pass | Section 3 |
| Private R2 bucket/lifecycle | Engineering | Pass | Section 4 |
| R2 production credential | Engineering/Owner | Pending confirmation | Cloudflare prepared form |
| Scheduled retention | Engineering/Owner | Pending payment and deploy | Render Blueprint |
| Database restore point | Engineering/Owner | Pending confirmation | Neon Backup & Restore |
| Privacy/terms/addendum/DPA | Legal | Blocked | Public URLs return 404 |
| Jurisdiction and consent matrix | Legal | Blocked | Counsel approval required |
| Production smoke/deletion test | Engineering | Blocked by deploy | Release step 8 |
