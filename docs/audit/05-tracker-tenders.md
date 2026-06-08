# Tracker App — Tenders Module Audit

**Area:** Tenders  
**Priority:** 🔴 Critical  
**Est. Effort:** 2-3 days  
**Related Issues:** #1, #8, #9, #22

---

## Tenders Module

### Current State
- Overview page with 5 stat cards, upcoming deadlines, recent activity
- Comprehensive tender form with: basic info, submission details, contact info, briefing session, documents
- Status-based filtering (open, evaluation, closed, awarded, lost)
- Search, sort, and pagination
- Client inline creation via `ClientCreateDialog`

### Issues Found
| # | Severity | Issue |
|---|----------|-------|
| 1 | 🔴 High | **Document upload placeholder** — The documents section shows "Document upload is currently unavailable — Coming soon in a future update." This is a critical missing feature for a tender management system. |
| 2 | 🟡 Medium | **Value displayed as `$`** — Tender overview shows `$` for total value, but the form uses `R` (South African Rand). Inconsistent currency display. |
| 3 | 🟡 Medium | **No bulk status update** — Cannot select multiple tenders and change their status at once. |
| 4 | 🟡 Medium | **Form complexity** — The tender form has 4 cards with many fields. Consider a stepped/wizard approach for new users. |
| 5 | 🟢 Low | **No tender duplication** — Cannot duplicate an existing tender to create a similar one quickly. |

### Suggestions
- **Implement document upload** — This is critical for tender management
- Fix currency display to use `R` (ZAR) consistently
- Add bulk status update functionality
- Consider a stepped form wizard for tender creation
- Add "Duplicate Tender" action

---

## Files to Modify

- `apps/tracker/src/components/tenders/tender-form.tsx` — Document upload, form wizard
- `apps/tracker/src/app/(dashboard)/tenders/overview/page.tsx` — Currency display fix
- `apps/tracker/src/app/(dashboard)/tenders/overview/client-wrapper.tsx` — Bulk status update
