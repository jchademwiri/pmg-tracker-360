# PMG Tracker 360: Bug Fix Checklist

**Last Updated:** June 8, 2026  
**Status:** In Progress  
**Total Bugs:** 25

---

## ✅ Security & Authorization

### [ ] BUG-001: Cross-Tenant Access Vulnerability in Server Actions
**Severity:** 🔴 CRITICAL  
**Category:** Security  
**Affected Files:**
- `apps/tracker/src/server/tenders.ts`
- `apps/tracker/src/server/clients.ts`
- `apps/tracker/src/server/projects.ts`
- `apps/tracker/src/server/purchase-orders.ts`
- `apps/tracker/src/server/documents.ts`

**Description:**  
Server actions do not validate if the user is authenticated and belongs to the target organization. Users can access/modify records across organizations by passing raw IDs.

**Acceptance Criteria:**
- [ ] `validateSessionAndOrg()` helper created in `apps/tracker/src/server/utils.ts`
- [ ] All mutation server actions wrapped with session + org validation
- [ ] All query server actions verify user membership before returning data
- [ ] Unit tests confirm cross-tenant access is blocked

**Reference:** `docs/customer-journey-audit/proposed-solutions.md` - Section 1

---

### [ ] BUG-002: Privilege Escalation in Admin Console (`createSystemAdmin`)
**Severity:** 🔴 CRITICAL  
**Category:** Security  
**Affected Files:**
- `apps/admin/src/app/actions.ts` (createSystemAdmin endpoint)

**Description:**  
The `createSystemAdmin` server action is publicly exposed without authentication, allowing anyone to create system admin accounts.

**Acceptance Criteria:**
- [ ] `createSystemAdmin` wrapped with admin role verification
- [ ] Better Auth session check enforced before execution
- [ ] Rate limiting implemented on admin creation endpoint
- [ ] Security audit confirms no unauthorized access possible

**Reference:** `docs/customer-journey-audit/audit-findings.md` - Phase 1, Section 5

---

### [ ] BUG-003: Insecure Settings Overview Route
**Severity:** 🟠 HIGH  
**Category:** Security  
**Affected Files:**
- `apps/tracker/src/app/(dashboard)/settings/overview/page.tsx`

**Description:**  
Settings overview page renders without calling `getCurrentUser()`, missing session validation. Unlike other settings pages, no authentication check is performed.

**Acceptance Criteria:**
- [ ] `getCurrentUser()` called at top of server component
- [ ] Redirect to login if user session invalid
- [ ] Organization context validated
- [ ] Page rendering confirmed only for authenticated users

**Reference:** `docs/customer-journey-audit/audit-findings.md` - Phase 1, Section 4

---

## 🔌 User Flow & Onboarding

### [ ] BUG-004: Onboarding Force-Creation Trap
**Severity:** 🟠 HIGH  
**Category:** User Flow Gap  
**Affected Files:**
- `apps/tracker/src/app/onboarding/page.tsx`

**Description:**  
Users invited to an organization via email should accept the invitation, but instead are forced to create a new organization if they land on the onboarding page.

**Acceptance Criteria:**
- [ ] Invitation detection logic added to onboarding flow
- [ ] Invited users redirected to invitation acceptance page
- [ ] Option to skip creation and accept existing invitation provided
- [ ] Flow tested with invite→signup→acceptance path

**Reference:** `docs/customer-journey-audit/audit-findings.md` - Phase 1, Section 1

---

### [ ] BUG-005: Broken Organization Switcher (Not Updating Active Org)
**Severity:** 🟠 HIGH  
**Category:** Functional Bug  
**Affected Files:**
- `apps/tracker/src/components/organization-selector.tsx`

**Description:**  
Organization selector buttons navigate to `/dashboard` without updating the active organization in Better Auth. Clicking org buttons doesn't change the session's active organization.

**Acceptance Criteria:**
- [ ] `authClient.organization.setActive()` called on button click
- [ ] Session updated before navigation
- [ ] Active org state reflected in UI immediately
- [ ] Tested: switch between multiple orgs and verify session changes
- [ ] Dashboard loads correct org data after switch

**Reference:** `docs/customer-journey-audit/audit-findings.md` - Phase 1, Section 2

---

## 📐 Forms & Input

### [ ] BUG-006: Mismatched Organization Slug Preview URL
**Severity:** 🟡 MEDIUM  
**Category:** UI/UX Bug  
**Affected Files:**
- `apps/tracker/src/components/shared/forms/create-organization-form.tsx` (URL Preview Badge)

