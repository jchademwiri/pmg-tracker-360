# PMG Tracker 360: Comprehensive Bug Fix Checklist

**Last Updated:** June 8, 2026  
**Status:** In Progress  
**Total Bugs:** 43 (including uniqueness constraints)
**Branches merged:** Customer Journey Audit + Uniqueness Constraints Audit

---

## 📊 Quick Stats

| Category | Count | Status |
|----------|-------|--------|
| **Security & Authorization** | 3 | ⏳ |
| **User Flow & Onboarding** | 3 | ⏳ |
| **Invitation Flow** | 6 | ⏳ |
| **Forms & Input** | 4 | ⏳ |
| **Tender Module** | 5 | ⏳ |
| **Uniqueness Constraints** | 5 | ⏳ |
| **Project & PO Module** | 6 | ⏳ |
| **Database & Performance** | 1 | ⏳ |
| **UI/UX & Visual** | 4 | ⏳ |
| **TOTAL** | **43** | ⏳ |

---

# 🔴 CRITICAL PRIORITY (Do First)

## Uniqueness Constraints — Phase 1: Tender Number

**Reference File:** `docs/bugs-to-fix/phase-1-tender-number-uniqueness.md`

### [ ] BUG-C1: Tender Number Global Uniqueness → Org-Scoped
**Severity:** 🔴 CRITICAL  
**Effort:** 30 minutes  
**Files:** `packages/db/src/schema.ts`, `packages/db/imports/import-bulk-tenders.sql`

**Description:**  
`tender.tenderNumber` incorrectly uses global `.unique()` instead of org-scoped composite. Prevents organizations from using same tender numbers.

**Tasks:**
- [ ] Remove `.unique()` from `tenderNumber` field
- [ ] Add composite unique constraint: `unique('tender_organization_id_tender_number_unique').on(organizationId, tenderNumber)`
- [ ] Generate and run migration
- [ ] Update `import-bulk-tenders.sql` `ON CONFLICT` clause
- [ ] Verify `apps/tracker/src/server/tenders.ts` already scopes duplicate check to org (should be OK)
- [ ] Test: Org A has TN-001, Org B can create TN-001 ✓

**Acceptance Criteria:**
- [ ] Cross-org tender numbers allowed
- [ ] Same-org duplicates blocked
- [ ] Migration runs without errors
- [ ] Bulk import still works

---

## Security Issues

### [ ] BUG-S1: Cross-Tenant Access Vulnerability in Server Actions
**Severity:** 🔴 CRITICAL  
**Category:** Security  
**Affected Files:**
- `apps/tracker/src/server/tenders.ts`
- `apps/tracker/src/server/clients.ts`
- `apps/tracker/src/server/projects.ts`
- `apps/tracker/src/server/purchase-orders.ts`
- `apps/tracker/src/server/documents.ts`

**Description:**  
Server actions do not validate if user belongs to target organization. Users can access/modify records across organizations.

**Acceptance Criteria:**
- [ ] `validateSessionAndOrg()` helper created in `apps/tracker/src/server/utils.ts`
- [ ] All mutation server actions wrapped with session + org validation
- [ ] All query server actions verify user membership before returning data
- [ ] Unit tests confirm cross-tenant access is blocked

**Reference:** `docs/customer-journey-audit/proposed-solutions.md` - Section 1

---

### [ ] BUG-S2: Privilege Escalation in Admin Console (`createSystemAdmin`)
**Severity:** 🔴 CRITICAL  
**Category:** Security  
**Affected Files:** `apps/admin/src/app/actions.ts`

**Description:**  
`createSystemAdmin` is publicly exposed without authentication, allowing anyone to create admin accounts.

**Acceptance Criteria:**
- [ ] Wrapped with admin role verification
- [ ] Better Auth session check enforced
- [ ] Rate limiting implemented
- [ ] Security audit confirms no unauthorized access

**Reference:** `docs/customer-journey-audit/audit-findings.md` - Phase 1, Section 5

---

## Invitation Flow Critical Bugs

