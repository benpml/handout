# Capabilities and Workflows

## Capability summary

Handout covers the full lifecycle of a seller-created buyer site:

- Create and manage sites inside a workspace.
- Author rich, multi-page content in a collaborative editor.
- Preview the exact recipient-facing rendering.
- Publish immutable public versions.
- Personalize the same site with variables.
- Create and manage recipient-specific links.
- Copy a direct link or visual email embed.
- Insert a recipient link or email card from Gmail.
- Track sessions and explicit modeled actions.
- Configure retention and internal-traffic suppression.
- Use agent/MCP tools to create and operate sites programmatically.
- Manage plan and publishing access through workspace billing.

This document distinguishes implemented capabilities from areas that require availability confirmation.

## 1. Site creation and management

### Current product behavior supported by the repository

- Create a named site as a private draft.
- Generate a site slug/public path from the site name.
- List and search sites in a workspace.
- See site status, recipient count, and updated time.
- Open the editor or site detail view.
- Duplicate a site from the editor flow.
- Rename a site.
- Delete a site with a confirmation flow.
- Publish and unpublish a site.
- Keep draft content separate from the immutable published version.
- Show a published public URL only when the site is live.
- Keep recipient links attached to the same master site.

### Sales value

- Sellers can standardize a repeatable follow-up without freezing it into a PDF.
- Draft/published separation protects buyers from half-finished edits.
- A master site reduces duplicate collateral and version drift.
- Site detail pages centralize preview, recipients, tracking settings, and basic metadata.

### Availability cautions

- Site archive/restore behavior is extensively specified, but the visible current site actions emphasize delete; confirm the exact live lifecycle before demonstrating archive.
- Team access controls are product-specified, but the current team UI contains scaffold/sample surfaces. Do not promise granular permissions without checking the live workspace.
- Custom domains are not established as a current sellable capability.

## 2. Collaborative sales-site editor

### Authoring experience

The editor is Tiptap/ProseMirror-based and designed to feel closer to Notion than to a traditional page builder. Content is edited directly in a structured document with slash commands, drag/reorder controls, inline text formatting, and block configuration.

Current content types include:

- Paragraph text.
- Heading 1, Heading 2, and Heading 3.
- Quotes.
- Code blocks.
- Emoji.
- Bullet lists.
- Numbered lists.
- Task lists for mutual next steps.
- Icon lists.
- Page-title treatment with logos.
- Image cards with copy and CTA behavior.
- Icon cards.
- Testimonials.
- Logo grids.
- Buttons.
- Images.
- GIFs.
- Booking-calendar embeds.
- Hosted video embeds.
- Grids for columns or rows.
- Tables.
- Dividers.

The editor also supports standard text behaviors such as links, emphasis, colors/highlights, and block transformations where the schema allows them.

### Multi-page structure and sidebar

A Handout can have multiple ordered pages. Visible pages become tabs. The seller can add, rename, select, order, hide, or delete pages within product limits.

The site-level sidebar can include:

- Tabs/pages.
- Named links.
- “Next steps” buttons.
- Custom section labels.
- Filled or outline button styles.

If a site has no sidebar items and only one visible page, the public experience does not render an empty sidebar.

### Theme and presentation

The current theme modes are:

- Light only.
- Dark only.
- System theme, matching the visitor’s appearance preference.

Public sites are rendered from the same canonical document and stylesheet used by editor Preview. Public pages are designed to be mobile-responsive and do not ship the full editor to the recipient.

### Collaboration, save, and reliability

The current architecture includes collaborative editing, autosave, concurrent updates, save-status feedback, reconnect recovery, and offline-aware behavior. Sales can position this as a team-authoring benefit, but should verify the production collaboration rollout before making guarantees about a specific concurrency count or SLA.

### Sales value

- Reps can assemble persuasive follow-up without design or engineering support.
- Revenue enablement can provide a consistent structure while sellers tailor the story.
- Multiple stakeholders can contribute to a deal experience.
- Pages and sidebar actions make complex follow-up easier to navigate than one long document.
- Preview/publish parity reduces “it looked different after publishing” risk.

## 3. Variables and reusable personalization

### How personalization works

Variables are placeholders owned by the master site. The seller inserts a variable in content or a supported field, defines its default, and provides recipient-specific values when creating a recipient.

Built-in or example variables in the editor include:

- Recipient name.
- Recipient company.
- Recipient company website.
- Company logo.
- Pain point.
- Booking URL.

Teams can create additional variables for their own motion, such as:

- Priority initiative.
- Relevant proof point.
- Recommended plan.
- Implementation timeline.
- ROI assumption.
- Executive sponsor.
- CTA label or destination.
- Region or industry.

