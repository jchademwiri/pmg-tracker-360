# PMG Tracker 360

## Stack

- **Language / Runtime**: TypeScript 5.9, Bun 1.3.5, Node 18+
- **Monorepo / Task runner**: Turborepo 2.9
- **Framework**: Next.js 16.2 (App Router), React 19.2
- **Database / ORM**: PostgreSQL, Drizzle ORM 0.43, Drizzle Kit 0.31
- **Auth**: Better Auth 1.3
- **Storage / Email**: AWS S3 SDK v3 (Cloudflare R2 compatible), Resend 6.0, React Email
- **Testing**: Jest 29, Vitest 3.2, Playwright 1.60

## Build approach

<TBD, set by /scope>

## Commands

```bash
# Install dependencies
bun install

# Development (runs all apps)
bun run dev

# Check types across workspaces
bun run check-types

# Lint
bun run lint

# Format
bun run format

# Run tests
bun run test

# Run end to end tests
bun run test:e2e

# Database checks
bun run db:check
bun run db:migrate
```

## Git

- integration: on
- default branch: dev
- branch prefix: feat/
- commit: per-milestone
- rule: never commit directly to master or dev; create working branches from dev

## Specs

Stored in `docs/specs/`. Format: `docs/specs/NNNN-title.md` (single file) or `docs/specs/NNNN-title/index.md` (directory spec).

## Rules

- Monorepo boundaries: apps import packages via workspace aliases like `@pmg/db`, `@pmg/ui`, `@pmg/pdf`. Never use relative path traversal across workspaces.
- Schema safety: run `bun run db:check` before migrations. Keep schemas and relations in `packages/db/src/schema.ts`.
- Database access: all queries and mutations use Drizzle ORM through `@pmg/db/client`. Do not write raw SQL strings unless optimizing complex reports.
- Server Actions: validate all inputs using Zod schemas before running business logic or database operations.
- Session and authorization: verify session and role access using Better Auth on every protected route and server action.
- File storage: generate presigned URLs through the storage service rather than streaming large binaries through Next.js server memory.
- Branch discipline: work exclusively on dedicated feature branches branched from `dev`. Never commit directly to `master` or `dev`.
- Component design: use accessible UI primitives from `@pmg/ui` and Radix UI with Tailwind CSS utility styling.

## Agent skills

- [turborepo](.agents/skills/turborepo/): `vercel/turborepo`, Monorepo task pipelines and caching
- [backend-mastery](.agents/skills/backend-mastery/): `JavaScript-Mastery-Pro/skills`, Next.js Server Actions, Drizzle, Better Auth, and S3
- [drizzle-orm-best-practices](.agents/skills/drizzle-orm-best-practices/): `JavaScript-Mastery-Pro/skills`, Drizzle ORM migrations and schema design
- [better-auth-best-practices](.agents/skills/better-auth-best-practices/): `JavaScript-Mastery-Pro/skills`, Better Auth authentication and session handling
- [postgres-best-practices](.agents/skills/postgres-best-practices/): `JavaScript-Mastery-Pro/skills`, PostgreSQL schema design and index performance
- [s3-storage-best-practices](.agents/skills/s3-storage-best-practices/): `JavaScript-Mastery-Pro/skills`, S3 and R2 presigned uploads and storage
- [resend](.agents/skills/resend/): `JavaScript-Mastery-Pro/skills`, Resend transactional email API and webhooks
- [react-email](.agents/skills/react-email/): `JavaScript-Mastery-Pro/skills`, React Email template construction and previews
- [frontend-mastery](.agents/skills/frontend-mastery/): `JavaScript-Mastery-Pro/skills`, React 19 UI systems and Tailwind CSS design
- [playwright-e2e-testing](.agents/skills/playwright-e2e-testing/): `JavaScript-Mastery-Pro/skills`, End to end browser testing with Playwright
- [scope](.agents/skills/scope/): `JavaScript-Mastery-Pro/skills`, High level roadmap and phase planning
- [architect](.agents/skills/architect/): `JavaScript-Mastery-Pro/skills`, Technical specs and architectural decision records
- [develop](.agents/skills/develop/): `JavaScript-Mastery-Pro/skills`, Spec driven feature development
- [test](.agents/skills/test/): `JavaScript-Mastery-Pro/skills`, Test suite generation and edge case coverage
- [check](.agents/skills/check/): `JavaScript-Mastery-Pro/skills`, Acceptance criteria verification and code review
- [debug](.agents/skills/debug/): `JavaScript-Mastery-Pro/skills`, Root cause debugging loop
- [document](.agents/skills/document/): `JavaScript-Mastery-Pro/skills`, Release notes, changelog, and PR descriptions
- [sync](.agents/skills/sync/): `JavaScript-Mastery-Pro/skills`, Knowledge base and spec reconciliation

## Context files

- [apps/tracker/AGENTS.md](apps/tracker/AGENTS.md): Main client tracking web application (Next.js 16 App Router)
- [apps/admin/AGENTS.md](apps/admin/AGENTS.md): Internal administration portal and analytics dashboard (Next.js 16 App Router)
- [apps/docs/AGENTS.md](apps/docs/AGENTS.md): Public documentation site powered by Astro Starlight
- [packages/db/AGENTS.md](packages/db/AGENTS.md): Shared database layer, Drizzle ORM schemas, and migration scripts
- [packages/ui/AGENTS.md](packages/ui/AGENTS.md): Shared UI component library, Radix primitives, and Tailwind styles
- [packages/pdf/AGENTS.md](packages/pdf/AGENTS.md): PDF generation engine built on Takumi PDF and React templates

_Drafted by /audit from the repo, worth a quick human pass. Edit freely: once a line stops matching this draft, later runs treat it as curated and will flag rather than overwrite it._
