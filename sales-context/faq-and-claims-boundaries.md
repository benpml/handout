# FAQ and Claims Boundaries

## Product FAQ

### What is Handout?

Handout is a personalized sales-site platform for B2B teams. Sellers build a reusable buyer experience, tailor it with recipient variables, share a recipient-specific link or email card, and see privacy-safe sessions and explicit actions.

### Is it a one-page site builder?

That is the original shorthand, but current sites can contain multiple logical pages/tabs within one compact buyer experience. “Sales one-pager” remains useful category language if it does not imply only one tab.

### Who is it for?

B2B sellers, founders, sales leaders, enablement, RevOps, agencies, consultancies, and partner teams that repeatedly send personalized post-call material.

### What problem does it replace?

It reduces dependence on long recap emails, deck/PDF copies, link dumps, generic landing pages, and unnecessarily heavy digital sales rooms.

### Is it a CRM?

No. The CRM should remain the source of truth for accounts, contacts, opportunities, ownership, and pipeline.

### Is it a proposal or e-signature tool?

No. It can explain and present a recommendation, but formal quotes, terms, signatures, and payments belong in authoritative commercial systems.

## Editor FAQ

### What content can be added?

Current editor code supports text, multiple heading levels, quotes, code, emoji, bullet/numbered/task/icon lists, image and icon cards, testimonials, logo grids, buttons, images, GIFs, calendar and video embeds, grids, tables, dividers, and page-title treatments.

### Can a site have multiple pages?

Yes. Visible pages appear as tabs, with a site-level sidebar for tabs, links, and next-step buttons.

### Can teams collaborate?

The current architecture includes collaborative editing and autosave/reconnect behavior. Confirm production rollout and any concurrency limits before making an external guarantee.

### Can I preview before publishing?

Yes. Preview uses the same canonical rendering path as published output and does not start tracking.

### Do draft edits immediately change the public site?

No. Publishing creates an immutable public version. Later draft edits require republishing.

### Can I choose a theme?

Current modes are light, dark, and system.

### Are there templates?

Starter content concepts and empty-state templates exist in product code/specs, but a complete externally available template library should be verified before being sold.

## Personalization FAQ

### How does personalization work?

The master site defines variables and defaults. Each recipient provides values that resolve into the published site.

### Does Handout create a copy for every prospect?

No. The recipient does not own detached content. The base site remains the source of truth.

### What can be personalized?

Name, company, website/logo, pain point, booking URL, and user-created variables such as proof, recommendation, CTA, timeline, or industry context.

### Does changing recipient details break the link?

No. The recipient link is designed to stay stable when name, company, website, or variable values change.

### Does Handout store recipient email?

The current V1 recipient model intentionally does not store recipient email. The Gmail extension can use compose-recipient context to suggest fields, but should not pretend it has an exact stored-email match.

### Does the recipient link prove the named recipient opened it?

No. It proves that the link created for that recipient context was used. The link could be forwarded.

## Sharing FAQ

### How can a seller share a Handout?

- Copy the recipient link.
- Copy a visual email embed/card.
- Use the Gmail extension build to insert a card or descriptive link where available.

### What is the email embed?

A linked screenshot/image representation of the personalized Handout with a plain-text link fallback.

### Can the buyer forward it?

Yes, a stable public recipient link remains usable when forwarded while the site and recipient are published/active. Forwarding also means recipient attribution is link-context attribution, not proof of which person viewed.

### Is there a native Outlook extension?

Not in the current product evidence. Links can be copied into other clients.

### Is the Gmail extension in the Chrome Web Store?

Not confirmed by this context pack. The build and release workflow exist; public distribution status must be checked.

## Tracking FAQ

### What does Handout track?

Current event types include site visits, supported button clicks, supported link clicks, tab switches, Slack preview signals, and webhook-send events where enabled.

### Is there session replay?

No. Replay routes, storage, runtime, dependencies, UI, and related fields were removed from the current event-only tracking design.

### Why might the UI say “Watch” for a session?

The current tracking table contains a “Watch” action that opens session details/activity. Sales must not translate that label into screen recording or replay; the underlying current product is event-only.

### Does Handout track arbitrary clicks?

No. It tracks only explicitly modeled supported elements.

### Does it capture form values or keystrokes?

No.

### Does it store raw IP?

The current design prohibits persistent raw IP and IP hashes. IP may be processed transiently for coarse location, abuse prevention, and internal-network suppression.

### Does it use cookies or a persistent device ID?

No persistent identity mechanism is part of the current public tracking design. Session state exists in page memory.

### Can it report unique visitors?

No. Use sessions, not unique people/visitors.

### Can it tell which recipient engaged?

It can attribute activity to the recipient-link context. It cannot prove which human used or forwarded that link.

### Does it track scroll depth?

Older specifications and historical models discussed scroll depth, but the current event-only schema and UI evidence used for this pack do not establish scroll-depth collection as a sellable capability. Do not promise it without live verification.

### Does it track time spent?

