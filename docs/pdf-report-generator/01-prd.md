# PDF Report Generator PRD

Status: Draft  
Owner: PMG Tracker 360  
Created: 2026-06-25

## 1. Purpose

Create a reusable PDF report generation feature for the PMG Tracker 360 monorepo. The feature must support both the Tracker app and the Admin app, allowing users to download structured, professional PDF reports from existing tender, project, purchase order, delivery, organization, user, support, and platform data.

The first implementation should prioritise server-side PDF generation so that PDFs are consistent, secure, downloadable, and not dependent on browser screenshots.

## 2. Background

The `pmg-hub` monorepo already contains a working PDF generation pattern for billing documents. It uses `jsPDF` server-side to generate invoices, quotations, receipts, and statements. That pattern can be adapted into a shared report generator for PMG Tracker 360.

The PMG Tracker 360 monorepo has two main applications that need reporting:

- `apps/tracker`: tenant-facing tender, project, purchase order, delivery, client, and document reporting.
- `apps/admin`: platform-level reporting for users, organizations, support, sessions, security, subscriptions/plans, waitlist, and usage.

## 3. Problem Statement

Users currently have operational data inside the system, but they need a professional way to export that data for management review, internal reporting, tender administration, project tracking, supplier follow-up, client communication, and compliance records.

Without a formal report generator, users may rely on manual screenshots, copied tables, Excel exports, or ad hoc documents. This creates inconsistency, weak auditability, and duplicated work.

## 4. Goals

- Provide a standard PDF generation engine shared by Tracker and Admin.
- Generate professional A4 PDF reports with consistent branding, titles, filters, metadata, tables, totals, and footers.
- Support secure report downloads through authenticated API routes.
- Start with a focused MVP and extend report coverage over time.
- Reuse ideas from `pmg-hub` PDF generation where practical.
- Keep report data fetching inside each app/server layer and keep PDF rendering reusable.

## 5. Non-Goals

- Do not build a full BI/dashboard engine in the first phase.
- Do not build user-designed custom report templates in the first phase.
- Do not add scheduled report emailing in the MVP.
- Do not replace existing dashboard pages.
- Do not build Excel export as part of the initial PDF work unless required later.
- Do not generate PDFs from client-side screenshots as the primary approach.

## 6. Users

### Tracker Users

- Tender administrators
- Project managers
- Procurement officers
- Contractors/business owners
- Organization members with report access

### Admin Users

- Platform administrators
- Support/admin staff
- System owners

## 7. Primary Use Cases

### Tracker App

- Download a Tender Register PDF for internal tender tracking.
- Download a Tender Pipeline PDF showing active, closing soon, awarded, lost, and pending tenders.
- Download a Project Status PDF for management review.
- Download a Purchase Order Detail PDF for supplier/project records.
- Download Delivery Status PDFs to track delivered, partially delivered, and outstanding items.
- Download risk, activity, client, and document reports for audit and operational follow-up.

### Admin App

- Download a Platform Overview PDF summarising users, organizations, tenders, projects, sessions, support tickets, feedback, and waitlist.
- Download an Organization Usage PDF showing member, tender, project, and PO counts.
- Download User Register, Support Tickets, Feedback, Sessions, and Security reports.

## 8. MVP Scope

The MVP should include the shared PDF foundation plus the first high-value reports.

### Shared Foundation

- Shared report package or shared server library.
- PDF layout helpers.
- Header/footer rendering.
- Table rendering with pagination.
- Basic filter metadata display.
- File naming and sanitisation.
- Server route response with `application/pdf`.
- Auth and organization access validation.

### Tracker MVP Reports

1. Tender Register Report
2. Purchase Order Detail Report
3. Project Status Report

### Admin MVP Reports

1. Platform Overview Report
2. Organization Usage Report

## 9. Functional Requirements

### FR-001: Generate PDF on Demand

Users must be able to click a report action and download a PDF generated from current server data.

### FR-002: Use Server-Side Generation

The system must generate formal reports server-side and return them through API routes. Client-side screenshot export may exist as a secondary fallback only.

### FR-003: Support Filters

Reports must support relevant filters such as status, date range, client, project, supplier, and organization.

### FR-004: Show Report Metadata

Each PDF must include report title, generated date, organization/platform context, selected filters, and page numbers.

### FR-005: Use Consistent Branding

Reports must use a consistent A4 layout, typography, spacing, table style, and footer.

### FR-006: Respect Permissions

Tracker reports must validate user session and organization membership. Admin reports must validate admin-level access.

### FR-007: Handle Empty Data

Reports must generate gracefully when no records match the selected filters. They should show a clear empty-state message instead of failing.

### FR-008: Support Long Tables

The PDF engine must paginate tables without cutting off rows incorrectly.

### FR-009: Generate Safe File Names

Downloaded PDFs must use predictable, sanitized filenames.

Example:

```txt
Tender-Register-2026-06-25.pdf
PO-Detail-PO-12345.pdf
Project-Status-STP-001.pdf
Platform-Overview-2026-06-25.pdf
```

## 10. Non-Functional Requirements

### Security

- No unauthenticated PDF downloads.
- No cross-organization data leakage.
- No admin reports accessible to normal tenant users.
- Avoid exposing raw database errors to the browser.

### Performance

- MVP reports should generate within an acceptable response time for normal data volumes.
- Large reports should have practical limits, filters, or pagination strategy.
- Avoid loading unnecessary records.

### Maintainability

- Report rendering helpers must be reusable.
- Report data builders must be separated from PDF layout functions.
- Avoid duplicating PDF code separately in tracker and admin.

### Reliability

- Missing optional fields should not crash generation.
- PDF generation errors should return useful server logs and safe client messages.

## 11. Success Criteria

The feature is successful when:

- A user can download the first Tracker PDF report from the UI.
- The PDF uses live server data, not a screenshot.
- The report respects organization access.
- The PDF has a professional layout and readable tables.
- The same report engine can be reused by Admin reports.
- At least one Admin PDF report is generated using the same foundation.

## 12. Acceptance Criteria

- `packages/reports` or equivalent shared report module exists.
- At least three Tracker reports are implemented.
- At least one Admin report is implemented.
- API routes return `Content-Type: application/pdf`.
- API routes return `Content-Disposition: attachment`.
- Unauthorized users receive `401` or `403`.
- Invalid report types receive `400`.
- Missing records receive `404` where applicable.
- Empty datasets generate valid PDFs with empty-state messaging.
- Long tables paginate correctly.

## 13. Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Long reports become too large | Slow downloads and poor UX | Add filters, limits, and summary reports |
| PDF layout becomes duplicated | Hard maintenance | Centralize helpers in shared package |
| Cross-organization access bug | Serious data leak | Validate session and organization before fetching data |
| jsPDF layout becomes complex | Harder to maintain | Keep report layouts simple and table-driven |
| Admin and tracker needs diverge | Inconsistent reports | Use shared core with app-specific data builders |

## 14. Open Questions

- Should reports support preview before download, or only direct download?
- Should reports support email delivery in phase 2?
- Should the PDF engine live in `packages/reports` or inside a shared app library first?
- Should very large reports be limited by default date ranges?
- Should users be able to choose columns later?
- Should Excel export be added as a separate follow-up feature?
