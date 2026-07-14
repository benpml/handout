# Pricing, Packaging, and Commercials

## Status and caution

The pricing below is the current product contract defined in this repository as of July 13, 2026. Pricing is time-sensitive and must be verified against the live billing page and approved commercial materials before quoting externally.

Do not invent discounts, minimum commitments, refunds, trials, SLAs, taxes, procurement terms, or enterprise packages.

## Current repository-defined plans

### Free

Price:

- $0.

Included behavior:

- Build up to 10 non-archived draft sites.
- Private drafting.
- Upgrade only when publishing.

Limits:

- Cannot publish.
- Cannot create an 11th active/non-archived site.

Positioning:

> Build and evaluate the experience before committing. Upgrade when the team is ready to publish and share.

### Core

Monthly:

- $49 per user per month.

Annual:

- $39 per user per month, billed annually.
- Repository UI copy describes this as saving $10 per user each month relative to monthly billing.

Included behavior:

- Unlimited published sites.
- Unlimited recipients.
- Self-serve Stripe billing.
- Publishing access.

Boundary:

- Unlimited usage is subject to abuse guardrails.
- “Unlimited” should not be interpreted as permission for abuse, resale, automated denial-of-service behavior, or usage outside the product’s intended sales workflow.

Positioning:

> Core is the practical selling plan: publish as many reusable buyer sites as the team needs and create recipient links without workspace-level count limits.

### Pro

Repository-defined price:

- $89 per user per month.
- $69 per user per month when billed annually.

Repository-defined concept:

- Core plus unlimited session replays and API access.

Critical status:

- Pro remains backend-supported but hidden from the primary UI until those features ship.
- The current tracking architecture explicitly removed replay routes, storage, runtime, and UI.
- Therefore Pro must not be offered as a current externally available plan on the basis of this document.
- Do not promise session replay.
- Do not promise generally available API access.

If asked:

> “A future Pro concept exists in the product’s billing architecture, but it is not currently a sellable primary-UI plan. I’ll confirm the current roadmap and availability rather than quote it.”

## Billing mechanics

- Billing belongs to the workspace.
- Core is seat-based.
- Checkout quantity equals active workspace members, minimum one seat.
- Workspace administrators manage checkout and billing.
- The Stripe Customer Portal is intended for payment method, invoice, cancellation/reactivation, and plan management once a Stripe customer exists.
- Stripe webhook state is authoritative after checkout.

## Packaging narrative

### Free is for creation and proof

Use Free to:

- Build the first site.
- Validate the content model.
- Review the buyer experience internally.
- Prepare a pilot before publication.

Do not describe Free as a full external pilot if publishing is required.

### Core is for active sales use

Use Core when:

- The team needs published recipient links.
- Sellers will share with prospects.
- Multiple recipients or sites are expected.
- The buyer wants a real pilot involving external activity.

## Seat strategy

### Small team/founder-led

- Start with the founder and active sellers who will create/send.
- Keep the initial seat count aligned to actual users.

### Mid-market pilot

- Use 3–10 seats for one motion.
- Include the champion/enablement owner if they will actively maintain the master site.
- Avoid buying seats for passive stakeholders until role/billing behavior is confirmed.

### Expansion

Expand based on:

- Number of sellers using the motion.
- Additional master sites/use cases.
- Enablement ownership.
- Measured time-to-send and adoption.

## Price-to-value framing

The strongest value cases are:

### Seller-time recovery

Example structure, not a promise:

- Current preparation: 25 minutes.
- Handout preparation after master is ready: 8 minutes.
- Avoidable time: 17 minutes.
- 8 applicable follow-ups per seller per week.
- 48 weeks per year.

Annual hours potentially redirected per seller:

`17 × 8 × 48 ÷ 60 = 108.8 hours`

Use the prospect’s real numbers and discount the theoretical result for realistic adoption.

### One additional next step

If a single additional qualified next meeting or reduced stall in a high-value deal covers annual seat cost, the economics may be attractive. Treat this as a hypothesis and pilot measure, not a guarantee.

### Content-governance value

- Fewer duplicate decks/pages.
- Less enablement/design support.
- Faster rollout of updated proof and positioning.
- Lower risk of stale or incorrect follow-up.

## Commercial discovery questions

- How many people would actively create or send Handouts?
- Is the team evaluating monthly or annual budgeting?
- What is the procurement threshold?
- Is a credit card/self-serve Stripe purchase acceptable?
- Who must be a paid active workspace member?
- Does the pilot require external publishing?
- What result would justify expanding seats?
- Is a security or browser-extension review required before purchase?

## Discount and negotiation guidance

No discount policy is documented in the repository.

Default behavior:

- Quote the approved monthly or annual Core price.
- Use annual billing as the documented lower effective monthly price.
- Do not create custom discounts or promise free publishing.
- If a larger commitment warrants a commercial exception, escalate to an authorized human.

## Procurement and legal boundaries

The source material does not establish:

- Master Services Agreement terms.
- DPA availability.
- Refund policy.
- Taxes/VAT handling.
- Payment terms beyond Stripe self-service.
- SLA.
- Uptime commitment.
- Support tiers.
- Data residency commitment.
- Security certifications.
- Enterprise custom plan.

An AI sales agent must not answer these from inference. It should say the item requires confirmation from the authorized Handout owner.

## Quoting examples

### One user, monthly Core

- $49/month, subject to current approved pricing and applicable taxes.

### Five users, monthly Core

- $245/month before applicable taxes.

### Five users, annual Core

- Effective $195/month, billed annually.
- Annual total: $2,340 before applicable taxes.

These are arithmetic illustrations, not a formal quote. Confirm seat count and current price in the billing system.

## Commercial FAQ

### Can we try before paying?

The repository-defined Free plan allows up to 10 private draft sites. Publishing requires Core.

### Is usage metered by site or recipient?

Core has no app-level count limit for published sites or recipients, subject to abuse guardrails.

### Is Core per workspace or per user?

Per user/seat at the workspace level.

### Can a non-admin buy?

No. Checkout and portal access are admin-controlled in the product contract.

### Is Pro available?

Do not assume so. It is hidden from the primary UI and includes features not currently present, especially replay.

### Is API access included in Core?

The repository does not define general API access as a Core entitlement. MCP code exists, but packaging and production availability require confirmation.

## Quote integrity rule

Before any external pricing statement, verify:

1. Current live plan page.
2. Approved price and currency.
3. Seat count.
4. Billing interval.
5. Taxes and invoice behavior if relevant.
6. Any approved exception.

If verification is unavailable, present the amounts as “repository-defined current pricing” rather than a binding quote.
