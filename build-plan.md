# Handout Build Plan

This document turns `app-spec.md` into an implementation plan for three agents working in parallel.

The goal is not to split the app into three disconnected projects. The goal is to let three agents move at the same time while preserving one product model, one permission model, one content schema, and one public rendering contract.

## Source Documents

- `app-spec.md`: product behavior, architecture, data model intent, user flows, and acceptance criteria.
- `AGENTS.md`: component organization, shadcn rules, token rules, and implementation conventions.
- `.env.example`: required environment variables and local-safe placeholders.

## Current Repo Starting Point

Current workspace shape:

```txt
apps/
  api/        # current Node API app
  web/        # React/Vite app

packages/
  db/         # current Drizzle/Postgres package
```

Target shape can evolve incrementally:

```txt
apps/
  web/
  api/        # may later be renamed server, but do not churn names before value exists
  worker/     # add when async jobs are needed outside request path

packages/
  db/
  contracts/
  domain/
  content-schema/
  tracking-schema/
  config/
  test-fixtures/
```

Do not pause product work just to rename folders. Add package boundaries when code needs to be shared across app/API/public runtime or when a boundary prevents real coupling.

## The Three Tracks

### Track 1: Platform, Backend, Data, Auth

Owner: Agent 1.

Primary responsibility:

- Postgres schema and migrations.
- BetterAuth integration.
- Request context.
- API contracts.
- Service/use-case layer.
- Permission helpers.
- Workspace/user/team/site data rules.
- Publish transaction.
- Version history backend.
- Job/outbox foundation.
- Rate limits, logging, error envelope, config.

Track 1 owns the source of truth. No frontend or public runtime feature is complete until Track 1 enforces it server-side.

### Track 2: Authenticated App, Design System, Editor UX

Owner: Agent 2.

Primary responsibility:

- App shell and navigation.
- Design system page and shared UI primitives/compositions.
- Authenticated routes.
- Onboarding and workspace setup UI.
- Sites management UI.
- Editor shell, blocks, inspector, variables, autosave UI, undo/redo UI.
- Publish/share/version/team/settings dialogs and surfaces.
- TanStack Router/Query integration.
- Loading, empty, error, permission, and degraded states.

Track 2 owns the product experience for sales teams. It consumes server contracts and never relies on hidden client-only permission or data rules.

### Track 3: Public Runtime, Personalization, Tracking, Assets, Release Hardening

Owner: Agent 3.

Primary responsibility:

- Public route resolution runtime.
- Public page renderer.
- Published snapshot rendering.
- Variable and variant resolution in public context.
- Public metadata, OG image, robots behavior.
- Public tracking script and ingestion client behavior.
- Tracking event schema and dashboard data needs.
- Asset delivery/public media behavior.
- Bot/preview classification.
- Public performance, caching, CSP, accessibility, and e2e launch gates.
- Worker/runtime support for tracking rollups, asset cleanup, public cache invalidation, and operational scripts in coordination with Track 1.

Track 3 owns the prospect-facing experience. Public pages must be fast, stable, privacy-safe, and independent from authenticated app/editor bundles.

## Shared Rules For All Tracks

- `app-spec.md` is the behavioral source of truth.
- Server-side authorization is mandatory for protected reads/writes.
- Draft content and published snapshots must stay separate.
- Public routes render only immutable published snapshots.
- Workspace public namespace is always `slug`, never username-style naming.
- V1 uses one canonical site design, flat blocks, and divider blocks instead of sections.
- Product UI uses shadcn primitives and Tabler icons.
- New shared logic goes into packages only when there is real cross-runtime reuse.
- Every feature needs loading, empty, error, success, and permission states where relevant.
- Do not add code paths that require direct production data edits as normal recovery.
- Avoid public bundle imports from editor/app shell/internal admin/dashboard code.

## Integration Rhythm

Use short vertical integration points instead of waiting until all tracks are done.

Recommended cadence:

1. Track 1 defines or updates the contract.
2. Track 2 and/or Track 3 build against the contract.
3. Track 1 adds server enforcement and tests.
4. Track 2/3 add UI/runtime states and tests.
5. All tracks run `pnpm typecheck`, `pnpm test`, and relevant app checks.
6. Update `app-spec.md` only when behavior changes, not for every implementation detail.

Each feature should end with one working vertical slice, even if the UI is sparse at first.

## Cross-Track Contract Ownership

### Shared Contracts

Track 1 owns:

