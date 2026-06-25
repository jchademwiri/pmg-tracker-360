# Critical Functionality Fix Status

Status: In Progress  
Branch: `fix/audit-critical-functionality`  
Base: `dev`  
Created: 2026-06-25

## Fixed in This Branch

### 1. Report stats organization access validation

File:

```txt
apps/tracker/src/server/reports.ts
```

Change:

- Added `validateSessionAndOrg(organizationId)` at the start of `getReportStats()`.
- Prevents the report stats server function from trusting a raw `organizationId` without membership validation.

### 2. Organization management member redirect loop

File:

```txt
apps/tracker/src/app/(dashboard)/organization/[slug]/page.tsx
```

Change:

- Removed the redirect that sent `member` users back to the same `/organization/[slug]` route.
- Removed the broad `try/catch` wrapper that could swallow Next.js redirect/not-found control flow.
- Passes `userRole` into the organization tabs so the UI layer can handle restricted/read-only behaviour.

### 3. Date-only tender deadline handling

File:

```txt
apps/tracker/src/lib/tender-utils.ts
```

Change:

- Added date-only deadline detection for UTC-midnight stored dates.
- Keeps date-only tenders open until the end of the South African calendar day instead of closing them immediately after UTC midnight.

## Still To Fix

### 1. Invitation complete-signup multi-organization membership

File:

```txt
apps/tracker/src/app/api/invite/complete-signup/route.ts
```

Required change:

- Existing membership check must use `userId + invite.organizationId`, not only `userId`.
- Otherwise, a user who already belongs to another organization can be blocked from joining the invited organization.
- The invite acceptance update should ideally be wrapped in a DB transaction.

Suggested logic:

```ts
const existingMember = await db.query.member.findFirst({
  where: and(
    eq(member.userId, userId),
    eq(member.organizationId, invite.organizationId)
  ),
});
```

### 2. Purchase order delivery note organization scoping

File:

```txt
apps/tracker/src/server/purchase-orders.ts
```

Required change:

- `verifyDeliveryNote()` and `voidDeliveryNote()` must confirm the delivery note belongs to the supplied organization.
- Current lookup by `deliveryNoteId` alone is not enough.
- Recommended fix: fetch the note together with the related PO/project and check `purchaseOrder.organizationId === organizationId`.

### 3. Delivery verification double-counting

File:

```txt
apps/tracker/src/server/purchase-orders.ts
```

Required change:

- `verifyDeliveryNote()` should not append the current note to the verified notes list after already querying verified notes post-update.
- Otherwise, the current note may be counted twice and the PO can be marked completed too early.

### 4. Tender sorting

File:

```txt
apps/tracker/src/server/tenders.ts
```

Required change:

- `getTendersWithSorting()` calculates `sortColumn` but still orders by `desc(tender.createdAt)`.
- Replace the fixed order with `sortOrder === 'desc' ? desc(sortColumn) : sortColumn`.

### 5. Project completion percentage

File:

```txt
apps/tracker/src/server/projects.ts
```

Required change:

- Current partial-delivery progress assumes `partially_delivered` equals 50% of PO value.
- Replace this with actual delivered value or actual delivered quantity from `purchaseOrderDeliveryItem` records.

## Review Notes

This branch contains only high-confidence small fixes that do not require broad refactoring of large server files. The remaining fixes touch larger workflows and should be implemented with focused tests because the app is already published and in use.