It records session timing/active duration using bounded heartbeats and lifecycle behavior. Present duration as an estimate, not exact attention.

### Does it know location?

It can show coarse city/region/country when available. It is approximate and may be unavailable.

### What is a Slack preview signal?

An Open Graph preview request associated with the link. It is not proof of a human share or view.

### Can tracking be disabled?

Yes, the product supports site-level activity tracking controls.

### Can internal traffic be excluded?

Admins can configure office or VPN IP/CIDR ranges for suppression. Team activity from other networks may still be counted.

### How long is data kept?

The current UI supports 30, 90, 180, or 365-day retention settings. Confirm production enforcement and customer terms in a formal review.

## Gmail FAQ

### What Gmail data does the extension access?

It uses the current primary recipient context and can insert seller-selected content into the compose that opened the panel.

### What does it not access?

Email subject, body, thread history, attachments, Gmail contacts database, and Google account tokens.

### Does it use Gmail API scopes?

The specified/current extension approach does not require Gmail API scopes.

### Does it automatically send or modify emails?

No. Every insertion is a direct seller action. Automatic follow-up and send interception are deferred/excluded.

### Does it add a tracking pixel to the email?

No. Engagement is measured on the Handout, not through message pixels.

## AI and API FAQ

### Can an AI agent create Handouts?

The repository includes MCP tools for site creation/editing, validation, publishing with authorization, recipient batch operations, URL generation, and tracking reads.

### Is API access generally available?

Not confirmed. MCP code exists, but production entitlement and the hidden Pro packaging concept require confirmation.

### Can the agent publish automatically?

The recommended workflow requires explicit user authorization before publishing.

### Which schema should an agent use?

Always read live capabilities. The current canonical architecture uses schema version 3 with Tiptap page documents. Older static agent examples are stale.

## Team and permissions FAQ

### Are there workspaces?

Yes. A workspace owns sites, members, settings, and billing.

### Are there admin and user roles?

Yes in the product model.

### Can admins manage members and billing?

The product contract specifies this, but some current team UI is scaffolded/sample-based. Confirm live operational behavior before selling team administration as complete.

### Can access be controlled per site?

Site access roles and team visibility are extensively specified. Confirm the live implementation and UI before promising granular controls.

## Pricing FAQ

### What does Free include?

Up to 10 non-archived private draft sites; publishing requires upgrade.

### What does Core cost?

Repository-defined pricing is $49/user/month or $39/user/month billed annually. Verify current approved pricing.

### What does Core include?

Unlimited published sites and recipients, subject to abuse guardrails, plus workspace billing management.

### Is Pro available?

Do not assume so. It is hidden and references capabilities not currently present, especially replay.

## Security and legal FAQ

### Are links password protected?

Not in the current recipient-link evidence. Treat them as public links.

### Is Handout SOC 2 certified?

Not confirmed here.

### Is Handout GDPR compliant?

No legal compliance determination is established by this repository. Explain data behavior and escalate the legal question.

### Is there a DPA?

Not confirmed here.

### Where is data hosted?

The repository recommends/uses a low-cost architecture involving Cloudflare, Render, Neon/Postgres, and R2, but current production deployment and subprocessor commitments must be verified. Do not make a contractual hosting claim from architecture documentation alone.

### Is there an SLA?

Not established in this context pack.

## Claims matrix

### Safe product claims, subject to live availability

- Build reusable sales sites.
- Use a structured, collaborative editor.
- Organize content into multiple pages/tabs and a sidebar.
- Personalize with variables.
- Create stable recipient links.
- Copy links and visual email embeds.
- Use an implemented Gmail compose extension workflow.
- Track sessions and explicit modeled actions.
- Configure retention and internal-network suppression.
- Use MCP tools for programmatic site workflows.
- Publish immutable versions separate from draft edits.

### Claims requiring confirmation

- Generally available Gmail extension.
- Chrome Web Store listing.
- Production MCP/API access.
- Complete team invitation and granular permissions workflow.
- Template library.
- Customer webhooks.
- Tracking exports.
- Production deployment architecture.
- Support level and uptime.
- Any customer result or case study.
- Any enterprise security feature.

### Do not claim

- Session replay.
- Screen recording.
- Unique visitor identity.
- Cross-session device tracking.
- Anonymous visitor deanonymization.
- Raw IP storage.
- Email-body/thread/attachment reading.
- Email tracking pixels.
- CRM enrichment/sync.
- Outlook native extension.
- Automatic follow-up.
- Visitor forms or lead capture.
- Booking-completion tracking.
- Authenticated data room.
- Custom domains.
- SSO/SAML/SCIM.
- SOC 2/ISO/HIPAA/GDPR certification or compliance determination.
- Pro availability.
- Guaranteed revenue/velocity improvement.

## Handling uncertainty

If the answer is not in current approved materials:

> “I have product context for the workflow, but I do not have current authoritative confirmation for that entitlement/compliance/availability detail. I’ll route it to the Handout owner rather than guess.”