- API route request/response schemas.
- Error envelope and typed error codes.
- Auth/session/current-user shape.
- Workspace/site/variant IDs and slugs.
- Permission result shapes.
- Database-backed state transitions.

Track 2 owns:

- UI view models derived from API responses.
- Route-level loading/error states.
- Form validation UX.
- Editor command UI behavior.
- App navigation and interaction patterns.

Track 3 owns:

- Public payload shape needed by renderer.
- Tracking event payload shape in coordination with Track 1.
- Public page render constraints.
- Public runtime error/fallback behavior.
- Asset/media runtime behavior.

### Shared Packages

Add these packages when the code first needs them:

- `packages/config`: before config parsing spreads across API/web/db scripts.
- `packages/domain`: before permission/slug/state logic is duplicated.
- `packages/contracts`: before the frontend and API maintain parallel request/response types.
- `packages/content-schema`: before editor/public/API each define their own content shape.
- `packages/tracking-schema`: before tracking script, ingest API, and dashboard each define events independently.
- `packages/test-fixtures`: before tests start hand-building invalid or inconsistent objects.

## Phase 0: Foundation

Goal: a stable local app where each track can work without inventing parallel infrastructure.

### Track 1

- Normalize environment config and ensure `.env.example` has safe placeholders.
- Keep Postgres/Drizzle running locally.
- Establish database migration rules and initial schema direction.
- Wire BetterAuth enough for session shape and local auth tests.
- Create API health endpoint.
- Create request context with request ID, user/session, selected workspace, role, internal access metadata, logger, and config.
- Define API error envelope and typed error codes.
- Add permission helper skeletons.
- Add initial service boundaries for workspace, site, auth/session, and assets.

Acceptance:

- `pnpm dev:api` runs.
- API health works.
- Typecheck passes for API and DB.
- Request context and error envelope are covered by tests.

### Track 2

- Preserve/extend app shell and sidebar from the Figma implementation.
- Keep `components/ui` as primitive layer.
- Keep product components out of `components/ui`.
- Ensure design-system route shows primitives, states, and Handout component examples.
- Set up route groups for authenticated app, editor, public preview/internal test route, and design system.
- Set up TanStack Query client and API client shell.
- Add global loading/error/permission state patterns.

Acceptance:

- `pnpm dev:web` runs.
- `/design-system` renders.
- App shell renders without layout border/outer frame artifacts.
- UI uses shadcn tokens and Tabler icons.
- Typecheck/build passes for web.

### Track 3

- Define public runtime boundaries in code even before full public rendering exists.
- Add a public renderer feature folder that does not import app shell/editor code.
- Draft public payload needs with Track 1.
- Draft tracking event schema with Track 1.
- Add public route smoke harness or test fixture route using static payload.
- Establish public performance rules: no editor imports, no authenticated app data hooks, defensive tracking.

Acceptance:

- Public renderer can render a static published payload fixture.
- Bundle/import boundary is obvious in code organization.
- No tracking script can break rendering.

## Phase 1: Auth, Workspace, Onboarding

Goal: a real user can sign up with work email, complete account setup, create a workspace, and land in the app.

### Track 1

- Implement work-email validation:
  - block personal domains,
  - block `+` email addresses,
  - normalize email safely,
  - avoid account enumeration.
- Implement BetterAuth signup/login/session wiring.
- Implement user profile/app profile table needs.
- Implement workspace schema:
  - `id`,
  - `name`,
  - `slug`,
  - `websiteDomain`,
  - `logoAssetId`,
  - `plan`,
  - `status`,
  - `scheduledDeletionAt`,
  - `deletedAt`.
- Implement workspace slug availability with race-safe save constraint.
- Implement website normalization.
- Implement logo.dev backend preview endpoint and accept-to-asset flow.
- Implement workspace creation transaction:
  - workspace,
  - creator admin membership,
  - defaults,
  - optional initial billing/trial record.
- Implement current-user/current-workspace endpoint.

Acceptance:

- Workspace creation is atomic.
- Slug uniqueness is enforced in DB and service layer.
- logo.dev token is never exposed to browser.
- Invalid email/slug/website failures return typed errors.

### Track 2

- Build signup/login screens or integrate BetterAuth UI flows as appropriate.
- Build account setup form.
- Build workspace setup form:
  - name,
  - editable generated slug,
  - debounced availability,
  - website,
  - logo suggestion,
  - upload/select logo,
  - clear failure recovery.
- Build workspace switcher.
- Build onboarding route guards.
- Build first-run empty states.

Acceptance:

