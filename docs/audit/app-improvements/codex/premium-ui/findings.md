## Metadata

| Field | Value |
|-------|-------|
| **Prompt** | 07-premium-ui.md |
| **Date** | 2026-06-14 |
| **Auditor** | Codex |
| **Scope** | Premium SaaS UI direction and component system for Tracker |
| **Depends On** | 01-codebase-audit.md |

---

## Executive Summary

Tracker has a usable shadcn/Tailwind component base, but the visual system is not yet strong enough for a premium operational SaaS product. The main improvement is to create an information-dense, restrained design language with consistent status semantics, operational cards, timelines, checklists, and mobile register cards. Current screens should move away from generic admin panels toward workflow dashboards that make risk, deadlines, and next actions visually obvious.

**Overall Score: 6/10**

| Area | Score | Trend |
|------|-------|-------|
| Component foundation | 7/10 | -> |
| Status system | 5/10 | -> |
| Visual hierarchy | 6/10 | -> |
| Operational density | 5/10 | -> |

---

## Current State

### What Exists Today

The app uses shadcn-style components (`Button`, `Card`, `Badge`, `Tabs`, `Table`, `Dialog`, `Sheet`, `Sidebar`, `MetricCard`) and lucide icons. Dashboard and overview pages use KPI cards and grids. Register pages use desktop tables, with mobile cards implemented for projects and POs but not tenders. Status colors are locally defined in several files.

### Architecture Notes

Styling is Tailwind-based with component variants. There is no central status-token or semantic color registry. Component polish varies by module: dashboard cards include backdrop/shadow treatment, tender and project details use simpler cards, and forms use long card grids.

---

## Findings

### Critical Issues

| # | Issue | Location | Impact | Effort |
|---|-------|----------|--------|--------|
| C1 | No shared status design system for tender/project/PO states. | `tenders-table.tsx`, `tender-details.tsx`, `po-list.tsx`, `project-list.tsx` | Status meaning is inconsistent and harder to learn. | S |

### Major Issues

| # | Issue | Location | Impact | Effort |
|---|-------|----------|--------|--------|
| M1 | Visual hierarchy does not prioritize operational risk strongly enough. | Dashboard, tender/project/PO overviews | Managers and admins must interpret raw counts instead of seeing urgent states first. | M |
| M2 | Missing premium workflow components: pipeline board, progress cards, document checklist, activity timeline, follow-up log, delivery progress. | `components/tenders`, `components/projects`, `components/purchase-orders` | UI cannot express the intended lifecycle cleanly. | M |
| M3 | Form pages use large card grids without a guided stepper or review state. | `TenderForm`, `ProjectForm`, `POForm` | Complex data capture feels heavy and undifferentiated. | M |
| M4 | Empty/loading/error states are generic and inconsistently applied. | Registers and details | Lower perceived quality; users get little guidance on recovery. | S |

### Minor Issues

| # | Issue | Location | Impact | Effort |
|---|-------|----------|--------|--------|
| m1 | Some card styling uses blur/shadows inconsistently. | Dashboard vs detail pages | Screens feel assembled from different systems. | S |
| m2 | Copy and labels are sometimes generic or mismatched to procurement. | Project/PO pages | Reduces domain confidence. | S |

---

## Recommendations

### Quick Wins (1-2 days)

1. **Create shared status UI maps**
   - What: Centralize label, color, icon, tone, and sort order for tender/project/PO statuses.
   - Where: `apps/tracker/src/lib/status-ui.ts`
   - Expected outcome: Consistent status recognition.

2. **Define operational card variants**
   - What: Add variants for KPI, deadline, risk, progress, action, and empty-state cards.
   - Where: `components/ui/metric-card.tsx`, shared card wrappers
   - Expected outcome: Cleaner hierarchy without bespoke styling per page.

### Short-Term (1-2 weeks)

1. **Build premium workflow components**
   - What: Pipeline board, timeline, checklist, follow-up log, extension history, delivery progress, PO line item table.
   - Where: `components/tenders`, `components/projects`, `components/purchase-orders`
   - Expected outcome: UI matches daily operational work.

2. **Refine typography and density**
   - What: Use smaller section headings inside dashboards/details, compact labels, clear metadata rows, and consistent 4/8px spacing.
   - Where: All dashboard/detail/register pages
   - Expected outcome: More premium, information-dense SaaS feel.

### Medium-Term (1-3 months)

1. **Create a Tracker design system layer**
   - What: Add domain components documented in Storybook or an internal component gallery.
   - Where: `packages/ui` or `apps/tracker/src/components/shared`
   - Expected outcome: Faster, consistent implementation across modules.

---

## Component Inventory

| Component | Current State | Recommended State | Priority |
|-----------|--------------|-------------------|----------|
| KPI card | Generic metric card | Add trend, state, risk tone, action affordance | P1 |
| Status badge | Local maps | Centralized semantic variants | P0 |
| Tender pipeline | Basic funnel | Stage board with counts and blocked states | P0 |
| Register table | Module-specific | Shared data table plus mobile card renderer | P0 |
| Activity timeline | Exists in dashboard/profile contexts | Shared timeline for tender/project/PO events | P1 |
| Checklist | Missing | Tender documents/preparation checklist | P0 |
| Delivery progress | Missing | PO line-item progress and outstanding quantities | P0 |
| Filter drawer | Missing | Mobile bottom sheet for filters | P1 |
| Command menu | Missing | Quick navigation and create actions | P2 |

---

## Cross-References

### Dependencies (findings this prompt consumed)

| Prompt | Key Finding Used |
|--------|------------------|
| 01-codebase-audit | Status maps are duplicated; workflow components missing; mobile inconsistency. |

### Outputs (findings to pass forward)

| Prompt | Key Finding to Consume |
|--------|------------------------|
| 06-mobile-ux | Use compact cards, touch-friendly controls, filter drawers, sticky actions. |
| 10-deliverables-roadmap | Build shared status, card, timeline, checklist, and delivery components early. |

---

## Implementation Notes

### Affected Files

```text
apps/tracker/src/components/ui/*
apps/tracker/src/components/dashboard/*
apps/tracker/src/components/tenders/*
apps/tracker/src/components/projects/*
apps/tracker/src/components/purchase-orders/*
apps/tracker/src/app/(dashboard)/**/page.tsx
```

### New Files Required

```text
apps/tracker/src/lib/status-ui.ts
apps/tracker/src/components/shared/status-badge.tsx
apps/tracker/src/components/shared/activity-timeline.tsx
apps/tracker/src/components/shared/quick-action-panel.tsx
apps/tracker/src/components/shared/filter-drawer.tsx
```

### Database Changes

- [ ] None directly, but UI depends on richer statuses and activity records.

### API Changes

- [ ] Add APIs/server actions for queue counts, activity timelines, and workflow state.

---

## Open Questions

- [ ] Should design tokens live in `packages/ui` for admin reuse or remain Tracker-local?
- [ ] Does PMG want light-only, dark-only, or fully themed operational screens?

---

## Appendix

### Screenshots / Visual References

Not captured in this audit pass.

### Research Sources

- Material Design 3 navigation and component guidance: https://m3.material.io/
- W3C target size and reflow guidance: https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html and https://www.w3.org/WAI/WCAG22/Understanding/reflow.html
- Cooperative dashboard heuristics: https://arxiv.org/abs/2308.04514
