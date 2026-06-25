# PDF Report Generator Implementation Plan

Status: Draft  
Owner: PMG Tracker 360  
Created: 2026-06-25

## 1. Purpose

This document converts the PDF report generator feature into an implementation sequence. It defines the recommended phases, tasks, order of work, validation points, and expected deliverables before merging the feature.

## 2. Implementation Strategy

Build the feature in small, controlled phases:

1. Create shared PDF foundation.
2. Implement one simple Tracker report.
3. Add more Tracker reports.
4. Add Admin reports.
5. Improve UI/report discovery.
6. Add tests and hardening.
7. Prepare future enhancements.

The first working report should be the Tender Register Report because it is table-based and uses data that already exists in the tracker app.

## 3. Phase 0: Preparation

### Tasks

- Review existing `pmg-hub` PDF generation files.
- Confirm whether `pmg-tracker-360` should use `jsPDF` as the first PDF engine.
- Confirm package location: recommended `packages/reports`.
- Confirm whether report routes will live in both apps or only tracker first.
- Confirm naming conventions for report types and filenames.

### Deliverables

- Approved PRD.
- Approved technical design.
- Approved report catalogue.
- Approved data mapping.

## 4. Phase 1: Shared Report Package

### Goal

Create a reusable PDF report foundation that both apps can consume.

### Tasks

- Create package folder:

```txt
packages/reports/
```

- Add package files:

```txt
packages/reports/package.json
packages/reports/src/index.ts
packages/reports/src/core/pdf-types.ts
packages/reports/src/core/pdf-engine.ts
packages/reports/src/core/pdf-layout.ts
packages/reports/src/core/pdf-table.ts
packages/reports/src/core/pdf-formatters.ts
```

- Add dependency:

```txt
bun add jspdf --filter @pmg/reports
```

- Export core functions:

```ts
export function renderReportPdf(data: ReportPdfData): Buffer;
export function sanitizePdfFileName(input: string): string;
export function formatCurrency(value: unknown): string;
export function formatDate(value: unknown): string;
```

- Implement base layout:
  - A4 portrait.
  - Standard margins.
  - Header.
  - Footer.
  - Page numbers.
  - Summary cards.
  - Key-value sections.
  - Table sections.
  - Empty table rows.

### Acceptance Criteria

- Package builds successfully.
- `renderReportPdf()` can generate a test PDF buffer.
- Long text wraps correctly.
- Tables paginate to a second page.

## 5. Phase 2: Tracker API Route Foundation

### Goal

Create a secure API route for tracker report downloads.

### Tasks

- Create route:

```txt
apps/tracker/src/app/api/reports/[type]/route.ts
```

- Define supported report types:

```ts
const TRACKER_REPORT_TYPES = new Set([
  'tender-register',
  'purchase-order-detail',
  'project-status',
]);
```

- Validate:
  - Session exists.
  - `organizationId` exists or can be resolved from active organization.
  - User belongs to organization.
  - Report type is supported.
  - Required report-specific parameters exist.

- Return PDF response:

