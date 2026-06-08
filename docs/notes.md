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

**Status:** Ready for implementation
**Priority:** High (blocks multi-organization use case)
**Estimated Effort:** 30 minutes
