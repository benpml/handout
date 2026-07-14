# Source Ledger and Glossary

## Purpose

This file records where the claims in the sales-context pack came from and how to interpret product terminology. It helps a human or AI agent refresh the pack when the product changes.

## Source priority

Use this order when sources conflict:

1. Live product behavior and current authoritative contracts.
2. Focused implementation-status documents marked implemented.
3. Current source code and tests.
4. Focused product specifications that supersede older broad specs.
5. The broad `app-spec.md` and historical briefs.
6. Sales recommendations in this folder.

## Known supersession rules

- `site-rendering-architecture.md` and `site-sidebar-pages-spec.md` supersede old flat-block/site-content descriptions in `app-spec.md` and the older agent skill.
- `recipient-sharing-spec.md` supersedes older “variant copy” or detached-copy descriptions. Sales language should use recipient.
- `event-tracking-privacy-hardening-spec.md` supersedes older analytics/replay-era descriptions in `app-spec.md` and deleted tracking specifications.
- Live `handout_get_capabilities` should supersede static MCP schema examples.

## Primary product sources

### `/README.md`

Supports:

- Product summary as a lightweight sales one-page site builder.
- Core app surfaces.
- Public hosting architecture direction.

Caution:

- Technical/hosting recommendations are not contractual production claims.

### `/app-spec.md`

Supports:

- Broad product purpose and principles.
- Workspaces, sites, drafts, publishing, roles, permissions, and lifecycle concepts.
- Buyer-site use cases and original tracking/product goals.
- Product analytics versus customer-facing tracking distinction.

Caution:

- This is a large living spec with historical sections. Focused newer specs supersede editor, sharing, and tracking details.

### `/brief.md`

Supports:

- Original product intent: sales one-pager builder for teams sending more information to prospects.
- Early feature framing.

Caution:

- Historical. Do not use for current pricing, content schema, public URLs, or detailed capabilities.

## Editor and rendering sources

### `/site-rendering-architecture.md`

Status: marked implemented and verified in code.

Supports:

- Canonical Tiptap JSON content.
- Shared Preview/published renderer and stylesheet.
- Immutable publish snapshots.
- Schema version 3.
- Pages, variables, sidebar, theme modes.
- Public static rendering and tracking attributes.
- Agent/MCP ownership boundary.

### `/site-sidebar-pages-spec.md`

Status: marked implemented.

Supports:

- Multiple pages/tabs.
- Site-level sidebar sections, links, and next-step buttons.
- Visible/hidden behavior.
- Public tab switching and tracking.

### `/apps/web/src/features/editor/tiptap/extensions/suggestion-menu.ts`

Supports current editor slash-command content types:

- Text, headings, quote, code, emoji.
- Lists.
- Page title.
- Image/icon cards, testimonial, logo grid, button.
- Image, GIF, calendar, video.
- Grid, table, divider.

### `/apps/web/src/features/editor/components/site-settings-menu.tsx`

Supports:

- Rename and duplicate site.
- Theme modes: light, dark, system.

### `/apps/web/src/features/editor/use-site-collaboration.ts`

Supports:

- Collaborative/autosave/reconnect/offline-aware client behavior.

Caution:

- Confirm production enablement and limits.

## Personalization and sharing sources

### `/recipient-sharing-spec.md`

Supports:

- Site/recipient model.
- Required name/company and optional website.
- Stable generated recipient links.
- New/Past recipient share flow.
- Copy link and email embed.
- No detached recipient content.
- Recipient-context tracking.

### `/apps/web/src/features/editor/recipients/recipient-model.ts`

Supports:

- Current recipient fields.
- Stable slug behavior.
- Public URL and screenshot/embed URL construction.
- Linked HTML email embed with plain-text fallback.

### `/apps/web/src/features/editor/recipients/recipient-share-dialog.tsx`

Supports:

- Current share UI.
- New recipient, Past recipients, recipient detail, editing, deletion, copy link, copy embed, preview.

### `/apps/web/src/features/editor/tiptap/variables.ts`

Supports example/built-in variables:

- Name, company, website, pain point, company logo, booking URL.

## Gmail extension sources

### `/gmail-chrome-extension-spec.md`

Status: implementation baseline.

Supports:

- Product outcome and full Gmail workflow.
- Compose-recipient assistance.
- Site/recipient selection.
- Insert card/link and Preview.
- Explicit deferred items and privacy model.

### `/apps/web/src/features/gmail-extension/*`

Supports:

- Implemented extension panel, background, content script, contracts, and tests.
- Site selection, recipient flow, and insertion actions.

### `/apps/web/extension/README.md`

Supports:

- Manifest V3 build/load workflow.
- Authentication model.
- Permissions and data exclusions.
- Release prerequisites.

Caution:

- Does not prove public Chrome Web Store distribution.

## Tracking sources

### `/event-tracking-privacy-hardening-spec.md`

Status: application implementation complete; production/legal gates remain.

Supports:

- Event-only replacement.
- Included and excluded events/data.
- No replay, persistent device ID, raw IP storage, arbitrary capture, or full URL/path/referrer analytics.
- First-party analytics purpose.
- Session semantics.
- Slack preview caveat.
- Retention and internal-network controls.
- Remaining production launch gates.

### `/packages/tracking-schema/src/v2.ts`

