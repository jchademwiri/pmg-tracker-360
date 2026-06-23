## Metadata

| Field | Value |
|-------|-------|
| **Prompt** | 06-mobile-ux.md |
| **Date** | 2026-06-14 |
| **Auditor** | Codex |
| **Scope** | Mobile navigation, registers, forms, dashboards, details, and touch UX requirements |
| **Depends On** | 01-codebase-audit.md, 02-dashboard-audit.md, 03-tender-management.md, 04-project-management.md |

---

## Executive Summary

Tracker is partially responsive: project and PO registers convert to mobile cards, headers stack, and the sidebar can collapse. Tender registers still rely on horizontal table scroll, complex forms are long card grids, and detail pages keep desktop-style two-column patterns without sticky mobile actions. Mobile should be treated as a first-class operational mode for checking deadlines, updating statuses, recording follow-ups, and confirming deliveries.

**Overall Score: 5.5/10**

| Area | Score | Trend |
|------|-------|-------|
| Mobile registers | 6/10 | -> |
| Mobile forms | 5/10 | -> |
| Mobile navigation | 5/10 | -> |
| Mobile detail actions | 5/10 | -> |

---

## Current State

### What Exists Today

Project and PO lists have `md:hidden` mobile card layouts. Tender list uses a minimum-width table inside horizontal overflow. Forms stack at smaller widths but remain long single-page flows. Dashboard grids collapse reasonably, but action hierarchy is not mobile-specific. Sidebar behavior exists through shadcn sidebar components, but there is no bottom nav or module action bar.

### Architecture Notes

The app has `use-mobile.ts`, `Sheet`, `Sidebar`, `Tabs`, and responsive Tailwind classes available. These are enough to implement bottom sheets, mobile cards, and sticky action bars without new dependencies.

---

## Findings

### Critical Issues

| # | Issue | Location | Impact | Effort |
|---|-------|----------|--------|--------|
| C1 | Tender register has no mobile card mode. | `TendersTable` | Tender administrators cannot efficiently work from phones. | M |

### Major Issues

| # | Issue | Location | Impact | Effort |
|---|-------|----------|--------|--------|
| M1 | Complex forms lack mobile steppers and sticky submit actions. | `TenderForm`, `ProjectForm`, `POForm` | Long scrolling forms are error-prone on mobile. | M |
| M2 | Filters are inline, not mobile bottom sheets/drawers. | Registers | Search/filter controls compete with results on small screens. | M |
| M3 | Detail pages do not provide sticky primary actions. | `TenderDetails`, project detail, `PODetails` | Users must scroll to act on status, follow-up, delivery, or edit. | M |
| M4 | Tables/cards do not prioritize mobile risk information consistently. | Tender/project/PO lists | Closing date, overdue state, delivery risk, and next action are not always first. | S |

### Minor Issues

| # | Issue | Location | Impact | Effort |
|---|-------|----------|--------|--------|
| m1 | Button groups can wrap awkwardly in page headers. | Dashboard/tender/project/PO headers | Mobile top sections feel crowded. | S |
| m2 | Some mobile cards use low-contrast hardcoded text classes. | `ProjectList`, `POList` | Dark mode/readability risk. | S |

---

## Recommendations

### Quick Wins (1-2 days)

1. **Add tender mobile cards**
   - What: Render tender number, client, status, closing date, days left, value, and primary action.
   - Where: `TendersTable`
   - Expected outcome: Tender register becomes usable on mobile.

2. **Add sticky mobile action bars**
   - What: On detail pages, show primary action plus overflow menu at bottom on small screens.
   - Where: `TenderDetails`, `PODetails`, project detail page
   - Expected outcome: Important actions remain reachable.

### Short-Term (1-2 weeks)

1. **Convert filters to mobile drawers**
   - What: Keep search visible, move advanced filters/sort into `Sheet` bottom drawer.
   - Where: tender/project/PO registers
   - Expected outcome: Cleaner list browsing on mobile.

2. **Split complex forms into steps**
   - What: Basic info, dates/status, contact, documents, review.
   - Where: tender/project/PO forms
   - Expected outcome: Lower mobile form abandonment and fewer errors.

### Medium-Term (1-3 months)

1. **Add mobile task mode**
   - What: Compact dashboard queue for today’s actions, follow-ups, briefings, deliveries.
   - Where: dashboard and module overview pages
   - Expected outcome: Phone use supports real field/admin workflows.

---

## Component Inventory

| Component | Current State | Recommended State | Priority |
|-----------|--------------|-------------------|----------|
| Tender register | Horizontal table | Mobile card layout | P0 |
| Project register | Mobile cards exist | Add risk/progress metadata | P1 |
| PO register | Mobile cards exist | Add overdue/partial delivery state | P0 |
| Filters | Inline controls | Search + bottom filter drawer | P1 |
| Detail actions | Sidebar buttons | Sticky mobile action bar | P0 |
| Forms | Long responsive grids | Stepper with review and sticky submit | P1 |
| Dashboard | Collapsed grids | Queue-first mobile dashboard | P1 |

---

## Cross-References

### Dependencies (findings this prompt consumed)

| Prompt | Key Finding Used |
|--------|------------------|
| 01-codebase-audit | Tender mobile table and form/detail issues. |
| 02-dashboard-audit | Mobile dashboard should focus on work queues. |
| 03-tender-management | Tender cards must prioritize closing/briefing/follow-up state. |
| 04-project-management | PO cards must prioritize delivery state and outstanding quantities. |

### Outputs (findings to pass forward)

| Prompt | Key Finding to Consume |
|--------|------------------------|
| 07-premium-ui | Mobile components need shared card/action/filter patterns. |
| 10-deliverables-roadmap | Mobile optimization should happen per component, not as final cleanup only. |

---

## Implementation Notes

### Affected Files

```text
apps/tracker/src/components/tenders/tenders-table.tsx
apps/tracker/src/components/projects/project-list.tsx
apps/tracker/src/components/purchase-orders/po-list.tsx
apps/tracker/src/components/tenders/tender-form.tsx
apps/tracker/src/components/projects/project-form.tsx
apps/tracker/src/components/purchase-orders/po-form.tsx
apps/tracker/src/components/tenders/tender-details.tsx
apps/tracker/src/components/purchase-orders/po-details.tsx
```

### New Files Required

```text
apps/tracker/src/components/shared/filter-drawer.tsx
apps/tracker/src/components/shared/mobile-action-bar.tsx
apps/tracker/src/components/shared/register-card.tsx
```

### Database Changes

- [ ] None directly.

### API Changes

- [ ] Add compact queue data endpoints for mobile dashboards.

---

## Open Questions

- [ ] Are mobile users mainly internal admins, managers, or field delivery users?
- [ ] Should delivery confirmation work offline or low-connectivity?

---

## Appendix

### Screenshots / Visual References

Not captured in this audit pass.

### Research Sources

- W3C target size minimum: https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html
- W3C reflow: https://www.w3.org/WAI/WCAG22/Understanding/reflow.html
- Material Design 3 navigation bar/drawer: https://m3.material.io/components/navigation-bar/guidelines
