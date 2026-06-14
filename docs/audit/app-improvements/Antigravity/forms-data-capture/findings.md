# Findings – 09-forms-data-capture.md

## Metadata

| Field | Value |
|-------|-------|
| **Prompt** | 09-forms-data-capture.md |
| **Date** | 2026-06-14 |
| **Auditor** | Antigravity |
| **Scope** | Audit of form schemas, Zod validations, data capture interfaces, and input flows. |
| **Depends On** | 01-codebase-audit.md, 03-tender-management.md, 04-project-management.md |

---

## Executive Summary

The Tracker monorepo uses **React Hook Form** with **Zod validation schemas** to ensure clean data validation before database writes. Long fields are arranged into two-column grids on desktop and wrap to one column on mobile.

However, the forms are limited in functionality. The Purchase Order creation form has no inputs to add itemized ordered items, forcing users to manually input the total budget. Furthermore, there is no interface to record partial deliveries or upload Proof of Delivery (POD) notes. Long forms also lack auto-save draft functionality, which can result in data loss if the session expires.

**Overall Score: 5.5/10**

| Area | Score | Trend |
|------|-------|-------|
| Validation & Schema Integrity | 8.0/10 | ↑ |
| Form Layout & Data Entry Usability | 5.5/10 | → |
| Functional Form Coverage | 3.0/10 | ↓ |

---

## Current State

### What Exists Today

1. **Zod Form Resolver Schemas:**
   - **`tender-form.tsx`**: Uses `TenderCreateSchema` to validate fields like description, tender number, value, and validity days.
   - **`po-form.tsx`**: Uses `poFormSchema` to validate numbers, suppliers, and descriptions. Includes a custom refinement that `expectedDeliveryDate` must be after `poDate`.

2. **Dialog Form Triggers:**
   - Form modals (like `ClientCreateDialog` and `ProjectCreateDialog`) allow users to create clients or projects on the fly without leaving their current page context.

3. **Drag and Drop Uploader (`file-uploader.tsx`):**
   - Reusable file upload area with drag-and-drop feedback, loading states, and size constraints.

### Architecture Notes

- Forms leverage standard Shadcn `<Form>` elements for accessible inline error rendering (`<FormMessage />`).
- State variables check for active pending states (`useTransition()`) to disable buttons during submissions.

---

## Findings

### Critical Issues

| # | Issue | Location | Impact | Effort |
|---|-------|----------|--------|--------|
| C1 | **No PO Line Items Input Grid** | `po-form.tsx` | Described in codebase audit. Users cannot add multiple items to a PO, forcing them to manually type a total price. | M |
| C2 | **No Partial Delivery Form** | Codebase | Described in codebase audit. There is no form to capture delivery note numbers, upload POD files, or input quantities. | L |

### Major Issues

> Issues that significantly degrade UX or operational efficiency.

| # | Issue | Location | Impact | Effort |
|---|-------|----------|--------|--------|
| M1 | **No Save-as-Draft or Auto-Save** | `tender-form.tsx`, `po-form.tsx` | Forms lack local storage or draft tables. Any network dropout or tab reload deletes all entered fields. | M |
| M2 | **Manual Date Computations** | `tender-form.tsx` | Bidders must manually calculate the validity expiry date instead of the form deriving it automatically. | S |

### Minor Issues

> Polish items, inconsistencies, and small UX improvements.

| # | Issue | Location | Impact | Effort |
|---|-------|----------|--------|--------|
| m1 | **Missing Keyboard Shortcuts** | All forms | Form submissions require clicking the primary button rather than supporting keyboard shortcuts like `Cmd+Enter`. | S |
| m2 | **Inconsistent Placeholder Labels** | Forms | Inconsistent placeholder texts across fields (some list formatting examples, others are blank), reducing input clarity. | S |

---

## Recommendations

### Quick Wins (1-2 days)

1. **Auto-Format Numeric Currencies**
   - **What**: Format currency values as they are typed (e.g. typing `10000` changes to `10 000,00` or fits the currency structure).
   - **Where**: `tender-form.tsx` and `po-form.tsx` (total amount field).
   - **Expected outcome**: Clear visual feedback on large numbers.

2. **Add Submit Keyboard Shortcuts**
   - **What**: Bind `Cmd+Enter` or `Ctrl+Enter` to submit forms when a textarea or input is focused.
   - **Where**: React form wrapper hooks.
   - **Expected outcome**: Faster data entry for desktop users.

### Short-Term (1-2 weeks)

1. **Implement Auto-Save Draft Hook**
   - **What**: Create a `useFormDraft` hook that saves form states to `localStorage` periodically, restoring inputs if the user reloads the page.
   - **Where**: `apps/tracker/src/hooks/use-form-draft.ts` (new file)
   - **Expected outcome**: Prevents data loss during form completion.

2. **Build PO Line Item Grid Component**
   - **What**: Add an editable grid inside the PO form that allows adding rows with item description, quantity, and unit price. Calculate the total PO amount dynamically.
   - **Where**: `apps/tracker/src/components/purchase-orders/po-form.tsx`
   - **Expected outcome**: Eliminates manually calculated PO totals.

### Medium-Term (1-3 months)

1. **Build the Mobile-Friendly Delivery Capture Flow**
   - **What**: Design a multi-step mobile wizard for site managers:
     - **Step 1**: Select PO & Enter Delivery Note Number.
     - **Step 2**: Snap/upload photo of the signed POD document.
     - **Step 3**: Display a list of ordered line items and input quantities received.
     - **Step 4**: Review page and tap submit.
   - **Expected outcome**: Fast and accurate inventory logs.

---

## Component Inventory

| Component | Current State | Recommended State | Priority |
|-----------|--------------|-------------------|----------|
| **File Uploader** | Basic drop area. | Add file-type icons and multi-file queue listings. | P1 |
| **PO Form** | Flat text fields. | Add editable items grid and auto-sum currency outputs. | P0 |
| **Delivery Receipt Wizard** | Does not exist. | Create a multi-step bottom sheet form for mobile browsers. | P0 |

---

## Cross-References

### Dependencies (findings this prompt consumed)

| Prompt | Key Finding Used |
|--------|------------------|
| 01-codebase-audit.md | Layout parameters and form files like `tender-form.tsx` and uploader components. |
| 03-tender-management.md | Validity date formulas and document checklists. |
| 04-project-management.md | PO status fields and delivery note tables. |

### Outputs (findings to pass forward)

| Prompt | Key Finding to Consume |
|--------|------------------------|
| 10-deliverables-roadmap.md | Scheduling form validation and uploader updates in rollout phases. |

---

## Implementation Notes

### Affected Files

```
apps/tracker/src/components/tenders/tender-form.tsx
apps/tracker/src/components/purchase-orders/po-form.tsx
apps/tracker/src/lib/validations/purchase-order.ts
```

### New Files Required

```
apps/tracker/src/hooks/use-form-draft.ts
apps/tracker/src/components/purchase-orders/po-line-items-grid.tsx
```

### Database Changes

*None.*

### API Changes

*None.*
