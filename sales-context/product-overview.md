# Product Overview

## Executive summary

Handout is a lightweight sales-site platform for B2B teams. It gives sellers a fast way to build a polished, compact destination for a deal, personalize it for a person or account, share it through the channels they already use, and understand recipient engagement without relying on invasive tracking.

The product is best understood as the layer between a seller’s follow-up and the buyer’s next decision.

Today, sellers commonly respond to “send me more information” with a long email, a PDF, a generic landing page, a link dump, or a collection of attachments. Those formats are hard to update, weakly personalized, difficult to navigate, and mostly invisible after delivery. Handout turns the same material into one focused buyer experience that can be reused across accounts while still feeling specific to the recipient.

## The problem Handout solves

### For the seller

- Relevant material is scattered across decks, docs, links, videos, case studies, pricing notes, and booking pages.
- Building a bespoke follow-up for every account takes too long.
- Copying an old page or deck creates version drift and unmanaged duplicates.
- A generic resource page does not reflect the prospect’s name, company, priorities, or next step.
- The seller cannot tell whether the buyer opened, skimmed, explored, or acted on what was sent.
- Engagement data is often noisy, invasive, or detached from the actual sales content.
- The seller loses momentum by switching between the CRM, page builder, email, and analytics tools.

### For the buyer

- Follow-up emails become dense and difficult to scan.
- Attachments and link lists do not create a clear narrative.
- Generic assets force the buyer to decide what matters.
- Different stakeholders receive inconsistent material.
- The next step is not obvious.
- Important context gets buried when the email is forwarded internally.

### For sales leadership and revenue operations

- Follow-up quality varies by rep.
- Messaging and proof points are hard to standardize without making every message generic.
- The team cannot tell which assets or calls to action are creating movement.
- Duplicate pages and decks become hard to govern.
- Managers lack a reliable, recipient-level signal for timely coaching or follow-up.

## The Handout product thesis

Handout is built around four beliefs:

1. **A compact buyer site is a better follow-up container than an attachment or link dump.** It can combine narrative, proof, media, actions, and next steps in one responsive destination.
2. **Personalization should not require content duplication.** A team should maintain one master site and override variables for each recipient or account.
3. **Sharing should happen where sellers already work.** Creating a recipient link and inserting it into Gmail should take seconds, not a context switch and a manual assembly process.
4. **Engagement intelligence should be useful and restrained.** Sellers need to know whether the site was opened and which modeled actions occurred, but they do not need surveillance, arbitrary DOM capture, or cross-session fingerprinting.

## What a Handout is

A Handout is a seller-created, prospect-facing sales site. It can contain multiple logical pages or tabs, rich content blocks, proof, media, links, calls to action, and a structured sidebar. The seller edits a draft, previews it, and publishes an immutable version to a public link.

The master site is reusable. The seller can insert variables such as recipient name, company, website/logo, pain point, proof point, plan recommendation, CTA URL, or booking URL. When creating a recipient, the seller supplies recipient-specific values. Handout resolves those values into a stable personalized link without forking the master content.

## Core product objects in sales language

### Workspace

The team account. It owns sites, members, billing, settings, assets, and the public namespace.

### Site

The reusable master sales experience. It contains the draft, published version, variables, pages, sidebar, and recipient relationships.

### Page or tab

A logical part of the site, such as Overview, Business case, Security, Implementation, or Next steps. Multiple visible pages appear as tabs.

### Variable

A reusable placeholder controlled by the site. Variables allow the master experience to stay consistent while recipient-facing details change.

### Recipient

A person/account-specific share target. A recipient has a name, company, optional website, variable values, and a stable public link. The product may still use “variant” internally in some interfaces or APIs; sales language should prefer “recipient” and “recipient link.”

### Session

One page-memory visit to a published Handout. A reload or new tab creates a new session. It is not a durable unique-person identity.

### Event

A modeled action such as a site opening, button click, supported link click, tab switch, Slack preview signal, or webhook-send event.

## The end-to-end value loop

1. A team creates a reusable sales site for a recurring motion.
2. A seller adapts the narrative, proof, and next steps in a collaborative editor.
3. The seller inserts variables where recipient-specific content belongs.
4. The site is previewed and published.
5. The seller creates or reuses a recipient and fills the relevant values.
6. Handout generates a stable recipient link and a visual email embed/card.
7. The seller inserts the link or card into Gmail, or copies it into another channel.
8. The buyer opens a fast, responsive site tailored to their context.
9. Handout records privacy-safe sessions and supported actions.
10. The seller follows up based on evidence: timing, depth, page/action interest, and the next step chosen.

## Primary value pillars

### 1. Better buyer experience

Replace fragmented follow-up with one clear, branded, mobile-responsive destination. The buyer sees the story, proof, and next action in context.

### 2. Personalization without operational drag

Build once and personalize variables per recipient. Updates remain centralized in the master site rather than multiplying into unmanaged copies.

### 3. Faster seller execution

The editor, recipient workflow, copyable email card, and Gmail extension reduce the number of steps between “I’ll send you something” and a polished follow-up.

### 4. Actionable engagement intelligence

See sessions and supported actions associated with a recipient link. Use this to prioritize follow-up and tailor the next conversation.

### 5. Team consistency with local flexibility

Create reusable patterns, proof, and narratives while giving sellers recipient-level control over names, company context, pain points, CTAs, and other variables.

### 6. Agent-ready workflows

The Handout MCP surface can create, edit, validate, publish, personalize, list public URLs, and read tracking data programmatically. This supports AI-assisted site creation and sales workflows without making the AI the source of truth for content or permissions.

## Why the product is different

Handout is not merely a landing-page builder. Its center of gravity is the seller-to-recipient workflow: reusable content, recipient-specific links, Gmail insertion, and engagement by recipient.

It is not merely a document tool. The output is a responsive, trackable, interactive public experience with structured actions and media.

It is not merely a digital sales room. The product is deliberately lightweight and focused on fast, polished one-pagers and compact buyer sites rather than a heavy enterprise deal portal.

It is not merely email tracking. It tracks first-party engagement with the Handout and explicitly avoids message-body surveillance, email pixels, arbitrary browser capture, and persistent device identity.

## Product maturity: how to talk about it

The repository contains substantial implemented product surfaces: the editor and renderer, pages/sidebar, personalization and recipient sharing, tracking, billing, Gmail extension build, and MCP tools. However, a source repository is not the same as a production availability statement.

External sellers should use this phrasing when availability has not been checked:

> “That workflow is implemented in the Handout product. I’ll confirm whether it is enabled for your workspace and the current rollout status.”

Avoid “generally available,” “enterprise-ready,” “Chrome Web Store approved,” “SOC 2 compliant,” or “native CRM integration” unless there is separate current evidence.

## Strategic wedge

The most compelling initial wedge is a recurring, high-value B2B follow-up where:

- The buyer asks for more information.
- The seller has multiple assets to share.
- The message needs to feel specific to the account.
- The next step matters.
- Knowing whether and how the buyer engaged changes what the seller does next.

Examples include post-discovery follow-up, demo recap, executive alignment, pricing/packaging follow-up, implementation overview, mutual action plan, security/procurement handoff, and partner or agency proposal follow-up.

## The category story

Recommended category language:

- Personalized sales site platform.
- Buyer-site builder for B2B sales.
- Lightweight digital sales room for fast follow-up.
- Personalized sales one-pager with engagement intelligence.

Default category statement:

> Handout is a personalized sales-site platform that helps B2B sellers build one reusable buyer experience, tailor it to each recipient, share it directly from Gmail, and act on privacy-safe engagement signals.