**Description:**  
URL preview shows `/dashboard/settings/organization/[slug]` but actual route structure is `/dashboard/organization/[slug]` and `/dashboard/organization/[slug]/settings`.

**Acceptance Criteria:**
- [ ] URL preview corrected to `/dashboard/organization/{field.value}`
- [ ] Badge display updated to show accurate route
- [ ] Users can navigate to the displayed URL
- [ ] Verified on org creation form

**Reference:** `docs/customer-journey-audit/audit-findings.md` - Phase 1, Section 3

---

### [ ] BUG-007: ZAR Currency Formatting & Icons (Wrong Currency Symbol)
**Severity:** 🟠 HIGH  
**Category:** Input Friction / Context Gap  
**Affected Files:**
- `apps/tracker/src/components/tenders/tender-form.tsx` (line ~399)
- `apps/tracker/src/components/purchase-orders/po-form.tsx`

**Description:**  
Currency fields display `$` (Dollar Sign) instead of `R` or `ZAR` for South African context. No currency formatting, commas, or visual prefixes in PO form.

**Acceptance Criteria:**
- [ ] Currency icon changed from `<DollarSign />` to `R` or `<DollarSign variant="zar" />`
- [ ] Input accepts formatted numbers with commas (e.g., `1,500,000.00`)
- [ ] Value stored as numeric, formatted on display
- [ ] PO form includes currency prefix/indicator
- [ ] Tender form value column shows ZAR formatting
- [ ] Dashboard aggregates display in ZAR format with currency symbol

**Reference:** `docs/customer-journey-audit/ui-ux-assessment.md` - Section 2.1

---

### [ ] BUG-008: Tender Extension Form Block (Missing File Input)
**Severity:** 🟠 HIGH  
**Category:** Form Submission Bug  
**Affected Files:**
- `apps/tracker/src/components/tenders/extension-form.tsx`

**Description:**  
Tender extension form is hard-blocked and cannot be submitted. Missing or broken file input prevents users from uploading extension documents.

**Acceptance Criteria:**
- [ ] File input component added/restored to form
- [ ] Form validation includes file upload requirement
- [ ] File successfully uploaded and stored
- [ ] Extension record saved with document reference
- [ ] Form submission tested and confirmed working

**Reference:** `docs/tenders/prd.md` - Section 4.3

---

### [ ] BUG-009: Timezone Date Shift in Date Picker
**Severity:** 🟠 HIGH  
**Category:** Data Integrity Bug  
**Affected Files:**
- Tender date picker components
- Tender validity/extension date selectors
- PO delivery date inputs

**Description:**  
Date picker saves dates with timezone shift, causing dates to be stored incorrectly. User selects date "June 10" but database stores "June 9" or "June 11".

**Acceptance Criteria:**
- [ ] Date values converted to UTC before storage
- [ ] Client-side date picker uses timezone-aware formatting
- [ ] Display converts stored UTC dates to local timezone
- [ ] Tested: set date, refresh page, verify same date displays
- [ ] No shift observed across different timezones

**Reference:** `docs/tenders/prd.md` - Section 5 (Timezone Date Safety)

---

## 📋 Tender Module Issues

### [ ] BUG-010: Tender Extension Edit/Delete Not Available
**Severity:** 🟡 MEDIUM  
**Category:** Feature Gap  
**Affected Files:**
- `apps/tracker/src/app/(dashboard)/tenders/[id]/extensions/page.tsx`
- `apps/tracker/src/server/tenders.ts`

**Description:**  
Users cannot edit or delete tender extensions, leading to immutable errors in validity dates. Mistakes in extension validity cannot be corrected.

**Acceptance Criteria:**
- [ ] Edit button added to extension rows
- [ ] Delete confirmation dialog implemented
- [ ] Edit form pre-populates extension data
- [ ] Update validates and persists changes
- [ ] Delete removes extension from database
- [ ] Audit log records edit/delete actions

**Reference:** `docs/customer-journey-audit/overview.md` - Section 1 (Tender Extension Stage)

---

### [ ] BUG-011: Commented-Out Value Columns in Tender Tables
**Severity:** 🟡 MEDIUM  
**Category:** UI/UX Gap  
**Affected Files:**
- Tender overview/list table components

**Description:**  
Value columns are commented out in tender tables, preventing users from seeing tender amounts at a glance. Must be restored and ZAR-localized.

