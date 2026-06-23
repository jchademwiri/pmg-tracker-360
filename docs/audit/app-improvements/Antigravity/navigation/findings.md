# Findings – 08-navigation.md

## Metadata

| Field | Value |
|-------|-------|
| **Prompt** | 08-navigation.md |
| **Date** | 2026-06-14 |
| **Auditor** | Antigravity |
| **Scope** | Information architecture review, navigation placements, active state styling, and command menus. |
| **Depends On** | 01-codebase-audit.md, 02-dashboard-audit.md, 03-tender-management.md, 04-project-management.md |

---

## Executive Summary

The navigation structure in the Tracker app uses a modern **Shadcn Sidebar** wrapper with organization switchers, collapsible menu items, active state indicator highlights, and a profile footer. 

However, the information architecture is too flat. Links go directly to table registers rather than modular dashboard landing views. It also lacks page-level tab navigation (except on tender details), badge counters to draw attention to critical deadlines, keyboard shortcut commands, and a power-user command palette.

**Overall Score: 7.0/10**

| Area | Score | Trend |
|------|-------|-------|
| Sidebar Structure & IA | 7.0/10 | ↑ |
| Secondary & Tabbed Navigation | 5.0/10 | ↓ |
| Shortcuts & Command Menus | 0.0/10 | ↓ |
| Mobile Overlay Navigation | 8.0/10 | ↑ |

---

## Current State

### What Exists Today

1. **Persistent Sidebar (`app-sidebar.tsx`):**
   - Divided into two sections: **Overview** (Dashboard, Calendar, Reports) and **Procurement Cycle** (Clients Directory, Tender Pipeline, Project Tracking).
   - Groups under "Tender Pipeline" and "Project Tracking" slide out using accordion headers.

2. **Active State Highlighting:**
   - Active routes are highlighted in the sidebar using standard hover classes (`bg-sidebar-accent`).

3. **Dynamic Breadcrumbs (`dynamic-breadcrumb.tsx`):**
   - Translates URL paths (e.g. `/projects/[id]/edit`) into clickable breadcrumb links automatically.

### Architecture Notes

- Built using Radix collapsible primitives.
- Mobile devices automatically collapse the sidebar, rendering it as a hamburger-triggered slide drawer.

---

## Findings

### Critical Issues

*No critical blockers (navigation focus is on usability and architecture).*

### Major Issues

> Issues that significantly degrade UX or operational efficiency.

| # | Issue | Location | Impact | Effort |
|---|-------|----------|--------|--------|
| M1 | **Flat Navigation IA** | `dashboad-links.ts` | The accordion menu goes directly to register lists, which skips the required mini-dashboard overviews for Tenders and Projects. | S |
| M2 | **No Keyboard Command Palette** | Codebase | Power users cannot search across clients, projects, or tenders using keyboard commands, which slows down operational lookups. | M |

### Minor Issues

> Polish items, inconsistencies, and small UX improvements.

| # | Issue | Location | Impact | Effort |
|---|-------|----------|--------|--------|
| m1 | **Missing Navigation Count Badges** | `app-sidebar.tsx` | Menu items (like "Overdue POs" or "Follow-ups") lack numerical badge alerts (e.g., "Calendar (3)") to indicate urgent work. | S |
| m2 | **Inconsistent Page Tabs** | `projects/[id]/page.tsx` | The project detail page relies on sidebar headers instead of clear sub-tabs (like Info, POs, Documents), making navigation clunky. | S |

---

## Recommendations

### Quick Wins (1-2 days)

1. **Add Sidebar Status Badge Counters**
   - **What**: Query upcoming briefing counts and display a small badge next to the "Calendar" menu item.
   - **Where**: `apps/tracker/src/components/shared/navigation/app-sidebar.tsx`
   - **Expected outcome**: Alerts users to today's briefings at a glance.

2. **Capitalize Breadcrumb Paths**
   - **What**: Update the breadcrumb parser to capitalize and replace hyphens with spaces automatically in URL routes.
   - **Where**: `apps/tracker/src/components/dynamic-breadcrumb.tsx`
   - **Expected outcome**: Polished layout presentation.

### Short-Term (1-2 weeks)

1. **Align Sidebar Links with Dashboards**
   - **What**: Update links to point to the new Tenders and Projects mini-dashboards (`/tenders/overview` and `/projects/overview`) by default, placing registers as secondary sub-pages.
   - **Where**: `apps/tracker/src/data/dashboad-links.ts`
   - **Expected outcome**: Workflow-focused navigation paths.

2. **Implement Project Page Tabs**
   - **What**: Divide the project page into sub-tabs: General Info, Purchase Orders, and Documents.
   - **Where**: `apps/tracker/src/app/(dashboard)/projects/[id]/page.tsx`
   - **Expected outcome**: Cleaner, more structured detail page navigation.

### Medium-Term (1-3 months)

1. **Implement Keyboard Command Palette (`Cmd+K`)**
   - **What**: Build a floating command palette (using Shadcn Command primitive) triggered by `Ctrl+K`/`Cmd+K` that allows users to search tenders, projects, clients, or trigger actions like "Create Tender".
   - **Where**: `apps/tracker/src/components/shared/command-palette.tsx` (new file)
   - **Expected outcome**: Fast, keyboard-only system navigation.

---

## Component Inventory

| Component | Current State | Recommended State | Priority |
|-----------|--------------|-------------------|----------|
| **Dynamic Breadcrumbs** | Raw text parser. | Parse IDs into friendly labels (e.g., using project number instead of UUID). | P1 |
| **Sidebar Footer** | User menu only. | Add workspace status indicators and quick settings links. | P2 |
| **Command Palette** | Does not exist. | Create search palette with action shortcuts. | P1 |

---

## Cross-References

### Dependencies (findings this prompt consumed)

| Prompt | Key Finding Used |
|--------|------------------|
| 01-codebase-audit.md | Monorepo layout wrappers and current list of navigation routes. |
| 02-dashboard-audit.md | User role access restrictions. |
| 03-tender-management.md | Tender detail page tabs. |
| 04-project-management.md | Project detail page metadata constraints. |

### Outputs (findings to pass forward)

| Prompt | Key Finding to Consume |
|--------|------------------------|
| 06-mobile-ux.md | Designing mobile bottom nav bars and collapsed trigger icons. |
| 10-deliverables-roadmap.md | Scheduling IA structure changes in implementation waves. |

---

## Implementation Notes

### Affected Files

```
apps/tracker/src/components/shared/navigation/app-sidebar.tsx
apps/tracker/src/data/dashboad-links.ts
apps/tracker/src/components/dynamic-breadcrumb.tsx
apps/tracker/src/app/(dashboard)/projects/[id]/page.tsx
```

### New Files Required

```
apps/tracker/src/components/shared/command-palette.tsx
```

### Database Changes

*None required.*

### API Changes

- [ ] Create search endpoint for command palette matching queries.
