# PMG Tracker 360 — Tender & Procurement Management Platform

**PMG Tracker 360** (Tender Track 360) is an end-to-end procurement and tendering management platform for organizations, sub-contractors, and enterprise teams. It centralizes your client directory, manages public and private tender submissions, tracks awarded bids, converts won tenders into operational projects, and issues purchase orders with budget auditing — all inside multi-tenant organization workspaces.

> **Live app:** [tendertrack360.co.za](https://tendertrack360.co.za) · **User guide:** [docs.tendertrack360.co.za](https://docs.tendertrack360.co.za)

## Key Features

- **Multi-tenant workspaces** — each organization gets an isolated workspace with its own clients, tenders, projects, and purchase orders.
- **Tender pipeline** — track bids from `open` → `evaluation` → `awarded` / `lost`, with closing dates, tender validity, extensions, and compliance (returnables) checklists.
- **Clients directory** — maintain buyer profiles (municipalities, government departments, SOEs, corporates) with contact and tax details.
- **Projects & execution** — convert awarded tenders into active projects with milestones, documents, and delivery tracking.
- **Purchase orders & budgets** — issue POs to suppliers/sub-contractors with line items, delivery tracking, and budget-balance auditing.
- **Calendar & deadlines** — unified timeline of tender closing dates, project milestones, and PO deliveries.
- **Reports & analytics** — win/loss ratios, budget vs. spend, procurement expenditure, with **PDF and Excel exports**.
- **Role-based access control** — `Owner`, `Admin`, `Manager`, and `Member` roles per organization.
- **Team management** — email invitations, ownership transfer, and organization settings.
- **Billing & plans** — subscription tiers with organization/seat limits.
- **Secure auth** — email/password, magic-link OTP, and Google sign-in via Better Auth, with Cloudflare Turnstile bot protection.

## Repository Structure

This is a Turborepo + Bun workspaces monorepo.

| Path | Package | Description |
| :--- | :--- | :--- |
| `apps/tracker` | `tracker` | **Main product** — Next.js 16 app (marketing site + authenticated dashboard). |
| `apps/admin` | `admin` | Internal platform admin console (Next.js 16) — system admins, users, organizations, sessions, support tickets. |
| `apps/docs` | `docs` | **User guide** — Astro + Starlight documentation for the tracker app. |
| `packages/db` | `@pmg/db` | Drizzle ORM schema + Postgres client, shared by all apps. |
| `packages/ui` | `@pmg/ui` | Shared shadcn-style UI components and Tailwind tokens. |
| `packages/eslint-config` | `@repo/eslint-config` | Shared ESLint configs. |
| `packages/typescript-config` | `@repo/typescript-config` | Shared TypeScript configs. |

## Tech Stack

- **Apps:** Next.js 16 (App Router), React 19, Astro + Starlight (docs)
- **Backend/DB:** Drizzle ORM, PostgreSQL, Better Auth (email/password, magic link, Google OAuth, organizations)
- **Email:** Resend · **File storage:** Cloudflare R2 (S3-compatible)
- **UI:** Tailwind CSS v4, shadcn/ui, Radix UI, Framer Motion, Recharts, FullCalendar
- **Tooling:** Turborepo, Bun, TypeScript 5, Playwright, Jest/Vitest

## Getting Started

Prerequisites: [Bun](https://bun.sh) ≥ 1.3 and Node ≥ 20.

```bash
# 1. Install dependencies (from the repo root)
bun install

# 2. Set environment variables (see below)
#    cp .env.example apps/tracker/.env.local   # if you have one, or create it manually

# 3. Run the tracker app
cd apps/tracker && bun run dev        # http://localhost:3000

# 4. Run the docs site (separate terminal)
cd apps/docs && bun run dev           # http://localhost:3002
```

### Useful commands

```bash
bun run check-types        # typecheck all apps & packages (turbo)
bun run lint               # lint all apps & packages
bun run build              # build all apps (turbo)

cd apps/tracker && bun run test          # unit tests (Jest)
cd apps/tracker && bun run test:e2e      # Playwright end-to-end tests
cd packages/db && bun run migrate        # run Drizzle migrations
cd packages/db && bun run generate       # generate a new migration
```

### Environment variables

The **tracker** app validates its environment at runtime/build (see `apps/tracker/src/env.ts`). Without these the dev server or build will fail:

| Variable | Required | Purpose |
| :--- | :--- | :--- |
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | ✅ | Better Auth session signing secret |
| `BETTER_AUTH_URL` | ✅ | Better Auth base URL, e.g. `https://tendertrack360.co.za/api/auth` |
| `RESEND_API_KEY` | ✅ | Transactional email (Resend) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | ✅ | Google OAuth sign-in |
| `R2_ACCOUNT_ID` / `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` / `R2_BUCKET_NAME` | ✅ | Cloudflare R2 file storage |
| `NEXT_PUBLIC_URL` | ✅ | Public app URL (client-side) |
| `TURNSTILE_SECRET_KEY` / `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | ⬜ | Cloudflare Turnstile bot protection on sign-up |
| `SENDER_NAME` / `SENDER_EMAIL` / `REPLY_TO_EMAIL` / `S3_API` | ⬜ | Email sender details / custom S3 endpoint |
| `SKIP_ENV_VALIDATION` | ⬜ | Set to `1` to bypass env validation (CI/typecheck only) |

The **admin** app requires `RESEND_API_KEY` (see `apps/admin/src/env.ts`).

## Documentation

The user guide lives in `apps/docs` and is deployed to [docs.tendertrack360.co.za](https://docs.tendertrack360.co.za). It is scoped to the **tracker app** — onboarding, workspaces, tenders, projects, purchase orders, clients, calendar, reports, billing, and role permissions.

New pages are Markdown/MDX files in `apps/docs/src/content/docs/`; the sidebar and navigation are configured in `apps/docs/astro.config.mjs`.

## Development Workflow

1. Create a working branch from `dev` (e.g. `git checkout -b my-change origin/dev`).
2. Make your changes and verify with `bun run check-types`.
3. Open a pull request into `dev`.
4. `dev` is periodically promoted to `master` via a "Promote dev to master" PR.