Supports:

- Current event types.
- Session/event schemas.
- Retention options.
- Session lifecycle constants.
- Modeled element and destination types.

### `/apps/web/src/features/tracking/tracking-page.tsx`

Supports:

- Sessions and Events views.
- Current user-facing fields and labels.
- Recipient/site/activity/duration/time presentation.

Caution:

- The Sessions action currently says “Watch,” but replay code/routes are removed. Treat it as opening session details/activity, not playback.

### `/apps/web/src/features/tracking/tracking-settings-panel.tsx`

Supports:

- Site-level activity tracking.
- Retention settings.
- Internal office/VPN network suppression.
- UI privacy statement.

### `/apps/web/src/features/tracking/tracking-details-model.ts`

Supports:

- Device/location/session-end user-facing formatting.
- Event action labels.

## Billing sources

### `/plans-and-billing-implementation.md`

Status: implementation checklist complete.

Supports:

- Free/Core/hidden-Pro plan definitions.
- Pricing.
- Site/publish limits.
- Per-seat workspace billing.
- Stripe checkout/portal behavior.

### `/apps/web/src/features/billing/billing-page.tsx`

Supports:

- Current visible Free/Core UI.
- Current price display.
- Core feature copy.
- Pro not shown in primary page.

Caution:

- Pricing is time-sensitive and must be refreshed.

## Agent/MCP sources

### `/packages/mcp/README.md`

Supports:

- MCP tool inventory and purpose.

### `/packages/mcp/src/index.ts`

Supports:

- Current registered MCP tools.
- Canonical schema-3/Tiptap workflow.
- Site/recipient/publish/tracking operations.

### `/agent/handout-agent-prompt.md`

Supports:

- Recommended safe agent workflow: read, validate, explicit publish, batch recipient creation, tracking summary first.

Caution:

- Parts of this prompt refer to older content shapes and should defer to live capabilities.

### `/agent/handout-skill/SKILL.md`

Caution:

- Stale schema version 2/flat-block examples. Do not use as current schema truth.

## Team/workspace sources

### `/apps/web/src/features/onboarding/onboarding-page.tsx`

Supports:

- Workspace setup, public namespace, website/logo workflow.

### `/apps/web/src/features/team/team-page.tsx`

Caution:

- Uses sample data in current source. It is useful for intended UI/role language but not proof of complete production team management.

## Sales recommendations versus product facts

The following are recommendations derived from the product, not direct product claims:

- ICP definitions and prioritization.
- Persona pain points.
- Positioning statement and category recommendation.
- Discovery questions.
- Demo structure.
- Pilot design.
- Objection responses.
- ROI measurement approach.

These should evolve through customer evidence.

## Glossary

### Active time

Bounded session time credited while the page is active. It is an estimate of engagement, not proof of human attention.

### Buyer site

Recommended sales category language for the recipient-facing Handout.

### Canonical document

The authoritative Tiptap JSON representation of a site page. The editor, Preview, and published renderer rely on this model.

### Core

The current visible paid plan for publishing and recipient use.

### Draft

Editable site content inside the app. It is not public until published.

### Email embed/card

A linked image representation of the personalized Handout copied or inserted into email, with a plain-text link fallback.

### Event

One supported modeled action or server signal, such as a site visit, button click, supported link click, tab switch, Slack preview, or webhook send.

### Gmail extension

The Manifest V3 Chrome extension build that adds a Handout sharing workflow to Gmail compose.

### Handout

The product and also a seller-created buyer site, depending on context.

### Manifest

In tracking, the immutable server-owned safe dictionary that validates supported element identities and labels for an exact published/recipient rendering. Not a browser-extension manifest in this context.

### MCP

Model Context Protocol. Handout’s MCP server exposes structured tools to AI/automation clients.

### Modeled action

A product-supported interaction deliberately given a stable tracking identity. It excludes arbitrary DOM interactions.

### Page/tab

A logical visible portion of a Handout. Multiple visible pages render as tabs.

### Preview

Draft rendering shown to the seller before publishing. Preview does not start tracking.

### Published version

An immutable validated site snapshot currently served publicly.

### Recipient

A named person/account share context with identity fields, variable values, and a stable recipient link.

### Recipient link

A public URL that resolves the published master site with recipient-specific values and attribution context.

### Session

One page-memory visit. Reload/new tab creates another session. It is not a persistent unique visitor.

### Slack preview signal

A server-side signal from a Slack/Open Graph preview request. It is probabilistic and not definitive human activity.

### Site

The reusable master sales experience owned by a workspace.

### Variable

A named placeholder with a default and recipient-specific override.

### Variant

Older/internal/API term for the recipient-specific share record. Prefer “recipient” externally.

### Workspace

The company/team account that owns sites, members, settings, and billing.

## Refresh checklist

Before using this folder for a major sales cycle, verify:

- Live Free/Core pricing.
- Gmail extension distribution.
- MCP production access and packaging.
- Current tracking event types and UI labels.
- Tracking retention defaults and operational enforcement.
- Team/member/permission implementation.
- Public-link and domain behavior.
- Security/legal documents and certifications.
- Current deployment/subprocessors.
- Approved customer proof.
- Templates and integrations.

Record material changes by updating the relevant context file and this source ledger together.
