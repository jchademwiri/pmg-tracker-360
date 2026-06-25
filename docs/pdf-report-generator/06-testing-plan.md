# PDF Report Generator Testing Plan

Status: Draft  
Owner: PMG Tracker 360  
Created: 2026-06-25

## 1. Purpose

This document defines the testing approach for the PDF report generator feature. The goal is to confirm that PDF reports generate correctly, respect permissions, handle edge cases, and remain stable as more reports are added.

## 2. Testing Scope

The testing scope covers:

- Shared PDF engine.
- Report data builders.
- API routes.
- UI export buttons.
- Authorization and organization access.
- Empty datasets.
- Long tables and pagination.
- File naming.
- Error handling.
- Production build compatibility.

## 3. Test Levels

| Test Level | Purpose |
|---|---|
| Unit tests | Validate small helpers and calculations |
| Integration tests | Validate API route behaviour and data builders |
| Manual QA | Validate PDF layout, UI, and download behaviour |
| Regression tests | Ensure new reports do not break existing reports |

## 4. Unit Test Areas

### 4.1 Filename Sanitisation

Function to test:

```ts
sanitizePdfFileName(input: string)
```

Test cases:

| Input | Expected |
|---|---|
| `Tender Register.pdf` | `Tender-Register.pdf` |
| `PO: 123/2026` | `PO-123-2026.pdf` |
| `Project <Status> Report` | `Project-Status-Report.pdf` |
| Empty string | `document.pdf` or equivalent fallback |

### 4.2 Currency Formatting

Function to test:

```ts
formatCurrency(value: unknown)
```

Test cases:

| Input | Expected |
|---|---|
| `1000` | `R 1,000.00` |
| `'2500.5'` | `R 2,500.50` |
| `null` | `R 0.00` or `-`, depending on chosen rule |
| Invalid value | Safe fallback |

### 4.3 Date Formatting

Function to test:

```ts
formatDate(value: unknown)
```

Test cases:

| Input | Expected |
|---|---|
| `2026-06-25` | `25 Jun 2026` |
| Valid Date object | Formatted date |
| `null` | `-` |
| Invalid date string | `-` |

### 4.4 Status Label Formatting

Function to test:

```ts
formatStatus(value: string)
```

Test cases:

| Input | Expected |
|---|---|
| `under_preparation` | `Under Preparation` |
| `partially_delivered` | `Partially Delivered` |
| `AWARDED` | `Awarded` or agreed label |
| Empty string | `-` |

### 4.5 Table Row Height Calculation

Test that:

- Long descriptions wrap.
- Row height increases when text wraps.
- Row height never becomes less than the minimum.
- Page break logic does not cut off rows.

### 4.6 Summary Calculations

Test calculations for:

- Tender totals.
- Awarded/lost/open counts.
- Win rate.
- PO total amount.
- Delivered quantity.
- Outstanding quantity.
- Delivered value.
- Outstanding value.

## 5. Integration Test Areas

## 5.1 Tracker Report API Route

Route:

```txt
apps/tracker/src/app/api/reports/[type]/route.ts
```

Test cases:

| Scenario | Expected |
|---|---|
| No session | `401 Unauthorized` |
| User not in organization | `403 Forbidden` |
| Unsupported report type | `400 Bad Request` |
| Missing required parameter | `400 Bad Request` |
| Missing record | `404 Not Found` |
| Valid request | `200 OK`, `application/pdf` |

### Headers to verify

```txt
Content-Type: application/pdf
Content-Disposition: attachment; filename="...pdf"
Cache-Control: no-store
```

## 5.2 Admin Report API Route

Route:

```txt
apps/admin/src/app/api/reports/[type]/route.ts
```

Test cases:

| Scenario | Expected |
|---|---|
| No session | `401 Unauthorized` |
| Non-admin session | `403 Forbidden` |
| Unsupported report type | `400 Bad Request` |
| Valid admin request | `200 OK`, `application/pdf` |

