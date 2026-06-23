# Findings: Main Dashboard Audit

---

## Metadata

| Field | Value |
|-------|-------|
| **Prompt** | 02-dashboard-audit.md |
| **Date** | 2026-06-14 |
| **Auditor** | Buffy (AI Audit) |
| **Scope** | Main dashboard audit and role-based recommendations |
| **Depends On** | 01-codebase-audit |

---

## Executive Summary

The dashboard currently has two role-based views (AdminView and SpecialistView) that display KPI cards, charts, deadlines, and activity feeds. While functional, the dashboard suffers from information overload for admin users and insufficient actionable data for specialist users. KPI cards lack trend indicators, there are no urgency-driven alert banners, and the activity feed is tender-only with no project or PO activity.

**Overall Score: 5/10**

| Area | Score | Trend |
|------|-------|-------|
| KPI Coverage | 5/10 | → |
| Role Differentiation | 4/10 | ↓ |
| Urgency Indicators | 3/10 | ↓ |
| Actionability | 4/10 | → |
| Visual Design | 4/10 | → |
| Mobile Layout | 3/10 | ↓ |

---

## Current State

### What Exists Today

**Dashboard Page** (`dashboard/page.tsx`):
- Checks user session and role via `validateSessionAndOrg()`
- Renders `AdminView` for owner/admin/manager, `SpecialistView` for members
- Quick action buttons: Create Tender, Create PO, Create Project, Create Client
- Uses Suspense with skeleton fallback

**AdminView Components:**
- `DashboardMetrics` — 6 KPI cards (Total Tenders, Active Tenders, Total Value, Win Rate, Active Projects, Total Clients)
- `DashboardCharts` — Tender status distribution (bar chart) + Monthly trends (line chart)
- `DashboardDeadlines` — Upcoming tender deadlines (30 days)
- `DashboardBriefings` — Upcoming briefing sessions
- `DashboardActivity` — Recent activity feed (tender creation + status updates)
- `MiniCalendarWidget` — Calendar with tender submissions and PO deliveries

**SpecialistView Components:**
- `UpcomingDeadlines` — Tenders due soon
- Warning list of open tenders
- Quick navigation links

**Dashboard Layout:**
```
[Header: Dashboard title + Create buttons]
[Metrics Row: 6 KPI cards]
[Charts Row: Status Distribution + Monthly Trends]
[Deadlines + Briefings + Activity]
[Calendar Widget]
```

### Architecture Notes

- Dashboard data fetched via server functions: `getTenderStats()`, `getProjectStats()`, `getUpcomingDeadlines()`, `getUpcomingBriefings()`, `getRecentActivity()`
- Charts use Recharts library
- Calendar uses client-side rendering with `CalendarClient`
- Activity feed is tender-only — no project or PO activity

---

## Findings

### Critical Issues

| # | Issue | Location | Impact | Effort |
|---|-------|----------|--------|--------|
| C1 | No urgency-driven alert banner — users must scroll to find critical items | `admin-view.tsx` | Missed deadlines and overdue items | S |
| C2 | KPI cards have no trend indicators — no context for whether metrics are improving or declining | `dashboard-metrics.tsx` | Cannot assess operational trajectory | S |

### Major Issues

| # | Issue | Location | Impact | Effort |
|---|-------|----------|--------|--------|
| M1 | SpecialistView is too sparse — only shows deadlines and warning list | `specialist-view.tsx` | Standard users get minimal value from dashboard | M |
| M2 | Activity feed is tender-only — no project creation, PO delivery, or client activity | `dashboard-activity.tsx` | Incomplete operational picture | M |
| M3 | No "Closing Today" or "Overdue" priority section | `admin-view.tsx` | Urgent items buried in scroll | M |
| M4 | Charts are informational only — no drill-down to filtered registers | `dashboard-charts.tsx` | Cannot act on chart insights | S |
| M5 | Calendar widget is desktop-sized and buried at bottom | `mini-calendar-widget.tsx` | Low visibility for time-sensitive items | M |
| M6 | No quick-action contextual buttons (e.g., "Record Follow-up" from deadline card) | Various | Users must navigate to entity to take action | M |

### Minor Issues

| # | Issue | Location | Impact | Effort |
|---|-------|----------|--------|--------|
| m1 | KPI cards are plain — no sparklines or visual trend data | `dashboard-metrics.tsx` | Less engaging than modern dashboards | S |
| m2 | Briefings card has no "Mark Attended" action | `dashboard-briefings.tsx` | Must navigate away to update | S |
| m3 | Activity feed items have no relative timestamps | `dashboard-activity.tsx` | Hard to gauge recency | S |
| m4 | No "What's New" or onboarding hints for new users | — | New users orient slowly | S |

---

## Recommendations

### Quick Wins (1-2 days)

1. **Add urgency alert banner at top of dashboard**
   - What: Show a prominent banner when there are items closing today or overdue tenders
   - Where: New component `components/dashboard/urgency-banner.tsx`, add to `admin-view.tsx` and `specialist-view.tsx`
   - Expected outcome: Critical items are immediately visible

