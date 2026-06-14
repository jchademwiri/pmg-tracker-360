# 09 – Forms and Data Capture UX

**Purpose:** Audit all forms in the Tracker app and recommend UX improvements for data entry workflows.

**Depends on:** [01-codebase-audit.md](./01-codebase-audit.md), [03-tender-management.md](./03-tender-management.md), [04-project-management.md](./04-project-management.md)
**Feeds into:** [10-deliverables-roadmap.md](./10-deliverables-roadmap.md)

---

## Task

Audit and improve every form in the Tracker app for better usability, validation, and data quality.

---

## A. Forms to Audit

### Tender Forms
- Adding a tender
- Editing a tender
- Recording tender follow-ups
- Recording extensions
- Recording results

### Project Forms
- Creating a project
- Creating a purchase order
- Recording partial delivery
- Completing a PO
- Completing a project

## B. Current Form Issues

For each form, identify:
- Missing fields that should be captured
- Unnecessary fields that add friction
- Poor field grouping and layout
- Missing inline validation
- Poor error messages
- Missing confirmation screens
- No draft saving capability
- No progress indication for long forms

## C. Recommended Improvements

### Form Structure
- Multi-step forms for complex data entry
- Smart defaults based on context
- Required field grouping and visual hierarchy
- Conditional fields that appear based on selections
- Logical field ordering and flow

### Validation and Feedback
- Inline validation with helpful error messages
- Success messages and confirmation screens
- Better error recovery guidance
- Field-level help text and tooltips

### Data Entry Efficiency
- Save as draft capability
- Auto-generated statuses and defaults
- Attachment uploads with drag-and-drop
- Date pickers and time pickers
- Auto-complete and search-as-you-type
- Bulk actions where applicable

### Form UX Patterns
- Stepper/progress indicator for multi-step forms
- Review step before final submission
- Ability to go back and edit previous steps
- Keyboard shortcuts for common actions
- Mobile-optimised form layouts

---

## Output Format

Write your findings to `docs/audit/app-improvements/[your-name]/forms-data-capture/findings.md` using the standard template defined in [`FINDINGS-TEMPLATE.md`](./FINDINGS-TEMPLATE.md).

- Replace `[Prompt]` in the metadata with `09-forms-data-capture.md`
- Fill in all sections — delete any that don't apply
- Use the scoring rubric (1-10) consistently across all findings
- List cross-referenced findings in the Cross-References section of the template

---

## Cross-References

- **Depends on:** [01-codebase-audit.md](./01-codebase-audit.md), [03-tender-management.md](./03-tender-management.md), [04-project-management.md](./04-project-management.md)
- **Next:** [10-deliverables-roadmap.md](./10-deliverables-roadmap.md)
- **Related:** [06-mobile-ux.md](./06-mobile-ux.md) (mobile form UX), [07-premium-ui.md](./07-premium-ui.md) (form visual design)
- **See also:** [00-index.md](./00-index.md) for full execution strategy
