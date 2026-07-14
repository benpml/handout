# Handout Agent Skill

Use this skill when creating, editing, publishing, or analyzing Handout sites through the Handout MCP server.

## Core Model

Handout sites are JSON-first. The editable source of truth is `SiteContent`; agents should create and update that JSON directly, then validate it before publishing.

```json
{
  "schemaVersion": 2,
  "chrome": {
    "siteHeader": {
      "brandName": "Handout",
      "logoUrl": "",
      "primaryButtonText": "Book a call",
      "primaryButtonHref": "",
      "secondaryButtonText": "Learn more",
      "secondaryButtonHref": "",
      "showSecondaryButton": false
    },
    "hero": {
      "avatarMode": "single",
      "eyebrow": "",
      "title": "Untitled Handout",
      "subtitle": "",
      "avatarImageUrl": "",
      "avatarImageVariableKey": "",
      "avatarImageAlt": "",
      "avatarImageSecondaryUrl": "",
      "avatarImageSecondaryVariableKey": "",
      "avatarImageSecondaryAlt": ""
    }
  },
  "settings": {
    "showTableOfContents": true,
    "allowSearchIndexing": false
  },
  "variables": [],
  "blocks": []
}
```

Public variants do not fork site content. Variants only set `variableValues` for variables already present in the site JSON.

## Workflow

1. Call `handout_get_capabilities`.
2. For existing sites, call `handout_list_sites`, then `handout_get_site_content`.
3. For new sites, call `handout_create_site`, then write full `SiteContent` JSON with `handout_update_site_content`.
4. Always include `expectedDraftRevision` from `handout_get_site_content` when updating content.
5. Call `handout_validate_site_content` before publishing.
6. Use `handout_batch_upsert_variants` for account or recipient lists.
7. Publish only after the user explicitly asks.
8. Use `handout_update_site` to set `visibility: "team"` before sharing or browser-testing public URLs.
9. Use `handout_get_public_urls` after publishing or variant changes when the user needs share links.
10. For analytics, call `handout_get_tracking_summary` before `handout_list_tracking_events`.

## Content Rules

- Header chrome, hero chrome, variables, and body blocks all belong in the same canonical `SiteContent` JSON payload.
- Use a flat ordered `blocks` array; do not invent sections.
- Keep block IDs stable, readable, and unique.
- Use variables for repeated personalized values: company name, recipient name, pain point, proof point, CTA URL, and calendar link.
- Keep body blocks concise. Handout is a sales one-pager, not a long landing page.
- Use only `heading`, `text`, `divider`, `cta`, and `quote` for publishable draft content until the MCP reports additional `supportedDraftBlockTypes`.
- Read `siteContent.draftBlockDefinitions` from `handout_get_capabilities` before inventing block fields; it is the source of truth for required and optional fields.
- Store draft blocks as `{ "id": "...", "type": "...", "fields": { ... } }`.
- Do not publish if validation returns issues.

## Draft Block Examples

```json
{
  "id": "heading-context",
  "type": "heading",
  "fields": {
    "level": 2,
    "text": "Why this matters now"
  }
}
```

```json
{
  "id": "text-context",
  "type": "text",
  "fields": {
    "text": "{{company_name}} can move faster when the buying team has one clean page to review."
  }
}
```

```json
{
  "id": "cta-primary",
  "type": "cta",
  "fields": {
    "label": "Book implementation review",
    "href": "{{primary_cta_url}}",
    "style": "primary"
  }
}
```

```json
{
  "id": "quote-proof",
  "type": "quote",
  "fields": {
    "quote": "Handout helped us send a polished, personalized follow-up in minutes.",
    "personName": "Mira Singh",
    "personTitle": "Revenue Operations Lead",
    "company": "{{company_name}}"
  }
}
```

## Variant Batch Example

```json
{
  "matchBy": "slug",
  "variants": [
    {
      "slug": "mira-acme",
      "name": "Mira at Acme",
      "recipientName": "Mira Singh",
      "recipientCompany": "Acme",
      "variableValues": {
        "company_name": "Acme",
        "primary_cta_url": "https://example.com/acme"
      }
    }
  ]
}
```
