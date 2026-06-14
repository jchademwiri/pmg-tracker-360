# 06 – Mobile-Friendly UX Requirements

**Purpose:** The improved UI must work well on mobile. Review and recommend mobile-specific UX patterns for the Tracker app.

**Depends on:** [01-codebase-audit.md](./01-codebase-audit.md), [02-dashboard-audit.md](./02-dashboard-audit.md), [03-tender-management.md](./03-tender-management.md), [04-project-management.md](./04-project-management.md)
**Feeds into:** [07-premium-ui.md](./07-premium-ui.md), [10-deliverables-roadmap.md](./10-deliverables-roadmap.md)

---

## Task

Define mobile-specific UX requirements and recommendations that apply across all dashboard, tender, and project views.

---

## A. Mobile Navigation

- Mobile navigation structure (bottom nav vs sidebar behaviour)
- How to handle deep navigation on small screens
- Swipe gestures and touch-friendly interactions

## B. Table-to-Card Conversion

Suggest how registers should convert to cards on mobile:
- Tender register mobile card layout
- Project register mobile card layout
- PO register mobile card layout
- Which information to prioritise on cards
- How to handle long lists and pagination

## C. Mobile Forms and Actions

- Sticky action buttons
- Mobile-friendly form design
- Step-by-step form flows for complex inputs
- Search and filter drawers (bottom sheets)
- Touch-friendly button sizes and spacing

## D. Mobile Dashboard

- Compact KPI cards for mobile
- How charts and visualisations adapt
- Reduced clutter on small screens
- Priority information hierarchy on mobile

## E. Mobile Detail Pages

- How tender detail pages adapt to mobile
- How project detail pages adapt to mobile
- Tabbed vs stacked sections on mobile
- Action buttons and quick actions on mobile

## F. Mobile-Specific Patterns

- Offline considerations (if applicable)
- Pull-to-refresh patterns
- Loading skeletons on mobile
- Error states on mobile
- Success confirmation patterns on mobile

---

## Output Format

Write your findings to `docs/audit/app-improvements/[your-name]/mobile-ux/findings.md` using the standard template defined in [`FINDINGS-TEMPLATE.md`](./FINDINGS-TEMPLATE.md).

- Replace `[Prompt]` in the metadata with `06-mobile-ux.md`
- Fill in all sections — delete any that don't apply
- Use the scoring rubric (1-10) consistently across all findings
- List cross-referenced findings in the Cross-References section of the template

---

## Cross-References

- **Depends on:** [01-codebase-audit.md](./01-codebase-audit.md), [02-dashboard-audit.md](./02-dashboard-audit.md), [03-tender-management.md](./03-tender-management.md), [04-project-management.md](./04-project-management.md)
- **Next:** [07-premium-ui.md](./07-premium-ui.md), [10-deliverables-roadmap.md](./10-deliverables-roadmap.md)
- **Related:** [08-navigation.md](./08-navigation.md) (navigation architecture), [09-forms-data-capture.md](./09-forms-data-capture.md) (form UX)
- **See also:** [00-index.md](./00-index.md) for full execution strategy
