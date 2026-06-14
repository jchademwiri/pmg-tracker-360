# Findings: Mobile-Friendly UX Requirements

---

## Metadata

| Field | Value |
|-------|-------|
| **Prompt** | 06-mobile-ux.md |
| **Date** | 2026-06-14 |
| **Auditor** | Buffy (AI Audit) |
| **Scope** | Mobile-first UX requirements and recommendations |
| **Depends On** | 01, 02, 03, 04 |

---

## Executive Summary

The Tracker app has minimal mobile optimisation. All registers use desktop-first tables that overflow on mobile, detail pages use sidebar layouts that don't stack, and there are no mobile-specific navigation patterns (bottom nav, swipe gestures). Forms are designed for desktop with multiple fields per row. The app is essentially unusable on mobile for core workflows beyond basic status checks.

**Overall Score: 3/10**

| Area | Score | Trend |
|------|-------|-------|
| Table Responsiveness | 2/10 | ↓ |
| Form Usability | 3/10 | → |
| Navigation | 3/10 | → |
| Detail Pages | 3/10 | ↓ |
| Touch Interactions | 2/10 | ↓ |
| Offline Capability | 1/10 | ↓ |

---

## Current State

### What Exists Today

- **Sidebar:** Collapses to icon mode on mobile via shadcn Sidebar component
- **Tables:** All registers (tenders, projects, POs, clients) use shadcn Table — horizontal scroll on mobile
- **Forms:** Desktop-first layout with multi-column grids
- **Detail Pages:** Tender and PO detail pages use sidebar layout that doesn't stack
- **No mobile-specific components:** No bottom nav, no swipe gestures, no pull-to-refresh
- **No touch gestures:** All interactions require precise taps
- **No offline capability:** Full online dependency

---

## Findings

### Critical Issues

| # | Issue | Location | Impact | Effort |
|---|-------|----------|--------|--------|
| C1 | All register tables overflow on mobile — require horizontal scroll | `tenders-table.tsx`, `project-list.tsx`, `po-list.tsx`, `client-list.tsx` | Core browsing impossible on mobile | L |
| C2 | Tender detail page sidebar doesn't stack on mobile | `tender-details.tsx:517` | Detail information inaccessible on mobile | M |
| C3 | No bottom navigation — mobile users must use collapsed sidebar | `app-sidebar.tsx` | Navigation requires extra taps on mobile | M |

### Major Issues

| # | Issue | Location | Impact | Effort |
|---|-------|----------|--------|--------|
| M1 | Forms use multi-column layout — fields too small on mobile | `tender-form.tsx`, `project-form.tsx`, `po-form.tsx` | Data entry errors on mobile | M |
| M2 | Filter/search drawers don't exist — filters are inline on desktop | `tenders-search-filters.tsx` | Cannot filter on mobile without losing context | M |
| M3 | No pull-to-refresh on any list view | All registers | No way to refresh data naturally on mobile | S |
| M4 | Action buttons are small and not touch-friendly (44px minimum) | Various | Missed taps, frustration | S |
| M5 | No FAB (Floating Action Button) for primary mobile actions | — | "Create" actions buried in header on mobile | M |
| M6 | Calendar widget is desktop-sized — unusable on mobile | `mini-calendar-widget.tsx` | Calendar feature lost on mobile | M |

### Minor Issues

| # | Issue | Location | Impact | Effort |
|---|-------|----------|--------|--------|
| m1 | No swipe gestures for table row actions | All registers | Cannot quick-action on mobile | S |
| m2 | No haptic feedback on important actions | — | Less tactile mobile experience | S |
| m3 | Loading skeletons are desktop-sized | Various | Poor mobile loading experience | S |
| m4 | No image/file preview on mobile detail pages | `tender-details.tsx` | Cannot view documents on mobile | S |

---

## Recommendations

### Quick Wins (1-2 days)

1. **Convert register tables to mobile cards**
   - What: Show card layout on screens < 768px, table on desktop
   - Where: New `MobileCard` wrapper component, update all registers
   - Expected outcome: All registers browsable on mobile

2. **Add touch-friendly action buttons (44px minimum)**
   - What: Increase all interactive element sizes to meet 44x44px minimum
   - Where: Global CSS, button components
   - Expected outcome: Fewer missed taps on mobile

