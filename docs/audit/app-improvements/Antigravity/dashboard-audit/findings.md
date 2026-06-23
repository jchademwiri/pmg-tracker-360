# Findings – 02-dashboard-audit.md

## Metadata

| Field | Value |
|-------|-------|
| **Prompt** | 02-dashboard-audit.md |
| **Date** | 2026-06-14 |
| **Auditor** | Antigravity |
| **Scope** | Main dashboard review, auditing Admin vs Specialist views and recommending user-centric modules. |
| **Depends On** | 01-codebase-audit.md |

---

## Executive Summary

The Tracker dashboard divides users into two views based on role: an **Admin View** (for owners, admins, and managers) and a **Specialist View** (for members). The Admin view focuses on high-level KPIs like total pipeline value, win rate, active project count, and upcoming deadlines, while the Specialist view highlights validity warnings, upcoming briefings, and recent activity logs.

While this separation is a good design choice, both views are currently too passive. They lack critical actionability—such as highlighting tenders with missing compliance documentation, showing delayed PO deliveries, or providing a checklist of assigned tasks. Visualizations are also simple, showing basic numbers without trend lines, risk indicators, or interactive drill-downs.

**Overall Score: 6.5/10**

| Area | Score | Trend |
|------|-------|-------|
| Tender Admin View | 7.0/10 | → |
| Manager / Owner View | 6.0/10 | ↓ |
| Specialist/General View | 6.0/10 | → |
| Layout & Visual Hierarchy | 7.0/10 | ↑ |

---

## Current State

### What Exists Today

1. **Admin View (`admin-view.tsx`):**
   - **`DashboardMetrics`**: Four metric cards displaying Total Pipeline Value (sum of all tenders), Win Rate, Active Projects, and Upcoming Deadlines.
   - **`DashboardDeadlines`**: Lists tenders due in the next 30 days.
   - **Quick Navigation**: Cards pointing to Reports, Manage Team, and Billing.
   - **`DashboardCharts`**: Visualizes tender distribution using Recharts.

2. **Specialist View (`specialist-view.tsx`):**
   - **Metric Cards**: Focuses on count of Open Tenders, Under Evaluation tenders, and Validity Warnings (expiring in 14 days).
   - **`DashboardBriefings`**: Lists upcoming tender briefing sessions.
   - **`DashboardActivity`**: Shows the last 10 actions (creation and status changes).
   - **Validity Expiries List**: Highlighted cards for bids expiring soon.

### Architecture Notes

- Views are composed inside `src/app/(dashboard)/dashboard/page.tsx` based on the user's membership role.
- Data fetching occurs in Server Components via direct DB calls, wrapped in `<Suspense>` blocks with fallback skeletons to optimize load times.

---

## Findings

### Critical Issues

*No critical blockers in the dashboard view.*

### Major Issues

> Issues that significantly degrade UX or operational efficiency.

| # | Issue | Location | Impact | Effort |
|---|-------|----------|--------|--------|
| M1 | **No Project/PO Operational Alerts** | `admin-view.tsx` | Owners and managers cannot see delayed POs, overdue project milestones, or supply chain bottlenecks on the main dashboard, forcing them to manually browse lists. | M |
| M2 | **Lack of Actionable Task Lists** | `specialist-view.tsx` | General users see recent activity log feeds, but there is no personal checklist of bids to prepare or PO deliveries to verify today. | M |
| M3 | **Under-utilized Pipeline Value Metrics** | `dashboard-metrics.tsx` | The pipeline value sums *all* active tenders, which distorts projections because it doesn't weigh values by win probability or separate draft opportunities. | S |

### Minor Issues

> Polish items, inconsistencies, and small UX improvements.

| # | Issue | Location | Impact | Effort |
|---|-------|----------|--------|--------|
| m1 | **Static Quick Actions** | `dashboard/page.tsx#L80` | Action buttons like "Create PO" and "Create Project" are placed in a simple header row without descriptions or helper indicators. | S |
| m2 | **Plain Metric Cards** | `components/ui/metric-card.tsx` | Lacks visual trends (e.g. sparklines or visual change indicators) that show monthly performance. | M |

