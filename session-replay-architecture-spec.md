# Session Replay Architecture Specification

**Status:** Application implementation complete and live-verified; production launch gates tracked in `tracking-production-launch-audit.md`  
**Scope:** Consent-gated rrweb capture, bounded event-stream storage, and browser-side reconstruction  
**Last reviewed:** 2026-07-13

## 1. Product Contract

Session replay is not a video recorder. The public site captures a sanitized rrweb event stream containing an initial DOM snapshot and timed incremental changes. Handout stores that stream as small compressed objects. The authenticated tracking UI downloads the bounded stream only when a user opens a replay and reconstructs the visit locally with rrweb.

Activity analytics and replay remain separate:

- Event tracking stores modeled Handout events and server-owned labels.
- Replay stores a sanitized visual interaction stream for a single consented session.
- A failure in replay must never block the public site, activity events, or session lifecycle.
- Replay data must never be interpreted as analytics fields or queried as arbitrary customer data.

## 2. Enablement And Consent

Replay starts only when every condition is true:

1. Activity tracking is enabled for the site.
2. Replay is enabled in API-owned site tracking settings.
3. The workspace is entitled to replay.
4. A replay object store is configured; write failures fail replay closed without affecting analytics.
5. The published site presents a Handout consent choice.
6. The visitor affirmatively chooses **Allow and proceed** for the current notice version.
7. The session-start request includes the notice version and consent timestamp.

The public tracking script is not inserted before affirmative consent on consent-gated sites. A remembered decision is versioned and stores only the choice, notice version, and timestamp in first-party local storage. Changing the notice version causes the visitor to be asked again. A persistent **Privacy choices** control lets the visitor withdraw; withdrawal stops capture immediately, completes the recording with `consent_withdrawn`, ends activity tracking, and remembers the denial.

Replay requires the equal-choice consent variant with equally prominent Allow and Deny actions and a valid customer-controlled HTTPS privacy-policy URL. The text-decline variant and the no-popup option are event-only modes and can never produce replay context.

Customers must separately accept the current Session Replay Addendum before enabling replay. The server records the acceptance version, timestamp, and acting user. A client-supplied boolean is never treated as the audit record.

## 3. Privacy Boundary

The recorder must:

- Mask every input and textarea value, including incremental input events.
- Block scripts, iframes, explicitly blocked regions, and browser tooling overlays.
- Disable canvas recording, cross-origin iframe recording, font collection, and image inlining.
- Remove form actions, anchor destinations, URL credentials, query strings, and fragments.
- Preserve only sanitized image/media resource origins and paths needed to reconstruct visible content.
- Drop `srcset`, unsupported protocols, cyclic values, browser nodes, and values beyond the maximum sanitizer depth.
- Never collect cookies, storage values, raw IP addresses, clipboard contents, audio, camera, or microphone data.

Visible page text and structure are necessarily part of replay. Product notices must say so plainly. Elements marked `data-handout-recording-mask` are text-masked; elements marked `data-handout-recording-block` are omitted.

## 4. Capture And Delivery Limits

The server returns all limits in the accepted session response. The browser treats those limits as upper bounds and the server enforces them independently.

| Limit | Default/hard maximum |
| --- | --- |
| Duration | 10 minutes |
| Uncompressed recording payload | 5 MiB |
| Events | 20,000 |
| Events per chunk | 500 |
| Target chunk | 96 KiB |
| Hard chunk body | 512 KiB |
| Flush interval | 5 seconds |
| Mouse sampling | 100 ms |
| Scroll sampling | 150 ms |
| Checkout/full snapshot | 120 seconds |
| Replay retention | 14 days default, 30 days maximum |
| Workspace starts | 1,000 per UTC day |
| Workspace compressed bytes | 1 GiB per UTC day |

The browser keeps one bounded event buffer and one serial upload queue. It never writes replay data to browser storage. Normal uploads retry twice with bounded exponential delay; unload uploads use one best-effort keepalive request only when under the browser-safe size. Navigation is never delayed for replay.

## 5. Storage Model

PostgreSQL stores recording state and chunk metadata only:

- `tracking_recordings`: owner, session, state, limits, consent evidence, counters, completion, expiry.
- `tracking_recording_chunks`: sequence, object key, sizes, checksum, event bounds.
- `tracking_recording_usage_daily`: workspace/day starts and compressed bytes for hard cost ceilings.
- `tracking_recording_object_deletions`: durable object-deletion outbox that survives parent-row cascades and storage outages.