### [ ] BUG-I1: `complete-signup` Uses Unreliable Headers for Invitation Acceptance
**Severity:** 🔴 CRITICAL  
**Files:** `apps/tracker/src/app/api/invite/complete-signup/route.ts`  
**Root Cause:** Invitation resend issue

**Description:**  
After signup, the function uses `signUpResult.headers` (response headers) to accept invitation. These are not authenticated session headers, causing silent failures.

**Acceptance Criteria:**
- [ ] After signup, immediately sign in to get real authenticated session
- [ ] Use sign-in session headers for `acceptInvitation`
- [ ] OR use direct DB member insertion (more reliable)
- [ ] Test: Invited user completes signup → automatically member of invited org ✓
- [ ] No invitation acceptance failures

**Reference:** `docs/bugs-to-fix/invitation-flow-audit.md` - Bug 1

---

### [ ] BUG-I2: Invited Users Forced to Create Organization During Onboarding
**Severity:** 🔴 CRITICAL  
**Files:** `apps/tracker/src/app/onboarding/page.tsx`, middleware  
**Root Cause:** Invitation resend issue

**Description:**  
Invited users land on `/onboarding` and are forced to create a new org, disconnecting them from their invitation.

**Acceptance Criteria:**
- [ ] Detect pending invitations in onboarding page
- [ ] Redirect invited users to `/invite/accept/[id]` instead
- [ ] No org creation for users with pending invites
- [ ] Test: Invited user signs up → lands on dashboard (not onboarding) ✓

**Reference:** `docs/bugs-to-fix/invitation-flow-audit.md` - Bug 2

---

### [ ] BUG-I3: Tender Auto-Close Not Implemented
**Severity:** 🔴 CRITICAL  
**Category:** Business Logic Gap  
**Affected Files:** `apps/tracker/src/server/tenders.ts`

**Description:**  
Tenders with `status = 'open'` and `submissionDate` in the past are not automatically transitioned to `closed`.

**Acceptance Criteria:**
- [ ] Server action/cron job created to query expired `open` tenders
- [ ] Status automatically updated to `closed` when submission date passes
- [ ] Job runs on schedule (hourly or daily)
- [ ] Audit log records auto-close action
- [ ] Manual close available as override

**Reference:** `docs/tenders/prd.md` - Section 4.2 (REQ-003)

---

### [ ] BUG-I4: No Invoice Tracking Module
**Severity:** 🔴 CRITICAL  
**Category:** Feature Gap  
**Affected Files:** `packages/db/src/schema.ts`, Invoice module (missing)

**Description:**  
No invoice table or tracking mechanism. Customer journey ends before payment loop.

**Acceptance Criteria:**
- [ ] `invoice` table created (PO_id, supplier_id, amount, due_date, status)
- [ ] Invoice form to create from PO
- [ ] Invoice list view with status tracking (draft, sent, paid, disputed)
- [ ] Payment tracking UI
- [ ] Outstanding invoices report
- [ ] Dashboard invoice pipeline widget

**Reference:** `docs/customer-journey-audit/overview.md` - Section 1 (Invoices)

---

---

# 🟠 HIGH PRIORITY (Do Next)

## Security & Auth — High Priority

### [ ] BUG-S3: Insecure Settings Overview Route
**Severity:** 🟠 HIGH  
**Files:** `apps/tracker/src/app/(dashboard)/settings/overview/page.tsx`

**Description:**  
Settings overview page renders without `getCurrentUser()` call, missing session validation.

**Acceptance Criteria:**
- [ ] `getCurrentUser()` called at top of server component
- [ ] Redirect to login if session invalid
- [ ] Organization context validated
- [ ] Page only renders for authenticated users

**Reference:** `docs/customer-journey-audit/audit-findings.md` - Phase 1, Section 4

---

## User Flow & Onboarding — High Priority

### [ ] BUG-UF1: Onboarding Force-Creation Trap
**Severity:** 🟠 HIGH  
**Files:** `apps/tracker/src/app/onboarding/page.tsx`

**Description:**  
Invited users bypass invitation flow and are forced to create new organization.

