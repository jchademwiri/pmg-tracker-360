# Combined Findings: Dashboard Audit

## Metadata

| Field | Value |
|-------|-------|
| **Prompt** | 02-dashboard-audit.md |
| **Models Compared** | Antigravity, codebuff, codex |
| **Date** | 2026-06-14 |
| **Confidence** | High |

---

## Reconciled Score

**Overall Score: 5.8/10**

| Model | Score | Variance |
|-------|-------|----------|
| Antigravity | 6.5/10 | +0.7 |
| codebuff | 5.0/10 | -0.8 |
| codex | 6.0/10 | +0.2 |
| **Average** | **5.8/10** | Moderate |

Final reconciled score: **5.8/10, High confidence**. The dashboard exists and has useful widgets, but all models agree it is not yet an operational action center.

---

## Consensus Issues (High Confidence)

| # | Issue | Models | Severity | Location |
|---|-------|--------|----------|----------|
| 1 | No urgent “action required today” dashboard band for closing today, overdue, follow-ups, or critical work. | Antigravity, codebuff, codex | Major | `AdminView`, `SpecialistView`, dashboard page |
| 2 | No project/PO operational risk visibility, including delayed POs and overdue deliveries. | Antigravity, codex | Critical | `DashboardMetrics`, `server/projects.ts` |
| 3 | Specialist/general user dashboard lacks personal task checklist and assigned work. | Antigravity, codebuff, codex | Major | `SpecialistView` |
| 4 | KPI cards lack context/drill-down/trend treatment. | Antigravity, codebuff, codex | Major | `DashboardMetrics`, `MetricCard`, `DashboardCharts` |
| 5 | Quick actions are not contextual to current risk or next workflow step. | codebuff, codex | Major | dashboard header/cards |

---

## Unique Insights (Medium Confidence)

| # | Issue | Source Model | Potential Value |
|---|-------|-------------|-----------------|
| 1 | Pipeline value should be weighted by win probability or split by stage. | Antigravity | Useful for manager reporting once stage model exists. |
| 2 | Activity feed lacks project/PO/client activity and relative timestamps. | codebuff | Strong improvement for perceived freshness and operational completeness. |
| 3 | Admin quick navigation over-emphasizes billing/team management. | codex | Important IA refinement for operational users. |

---

## Disagreements (Needs Investigation)

| # | Topic | Model A says | Model B says | Model C says | Recommendation |
|---|-------|-------------|-------------|-------------|----------------|
| 1 | Dashboard score | Antigravity 6.5 due existing role views. | codebuff 5 due urgency/action gaps. | codex 6 due useful but tender-heavy foundation. | Reconcile at 5.8: functional dashboard, weak operational prioritization. |
| 2 | Trend indicators severity | codebuff calls no trend indicators critical. | Antigravity/codex treat as polish/actionability. | codex prioritizes PO risk more. | Treat trend indicators as major, below action queues and PO risk. |

---

### Critical Issues

| # | Issue | Location | Impact | Effort |
|---|-------|----------|--------|--------|
| C1 | No dashboard queue for PO delivery health or overdue deliveries. | Dashboard metrics/server | Managers miss delivery risk. | M |

### Major Issues

| # | Issue | Location | Impact | Effort |
|---|-------|----------|--------|--------|
| M1 | No urgent action-required queue. | Dashboard views | Users must hunt for priority work. | M |
| M2 | Specialist/general dashboards lack personal tasks. | `SpecialistView` | Standard users get low operational value. | M |
| M3 | KPI cards/charts lack trends, drill-down, and next actions. | Dashboard components | Metrics are less actionable. | M |

### Minor Issues

| # | Issue | Location | Impact | Effort |
|---|-------|----------|--------|--------|
| m1 | Admin quick navigation prioritizes admin links over workflow queues. | `AdminView` | Operational work is less prominent. | S |

## Combined Recommendations

### Quick Wins (Consensus)

1. **Add dashboard action queue**
2. **Add project/PO health cards**

### Short-Term (Consensus)

1. Create persona-specific dashboard sections for admin/manager, tender administrator, and general user.
2. Make dashboard cards and charts drill into filtered registers.
3. Expand activity feed to include projects and purchase orders.

### Medium-Term (Consensus)

1. Add lifecycle notification/alert engine.
2. Add weighted pipeline and predictive operational insights once stage data exists.

### Investigate Further

1. Which dashboard persona maps to Better Auth roles.
2. Whether users need configurable dashboards or fixed role dashboards first.

---

## Open Questions

- Should action queues be organization-wide or assigned-to-me by default?
- What defines an overdue PO: expected delivery date, deliveredAt absence, or line-item outstanding quantity?
