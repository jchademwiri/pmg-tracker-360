# Phase 5: Purchase Order Number — Audit & Verification (No Schema Changes)

**Priority:** 🟢 Low  
**Estimated effort:** 2 hours  
**Files touched:** 0 (schema is already correct)  
**Type:** Audit only

---

## Summary

`purchaseOrder.poNumber` has a global `.unique()` constraint. This is **intentionally
correct** and must not be changed.

**Business rule:** PO numbers must be globally unique across all organizations and
all clients. Two organizations cannot hold POs with the same number.

This phase is a verification pass — confirm the application-layer validation matches
the schema intent.

---

## What to verify

### 1. Schema is correct — confirm and leave unchanged

In `packages/db/src/schema.ts`:

```typescript
// ✅ CORRECT — do not change
poNumber: text('po_number').notNull().unique(),
```

---

### 2. Audit `apps/tracker/src/server/purchaseOrders.ts`

Find the `createPurchaseOrder` function. The duplicate-check query must **not**
scope to `organizationId` — it should check globally:

```typescript
// ✅ CORRECT — global check, no org scope
const existingPO = await db
  .select()
  .from(purchaseOrder)
  .where(
    and(
      eq(purchaseOrder.poNumber, validatedData.poNumber),
      isNull(purchaseOrder.deletedAt)
    )
  )
  .limit(1);

if (existingPO.length > 0) {
  throw new Error('A purchase order with this number already exists.');
}
```

If the query incorrectly includes `eq(purchaseOrder.organizationId, organizationId)`,
**remove that line**. The intent is global uniqueness.

---

### 3. Confirm error message is clear

When the DB constraint fires (or the app-level check catches it), the error shown
to the user should make it clear that the PO number is taken globally, not just
within their org:

```
// Recommended message
"This PO number is already in use. PO numbers must be unique across all organizations."
```

This avoids confusion where a user thinks the number is free because they have
never used it in their own org.

---

### 4. Verify soft-delete behaviour

If a PO is soft-deleted (`deletedAt IS NOT NULL`), confirm whether its number
is freed up for reuse. Current options:

**Option A — Soft-deleted POs free their number (recommended for flexibility):**
```typescript
// App-level check excludes deleted records
isNull(purchaseOrder.deletedAt)
```
The DB constraint still holds globally for active records. A new PO can reuse a
soft-deleted number only if no active PO uses it.

> Note: Postgres `UNIQUE` includes soft-deleted rows. If you want soft-deleted
> records to release their number, you must switch to a partial unique index:
> ```sql
> DROP INDEX IF EXISTS purchase_order_po_number_key;
> CREATE UNIQUE INDEX purchase_order_po_number_active_unique
>   ON purchase_order (po_number)
>   WHERE deleted_at IS NULL;
> ```
> Only do this if the business explicitly requires number reuse after deletion.

**Option B — Soft-deleted POs permanently hold their number:**  
Keep the full `.unique()` constraint as-is. Simpler, and usually correct for
financial audit trail purposes.

Confirm with the business which behaviour is intended. Document the decision here.

---

## Testing checklist

- [ ] **Global duplicate (should fail):** Create PO `PO-2026-001` in Org A, then try
  to create `PO-2026-001` in Org B → rejected globally
- [ ] **Different numbers cross-org (should succeed):** Org A creates `PO-2026-001`,
  Org B creates `PO-2026-002` → both succeed
- [ ] **Error message is meaningful:** The rejection message explains global uniqueness,
  not just org-level uniqueness
- [ ] **Soft-delete behaviour confirmed:** Behaviour when a PO is soft-deleted is
  documented and matches business requirement
- [ ] **Database verification:**
  ```sql
  -- Confirm the global unique constraint exists
  SELECT conname, contype
  FROM pg_constraint
  WHERE conrelid = 'purchase_order'::regclass
    AND contype = 'u';
  -- Should include a row for po_number
  ```