**Acceptance Criteria:**
- [ ] Value columns uncommented in tender tables
- [ ] Values formatted as ZAR with currency symbol
- [ ] Responsive: columns hide on mobile if needed
- [ ] Sorting by value works
- [ ] Filtering by value range works

**Reference:** `docs/tenders/prd.md` - Section 4 (REQ-004)

---

### [ ] BUG-012: Tender Auto-Close Not Implemented
**Severity:** 🔴 CRITICAL  
**Category:** Business Logic Gap  
**Affected Files:**
- `apps/tracker/src/server/tenders.ts`

**Description:**  
Tenders with `status = 'open'` and `submissionDate` in the past are not automatically transitioned to `closed`. Manual intervention required.

**Acceptance Criteria:**
- [ ] Server action/cron job created to query expired `open` tenders
- [ ] Status automatically updated to `closed` when submission date passes
- [ ] Job runs on schedule (e.g., hourly or daily)
- [ ] Audit log records auto-close action
- [ ] Manual close still available as override

**Reference:** `docs/tenders/prd.md` - Section 4.2 (REQ-003)

---

### [ ] BUG-013: Tender Status Enum Not Restricted to 6 Official Statuses
**Severity:** 🟠 HIGH  
**Category:** Data Consistency  
**Affected Files:**
- `apps/tracker/src/lib/validations/tender.ts`
- `packages/db/src/schema.ts`

**Description:**  
Tender status schema may include legacy or draft statuses. Should be restricted to: `open`, `closed`, `evaluation`, `appointed/awarded`, `rejected/lost`, `cancelled`.

**Acceptance Criteria:**
- [ ] Zod validation schema updated in validations/tender.ts
- [ ] Status enum in database schema enforced
- [ ] Status badge formatting supports all 6 statuses with proper colors
- [ ] Legacy statuses migrated or cleaned up
- [ ] API rejects invalid status values

**Reference:** `docs/tenders/prd.md` - Section 3

---

### [ ] BUG-014: Tender Briefing/Clarification Meeting Not Tracked
**Severity:** 🟡 MEDIUM  
**Category:** Workflow Gap  
**Affected Files:**
- Tender module database schema
- Tender detail form/page

**Description:**  
No mechanism to track mandatory briefing/clarification meetings for tenders. Critical for South African bidding (often causes disqualification if missed).

**Acceptance Criteria:**
- [ ] `briefingDate` and `briefingAttended` fields added to tender schema
- [ ] Tender form includes briefing meeting section
- [ ] Calendar widget shows scheduled briefing dates
- [ ] Compliance checklist flags missing briefing attendance
- [ ] Report shows meeting attendance history

**Reference:** `docs/customer-journey-audit/overview.md` - Section 2 (Tender Stage)

---

### [ ] BUG-015: Bid Compliance Checklist Not Available
**Severity:** 🟠 HIGH  
**Category:** Workflow Gap  
**Affected Files:**
- Tender module
- Compliance tracking

**Description:**  
No compliance checklist for mandatory bid documents: CSD, B-BBEE, Tax Clearance, MBD forms. Major cause of administrative disqualification in SA bidding.

**Acceptance Criteria:**
- [ ] Compliance checklist schema added
- [ ] Tender detail page displays checklist widget
- [ ] Checkboxes for: CSD, B-BBEE, Tax Clearance, MBD forms, other docs
- [ ] Non-compliant items flagged in dashboard alerts
- [ ] Compliance status included in tender status view

**Reference:** `docs/customer-journey-audit/overview.md` - Section 2 (Tender Stage)

---

## 💰 Project & PO Module Issues

### [ ] BUG-016: Tender-to-Project Transition Missing Contract Parameters
**Severity:** 🟡 MEDIUM  
**Category:** Workflow Gap  
**Affected Files:**
- `apps/tracker/src/components/tenders/tender-details.tsx`
- `apps/tracker/src/app/(dashboard)/projects/new/page.tsx`

**Description:**  
When tender is marked "Appointed/Awarded", project is created abruptly without prompting for final contract details like actual award value, duration, SLA documents.

**Acceptance Criteria:**
- [ ] Pre-project form added: collect award value, duration, start date, SLA docs
- [ ] Form data flows into project creation
- [ ] Award value can differ from tender estimated value
- [ ] SLA documents attached to project
- [ ] User review step before final project creation

**Reference:** `docs/customer-journey-audit/overview.md` - Section 1 (Transition Stage)

---

