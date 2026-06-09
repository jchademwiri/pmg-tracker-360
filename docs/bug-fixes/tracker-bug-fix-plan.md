# Tracker Bug Fix Implementation Plan

> **Date:** June 9, 2026
> **Scope:** `/apps/tracker` — 3 focused bugs
> **Priority:** High — affects data integrity, UX consistency, and timezone correctness

---

## Table of Contents

1. [Bug 1: Tender Amount Must Be Optional](#bug-1-tender-amount-must-be-optional)
2. [Bug 2: All Financial Values Must Be in R (ZAR) System-Wide](#bug-2-all-financial-values-must-be-in-r-zar-system-wide)
3. [Bug 3: Sync Server/Database Time with Local Time (SAST)](#bug-3-sync-serverdatabase-time-with-local-time-sast)
4. [Implementation Order & Dependencies](#implementation-order--dependencies)
5. [Files Affected Summary](#files-affected-summary)

---

## Bug 1: Tender Amount Must Be Optional

### Current State

| Layer | Status | Detail |
|-------|--------|--------|
| DB Schema (`packages/db/schema.ts`) | ✅ Nullable | `decimal('value', { precision: 15, scale: 2 })` — no `.notNull()` |
| Zod Validation (`lib/validations/tender.ts`) | ✅ Optional | `value: z.string().optional()` |
| Tender Form (`components/tenders/tender-form.tsx`) | ⚠️ Partially fixed | Label says "Tender Value" (no `*`), but input type is `text` — accepts any string including non-numeric |

### Identified Issues

1. **No `null` transform on empty string** — If a user clears the field, `z.string().optional()` passes `""` (empty string) to the server, which may fail on the `decimal` PostgreSQL column. The schema should transform empty strings to `null`.

2. **No numeric validation** — The `value` field accepts any string (e.g., `"abc"`, `"R1234"`, `"1,234.56"`). While optional, when provided it should be a valid numeric string.

3. **Briefing date timezone inconsistency in form** — The briefing date field in `tender-form.tsx` uses a raw `getTimezoneOffset()` approach while `submissionDate` uses the proper `toLocalDateTimeString()`/`fromLocalDateTimeString()` utilities. This should be unified.

### Implementation Plan

#### Step 1.1: Fix Zod Schema Validation
**File:** `apps/tracker/src/lib/validations/tender.ts`

```ts
// Before:
value: z.string().optional(),

// After:
value: z.string()
  .optional()
  .nullable()
  .transform((val) => {
    if (!val || val.trim() === '') return null;
    // Strip currency symbols, spaces, and commas: "R 1,234.56" → "1234.56"
    const cleaned = val.replace(/[Rr\s,]/g, '');
    const num = parseFloat(cleaned);
    if (isNaN(num)) return null;
    return cleaned;
  }),
```

Also update `TenderStatusUpdateSchema`:
```ts
awardValue: z.string()
  .optional()
  .nullable()
  .transform((val) => {
    if (!val || val.trim() === '') return null;
    const cleaned = val.replace(/[Rr\s,]/g, '');
    const num = parseFloat(cleaned);
    if (isNaN(num)) return null;
    return cleaned;
  }),
```

#### Step 1.2: Update Server Action to Handle Null
**File:** `apps/tracker/src/server/tenders.ts`

Ensure `createTender` and `updateTender` pass `null` (not `""`) to the database:
- The transform in Step 1.1 already handles this, but verify the spread `...validatedData` doesn't override with empty string.

#### Step 1.3: Add Input Sanitization in Tender Form
**File:** `apps/tracker/src/components/tenders/tender-form.tsx`

Add a `stripNonNumeric` helper for the value input:
```ts
onChange={(e) => {
  // Allow only numbers, decimals, and commas for display
  const raw = e.target.value.replace(/[^0-9.,]/g, '');
  field.onChange(raw);
}}
```

#### Step 1.4: Update TenderToProjectDialog
**File:** `apps/tracker/src/components/tenders/tender-to-project-dialog.tsx`

The `awardValue` field in `ContractDetailsSchema` should also get the same null-transform treatment.

#### Step 1.5: Update PO totalAmount Validation (Related)
**File:** `apps/tracker/src/components/purchase-orders/po-form.tsx`

The PO `totalAmount` field is correctly required (`z.string().min(1)`), but should also strip non-numeric characters before submission to prevent `"R1000"` from being stored.

---

## Bug 2: All Financial Values Must Be in R (ZAR) System-Wide

### Current State — Inconsistency Audit

#### ✅ Using shared `formatCurrency()` from `@/lib/format`
| File | Usage |
|------|-------|
| `components/tenders/tenders-table.tsx:189` | `formatCurrency(Number(tender.value \|\| 0))` |
| `components/dashboard/dashboard-metrics.tsx:68` | `formatCurrency(tenderStats.totalValue)` |
| `components/reports/stats-cards.tsx:46,64,80` | `formatCurrency(stats.poRevenue)`, etc. |
| `components/shared/dialogs/upgrade-dialog.tsx:293` | `formatCurrency(tier.price)` |
| `app/(dashboard)/billing/billing-client.tsx:265,378,454` | `formatCurrency(...)` |
| `app/(dashboard)/projects/overview/page.tsx:138` | `formatCurrency(stats.totalPOAmount)` |
| `components/home-page/PricingSection.tsx:125` | `formatCurrency(tier.price)` |

#### ⚠️ Using local `formatValue()` with inline `Intl.NumberFormat` (duplicated code)
| File | Line | Issue |
|------|------|-------|
| `components/tenders/tender-list.tsx:213-220` | Local `formatValue()` | Duplicates `formatCurrency`, only takes `string \| null` |
| `components/tenders/tender-details.tsx:177-184` | Local `formatValue()` | Same duplication |
| `components/purchase-orders/po-list.tsx:182-189` | Local `formatValue()` | Same duplication |
| `components/purchase-orders/po-details.tsx:125-132` | Local `formatValue()` | Same duplication |

#### ❌ Using `$` symbol with `toLocaleString()` — **WRONG currency**
| File | Line | Code | Issue |
|------|------|------|-------|
| `components/tenders/upcoming-deadlines.tsx:108` | `${parseFloat(deadline.value).toLocaleString()}` | Uses `$` prefix — shows as USD! |
| `app/(dashboard)/tenders/overview/page.tsx:252` | `${stats.totalValue.toLocaleString()}` | Uses `$` prefix — shows as USD! |

### Existing `formatCurrency()` in `@/lib/format.ts`
```ts
export function formatCurrency(
  amount: number,
  options: Intl.NumberFormatOptions = {}
): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    ...options,
  }).format(amount);
}
```

**Limitation:** Only accepts `number` — forces callers to do `parseFloat(value || '0')` or `Number(value || 0)`.

### Implementation Plan

#### Step 2.1: Extend `formatCurrency` to Accept String/Null Inputs
**File:** `apps/tracker/src/lib/format.ts`

```ts
/**
 * Formats a monetary value as South African Rand (ZAR).
 * Accepts number, numeric string, null, or undefined.
 */
export function formatCurrency(
  amount: number | string | null | undefined,
  options: Intl.NumberFormatOptions = {}
): string {
  if (amount === null || amount === undefined || amount === '') return 'R 0';

  const numericAmount = typeof amount === 'string'
    ? parseFloat(amount.replace(/[Rr\s,]/g, ''))
    : amount;

  if (isNaN(numericAmount)) return 'R 0';

  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    ...options,
  }).format(numericAmount);
}

/**
 * Formats a monetary value with decimals (e.g. for line items).
 */
export function formatCurrencyDetailed(
  amount: number | string | null | undefined,
  options: Intl.NumberFormatOptions = {}
): string {
  return formatCurrency(amount, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options,
  });
}

/**
 * Compact currency format for large values (e.g. R 1.2M, R 350K).
 */
export function formatCurrencyCompact(
  amount: number | string | null | undefined
): string {
  if (amount === null || amount === undefined || amount === '') return 'R 0';

  const numericAmount = typeof amount === 'string'
    ? parseFloat(amount.replace(/[Rr\s,]/g, ''))
    : amount;

  if (isNaN(numericAmount)) return 'R 0';

  if (numericAmount >= 1_000_000) {
    return `R ${(numericAmount / 1_000_000).toFixed(1)}M`;
  }
  if (numericAmount >= 1_000) {
    return `R ${(numericAmount / 1_000).toFixed(0)}K`;
  }
  return formatCurrency(numericAmount);
}
```

#### Step 2.2: Fix `$` Symbol Bug in Tenders Overview
**File:** `apps/tracker/src/app/(dashboard)/tenders/overview/page.tsx`

```diff
- <div className="text-2xl font-bold">
-   ${stats.totalValue.toLocaleString()}
- </div>
+ <div className="text-2xl font-bold">
+   {formatCurrency(stats.totalValue)}
+ </div>
```

Add import:
```ts
import { formatCurrency } from '@/lib/format';
```

#### Step 2.3: Fix `$` Symbol Bug in Upcoming Deadlines
**File:** `apps/tracker/src/components/tenders/upcoming-deadlines.tsx`

```diff
- <p className="text-xs font-medium">
-   ${parseFloat(deadline.value).toLocaleString()}
- </p>
+ <p className="text-xs font-medium">
+   {formatCurrency(deadline.value)}
+ </p>
```

Add import:
```ts
import { formatCurrency } from '@/lib/format';
```

#### Step 2.4: Remove Duplicated `formatValue()` Functions

Replace local `formatValue` in these 4 files with the shared `formatCurrency`:

**a) `components/tenders/tender-list.tsx`**
```diff
+ import { formatCurrency, formatDate } from '@/lib/format';
- // Remove local formatValue function (lines 213-220)
- const formatValue = (value: string | null) => { ... };
  // Replace all formatValue(x) calls with formatCurrency(x)
```

**b) `components/tenders/tender-details.tsx`**
```diff
+ import { formatCurrency } from '@/lib/format';
- // Remove local formatValue function (lines 177-184)
- const formatValue = (value: string | null) => { ... };
  // Replace all formatValue(x) calls with formatCurrency(x)
```

**c) `components/purchase-orders/po-list.tsx`**
```diff
+ import { formatCurrency, formatDate } from '@/lib/format';
- // Remove local formatValue function (lines 182-189)
- const formatValue = (value: string | null) => { ... };
  // Replace all formatValue(x) calls with formatCurrency(x)
```

**d) `components/purchase-orders/po-details.tsx`**
```diff
+ import { formatCurrency } from '@/lib/format';
- // Remove local formatValue function (lines 125-132)
- const formatValue = (value: string | null) => { ... };
  // Replace all formatValue(x) calls with formatCurrency(x)
```

#### Step 2.5: Add R Prefix to Financial Form Inputs
Ensure all monetary input fields show the `R` prefix consistently:

| File | Field | Current | Fix |
|------|-------|---------|-----|
| `tender-form.tsx` | Tender Value | Has `R` prefix ✅ | No change needed |
| `tender-to-project-dialog.tsx` | Award Value | Has `R` prefix ✅ | No change needed |
| `po-form.tsx` | Total Amount | No prefix ❌ | Add `R` prefix |
| PO line item forms (if any) | Unit Price, Subtotal | Check | Add `R` prefix |

#### Step 2.6: Update Dashboard Metrics Import
**File:** `components/dashboard/dashboard-metrics.tsx`

This file imports from `@/lib/dashboard-data` which re-exports from `@/lib/format`. Verify the re-export chain works correctly after the `formatCurrency` signature change.

---

## Bug 3: Sync Server/Database Time with Local Time (SAST)

### Current State — Timezone Audit

#### Timezone Utilities in `lib/tender-utils.ts`
| Function | Uses | Issue |
|----------|------|-------|
| `toLocalDateString()` | `Intl.DateTimeFormat` with `Africa/Johannesburg` | ✅ Correct for SAST |
| `fromLocalDateString()` | `Date.UTC()` | ✅ Correct — stores midnight UTC |
| `toLocalDateTimeString()` | `getTimezoneOffset()` | ❌ **Browser-dependent** — not SAST-specific |
| `fromLocalDateTimeString()` | `new Date()` | ⚠️ Parses as local time, not SAST |

#### Formatting Functions in `lib/format.ts`
| Function | Timezone | Issue |
|----------|----------|-------|
| `formatDate()` | None specified | Uses runtime default timezone — may differ between server/client |
| `formatDateTime()` | None specified | Same issue |

#### `new Date()` Usage in Server Actions (Timezone-Sensitive)
| File | Usage | Issue |
|------|-------|-------|
| `server/tenders.ts` | `new Date()` for `createdAt`, `updatedAt`, deadline calculations | Server UTC time, not SAST |
| `server/purchase-orders.ts` | `new Date()` for `updatedAt`, delivery status | Same |
| `server/projects.ts` | `new Date()` for `updatedAt` | Same |
| `server/clients.ts` | `new Date()` for `updatedAt`, `deletedAt` | Same |
| `server/calendar.ts` | `.toISOString()` for event dates | Converts to UTC — may shift dates |
| `server/documents.ts` | `new Date()` for PO date folder | Same |
| `server/invitations.ts` | `new Date()` for expiry calculation | Same |
| `lib/tender-utils.ts` | `resolveTenderStatus()` uses `new Date()` | Server time vs user SAST time |

#### PO Form Date Handling Bug
**File:** `components/purchase-orders/po-form.tsx`

```ts
// Lines 290, 318:
value={field.value ? field.value.toISOString().split('T')[0] : ''}
```

**Bug:** `toISOString()` converts to UTC. If the user selects "2026-06-15" in the date picker, `new Date("2026-06-15")` creates midnight local time, then `.toISOString()` converts to UTC midnight — which could be "2026-06-14" if the local timezone is ahead of UTC (SAST is UTC+2, so this specific case is safe for date-only). However, this is fragile and breaks for datetime fields.

#### Briefing Date Timezone Bug
**File:** `components/tenders/tender-form.tsx` (lines 679-692)

```ts
value={
  field.value
    ? new Date(
        new Date(field.value).getTime() -
          new Date(field.value).getTimezoneOffset() * 60000
      )
        .toISOString()
        .slice(0, 16)
    : ''
}
```

**Bug:** Uses `getTimezoneOffset()` which returns the **browser's** timezone offset, not SAST. A user in UTC+0 would get a different result than a user in UTC+2.

### Core Problem
The app targets South African users (SAST = UTC+2) but:
1. Server runs in UTC (typical for cloud deployments)
2. `new Date()` on the server returns UTC time
3. Date comparisons (deadlines, auto-close) use server time
4. The `toLocalDateTimeString()` utility uses runtime timezone, not SAST
5. Date display functions don't specify timezone

### Implementation Plan

#### Step 3.1: Create a Centralized SAST Timezone Utility
**File:** `apps/tracker/src/lib/timezone.ts` (NEW)

```ts
/**
 * South African Standard Time (SAST) = UTC+2
 * All date operations in this app should use SAST as the canonical timezone.
 */
export const SAST_TIMEZONE = 'Africa/Johannesburg';
export const SAST_OFFSET_HOURS = 2;
export const SAST_OFFSET_MS = SAST_OFFSET_HOURS * 60 * 60 * 1000;

/**
 * Get the current date/time in SAST.
 */
export function nowInSAST(): Date {
  return new Date(Date.now() + SAST_OFFSET_MS);
}

/**
 * Format a Date as a SAST-local YYYY-MM-DD string.
 * Safe for date inputs and database storage.
 */
export function toSASTDateString(
  date: Date | string | null | undefined
): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';

  return new Intl.DateTimeFormat('en-CA', {
    timeZone: SAST_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

/**
 * Format a Date as a SAST-local YYYY-MM-DDTHH:mm string.
 * Safe for datetime-local inputs.
 */
export function toSASTDateTimeString(
  date: Date | string | null | undefined
): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';

  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: SAST_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d);
}

/**
 * Parse a YYYY-MM-DD string into a UTC midnight Date.
 * This prevents timezone offset issues when storing date-only values.
 */
export function parseDateToUTC(dateStr: string | null | undefined): Date | null {
  if (!dateStr) return null;
  const [year, month, day] = dateStr.split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(Date.UTC(year, month - 1, day));
}

/**
 * Parse a YYYY-MM-DDTHH:mm string into a SAST-aligned Date.
 * The input is assumed to be in SAST (UTC+2).
 */
export function parseDateTimeToUTC(dateTimeStr: string | null | undefined): Date | null {
  if (!dateTimeStr) return null;
  // Parse the local SAST time and convert to UTC
  const [datePart, timePart] = dateTimeStr.split('T');
  if (!datePart || !timePart) return null;

  const [year, month, day] = datePart.split('-').map(Number);
  const [hours, minutes] = timePart.split(':').map(Number);

  if (!year || !month || !day) return null;

  // Create UTC date, then subtract SAST offset
  const utcDate = new Date(Date.UTC(year, month - 1, day, hours || 0, minutes || 0));
  utcDate.setUTCHours(utcDate.getUTCHours() - SAST_OFFSET_HOURS);
  return utcDate;
}

/**
 * Compare two dates, ignoring time component (date-only comparison in SAST).
 */
export function isBeforeSAST(
  date1: Date | string | null,
  date2: Date | string | null
): boolean {
  if (!date1 || !date2) return false;
  const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2;
  return d1.getTime() < d2.getTime();
}

/**
 * Check if a date is in the past (SAST-aware).
 */
export function isPastSAST(date: Date | string | null): boolean {
  if (!date) return false;
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.getTime() < Date.now();
}
```

#### Step 3.2: Update `lib/format.ts` to Use SAST Timezone
**File:** `apps/tracker/src/lib/format.ts`

```diff
+ import { SAST_TIMEZONE } from './timezone';

  export function formatDate(
    date: Date | string | null | undefined,
    fallback = '-'
  ): string {
    if (!date) return fallback;
    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
+     timeZone: SAST_TIMEZONE,
    }).format(new Date(date));
  }

  export function formatDateTime(
    date: Date | string | null | undefined,
    fallback = '-'
  ): string {
    if (!date) return fallback;
    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
+     timeZone: SAST_TIMEZONE,
    }).format(new Date(date));
  }
```

#### Step 3.3: Update `lib/tender-utils.ts` to Use Centralized Utilities
**File:** `apps/tracker/src/lib/tender-utils.ts`

```diff
+ import { toSASTDateString, parseDateToUTC, parseDateTimeToUTC } from './timezone';

  export function toLocalDateString(date: Date | string | null | undefined): string {
-   // Keep existing implementation but delegate to timezone util
+   return toSASTDateString(date);
  }

  export function fromLocalDateString(dateStr: string | null | undefined): Date | null {
+   return parseDateToUTC(dateStr);
  }

  export function toLocalDateTimeString(date: Date | string | null | undefined): string {
-   const offset = d.getTimezoneOffset() * 60000;
-   return new Date(d.getTime() - offset).toISOString().slice(0, 16);
+   const { toSASTDateTimeString } = require('./timezone');
+   return toSASTDateTimeString(date);
  }

  export function fromLocalDateTimeString(dateTimeStr: string | null | undefined): Date | null {
+   return parseDateTimeToUTC(dateTimeStr);
  }
```

> **Note:** Maintain backward compatibility by keeping the old function names as re-exports. Update imports gradually.

#### Step 3.4: Fix PO Form Date Handling
**File:** `apps/tracker/src/components/purchase-orders/po-form.tsx`

Replace `toISOString().split('T')[0]` with the timezone-safe utility:

```diff
+ import { toSASTDateString, parseDateToUTC } from '@/lib/timezone';

  // For poDate:
  value={field.value ? toSASTDateString(field.value) : ''}
  onChange={(e) => {
-   const date = e.target.value ? new Date(e.target.value) : undefined;
+   const date = e.target.value ? parseDateToUTC(e.target.value) : undefined;
    field.onChange(date);
  }}

  // For expectedDeliveryDate:
  value={field.value ? toSASTDateString(field.value) : ''}
  onChange={(e) => {
-   const date = e.target.value ? new Date(e.target.value) : undefined;
+   const date = e.target.value ? parseDateToUTC(e.target.value) : undefined;
    field.onChange(date);
  }}
```

#### Step 3.5: Fix Briefing Date Timezone Bug
**File:** `apps/tracker/src/components/tenders/tender-form.tsx`

Replace the raw `getTimezoneOffset()` approach with the SAST utility:

```diff
+ import { toSASTDateTimeString, parseDateTimeToUTC } from '@/lib/timezone';

  // Briefing date field:
  value={
-   field.value
-     ? new Date(
-         new Date(field.value).getTime() -
-           new Date(field.value).getTimezoneOffset() * 60000
-       )
-         .toISOString()
-         .slice(0, 16)
-     : ''
+   toSASTDateTimeString(field.value)
  }
  onChange={(e) => {
-   const val = e.target.value;
-   field.onChange(val ? new Date(val) : null);
+   field.onChange(parseDateTimeToUTC(e.target.value));
  }}
```

#### Step 3.6: Fix Submission Date / Validity Date Handling in Tender Form
**File:** `apps/tracker/src/components/tenders/tender-form.tsx`

The submission date field already uses `toLocalDateTimeString`/`fromLocalDateTimeString` — update these to use the new SAST-aware versions from Step 3.3.

#### Step 3.7: Fix Server-Side Deadline Calculations
**File:** `apps/tracker/src/server/tenders.ts`

All server-side `new Date()` calls that are used for comparison with user dates should be SAST-aware:

```diff
+ import { nowInSAST } from '@/lib/timezone';

  // In getTenderStats():
- const now = new Date();
+ const now = nowInSAST();

  // In getUpcomingDeadlines():
- const now = new Date();
+ const now = nowInSAST();

  // In autoCloseExpiredTenders():
- const now = new Date();
+ const now = nowInSAST();

  // In getRecentActivity():
- const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
+ const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // Relative, OK
```

#### Step 3.8: Fix Server-Side PO Date Calculations
**File:** `apps/tracker/src/server/purchase-orders.ts`

Apply the same `nowInSAST()` pattern for any date comparisons.

#### Step 3.9: Fix `resolveTenderStatus` in tender-utils
**File:** `apps/tracker/src/lib/tender-utils.ts`

```diff
+ import { nowInSAST } from './timezone';

  export function resolveTenderStatus(status: string, submissionDate: Date | null) {
    // ...
-   const now = new Date();
+   const now = nowInSAST();
    const submission = new Date(submissionDate);
    // ...
  }
```

#### Step 3.10: Fix Calendar Event Date Handling
**File:** `apps/tracker/src/server/calendar.ts`

Calendar events use `.toISOString()` which converts to UTC. The frontend calendar component (FullCalendar or similar) typically expects ISO strings. This should be fine as long as the calendar component handles timezone conversion. Verify the calendar component renders dates correctly in SAST.

If the calendar renders dates in the user's browser timezone, the UTC ISO strings will be converted automatically. If not, add timezone handling in the calendar component.

---

## Implementation Order & Dependencies

```
Phase 1: Foundation (no dependencies)
├── Step 3.1: Create /lib/timezone.ts utility
├── Step 2.1: Extend formatCurrency() signature
└── Step 1.1: Fix Zod schema validation

Phase 2: Core Updates (depends on Phase 1)
├── Step 3.2: Update format.ts with SAST timezone
├── Step 3.3: Update tender-utils.ts
├── Step 2.2: Fix $ symbol in tenders overview
├── Step 2.3: Fix $ symbol in upcoming deadlines
└── Step 1.3: Update tender form input sanitization

Phase 3: Component Updates (depends on Phase 2)
├── Step 2.4: Remove duplicated formatValue() functions
├── Step 2.5: Add R prefix to financial form inputs
├── Step 3.4: Fix PO form date handling
├── Step 3.5: Fix briefing date timezone
└── Step 3.6: Fix submission date handling

Phase 4: Server Updates (depends on Phase 1)
├── Step 3.7: Fix server-side deadline calculations
├── Step 3.8: Fix server-side PO date calculations
├── Step 3.9: Fix resolveTenderStatus
├── Step 3.10: Fix calendar event dates
├── Step 1.2: Update server action null handling
└── Step 1.4: Update TenderToProjectDialog
```

### Estimated Effort

| Phase | Steps | Estimated Time |
|-------|-------|---------------|
| Phase 1: Foundation | 3 | 30 min |
| Phase 2: Core Updates | 5 | 45 min |
| Phase 3: Component Updates | 5 | 60 min |
| Phase 4: Server Updates | 6 | 45 min |
| **Total** | **19** | **~3 hours** |

---

## Files Affected Summary

### New Files
| File | Purpose |
|------|---------|
| `apps/tracker/src/lib/timezone.ts` | Centralized SAST timezone utilities |

### Modified Files

#### Bug 1 (Tender Amount Optional)
| File | Change |
|------|--------|
| `apps/tracker/src/lib/validations/tender.ts` | Add null transform, numeric validation |
| `apps/tracker/src/server/tenders.ts` | Ensure null propagation |
| `apps/tracker/src/components/tenders/tender-form.tsx` | Input sanitization, briefing date fix |
| `apps/tracker/src/components/tenders/tender-to-project-dialog.tsx` | Award value null transform |

#### Bug 2 (ZAR Currency)
| File | Change |
|------|--------|
| `apps/tracker/src/lib/format.ts` | Extend `formatCurrency` signature |
| `apps/tracker/src/app/(dashboard)/tenders/overview/page.tsx` | Fix `$` → `formatCurrency()` |
| `apps/tracker/src/components/tenders/upcoming-deadlines.tsx` | Fix `$` → `formatCurrency()` |
| `apps/tracker/src/components/tenders/tender-list.tsx` | Remove local `formatValue`, use shared |
| `apps/tracker/src/components/tenders/tender-details.tsx` | Remove local `formatValue`, use shared |
| `apps/tracker/src/components/purchase-orders/po-list.tsx` | Remove local `formatValue`, use shared |
| `apps/tracker/src/components/purchase-orders/po-details.tsx` | Remove local `formatValue`, use shared |
| `apps/tracker/src/components/purchase-orders/po-form.tsx` | Add `R` prefix to amount input |

#### Bug 3 (Timezone/SAST)
| File | Change |
|------|--------|
| `apps/tracker/src/lib/timezone.ts` | NEW — SAST utilities |
| `apps/tracker/src/lib/format.ts` | Add `timeZone: SAST` to formatters |
| `apps/tracker/src/lib/tender-utils.ts` | Use SAST utilities, fix `resolveTenderStatus` |
| `apps/tracker/src/server/tenders.ts` | Use `nowInSAST()` for deadlines |
| `apps/tracker/src/server/purchase-orders.ts` | Use `nowInSAST()` for comparisons |
| `apps/tracker/src/server/calendar.ts` | Verify/fix date handling |
| `apps/tracker/src/components/tenders/tender-form.tsx` | Fix briefing date timezone |
| `apps/tracker/src/components/purchase-orders/po-form.tsx` | Fix date input handling |

---

## Testing Checklist

After implementation, verify:

- [ ] Create a tender with no value → saves successfully, displays "Not set" or "R 0"
- [ ] Create a tender with value "R 1,234,567" → saves as "1234567", displays as "R 1 234 567"
- [ ] Create a tender with value "abc" → saves as null, no error
- [ ] All financial displays show `R` prefix (no `$` symbols anywhere)
- [ ] Tender overview page shows `R X` instead of `$X`
- [ ] Upcoming deadlines shows `R X` instead of `$X`
- [ ] PO list and details show `R X` format
- [ ] Billing page shows `R X` format
- [ ] Reports stats show `R X` format
- [ ] Dates display correctly in SAST (UTC+2)
- [ ] Creating a tender at 23:00 SAST stores correct UTC timestamp
- [ ] Deadline comparisons work correctly across timezone boundaries
- [ ] PO form dates don't shift by a day
- [ ] Briefing date picker preserves selected time in SAST
- [ ] Calendar events render on correct dates
- [ ] Auto-close expired tenders works at SAST midnight
