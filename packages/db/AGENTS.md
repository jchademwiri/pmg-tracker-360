# Database Package (@pmg/db)

## Overview

Shared database layer for PMG Tracker 360. Defines PostgreSQL schema tables, relations, migrations, safety checks, and database client instances used across applications.

## Stack

- **Database**: PostgreSQL
- **ORM**: Drizzle ORM 0.43
- **Migration tool**: Drizzle Kit 0.31
- **Driver**: postgres (postgres.js) 3.4

## Key files

| File | Owns |
|---|---|
| `packages/db/src/schema.ts` | Core database schema tables, enums, and foreign keys |
| `packages/db/src/client.ts` | Drizzle database connection and client export |
| `packages/db/scripts/check-safety.ts` | Pre migration safety and destructive change validation |
| `packages/db/scripts/check-drift.ts` | Schema drift verification against database |
| `packages/db/drizzle.config.ts` | Drizzle Kit configuration |

## Commands

```bash
# Generate migrations from schema changes
bun --cwd packages/db generate

# Apply migrations safely
bun --cwd packages/db migrate

# Run database safety checks
bun --cwd packages/db db:check

# Inspect database with Drizzle Studio
bun --cwd packages/db studio
```

## Conventions

- Always run `bun run db:check` before committing schema modifications.
- Define relations explicitly using Drizzle ORM relations helper.
- Export shared enum values and table types from `src/index.ts`.

## Gotchas

- Never use destructive schema pushes in production; use versioned migration scripts.
- Ensure foreign key constraints and cascade rules prevent orphaned tender returnables.

## Agent skills

- [drizzle-orm-best-practices](.agents/skills/drizzle-orm-best-practices/): `JavaScript-Mastery-Pro/skills`, Drizzle schema design and type safe queries
- [postgres-best-practices](.agents/skills/postgres-best-practices/): `JavaScript-Mastery-Pro/skills`, PostgreSQL indexing and query performance

_Drafted by /audit from the repo, worth a quick human pass. Edit freely: once a line stops matching this draft, later runs treat it as curated and will flag rather than overwrite it._
