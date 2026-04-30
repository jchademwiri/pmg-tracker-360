# Tracker App (`apps/tracker`)

Main PMG Tracker 360 application built with Next.js.

## Environment

Create `apps/tracker/.env.local` from the example:

```bash
cp apps/tracker/.env.local.example apps/tracker/.env.local
```

Required:

- `DATABASE_URL`
- `DATABASE_URL_UNPOOLED`

The build script validates `DATABASE_URL` before running `next build` to fail early with a clear message.

## Run Locally

From repository root:

```bash
bun run --filter tracker dev
```

App URL: `http://localhost:3000`

## Build

```bash
bun run --filter tracker build
```

## Deploy (Vercel)

Set these environment variables in the tracker Vercel project:

- `DATABASE_URL`
- `DATABASE_URL_UNPOOLED`

If Vercel reports missing `POSTGRES_*`/`PG*` variables, reconnect the Postgres integration or configure DB variables manually in Project Settings.