2. **Add trend indicators to KPI cards**
   - What: Show percentage change vs. previous period on each metric card with up/down arrows
   - Where: `dashboard-metrics.tsx`, server functions need to return previous period data
   - Expected outcome: Users can immediately assess operational trajectory

3. **Add relative timestamps to activity feed**
   - What: Show "2 hours ago", "Yesterday" instead of raw dates
   - Where: `dashboard-activity.tsx`
   - Expected outcome: Better time context for activity

### Short-Term (1-2 weeks)

1. **Redesign SpecialistView with actionable dashboard**
   - What: Give standard users KPI cards for their assigned tasks, upcoming deadlines, and recent PO deliveries
   - Where: `specialist-view.tsx`, new server functions for user-specific data
   - Expected outcome: Every user type gets immediate operational value

2. **Add project and PO activity to activity feed**
   - What: Include project creation, PO delivery, and client updates in the activity timeline
   - Where: `dashboard-activity.tsx`, `server/tenders.ts` → expand to `server/activity.ts`
   - Expected outcome: Complete operational picture

3. **Make charts interactive with drill-down**
   - What: Click on a chart segment to navigate to filtered register (e.g., click "Awarded" bar → navigate to tenders filtered by awarded)
   - Where: `dashboard-charts.tsx`
   - Expected outcome: Dashboard becomes action-oriented

### Medium-Term (1-3 months)

1. **Build role-based customisable dashboard**
   - What: Let users choose which KPI cards, charts, and widgets appear on their dashboard
   - Where: New dashboard layout engine, user preferences table
   - Expected outcome: Personalised experience per user

2. **Add predictive insights**
   - What: Show AI-powered insights like "3 tenders closing this week — 2 need follow-up"
   - Where: New insight engine, dashboard components
   - Expected outcome: Proactive operational guidance

---

## Component Inventory

| Component | Current State | Recommended State | Priority |
|-----------|--------------|-------------------|----------|
| UrgencyBanner | Non-existent | Prominent alert for overdue/closing-today items | P0 |
| KPICard | Basic metric card | Premium card with trend, sparkline, and context | P0 |
| ActivityFeed | Tender-only, basic | Multi-entity feed with relative timestamps and actions | P1 |
| ChartWidget | Static charts | Interactive with drill-down to filtered registers | P1 |
| CalendarWidget | Desktop-sized, basic | Responsive with event preview and quick actions | P1 |
| QuickActionPanel | Top-level buttons only | Contextual actions within each widget | P2 |

---

## Cross-References

### Dependencies (findings this prompt consumed)

| Prompt | Key Finding Used |
|--------|------------------|
| 01-codebase-audit | Dashboard has role-based views; metrics exist but lack trend data; activity is tender-only |

### Outputs (findings to pass forward)

| Prompt | Key Finding to Consume |
|--------|------------------------|
| 03-tender-management | Dashboard deadline/briefing widgets exist — tender mini dashboard should extend this pattern |
| 04-project-management | Project overview should mirror dashboard KPI pattern |
| 08-navigation | Dashboard quick actions should be accessible from navigation |

---

## Implementation Notes

### Affected Files

```
apps/tracker/src/components/dashboard/admin-view.tsx
apps/tracker/src/components/dashboard/specialist-view.tsx
apps/tracker/src/components/dashboard/dashboard-metrics.tsx
apps/tracker/src/components/dashboard/dashboard-charts.tsx
apps/tracker/src/components/dashboard/dashboard-activity.tsx
apps/tracker/src/components/dashboard/dashboard-deadlines.tsx
apps/tracker/src/components/dashboard/dashboard-briefings.tsx
apps/tracker/src/components/dashboard/mini-calendar-widget.tsx
apps/tracker/src/app/(dashboard)/dashboard/page.tsx
```

### New Files Required

```
components/dashboard/urgency-banner.tsx
components/dashboard/kpi-card-premium.tsx
components/dashboard/activity-feed-enhanced.tsx
```

### Database Changes

- [ ] None required for Phase 1 improvements

### API Changes

- [ ] Add previous-period data to `getTenderStats()` and `getProjectStats()`
- [ ] Expand `getRecentActivity()` to include project and PO activity

---

## Open Questions

- [ ] Should dashboard be fully customisable per user, or role-based presets?
- [ ] Is real-time update (WebSocket) a priority for dashboard widgets?
- [ ] Should we add email digest summaries of dashboard state?

---

## Appendix

### Dashboard Component Map

```
dashboard/page.tsx
├── DashboardSkeleton (Suspense fallback)
├── AdminView
│   ├── DashboardMetrics (6 KPI cards)
│   ├── DashboardCharts (Status + Trends)
│   ├── DashboardDeadlines (30-day deadlines)
│   ├── DashboardBriefings (Upcoming briefings)
│   ├── DashboardActivity (Recent feed)
│   └── MiniCalendarWidget (Calendar)
└── SpecialistView
    ├── UpcomingDeadlines
    └── Warning list (open tenders)
```
