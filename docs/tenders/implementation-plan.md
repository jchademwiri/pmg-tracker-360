# Implementation Plan: Tenders Module

This document outlines the step-by-step technical implementation plan to align the tenders status lifecycle, implement the auto-close expiry rule, fix the extension upload block, restore table columns, and resolve timezone offsets.

---

## Phase 1: Status Lifecycle Configuration

### Objectives:
- Update validations and enums to support the 6-status lifecycle.
- Remove legacy "draft" filters and defaults.

### Tasks:
1. **Update Zod Validation Schemas** ([validations/tender.ts](file:///D:/websites/pmg-tracker-360/apps/tracker/src/lib/validations/tender.ts)):
   * Add `cancelled` to the status enum check: `['open', 'closed', 'evaluation', 'awarded', 'lost', 'cancelled']` (note: `appointed/awarded` corresponds to the database value `awarded` or `appointed`).
2. **Remove Draft Defaults**:
   * Refactor [tenders/page.tsx](file:///D:/websites/pmg-tracker-360/apps/tracker/src/app/(dashboard)/tenders/page.tsx) to query initial tenders using `open` status instead of `draft`.
   * Update the default status state inside [tender-list.tsx](file:///D:/websites/pmg-tracker-360/apps/tracker/src/components/tenders/tender-list.tsx) to load active statuses.
3. **Status Badges UI**:
   * Update UI component maps in `<TenderList />`, `<TendersTable />`, and `<TenderDetails />` to include styling definitions for `cancelled` and ensure correct color tags.

---

## Phase 2: Core UX Bug Fixes

### Objectives:
- Fix the extension upload blocker.
- Wire the table delete button callback.
- Restore commented-out columns.

### Tasks:
1. **Extension Upload Fix** ([extension-form.tsx](file:///D:/websites/pmg-tracker-360/apps/tracker/src/components/tenders/extension-form.tsx)):
   * Introduce a standard `<Input type="file" name="file" />` element inside the file upload form wrapper section.
   * Ensure it maps to the form ref hook, resolving the silent missing file blocker.
2. **Restore Columns** ([tenders-table.tsx](file:///D:/websites/pmg-tracker-360/apps/tracker/src/components/tenders/tenders-table.tsx)):
   * Un-comment the `TableHead` and `TableCell` tags for the `Value` field.
   * Wrap the output with the `formatCurrency` utility.
3. **Overview Delete Action**:
   * Map `handleDeleteTender` in `TendersOverviewClient` to trigger the `deleteTender` server action and trigger a route transition refresh.

---

## Phase 3: Localization & Expiry Rules

### Objectives:
- Fix currency prefixes.
- Prevent timezone day shifts.
- Implement server-side auto-closing of expired tenders.

### Tasks:
1. **ZAR Localization**:
   * Replace the `<DollarSign />` icon with an `R` prefix badge in [tender-form.tsx](file:///D:/websites/pmg-tracker-360/apps/tracker/src/components/tenders/tender-form.tsx).
   * Localize the overview page metric card templates.
2. **Local Date Timezone Adjustment**:
   * Create a timezone-safe formatter helper that adjusts date strings using South African standard timezone offset values prior to displaying them in input elements.
3. **Auto-Close Expiry Script**:
   * Implement a database helper query that runs as part of the loading phase or a cron schedule, updating expired `open` tenders to `closed`.

---

## Phase 4: Integration & Testing

### Tasks:
1. **Validator Testing**:
   * Try saving tenders with both legacy values and the new `cancelled` status to check validations.
2. **Auto-Close Task Testing**:
   * Set a tender due date to yesterday, refresh the dashboard, and verify that the status changes to `closed` in both the DB and UI.
3. **Extension Upload Testing**:
   * Add a mock extension letter and verify that the validity dates update successfully.
