# PDF Report Generator Technical Design

Status: Draft  
Owner: PMG Tracker 360  
Created: 2026-06-25

## 1. Purpose

This document defines the proposed technical design for adding PDF report generation to PMG Tracker 360. It covers architecture, module boundaries, API routes, rendering strategy, authorization, data flow, error handling, and implementation approach.

## 2. Design Summary

Build a shared server-side report generation module that can be consumed by both applications:

- `apps/tracker`
- `apps/admin`

The recommended implementation is to reuse the `jsPDF` server-side generation pattern already proven in `pmg-hub`, refactored into a generic report engine.

The system should avoid using browser screenshots as the primary PDF generation method. Server-side PDFs are more consistent, more secure, easier to test, and better suited for formal reports.

## 3. Recommended Architecture

```txt
pmg-tracker-360/
  packages/
    reports/
      package.json
      src/
        index.ts
        core/
          pdf-engine.ts
          pdf-layout.ts
          pdf-table.ts
          pdf-formatters.ts
          pdf-types.ts
        tracker/
          tender-register-report.ts
          purchase-order-detail-report.ts
          project-status-report.ts
        admin/
          platform-overview-report.ts
          organization-usage-report.ts
  apps/
    tracker/
      src/app/api/reports/[type]/route.ts
      src/server/report-data/
        tender-register-data.ts
        purchase-order-detail-data.ts
        project-status-data.ts
    admin/
      src/app/api/reports/[type]/route.ts
      src/server/report-data/
        platform-overview-data.ts
        organization-usage-data.ts
```

## 4. Main Design Principle

Separate the feature into two layers.

### 4.1 Data Builder Layer

Responsible for:

- Authenticating the request.
- Checking organization/admin permissions.
- Reading database records.
- Applying filters.
- Mapping database results into report-ready data.

This layer should live inside the relevant app because each app owns its own auth checks and server queries.

### 4.2 PDF Rendering Layer

Responsible for:

- Page layout.
- Headers and footers.
- Tables.
- Summary blocks.
- Text wrapping.
- Pagination.
- Totals.
- Empty states.
- Outputting a PDF buffer.

This layer should be shared and should not know about database tables directly.

## 5. Why Use `jsPDF`

The `pmg-hub` monorepo already uses `jsPDF` successfully for server-generated billing PDFs. Reusing this pattern reduces learning curve and avoids introducing a new PDF rendering stack.

### Benefits

- Already familiar from `pmg-hub`.
- Works for programmatic PDF generation.
- Good for invoices, registers, statements, and structured tables.
- Does not require launching a browser process.
- Lighter than Puppeteer/Playwright for serverless deployment.

### Limitations

- Layout must be manually controlled.
- Complex responsive HTML/CSS layouts are not automatically converted.
- Charts may require image rendering or simplified table summaries.

## 6. Alternatives Considered

| Option | Benefits | Concerns | Decision |
|---|---|---|---|
| `jsPDF` | Known pattern, server-side, lightweight | Manual layout | Recommended |
| `@react-pdf/renderer` | React component model | New library/pattern | Possible future alternative |
| Puppeteer/Playwright PDF | Excellent HTML print fidelity | Heavy deployment footprint | Not MVP choice |
| Browser screenshot export | Fast for current screen | Image-based, less formal | Fallback only |

## 7. Core Types

```ts
type ReportPdfData = {
  title: string;
  subtitle?: string;
  generatedAt: string;
  fileName: string;
  organization?: {
    name: string;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
  };
  filters?: ReportFilter[];
  summaryCards?: ReportSummaryCard[];
  sections: ReportSection[];
  footerNote?: string;
};

type ReportFilter = {
  label: string;
  value: string;
};

type ReportSummaryCard = {
  label: string;
  value: string;
  note?: string;
};

type ReportSection =
  | ReportTextSection
  | ReportTableSection
  | ReportKeyValueSection;

type ReportTableSection = {
  type: 'table';
  title: string;
  columns: ReportTableColumn[];
  rows: Record<string, string | number | null | undefined>[];
  emptyMessage?: string;
};

type ReportTableColumn = {
  key: string;
  label: string;
  widthMm: number;
  align?: 'left' | 'center' | 'right';
};
```

## 8. Data Flow