**Acceptance Criteria:**
- [ ] Invitation detection logic added
- [ ] Invited users redirected to invitation acceptance page
- [ ] Option to skip creation and accept existing invitation
- [ ] Flow tested with invite→signup→acceptance path

**Reference:** `docs/customer-journey-audit/audit-findings.md` - Phase 1, Section 1

---

### [ ] BUG-UF2: Broken Organization Switcher
**Severity:** 🟠 HIGH  
**Files:** `apps/tracker/src/components/organization-selector.tsx`

**Description:**  
Organization selector buttons navigate to `/dashboard` without updating active organization in Better Auth.

**Acceptance Criteria:**
- [ ] `authClient.organization.setActive()` called on button click
- [ ] Session updated before navigation
- [ ] Active org state reflects immediately
- [ ] Tested: switch between multiple orgs, verify session ✓
- [ ] Dashboard loads correct org data after switch ✓

**Reference:** `docs/customer-journey-audit/audit-findings.md` - Phase 1, Section 2

---

## Invitation Flow — High Priority

### [ ] BUG-I5: `/api/accept-invitation` Calls Before Checking Session
**Severity:** 🟠 HIGH  
**Files:** `apps/tracker/src/app/api/accept-invitation/[invitationId]/route.ts`

**Description:**  
Always calls `acceptInvitation` first, fails for new users, adds error noise. Should check session first.

**Acceptance Criteria:**
- [ ] Check `auth.api.getSession()` before attempting accept
- [ ] Redirect to `/invite/accept/[id]` if no session (no wasted API call)
- [ ] Reduces error logs
- [ ] New user experience smooth

**Reference:** `docs/bugs-to-fix/invitation-flow-audit.md` - Bug 4

---

### [ ] BUG-I6: Email Verification Required Despite Invitation Proving Ownership
**Severity:** 🟠 HIGH  
**Files:** `apps/tracker/src/app/api/invite/complete-signup/route.ts`

**Description:**  
Manual `emailVerified = true` set after signup, but Better Auth already gated session on verification. Ordering matters.

**Acceptance Criteria:**
- [ ] Set `emailVerified` before session creation
- [ ] OR use transaction to ensure consistency
- [ ] OR configure Better Auth to skip verification for invite-originated signups
- [ ] Test: Invited user signs up → no verification email needed ✓

**Reference:** `docs/bugs-to-fix/invitation-flow-audit.md` - Bug 3

---

## Forms & Input — High Priority

### [ ] BUG-F1: ZAR Currency Formatting & Icons (Wrong Currency Symbol)
**Severity:** 🟠 HIGH  
**Files:**
- `apps/tracker/src/components/tenders/tender-form.tsx` (line ~399)
- `apps/tracker/src/components/purchase-orders/po-form.tsx`

**Description:**  
Currency fields display `$` (Dollar Sign) instead of `R` or `ZAR` for South African context.

**Acceptance Criteria:**
- [ ] Currency icon changed from `<DollarSign />` to `R`
- [ ] Input accepts formatted numbers with commas (1,500,000.00)
- [ ] Value stored numeric, formatted on display
- [ ] PO form includes currency prefix
- [ ] Tender table value columns show ZAR formatting
- [ ] Dashboard aggregates display in ZAR format

**Reference:** `docs/customer-journey-audit/ui-ux-assessment.md` - Section 2.1

---

### [ ] BUG-F2: Tender Extension Form Block (Missing File Input)
**Severity:** 🟠 HIGH  
**Files:** `apps/tracker/src/components/tenders/extension-form.tsx`

**Description:**  
Tender extension form cannot be submitted. Missing or broken file input prevents document uploads.

**Acceptance Criteria:**
- [ ] File input component added/restored
- [ ] Form validation includes file requirement
- [ ] File successfully uploaded and stored
- [ ] Extension record saved with document reference
- [ ] Form submission tested and working ✓

**Reference:** `docs/tenders/prd.md` - Section 4.3

---

### [ ] BUG-F3: Timezone Date Shift in Date Picker
**Severity:** 🟠 HIGH  
**Files:** Tender date pickers, PO delivery date inputs

