---
name: ui-ux-pro-max
description: Apply high-end, production-grade UI/UX design systems, modern visual aesthetics, accessibility (WCAG AA/AAA), cognitive load reduction, and micro-interactions. Use when designing, redesigning, styling, or auditing web interfaces, navigation, dashboards, and components for maximum usability and aesthetic excellence.
metadata:
  author: pmg-design-system
  version: "1.0.0"
---

# UI/UX Pro Max Design System & Heuristics

A comprehensive design intelligence guideline for building world-class, distinctive, intuitive, and frictionless web interfaces.

---

## 1. Core Principles (Design for Humans)

1. **Zero Cognitive Friction**: Non-technical users should never wonder "what does this do?" or "where did my item go?".
2. **1-Click Workspaces**: Elevate high-frequency tools to top-level access. Eliminate deep accordion nesting and unnecessary sub-pages.
3. **Progressive Disclosure**: Keep default screens clean and scannable; reveal complex filters, advanced options, and raw data on demand or within focused drawers/modals.
4. **Intentional Hierarchy**: Use size, weight, color contrast, and spacing to naturally guide the user's eye:
   - Primary: Page title & core action button (e.g., "Add Tender", "Save Changes")
   - Secondary: Filter bar, search input, summary metric badges
   - Tertiary: Dense tabular data, metadata timestamps, supplementary links

---

## 2. Visual Aesthetics & Token Architecture

### Typography & Rhythm
- Use 4px / 8px grid systems for padding, margins, and line heights.
- Apply optical tracking / letter-spacing:
  - Large headings (`text-2xl` - `text-4xl`): `tracking-tight` (`letter-spacing: -0.02em`)
  - Subheadings & labels (`text-xs` - `text-sm`): `tracking-normal` or `tracking-wide` for uppercase badges
- Never use untracked oversized typography. Ensure line heights provide generous breathing room (`leading-relaxed` on body text).

### Color & Contrast
- Use semantic HSL CSS variables: `--background`, `--foreground`, `--primary`, `--muted`, `--accent`, `--border`, `--destructive`.
- Avoid harsh pure blacks (`#000000`) or pure whites; use tailored neutral zinc/slate palettes with depth.
- Status colors must be unambiguous:
  - **Success / On Track**: Emerald/Green (`text-emerald-600 bg-emerald-500/10 border-emerald-500/20`)
  - **Warning / Pending / Closing Soon**: Amber/Orange (`text-amber-600 bg-amber-500/10 border-amber-500/20`)
  - **Urgent / Overdue / Critical**: Rose/Red (`text-rose-600 bg-rose-500/10 border-rose-500/20`)
  - **Info / Evaluation / Active**: Blue/Sky (`text-sky-600 bg-sky-500/10 border-sky-500/20`)

### Surface & Depth
- **Borders**: Crisp, ultra-subtle border outlines (`border border-border/60 dark:border-border/40`).
- **Cards**: Elevated cards with subtle shadows (`shadow-sm hover:shadow-md transition-all duration-200`).
- **Translucency**: Sticky headers and floating toolbars use backdrop blur (`bg-background/80 backdrop-blur-md border-b border-border/50`).

---

## 3. Motion & Micro-Interactions

- **Transition Durations**: Interactive hover/focus transitions must be fast and responsive (`150ms` to `200ms` with `ease-out`).
- **Hover Feedback**: Buttons, table rows, and navigation items provide immediate, tactile visual feedback (subtle background shift, icon nudge, or contrast highlight).
- **Loading States**: Use skeleton loaders that accurately mirror the geometric layout of target content rather than generic full-page spinners to prevent jarring cumulative layout shifts (CLS).

---

## 4. Navigation & Layout Best Practices

- **Flat Navigation**: Group items logically into 2-3 clean sidebar sections with clear section headers.
- **Active State Indicators**: Clear visual feedback showing the current page (e.g. solid or tinted accent background, high-contrast icon, font-medium weight).
- **Responsive Adaptability**:
  - Desktop: Collapsible sidebar with icon tooltips and rail toggle.
  - Mobile: Fixed bottom navigation bar for primary tabs + quick overflow sheet for secondary tools.
- **Dynamic Breadcrumbs**: Always present contextual breadcrumbs at the top of content so users know exactly where they are in deep dossiers (`Tenders > Eskom Power Line > Edit`).

---

## 5. Anti-Patterns to Avoid ("Forbidden Clichés")

- ❌ Multi-nested accordions that require 3 clicks to open a standard register.
- ❌ Duplicate overview pages that compete with the main executive dashboard.
- ❌ Generic AI purple-on-dark glowing gradients.
- ❌ Hardcoded colors bypassing CSS theme tokens.
- ❌ Dense tables without sorting, search filtering, or pagination.