```txt
User clicks Download PDF
        ↓
Client opens /api/reports/[type]?filters...
        ↓
Route validates session
        ↓
Route validates organization/admin permissions
        ↓
Route calls report data builder
        ↓
Data builder maps DB records into ReportPdfData
        ↓
Shared PDF engine renders PDF buffer
        ↓
Route returns application/pdf response
        ↓
Browser downloads file
```

## 9. Tracker API Route Design

Example route:

```txt
apps/tracker/src/app/api/reports/[type]/route.ts
```

Supported initial types:

```ts
type TrackerReportType =
  | 'tender-register'
  | 'purchase-order-detail'
  | 'project-status';
```

Example URLs:

```txt
/api/reports/tender-register?organizationId=org_123&status=open&clientId=client_123
/api/reports/project-status?organizationId=org_123&projectId=project_123
/api/reports/purchase-order-detail?organizationId=org_123&purchaseOrderId=po_123
```

## 10. Admin API Route Design

Example route:

```txt
apps/admin/src/app/api/reports/[type]/route.ts
```

Supported initial types:

```ts
type AdminReportType =
  | 'platform-overview'
  | 'organization-usage';
```

Example URLs:

```txt
/api/reports/platform-overview
/api/reports/organization-usage?organizationId=org_123
```

## 11. PDF Response Contract

All PDF routes should return:

```ts
return new NextResponse(new Uint8Array(result.buffer), {
  headers: {
    'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename="${result.fileName}"`,
    'Cache-Control': 'no-store',
  },
});
```

## 12. Authorization Rules

### Tracker

Tracker report routes must:

1. Read the current session.
2. Require an active organization or explicit `organizationId`.
3. Validate membership using the existing organization authorization utility.
4. Apply role/permission checks where relevant.

Examples:

- Tender reports: require tender read access.
- Project reports: require project read access.
- Purchase order reports: require purchase order read access.

### Admin

Admin report routes must:

1. Read the current session.
2. Confirm the user has admin role/access.
3. Reject non-admin users with `403`.

## 13. Error Handling

| Scenario | Response |
|---|---|
| No session | `401 Unauthorized` |
| Session exists but no access | `403 Forbidden` |
| Unsupported report type | `400 Bad Request` |
| Invalid filter | `400 Bad Request` |
| Record not found | `404 Not Found` |
| PDF generation failure | `500 Internal Server Error` |

Client messages should be safe and simple. Detailed errors should stay in server logs.

## 14. Rendering Design

### Page Setup

- A4 portrait by default.
- Millimetre units.
- Standard margins.
- Header area for title and organization.
- Footer area for page number and generation metadata.

### Header

Each report header should include:

- Report title.
- Organization/platform name.
- Generated date.
- Optional report subtitle.
- Optional filter summary.

### Tables

Tables must support:

- Column widths.
- Text wrapping.
- Row height calculation.
- Page breaks.
- Empty-state rows.
- Right-aligned currency values.
- Date formatting.

## 15. Report Builder Pattern

Each report should expose a function that returns `ReportPdfData`.

```ts
export async function buildTenderRegisterReportData(input: {
  organizationId: string;
  status?: string;
  clientId?: string;
  search?: string;
}): Promise<ReportPdfData> {
  // validate access before or inside caller
  // fetch tenders
  // map rows
  // return report data
}
```

The PDF engine should remain generic:

```ts
export function renderReportPdf(data: ReportPdfData): Buffer {
  // no DB calls here
}
```

## 16. UI Integration

Expose report downloads from:

### Tracker

- `/reports`
- Tender overview/register pages
- Project detail pages
- Purchase order detail pages

### Admin

- Admin dashboard
- Organizations page
- Users page
- Support tickets page
- Sessions/security pages

Use a reusable client component:

```tsx
<ExportPdfButton
  label="Download PDF"
  pdfUrl={`/api/reports/tender-register?organizationId=${organizationId}`}
  fileName="Tender-Register.pdf"
/>
```

## 17. Testing Strategy

- Unit test filename sanitisation.
- Unit test formatter helpers.
- Unit test data mapping functions.
- Integration test route authorization.
- Integration test invalid report type.
- Integration test empty dataset PDF response.
- Manual QA with long tables and multi-page PDFs.

## 18. Future Enhancements

- Email report delivery.
- Scheduled recurring reports.
- CSV/Excel export.
- User-selectable columns.
- Report preview pages.
- Saved report filters.
- Chart image support.
- Report audit logs.