**Description:**  
Date picker saves dates with timezone shift. "June 10" stored as "June 9" or "June 11".

**Acceptance Criteria:**
- [ ] Date values converted to UTC before storage
- [ ] Client-side picker uses timezone-aware formatting
- [ ] Display converts UTC to local timezone
- [ ] Test: Set date, refresh, verify same date displays ✓
- [ ] No shift across different timezones

**Reference:** `docs/tenders/prd.md` - Section 5 (Timezone Date Safety)

---

## Tender Module — High Priority

### [ ] BUG-T1: Tender Status Enum Not Restricted to 6 Official Statuses
**Severity:** 🟠 HIGH  
**Files:**
- `apps/tracker/src/lib/validations/tender.ts`
- `packages/db/src/schema.ts`

**Description:**  
Tender status schema may include legacy or draft statuses. Should restrict to: `open`, `closed`, `evaluation`, `appointed/awarded`, `rejected/lost`, `cancelled`.

**Acceptance Criteria:**
- [ ] Zod validation schema updated to restrict 6 statuses
- [ ] Status enum in database schema enforced
- [ ] Status badge formatting supports all 6 with proper colors
- [ ] Legacy statuses migrated/cleaned up
- [ ] API rejects invalid status values

**Reference:** `docs/tenders/prd.md` - Section 3

---

### [ ] BUG-T2: Bid Compliance Checklist Not Available
**Severity:** 🟠 HIGH  
**Category:** Workflow Gap  
**Files:** Tender module, Compliance tracking

**Description:**  
No compliance checklist for mandatory bid documents: CSD, B-BBEE, Tax Clearance, MBD forms.

**Acceptance Criteria:**
- [ ] Compliance checklist schema added
- [ ] Tender detail page displays checklist widget
- [ ] Checkboxes for: CSD, B-BBEE, Tax Clearance, MBD, other docs
- [ ] Non-compliant items flagged in dashboard alerts
- [ ] Compliance status included in tender view

**Reference:** `docs/customer-journey-audit/overview.md` - Section 2 (Tender Stage)

---

## Uniqueness Constraints — Phases 2-4

### [ ] BUG-C2: Phase 2 — Client Name Not Org-Scoped (Missing Constraint)
**Severity:** 🟠 HIGH  
**Effort:** 1 day  
**Files:** `packages/db/src/schema.ts`, `apps/tracker/src/server/clients.ts`

**Description:**  
`client.name` has no constraint. Same org can have duplicate client names. Should be org-scoped.

**Tasks:**
- [ ] Add composite unique constraint: `unique('client_organization_id_name_unique').on(organizationId, name)`
- [ ] Check for existing duplicates before migrating
- [ ] Generate and run migration
- [ ] Verify `apps/tracker/src/server/clients.ts` scopes duplicate check to org
- [ ] Test: Org A has "Eskom", Org B can create "Eskom" ✓

**Acceptance Criteria:**
- [ ] Cross-org client name reuse allowed
- [ ] Same-org duplicates blocked
- [ ] No duplicate error on create/update
- [ ] Bulk import unaffected

**Reference:** `docs/bugs-to-fix/phase-2-client-name-uniqueness.md`

---

### [ ] BUG-C3: Phase 3 — Project Number Not Org-Scoped (Missing Constraint)
**Severity:** 🟠 HIGH  
**Effort:** 1 day  
**Files:** `packages/db/src/schema.ts`, `apps/tracker/src/server/projects.ts`

**Description:**  
`project.projectNumber` has no constraint. Same org can have duplicate project numbers. Should be org-scoped.

**Tasks:**
- [ ] Add composite unique constraint: `unique('project_organization_id_project_number_unique').on(organizationId, projectNumber)`
- [ ] Check for existing duplicates before migrating
- [ ] Generate and run migration
- [ ] Verify `apps/tracker/src/server/projects.ts` scopes duplicate check to org
- [ ] Handle tender-to-project conversion gracefully
- [ ] Test: Org A has PRJ-001, Org B can create PRJ-001 ✓

