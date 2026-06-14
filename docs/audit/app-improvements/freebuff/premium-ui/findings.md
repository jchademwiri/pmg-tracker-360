# Findings: Premium SaaS UI Direction

---

## Metadata

| Field | Value |
|-------|-------|
| **Prompt** | 07-premium-ui.md |
| **Date** | 2026-06-14 |
| **Auditor** | Buffy (AI Audit) |
| **Scope** | Premium SaaS UI direction and design system recommendations |
| **Depends On** | 01-codebase-audit |

---

## Executive Summary

The Tracker app currently uses shadcn/ui defaults without a cohesive design system. The visual quality is functional but lacks the premium feel expected of a serious business operations platform. Modern SaaS design (2024-2026) prioritises progressive disclosure, calm information density, and clear visual hierarchy — none of which are present in the current implementation. A comprehensive design system overhaul is needed covering colour, typography, spacing, card design, status indicators, and component variants.

**Overall Score: 4/10**

| Area | Score | Trend |
|------|-------|-------|
| Colour System | 3/10 | ↓ |
| Typography | 4/10 | → |
| Card Design | 4/10 | → |
| Status Indicators | 3/10 | ↓ |
| Component Consistency | 5/10 | → |
| Premium Feel | 3/10 | ↓ |

---

## Current State

### What Exists Today

- **Framework:** Tailwind CSS 4 + shadcn/ui + Radix primitives
- **Theme:** next-themes with dark/light mode toggle
- **Icons:** Lucide React (consistent library choice)
- **Charts:** Recharts (functional but basic styling)
- **Colours:** shadcn default palette — no custom brand colours
- **Typography:** Default Tailwind font stack — no custom fonts loaded
- **Cards:** shadcn Card component — flat, no depth or elevation system
- **Status Colours:** Inline spans with ad-hoc colour classes per component

### Architecture Notes

- Component library lives in `apps/tracker/src/components/ui/` (shadcn conventions)
- Domain components in `apps/tracker/src/components/{tenders,projects,clients,purchase-orders,dashboard}/`
- No design tokens file — all styling is inline Tailwind classes
- No storybook or component documentation

---

## Findings

### Critical Issues

| # | Issue | Location | Impact | Effort |
|---|-------|----------|--------|--------|
| C1 | No brand colour system — relies entirely on shadcn defaults | Global | App looks generic, no visual identity | M |
| C2 | Status colours are inconsistent across components | Various | Users cannot reliably interpret status at a glance | S |
| C3 | No typography scale — headings lack hierarchy and distinction | Global | Poor information architecture, flat visual feel | S |

### Major Issues

| # | Issue | Location | Impact | Effort |
|---|-------|----------|--------|--------|
| M1 | Cards are flat with no elevation or depth system | Global | No visual grouping, feels like a basic admin panel | M |
| M2 | Button hierarchy is unclear — multiple outline buttons compete for attention | Global | Users cannot distinguish primary from secondary actions | S |
| M3 | Empty states are plain text with no illustrations | `no-results.tsx`, `empty-search-results.tsx` | Feels incomplete and unprofessional | S |
| M4 | No gradient or glass effects — design feels 2020-era | Global | Not competitive with modern SaaS (Linear, Vercel) | L |
| M5 | Spacing is inconsistent between sections and cards | Global | Visual noise, lacks rhythm | S |
| M6 | Loading states vary between components (Skeleton, Spinner, custom) | Various | Inconsistent experience during data fetching | S |

### Minor Issues

| # | Issue | Location | Impact | Effort |
|---|-------|----------|--------|--------|
| m1 | No hover effects on cards or interactive elements | Global | Reduced interactivity feel | S |
| m2 | Progress bars are basic shadcn Progress — no ring or animated variants | Global | Missed opportunity for visual interest | S |
| m3 | No transition animations between page states | Global | Feels jarring on navigation | S |
| m4 | Charts use default Recharts styling | `dashboard-charts.tsx` | Basic chart appearance | S |
| m5 | No icon sizing system — icons vary between components | Global | Inconsistent icon treatment | S |

---

## Recommendations

### Quick Wins (1-2 days)

1. **Define brand colour palette**
   - What: Create a CSS custom property-based colour system with primary (professional blue), secondary (teal), accent (amber for urgency), plus semantic status colours
   - Where: `tailwind.config.ts` or CSS variables in `globals.css`
   - Expected outcome: Consistent, professional colour language across the app

2. **Create StatusBadge component with consistent colour mapping**
   - What: Build a unified `StatusBadge` component that maps tender/project/PO statuses to consistent colours with icons
   - Where: New `components/shared/status-badge.tsx`
   - Expected outcome: Instant visual recognition of status across all views

3. **Add card elevation system**
   - What: Define 3 levels of card depth (flat, raised, elevated) using subtle shadows and borders
   - Where: CSS variables, update all Card usage
   - Expected outcome: Visual hierarchy through depth

### Short-Term (1-2 weeks)

1. **Implement design token system**
   - What: Create a comprehensive set of CSS custom properties for colours, spacing, typography, shadows, and radii
   - Where: New `styles/design-tokens.css`, update Tailwind config
   - Expected outcome: Single source of truth for all visual properties

2. **Build premium empty states**
   - What: Create illustrated empty states with helpful CTAs for each register
   - Where: New `components/shared/empty-states/` with SVG illustrations
   - Expected outcome: Professional, helpful empty states that guide users

