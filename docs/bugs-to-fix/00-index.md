# Uniqueness Constraint Fixes — Master Index

**Codebase:** TenderTrack360 (`packages/db/src/schema.ts`)  
**Audit date:** 2026-06-08  
**Total issues found:** 4 (1 critical, 3 high)  

---

## Execution order

| Phase | File | Issue | Effort | Status |
|---|---|---|---|---|
| [Phase 1](./phase-1-tender-number-uniqueness.md) | `tender.tenderNumber` | Global unique → org-scoped | 30 min | 🔴 Do first |
| [Phase 1b](./phase-1-tender-number-uniqueness.md#step-3) | `import-bulk-tenders.sql` | `ON CONFLICT` references old constraint | 5 min | 🔴 Same deploy as Phase 1 |
| [Phase 2](./phase-2-client-name-uniqueness.md) | `client.name` | No constraint → org-scoped | 1 day | 🟠 After Phase 1 |
| [Phase 3](./phase-3-project-number-uniqueness.md) | `project.projectNumber` | No constraint → org-scoped | 1 day | 🟠 After Phase 2 |
| [Phase 4](./phase-4-invitation-uniqueness.md) | `invitation(org, email)` | No constraint → pending-scoped | 2 hr | 🟠 Independent |
| [Phase 5](./phase-5-po-number-audit.md) | `purchaseOrder.poNumber` | Audit only — already correct | 2 hr | 🟢 Anytime |

---

## Quick reference — all constraints

### Must stay global

```typescript
user.email                    // One login per email globally
session.token                 // Security
organization.slug             // URL identifier
ownershipTransfer.transferToken  // Security
waitlist.email                // One waitlist entry per email
purchaseOrder.poNumber        // PO numbers are globally unique by business rule
```

### Must be org-scoped (composite unique)

```typescript
// tender — Phase 1 (CRITICAL)
unique('tender_organization_id_tender_number_unique').on(
  table.organizationId, table.tenderNumber
)

// client — Phase 2
unique('client_organization_id_name_unique').on(
  table.organizationId, table.name
)

// project — Phase 3
unique('project_organization_id_project_number_unique').on(
  table.organizationId, table.projectNumber
)
```

### Must be scoped with partial index (status = 'pending')

```sql
-- invitation — Phase 4
CREATE UNIQUE INDEX "invitation_organization_id_email_pending_unique"
  ON "invitation" ("organization_id", "email")
  WHERE status = 'pending';
```

### Already correct composites (no changes)

```typescript
member: unique().on(table.organizationId, table.userId)
notificationPreferences: unique().on(table.userId)
```

---

## Migration command reference

```bash
# From repo root — generate migration
bun run db:generate -- --name <migration_name>

# Run pending migrations
bun run db:migrate

# Verify constraints live in DB
psql $DATABASE_URL -c "
  SELECT conname, contype, pg_get_constraintdef(oid)
  FROM pg_constraint
  WHERE conrelid IN (
    'tender'::regclass,
    'client'::regclass,
    'project'::regclass,
    'invitation'::regclass,
    'purchase_order'::regclass
  )
  AND contype IN ('u', 'p')
  ORDER BY conrelid::text, conname;
"
```

---

## Pre-migration duplicate check — run all at once

Before running any phase, verify there are no existing duplicates that would
block the migration:

```sql
-- Tender duplicates (Phase 1)
SELECT organization_id, tender_number, COUNT(*)
FROM tender
WHERE deleted_at IS NULL
GROUP BY organization_id, tender_number
HAVING COUNT(*) > 1;

-- Client name duplicates (Phase 2)
SELECT organization_id, name, COUNT(*)
FROM client
WHERE deleted_at IS NULL
GROUP BY organization_id, name
HAVING COUNT(*) > 1;

-- Project number duplicates (Phase 3)
SELECT organization_id, project_number, COUNT(*)
FROM project
WHERE deleted_at IS NULL
GROUP BY organization_id, project_number
HAVING COUNT(*) > 1;

-- Pending invitation duplicates (Phase 4)
SELECT organization_id, email, COUNT(*)
FROM invitation
WHERE status = 'pending'
GROUP BY organization_id, email
HAVING COUNT(*) > 1;
```

All queries should return 0 rows before running migrations. If any return rows,
resolve duplicates first — see the relevant phase file for guidance.

---

## Pattern for all future entities

When adding a new table that belongs to an organization, always ask:

> **Is this field unique globally, or unique within this organization?**

```typescript
// ❌ WRONG — global unique on an org-owned field
export const newTable = pgTable('new_table', {
  organizationId: text('organization_id').notNull()...,
  referenceNumber: text('reference_number').notNull().unique(), // ❌
});

// ✅ CORRECT — org-scoped composite unique
export const newTable = pgTable(
  'new_table',
  {
    organizationId: text('organization_id').notNull()...,
    referenceNumber: text('reference_number').notNull(), // no .unique()
  },
  (table) => ({
    refNumberOrgUnique: unique('new_table_organization_id_reference_number_unique').on(
      table.organizationId,
      table.referenceNumber
    ),
  })
);

// ✅ CORRECT — genuinely global (tokens, system identifiers, PO numbers)
export const newTable = pgTable('new_table', {
  globalToken: text('global_token').notNull().unique(), // ✅ document why
});
```

**Validation query must match the constraint scope:**

```typescript
// Org-scoped — always include organizationId in the where clause
const existing = await db.select().from(newTable).where(
  and(
    eq(newTable.organizationId, organizationId), // ← required
    eq(newTable.referenceNumber, value),
    isNull(newTable.deletedAt)
  )
).limit(1);

// Global — no org scope in the where clause
const existing = await db.select().from(newTable).where(
  and(
    eq(newTable.globalToken, value),
    isNull(newTable.deletedAt)
  )
).limit(1);
```