3. **Stack tender detail page sidebar on mobile**
   - What: Change sidebar layout to stacked layout on mobile
   - Where: `tender-details.tsx`, `po-details.tsx`
   - Expected outcome: Detail pages readable on mobile

### Short-Term (1-2 weeks)

1. **Implement bottom navigation for mobile**
   - What: Add a fixed bottom nav bar with Dashboard, Tenders, Projects, More
   - Where: New `components/shared/navigation/bottom-nav.tsx`, update dashboard layout
   - Expected outcome: One-tap navigation on mobile

2. **Create mobile filter drawer (bottom sheet)**
   - What: Convert inline filters to a slide-up bottom sheet on mobile
   - Where: New `MobileFilterDrawer` component
   - Expected outcome: Full filtering capability on mobile

3. **Add FAB for primary mobile actions**
   - What: Show a floating action button on list views for "Create" actions
   - Where: New `FloatingActionButton` component
   - Expected outcome: Quick creation on mobile

### Medium-Term (1-3 months)

1. **Implement swipe gestures for row actions**
   - What: Swipe left to reveal action buttons (edit, delete, archive)
   - Where: Mobile card component
   - Expected outcome: Native-feeling mobile interactions

2. **Add pull-to-refresh on all list views**
   - What: Implement pull-to-refresh gesture on registers
   - Where: All register components
   - Expected outcome: Natural data refresh on mobile

3. **Offline support for critical data**
   - What: Cache tender list, deadlines, and dashboard data for offline viewing
   - Where: Service worker, local storage
   - Expected outcome: Basic functionality without network

---

## Component Inventory

| Component | Current State | Recommended State | Priority |
|-----------|--------------|-------------------|----------|
| MobileCard | Non-existent | Responsive card replacing table on mobile | P0 |
| BottomNav | Non-existent | Fixed bottom navigation bar | P0 |
| FloatingActionBtn | Non-existent | FAB for primary mobile actions | P1 |
| MobileFilterDrawer | Non-existent | Bottom sheet for filters/search | P1 |
| SwipeableRow | Non-existent | Swipe-to-reveal actions on cards | P2 |

---

## Cross-References

### Dependencies (findings this prompt consumed)

| Prompt | Key Finding Used |
|--------|------------------|
| 01-codebase-audit | All registers are table-only; no mobile card views; detail pages don't stack |
| 02-dashboard-audit | Dashboard layout is desktop-first; calendar widget not responsive |
| 03-tender-management | Tender register, form, and detail all need mobile variants |
| 04-project-management | Project and PO registers need mobile variants |

### Outputs (findings to pass forward)

| Prompt | Key Finding to Consume |
|--------|------------------------|
| 07-premium-ui | Mobile design tokens needed (touch targets, spacing, FAB positioning) |
| 10-deliverables-roadmap | Mobile card views are foundational — implement in Phase 1 |

---

## Implementation Notes

### Affected Files

```
apps/tracker/src/components/tenders/tenders-table.tsx
apps/tracker/src/components/projects/project-list.tsx
apps/tracker/src/components/purchase-orders/po-list.tsx
apps/tracker/src/components/clients/client-list.tsx
apps/tracker/src/components/tenders/tender-details.tsx
apps/tracker/src/components/purchase-orders/po-details.tsx
apps/tracker/src/components/shared/navigation/app-sidebar.tsx
apps/tracker/src/app/(dashboard)/layout.tsx
```

### New Files Required

```
components/shared/mobile/mobile-card.tsx
components/shared/mobile/bottom-nav.tsx
components/shared/mobile/floating-action-btn.tsx
components/shared/mobile/filter-drawer.tsx
components/shared/mobile/swipeable-row.tsx
```

### Database Changes

- [ ] None

### API Changes

- [ ] None

---

## Open Questions

- [ ] What percentage of users access the app on mobile?
- [ ] Is there a target mobile breakpoint (e.g., 768px or 640px)?
- [ ] Should mobile cards show all fields or a summary?
- [ ] Is offline support a priority?

---

## Appendix

### Mobile Breakpoint Strategy

```
< 640px  — Mobile phone (single column, cards, bottom nav)
640-768px — Large phone / small tablet (adaptive)
768-1024px — Tablet (sidebar collapsed, tables)
> 1024px — Desktop (full sidebar, tables)
```
