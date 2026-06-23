## Metadata

| Field | Value |
|-------|-------|
| **Prompt** | 09-forms-data-capture.md |
| **Date** | 2026-06-14 |
| **Auditor** | Codex |
| **Scope** | Tender, project, PO, delivery, completion, validation, and mobile form UX |
| **Depends On** | 01-codebase-audit.md, 03-tender-management.md, 04-project-management.md |

---

## Executive Summary

The app uses React Hook Form and Zod for core tender/project/PO forms, which is a strong technical base. The forms are still too flat for complex operational data capture: they lack draft saving, review steps, contextual required fields, document evidence, itemized PO lines, delivery note capture, and completion confirmation. Improving form structure and validation will directly improve workflow reliability.

**Overall Score: 5.6/10**

| Area | Score | Trend |
|------|-------|-------|
| Validation base | 7/10 | -> |
| Form structure | 5/10 | -> |
| Data completeness | 5/10 | -> |
| Mobile form UX | 5/10 | -> |
| Error recovery | 5/10 | -> |

---

## Current State

### What Exists Today

Tender form captures tender number, client, status, description, closing date, validity, value, contact, briefing details, and disabled document upload placeholder. Project form captures project number, client, related tender, status, description. PO form captures PO number, project, supplier, description, total amount, status, PO date, expected delivery date, delivery address. Extension form exists for tender validity extensions. Result/follow-up/delivery/completion forms are missing or represented as status buttons.

### Architecture Notes

Forms use `react-hook-form`, `@hookform/resolvers/zod`, Zod schemas, shadcn form primitives, and server actions. Validation is mostly field-level; business-transition validation is limited.

---

## Findings

### Critical Issues

| # | Issue | Location | Impact | Effort |
|---|-------|----------|--------|--------|
| C1 | PO line items and delivery note forms are missing. | `POForm`, `PODetails`, `server/purchase-orders.ts` | Partial delivery cannot be recorded. | L |
| C2 | Tender document/proof upload is disabled in the visible form/detail UI. | `TenderForm`, `TenderDetails` | Compliance and submission evidence cannot be captured. | M |

### Major Issues

| # | Issue | Location | Impact | Effort |
|---|-------|----------|--------|--------|
| M1 | Forms are long single-page layouts instead of task-based steps. | Tender/project/PO forms | Users have more scrolling, weaker completion context, and poor mobile flow. | M |
| M2 | Status transitions do not use dedicated forms for required data. | `TenderDetails`, `PODetails` | Submitted/awarded/lost/delivered statuses can be incomplete. | M |
| M3 | No save-as-draft pattern. | Forms | Long tender/project capture can be lost or rushed. | M |
| M4 | Project form omits contract fields available in schema. | `ProjectForm` | Manually created projects lack contract dates/value/doc references. | M |
| M5 | Validation does not fully enforce business rules. | validation files/server actions | Missing proof, impossible dates, over-delivery, and completion rules can slip through. | M |

### Minor Issues

| # | Issue | Location | Impact | Effort |
|---|-------|----------|--------|--------|
| m1 | Some errors use generic `alert` instead of inline/toast patterns. | PO/tender details and forms | Poor recovery and accessibility. | S |
| m2 | Required markers are inconsistent with conditional requirements. | Forms | Users may not know what is required for the selected status. | S |
| m3 | Selected client/project info panels are useful but visually repetitive. | Forms | Could be converted to compact context panels. | S |

---

## Recommendations

### Quick Wins (1-2 days)

1. **Add transition-specific dialogs**
   - What: Submitted dialog with submitted date/proof; Lost dialog with reason; Delivered dialog with delivery evidence.
   - Where: `TenderDetails`, `PODetails`
   - Expected outcome: Better data quality without rebuilding every form.

2. **Improve PO search/form validation copy**
   - What: Include PO number in search and add clearer date/amount errors.
   - Where: `server/purchase-orders.ts`, `POForm`
   - Expected outcome: Less user confusion.

### Short-Term (1-2 weeks)

