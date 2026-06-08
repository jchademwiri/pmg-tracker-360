# Phase 1: Fix Tender Number Global Uniqueness Constraint

**Priority:** 🔴 Critical  
**Estimated effort:** 30 minutes  
**Files touched:** 3  

---

## Problem

`tender.tenderNumber` has a global `.unique()` constraint, meaning no two organizations
can share the same tender number. The correct business rule is: tender numbers must be
unique **within** an organization, not globally.

**Symptom:** Creating a tender with a number that already exists in a different org
fails with `"Tender number already exists in this organization"` — even though the
number is in a completely different org.

---

## Step 1 — Update `packages/db/src/schema.ts`

Find the `tender` table definition and make two changes:

**Remove** `.unique()` from the `tenderNumber` field:

```typescript
// BEFORE
tenderNumber: text('tender_number').notNull().unique(),

// AFTER
tenderNumber: text('tender_number').notNull(),
```

**Add** a composite unique constraint as the third argument to `pgTable`:

```typescript
// BEFORE
export const tender = pgTable('tender', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organization.id, { onDelete: 'cascade' }),
  tenderNumber: text('tender_number').notNull().unique(),
  description: text('description'),
  clientId: text('client_id')
    .notNull()
    .references(() => client.id, { onDelete: 'cascade' }),
  submissionDate: timestamp('submission_date'),
  value: text('value'),
  status: text('status').default('draft').notNull(),
  evaluationDate: timestamp('evaluation_date'),
  validityDays: integer('validity_days'),
  validityDate: timestamp('validity_date'),
  contactName: text('contact_name'),
  contactEmail: text('contact_email'),
  contactPhone: text('contact_phone'),
  briefingDate: timestamp('briefing_date'),
  briefingLocation: text('briefing_location'),
  isBriefingMandatory: boolean('is_briefing_mandatory').default(false).notNull(),
  briefingAttended: boolean('briefing_attended').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});

// AFTER
export const tender = pgTable(
  'tender',
  {
    id: text('id').primaryKey(),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),
    tenderNumber: text('tender_number').notNull(),
    description: text('description'),
    clientId: text('client_id')
      .notNull()
      .references(() => client.id, { onDelete: 'cascade' }),
    submissionDate: timestamp('submission_date'),
    value: text('value'),
    status: text('status').default('draft').notNull(),
    evaluationDate: timestamp('evaluation_date'),
    validityDays: integer('validity_days'),
    validityDate: timestamp('validity_date'),
    contactName: text('contact_name'),
    contactEmail: text('contact_email'),
    contactPhone: text('contact_phone'),
    briefingDate: timestamp('briefing_date'),
    briefingLocation: text('briefing_location'),
    isBriefingMandatory: boolean('is_briefing_mandatory').default(false).notNull(),
    briefingAttended: boolean('briefing_attended').default(false).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => ({
    tenderNumberOrgUnique: unique('tender_organization_id_tender_number_unique').on(
      table.organizationId,
      table.tenderNumber
    ),
  })
);
```

---

## Step 2 — Generate and run the migration

```bash
# From the repo root
bun run db:generate -- --name fix_tender_number_uniqueness_constraint
bun run db:migrate
```

The generated migration SQL will look like this — verify it before running:

```sql
-- Drop old global unique constraint
ALTER TABLE "tender" DROP CONSTRAINT "tender_tender_number_unique";

-- Add new org-scoped composite unique constraint
ALTER TABLE "tender"
  ADD CONSTRAINT "tender_organization_id_tender_number_unique"
  UNIQUE ("organization_id", "tender_number");
```

---

## Step 3 — Update `packages/db/imports/import-bulk-tenders.sql`

⚠️ **Must be deployed in the same release as the migration.** The bulk import SQL
references the old single-column constraint. After the migration runs, the old
constraint no longer exists and the SQL will throw a constraint not found error.

Find the `ON CONFLICT` clause at the bottom of the file:

```sql
-- BEFORE
ON CONFLICT (tender_number) DO UPDATE SET
  organization_id = EXCLUDED.organization_id,
  ...

-- AFTER
ON CONFLICT (organization_id, tender_number) DO UPDATE SET
  organization_id = EXCLUDED.organization_id,
  ...
```

---

## Step 4 — Verify application validation (no changes needed)

Open `apps/tracker/src/server/tenders.ts` and confirm the duplicate-check query
already scopes to `organizationId`. It should look like this:

```typescript
// ✅ Already correct — no changes needed
const existingTender = await db
  .select()
  .from(tender)
  .where(
    and(
      eq(tender.tenderNumber, validatedData.tenderNumber.toUpperCase()),
      eq(tender.organizationId, organizationId),
      isNull(tender.deletedAt)
    )
  )
  .limit(1);
```

If it is missing the `eq(tender.organizationId, organizationId)` line, add it.

---

## Testing checklist

- [ ] **Same org duplicate (should fail):** Create tender `TN-001` in Org A, then try
  to create `TN-001` again in Org A → rejected with duplicate error
- [ ] **Cross-org same number (should succeed):** Create `TN-001` in Org A, then create
  `TN-001` in Org B → both succeed
- [ ] **Bulk import still works:** Run the import SQL with two records in the same org
  having different numbers → both upsert correctly
- [ ] **Database verification:**
  ```sql
  -- Should return 2 rows (one per org), not throw a constraint error
  SELECT id, organization_id, tender_number
  FROM tender
  WHERE tender_number = 'TN-001';
  ```

---

## Deployment order

1. Deploy schema migration
2. Deploy updated `import-bulk-tenders.sql` (same release)
3. No application restart required
4. No existing data is affected — migration only swaps the constraint type