- New user can complete onboarding end-to-end.
- Slug save is disabled until local validation and latest availability pass.
- logo fallback/upload path is usable.
- User never loses entered fields after slug conflict.

### Track 3

- Support logo asset display rules for public/site avatar use.
- Define public-safe asset URL expectations with Track 1.
- Prepare public renderer to use workspace/site avatar once sites exist.
- Confirm tracking is not loaded during onboarding/app shell.

Acceptance:

- Uploaded/accepted workspace logo can be consumed by future site/public payloads.
- Public runtime has no dependency on auth onboarding code.

## Phase 2: Sites, Templates, Content Schema

Goal: a workspace can create and manage draft sites with valid structured content.

### Track 1

- Implement site schema:
  - workspace ID,
  - slugs,
  - status,
  - visibility,
  - draft content,
  - published version pointer,
  - creator/updater/publisher/archive fields.
- Implement content schema package when editor/API/public need shared validation.
- Implement starter templates as valid draft payloads.
- Implement site create/list/detail/update/archive/restore/duplicate APIs.
- Implement site slug uniqueness and reserved words.
- Implement archive as the V1 destructive-feeling action.
- Implement plan-limit hooks even if limits are generous.

Acceptance:

- Sites are workspace-scoped.
- Draft and published snapshot concepts are separate from the start.
- Archived sites keep slugs reserved and count toward limits.
- Duplicate respects edit vs view/copy access when access exists.

### Track 2

- Build Sites page:
  - table/list,
  - status,
  - search,
  - sort,
  - filters,
  - row actions,
  - empty states,
  - create site flow,
  - duplicate/archive/restore UI.
- Build create-from-template flow.
- Build site settings shell for name/slug/avatar/basic metadata.
- Build route from site row to editor.

Acceptance:

- User can create a draft from a template.
- Sites list does not load draft content.
- Row actions respect permissions/state.
- Archive/restore confirmations explain public-link impact.

### Track 3

- Create public renderer fixture coverage for valid template payloads.
- Define media and embed field behavior for content schema.
- Implement safe fallback for unsupported blocks in old published snapshots.
- Start public page visual smoke tests with template payloads.

Acceptance:

- Every starter template can render through the public renderer fixture path.
- Public renderer rejects/handles invalid content safely.

## Phase 3: Editor MVP

Goal: a user can build and save a simple one-page sales site.

### Track 1

- Implement draft update/autosave endpoint with optimistic concurrency or draft revision.
- Implement typed editor operation model or controlled draft-save model for MVP.
- Implement publish validation service shared with frontend where useful.
- Implement asset upload intent/finalize endpoints for editor images.
- Implement variable CRUD in draft content/schema.
- Implement server validation before persistence.

Acceptance:

- Autosave cannot overwrite newer draft without detection.
- Draft content validates before save.
- Asset references are workspace-scoped.
- Variable references are stable by `variableId`.

### Track 2

- Build editor shell:
  - header actions,
  - canvas,
  - inspector,
  - insert controls,
  - save status,
  - publish/share entry points.
- Implement core blocks:
  - heading,
  - text,
  - button/link,
  - image,
  - divider.
- Implement drag/reorder.
- Implement inspector controls.
- Implement local undo/redo.
- Implement variables:
  - create,
  - insert,
  - rename,
  - delete with usage checks,
  - chips in editor content.
- Implement draft preview.
- Implement validation display.

Acceptance:

- User can build a simple one-pager.
- Autosave status is clear and calm.
- Undo/redo handles normal local edits.
- Broken required fields block publish readiness but not drafting.
- Editor remains desktop-first and does not pretend full mobile editing is ready.

### Track 3

- Keep public renderer compatible with editor output.
- Implement renderer components for MVP blocks.
- Implement URL/embed sanitization needs with Track 1.
- Implement public media rendering:
  - dimensions,
  - alt/decorative behavior,
  - missing optional media fallback,
  - required media publish blockers via Track 1.

Acceptance:

- Editor-created MVP blocks render accurately in public renderer fixtures.
- Public renderer still imports no editor UI.

## Phase 4: Publishing, Public Rendering, Sharing

Goal: internal drafts can become stable public links without draft leakage.

### Track 1

- Implement publish transaction:
  - validate draft,
  - create immutable publish version/snapshot,
  - update published pointer/status,
  - enqueue cache invalidation/outbox event.
- Implement unpublish.
- Implement version model:
  - initial,
  - autosave checkpoint,
  - publish,
  - rollback,
  - migration.
