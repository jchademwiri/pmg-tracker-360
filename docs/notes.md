## Tender Validity & Extensions

Each tender needs a tender validity, user can add in days or pick a date, that date can be extended by an extension, extensions are mainly extending this validity.

---

## BUG FIX: Tender Number Uniqueness Constraint

### Issue
When attempting to add a tender with the same tender number in **different organizations**, the system incorrectly rejects it with:
```
"Tender number already exists in this organization"
```

This violates the business requirement that **tender numbers should only be unique within the same organization**, not globally across all organizations.

### Root Cause

The database schema in `packages/db/src/schema.ts` (line 314) defines the `tenderNumber` column with a **global uniqueness constraint**:

```typescript
tenderNumber: text('tender_number').notNull().unique(), // ❌ GLOBAL UNIQUE - WRONG!
```

This `.unique()` constraint enforces uniqueness across **all organizations**, preventing different organizations from using the same tender number.

### Solution

#### Step 1: Update Database Schema

**File:** `packages/db/src/schema.ts` (lines 308-335)

**Change from:**
```typescript
// Tender table with unique tender numbers
export const tender = pgTable('tender', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organization.id, { onDelete: 'cascade' }),
  tenderNumber: text('tender_number').notNull().unique(), // ❌ Global unique
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
```

**Change to:**
```typescript
// Tender table with unique tender numbers scoped to organization
export const tender = pgTable('tender', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organization.id, { onDelete: 'cascade' }),
  tenderNumber: text('tender_number').notNull(), // ✅ Removed global unique
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
}, (table) => ({
  // ✅ Add composite unique constraint: organization + tender number
  tenderNumberOrgUnique: unique('tender_organization_id_tender_number_unique').on(
    table.organizationId,
    table.tenderNumber
  ),
}));
```

**Key Changes:**
- Remove `.unique()` from `tenderNumber` field
- Add constraint table configuration as 3rd parameter
- Add `tenderNumberOrgUnique` composite unique constraint on `(organizationId, tenderNumber)`
- This ensures uniqueness is scoped to each organization

#### Step 2: Create Database Migration

**File:** `packages/db/migrations/schema.ts`

**Change from:**
```typescript
unique("tender_tender_number_unique").on(table.tenderNumber),
```

**Change to:**
```typescript
unique("tender_organization_id_tender_number_unique").on(table.organizationId, table.tenderNumber),
```

**Important:** Remove the old global unique constraint on `tenderNumber` if it exists.

#### Step 3: Create and Run Migration

Create a new migration file:

```bash
npm run db:generate -- --name fix_tender_number_uniqueness_constraint
```

This will generate the migration SQL. Review and execute:

```bash
npm run db:migrate
```

**Migration SQL (Expected):**
```sql
-- Remove old global unique constraint
ALTER TABLE "tender" DROP CONSTRAINT "tender_tender_number_unique";

-- Add new organization-scoped unique constraint
ALTER TABLE "tender" ADD CONSTRAINT "tender_organization_id_tender_number_unique" 
UNIQUE ("organization_id", "tender_number");
```

#### Step 4: Validation Logic (Already Correct)

The validation logic in `apps/tracker/src/server/tenders.ts` is already correct and properly scopes to organization:

```typescript
// ✅ This is correct - checks tender number uniqueness within organization
const existingTender = await db
  .select()
  .from(tender)
  .where(
    and(
      eq(tender.tenderNumber, validatedData.tenderNumber.toUpperCase()),
      eq(tender.organizationId, organizationId),  // ✅ Scoped to organization
      isNull(tender.deletedAt)
    )
  )
  .limit(1);
```

No changes needed in the application code - the bug is purely in the database schema.

### Testing

After applying the migration, verify the fix:

1. **Same Organization Test (Should Fail - Duplicate):**
   - Organization A: Create tender "TN-001"
   - Organization A: Try to create tender "TN-001" again → ❌ Should be rejected

2. **Different Organization Test (Should Succeed - Allowed):**
   - Organization A: Create tender "TN-001" ✅
   - Organization B: Create tender "TN-001" ✅ Should succeed

3. **Database Query Verification:**
   ```sql
   -- This query should return 2 records (one per organization)
   SELECT id, organization_id, tender_number FROM tender WHERE tender_number = 'TN-001';
   ```

### Files Modified

1. `packages/db/src/schema.ts` - Update tender table definition
2. `packages/db/migrations/schema.ts` - Update migration schema
3. Migration file (auto-generated) - Contains the SQL changes

### Impact

- ✅ Different organizations can now use the same tender numbers
- ✅ Same organization still cannot have duplicate tender numbers
- ✅ Existing validation logic remains unchanged and correct
- ✅ No application code changes required
- ✅ Backward compatible after migration (existing data unaffected)

### Deployment Steps

1. Create migration file
2. Test migration on development database
3. Deploy migration to staging/production
4. No application restart required
5. Verify with test cases above

---

## FUTURE-PROOFING: Organization-Scoped Uniqueness Pattern

