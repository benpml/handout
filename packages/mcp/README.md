# Handout MCP

JSON-first MCP tools for creating, editing, publishing, personalizing, and inspecting Handout sites.

## Local Development

```sh
HANDOUT_API_BASE_URL=http://localhost:3011 \
HANDOUT_DEV_AUTH=1 \
HANDOUT_AGENT_WORKSPACE_ID=00000000-0000-4000-8000-000000000101 \
HANDOUT_AGENT_WORKSPACE_SLUG=handout-dev \
HANDOUT_PUBLIC_SITE_ORIGIN=http://localhost:3011 \
pnpm --filter @handout/mcp dev
```

## Server-To-Server Auth

Configure the API server with:

```sh
HANDOUT_AGENT_API_TOKEN=...
HANDOUT_AGENT_WORKSPACE_ID=...
HANDOUT_AGENT_USER_ID=handout_agent
```

Configure the MCP server with:

```sh
HANDOUT_API_BASE_URL=https://api.example.com
HANDOUT_AGENT_API_TOKEN=...
HANDOUT_AGENT_WORKSPACE_ID=...
HANDOUT_AGENT_WORKSPACE_SLUG=...
HANDOUT_PUBLIC_SITE_ORIGIN=https://pages.example.com
```

## Tools

- `handout_get_capabilities`
- `handout_list_sites`
- `handout_create_site`
- `handout_get_site`
- `handout_update_site`
- `handout_get_site_content`
- `handout_update_site_content`
- `handout_validate_site_content`
- `handout_publish_site`
- `handout_unpublish_site`
- `handout_list_variants`
- `handout_batch_upsert_variants`
- `handout_get_public_urls`
- `handout_get_tracking_summary`
- `handout_list_tracking_events`

`handout_get_capabilities` now includes `siteContent.draftBlockDefinitions`, which gives agents the required fields, optional fields, and example JSON for each currently publishable draft block type.

The canonical editable site model is `SiteContent` schema version `2`, where `chrome.siteHeader`, `chrome.hero`, `variables`, and the ordered `blocks` array all live in one JSON document.