- Implement public route lookup endpoint/service for workspace/site slugs.
- Implement public-safe payload shape.
- Implement public 404 behavior for draft/unpublished/archived/suspended/deleted.
- Implement metadata fields in published snapshot:
  - title,
  - description,
  - OG image asset,
  - robots/indexing state.

Acceptance:

- Status cannot be `published` without an immutable published version.
- Public payload cannot include draft/private/member data.
- Unpublish/archive invalidates public availability.
- OG image changes affect public metadata only after publish/republish.

### Track 2

- Build publish dialog:
  - validation blockers,
  - warnings,
  - publish success,
  - public link.
- Build share modal:
  - default link,
  - copy link,
  - draft/unpublished warnings,
  - open public link.
- Build version history UI shell.
- Build rollback confirmation and draft-only messaging.
- Build UI indicators for `published`, `draft`, `archived`, and `unpublished changes`.

Acceptance:

- User understands what is live and what is draft.
- Publish UI does not show live status until server confirms.
- Rollback UI clearly says it restores draft only.

### Track 3

- Implement public route rendering.
- Implement public metadata and OG behavior.
- Implement robots behavior:
  - V1 defaults to `noindex,nofollow`,
  - preview bots can still fetch metadata/images.
- Implement public route cache strategy in code/config.
- Implement public 404/unavailable pages.
- Implement public page accessibility/mobile checks.

Acceptance:

- Published public link works.
- Draft changes do not leak.
- Public page is mobile-ready.
- Public route remains usable if tracking is down.
- Public renderer works from immutable snapshot payload only.

## Phase 5: Variants And Personalization

Goal: a user can create recipient-specific public links that personalize published content.

### Track 1

- Implement variant schema:
  - site/workspace,
  - name,
  - slug,
  - recipient metadata,
  - variable values by stable `variableId`,
  - revision number,
  - status if needed.
- Implement variant slug reservation/tombstones.
- Implement create/edit/delete/duplicate APIs.
- Implement variant public availability checks.
- Implement variant variable validation against published snapshot.
- Implement audit/activity metadata for live variant changes.

Acceptance:

- Variant slug changes reserve old slug and old link returns 404 in V1.
- Variant saves increment revision.
- Variant overrides apply only to variables present in published snapshot.
- Deleted variant routes fail closed.

### Track 2

- Build variant list modal.
- Build create/edit/duplicate/delete flows.
- Build variable override fields.
- Build variant preview.
- Add variants entry point from editor/share modal.
- Build copy variant link behavior and warnings.

Acceptance:

- User can create and copy a personalized link.
- Draft-only variable changes are labeled as not live until republish.
- Link-changing actions require confirmation.

### Track 3

- Implement public variant route.
- Implement variable resolution:
  - variant override,
  - site default,
  - safe fallback.
- Include variant revision in cache keys.
- Ensure variant public payload does not expose private recipient fields except content explicitly rendered through variables.

Acceptance:

- Variant link renders published snapshot with overrides.
- Variant changes update public output after save without republishing site structure.
- Variant route does not leak draft-only variables.

## Phase 6: Tracking And Analytics

Goal: public engagement is tracked without slowing or breaking public pages.

### Track 1

- Implement tracking schema/package.
- Implement visitor session and analytics event tables.
- Implement ingest endpoint:
  - batch support,
  - rate limits,
  - bot/preload classification,
  - validation,
  - privacy minimization.
- Implement analytics summary/read APIs.
- Implement retention policy hooks.
- Implement tracking permission checks.

Acceptance:

- Invalid tracking events are rejected safely.
- Tracking ingest cannot choose arbitrary workspace/site IDs.
- Bot/preview events do not count as human visits.
- Analytics APIs are workspace/site scoped.

### Track 2

- Build Tracking page:
  - site/variant filters,
  - date range,
  - summary cards,
  - activity feed,
  - click/scroll/time sections,
  - empty states,
  - bot/preview separation.
- Add per-site analytics entry points from Sites and editor/share flows.

Acceptance:

- Tracking page handles no-data, loading, filtered-empty, and permission states.
- Copy speaks honestly: visits/sessions, not known people unless identity is reliable.

### Track 3

- Implement tracking script:
  - page view,
  - heartbeat/time spent,
  - scroll depth,
  - configured click tracking,
  - unload/beacon behavior,
  - defensive failure handling.
- Implement Slack/preview bot signal:
  - metadata request,
  - OG image request,
  - `link_preview_loaded`.
- Ensure script is small and deferred.
- Ensure public rendering does not depend on tracking.

