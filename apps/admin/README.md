# Admin App (`apps/admin`)

Admin dashboard for PMG Tracker 360 built with Next.js.

## Environment

Create `apps/admin/.env.local` from the example:

```bash
cp apps/admin/.env.local.example apps/admin/.env.local
```

Required:

- `DATABASE_URL`
- `DATABASE_URL_UNPOOLED`

## Run Locally

From repository root:

```bash
bun run --filter admin dev
```

App URL: `http://localhost:3001`

## Build

```bash
bun run --filter admin build
```

## Deploy (Vercel)

Set these environment variables in the admin Vercel project:

- `DATABASE_URL`
- `DATABASE_URL_UNPOOLED`
