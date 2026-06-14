## Metadata

| Field | Value |
|-------|-------|
| **Prompt** | 08-navigation.md |
| **Date** | 2026-06-14 |
| **Auditor** | Codex |
| **Scope** | Sidebar, module navigation, breadcrumbs, quick actions, mobile navigation, and IA recommendations |
| **Depends On** | 01-codebase-audit.md, 02-dashboard-audit.md, 03-tender-management.md, 04-project-management.md |

---

## Executive Summary

The current navigation is compact and understandable, but it under-represents the actual tender-to-project workflow. It includes Dashboard, Calendar, Reports, Clients, Tender Pipeline overview/register, and Project Tracking overview/active projects/purchase orders. It lacks direct access to follow-ups, submitted/awarded tenders, tender calendar, deliveries, overdue items, project reports, and contextual module tabs. The recommended IA should keep the sidebar high-level while adding workflow subroutes, page tabs, breadcrumbs, badge counts, and mobile bottom/drawer patterns.

**Overall Score: 6/10**

| Area | Score | Trend |
|------|-------|-------|
| Sidebar structure | 6/10 | -> |
| Workflow fit | 5/10 | -> |
| Active states | 7/10 | -> |
| Mobile navigation | 5/10 | -> |

---

## Current State

### What Exists Today

Navigation data is defined in `apps/tracker/src/data/dashboad-links.ts`. Sidebar groups are “Overview” with Dashboard, Calendar, Reports, and “Procurement Cycle” with Clients Directory, Tender Pipeline (Overview, Tender Register), and Project Tracking (Overview, Active Projects, Purchase Orders). Purchase Orders are hidden for the `member` role. `NavMain` handles active state by pathname/query and expands active groups after hydration. Dashboard layout includes `DynamicBreadcrumb`, `SidebarTrigger`, and `NotificationBell`.

### Architecture Notes

The sidebar uses shadcn sidebar primitives and is collapsible to icon. There is no command palette, no mobile bottom nav, no badge counts on nav items, and no module-level tab system beyond individual detail tabs.

---

## Findings

### Critical Issues

| # | Issue | Location | Impact | Effort |
|---|-------|----------|--------|--------|
| C1 | Navigation does not expose key workflow queues such as follow-ups, awarded tenders, deliveries, and overdue items. | `dashboad-links.ts` | Users must know where to search instead of following the work. | M |

### Major Issues

| # | Issue | Location | Impact | Effort |
|---|-------|----------|--------|--------|
| M1 | Tender Management is labeled “Tender Pipeline” and only has overview/register. | Sidebar data | Missing Add Tender, Calendar, Follow-ups, Submitted, Awarded, Reports. | S |
| M2 | Project Management is labeled “Project Tracking” and lacks delivery/overdue/report destinations. | Sidebar data | PO delivery work is hidden under global PO list. | M |
| M3 | Sidebar mixes clients into procurement cycle as a peer workflow step. | Sidebar data | Clients are a reference directory, not a lifecycle module. | S |
| M4 | No nav badge counts for urgent queues. | Sidebar/nav components | Users cannot see pending work from navigation. | M |
| M5 | Mobile navigation relies on sidebar drawer/collapse only. | Layout/sidebar | Frequent mobile workflows need faster access to Dashboard, Tenders, Projects, POs, More. | M |

### Minor Issues

| # | Issue | Location | Impact | Effort |
|---|-------|----------|--------|--------|
| m1 | `dashboadLinks` typo hurts maintainability. | `dashboad-links.ts` | Small developer friction. | S |
| m2 | Current active state suppresses status query state when no target query exists. | `NavMain` | Filtered register links may need careful active-state rules. | S |

---

## Recommendations

### Quick Wins (1-2 days)

1. **Rename navigation groups**
   - What: Use “Tender Management” and “Project Management”.
   - Where: `dashboad-links.ts`
   - Expected outcome: Clearer business language.

2. **Add direct workflow links**
   - What: Add Tender Register, Add Tender, Follow-ups, Submitted, Awarded; Project Register, Add Project, Purchase Orders, Deliveries, Overdue Items.
   - Where: `dashboad-links.ts`
   - Expected outcome: Users can reach common queues directly.

### Short-Term (1-2 weeks)

1. **Add module page tabs**
   - What: On `/tenders` and `/projects`, add tabs for overview/register/calendar/follow-ups and overview/register/POs/deliveries.
   - Where: tender/project layout or shared module nav
   - Expected outcome: Sidebar stays sane while modules have depth.

2. **Add nav badge counts**
   - What: Badge counts for follow-ups due, closing soon, overdue deliveries, unread notifications.
   - Where: nav data server wrapper + `NavMain`
   - Expected outcome: Navigation becomes an alert surface.

### Medium-Term (1-3 months)

1. **Add command palette**
   - What: Keyboard-accessible quick create/search navigation.
   - Where: app shell
   - Expected outcome: Power users can jump to tenders/projects/POs quickly.

---

## Component Inventory

| Component | Current State | Recommended State | Priority |
|-----------|--------------|-------------------|----------|
| Sidebar | Two groups, nested items | Workflow-aware modules with badge counts | P0 |
| Breadcrumbs | Present | Keep, add better labels for dynamic entities | P1 |
| Module tabs | Mostly absent | Tenders/projects secondary nav | P1 |
| Quick actions | Page buttons | Contextual per-module create/update actions | P1 |
| Mobile nav | Sidebar trigger | Bottom nav + More drawer | P1 |
| Command palette | Missing | Global search/create/jump menu | P2 |

---

## Cross-References

### Dependencies (findings this prompt consumed)

| Prompt | Key Finding Used |
|--------|------------------|
| 01-codebase-audit | Current sidebar structure and missing workflow links. |
| 02-dashboard-audit | Dashboard cards should deep-link to filtered workflow pages. |
| 03-tender-management | Tender workflow needs follow-up/submitted/awarded/calendar access. |
| 04-project-management | Project workflow needs deliveries/overdue/PO access. |

### Outputs (findings to pass forward)

| Prompt | Key Finding to Consume |
|--------|------------------------|
| 10-deliverables-roadmap | Navigation cleanup should be Phase 1 because it unlocks every workflow. |

---

## Implementation Notes

### Affected Files

```text
apps/tracker/src/data/dashboad-links.ts
apps/tracker/src/components/shared/navigation/app-sidebar.tsx
apps/tracker/src/components/shared/navigation/nav-main.tsx
apps/tracker/src/app/(dashboard)/layout.tsx
apps/tracker/src/components/dynamic-breadcrumb.tsx
```

### New Files Required

```text
apps/tracker/src/components/shared/navigation/module-tabs.tsx
apps/tracker/src/components/shared/navigation/mobile-bottom-nav.tsx
apps/tracker/src/components/shared/navigation/command-menu.tsx
```

### Database Changes

- [ ] None directly; badge counts need query support.

### API Changes

- [ ] Add nav count/server helper for follow-ups, closing soon, overdue deliveries, unread notifications.

---

## Open Questions

- [ ] Should Clients remain in primary nav or move under System/Reference Data?
- [ ] Should Purchase Orders be a top-level module or remain under Projects?

---

## Appendix

### Screenshots / Visual References

Not captured in this audit pass.

### Research Sources

- Material Design 3 navigation drawer and bar guidance: https://m3.material.io/components/navigation-drawer/guidelines and https://m3.material.io/components/navigation-bar/guidelines
- W3C target size minimum for touch navigation: https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html