Acceptance:

- Tracking failure never breaks public page.
- Scroll/time/click events are batched and bounded.
- Preview bots are classified separately.
- Public page budget remains acceptable.

## Phase 7: Team Access And Permissions

Goal: workspaces can invite teammates and control site access without leaks.

### Track 1

- Implement invite schema and lifecycle:
  - pending,
  - accepted,
  - revoked,
  - expired,
  - send failed.
- Implement invite/revoke/resend/accept APIs.
- Implement admin-only invite policy in V1.
- Implement role change and member removal.
- Implement last-admin protection.
- Implement site access:
  - private/team visibility,
  - entire-team role,
  - specific member grants,
  - strongest-role-wins.
- Implement permission tests.

Acceptance:

- Removed members lose access on next request/realtime check.
- Last admin cannot be removed/demoted.
- Site access is enforced server-side.
- Public routes reveal no member/access details.

### Track 2

- Build Team page:
  - active members,
  - pending invites,
  - invite dialog,
  - resend/revoke,
  - role change,
  - remove member.
- Build Site Access modal.
- Add permission-aware route/action states.
- Add invite acceptance UI and mismatch states.

Acceptance:

- Admin can invite and manage teammates.
- Non-admins do not see mutation controls.
- Permission-denied states are calm and useful.

### Track 3

- Ensure public/runtime analytics remain valid when access changes.
- Ensure tracking dashboard public-link references do not leak team data.
- Ensure public routes remain independent from team access rows.

Acceptance:

- Site access changes affect app access only.
- Public availability remains controlled by publish/snapshot/workspace state.

## Phase 8: Version History, Collaboration, Recovery

Goal: users can recover from mistakes and collaborate safely without high-cost realtime.

### Track 1

- Implement version history APIs.
- Implement rollback transaction.
- Implement autosave checkpoint retention.
- Implement editor presence/realtime room authorization.
- Implement server-sequenced operations or CRDT persistence strategy.
- Implement stale revision/conflict behavior.
- Implement permission change disconnects.

Acceptance:

- Rollback restores draft only.
- Rollback creates a new checkpoint and preserves later history.
- Realtime room join requires edit permission.
- Realtime degradation can fall back to saved draft/refetch.

### Track 2

- Build version history UI:
  - list,
  - preview,
  - restore confirmation.
- Build collaboration UI:
  - presence,
  - read-only state,
  - reconnect/degraded messaging.
- Wire undo/redo with collaboration boundaries.
- Ensure editor handles permission loss and archived site state.

Acceptance:

- Two editors do not overwrite each other in normal cases.
- User understands when realtime is degraded.
- User can restore prior draft state safely.

### Track 3

- Ensure public renderer supports older published snapshot schema via adapters/migrations.
- Ensure publish/rollback/cache invalidation interactions are tested.
- Ensure retained assets for versions/snapshots are not deleted.

Acceptance:

- Old published snapshots remain renderable after content schema changes.
- Public pages remain stable through rollback until republish.

## Phase 9: Production Hardening

Goal: Handout can be used by real teams with observable, recoverable failures.

### Track 1

- Add worker app or controlled worker process when jobs leave request path.
- Implement outbox/job table.
- Implement email provider abstraction.
- Implement audit ledger.
- Implement rate limits.
- Implement backup/restore verification plan.
- Implement operational scripts:
  - revalidate published snapshots,
  - rebuild asset usage,
  - recompute analytics summaries,
  - expire invites,
  - repair invalid draft reports.
- Add CI gates.

Acceptance:

- Jobs are idempotent.
- Audit/security events exist for sensitive actions.
- Critical API flows have tests.
- Operational scripts are dry-run by default.

### Track 2

- Add app-wide accessibility pass.
- Add responsive pass for app/editor public-adjacent previews.
- Add e2e smoke for:
  - onboarding,
  - create site,
  - edit,
  - publish,
  - create variant,
  - view tracking,
  - invite teammate.
- Add design-system regression review.
- Clean loading/error/empty states.

Acceptance:

- Primary workflows are covered by e2e or manual launch checklist.
- UI does not overlap or break on core desktop/mobile viewports.
- Design system page reflects current components.

### Track 3

- Add public page performance budgets and checks.
- Add public accessibility checks.
- Add CSP/security header validation.
- Add public render smoke tests for:
  - default site,
  - variant site,
  - missing optional media,
  - unavailable route,
  - preview bot.
- Add tracking ingest load/cost guardrails.
- Add cache invalidation verification.

Acceptance:

