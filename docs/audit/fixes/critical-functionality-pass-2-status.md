# Critical Functionality Pass 2 Status

Branch: `fix/audit-critical-functionality-pass-2`  
Base: `dev`  
Status: In progress

## Fixed in This Branch

### Invitation membership scoping

File: `apps/tracker/src/app/api/invite/complete-signup/route.ts`

- Existing membership checks now use `userId + organizationId`.
- Users who already belong to another organization can now still accept an invitation into the invited organization.
- Membership creation and invitation acceptance are wrapped in one transaction.

### Report stats organization validation

File: `apps/tracker/src/server/reports.ts`

- `getReportStats()` now calls `validateSessionAndOrg(organizationId)` before querying organization report data.

### Organization member redirect loop

File: `apps/tracker/src/app/(dashboard)/organization/[slug]/page.tsx`

- Removed the redirect that sent `member` users back to the same route.
- Removed the broad `try/catch` that could swallow Next.js redirect and not-found control flow.

### Date-only tender closing logic

File: `apps/tracker/src/lib/tender-utils.ts`

- Date-only submission values stored as UTC midnight are now treated as closing at the end of the South African calendar day.

### Organization user lookup protection

File: `apps/tracker/src/server/users.ts`

- `getAllUsers()` now validates membership in the target organization.
- Only `owner` and `admin` roles can retrieve users outside the current organization.

## Still Pending

These larger fixes remain pending because they require careful patching of large server files and focused regression testing:

1. `apps/tracker/src/server/purchase-orders.ts`
   - Scope `verifyDeliveryNote()` and `voidDeliveryNote()` to the supplied organization.
   - Remove the delivery verification double-counting path.

2. `apps/tracker/src/server/tenders.ts`
   - Fix `getTendersWithSorting()` so it uses the selected `sortColumn` and `sortOrder` instead of always ordering by `createdAt` descending.

3. `apps/tracker/src/server/projects.ts`
   - Replace the placeholder 50% partial-delivery completion calculation with actual delivered quantity or delivered value from delivery items.

## Review Note

This branch intentionally keeps changes focused on smaller files that can be safely replaced and reviewed. The remaining fixes should be handled in a follow-up branch with a local checkout or a patch-capable workflow so large server files are not rewritten from incomplete connector output.
