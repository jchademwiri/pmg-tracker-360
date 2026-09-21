# Tracker App

## Overview

The primary customer facing web portal for PMG Tracker 360. Manages tender tracking, returnables, purchase orders, calendar deadlines, and company profile workflows.

## Stack

- **Framework**: Next.js 16.2 (App Router), React 19.2
- **Auth**: Better Auth client and session validation
- **Database client**: `@pmg/db`
- **UI & Styling**: `@pmg/ui`, Tailwind CSS v4, Lucide React, Radix UI
- **PDF & Reports**: `@pmg/pdf`, Takumi PDF, ExcelJS, jsPDF
- **Testing**: Jest 29, React Testing Library, Playwright 1.60

## Key files

| File | Owns |
|---|---|
| `apps/tracker/src/app/` | Next.js App Router pages, layouts, and route handlers |
| `apps/tracker/src/actions/` | Server Actions handling tender updates and forms |
| `apps/tracker/src/server/` | Server side data access, auth checks, and service layers |
| `apps/tracker/src/components/` | Client and server React UI components |
| `apps/tracker/playwright.config.ts` | Playwright end to end test configuration |

## Commands

```bash
# Run tracker app in dev mode
bun --filter tracker dev

# Build tracker app
bun --filter tracker build

# Run unit and integration tests
bun --filter tracker test

# Run end to end tests
bun --filter tracker test:e2e
```

## Conventions

- Use Server Actions with Zod validation for user submitted mutations.
- Keep page components focused on layout and data fetching; extract complex interactive sections into client components under `components/`.
- Handle file attachments by requesting presigned upload URLs from the backend rather than multipart body uploads.

## Gotchas

- Next.js 16 and React 19 compiler strictness: avoid state mutations during render passes.
- Always check organization and user membership access before returning tender records.

## Agent skills

- [better-auth-best-practices](.agents/skills/better-auth-best-practices/): `JavaScript-Mastery-Pro/skills`, Client and server session validation
- [playwright-e2e-testing](.agents/skills/playwright-e2e-testing/): `JavaScript-Mastery-Pro/skills`, End to end test patterns

_Drafted by /audit from the repo, worth a quick human pass. Edit freely: once a line stops matching this draft, later runs treat it as curated and will flag rather than overwrite it._