- Public page excludes app/editor bundles.
- Tracking script is small and defensive.
- Public pages remain fast and stable.
- Cache correctness does not depend only on invalidation.

## Parallel Work Map

| Build Slice | Track 1 | Track 2 | Track 3 |
| --- | --- | --- | --- |
| Foundation | API, DB, auth skeleton, env, errors | shell, design system, routing | public runtime skeleton |
| Onboarding | auth/workspace/logo APIs | signup/setup/switcher UI | logo asset consumption |
| Sites | schema, CRUD, templates | sites list/create/archive UI | template render fixtures |
| Editor | autosave, validation, variables APIs | editor blocks/inspector/undo | renderer block parity |
| Publishing | transaction, versions, public payload | publish/share/version UI | public route/metadata/cache |
| Variants | variant APIs/reservations | variant modal/preview/share | variant public resolution |
| Tracking | ingest, event tables, analytics APIs | tracking dashboard | script, bot classification |
| Team | invites, roles, site access APIs | team/access UI | public independence checks |
| Collaboration | realtime auth, ops, rollback APIs | presence/recovery UI | snapshot compatibility |
| Hardening | jobs, audit, rate limits, CI | e2e/a11y/UI polish | public perf/CSP/cache |

## Critical Dependency Rules

- Track 2 can mock API data only behind clearly named fixtures. Replace mocks when Track 1 endpoint exists.
- Track 3 can render fixture payloads before publishing exists. Replace with public payload contract when Track 1 endpoint exists.
- Track 1 should not wait for complete UI before writing invariants, migrations, and service tests.
- Track 2 should not invent product data shapes that conflict with API contracts.
- Track 3 should not import authenticated app modules to move faster.
- Publishing requires all three tracks:
  - Track 1 transaction,
  - Track 2 publish UI,
  - Track 3 public renderer.
- Tracking requires all three tracks:
  - Track 1 ingest/schema,
  - Track 2 dashboard,
  - Track 3 public script.

## Merge And Review Gates

Before any substantial feature is considered complete:

- Behavior maps to `app-spec.md`.
- API contract and frontend types agree.
- Database constraints back up key invariants.
- Server permissions are tested.
- UI states exist for loading, empty, error, success, and permission-denied.
- Public/private boundary is checked.
- Public route imports are checked for app/editor leakage.
- Tests cover at least happy path, permission failure, validation failure, and one race/conflict edge where relevant.
- Observability exists for unexpected failures.
- Feature-specific runbook notes exist when customers can be blocked.

## Track-Specific First Tasks

### Agent 1 First Tasks

1. Create/confirm `packages/config` or equivalent config boundary.
2. Audit current DB schema against workspace/site/auth requirements.
3. Define request context and API error envelope.
4. Add domain helpers for slug validation and work-email validation.
5. Write the first service tests for workspace creation and slug conflict.

### Agent 2 First Tasks

1. Audit current app routes/components against `AGENTS.md`.
2. Stabilize app shell, sidebar, and design-system route.
3. Create API client/query conventions.
4. Build onboarding route states with mocked contract data if needed.
5. Build Sites page shell and empty states.

### Agent 3 First Tasks

1. Create public-site feature boundary.
2. Define published payload fixture with Track 1.
3. Render a static public site from fixture payload.
4. Add public metadata/OG/default robots behavior plan.
5. Create tracking schema draft with Track 1.

## Risks To Watch

- Public renderer accidentally imports editor/app shell code.
- Client-side permission checks drift from backend enforcement.
- Draft and published content blur.
- Variant overrides use mutable variable names instead of stable IDs.
- Tracking volume grows before aggregation/retention exists.
- Sites list loads too much draft/editor data.
- Team access rules become scattered across components.
- logo.dev, email, storage, or tracking failures block unrelated workflows.
- Version history grows without retention policy.
- Agent tracks create parallel type/schema definitions instead of shared contracts.

## Done For V1

V1 is ready when:

- A new user can sign up with work email and create a workspace.
- Workspace logo/website/slug setup works.
- User can create a site from a template.
- User can edit a simple one-pager with core blocks and variables.
- User can publish a stable public link.
- Draft changes never leak to public pages.
- User can create variant links with overrides.
- Public visits, time, scroll, clicks, and preview bots are tracked safely.
- Admin can invite/remove teammates and control site access.
- Version history/rollback protects against major mistakes.
- Public pages are fast, mobile-ready, accessible enough for launch, and independent from app/editor bundles.
- Critical flows have tests and operational visibility.