**Acceptance Criteria:**
- [ ] Cross-org project number reuse allowed
- [ ] Same-org duplicates blocked
- [ ] Tender conversion checks for existing project number
- [ ] Meaningful error if duplicate during conversion

**Reference:** `docs/bugs-to-fix/phase-3-project-number-uniqueness.md`

---

### [ ] BUG-C4: Phase 4 — Invitation Duplicate Pending (Missing Partial Index)
**Severity:** 🟠 HIGH  
**Effort:** 2 hours  
**Files:** `packages/db/src/schema.ts` (optional), migration

**Description:**  
`invitation(organizationId, email)` has no unique constraint. Same email can receive duplicate pending invites to same org.

**Tasks:**
- [ ] Check for existing duplicate pending invitations
- [ ] Create partial unique index (recommended): `WHERE status = 'pending'`
- [ ] OR add full composite unique if business allows
- [ ] Update `apps/tracker/src/server/invitations.ts` to check for pending invites
- [ ] Test: Can't send duplicate pending invite to same email in same org ✓

**Acceptance Criteria:**
- [ ] No duplicate pending invites per email per org
- [ ] Can re-invite after expiry
- [ ] Error message clear
- [ ] Duplicate check in application layer

**Reference:** `docs/bugs-to-fix/phase-4-invitation-uniqueness.md`

---

## Project & PO Module — High Priority

### [ ] BUG-P1: Tender-to-Project Transition Missing Contract Parameters
**Severity:** 🟡 MEDIUM  
**Files:**
- `apps/tracker/src/components/tenders/tender-details.tsx`
- `apps/tracker/src/app/(dashboard)/projects/new/page.tsx`

**Description:**  
When tender marked "Appointed/Awarded", project created abruptly without prompting for final contract details.

**Acceptance Criteria:**
- [ ] Pre-project form added to collect: award value, duration, start date, SLA docs
- [ ] Form data flows into project creation
- [ ] Award value can differ from tender estimated value
- [ ] SLA documents attached to project
- [ ] User review step before final project creation

**Reference:** `docs/customer-journey-audit/overview.md` - Section 1 (Transition Stage)

---

### [ ] BUG-P2: PO Missing `deliveredAt` Timestamp
**Severity:** 🟡 MEDIUM  
**Files:**
- `packages/db/src/schema.ts`
- `apps/tracker/src/components/purchase-orders/po-form.tsx`

**Description:**  
Purchase orders lack `deliveredAt` field. Cannot track actual delivery date after completion.

**Acceptance Criteria:**
- [ ] `deliveredAt` timestamp field added
- [ ] PO form includes delivery date picker
- [ ] Field optional (updated after PO issuance)
- [ ] Report shows on-time vs. late deliveries
- [ ] Database migration handles existing records

**Reference:** `docs/customer-journey-audit/overview.md` - Section 1 (PO Stage)

---

## Database & Performance

### [ ] BUG-DB1: Financial Values Stored as Text (Not Numeric)
**Severity:** 🟠 HIGH  
**Files:** `packages/db/src/schema.ts` (tender, purchase_order tables)

**Description:**  
Financial values stored as `text` strings. Requires JS parsing instead of database-native SUM operations.

**Acceptance Criteria:**
- [ ] Tender `value` field changed to `DECIMAL(15,2)`
- [ ] PO `amount` field changed to `DECIMAL(15,2)`
- [ ] Database migration converts existing text values
- [ ] Dashboard queries use native SQL SUM/AVG
- [ ] Performance improvement measured

**Reference:** `docs/customer-journey-audit/overview.md` - Section 1 (Database Performance)

---

---

# 🟡 MEDIUM PRIORITY (Do After)

## Forms & Input — Medium Priority

### [ ] BUG-F4: Mismatched Organization Slug Preview URL
**Severity:** 🟡 MEDIUM  
**Files:** `apps/tracker/src/components/shared/forms/create-organization-form.tsx`

**Description:**  
URL preview shows `/dashboard/settings/organization/[slug]` but actual route is `/dashboard/organization/[slug]`.