## 5.3 Tender Register Report Data Builder

Test cases:

| Scenario | Expected |
|---|---|
| No tenders | Valid empty report data |
| Multiple tenders | Correct row count |
| Status filter | Only matching status rows |
| Client filter | Only matching client rows |
| Search filter | Matching tender/client/description rows |
| Long description | Data preserved for wrapping |
| Missing client | Safe fallback |

## 5.4 Purchase Order Detail Report Data Builder

Test cases:

| Scenario | Expected |
|---|---|
| PO exists | Valid report data |
| PO missing | `null` or not found result |
| PO from another org | Forbidden/not found depending on design |
| PO has no line items | Empty line item section |
| PO has partial delivery | Correct delivered/outstanding quantities |
| PO has multiple delivery notes | All notes included |

## 5.5 Project Status Report Data Builder

Test cases:

| Scenario | Expected |
|---|---|
| Project exists | Valid report data |
| Project missing | `null` or not found result |
| Project has no POs | Empty PO section |
| Project has risks | Risks included |
| Project has no risks | Empty risk section |
| Project has activities | Activities included |
| Project has no activities | Empty activity section |

## 6. Manual QA Checklist

### 6.1 PDF Layout

```txt
[ ] Header displays correct report title
[ ] Organization/platform name displays correctly
[ ] Generated date displays correctly
[ ] Selected filters are visible
[ ] Summary cards are readable
[ ] Tables fit within A4 width
[ ] Long text wraps without overlapping
[ ] Page breaks are clean
[ ] Footer shows page numbers
[ ] Currency values are aligned and readable
[ ] Empty-state messages are clear
```

### 6.2 Download Behaviour

```txt
[ ] Download button works from reports page
[ ] Download button works from contextual pages
[ ] Loading state appears while generating
[ ] Error message appears if download fails
[ ] Filename is readable and sanitized
[ ] PDF opens in common PDF readers
```

### 6.3 Browser Testing

Test at minimum:

```txt
[ ] Chrome
[ ] Microsoft Edge
```

Optional:

```txt
[ ] Firefox
[ ] Safari, if available
```

### 6.4 Mobile/Responsive UI

The PDF itself is A4, but the report UI must still work on mobile.

```txt
[ ] Report cards fit mobile width
[ ] Export button is reachable
[ ] Filters are usable on mobile
[ ] Errors/toasts are visible
```

## 7. Security Test Checklist

```txt
[ ] Unauthenticated user cannot download tracker reports
[ ] User from Org A cannot download Org B reports
[ ] Member without required permission cannot download restricted reports
[ ] Non-admin cannot download admin reports
[ ] Invalid UUIDs do not expose stack traces
[ ] Missing records do not reveal cross-organization existence
[ ] PDF routes do not cache sensitive data
```

## 8. Performance Test Checklist

```txt
[ ] Tender register with 10 rows
[ ] Tender register with 100 rows
[ ] Tender register with 500 rows, if allowed
[ ] PO detail with multiple line items
[ ] PO detail with multiple delivery notes
[ ] Project status with many activities
[ ] Admin organization usage report with many organizations
```

Measure:

- Response time.
- PDF file size.
- Memory issues.
- Timeout risk.

## 9. Regression Checklist

Before merging new report types:

```txt
[ ] Existing report routes still work
[ ] Existing report UI still works
[ ] Shared PDF engine still handles old report data
[ ] Type checking passes
[ ] Lint passes
[ ] Production build passes
```

## 10. Recommended Commands

Use the repo's normal commands:

```bash
bun run check-types
bun run lint
bun run build
```

If package-level tests exist:

```bash
bun test
```

## 11. Definition of Done

A report is done when:

- Data builder is implemented.
- PDF builder is implemented.
- API route supports the report type.
- UI exposes the download action.
- Unauthorized access is blocked.
- Empty data is handled.
- Long table/manual QA is passed.
- File name is sanitized.
- Typecheck/build passes.
