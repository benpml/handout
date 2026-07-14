# Handout Marketing Site

The public marketing site for Handout, built with vinext and deployed through Sites.

## Local development

Requires Node.js `>=22.13.0`.

```bash
npm install
npm run dev
```

## Validation

```bash
npm test
npm run lint
```

`npm test` builds the Cloudflare-compatible server output and verifies the rendered Handout page, production metadata, canonical domains, and brand assets.

## Hosting

The existing Sites project is identified by `.openai/hosting.json`. The production marketing domain is `www.handout.link`; product authentication routes to `app.handout.link`.
