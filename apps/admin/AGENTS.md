# Admin App

## Overview

Internal administration portal for PMG Tracker 360. Handles platform metrics, user management, tender auditing, subscription oversight, and system analytics.

## Stack

- **Framework**: Next.js 16.2 (App Router), React 19.2 (port 3001)
- **Database client**: `@pmg/db`
- **UI & Charts**: `@pmg/ui`, Recharts 3.10, Tailwind CSS v4, Lucide React
- **Testing**: Vitest 3.2, Fast Check, jsdom

## Key files

| File | Owns |
|---|---|
| `apps/admin/src/app/` | Admin App Router pages, metric dashboards, and management views |
| `apps/admin/src/actions/` | Admin Server Actions for platform administration |
| `apps/admin/vitest.config.ts` | Vitest testing configuration |

## Commands

```bash
# Run admin app in dev mode on port 3001
bun --filter admin dev

# Build admin app
bun --filter admin build

# Run tests with Vitest
bun --filter admin test
```

## Conventions

- Enforce admin role authorization checks on every Server Action and layout.
- Separate platform level analytics from individual tenant data models.

## Gotchas

- Admin dev server runs on port 3001 to avoid colliding with tracker on port 3000.
- Operations that promote users or modify subscriptions require strict audit logging.

_Drafted by /audit from the repo, worth a quick human pass. Edit freely: once a line stops matching this draft, later runs treat it as curated and will flag rather than overwrite it._