3. **Add typography scale**
   - What: Define a typographic hierarchy with font weights, sizes, and line heights for h1-h6, body, caption, label
   - Where: CSS variables, global styles
   - Expected outcome: Clear information hierarchy

### Medium-Term (1-3 months)

1. **Build component design system documentation**
   - What: Document all component variants, usage guidelines, and examples
   - Where: New docs section or Storybook
   - Expected outcome: Consistent component usage across the team

2. **Add micro-interactions and transitions**
   - What: Implement page transitions, card hover effects, button animations, and loading state animations
   - Where: Global CSS, individual components
   - Expected outcome: Polished, responsive feel

3. **Implement premium dashboard visualisations**
   - What: Redesign charts with brand colours, custom tooltips, and animated transitions
   - Where: `dashboard-charts.tsx`, chart components
   - Expected outcome: Data visualisation that matches premium SaaS standards

---

## Component Inventory

| Component | Current State | Recommended State | Priority |
|-----------|--------------|-------------------|----------|
| StatusBadge | Non-existent — inline spans | Unified component with colour + icon mapping | P0 |
| KPI Card | Basic shadcn Card | Premium stat card with trend indicator, sparkline, and depth | P0 |
| EmptyState | Plain text | Illustrated with CTAs and helpful copy | P1 |
| ProgressIndicator | shadcn Progress bar | Multiple variants: bar, ring, steps, percentage | P1 |
| ActivityTimeline | Basic list | Visual timeline with dots, lines, and timestamps | P1 |
| Button | shadcn variants only | Extended with icon-only, loading, gradient variants | P1 |
| Table | shadcn Table | Premium table with row hover, selection, and skeleton loading | P2 |
| Modal/Dialog | shadcn Dialog | Premium modal with backdrop blur and smooth transitions | P2 |
| Toast | Sonner (functional) | Custom toast with brand styling and icons | P2 |

---

## Design System Recommendations

### Colour Palette

```
Primary:    #2563EB (Professional Blue) — CTAs, links, active states
Secondary:  #0D9488 (Teal) — Secondary actions, highlights
Accent:     #F59E0B (Amber) — Urgency, warnings, deadlines
Success:    #10B981 (Emerald) — Completed, delivered, on-track
Warning:    #F59E0B (Amber) — Due soon, attention needed
Error:      #EF4444 (Red) — Overdue, failed, critical
Info:       #3B82F6 (Blue) — Informational, neutral status

Background: #F8FAFC (Light) / #0F172A (Dark)
Surface:    #FFFFFF (Light) / #1E293B (Dark)
Border:     #E2E8F0 (Light) / #334155 (Dark)
Text:       #0F172A (Primary) / #64748B (Secondary)
```

### Typography

```
Font:       Inter (Google Fonts) — clean, professional, excellent readability
H1:         30px / Bold / -0.02em tracking
H2:         24px / Semibold / -0.01em tracking
H3:         20px / Semibold
Body:       14px / Regular / 1.5 line-height
Caption:    12px / Regular / 1.4 line-height
Label:      12px / Medium / 0.05em uppercase tracking
```

### Spacing System

```
4px   — xs
8px   — sm
12px  — md
16px  — lg
24px  — xl
32px  — 2xl
48px  — 3xl
64px  — 4xl
```

### Card Elevation System

```
Level 0 (Flat):     No shadow, subtle border — for inline content
Level 1 (Raised):   shadow-sm, no border — for cards in grids
Level 2 (Elevated): shadow-md, subtle border — for modals, overlays
```

---

## Cross-References

### Dependencies (findings this prompt consumed)

| Prompt | Key Finding Used |
|--------|------------------|
| 01-codebase-audit | Component library is shadcn/ui; no design tokens; visual polish needed |

### Outputs (findings to pass forward)

| Prompt | Key Finding to Consume |
|--------|------------------------|
| 06-mobile-ux | Design system must include mobile-specific variants (FAB, bottom sheets, card layouts) |
| 10-deliverables-roadmap | Design token system and StatusBadge are foundational — implement first |

---

## Implementation Notes

### Affected Files

```
apps/tracker/src/app/globals.css (or equivalent)
apps/tracker/src/components/ui/*.tsx (all shadcn components)
apps/tracker/src/components/dashboard/*.tsx
apps/tracker/src/components/tenders/*.tsx
apps/tracker/src/components/projects/*.tsx
apps/tracker/src/components/purchase-orders/*.tsx
```

### New Files Required

```
styles/design-tokens.css
components/shared/status-badge.tsx
components/shared/empty-state-illustrated.tsx
components/shared/kpi-card-premium.tsx
components/shared/progress-indicator.tsx
```

### Database Changes

- [ ] None — design system is purely frontend

### API Changes

- [ ] None — design system is purely frontend

---

## Open Questions

- [ ] Is there an existing brand colour palette or logo that should inform colour choices?
- [ ] Should we support custom theming per organisation (white-label)?
- [ ] Is dark mode a priority, or focus on light mode first?
- [ ] Are there accessibility requirements (WCAG AA/AAA)?

---

## Appendix

### Research Sources

- **Linear** — Master of calm design, progressive disclosure, task-focused UI
- **Vercel** — Binary status design, instant clarity on dashboard
- **Stripe** — Single-metric focus, premium card design, excellent typography
- **Notion** — Modular components, user-configurable dashboards
- **Datadog** — Data-heavy analytics with global filters
- Eleken: SaaS Dashboard Design Guide (2026)
- 925Studios: 35 SaaS Dashboard Design Examples (2026)
- Setproduct: Dashboard UI Design Guide (2026)