Compressed rrweb chunk bodies live in private object storage. Production supports S3-compatible storage and must not silently fall back to local disk. Development may use a workspace-local directory. If storage is absent or misconfigured, replay enablement and new recording creation fail closed while event tracking continues.

Object keys contain only opaque workspace/recording IDs, sequence, and content checksum. Recording IDs and upload tokens are deterministically derived from the internal session ID with a server secret so session-start retries return the same capability. Only the upload-token HMAC is stored. Tokens are scoped to one recording and never accepted by authenticated read routes.

## 6. Upload Correctness

- Chunks are immutable and addressed by `(recording_id, sequence)`.
- Retrying an identical chunk is idempotent.
- Reusing a sequence with different content fails the recording.
- The server validates schema, token, session binding, event count, timestamp bounds, chunk size, recording totals, and daily workspace limits.
- The server sanitizes the already-sanitized payload again before storage.
- The server writes the compressed object before publishing chunk metadata and removes the object on metadata failure where possible.
- Completion records the expected final sequence. A recording becomes playable only after every sequence from zero through the final sequence exists.
- A late final chunk re-runs settlement, preventing the completion/chunk race.
- Missing chunks leave the recording pending until stale-recording cleanup preserves a contiguous prefix as `truncated`, or marks the recording `failed` when no usable prefix exists.

Terminal states are `available`, `truncated`, `failed`, `expired`, and `deleted`. Duration, size, event, and daily-byte caps produce a playable `truncated` recording when at least one contiguous snapshot-bearing stream exists.

## 7. Playback

Session lists expose only a small replay summary. Opening a session loads its manifest. Chunk bodies load with at most four concurrent requests and a cumulative client-side byte check. The heavy `@rrweb/replay` module and CSS are dynamically imported only after usable chunks arrive.

The player must provide loading, unavailable, expired, failed, truncated, and retry states; play/pause; seek; restart; elapsed/total time; responsive scaling; keyboard-accessible controls; and cleanup of the replayer, observers, timers, and DOM on close.

Replay runs with canvas playback disabled, navigation inert, warnings suppressed, and no external interaction inside the reconstructed document.

## 8. Retention And Deletion

Retention runs in this order:

1. Expire stale sessions and stale pending recordings.
2. Mark recordings past `expires_at` as expired and make them unreadable.
3. Delete expired chunk metadata; a database trigger durably enqueues every object key before deletion, including cascade deletions.
4. Mark recordings deleted when no chunk metadata remains.
5. Delete queued objects with bounded concurrency and remove only successful outbox entries.
6. Retain failed outbox entries with attempt metadata for the next run.
7. Delete sessions/events according to analytics retention.
8. Prune unreferenced manifests.

Failures are retried on the next run. Browser events attached to a session cascade with that session; standalone server events have no session relationship. The durable outbox retains each replay object key while deletion is uncertain, even after site, workspace, recipient, session, or privacy-request cascades remove replay metadata.

## 9. Operational Requirements

- Separate body limits for chunk and non-chunk routes.
- Same-origin enforcement plus bearer upload-token authentication.
- Per-recording rate limits for chunks and completion.
- No replay payloads in request logs, error logs, metrics, traces, or analytics.
- Metrics for starts accepted/declined, bytes, truncation reasons, upload failures, stale pending recordings, playback failures, retention backlog, and object-delete failures.
- Alerts on sustained storage failures, retention backlog, and abnormal byte growth.
- Production lifecycle rules are defense in depth, not a substitute for application deletion.
- Backups and replicas must expire replay data within the documented deletion window.

## 10. Acceptance Criteria

- No MP4, WebM, screenshots, or frame sequence is created or stored.
- A real consented public visit produces an initial snapshot and incremental events.
- Typed values, URL queries/fragments, scripts, iframes, and blocked regions do not appear in stored chunks.
- Denial produces no session or replay; withdrawal stops an active replay.
- Duplicate chunks are harmless; conflicting chunks fail closed.
- Oversized, over-count, over-duration, noncontiguous, expired-token, cross-workspace, and malformed uploads are rejected or truncated as specified.
- Event tracking remains functional when replay capture, object storage, retention, or playback fails.
- The tracking UI reconstructs and plays the real session without loading rrweb in the initial application bundle.
- Automated schema, service, route, retention, browser-script, replay-builder, typecheck, build, and live-browser checks pass.