**Status:** Ready for implementation
**Priority:** High (blocks multi-organization use case)
**Estimated Effort:** 30 minutes

---

### Overview

This fix establishes a critical architectural pattern that **must be applied consistently** to all entities that should have organization-scoped uniqueness. This prevents similar bugs from appearing with other resources as the application grows.

### Business Rules for Entity Uniqueness

#### 📋 Tender Numbers
- **Uniqueness Scope:** Per organization
- **Business Rule:** One organization may work on the same tender as another organization
- **Constraint:** Tender number must be unique within same organization only
- **Database Constraint:** `UNIQUE(organization_id, tender_number)`
- **Schema Status:** ✅ Fixed (this PR)

#### 📋 Project Numbers
- **Uniqueness Scope:** Per organization
- **Business Rule:** One organization may work on the same project as another organization
- **Constraint:** Project number must be unique within same organization only
- **Database Constraint:** `UNIQUE(organization_id, project_number)`
- **Schema Status:** 🔴 Needs fix

#### 📋 Client Names
- **Uniqueness Scope:** Per organization
- **Business Rule:** Different organizations can have clients with the same name
- **Constraint:** Client name must be unique within same organization only
- **Database Constraint:** `UNIQUE(organization_id, name)`
- **Schema Status:** ❌ No constraint (should add)

#### 📋 Purchase Order Numbers
- **Uniqueness Scope:** GLOBAL (across all organizations & clients)
- **Business Rule:** PO number must NEVER be the same from the same client, and must always be globally unique
- **Constraint:** PO number must be globally unique (no organization or client scoping)
- **Database Constraint:** `UNIQUE(po_number)` - Keep as global unique ✅
- **Schema Status:** ✅ Already correct (keep existing `.unique()`)

### Entities Requiring Organization-Scoped Uniqueness

#### ✅ Already Fixed
- **Tender:** `tenderNumber` (via this fix)

#### 🔴 Requires Fix
- **Client:** `name` - Should be unique per organization
- **Project:** `projectNumber` - Should be unique per organization

#### ✅ Already Correct (No Changes Needed)
- **PurchaseOrder:** `poNumber` - Must remain GLOBALLY unique (across all orgs and clients)

### Current Schema Issues & Fixes

#### 1. **Tender Table** (lines 308-335) ✅ FIXED
```typescript
export const tender = pgTable('tender', {
  // ... fields ...
  tenderNumber: text('tender_number').notNull(), // ✅ Removed .unique()
  // ... more fields ...
}, (table) => ({
  tenderNumberOrgUnique: unique('tender_organization_id_tender_number_unique').on(
    table.organizationId,
    table.tenderNumber
  ),
}));
```

#### 2. **Client Table** (lines 292-306) 🔴 NEEDS FIX
```typescript
export const client = pgTable('client', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull()...
  name: text('name').notNull(),
  // ❌ PROBLEM: No uniqueness constraint - allows duplicates within same org
  // ✅ SOLUTION: Add composite unique on (organizationId, name)
  ...
});
```

**Fix:**
```typescript
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
}, (table) => ({
  // ✅ Add composite unique constraint
  clientNameOrgUnique: unique('client_organization_id_name_unique').on(
    table.organizationId,
    table.name
  ),
}));
```

#### 3. **Project Table** (lines 338-351) 🔴 NEEDS FIX
```typescript
export const project = pgTable('project', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull()...
  projectNumber: text('project_number').notNull(),
  description: text('description'),
  // ❌ PROBLEM: No uniqueness constraint on projectNumber
  // ✅ SOLUTION: Add composite unique on (organizationId, projectNumber)
  ...
});
```

**Fix:**
```typescript
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
}, (table) => ({
  // ✅ Add composite unique constraint
  projectNumberOrgUnique: unique('project_organization_id_project_number_unique').on(
    table.organizationId,
    table.projectNumber
  ),
}));
```

#### 4. **Purchase Order Table** (lines 354-375) ✅ KEEP AS IS
```typescript
export const purchaseOrder = pgTable('purchase_order', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull()...
  poNumber: text('po_number').notNull().unique(), // ✅ CORRECT - Keep global unique!
  supplierName: text('supplier_name'),
  description: text('description').notNull(),
  totalAmount: text('total_amount').notNull(),
  status: text('status').default('draft').notNull(),
  // ... more fields ...
});
```

**Why it's correct:**
- PO numbers must be globally unique across ALL organizations
- Business rule: "There must never be same PO Number from same client"
- This ensures integrity when dealing with suppliers/vendors globally
- `UNIQUE(po_number)` is the correct constraint

### Implementation Roadmap

#### Phase 1: Tender Number Fix (CURRENT) ✅
- Implement tender number organization-scoped uniqueness
- Duration: 1 sprint
- Priority: 🔴 Critical
- Status: Ready for implementation