**Acceptance Criteria:**
- [ ] URL preview corrected to `/dashboard/organization/{field.value}`
- [ ] Badge displays accurate route
- [ ] Users can navigate to displayed URL
- [ ] Verified on org creation form

**Reference:** `docs/customer-journey-audit/audit-findings.md` - Phase 1, Section 3

---

## Tender Module — Medium Priority

### [ ] BUG-T3: Tender Extension Edit/Delete Not Available
**Severity:** 🟡 MEDIUM  
**Files:** `apps/tracker/src/app/(dashboard)/tenders/[id]/extensions/page.tsx`

**Description:**  
Users cannot edit or delete tender extensions. Mistakes in validity dates are immutable.

**Acceptance Criteria:**
- [ ] Edit button added to extension rows
- [ ] Delete confirmation dialog implemented
- [ ] Edit form pre-populates extension data
- [ ] Update validates and persists changes
- [ ] Delete removes extension
- [ ] Audit log records edit/delete

**Reference:** `docs/customer-journey-audit/overview.md` - Section 1 (Tender Extension Stage)

---

### [ ] BUG-T4: Commented-Out Value Columns in Tender Tables
**Severity:** 🟡 MEDIUM  
**Files:** Tender table components

**Description:**  
Value columns commented out in tender tables. Cannot see tender amounts at a glance.

**Acceptance Criteria:**
- [ ] Value columns uncommented
- [ ] Values formatted as ZAR with currency symbol
- [ ] Responsive: columns hide on mobile if needed
- [ ] Sorting by value works
- [ ] Filtering by value range works

**Reference:** `docs/tenders/prd.md` - Section 4 (REQ-004)

---

### [ ] BUG-T5: Tender Briefing/Clarification Meeting Not Tracked
**Severity:** 🟡 MEDIUM  
**Files:** Tender module database schema, Tender form

**Description:**  
No mechanism to track mandatory briefing/clarification meetings. Often causes disqualification in SA bidding.

**Acceptance Criteria:**
- [ ] `briefingDate` and `briefingAttended` fields added
- [ ] Tender form includes briefing meeting section
- [ ] Calendar widget shows scheduled briefing dates
- [ ] Compliance checklist flags missing briefing attendance
- [ ] Report shows meeting attendance history

**Reference:** `docs/customer-journey-audit/overview.md` - Section 2 (Tender Stage)

---

## Invitation Flow — Medium Priority

### [ ] BUG-I7: Active Org Context Not Switched After Acceptance
**Severity:** 🟠 MEDIUM  
**Files:** `apps/tracker/src/app/api/accept-invitation/[invitationId]/route.ts`

**Description:**  
When existing user accepts invitation, active org context doesn't switch to newly joined org.

**Acceptance Criteria:**
- [ ] After accepting, explicitly set the active organization
- [ ] Get org from invitation record
- [ ] Use `rememberActiveOrganization(invitationId)`
- [ ] User redirected to correct org dashboard ✓

**Reference:** `docs/bugs-to-fix/invitation-flow-audit.md` - Bug 5

---

### [ ] BUG-I8: `resendInvitation` May Not Refresh `expiresAt`
**Severity:** 🟡 LOW  
**Files:** `apps/tracker/src/server/invitations.ts`

**Description:**  
Resend may reuse same token and expiry. If invite expired, resent emails point to expired record.

**Acceptance Criteria:**
- [ ] `resendInvitation` updates `expiresAt` to `now + 7 days`
- [ ] Resets `status` back to `'pending'` if expired
- [ ] Test: Resend after expiry → new email works ✓

**Reference:** `docs/bugs-to-fix/invitation-flow-audit.md` - Bug 6

---

## Project & PO Module — Medium Priority

### [ ] BUG-P3: PO Missing Line Items / Itemization
**Severity:** 🟡 MEDIUM  
**Files:** `packages/db/src/schema.ts`, PO form/detail components

**Description:**  
POs lack itemization. Cannot specify goods/services, quantities, unit prices.

