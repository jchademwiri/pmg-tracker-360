---
name: drizzle-orm-best-practices
description: Best practices for Drizzle ORM, schema design, type-safe migrations, relational queries, PostgreSQL performance, and drift prevention. Use when working on packages/db, database schemas, relations, migrations, or database queries.
---

# Drizzle ORM & PostgreSQL Best Practices

Follow these guidelines when modifying database schemas, writing queries, or managing migrations.

---

## 1. Schema Design Guidelines
* **Type-Safe Identifiers**: Use PostgreSQL native types (`uuid`, `text`, `integer`, `timestamp with time zone`, `jsonb`, `boolean`).
* **Timestamps**: Always define `createdAt` and `updatedAt` with `$defaultFn(() => new Date())` or `defaultNow()`.
* **Foreign Keys**: Explicitly define foreign key relations and cascade behaviors (`onDelete: "cascade"` or `onDelete: "set null"`).
* **Indexes**: Create explicit indexes on frequently filtered columns (e.g. `tenantId`, `organizationId`, `userId`, `status`, `slug`).

## 2. Migration Protocol & Drift Prevention
* Never manually alter migration files after they have been committed.
* When editing `packages/db/src/schema.ts`:
  1. Update schema definitions and relations.
  2. Run `bun run db:generate` to produce the versioned migration.
  3. Verify schema drift with `bun run db:check`.
  4. Test applying migrations with `bun run db:migrate`.

## 3. Query Best Practices
* **Relational Queries (`db.query`)**: Use `db.query.<table_name>.findFirst` or `findMany` with `with: { ... }` relations to avoid manual joins when fetching related data.
* **Select Projections**: Only select required columns for heavy queries using `columns: { ... }`.
* **Transactions**: Wrap multi-step mutations in `await db.transaction(async (tx) => { ... })` to ensure atomic consistency.
* **Pagination**: Always paginate large datasets using cursor-based or limit/offset pagination.
