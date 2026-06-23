# Findings – 06-mobile-ux.md

## Metadata

| Field | Value |
|-------|-------|
| **Prompt** | 06-mobile-ux.md |
| **Date** | 2026-06-14 |
| **Auditor** | Antigravity |
| **Scope** | Audit of mobile-responsiveness, touch layouts, and mobile-specific design requirements. |
| **Depends On** | 01-codebase-audit.md, 02-dashboard-audit.md |

---

## Executive Summary

The Tracker monorepo layout includes basic responsive design features. The sidebar collapses into an overlay drawer on screens smaller than 768px, and key grid layouts stack vertically. It also sets interactive elements to a minimum 44px touch target size in `globals.css`.

However, the core data registers (Tenders, Projects, POs) are rendered using desktop-oriented tables that overflow horizontally on mobile screens, making them difficult to use. Filters stack vertically on small screens and push critical data below the fold, while complex forms are rendered in long, single-column scrolls without step-by-step pagination or wizard layouts.

**Overall Score: 6.0/10**

| Area | Score | Trend |
|------|-------|-------|
| Mobile Navigation | 8.0/10 | ↑ |
| Table-to-Card Conversion | 3.0/10 | ↓ |
| Mobile Forms & Inputs | 5.0/10 | → |
| Detail Views & Actions | 6.0/10 | → |

---

## Current State

### What Exists Today

1. **Responsive Side Drawer Navigation:**
   - Powered by Shadcn's `<SidebarProvider>` and `<SidebarInset>`. On mobile screens, the navigation pane slides in from the left as an overlay.

2. **Form Layout Wrapping:**
   - Uses grid utilities (e.g. `grid-cols-1 md:grid-cols-2`) so forms wrap into a single-column layout on small displays.

3. **Touch Targets:**
   - In `globals.css`, interactive elements have `min-height: 44px` and `min-width: 44px` enforced to comply with WCAG accessibility guidelines.

### Architecture Notes

- Uses standard Tailwind breakpoints (`sm:`, `md:`, `lg:`, `xl:`).
- Layout handles basic mobile displays, but the actual app content lacks mobile-optimized components.

---

## Findings

### Critical Issues

*No critical blockers (mainly UX and responsiveness issues).*

### Major Issues

> Issues that significantly degrade UX or operational efficiency.

| # | Issue | Location | Impact | Effort |
|---|-------|----------|--------|--------|
| M1 | **Horizontal Table Overflow** | `tenders-table.tsx`, project lists | Table rows do not compress or convert into mobile cards. Users must scroll horizontally to read tender values, clients, and deadlines. | M |
| M2 | **Cramped Register Filters** | `tenders-search-filters.tsx` | Desktop search, status, and client filters stack on mobile, pushing the table content far below the initial screen view. | M |
| M3 | **Form Completion Fatigue** | `tender-form.tsx`, `po-form.tsx` | Multi-step forms (e.g., adding pricing, contact details, dates, and files) scroll as one long list, leading to high abandonment rates. | M |

### Minor Issues

> Polish items, inconsistencies, and small UX improvements.

| # | Issue | Location | Impact | Effort |
|---|-------|----------|--------|--------|
| m1 | **Hard-to-Reach Actions** | `po-details.tsx#L142`, detail pages | Primary actions (like Edit, Save, or Status updates) are positioned in the top-right header, which is hard to tap with one hand. | S |
| m2 | **Desktop Chart Scaling** | `dashboard-charts.tsx` | Graphs crop or shrink on mobile, losing labels and legends. | M |

---

## Recommendations

### Quick Wins (1-2 days)

1. **Implement Sticky Bottom Actions**
   - **What**: On mobile devices, dock primary action buttons (like "Save Draft" or "Submit Bid") to a sticky footer bar.
   - **Where**: `tender-form.tsx` and `po-form.tsx`
   - **Expected outcome**: Important buttons remain within thumb reach.

2. **Hide Non-Essential Table Columns on Mobile**
   - **What**: Use Tailwind's hidden/visible classes (e.g., `hidden sm:table-cell`) to hide extra columns (like Validity Days, Phone, Email) in mobile views.
   - **Where**: `tenders-table.tsx` and PO register lists.
   - **Expected outcome**: Clean, fits-on-screen mobile tables.

### Short-Term (1-2 weeks)

1. **Build Card Layouts for Mobile Registers**
   - **What**: Render a list of cards instead of a table when the viewport is small.
     - **Tender Card**: Shows Tender Number, Client Name, Submission Date, Value, and Status badge.
     - **PO Card**: Shows PO Number, Supplier, Delivery Status, and Expected Delivery Date.
   - **Where**: `tenders-table.tsx`, `po-list.tsx`
   - **Expected outcome**: Easy-to-read list views on mobile.

2. **Create bottom-sheet Filter Drawer**
   - **What**: Move search filters into a slide-up bottom sheet drawer that opens with a single floating "Filter" button.
   - **Where**: `tenders-search-filters.tsx`
   - **Expected outcome**: Reclaims screen real estate on mobile.

### Medium-Term (1-3 months)

1. **Step-by-Step Form Wizards**
   - **What**: Refactor complex forms into step-by-step wizard layouts on mobile (Step 1: General Info, Step 2: Financials, Step 3: Contacts, Step 4: Documents).
   - **Where**: `tender-form.tsx`, `po-form.tsx`
   - **Expected outcome**: Less overwhelming data entry on mobile.

---

## Component Inventory

| Component | Current State | Recommended State | Priority |
|-----------|--------------|-------------------|----------|
| **Sidebar Menu** | Standard overlay drawer. | Keep current drawer behavior but add swipe-to-close support. | P2 |
| **Register Tables** | Table columns clip. | Show simplified card list on mobile screens. | P0 |
| **Filter Bar** | Stacks vertically, taking up half the screen. | Collapse filters into a bottom sheet drawer. | P0 |
| **Detail Header Actions** | Positioned at top-right. | Dock as a floating action bar at the bottom. | P1 |

---

## Cross-References

### Dependencies (findings this prompt consumed)

| Prompt | Key Finding Used |
|--------|------------------|
| 01-codebase-audit.md | Layout structures and components in `tenders-table.tsx`, `po-list.tsx`, and sidebar layout. |
| 02-dashboard-audit.md | Metrics and dashboard widget cards layouts. |

### Outputs (findings to pass forward)

| Prompt | Key Finding to Consume |
|--------|------------------------|
| 07-premium-ui.md | Translating mobile cards and bottom sheets into the visual design system. |
| 08-navigation.md | Mobile navigation menus and routing layouts. |
| 09-forms-data-capture.md | Step-by-step form validation flows. |
| 10-deliverables-roadmap.md | Prioritizing mobile responsiveness in the rollout stages. |

---

## Implementation Notes

### Affected Files

```
apps/tracker/src/components/tenders/tenders-table.tsx
apps/tracker/src/components/tenders/tenders-search-filters.tsx
apps/tracker/src/components/purchase-orders/po-list.tsx
apps/tracker/src/components/purchase-orders/po-details.tsx
```

### New Files Required

```
apps/tracker/src/components/ui/bottom-sheet.tsx
apps/tracker/src/components/shared/mobile-card.tsx
```

### Database Changes

*None.*

### API Changes

*None.*
