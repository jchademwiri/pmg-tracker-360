# Tracker Bug Fix Implementation Plan

> **Date:** June 9, 2026
> **Scope:** `/apps/tracker` — 3 focused bugs
> **Priority:** High — affects data integrity, UX consistency, and timezone correctness
> **Status:** ✅ COMPLETED

---

## Table of Contents

1. [Bug 1: Tender Amount Must Be Optional](#bug-1-tender-amount-must-be-optional)
2. [Bug 2: All Financial Values Must Be in R (ZAR) System-Wide](#bug-2-all-financial-values-must-be-in-r-zar-system-wide)
3. [Bug 3: Sync Server/Database Time with Local Time (SAST)](#bug-3-sync-serverdatabase-time-with-local-time-sast)
4. [Implementation Order & Dependencies](#implementation-order--dependencies)
5. [Files Affected Summary](#files-affected-summary)
6. [Testing Checklist](#testing-checklist)

---

## Bug 1: Tender Amount Must Be Optional

### ✅ Completed Steps

#### Step 1.1: Fix Zod Schema Validation
**File:** `apps/tracker/src/lib/validations/tender.ts`
- Added `.nullable()` and `.transform()` to strip non-numeric characters
- Empty strings converted to `null`
- Applied to both `value` and `awardValue` fields

#### Step 1.2: Update Server Action to Handle Null
**File:** `apps/tracker/src/server/tenders.ts`
- Verified `createTender` and `updateTender` correctly pass `null` to database

#### Step 1.3: Add Input Sanitization in Tender Form
**File:** `apps/tracker/src/components/tenders/tender-form.tsx`
- Input handles `null` safely with `field.value || ''`
- Zod transform handles numeric sanitization server-side

#### Step 1.4: Update TenderToProjectDialog
**File:** `apps/tracker/src/components/tenders/tender-to-project-dialog.tsx`
- Added same null-transform treatment for `awardValue` field
- Fixed type compatibility with `z.input<typeof ContractDetailsSchema>`

---

## Bug 2: All Financial Values Must Be in R (ZAR) System-Wide

### ✅ Completed Steps

#### Step 2.1: Extend `formatCurrency` to Accept String/Null Inputs
**File:** `apps/tracker/src/lib/format.ts`
- Extended signature: `number | string | null | undefined`
- Handles R prefix, commas, spaces in string input
- Falls back to `'R 0'` for invalid/empty values

#### Step 2.2: Fix `$` Symbol Bug in Tenders Overview
**File:** `apps/tracker/src/app/(dashboard)/tenders/overview/page.tsx`
- Changed `${stats.totalValue.toLocaleString()}` → `{formatCurrency(stats.totalValue)}`
- Added `import { formatCurrency } from '@/lib/format'`

#### Step 2.3: Fix `$` Symbol Bug in Upcoming Deadlines
**File:** `apps/tracker/src/components/tenders/upcoming-deadlines.tsx`
- Changed `${parseFloat(deadline.value).toLocaleString()}` → `{formatCurrency(deadline.value)}`
- Added `import { formatCurrency } from '@/lib/format'`

#### Step 2.4: Remove Duplicated `formatValue()` Functions
**Files:** tender-list.tsx, tender-details.tsx, po-list.tsx, po-details.tsx
- Removed 4 local `formatValue()` functions
- Replaced all calls with shared `formatCurrency()`
- Updated imports to use `@/lib/format`

#### Step 2.5: Add R Prefix to Financial Form Inputs
**File:** `apps/tracker/src/components/purchase-orders/po-form.tsx`
- Added `R` prefix to totalAmount input field

#### Step 2.6: Fix DollarSign Icon
**Files:** po-list.tsx, po-details.tsx
- Replaced `DollarSign` icon with `Banknote` icon for consistency

---

## Bug 3: Sync Server/Database Time with Local Time (SAST)

### ✅ Completed Steps

#### Step 3.1: Create a Centralized SAST Timezone Utility
**File:** `apps/tracker/src/lib/timezone.ts` (NEW)
- Created `SAST_TIMEZONE`, `SAST_OFFSET_HOURS`, `SAST_OFFSET_MS` constants
- Implemented `nowInSAST()`, `toSASTDateString()`, `toSASTDateTimeString()`
- Implemented `parseDateToUTC()`, `parseDateTimeToUTC()`
- Added `isBeforeSAST()`, `isPastSAST()` comparison utilities

#### Step 3.2: Update `lib/format.ts` to Use SAST Timezone
**File:** `apps/tracker/src/lib/format.ts`
- Added `timeZone: SAST_TIMEZONE` to `formatDate()` and `formatDateTime()`
- All dates now display in SAST regardless of server timezone

#### Step 3.3: Update `lib/tender-utils.ts` to Use Centralized Utilities
**File:** `apps/tracker/src/lib/tender-utils.ts`
- `toLocalDateString()` → delegates to `toSASTDateString()`
- `fromLocalDateString()` → delegates to `parseDateToUTC()`
- `toLocalDateTimeString()` → delegates to `toSASTDateTimeString()`
- `fromLocalDateTimeString()` → delegates to `parseDateTimeToUTC()`

#### Step 3.4: Fix PO Form Date Handling
**File:** `apps/tracker/src/components/purchase-orders/po-form.tsx`
- Replaced `toISOString().split('T')[0]` with `toSASTDateString()`
- Replaced `new Date(value)` with `parseDateToUTC()`

#### Step 3.5: Fix Briefing Date Timezone Bug
**File:** `apps/tracker/src/components/tenders/tender-form.tsx`
- Replaced `getTimezoneOffset()` approach with `toSASTDateTimeString()`
- Replaced date parsing with `parseDateTimeToUTC()`

#### Step 3.6: Fix Submission Date / Validity Date Handling
**File:** `apps/tracker/src/components/tenders/tender-form.tsx`
- Updated to use SAST-aware utilities from timezone.ts

#### Step 3.7: Fix Server-Side Deadline Calculations
**File:** `apps/tracker/src/server/tenders.ts`
- Replaced `new Date()` with `nowInSAST()` for deadline comparisons

#### Step 3.8: Fix Server-Side PO Date Calculations
**File:** `apps/tracker/src/server/purchase-orders.ts`
- Verified date handling is correct

#### Step 3.9: Fix `resolveTenderStatus` in tender-utils
**File:** `apps/tracker/src/lib/tender-utils.ts`
- Updated to use SAST utilities for date comparisons

#### Step 3.10: Fix Calendar Event Date Handling
**File:** `apps/tracker/src/server/calendar.ts`
- Verified calendar events use ISO strings correctly

#### Step 3.11: Fix Dashboard and Projects Server Actions
**Files:** `apps/tracker/src/server/dashboard.ts`, `apps/tracker/src/server/projects.ts`
- Replaced `new Date()` with `nowInSAST()` for deadline and growth calculations
- Removed unused `now` variable from `getAdminDashboardStats`

---

## Unit Tests

### ✅ Created Test Files

#### `apps/tracker/src/lib/__tests__/timezone.test.ts`
- Tests for `nowInSAST`, `toSASTDateString`, `toSASTDateTimeString`
- Tests for `parseDateToUTC`, `parseDateTimeToUTC`
- Edge cases: null, undefined, empty string, invalid dates, timezone boundaries

#### `apps/tracker/src/lib/__tests__/format.test.ts`
- Tests for `formatCurrency` with numbers, strings, null, undefined
- Tests for `formatDate`, `formatDateTime` with SAST timezone
- Tests for `formatNumber`, `formatPercentage`

---

## Implementation Order & Dependencies

```
Phase 1: Foundation (no dependencies) ✅
├── Step 3.1: Create /lib/timezone.ts utility
├── Step 2.1: Extend formatCurrency() signature
└── Step 1.1: Fix Zod schema validation

Phase 2: Core Updates (depends on Phase 1) ✅
├── Step 3.2: Update format.ts with SAST timezone
├── Step 3.3: Update tender-utils.ts
├── Step 2.2: Fix $ symbol in tenders overview
├── Step 2.3: Fix $ symbol in upcoming deadlines
└── Step 1.3: Update tender form input sanitization

Phase 3: Component Updates (depends on Phase 2) ✅
├── Step 2.4: Remove duplicated formatValue() functions
├── Step 2.5: Add R prefix to financial form inputs
├── Step 3.4: Fix PO form date handling
├── Step 3.5: Fix briefing date timezone
└── Step 3.6: Fix submission date handling

Phase 4: Server Updates (depends on Phase 1) ✅
├── Step 3.7: Fix server-side deadline calculations
├── Step 3.8: Fix server-side PO date calculations
├── Step 3.9: Fix resolveTenderStatus
├── Step 3.10: Fix calendar event dates
├── Step 3.11: Fix dashboard and projects server actions
├── Step 1.2: Update server action null handling
└── Step 1.4: Update TenderToProjectDialog
```

### Effort Summary

| Phase | Steps | Status |
|-------|-------|--------|
| Phase 1: Foundation | 3 | ✅ Complete |
| Phase 2: Core Updates | 5 | ✅ Complete |
| Phase 3: Component Updates | 5 | ✅ Complete |
| Phase 4: Server Updates | 7 | ✅ Complete |
| **Total** | **20** | **✅ All Complete** |

---

## Files Affected Summary

### New Files (1)
| File | Purpose |
|------|---------|
| `apps/tracker/src/lib/timezone.ts` | Centralized SAST timezone utilities |

### New Test Files (2)
| File | Purpose |
|------|---------|
| `apps/tracker/src/lib/__tests__/timezone.test.ts` | Unit tests for timezone utilities |
| `apps/tracker/src/lib/__tests__/format.test.ts` | Unit tests for format utilities |

### Modified Files (14)

#### Bug 1 (Tender Amount Optional)
| File | Change |
|------|--------|
| `apps/tracker/src/lib/validations/tender.ts` | Add null transform, numeric validation |
| `apps/tracker/src/components/tenders/tender-form.tsx` | Input sanitization, briefing date fix |
| `apps/tracker/src/components/tenders/tender-to-project-dialog.tsx` | Award value null transform |
| `apps/tracker/src/components/tenders/tender-details.tsx` | Fixed awardValue null handling |

#### Bug 2 (ZAR Currency)
| File | Change |
|------|--------|
| `apps/tracker/src/lib/format.ts` | Extend `formatCurrency` signature |
| `apps/tracker/src/app/(dashboard)/tenders/overview/page.tsx` | Fix `$` → `formatCurrency()` |
| `apps/tracker/src/components/tenders/upcoming-deadlines.tsx` | Fix `$` → `formatCurrency()` |
| `apps/tracker/src/components/tenders/tender-list.tsx` | Remove local `formatValue`, use shared |
| `apps/tracker/src/components/tenders/tender-details.tsx` | Remove local `formatValue`, use shared |
| `apps/tracker/src/components/purchase-orders/po-list.tsx` | Remove local `formatValue`, use shared, Banknote icon |
| `apps/tracker/src/components/purchase-orders/po-details.tsx` | Remove local `formatValue`, use shared, formatDateWithTime |
| `apps/tracker/src/components/purchase-orders/po-form.tsx` | Add `R` prefix to amount input |

#### Bug 3 (Timezone/SAST)
| File | Change |
|------|--------|
| `apps/tracker/src/lib/timezone.ts` | NEW — SAST utilities |
| `apps/tracker/src/lib/format.ts` | Add `timeZone: SAST` to formatters |
| `apps/tracker/src/lib/tender-utils.ts` | Use SAST utilities |
| `apps/tracker/src/server/tenders.ts` | Use `nowInSAST()` for deadlines |
| `apps/tracker/src/server/dashboard.ts` | Use `nowInSAST()` for comparisons |
| `apps/tracker/src/server/projects.ts` | Use `nowInSAST()` for growth calc |

---

## Testing Checklist

After implementation, verify:

- [x] Create a tender with no value → saves successfully, displays "Not set" or "R 0"
- [x] Create a tender with value "R 1,234,567" → saves as "1234567", displays as "R 1 234 567"
- [x] Create a tender with value "abc" → saves as null, no error
- [x] All financial displays show `R` prefix (no `$` symbols anywhere)
- [x] Tender overview page shows `R X` instead of `$X`
- [x] Upcoming deadlines shows `R X` instead of `$X`
- [x] PO list and details show `R X` format
- [x] Dates display correctly in SAST (UTC+2)
- [x] Briefing date picker preserves selected time in SAST
- [x] PO form dates don't shift by a day
- [x] Auto-close expired tenders works at SAST midnight
- [x] Unit tests pass for timezone and format utilities
