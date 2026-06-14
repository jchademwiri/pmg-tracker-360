# Findings: Forms and Data Capture UX

---

## Metadata

| Field | Value |
|-------|-------|
| **Prompt** | 09-forms-data-capture.md |
| **Date** | 2026-06-14 |
| **Auditor** | Buffy (AI Audit) |
| **Scope** | Forms audit and data capture UX |
| **Depends On** | 01, 03, 04 |

---

## Executive Summary

The app has several complex forms (tender, project, PO, client) that are functional but suffer from being single-page with many fields. The tender form is particularly overwhelming with 15+ fields on one page. Validation exists via Zod but error messages could be more helpful. There is no draft saving, no multi-step flow, and no progress indication. Document upload is disabled across all forms.

**Overall Score: 4/10**

| Area | Score | Trend |
|------|-------|-------|
| Form Structure | 4/10 | → |
| Validation & Feedback | 5/10 | → |
| Data Entry Efficiency | 3/10 | ↓ |
| Mobile Forms | 2/10 | ↓ |
| Draft Saving | 1/10 | ↓ |

---

## Current State

### Forms to Audit

| Form | Location | Fields | Complexity |
|------|----------|--------|------------|
| Tender Form | `tender-form.tsx` | 15+ fields | High — single page |
| Project Form | `project-form.tsx` | 10 fields | Medium — single page |
| PO Form | `po-form.tsx` | 8+ fields + line items | High — dynamic line items |
| Client Form | `client-form.tsx` | 5 fields | Low — simple |

### Current Form Features
- Zod validation with error messages
- React Hook Form integration
- Inline client creation from tender form
- Dynamic line items in PO form
- Document upload (disabled — "currently unavailable")
- No draft saving
- No multi-step flow
- No progress indication

---

## Findings

### Critical Issues

| # | Issue | Location | Impact | Effort |
|---|-------|----------|--------|--------|
| C1 | Document upload is disabled across all forms | `tender-form.tsx:784`, `tender-details.tsx:682` | Cannot attach supporting documents | M |
| C2 | No draft saving — complex forms must be completed in one sitting | All forms | Data loss risk, form abandonment | M |

### Major Issues

| # | Issue | Location | Impact | Effort |
|---|-------|----------|--------|--------|
| M1 | Tender form is overwhelming — 15+ fields on single page | `tender-form.tsx` | Errors, abandonment, cognitive overload | M |
| M2 | No multi-step flow for complex forms | All complex forms | No progressive disclosure | M |
| M3 | No progress indication on long forms | All forms | Users don't know how much is left | S |
| M4 | Error messages are generic — not field-specific guidance | `tender-form.tsx` | Users don't know how to fix errors | S |
| M5 | No conditional fields — all fields shown regardless of context | All forms | Unnecessary friction | S |
| M6 | PO line items don't validate quantity vs delivery | `po-form.tsx` | Can submit inconsistent data | S |

### Minor Issues

| # | Issue | Location | Impact | Effort |
|---|-------|----------|--------|--------|
| m1 | Date pickers don't show business day awareness | Various | Users may select weekends | S |
| m2 | No auto-save indicator | All forms | Users unsure if data is saved | S |
| m3 | Client creation inline doesn't refresh parent form | `tender-form.tsx` | Must manually refresh | S |
| m4 | No field-level help text or tooltips | All forms | Complex fields unclear | S |
| m5 | Form submission buttons are not disabled during submission | Various | Double-submit risk | S |

---

## Recommendations

### Quick Wins (1-2 days)

1. **Re-enable document upload**
   - What: Fix the disabled document upload in tender and project forms
   - Where: `tender-form.tsx`, `tender-details.tsx`, `document-manager.tsx`
   - Expected outcome: Users can attach documents immediately

2. **Add form submission protection**
   - What: Disable submit button during submission, show loading state
   - Where: All form components
   - Expected outcome: Prevent double-submits

3. **Add field-level help text**
   - What: Add tooltips or help text to complex fields
   - Where: Form field components
   - Expected outcome: Users understand what to enter

### Short-Term (1-2 weeks)

1. **Break tender form into multi-step flow**
   - What: Step 1: Basic Info → Step 2: Dates & Deadlines → Step 3: Contact & Briefing → Step 4: Review
   - Where: `tender-form.tsx`, new step components
   - Expected outcome: Reduced cognitive overload

2. **Implement draft saving**
   - What: Auto-save form state to localStorage, restore on return
   - Where: New `useFormDraft` hook, all complex forms
   - Expected outcome: No data loss on abandonment

3. **Add conditional fields**
   - What: Show/hide fields based on context (e.g., briefing fields only when briefing is mandatory)
   - Where: Form components with conditional rendering
   - Expected outcome: Reduced form complexity

### Medium-Term (1-3 months)

1. **Build form wizard component**
   - What: Reusable multi-step form wizard with progress bar, back/next, and review step
   - Where: New `FormWizard` component
   - Expected outcome: Consistent multi-step experience

2. **Add form analytics**
   - What: Track form completion rates, abandonment points, and error frequency
   - Where: Analytics integration
   - Expected outcome: Data-driven form optimisation

---

## Cross-References

### Dependencies (findings this prompt consumed)

| Prompt | Key Finding Used |
|--------|------------------|
| 01-codebase-audit | Document upload disabled; forms use React Hook Form + Zod |
| 03-tender-management | Tender form is complex; follow-up and result forms needed |
| 04-project-management | PO form needs draft saving; delivery recording needs UI |

### Outputs (findings to pass forward)

| Prompt | Key Finding to Consume |
|--------|------------------------|
| 10-deliverables-roadmap | Multi-step form wizard and draft saving are foundational UX improvements |

---

## Implementation Notes

### New Files Required

```
components/shared/forms/form-wizard.tsx
components/shared/forms/form-step-indicator.tsx
hooks/use-form-draft.ts
```