### Personalization model

- The base site remains the source of truth.
- Recipient values override defaults.
- A recipient does not get a detached editable copy of the site.
- Site-level structural updates flow through to the recipient experience when republished.
- Recipient values can be edited without changing the recipient’s stable link.
- Existing recipient slugs must not later resolve to a different recipient.

### Sales value

- One asset can serve many accounts without looking generic.
- Teams avoid the operational cost of one page copy per prospect.
- Personalization becomes a controlled system rather than manual find-and-replace.
- The same variable can stay consistent across the entire buyer experience.

## 4. Recipient links and sharing

### Recipient creation

A recipient stores:

- Name.
- Company.
- Optional website/domain.
- Values for the site’s custom variables.
- A stable generated link slug.

The optional website is used to derive a company logo when available. If no logo resolves, the product falls back to initials or a generic recipient treatment.

### Recipient link behavior

- The link is generated rather than manually authored.
- The current public shape uses the Handout public origin plus workspace/site/recipient path data.
- Name, company, website, or variable edits do not change the already-created link.
- Deleting a recipient makes the link unavailable.
- The recipient link supplies the recipient context used for personalization and engagement attribution.

### Share workflow in the app

The share experience includes:

- “New recipient” and “Past recipients” views.
- Required name and company fields.
- Optional website.
- Site-specific custom variable fields.
- A recipient list with logo/initial fallback.
- A detail view for editing recipient values.
- Copy link.
- Copy email embed.
- A visual preview image representing the personalized site.

### Email embed

The email embed is a linked image card. Its image represents the personalized Handout and points to the recipient URL. The clipboard includes an HTML version and a plain-text link fallback.

### Sales value

- A seller can send a visually richer follow-up without asking the buyer to open an attachment.
- Stable links keep forwarded emails usable.
- Past-recipient reuse prevents duplicate links and fragmented engagement history.
- Recipient context makes engagement signals more useful than anonymous page traffic.

## 5. Gmail extension workflow

### Implemented build behavior

The repository contains a Manifest V3 Chrome extension build integrated with Gmail compose. It shares Handout’s design system and API contracts rather than creating a separate recipient database.

The target flow is:

1. Open or reply in Gmail.
2. Click “Share a Handout” in the compose toolbar.
3. Reuse the current Handout web session or connect through the first-party sign-in flow.
4. Search and select a published site.
5. Create a new recipient or reuse a past recipient.
6. Fill required identity and custom-variable values.
7. Preview the personalized site.
8. Insert a linked email card or a descriptive link into the correct Gmail draft.

The extension supports multiple compose windows and is designed to insert only into the compose instance that opened the Handout panel.

### Recipient assistance

The extension can use the primary Gmail “To” recipient to suggest a name and a company website/domain. Company remains seller-editable because a domain is not reliable company truth. The extension intentionally does not claim to match recipients by email in V1 because the canonical recipient model does not store recipient email.

### Privacy boundary

The extension does not read or send:

- Email subject.
- Email body.
- Thread history.
- Attachments.
- Gmail contacts.
- Google account tokens.

It does not require Gmail API access and does not use message-tracking pixels.

### Availability caution

The extension is implemented as a build target and has local/release documentation. Public Chrome Web Store approval and customer distribution are not confirmed by this context pack. Present it as an implemented extension workflow, then confirm deployment/installation availability.

## 6. Engagement tracking

### What Handout tracks

The current event-only system supports:

- Site visit/session start.
- Explicit button click.
- Supported link click.
- Tab switch.
- Slack preview signal from the Open Graph image request.
- Webhook-send event where customer webhook behavior is enabled.

Tracked surfaces are deliberately modeled. Examples include button blocks, supported links, image-card CTAs, sidebar links, sidebar buttons, and page/tab changes.

### What sellers can see

The tracking area includes Sessions and Events views.

Session context can include:

- Recipient or default public link.
- Site.
- Start and last-seen time.
- Duration/active time.
- Event count.
- Initial logical page.
- Broad device/operating-system classification.
- Coarse location where available.
- Session end state/reason.

Event context can include:

- Recipient.
- Site.
- Event type.
- Server-owned label for the modeled element or tab.
- Safe destination category or hostname where appropriate.
- Time.
- Session context when the event belongs to a human session.

### What tracking does not do

The current design does not capture:

- Session replay, screen recording, DOM snapshots, cursor movement, or scroll replay.
- Typed, pasted, selected, or submitted values.
- Arbitrary clicks or arbitrary DOM text.
- Full URLs, paths, queries, fragments, or referrers in analytics.
- Raw IP storage.
- Cookies or persistent visitor/device IDs.
- Cross-session “unique person” identity.
- Email opens or message pixels.

