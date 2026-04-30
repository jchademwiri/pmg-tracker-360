# PMG Tracker 360 Monorepo

Monorepo for PMG Tracker 360 apps and shared packages.

## Apps

- `apps/tracker` - main Tracker 360 web app (Next.js)
- `apps/admin` - admin dashboard (Next.js)
- `apps/docs` - product and technical documentation (Astro Starlight)

## Packages

- `packages/db` - Drizzle + Neon database client and schema
- `packages/ui` - shared UI components and styles
- `packages/eslint-config` - shared ESLint config
- `packages/typescript-config` - shared TypeScript config

## Prerequisites

- Bun `1.3+`
- Node.js `18+`

## Environment Setup

Copy env examples before running apps:

```bash
cp .env.example .env
cp apps/tracker/.env.local.example apps/tracker/.env.local
cp apps/admin/.env.local.example apps/admin/.env.local
cp packages/db/.env.example packages/db/.env
```

Required variables:

- `DATABASE_URL` (pooled connection; recommended)
- `DATABASE_URL_UNPOOLED` (direct connection; for tools needing non-pooled access)

## Development

Run all apps/packages:

```bash
bun run dev
```

Typical local URLs:

- Tracker: `http://localhost:3000`
- Admin: `http://localhost:3001`
- Docs: `http://localhost:3002`

## Build and Checks

```bash
bun run build
bun run lint
bun run check-types
```

## Vercel Notes

For deployments, configure environment variables in each Vercel project:

- `DATABASE_URL`
- `DATABASE_URL_UNPOOLED` (recommended when migration/seeding workflows need direct DB access)

If builds fail with missing Postgres variables, reconnect your Neon/Postgres integration or set env vars manually in Vercel Project Settings.