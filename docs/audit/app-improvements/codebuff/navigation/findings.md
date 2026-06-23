# Findings: Navigation Improvement

---

## Metadata

| Field | Value |
|-------|-------|
| **Prompt** | 08-navigation.md |
| **Date** | 2026-06-14 |
| **Auditor** | Buffy (AI Audit) |
| **Scope** | Navigation and information architecture |
| **Depends On** | 01, 02, 03, 04 |

---

## Executive Summary

The current navigation is functional but lacks the information density and urgency signalling needed for a daily operations platform. The sidebar structure is flat with no badge counts, no quick actions, and a confusing "Procurement Cycle" label. There is no command palette for power users, and mobile navigation relies solely on the collapsible sidebar. The navigation architecture doesn't match the actual business workflow.

**Overall Score: 5/10**

| Area | Score | Trend |
|------|-------|-------|
| Information Architecture | 5/10 | → |
| Urgency Signalling | 2/10 | ↓ |
| Quick Actions | 3/10 | → |
| Mobile Navigation | 3/10 | → |
| Power User Features | 2/10 | ↓ |

---

## Current State

### Sidebar Structure

```
[TeamSwitcher — Organisation selector]
── Overview
   ├── Dashboard
   ├── Calendar
   └── Reports
── Procurement Cycle
   ├── Clients Directory
   ├── Tender Pipeline
   │   ├── Overview
   │   └── Tender Register
   └── Project Tracking
       ├── Overview
       ├── Active Projects
       └── Purchase Orders (hidden for 'member' role)
[NavUser — User menu]
```

### Header
- Sidebar trigger (hamburger)
- Separator
- Dynamic breadcrumb
- Notification bell (ml-auto)

---

## Findings

### Critical Issues

| # | Issue | Location | Impact | Effort |
|---|-------|----------|--------|--------|
| C1 | No badge counts on navigation items — users cannot see urgency without navigating | `app-sidebar.tsx` | Missed deadlines and urgent items | S |
| C2 | No command palette — power users cannot navigate quickly | — | Slow navigation for frequent users | M |

### Major Issues

| # | Issue | Location | Impact | Effort |
|---|-------|----------|--------|--------|
| M1 | "Procurement Cycle" label is confusing for non-procurement users | `app-sidebar.tsx` | Navigation doesn't match user mental model | S |
| M2 | No quick actions in navigation (e.g., "Add Tender" button in sidebar) | `app-sidebar.tsx` | Must navigate to page before creating | S |
| M3 | Mobile navigation relies on collapsed sidebar — no bottom nav | `app-sidebar.tsx` | Extra taps required on mobile | M |
| M4 | No settings or user management in main navigation | `dashboad-links.tsx` | Settings buried under user menu | S |
| M5 | Navigation doesn't reflect workflow priority — tenders and projects are equal | `dashboad-links.tsx` | Users cannot prioritise | S |

### Minor Issues

| # | Issue | Location | Impact | Effort |
|---|-------|----------|--------|--------|
| m1 | No keyboard shortcuts for navigation | — | Power users slower | S |
| m2 | No "Recent Items" in navigation | — | Cannot quickly return to recent work | S |
| m3 | Active state indicator could be more prominent | `nav-main.tsx` | Hard to see current location | S |
| m4 | No section dividers between navigation groups | `app-sidebar.tsx` | Visual clutter | S |

---

## Recommendations

### Quick Wins (1-2 days)

1. **Add badge counts to navigation items**
   - What: Show "Closing Soon (3)" and "Overdue (2)" counts on relevant nav items
   - Where: `nav-main.tsx`, server function to fetch counts
   - Expected outcome: Users see urgency without navigating

2. **Rename "Procurement Cycle" to "Operations"**
   - What: Change section label to match actual use
   - Where: `dashboad-links.tsx`
   - Expected outcome: Clearer navigation mental model

3. **Add quick action buttons in navigation**
   - What: Add "Create Tender" and "Create Project" buttons in sidebar header or section
   - Where: `app-sidebar.tsx`
   - Expected outcome: One-tap creation from anywhere

### Short-Term (1-2 weeks)

1. **Implement command palette (Cmd+K)**
   - What: Add global command palette for quick navigation, search, and actions
   - Where: New `components/command-palette.tsx`
   - Expected outcome: Power users navigate 10x faster

2. **Add bottom navigation for mobile**
   - What: Fixed bottom bar with Dashboard, Tenders, Projects, More
   - Where: New `components/shared/navigation/bottom-nav.tsx`
   - Expected outcome: Native mobile navigation experience

3. **Add "Recent Items" section**
   - What: Show last 5 accessed tenders/projects in navigation
   - Where: New nav section, server function for recent items
   - Expected outcome: Quick return to recent work

### Medium-Term (1-3 months)

1. **Build workflow-based navigation**
   - What: Restructure navigation around business workflow stages rather than entity types
   - Where: Complete navigation redesign
   - Expected outcome: Navigation matches how users actually work

2. **Add keyboard shortcuts**
   - What: Implement global keyboard shortcuts (e.g., G+T for tenders, G+P for projects)
   - Where: Command palette integration
   - Expected outcome: Power user efficiency

---

## Component Inventory

| Component | Current State | Recommended State | Priority |
|-----------|--------------|-------------------|----------|
| BadgeCount | Non-existent | Animated count badges on nav items | P0 |
| CommandPalette | Non-existent | Cmd+K global search and actions | P0 |
| BottomNav | Non-existent | Fixed mobile bottom navigation | P1 |
| RecentItems | Non-existent | Quick access to recent work | P1 |

---

## Cross-References

### Dependencies (findings this prompt consumed)

| Prompt | Key Finding Used |
|--------|------------------|
| 01-codebase-audit | Sidebar structure is flat; no badge counts; no command palette |
| 02-dashboard-audit | Dashboard quick actions pattern to extend to navigation |
| 03-tender-management | Tender overview and register structure informs nav items |
| 04-project-management | Project and PO structure informs nav items |

### Outputs (findings to pass forward)

| Prompt | Key Finding to Consume |
|--------|------------------------|
| 10-deliverables-roadmap | Command palette and badge counts are foundational navigation improvements |

---

## Implementation Notes

### Affected Files

```
apps/tracker/src/components/shared/navigation/app-sidebar.tsx
apps/tracker/src/components/shared/navigation/nav-main.tsx
apps/tracker/src/data/dashboad-links.ts
apps/tracker/src/app/(dashboard)/layout.tsx
```

### New Files Required

```
components/shared/navigation/command-palette.tsx
components/shared/navigation/bottom-nav.tsx
components/shared/navigation/badge-count.tsx
components/shared/navigation/recent-items.tsx
```

### Database Changes

- [ ] None for Phase 1

### API Changes

- [ ] Add `getNavigationCounts()` server function for badge counts
- [ ] Add `getRecentItems()` server function

---

## Open Questions

- [ ] Should navigation be customisable per user?
- [ ] Is the command palette a priority over other improvements?
- [ ] Should we support keyboard shortcuts from day one?

---

## Appendix

### Recommended Navigation Structure

```
[TeamSwitcher]
── Home
   ├── Dashboard
   ├── Calendar
   └── Reports
── Tenders
   ├── Overview (KPI cards + pipeline)
   ├── Register
   ├── Closing Soon (badge count)
   └── Submitted
── Projects
   ├── Overview (KPI cards)
   ├── Register
   ├── Active
   └── Purchase Orders
── Clients
   └── Directory
── Settings
[Quick Actions: + Tender, + Project]
[Recent Items: Last 5 accessed]
```