### [ ] BUG-017: PO Missing `deliveredAt` Timestamp
**Severity:** 🟡 MEDIUM  
**Category:** Data Schema Gap  
**Affected Files:**
- `packages/db/src/schema.ts` (purchase_order table)
- `apps/tracker/src/components/purchase-orders/po-form.tsx`

**Description:**  
Purchase orders lack `deliveredAt` field, preventing retroactive delivery logs. Cannot track actual delivery date after completion.

**Acceptance Criteria:**
- [ ] `deliveredAt` timestamp field added to purchase_order schema
- [ ] PO form includes delivery date picker
- [ ] Optional field: can be updated after PO issuance
- [ ] Report shows on-time vs. late deliveries
- [ ] Database migration handles existing records

**Reference:** `docs/customer-journey-audit/overview.md` - Section 1 (PO Stage)

---

### [ ] BUG-018: PO Missing Line Items / Itemization
**Severity:** 🟡 MEDIUM  
**Category:** Feature Gap  
**Affected Files:**
- `packages/db/src/schema.ts`
- PO form and detail components

**Description:**  
POs lack itemization (line items). Cannot specify what goods/services are included, quantities, unit prices. All-or-nothing approach.

**Acceptance Criteria:**
- [ ] `po_line_item` table created (description, qty, unit_price, subtotal)
- [ ] PO form includes line item input section
- [ ] Total PO amount calculated from line items
- [ ] Line items display in PO detail view
- [ ] Edit line items before PO finalization

**Reference:** `docs/customer-journey-audit/overview.md` - Section 1 (PO Stage)

---

### [ ] BUG-019: PO Missing Delivery Notes / Proof of Delivery (POD)
**Severity:** 🟡 MEDIUM  
**Category:** Feature Gap  
**Affected Files:**
- `packages/db/src/schema.ts`
- PO module

**Description:**  
No formal Delivery Notes or POD (Proof of Delivery) verification. Cannot confirm goods/services received match PO line items.

**Acceptance Criteria:**
- [ ] `po_delivery_note` table created
- [ ] POD form: capture signed delivery notes, photos, inspection notes
- [ ] Link delivery notes to line items
- [ ] POD status tracks: pending, received, verified
- [ ] Report shows delivery verification rate

**Reference:** `docs/customer-journey-audit/overview.md` - Section 1 (PO Stage)

---

### [ ] BUG-020: No Invoice Tracking Module
**Severity:** 🔴 CRITICAL  
**Category:** Feature Gap  
**Affected Files:**
- `packages/db/src/schema.ts`
- Invoice module (missing)

**Description:**  
No invoice table or tracking mechanism. Customer journey ends before payment loop. Cannot track invoices, payments, disputes.

**Acceptance Criteria:**
- [ ] `invoice` table created (PO_id, supplier_id, amount, due_date, status)
- [ ] Invoice form to create invoice from PO
- [ ] Invoice list view with status (draft, sent, paid, disputed)
- [ ] Payment tracking: amount paid, payment date
- [ ] Outstanding invoices report
- [ ] Dashboard widget showing invoice pipeline

**Reference:** `docs/customer-journey-audit/overview.md` - Section 1 (Invoices)

---

## 💾 Database & Performance Issues

### [ ] BUG-021: Financial Values Stored as Text (Not Numeric)
**Severity:** 🟠 HIGH  
**Category:** Performance/Data Integrity  
**Affected Files:**
- `packages/db/src/schema.ts` (tender, purchase_order tables)

**Description:**  
Financial values stored as `text` strings instead of numeric types. Requires memory-heavy JS parsing for dashboard aggregates instead of database-native SUM operations.

**Acceptance Criteria:**
- [ ] Tender `value` field changed to `DECIMAL(15,2)`
- [ ] PO `amount` field changed to `DECIMAL(15,2)`
- [ ] Database migration converts existing text values
- [ ] Dashboard queries use native SQL SUM/AVG functions
- [ ] Performance improvement measured and documented

**Reference:** `docs/customer-journey-audit/overview.md` - Section 1 (Database Performance Risks)

---

## 🎨 UI/UX & Visual Consistency

### [ ] BUG-022: Inconsistent Dark Mode Transitions
**Severity:** 🟡 MEDIUM  
**Category:** Visual Bug  
**Affected Files:**
- `apps/tracker/src/app/globals.css`
- Dashboard components

**Description:**  
Components use explicit `bg-white` classes instead of theme-aware variables. Creates eye strain when dark mode active as some cards stay white while rest darkens.

