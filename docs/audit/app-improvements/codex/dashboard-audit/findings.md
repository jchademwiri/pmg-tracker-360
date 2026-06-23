## Metadata

| Field | Value |
|-------|-------|
| **Prompt** | 02-dashboard-audit.md |
| **Date** | 2026-06-14 |
| **Auditor** | Codex |
| **Scope** | Main dashboard content, layout, role targeting, and operational recommendations |
| **Depends On** | 01-codebase-audit.md |

---

## Executive Summary

The current dashboard has a good start: role-aware admin/specialist views, tender KPIs, deadlines, briefing sessions, activity, charts, and quick create actions. It does not yet function as a daily operations cockpit because it lacks task queues, follow-ups due, missing compliance/document alerts, delayed PO/delivery visibility, project health, and workload/assignment views. The dashboard should become a role-specific command center with the first screen answering “what needs attention today?”

**Overall Score: 6/10**

| Area | Score | Trend |
|------|-------|-------|
| Tender visibility | 7/10 | -> |
| Project/PO visibility | 4/10 | -> |
| Role personalization | 6/10 | -> |
| Actionability | 5/10 | -> |

---

## Current State

### What Exists Today

`/dashboard` redirects unauthenticated/unscoped users and renders `AdminView` for owner/admin/manager roles, otherwise `SpecialistView`. Admins see `DashboardMetrics`, upcoming deadlines, quick navigation, and charts. Specialists see open tenders, under evaluation, validity warnings, deadlines, briefings, activity, and validity expiry cards. Quick create buttons are shown for tenders, POs, projects, and clients subject to permissions.

### Architecture Notes

Dashboard server functions live in `server/dashboard.ts`, while wider metrics come from `server/tenders.ts`, `server/projects.ts`, and `server/clients.ts`. The dashboard already uses Suspense skeletons and server-side data fetching.

---

## Findings

### Critical Issues

| # | Issue | Location | Impact | Effort |
|---|-------|----------|--------|--------|
| C1 | No PO delivery health or overdue delivery queue on the main dashboard. | `DashboardMetrics`, `server/projects.ts` | Managers cannot see delivery risk after tenders become projects. | M |

### Major Issues

| # | Issue | Location | Impact | Effort |
|---|-------|----------|--------|--------|
| M1 | No “needs action today” queue. | `DashboardPage`, `AdminView`, `SpecialistView` | Users must navigate into registers to find urgent work. | M |
| M2 | Tender administrator needs are only partially covered. | `SpecialistView` | Closing soon and briefings exist, but preparation status, missing documents, submission readiness, follow-ups due, and recently added opportunities are missing. | M |
| M3 | Manager dashboard lacks operational risk cards. | `AdminView` | Pipeline value and win rate are present, but delayed POs, overdue deliveries, awarded tenders, team workload, and high-value risk are missing. | M |
| M4 | General users do not have assigned tasks or project/PO update queues. | `SpecialistView` | Standard users get tender metrics, not a personal worklist. | M |
| M5 | Quick actions are global create buttons rather than contextual next actions. | `DashboardPage` | Users can create records but not resume incomplete work. | S |

### Minor Issues

| # | Issue | Location | Impact | Effort |
|---|-------|----------|--------|--------|
| m1 | Admin quick navigation includes billing/team links but not tender/project workflow queues. | `AdminView` | Operational modules are less prominent than admin modules. | S |
| m2 | Charts are placed after deadlines but do not appear tied to decisions. | `DashboardCharts` | Analytics can feel decorative. | S |

---

## Recommendations

### Quick Wins (1-2 days)

1. **Add an action queue band**
   - What: Top dashboard row for closing today, briefings today, follow-ups due, overdue POs.
   - Where: `server/dashboard.ts`, `components/dashboard/action-queue.tsx`
   - Expected outcome: Users immediately see priority work.

2. **Add project/PO health cards**
   - What: Active projects, open POs, partially delivered, overdue deliveries, pending PO value.
   - Where: `DashboardMetrics`, `server/projects.ts`
   - Expected outcome: Dashboard covers post-award work.

### Short-Term (1-2 weeks)

1. **Create persona-specific dashboard sections**
   - What: Tender admin queue, manager risk overview, general user assigned tasks.
   - Where: `AdminView`, `SpecialistView`, new `GeneralUserView`
   - Expected outcome: Better fit for daily roles.

2. **Make dashboard cards drillable**
   - What: Every KPI routes to filtered registers.
   - Where: Dashboard components and navigation
   - Expected outcome: Metrics become action entry points.

### Medium-Term (1-3 months)

1. **Add alert and notification engine**
   - What: Reminders for follow-ups, briefing attendance, tender closing, PO overdue, delivery disputes.
   - Where: `notification`, dashboard queues, scheduled job
   - Expected outcome: Proactive operational control.

---

## Component Inventory

| Component | Current State | Recommended State | Priority |
|-----------|--------------|-------------------|----------|
| Dashboard header | Create buttons | Add role-specific primary action and queue summary | P1 |
| KPI cards | Tender/project/client aggregates | Add risk, overdue, and pending action cards | P0 |
| Deadlines | Tenders due in 30 days | Split closing today/week and overdue | P0 |
| Briefings | Existing widget | Add mandatory/not attended risk | P1 |
| Activity | Existing | Convert to lifecycle timeline with links | P1 |
| Charts | Existing | Tie to manager decisions and filtered routes | P2 |

---

## Cross-References

### Dependencies (findings this prompt consumed)

| Prompt | Key Finding Used |
|--------|------------------|
| 01-codebase-audit | Dashboard exists but is tender-heavy and lacks project/PO work queues. |

### Outputs (findings to pass forward)

| Prompt | Key Finding to Consume |
|--------|------------------------|
| 03-tender-management | Tender overview should own module-level tender queues. |
| 04-project-management | Project overview should own project/PO health queues. |
| 08-navigation | Dashboard cards should deep-link to filtered workflow pages. |
| 10-deliverables-roadmap | First roadmap phase should include dashboard action queues. |

---

## Implementation Notes

### Affected Files

```text
apps/tracker/src/app/(dashboard)/dashboard/page.tsx
apps/tracker/src/components/dashboard/*
apps/tracker/src/server/dashboard.ts
apps/tracker/src/server/tenders.ts
apps/tracker/src/server/projects.ts
apps/tracker/src/server/purchase-orders.ts
```

### New Files Required

```text
apps/tracker/src/components/dashboard/action-queue.tsx
apps/tracker/src/components/dashboard/project-po-health.tsx
apps/tracker/src/components/dashboard/manager-risk-panel.tsx
```

### Database Changes

- [ ] Assigned owner/task fields are needed for personal work queues.
- [ ] Activity/event table would make dashboard history reliable.

### API Changes

- [ ] Add dashboard queue functions for due dates, follow-ups, overdue POs, and missing evidence.

---

## Open Questions

- [ ] What are the default dashboard personas by Better Auth role?
- [ ] Should dashboard queues show only assigned records or all organization records by default?

---

## Appendix

### Screenshots / Visual References

Not captured in this audit pass.

### Research Sources

- Cooperative dashboard design heuristics: https://arxiv.org/abs/2308.04514
- W3C target size minimum for touch-friendly actions: https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html