---

## Recommendations

### Quick Wins (1-2 days)

1. **Add "Action Required Today" Overlays**
   - **What**: Highlight items in the "Upcoming Deadlines" widget with a warning dot or badge if the submission is within 48 hours or missing documents.
   - **Where**: `src/components/dashboard/upcoming-deadlines-list.tsx`
   - **Expected outcome**: Immediate focus on high-risk tenders.

2. **Weight Pipeline Values**
   - **What**: Provide two numbers in the Pipeline card: Total raw pipeline, and Weighted pipeline (where value is multiplied by historical win rate per client/tender category).
   - **Where**: `src/components/dashboard/dashboard-metrics.tsx`
   - **Expected outcome**: More accurate financial forecasting.

### Short-Term (1-2 weeks)

1. **Build a "Deliveries & POs at Risk" Alert Widget**
   - **What**: Create a dashboard widget for managers showing POs that are past their expected delivery date without a received delivery note.
   - **Where**: `src/components/dashboard/widgets/po-risk-alerts.tsx` (new file)
   - **Expected outcome**: Operational bottlenecks are highlighted immediately.

2. **Implement Personal Task Checklists for Specialists**
   - **What**: Display a clean list of bids assigned to the user that are still in 'open' status, with checkbox tasks for document collection and briefing attendance.
   - **Where**: `src/components/dashboard/widgets/assigned-tasks.tsx` (new file)
   - **Expected outcome**: Improved team task execution.

### Medium-Term (1-3 months)

1. **Redesign Dashboard Layout with Progressive Disclosure**
   - **What**: Introduce a unified dashboard with tabbed sub-views:
     - **Tenders Hub**: Focus on bids, funnel metrics, and upcoming briefings.
     - **Operations Hub**: Focus on active projects, contract statuses, PO budgets, and deliveries.
     - **Team Workload**: Displays count of active tasks assigned per specialist.
   - **Expected outcome**: Richer, more professional, modular interface.

---

## Component Inventory

| Component | Current State | Recommended State | Priority |
|-----------|--------------|-------------------|----------|
| **DashboardMetrics** | Shows flat stats. | Incorporate weighted pipeline and active PO amounts. | P0 |
| **DashboardActivity** | Flat timeline feed. | Refactor into action buttons (e.g. click activity to navigate to detail). | P2 |
| **Tenders closing soon** | Combined in general list. | Separate into its own card with countdown timer. | P1 |
| **PO Overdue Alert** | Does not exist. | Create a widget highlighting delayed shipments. | P0 |

---

## Cross-References

### Dependencies (findings this prompt consumed)

| Prompt | Key Finding Used |
|--------|------------------|
| 01-codebase-audit.md | Analysis of available routes, user roles, and existing server actions. |

### Outputs (findings to pass forward)

| Prompt | Key Finding to Consume |
|--------|------------------------|
| 03-tender-management.md | Designing specific widgets for closing tenders and compliance documents. |
| 04-project-management.md | Integrating active projects and PO metrics onto the dashboard. |
| 06-mobile-ux.md | Designing touch-friendly layouts for KPI cards and tables. |
| 08-navigation.md | Linking dashboard tabs to sub-modules. |
| 10-deliverables-roadmap.md | Scheduling dashboard enhancements in implementation phases. |

---

## Implementation Notes

### Affected Files

```
apps/tracker/src/components/dashboard/admin-view.tsx
apps/tracker/src/components/dashboard/specialist-view.tsx
apps/tracker/src/components/dashboard/dashboard-metrics.tsx
apps/tracker/src/server/dashboard.ts
```

### New Files Required

```
apps/tracker/src/components/dashboard/widgets/po-risk-alerts.tsx
apps/tracker/src/components/dashboard/widgets/assigned-tasks.tsx
```

### Database Changes

*None required (queries will use existing fields like `expectedDeliveryDate` and `status`).*

### API Changes

- [ ] Add `getOverduePOs` server action.
- [ ] Add `getAssignedTasks` server action.