**Acceptance Criteria:**
- [ ] Search and replace `bg-white` with `bg-background` or theme variable
- [ ] CSS variables for all background colors: `--background`, `--card`, `--muted`
- [ ] Dark mode prefers-color-scheme applied consistently
- [ ] All components tested in light and dark modes
- [ ] No explicit colors clash with theme

**Reference:** `docs/customer-journey-audit/ui-ux-assessment.md` - Section 1.1

---

### [ ] BUG-023: Status Badge Visual Inconsistency
**Severity:** 🟡 MEDIUM  
**Category:** UI Inconsistency  
**Affected Files:**
- `apps/tracker/src/components/tenders/tender-details.tsx`
- Tender table list view components

**Description:**  
Status badges styled differently across detail view vs. table view. Detail view uses custom borders/colors, table view uses different styling. Lacks visual cohesion.

**Acceptance Criteria:**
- [ ] Create reusable `<StatusBadge status={status} />` component
- [ ] Consistent styling for all 6 tender statuses
- [ ] Color palette: open=green, closed=gray, evaluation=blue, awarded=gold, rejected=red, cancelled=gray
- [ ] Used consistently in detail, table, and card views
- [ ] Icons for status (optional but recommended)

**Reference:** `docs/customer-journey-audit/ui-ux-assessment.md` - Section 1.3

---

### [ ] BUG-024: Missing Typography Optimization (Font Fallbacks)
**Severity:** 🟡 MEDIUM  
**Category:** Visual Polish  
**Affected Files:**
- `apps/tracker/src/app/globals.css`
- `apps/tracker/src/app/layout.tsx`

**Description:**  
Font configuration uses generic system font fallbacks (Arial, Courier New) instead of modern web fonts. Application lacks premium, professional polish.

**Acceptance Criteria:**
- [ ] Import modern fonts via Next.js `next/font` (Geist, Inter, or custom)
- [ ] Apply fonts in layout.tsx
- [ ] Update CSS variables to use imported fonts
- [ ] Test across browsers for consistent rendering
- [ ] Performance: verify no layout shift (CLS impact)

**Reference:** `docs/customer-journey-audit/ui-ux-assessment.md` - Section 1.4

---

### [ ] BUG-025: Generic Dashboard Widgets Lack Premium Polish
**Severity:** 🟡 MEDIUM  
**Category:** Visual Enhancement  
**Affected Files:**
- `apps/tracker/src/components/dashboard/`
- Dashboard page components

**Description:**  
Dashboard widgets are flat cards with basic text. Lack glassmorphic design, rich layouts, dynamic animations for load states. Should feel premium.

**Acceptance Criteria:**
- [ ] Apply glassmorphic styles: `backdrop-blur-md bg-card/70`
- [ ] Add entrance animations with tailwind `transition-all duration-500`
- [ ] Skeleton loading states while data fetches
- [ ] Rich layout: icons, micro-interactions, rounded borders
- [ ] Responsive: stacks on mobile, grid on desktop
- [ ] Hover effects and state transitions smooth

**Reference:** `docs/customer-journey-audit/ui-ux-assessment.md` - Section 1.2

---

## 📋 Verification Checklist

Use this section to track final verification of all fixes:

### Before Marking Complete:
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

## Summary Statistics

| Category | Count | Status |
|----------|-------|--------|
| Security & Authorization | 3 | ⏳ |
| User Flow & Onboarding | 3 | ⏳ |
| Forms & Input | 4 | ⏳ |
| Tender Module | 5 | ⏳ |
| Project & PO Module | 6 | ⏳ |
| Database & Performance | 1 | ⏳ |
| UI/UX & Visual | 4 | ⏳ |
| **TOTAL** | **25** | ⏳ |

---

## Prioritization Guide

### 🔴 Critical (Do First)
- BUG-001: Cross-Tenant Access Vulnerability
- BUG-002: Admin Privilege Escalation
- BUG-012: Tender Auto-Close
- BUG-020: Invoice Tracking Module

### 🟠 High (Do Next)
- BUG-003, BUG-004, BUG-005, BUG-007, BUG-008, BUG-009, BUG-013, BUG-015, BUG-021

### 🟡 Medium (Do After)
- BUG-006, BUG-010, BUG-011, BUG-014, BUG-016, BUG-017, BUG-018, BUG-019, BUG-022, BUG-023, BUG-024, BUG-025

---

**Last Updated By:** Copilot  
**Next Review Date:** TBD