### Tracking controls

Workspace administrators can configure site-level activity tracking and choose a retention period from the product-supported options: 30, 90, 180, or 365 days.

Internal office or VPN networks can be added as IP/CIDR ranges so activity from those networks is excluded. Raw IP addresses are used transiently for suppression and coarse location but are not stored in product databases.

### Sales value

- Know whether a recipient link produced activity.
- See which modeled pages or actions received attention.
- Time follow-up based on evidence instead of guesswork.
- Distinguish human sessions from preview signals.
- Retain useful engagement context without introducing surveillance-heavy tracking.

### Critical language boundary

Say “sessions,” “activity,” and “events.” Do not say “unique visitors,” “watched the person,” “recording,” or “we know exactly who opened it” unless a recipient-specific link supplies the identity context and the wording makes clear that attribution comes from the link.

## 7. Slack and preview signals

When Slack or another client requests the Open Graph preview image, Handout can record a preview signal tied to the share context.

Correct interpretation:

- The link was likely processed for an unfurl/preview.
- This can be useful evidence that the link entered Slack or a similar client.

Incorrect interpretation:

- A human definitely shared it.
- A specific person definitely viewed it.
- The Slack request’s location/device belongs to the recipient.

Use “Slack preview loaded” or “Slack share signal,” not a definitive human-share claim.

## 8. Agent and MCP capabilities

The repository includes a Handout MCP server intended for AI and automation clients. Current tools cover:

- Read product capabilities and canonical content schema.
- List sites.
- Create a site.
- Read and update site metadata.
- Read and replace canonical site content with optimistic revision control.
- Validate content before publishing.
- Publish and unpublish.
- List recipients/variants.
- Batch-create or update recipients/variants.
- Return default and recipient public URLs.
- Read tracking summaries.
- List detailed tracking events.
- List tracking sessions.

### Sales value

- An AI sales agent can help generate and personalize buyer sites at scale.
- Repetitive site/recipient operations can be automated without bypassing validation.
- An agent can use engagement context to prepare a seller’s next action.

### Boundary

MCP availability, production authentication, and the exact content schema are operational matters. Do not promise a turnkey external API or a specific third-party agent integration until access is confirmed. The current billing spec places API access in a hidden/deferred Pro concept, even though the MCP code exists.

## 9. Billing and packaging controls

The current repository-defined model is:

- Free: up to 10 non-archived draft sites; publishing requires an upgrade.
- Core: unlimited published sites and recipients, subject to abuse guardrails.
- Pro: backend-supported but intentionally hidden from the primary UI until additional features ship.

Workspace billing uses per-seat subscriptions. Admins manage checkout and the Stripe billing portal. See the pricing file for the exact repository-defined amounts and caveats.

## 10. Team and workspace capabilities

The product model supports:

- Company workspace and public namespace.
- Workspace website/logo setup.
- Admin and user roles.
- Team membership and invitations.
- Site visibility and scoped access concepts.
- Workspace-owned sites and billing.

However, some team-management screens currently include sample/scaffold data. Treat granular permissions, invitation operations, and full team administration as “confirm in the live environment” rather than an unconditional promise.

## 11. Public-site delivery and reliability

Public Handouts are built from immutable published snapshots and rendered as static HTML/CSS plus a small runtime for tabs and mobile navigation. Preview and published output share the same renderer and stylesheet.

Important product outcomes:

- Draft edits do not leak into the published experience until republished.
- Public sites remain useful without shipping editor code.
- Preview does not start a tracking session.
- Tracking failure does not make the public site unavailable.
- Public pages are designed for desktop and mobile recipients.

Avoid promising a specific uptime, latency, CDN footprint, SLA, or disaster-recovery posture without a current operational agreement.

## 12. Explicitly deferred or unsupported areas

Do not present these as current product capabilities without new evidence:

- CRM enrichment or native CRM synchronization.
- Contact database access.
- Automatic email-thread reading.
- Automatic follow-up or send interception.
- Message-tracking pixels.
- Session replay or browser recordings.
- Arbitrary click/DOM capture.
- Persistent visitor identity or cross-session unique-person analytics.
- Visitor form capture.
- Booking-completion tracking inside third-party calendar iframes.
- Custom domains.
- SSO/SAML, SCIM, SOC 2, ISO 27001, HIPAA, or other enterprise certifications.
- Broad customer-facing imports.
- Public Chrome Web Store distribution.
- Generally available API access under a published Pro plan.