**Acceptance Criteria:**
- [ ] `po_line_item` table created (description, qty, unit_price, subtotal)
- [ ] PO form includes line item input section
- [ ] Total PO calculated from line items
- [ ] Line items display in detail view
- [ ] Edit line items before finalization

**Reference:** `docs/customer-journey-audit/overview.md` - Section 1 (PO Stage)

---

### [ ] BUG-P4: PO Missing Delivery Notes / Proof of Delivery (POD)
**Severity:** 🟡 MEDIUM  
**Files:** `packages/db/src/schema.ts`, PO module

**Description:**  
No formal Delivery Notes or POD (Proof of Delivery) verification.

**Acceptance Criteria:**
- [ ] `po_delivery_note` table created
- [ ] POD form: signed delivery notes, photos, inspection notes
- [ ] Link delivery notes to line items
- [ ] POD status tracks: pending, received, verified
- [ ] Report shows delivery verification rate

**Reference:** `docs/customer-journey-audit/overview.md` - Section 1 (PO Stage)

---

### [ ] BUG-C5: Phase 5 — PO Number Audit & Verification
**Severity:** 🟢 LOW  
**Effort:** 2 hours  
**Files:** 0 (audit only, schema already correct)

**Description:**  
Verify PO number global uniqueness is intentional and application layer matches schema intent.

**Tasks:**
- [ ] Confirm schema: `poNumber` has global `.unique()`
- [ ] Audit `apps/tracker/src/server/purchaseOrders.ts` – duplicate check should NOT scope to org
- [ ] Error message explains global uniqueness
- [ ] Confirm soft-delete behavior (partial index if needed)

**Acceptance Criteria:**
- [ ] Global duplicate (Org A PO-001 blocks Org B PO-001)
- [ ] Error message is clear
- [ ] No org-scoping in duplicate check
- [ ] Soft-delete behavior documented

**Reference:** `docs/bugs-to-fix/phase-5-po-number-audit.md`

---

## UI/UX & Visual

### [ ] BUG-UX1: Inconsistent Dark Mode Transitions
**Severity:** 🟡 MEDIUM  
**Files:** `apps/tracker/src/app/globals.css`, Dashboard components

**Description:**  
Components use explicit `bg-white` instead of theme variables. Creates eye strain in dark mode.

**Acceptance Criteria:**
- [ ] Replace `bg-white` with `bg-background` or theme variable
- [ ] CSS variables for all backgrounds: `--background`, `--card`, `--muted`
- [ ] Dark mode prefers-color-scheme applied consistently
- [ ] All components tested in light and dark ✓
- [ ] No color clashes with theme

**Reference:** `docs/customer-journey-audit/ui-ux-assessment.md` - Section 1.1

---

### [ ] BUG-UX2: Status Badge Visual Inconsistency
**Severity:** 🟡 MEDIUM  
**Files:**
- `apps/tracker/src/components/tenders/tender-details.tsx`
- Tender table list view

**Description:**  
Status badges styled differently across detail view vs. table view.

**Acceptance Criteria:**
- [ ] Create reusable `<StatusBadge status={status} />` component
- [ ] Consistent styling for all 6 tender statuses
- [ ] Color palette: open=green, closed=gray, evaluation=blue, awarded=gold, rejected=red, cancelled=gray
- [ ] Used consistently in detail, table, card views
- [ ] Optional icons for status

**Reference:** `docs/customer-journey-audit/ui-ux-assessment.md` - Section 1.3

---

### [ ] BUG-UX3: Missing Typography Optimization (Font Fallbacks)
**Severity:** 🟡 MEDIUM  
**Files:**
- `apps/tracker/src/app/globals.css`
- `apps/tracker/src/app/layout.tsx`

**Description:**  
Uses generic system font fallbacks (Arial, Courier New) instead of modern web fonts.

**Acceptance Criteria:**
- [ ] Import modern fonts via `next/font` (Geist, Inter, or custom)
- [ ] Apply fonts in layout.tsx
- [ ] Update CSS variables to use imported fonts
- [ ] Test across browsers for consistent rendering ✓
- [ ] No layout shift (CLS impact)