#### Phase 2: Client Name Fix
- Add unique constraint on client name per organization
- Validate all validation logic in `apps/tracker/src/server/clients.ts`
- Ensure validation includes `organizationId` in query
- Duration: 1 day
- Priority: 🟠 High
- File: `apps/tracker/src/server/clients.ts` (check `createClient` validation)

#### Phase 3: Project Number Fix
- Add unique constraint on project number per organization
- Validate all validation logic in `apps/tracker/src/server/projects.ts`
- Ensure validation includes `organizationId` in query
- Duration: 1 day
- Priority: 🟠 High
- File: `apps/tracker/src/server/projects.ts` (check `createProject` validation)

#### Phase 4: PO Number Validation (VERIFICATION ONLY)
- Verify PO number remains globally unique
- Confirm validation logic in `apps/tracker/src/server/purchaseOrders.ts`
- NO SCHEMA CHANGES - Already correct
- Duration: 2 hours
- Priority: 🟢 Low (audit)

### General Pattern for Organization-Scoped Uniqueness

When adding new unique fields to any table, follow this pattern:

```typescript
// ❌ WRONG - Global unique constraint (unless business rule requires it)
export const someTable = pgTable('some_table', {
  organizationId: text('organization_id').notNull()...
  someField: text('some_field').notNull().unique(), // ❌ DON'T DO THIS
  ...
});

// ✅ CORRECT - Organization-scoped unique constraint
export const someTable = pgTable('some_table', {
  organizationId: text('organization_id').notNull()...
  someField: text('some_field').notNull(), // ✅ No global unique
  ...
}, (table) => ({
  // ✅ Composite unique constraint
  someFieldOrgUnique: unique('some_table_organization_id_some_field_unique').on(
    table.organizationId,
    table.someField
  ),
}));

// ✅ EXCEPTION - Global unique constraint (when business rule requires it)
export const someOtherTable = pgTable('some_other_table', {
  organizationId: text('organization_id').notNull()...
  globallyUniqueField: text('globally_unique_field').notNull().unique(), // ✅ DO THIS for global uniqueness
  ...
});
```

### Checklist for Future Entity Additions

When adding new entities or fields that require uniqueness:

- [ ] Clarify with product/business: Is this unique globally or per-organization?
- [ ] If organization-scoped:
  - [ ] Remove `.unique()` from the field definition
  - [ ] Add composite unique constraint in table configuration
  - [ ] Use naming convention: `{tableName}_{fieldNames}OrgUnique`
  - [ ] Include `organizationId` in the constraint
  - [ ] Update validation logic to include `organizationId` in queries
  - [ ] Add tests for cross-organization scenarios
- [ ] If globally unique:
  - [ ] Keep `.unique()` on the field definition
  - [ ] Document why global uniqueness is required
  - [ ] Add validation tests
- [ ] Update this documentation file

### Validation Logic Pattern

#### For Organization-Scoped Uniqueness:
```typescript
// ✅ CORRECT - Scoped to organization
const existing = await db
  .select()
  .from(someTable)
  .where(
    and(
      eq(someTable.organizationId, organizationId), // ✅ Must include
      eq(someTable.someField, value),
      isNull(someTable.deletedAt)
    )
  )
  .limit(1);
```

#### For Global Uniqueness:
```typescript
// ✅ CORRECT - No organization scope (for global uniqueness)
const existing = await db
  .select()
  .from(poTable)
  .where(
    and(
      eq(poTable.poNumber, value), // ✅ Global check only
      isNull(poTable.deletedAt)
    )
  )
  .limit(1);
```

### Testing Requirements

#### For Organization-Scoped Uniqueness:

1. **Within Organization Test** (Should Fail):
   ```
   Org A: Create Tender "TN-001"
   Org A: Try to create Tender "TN-001" again → ❌ Rejected
   ```

2. **Across Organizations Test** (Should Succeed):
   ```
   Org A: Create Tender "TN-001" ✅
   Org B: Create Tender "TN-001" ✅ Allowed
   ```

3. **Database Integrity Test**:
   ```sql
   SELECT COUNT(*) FROM tender WHERE tender_number = 'TN-001' AND organization_id = 'org_a';
   -- Should return 1 or 0, never > 1
   ```

#### For Global Uniqueness (PO Numbers):

1. **Global Uniqueness Test** (Should Fail):
   ```
   Org A: Create PO "PO-2024-001"
   Org B: Try to create PO "PO-2024-001" → ❌ Rejected (globally unique)
   ```

2. **Multiple Organizations Test** (Should Succeed with different PO):
   ```
   Org A: Create PO "PO-2024-001" ✅
   Org B: Create PO "PO-2024-002" ✅ Different number allowed
   ```

3. **Database Integrity Test**:
   ```sql
   SELECT COUNT(*) FROM purchase_order WHERE po_number = 'PO-2024-001';
   -- Should return exactly 1, never > 1
   ```

---

**Last Updated:** 2026-06-08
**Pattern Status:** Established
**Tender Fix Status:** ✅ Ready for implementation
**PO Number Status:** ✅ Already correct (no changes needed)
**Next Review:** After Phase 1 completion