```ts
return new NextResponse(new Uint8Array(result.buffer), {
  headers: {
    'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename="${result.fileName}"`,
    'Cache-Control': 'no-store',
  },
});
```

### Acceptance Criteria

- Unauthenticated request returns `401`.
- Unauthorized organization access returns `403`.
- Unsupported type returns `400`.
- Valid request returns `application/pdf`.

## 6. Phase 3: Tender Register Report

### Goal

Implement the first MVP tracker report.

### Tasks

- Create data builder:

```txt
apps/tracker/src/server/report-data/tender-register-data.ts
```

- Create report builder:

```txt
packages/reports/src/tracker/tender-register-report.ts
```

- Reuse or adapt existing tender query logic.
- Support filters:
  - `organizationId`
  - `status`
  - `clientId`
  - `priority`
  - `search`
  - `submissionDateFrom`
  - `submissionDateTo`

- Include summary cards:
  - Total tenders
  - Open tenders
  - Awarded tenders
  - Lost tenders
  - Awaiting results
  - Pipeline value
  - Total won value

- Include table columns:
  - Tender number
  - Client
  - Description
  - Status
  - Priority
  - Submission date
  - Estimated value
  - Award value

### Acceptance Criteria

- Report downloads from API.
- Empty result still generates a valid PDF.
- Report respects organization access.
- Currency and dates are formatted correctly.
- Long tender descriptions wrap correctly.

## 7. Phase 4: Tracker UI Integration

### Goal

Make report downloading accessible from the UI.

### Tasks

- Add reusable client button:

```txt
apps/tracker/src/components/reports/export-pdf-button.tsx
```

- Add report cards/actions to:

```txt
apps/tracker/src/app/(dashboard)/reports/page.tsx
```

- Add contextual download buttons where useful:
  - Tender register page.
  - Project detail page.
  - Purchase order detail page.

- Include loading state and error toast.

### Acceptance Criteria

- User can click a button and download a PDF.
- Button shows loading state.
- Failed download shows a clear error.
- UI uses existing design system/components.

## 8. Phase 5: Purchase Order Detail Report

### Goal

Generate a formal PDF for a single purchase order.

### Tasks

- Create data builder:

```txt
apps/tracker/src/server/report-data/purchase-order-detail-data.ts
```

- Create report builder:

```txt
packages/reports/src/tracker/purchase-order-detail-report.ts
```

- Reuse `getPurchaseOrderById` or similar existing server function.
- Include:
  - PO summary.
  - Project/client details.
  - Supplier details.
  - Line items.
  - Delivery notes.
  - Delivery status calculations.
  - Totals.

### Acceptance Criteria

- Requires `purchaseOrderId`.
- Returns `404` for missing PO.
- Does not expose PO from another organization.
- Displays ordered, delivered, and outstanding quantities.
- Handles POs with no delivery notes.

## 9. Phase 6: Project Status Report

### Goal

Generate a management-ready project status report.

### Tasks

- Create data builder:

```txt
apps/tracker/src/server/report-data/project-status-data.ts
```

- Create report builder:

```txt
packages/reports/src/tracker/project-status-report.ts
```

- Include:
  - Project summary.
  - Contract details.
  - Linked tender details.
  - PO summary.
  - Delivery status.
  - Risks.
  - Activities.
  - Close-out fields, if available.

### Acceptance Criteria

- Requires `projectId`.
- Returns `404` for missing project.
- Does not expose project from another organization.
- Handles no risks and no activities gracefully.

## 10. Phase 7: Admin Report Route Foundation

### Goal

Allow platform admins to download platform-level reports.

### Tasks

- Create route:

```txt
apps/admin/src/app/api/reports/[type]/route.ts
```

- Define supported report types:

```ts
const ADMIN_REPORT_TYPES = new Set([
  'platform-overview',
  'organization-usage',
]);
```

- Validate:
  - Session exists.
  - User is admin.
  - Report type is supported.

### Acceptance Criteria

- Non-admin users receive `403`.
- Admin users can download PDFs.
- Invalid type returns `400`.

## 11. Phase 8: Admin Platform Overview Report

### Goal

Generate the first admin-level operational report.

### Tasks

- Reuse existing admin dashboard metrics query.
- Create data builder:

```txt
apps/admin/src/server/report-data/platform-overview-data.ts
```

- Create report builder:

```txt
packages/reports/src/admin/platform-overview-report.ts
```

- Include:
  - User metrics.
  - Organization metrics.
  - Tender/project metrics.
  - Sessions/security metrics.
  - Support ticket metrics.
  - Waitlist metrics.
  - Plan distribution.
  - Tender status distribution.

### Acceptance Criteria

- Report contains the same key figures as the admin dashboard.
- Report can be downloaded only by admin users.
- Missing optional metrics do not fail PDF generation.

## 12. Phase 9: Organization Usage Report

### Goal

Generate a report that shows usage per organization.

### Tasks

- Reuse organization count queries where possible.
- Create data builder:

```txt
apps/admin/src/server/report-data/organization-usage-data.ts
```

- Create report builder:

```txt
packages/reports/src/admin/organization-usage-report.ts
```

- Include:
  - Organization name.
  - Plan/status.
  - Member count.
  - Tender count.
  - Project count.
  - Purchase order count.
  - Created date.

### Acceptance Criteria

- Supports all organizations.
- Optionally supports single organization filter.
- Paginated PDF works for many organizations.

## 13. Phase 10: Testing and Hardening

### Tasks

- Add unit tests for:
  - Filename sanitisation.
  - Currency/date formatters.
  - Empty table rendering.
  - Data mapping calculations.

- Add route tests/manual checks for:
  - Unauthorized access.
  - Unsupported report type.
  - Missing record.
  - Empty dataset.
  - Long table.

- Manual QA:
  - Download on Chrome/Edge.
  - Check page breaks.
  - Check text wrapping.
  - Check mobile UI button behaviour.
  - Check production build.

### Acceptance Criteria

- `bun run check-types` passes.
- `bun run lint` passes.
- Reports work in local dev.
- Reports work after production build.

## 14. Suggested Branch and Commit Strategy

Recommended branch:

```txt
feature/pdf-report-generator
```

Suggested commits:

```txt
docs: add pdf report generator planning docs
feat(reports): add shared pdf report package
feat(tracker): add tender register pdf report
feat(tracker): add report download UI
feat(tracker): add purchase order detail pdf report
feat(tracker): add project status pdf report
feat(admin): add platform overview pdf report
feat(admin): add organization usage pdf report
test(reports): add pdf helper tests
```

## 15. Implementation Checklist

```txt
[ ] Create packages/reports
[ ] Add jsPDF dependency
[ ] Implement shared report types
[ ] Implement PDF layout helpers
[ ] Implement table renderer with pagination
[ ] Implement filename sanitisation
[ ] Implement tracker report API route
[ ] Implement Tender Register data builder
[ ] Implement Tender Register PDF builder
[ ] Add tracker export button
[ ] Add report card on /reports
[ ] Implement PO Detail report
[ ] Implement Project Status report
[ ] Implement admin report API route
[ ] Implement Platform Overview report
[ ] Implement Organization Usage report
[ ] Add tests
[ ] Run type checks
[ ] Run lint
[ ] Manual QA
```

## 16. Future Phases

After MVP:

- Email report delivery.
- Scheduled reports.
- Excel export.
- Report preview pages.
- Saved report filters.
- User-selectable columns.
- Chart rendering.
- Audit log for report downloads.
- Batch report exports.