**Reference:** `docs/customer-journey-audit/ui-ux-assessment.md` - Section 1.4

---

### [ ] BUG-UX4: Generic Dashboard Widgets Lack Premium Polish
**Severity:** 🟡 MEDIUM  
**Files:** `apps/tracker/src/components/dashboard/`

**Description:**  
Dashboard widgets are flat. Lack glassmorphic design, rich layouts, dynamic animations.

**Acceptance Criteria:**
- [ ] Apply glassmorphic styles: `backdrop-blur-md bg-card/70`
- [ ] Add entrance animations: `transition-all duration-500`
- [ ] Skeleton loading states while data fetches
- [ ] Rich layout: icons, micro-interactions, rounded borders
- [ ] Responsive: stacks on mobile, grid on desktop
- [ ] Smooth hover effects and state transitions

**Reference:** `docs/customer-journey-audit/ui-ux-assessment.md` - Section 1.2

---

---

# 📋 Verification Checklist (Before Marking Complete)

- [ ] Code review completed for each fix
- [ ] Unit tests written and passing
- [ ] Integration tests confirm cross-module functionality
- [ ] Manual testing on dev environment successful
- [ ] UAT with stakeholders approved
- [ ] Performance benchmarks verified (if applicable)
- [ ] Security audit passed (for security-related fixes)
- [ ] Documentation updated
- [ ] Merged to `dev` branch
- [ ] Deployed to staging for final validation

---

# 🎯 Deployment Phases

## Phase 0: Critical Path (Week 1)
1. ✅ **BUG-C1** — Tender number uniqueness constraint
2. ✅ **BUG-S1** — Cross-tenant access validation
3. ✅ **BUG-S2** — Admin privilege escalation
4. ✅ **BUG-I1 + BUG-I2** — Invitation acceptance & onboarding flow (fixes resend)

## Phase 1: Security & Onboarding (Week 2)
5. ✅ **BUG-S3** — Insecure settings route
6. ✅ **BUG-UF1 + BUG-UF2** — User flow and org switcher
7. ✅ **BUG-I3** — Tender auto-close
8. ✅ **BUG-I5 + BUG-I6** — Invitation edge cases

## Phase 2: Uniqueness Constraints (Week 3)
9. ✅ **BUG-C2** — Client name uniqueness
10. ✅ **BUG-C3** — Project number uniqueness
11. ✅ **BUG-C4** — Invitation pending uniqueness

## Phase 3: Forms & Input (Week 4)
12. ✅ **BUG-F1** — ZAR currency formatting
13. ✅ **BUG-F2** — Tender extension form
14. ✅ **BUG-F3** — Timezone date fixes

## Phase 4: Data & Business Logic (Week 5)
15. ✅ **BUG-DB1** — Financial values to numeric
16. ✅ **BUG-T1 + BUG-T2** — Tender status & compliance
17. ✅ **BUG-I4** — Invoice tracking module

## Phase 5: UX Polish & Remaining (Week 6)
18. ✅ **BUG-UX1 + BUG-UX2 + BUG-UX3 + BUG-UX4** — UI/UX improvements
19. ✅ **BUG-P1 + BUG-P2 + BUG-P3 + BUG-P4** — Project/PO enhancements
20. ✅ **BUG-T3 + BUG-T4 + BUG-T5** — Tender remaining items
21. ✅ **BUG-I7 + BUG-I8 + BUG-C5** — Final polish items

---

# 📊 Summary Statistics

**Total Bugs:** 43  
**Critical:** 8 (⏳)  
**High:** 15 (⏳)  
**Medium:** 19 (⏳)  
**Low:** 1 (⏳)

**Effort Estimate:** 6–8 weeks (full team)

---

**Last Updated:** June 8, 2026 by Copilot  
**Source Files:**
- `docs/customer-journey-audit/` (audit findings)
- `docs/bugs-to-fix/phase-*.md` (uniqueness constraints)
- `docs/tenders/prd.md` (tender requirements)
