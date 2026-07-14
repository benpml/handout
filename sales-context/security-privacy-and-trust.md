# Security, Privacy, and Trust

## Sales posture

Handout should be sold with precision, not broad claims such as “fully secure” or “GDPR compliant.” The product has strong privacy-oriented design choices, but repository architecture is not a substitute for a current security program, legal review, certification, DPA, penetration test, or production control report.

Use this document to explain behavior. Escalate contractual and compliance questions.

## Trust summary

Current product design emphasizes:

- First-party event collection for the customer’s Handout analytics.
- Explicit modeled events rather than arbitrary browser capture.
- No current session replay.
- No cookies or persistent browser/device ID for public-site tracking.
- No raw IP storage in the product tracking database.
- No typed values, form data, search queries, clipboard, keyboard, or arbitrary DOM text collection.
- No full destination URLs, page paths, query strings, fragments, or referrers in tracking analytics.
- Retention choices and internal-traffic suppression.
- Gmail extension access that excludes email body, subject, thread history, and attachments.
- Immutable published site versions and signed/opaque tracking context.
- Public site availability that does not depend on tracking success.

## Public-link model

### What it means

Published Handouts and recipient links are public URLs. Anyone who has the link may be able to open it while the site/recipient remains active and published.

### Appropriate content

- Product and service explanations.
- Approved sales collateral.
- Public or shareable proof.
- Non-sensitive implementation summaries.
- Buyer-specific framing that the customer is comfortable sharing by link.

### Inappropriate content without separate controls

- Passwords, API keys, or credentials.
- Health or highly sensitive personal data.
- Financial account information.
- Export-controlled information.
- Confidential contracts or private security reports requiring authenticated access.
- Material the customer would not want forwarded.

### Sales response

> “Handout’s current recipient experience is link-based, so the pilot should use content your organization is comfortable sharing through a public recipient URL. If authenticated data-room access is mandatory, we should treat that as a current gap.”

## Tracking: exact included data

Depending on event and availability, current tracking can retain:

- Workspace/site/recipient identifiers.
- Published version and recipient revision context.
- Session identifier generated for the visit.
- Logical initial page/tab identifiers and safe labels.
- Site visit.
- Explicit supported button or link action.
- Tab switch.
- Slack preview signal.
- Webhook-send event where enabled.
- Server receipt and bounded event times.
- Active/duration timing.
- Session status/end reason.
- Broad device and operating-system category.
- Coarse city/region/country when available.
- Server-owned element label and safe destination classification/hostname.

## Tracking: explicit exclusions

The current event-only design excludes:

- Screen recording.
- Session replay.
- DOM snapshots or mutations.
- Cursor movement.
- Scroll replay.
- Arbitrary click capture.
- Generic anchors not represented as supported modeled elements.
- Typed, pasted, selected, or submitted form values.
- Form-field names and validation errors.
- Search queries.
- Clipboard behavior.
- Keyboard behavior.
- Hover behavior.
- Full current/previous URL.
- Page path.
- Document title.
- Referrer.
- Raw user-agent strings in product analytics when normalized categories suffice.
- Raw IP persistence.
- Persistent IP hash.
- Cookies, localStorage, sessionStorage, IndexedDB, cache identifiers, or fingerprinting for visitor identity.
- Cross-session unique-person identity.

## Session semantics

- Session state exists in page memory.
- A reload starts a new session.
- A new tab starts a new session.
- Cross-session deduplication is intentionally unavailable.
- Recipient attribution comes from the recipient link context, not persistent identity proof.

Correct language:

- “This recipient link produced a session.”
- “A visitor using this recipient link clicked the CTA.”

Incorrect language:

- “We tracked the same person across devices.”
- “We know this unique person returned three times.”
- “We watched the recipient browse.”

## Raw IP and location

- The server may use IP transiently for coarse location, abuse prevention, jurisdiction controls, and internal-network suppression.
- Raw IP and persistent IP hashes must not be stored in application databases, queues, object storage, analytics, metrics, or application logs under the current design.
- Coarse location may be stored and may be unavailable or inaccurate.
- Configured office/VPN IP ranges can suppress internal traffic.

Do not claim exact location or identify the recipient from location.

## Tracking retention

The current product supports retention choices of:

- 30 days.
- 90 days.
- 180 days.
- 365 days.

The UI states that sessions and events are permanently removed after the configured period. Production scheduling, backups, and operational enforcement should be confirmed during a formal review.

## Slack preview signals

Slack and other clients may fetch metadata or the Open Graph image to create a link preview.

The system can record a Slack preview signal, but:

- It does not prove that a human shared the link.
- It does not prove that a human viewed the page.
- Caches can fetch repeatedly or later.
- The Slack server’s IP/device/location must not be attributed to the recipient.

Use “Slack preview loaded” or “Slack preview signal.”

## Gmail extension privacy

### What the extension uses

