# Implementation Plan: Dashboard Module

This document outlines the step-by-step technical implementation plan to build the role-based dashboard view switcher, integrate customized metrics widgets for Admins and Specialists, and fix localization formats.

---

## Phase 1: Layout Switcher & Role Detection

### Objectives:
- Detect user role in the server-side Page component.
- Switch layout components based on the active role.

### Tasks:
1. **Create Sub-components**:
   * Create [apps/tracker/src/components/dashboard/admin-view.tsx](file:///D:/websites/pmg-tracker-360/apps/tracker/src/components/dashboard/admin-view.tsx) for Tender Admins.
   * Create [apps/tracker/src/components/dashboard/specialist-view.tsx](file:///D:/websites/pmg-tracker-360/apps/tracker/src/components/dashboard/specialist-view.tsx) for Tender Specialists.
2. **Refactor Page Component** ([apps/tracker/src/app/(dashboard)/dashboard/page.tsx](file:///D:/websites/pmg-tracker-360/apps/tracker/src/app/(dashboard)/dashboard/page.tsx)):
   * Check membership role via `getCurrentUser()` or a direct membership table query.
   * Render either `<AdminDashboardView />` or `<SpecialistDashboardView />` depending on the role.

---

## Phase 2: Build Tender Admin View

### Objectives:
- Implement executive pipeline statistics.
- Build the financial conversion funnel widget.
- Build the quick navigation hub.

### Tasks:
1. **Aggregates & Calculations**:
   * Create database query functions in [apps/tracker/src/server/dashboard.ts](file:///D:/websites/pmg-tracker-360/apps/tracker/src/server/dashboard.ts) to calculate pipeline values (formatted in ZAR) and win rates.
2. **funnel Widget**:
   * Create `<FunnelChart />` using Recharts to visualize value levels: `Open ➔ Evaluation ➔ Appointed/Awarded`.
3. **Quick Navigation Hub**:
   * Implement grid UI linking to Member Settings, Billing/Invoices, and Reports.

---

## Phase 3: Build Tender Specialist View

### Objectives:
- Implement specialist KPIs (Open opportunities, Evaluations).
- Build the compliance checklist widget.
- Build the calendar closing date widget.

### Tasks:
1. **Compliance Checklist**:
   * Create a UI widget that queries the database for compliance status indicators of active tenders, prompting the user for CSD, B-BBEE, and Tax PIN certificates.
2. **Calendar Widget**:
   * Render a lightweight interactive calendar showing upcoming closing dates for `open` tenders.
3. **Validity Warnings**:
   * Query tenders with upcoming validity expiry dates and display highlight alerts.

---

## Phase 4: Localization & Style Polish

### Objectives:
- Ensure all dates use local timezone conversions.
- Localize all currency displays to South African Rands (ZAR, `R`).
- Apply animations and glassmorphic designs.

### Tasks:
1. **Currency Helper**:
   * Wrap currency fields with the ZAR formatter utility.
2. **Glassmorphism & CSS Animations**:
   * Apply `backdrop-blur-md bg-card/70` styles and animate entrance fades using tailwind transition utilities.

---

## Phase 5: Verification & Accessibility

### Tasks:
1. **Role Access Testing**:
   * Mock users with `admin` and `member` roles to verify appropriate layout rendering.
2. **Accessibility Audit**:
   * Confirm the skip navigation link correctly focuses the dashboard main container `#main-content`.
