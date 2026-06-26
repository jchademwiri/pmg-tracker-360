# PDF Report Generator PRD

Status: Draft  
Owner: PMG Tracker 360  
Created: 2026-06-25

## 1. Purpose

Create a reusable PDF report generation feature for the PMG Tracker 360 monorepo. The feature must support both the Tracker app and the Admin app, allowing users to download structured, professional PDF reports from existing tender, project, purchase order, delivery, organization, user, support, and platform data.

The first implementation should prioritise server-side PDF generation so PDFs are consistent, secure, downloadable, and not dependent on browser screenshots.

## 2. Background

The `pmg-hub` monorepo already contains a working PDF generation pattern for billing documents. It uses `jsPDF` server-side to generate invoices, quotations, receipts, and statements. That pattern can be adapted into a shared report generator for PMG Tracker 360.

PMG Tracker 360 has two reporting surfaces:

- `apps/tracker`: tenant-facing tender, project, purchase order, delivery, client, and document reporting.
- `apps/admin`: platform-level reporting for users, organizations, support, sessions, security, waitlist, subscriptions/plans, and usage.

## 3. Problem Statement

Users have important operational data inside the system, but they need a professional way to export that data for management review, tender administration, project tracking, procurement follow-up, client communication, and compliance records.

Without a formal PDF report generator, users may rely on screenshots, copied tables, Excel exports, or manual documents. This creates inconsistent records, weak auditability, and duplicated work.

## 4. Goals

- Provide a standard PDF generation engine shared by Tracker and Admin.
- Generate professional A4 PDF reports with consistent branding, titles, metadata, filters, tables, totals, and footers.
- Support secure report downloads through authenticated API routes.
- Start with a focused MVP and extend report coverage over time.
- Reuse the proven `pmg-hub` `jsPDF` pattern where practical.
- Keep report data fetching in each app/server layer and keep PDF rendering reusable.

## 5. Non-Goals

- Do not build a full BI/dashboard engine in the first phase.
- Do not build custom user-designed report templates in the first phase.
- Do not add scheduled report emailing in the MVP.
- Do not replace existing dashboard pages.
- Do not build Excel export as part of the first PDF milestone.
- Do not use client-side screenshot export as the primary formal report approach.

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

- Users must be able to click a report action and download a PDF generated from current server data.
- Reports must be generated server-side for formal outputs.
- Reports must support relevant filters such as status, date range, client, project, supplier, and organization.
- Each PDF must include title, generated date, context, selected filters, tables, and page numbers.
- Tracker reports must validate session and organization membership.
- Admin reports must validate admin-level access.
- Empty datasets must generate a valid PDF with a clear empty-state message.
- Long tables must paginate cleanly.
- Downloaded filenames must be predictable and safe.

## 10. Non-Functional Requirements

### Security

- No unauthenticated PDF downloads.
- No cross-organization data leakage.
- No admin reports accessible to normal tenant users.
- Avoid exposing raw database errors to the browser.

### Performance

- MVP reports should generate within acceptable response time for normal data volumes.
- Large reports should use filters or practical limits.
- Avoid loading unnecessary records.

### Maintainability

- Report rendering helpers must be reusable.
- Report data builders must be separated from PDF layout functions.
- Avoid duplicating PDF code separately in Tracker and Admin.

## 11. Acceptance Criteria

- A shared report module exists.
- At least three Tracker reports are implemented.
- At least one Admin report is implemented.
- API routes return `Content-Type: application/pdf`.
- API routes return `Content-Disposition: attachment`.
- Unauthorized users receive `401` or `403`.
- Invalid report types receive `400`.
- Missing records receive `404` where applicable.
- Empty datasets generate valid PDFs.
- Long tables paginate correctly.

## 12. Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Long reports become too large | Slow downloads and poor UX | Add filters, limits, and summary reports |
| PDF layout becomes duplicated | Hard maintenance | Centralize helpers in a shared package |
| Cross-organization access bug | Serious data leak | Validate session and organization before fetching data |
| Manual `jsPDF` layout becomes complex | Harder maintenance | Keep report layouts simple and table-driven |
| Admin and Tracker needs diverge | Inconsistent outputs | Use shared core with app-specific data builders |

## 13. Open Questions

- Should reports support preview before download, or only direct download?
- Should reports support email delivery in phase 2?
- Should the PDF engine live in `packages/reports` or inside a shared app library first?
- Should very large reports be limited by default date ranges?
- Should users be able to choose columns later?
- Should Excel export be added as a separate follow-up feature?