1. **Convert tender form to a stepper**
   - What: Basic details, dates/briefing, contacts, documents/checklist, review.
   - Where: `TenderForm`
   - Expected outcome: Easier tender capture and mobile use.

2. **Add project contract section**
   - What: Capture award value, contract start/end, signed contract reference/document.
   - Where: `ProjectForm`, validations
   - Expected outcome: Project records reflect award handoff.

### Medium-Term (1-3 months)

1. **Build PO line-item and delivery forms**
   - What: Line item editor, delivery note form, delivered quantity validation, completion review.
   - Where: PO form/detail/server actions
   - Expected outcome: Accurate partial delivery tracking.

2. **Add draft autosave**
   - What: Save long tender/project/PO forms as drafts before final submission.
   - Where: form state, DB draft status/fields
   - Expected outcome: Safer long-running data capture.

---

## Component Inventory

| Component | Current State | Recommended State | Priority |
|-----------|--------------|-------------------|----------|
| Tender form | Long card grid | Multi-step form with documents/review | P1 |
| Project form | Basic fields | Add contract/award details and handoff context | P1 |
| PO form | Header-only | Header + line items + delivery expectations | P0 |
| Extension form | Exists | Integrate with timeline and validation | P1 |
| Follow-up form | Missing | Add due date, contact, notes, outcome | P0 |
| Result form | Missing | Add award/loss/cancel data and proof | P0 |
| Delivery form | Missing | Delivery note + item quantities | P0 |

---

## Cross-References

### Dependencies (findings this prompt consumed)

| Prompt | Key Finding Used |
|--------|------------------|
| 01-codebase-audit | Forms exist but miss documents, line items, and transition guardrails. |
| 03-tender-management | Tender workflow requires checklist, proof, follow-up, result forms. |
| 04-project-management | PO workflow requires item and delivery capture. |

### Outputs (findings to pass forward)

| Prompt | Key Finding to Consume |
|--------|------------------------|
| 10-deliverables-roadmap | Form upgrades should be phased around workflow risk: PO delivery and tender proof first. |

---

## Implementation Notes

### Affected Files

```text
apps/tracker/src/components/tenders/tender-form.tsx
apps/tracker/src/components/tenders/tender-details.tsx
apps/tracker/src/components/projects/project-form.tsx
apps/tracker/src/components/purchase-orders/po-form.tsx
apps/tracker/src/components/purchase-orders/po-details.tsx
apps/tracker/src/lib/validations/tender.ts
apps/tracker/src/lib/validations/project.ts
apps/tracker/src/lib/validations/purchase-order.ts
apps/tracker/src/server/tenders.ts
apps/tracker/src/server/projects.ts
apps/tracker/src/server/purchase-orders.ts
```

### New Files Required

```text
apps/tracker/src/components/forms/form-stepper.tsx
apps/tracker/src/components/tenders/tender-submission-dialog.tsx
apps/tracker/src/components/tenders/tender-result-dialog.tsx
apps/tracker/src/components/tenders/follow-up-form.tsx
apps/tracker/src/components/purchase-orders/po-line-items-form.tsx
apps/tracker/src/components/purchase-orders/delivery-note-form.tsx
```

### Database Changes

- [ ] Add draft/status fields where needed.
- [ ] Add follow-up/result/submission proof fields or tables.
- [ ] Ensure PO delivery tables support over-delivery validation and audit history.

### API Changes

- [ ] Add transition-specific server actions and validation schemas.

---

## Open Questions

- [ ] Should draft records be visible in registers or only to their creator?
- [ ] Which fields are legally/commercially required before submission, award, delivery, and closeout?

---

## Appendix

### Screenshots / Visual References

Not captured in this audit pass.

### Research Sources

- W3C Error Identification: https://www.w3.org/WAI/WCAG22/Understanding/error-identification.html
- W3C Error Suggestion: https://www.w3.org/WAI/WCAG22/Understanding/error-suggestion.html
- W3C Labels or Instructions: https://www.w3.org/WAI/WCAG22/Understanding/labels-or-instructions.html
