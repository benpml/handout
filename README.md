# Lightsite

Lightsite is a lightweight sales one-page site builder for creating editable one-pagers that sales teams can send to prospects.

## Stack

- Frontend: React, Vite, TanStack Router, TanStack Query, TanStack Table, shadcn/ui, Tailwind CSS v4
- Backend: Node.js, Express, BetterAuth
- Database: Postgres with Drizzle ORM
- Package manager: pnpm workspaces

## Local Development

```bash
pnpm install
cp .env.example .env
pnpm db:up
pnpm db:migrate
pnpm dev
```

Useful focused commands:

```bash
pnpm dev:web
pnpm dev:api
pnpm db:up
pnpm db:down
pnpm db:logs
pnpm test
pnpm typecheck
pnpm build
pnpm db:generate
pnpm db:migrate
pnpm db:studio
```

## App Structure

- `apps/web`: Vite React app and all shadcn UI source components
- `apps/api`: Express API with BetterAuth mounted at `/api/auth/*`
- `packages/db`: Drizzle client, schema, and migration config

Core frontend routes:

- `/`: foundation dashboard
- `/sites`: site management table
- `/tracking`: event feed
- `/team`: team management
- `/editor/$siteId`: editor shell
- `/design-system`: living shadcn primitive gallery
- `/components`: installed component inventory
- `/$workspaceSlug/$siteSlug`: public share-link route shape

## Hosting Recommendation

For the first version, the simplest cheap path is:

- Web: Vercel or Netlify static Vite deploy
- API: Render, Fly.io, or Railway Node service
- Postgres: Neon, Supabase, Railway Postgres, or Render Postgres

The public page route is already shaped for `lightsite.app/{workspace_username}/{site-slug}`. In production, the frontend route should fetch published page content from the API by workspace username and site slug, and the API should return `404` for drafts, archived sites, or unpublished variants.

If you want the fewest moving pieces early, Railway can host the API and Postgres together while Vercel hosts the web app. If you want the easiest later split, keep the current separate `apps/web` and `apps/api` deploy targets.

## Auth Notes

BetterAuth is configured in `apps/api/src/auth.ts` with the Drizzle adapter. The Express server mounts BetterAuth before `express.json()` in `apps/api/src/server.ts`, which follows BetterAuth's Express guidance.

Run BetterAuth schema generation/migration work once the final auth table naming and provider choices are locked.