- Gmail host access to place the Handout action and insert seller-selected content.
- The primary recipient’s email/display name as compose context for seller-initiated recipient preparation.
- Handout API/web origins for authentication and product data.
- Chrome storage for the Handout bearer session.
- Chrome identity for the first-party authentication handoff.

### What it does not read or transmit

- Email subject.
- Email body.
- Thread history.
- Attachments.
- Gmail contacts database.
- Google account tokens.
- Browser history.
- Microphone, camera, or location.

### Authentication design

- Authentication occurs in the first-party Handout web app.
- The handoff uses a short-lived authorization code bound to a PKCE verifier.
- The bearer token does not appear in the URL.
- The token is stored in extension-local storage and sent only to allowed Handout origins.
- The token must not enter Gmail’s page context or the iframe message channel.

### Important nuance

The extension can inspect the current primary “To” recipient to suggest recipient fields. It should not be described as having zero Gmail context. It has narrow compose-recipient context and insertion access, while explicitly excluding the message content and broader Gmail data.

## Site publishing and content integrity

- The editor works on a draft.
- Publishing validates the content and creates an immutable published version.
- Draft edits do not affect the live site until republished.
- Preview and published output use the same canonical renderer and stylesheet.
- Unknown/unsupported content fails validation rather than silently publishing.
- Public rendering escapes text/attributes and constrains supported links, images, and embeds.
- Tracking is disabled in Preview.
- If analytics cannot initialize, the public site still works.

## Authentication and workspace controls

Repository-defined behavior includes:

- User accounts and workspace membership.
- Admin/user roles.
- Admin-controlled billing and tracking settings.
- Server-side permission concepts.
- Work-email onboarding rules.

Granular live permissions, team invitation operations, and enterprise identity features must be confirmed. Do not promise SSO/SAML, SCIM, domain verification, or advanced audit logs.

## Agent/MCP security posture

The MCP workflow supports:

- Server-to-server token configuration.
- Workspace scoping.
- Read-before-write behavior.
- Optimistic draft revision checks.
- Validation before publish.
- Explicit publish authorization in the recommended agent rules.

Do not imply that MCP grants unrestricted access. Production authentication, scopes, deployment, and entitlement require confirmation.

## Current launch-gate caveats from the tracking spec

The tracking specification identifies production items that remain operational/legal gates rather than application-code tasks, including:

- CDN/WAF/load-balancer/APM access-log verification.
- Production retention scheduling and alerting.
- Realistic peak-load measurement.
- Backup-expiry confirmation.
- Webhook product integration where customer webhooks are enabled.
- Final legal/security approval of deployed configuration and notices.

This means a seller must not translate “implemented in code” into “all production security controls are complete.”

## Compliance and certification boundaries

No current evidence in this pack confirms:

- SOC 2 Type I or II.
- ISO 27001.
- HIPAA eligibility or BAA.
- PCI DSS scope.
- GDPR compliance determination.
- CCPA contractual coverage.
- DPA availability.
- SCCs.
- Data residency.
- Formal subprocessor list.
- Penetration test.
- Bug bounty.
- SLA or uptime commitment.
- RTO/RPO.

Correct response:

> “I do not want to overstate our current compliance posture. I can explain the product’s data behavior, and I’ll route the certification, DPA, residency, or contractual question to the authorized owner.”

## Security discovery checklist

- Is public-link access acceptable?
- What data would be placed on the site?
- Is buyer authentication required?
- Is Chrome extension installation permitted?
- Are Gmail compose permissions acceptable?
- What tracking data is allowed?
- What retention is required?
- Must internal traffic be suppressed?
- Are specific certifications mandatory?
- Is SSO/SCIM required?
- Is a DPA or security questionnaire required?
- Are there data-residency restrictions?
- Are customer webhooks or exports needed?

## Safe answers to common questions

### Do you record the visitor’s screen?

No. The current tracking design explicitly excludes session replay, screen recording, DOM snapshots, cursor movement, and scroll replay.

### Do you store IP addresses?

The current design permits transient IP processing for coarse location, abuse prevention, and internal-network suppression, but prohibits raw IP and persistent IP-hash storage in product systems.

### Do you use cookies to identify visitors?

No persistent browser identifier is used in the current public-site tracking design. Session state exists only in page memory.

### Does the Gmail extension read emails?

It uses narrow compose-recipient context and can insert seller-selected content, but does not read or transmit the subject, body, thread history, or attachments.

### Are recipient links private?

They are recipient-specific but public-link based, not authenticated private rooms.

### Can we turn tracking off?

The product supports site-level activity tracking controls. Workspace administrators manage those settings.

### Can internal employee activity be excluded?

Admins can configure office or VPN IP/CIDR ranges for suppression. Team activity outside those networks may still be counted.

### Are you SOC 2 compliant?

Not confirmed by this repository context. Escalate for the current official answer.

## Trust-first selling rule

If a requested capability conflicts with the privacy boundary—replay, persistent visitor identity, anonymous deanonymization, email-body reading, or arbitrary capture—do not soften the gap. Explain that the exclusion is part of the current product design and decide whether the prospect still fits.
