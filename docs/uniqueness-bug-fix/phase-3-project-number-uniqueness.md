# Phase 3: Add Org-Scoped Unique Constraint on Project Number

**Priority:** 🟠 High  
**Estimated effort:** 1 day (including validation logic audit)  
**Files touched:** 2–3  
**Depends on:** Phase 1 and 2 complete (recommended order, no hard dependency)

---

## Problem

`project.projectNumber` has no uniqueness constraint at all. Within the same
organization, two projects with the same number can be created silently. This causes:

- Ambiguous project references on purchase orders and documents
- Reporting confusion — aggregates may double-count or misattribute data
- Projects inherited from tenders lose their traceability if numbers collide

Different organizations should be free to use the same project numbers. Uniqueness
must be scoped per organization only.

---

## Step 1 — Update `packages/db/src/schema.ts`

Find the `project` table definition. It currently has no third argument:

```typescript
// BEFORE
export const project = pgTable('project', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organization.id, { onDelete: 'cascade' }),
  projectNumber: text('project_number').notNull(),
  description: text('description'),
  tenderId: text('tender_id').references(() => tender.id),
  clientId: text('client_id').references(() => client.id),
  status: text('status').default('active').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});
```

Add the composite unique constraint:

```typescript
// AFTER
export const project = pgTable(
  'project',
  {
    id: text('id').primaryKey(),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),
    projectNumber: text('project_number').notNull(),
    description: text('description'),
    tenderId: text('tender_id').references(() => tender.id),
    clientId: text('client_id').references(() => client.id),
    status: text('status').default('active').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => ({
    projectNumberOrgUnique: unique('project_organization_id_project_number_unique').on(
      table.organizationId,
      table.projectNumber
    ),
  })
);
```

---

## Step 2 — Check for existing duplicate data before migrating

⚠️ Run these queries against the database before generating the migration. If
duplicates exist, the migration will fail.

```sql
-- Active duplicates
SELECT organization_id, project_number, COUNT(*) AS count
FROM project
WHERE deleted_at IS NULL
GROUP BY organization_id, project_number
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- Including soft-deleted
SELECT organization_id, project_number, COUNT(*) AS count
FROM project
GROUP BY organization_id, project_number
HAVING COUNT(*) > 1
ORDER BY count DESC;
```

Resolve any duplicates before running the migration. As with clients, you can
optionally scope the constraint to active records only using a partial index:

```sql
-- Partial index option (excludes soft-deleted projects)
CREATE UNIQUE INDEX project_organization_id_project_number_unique
  ON project (organization_id, project_number)
  WHERE deleted_at IS NULL;
```

If using the partial index approach, add this SQL manually to the migration file
after generation instead of relying on Drizzle's `unique()`.

---

## Step 3 — Generate and run the migration

```bash
bun run db:generate -- --name add_project_number_org_unique_constraint
bun run db:migrate
```

Expected migration SQL:

```sql
ALTER TABLE "project"
  ADD CONSTRAINT "project_organization_id_project_number_unique"
  UNIQUE ("organization_id", "project_number");
```

---

## Step 4 — Audit `apps/tracker/src/server/projects.ts`

Open the file and find the `createProject` function. Verify the duplicate-check
query includes `organizationId`:

```typescript
// ✅ CORRECT — must look like this
const existingProject = await db
  .select()
  .from(project)
  .where(
    and(
      eq(project.organizationId, organizationId),   // ← must be present
      eq(project.projectNumber, validatedData.projectNumber),
      isNull(project.deletedAt)
    )
  )
  .limit(1);

if (existingProject.length > 0) {
  throw new Error('A project with this number already exists in your organization');
}
```

Also check `updateProject` for the rename path — same pattern as the client fix,
exclude the current record:

```typescript
// ✅ CORRECT update duplicate check
const existingProject = await db
  .select()
  .from(project)
  .where(
    and(
      eq(project.organizationId, organizationId),
      eq(project.projectNumber, validatedData.projectNumber),
      isNull(project.deletedAt),
      sql`${project.id} != ${projectId}`
    )
  )
  .limit(1);
```

---

## Step 5 — Consider tender-to-project inheritance

Projects can be created from tenders (`tenderId` is set). When a project is
auto-created from a won tender, the `projectNumber` is typically inherited from
the `tenderNumber`. Verify the project creation flow handles the uniqueness
constraint gracefully:

- If a project already exists for that tender number in the org → show a clear
  error rather than a raw DB constraint violation
- The error message should say something like: `"Project PRJ-001 already exists.
  This tender may have already been converted to a project."`

---

## Testing checklist

- [ ] **Same org duplicate (should fail):** Create project `"PRJ-001"` in Org A, then
  try to create `"PRJ-001"` again in Org A → rejected
- [ ] **Cross-org same number (should succeed):** Create `"PRJ-001"` in Org A, then
  create `"PRJ-001"` in Org B → both succeed
- [ ] **Tender-to-project conversion:** Convert a tender to a project, then try to
  convert the same tender again → rejected with meaningful error
- [ ] **Update path:** Renaming a project number to one already used in the same org
  → rejected. Saving unchanged → succeeds.
- [ ] **Database verification:**
  ```sql
  SELECT organization_id, project_number, COUNT(*)
  FROM project
  WHERE deleted_at IS NULL
  GROUP BY organization_id, project_number
  HAVING COUNT(*) > 1;
  -- Should return 0 rows
  ```
