# Phase 2: Add Org-Scoped Unique Constraint on Client Name

**Priority:** 🟠 High  
**Estimated effort:** 1 day (including validation logic audit)  
**Files touched:** 2–3  
**Depends on:** Phase 1 complete (no hard dependency, but do phases in order)

---

## Problem

`client.name` has no uniqueness constraint at all. Within the same organization,
two clients named `"City of Tshwane"` can be created silently. This causes:

- Duplicate options in client dropdowns on tender and project forms
- Reporting ambiguity — which "City of Tshwane" is which?
- Data quality issues that are difficult to clean up after the fact

Different organizations should be free to have clients with the same name (e.g. both
Org A and Org B can have a client called `"Eskom"`). Uniqueness must be scoped
per organization only.

---

## Step 1 — Update `packages/db/src/schema.ts`

Find the `client` table definition. The table currently has no third argument:

```typescript
// BEFORE
export const client = pgTable('client', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organization.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  notes: text('notes'),
  contactName: text('contact_name'),
  contactEmail: text('contact_email'),
  contactPhone: text('contact_phone'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});
```

Add the composite unique constraint:

```typescript
// AFTER
export const client = pgTable(
  'client',
  {
    id: text('id').primaryKey(),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    notes: text('notes'),
    contactName: text('contact_name'),
    contactEmail: text('contact_email'),
    contactPhone: text('contact_phone'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => ({
    clientNameOrgUnique: unique('client_organization_id_name_unique').on(
      table.organizationId,
      table.name
    ),
  })
);
```

---

## Step 2 — Check for existing duplicate data before migrating

⚠️ **Run this query against your database before generating the migration.** If
duplicates already exist, the migration will fail with a constraint violation.

```sql
-- Find any duplicate client names within the same org
SELECT organization_id, name, COUNT(*) AS count
FROM client
WHERE deleted_at IS NULL
GROUP BY organization_id, name
HAVING COUNT(*) > 1
ORDER BY count DESC;
```

If this returns rows, resolve them manually (merge or rename) before running the
migration. Also check soft-deleted rows:

```sql
-- Include soft-deleted rows in the check
SELECT organization_id, name, COUNT(*) AS count
FROM client
GROUP BY organization_id, name
HAVING COUNT(*) > 1
ORDER BY count DESC;
```

If soft-deleted duplicates exist, decide whether to hard-delete them or exclude them
from the constraint using a partial index (see note below).

> **Partial index option:** If you want soft-deleted clients to be excluded from the
> uniqueness check (so a deleted client's name can be reused), apply the constraint
> as a partial unique index via raw SQL in the migration instead:
> ```sql
> CREATE UNIQUE INDEX client_organization_id_name_unique
>   ON client (organization_id, name)
>   WHERE deleted_at IS NULL;
> ```
> Drizzle does not generate partial indexes from `unique()` — you would need to add
> this manually to the migration file after generation.

---

## Step 3 — Generate and run the migration

```bash
bun run db:generate -- --name add_client_name_org_unique_constraint
bun run db:migrate
```

Expected migration SQL (full constraint, not partial):

```sql
ALTER TABLE "client"
  ADD CONSTRAINT "client_organization_id_name_unique"
  UNIQUE ("organization_id", "name");
```

---

## Step 4 — Audit `apps/tracker/src/server/clients.ts`

Open the file and find the `createClient` function. Verify the duplicate-check query
includes `organizationId`:

```typescript
// ✅ CORRECT — must look like this
const existingClient = await db
  .select()
  .from(client)
  .where(
    and(
      eq(client.organizationId, organizationId),   // ← must be present
      eq(client.name, validatedData.name),
      isNull(client.deletedAt)
    )
  )
  .limit(1);

if (existingClient.length > 0) {
  throw new Error('A client with this name already exists in your organization');
}
```

If the query is missing `eq(client.organizationId, organizationId)`, add it.
Without it, the app-level check would reject cross-org duplicates even though
the DB constraint now correctly allows them.

Also check `updateClient` — if it allows renaming a client, the same duplicate
check must be applied there, excluding the current record:

```typescript
// ✅ CORRECT update duplicate check
const existingClient = await db
  .select()
  .from(client)
  .where(
    and(
      eq(client.organizationId, organizationId),
      eq(client.name, validatedData.name),
      isNull(client.deletedAt),
      // exclude the record being updated
      sql`${client.id} != ${clientId}`
    )
  )
  .limit(1);
```

---

## Step 5 — Update bulk import SQL (if applicable)

The `import-bulk-tenders.sql` upserts clients using:

```sql
ON CONFLICT (id) DO UPDATE SET ...
```

This conflicts on `id`, not `name`, so it is not directly affected by this change.
However, verify the `id` generation logic (currently `md5(organization_id || ':' || lower(client_name))`)
still produces deterministic, org-scoped IDs — it does, so no change is needed.

---

## Testing checklist

- [ ] **Same org duplicate (should fail):** Create client `"Eskom"` in Org A, then try
  to create `"Eskom"` again in Org A → rejected
- [ ] **Cross-org same name (should succeed):** Create `"Eskom"` in Org A, then create
  `"Eskom"` in Org B → both succeed
- [ ] **Case sensitivity check:** Confirm whether `"eskom"` and `"Eskom"` in the same
  org are treated as duplicates. PostgreSQL `UNIQUE` is case-sensitive by default.
  If you want case-insensitive uniqueness, use:
  ```sql
  CREATE UNIQUE INDEX client_organization_id_name_ci_unique
    ON client (organization_id, lower(name))
    WHERE deleted_at IS NULL;
  ```
- [ ] **Rename (update) path:** Renaming a client to an existing name in the same org
  → rejected. Renaming to its current name → succeeds (no false positive).
- [ ] **Database verification:**
  ```sql
  SELECT organization_id, name, COUNT(*)
  FROM client
  WHERE deleted_at IS NULL
  GROUP BY organization_id, name
  HAVING COUNT(*) > 1;
  -- Should return 0 rows
  ```
