---
name: frontend-mastery
description: Comprehensive frontend UI/UX development and design system mastery. Use whenever building, redesigning, styling, or auditing web components, pages, forms, dashboards, and layouts. Combines frontend-design, ui-ux-pro-max, web-design-guidelines, shadcn, and vercel-react-best-practices.
---

# Frontend Mastery Skill

This is the unified, composite frontend super-skill. When this skill is activated, you must adhere to the core principles and rules from the foundational UI/UX and engineering skills below.

---

## 1. Required Sub-Skills Reference
Before generating or modifying frontend code, consult the specialized knowledge in these local skills:
* **Visual Aesthetics & Styling**: `.agents/skills/frontend-design/SKILL.md`
* **Micro-interactions & UX Accessibility**: `.agents/skills/ui-ux-pro-max/SKILL.md`
* **Web Standards & Interface Guidelines**: `.agents/skills/web-design-guidelines/SKILL.md`
* **Component Architecture**: `.agents/skills/shadcn/SKILL.md`
* **React 19 & Next.js Performance**: `.agents/skills/vercel-react-best-practices/SKILL.md`

---

## 2. Core Frontend Rules & Guidelines

### A. Aesthetics & Visual Hierarchy
1. **Curated Color Systems**: Use theme-aware semantic color variables (HSL / Tailwind CSS variables). Avoid harsh pure blacks (`#000000`) or raw saturated primaries.
2. **Typography**: Ensure clear visual hierarchy with distinct font sizes, line heights (`leading-normal`/`leading-relaxed`), and tracking (`tracking-tight` for titles).
3. **Depth & Texture**: Use subtle elevation borders (`border-border/60`), muted surface layering, and soft shadows rather than flat borderless blocks or harsh glowing outlines.
4. **Forbidden AI Clichés**:
   - ❌ No violet/purple text on dark backgrounds.
   - ❌ No generic icon-stuffed bento boxes without clear utility.
   - ❌ No floating gradient text keywords in headings.
   - ❌ No 3+ levels of nested cards.

### B. UX, Interaction & Responsiveness
1. **Interactive Feedback**: Every clickable element must have distinct hover, focus-visible, and active/pressed states.
2. **Fluid Layouts**: Components must be responsive down to mobile viewports (`< 375px`) without horizontal overflow or clipped text.
3. **Accessibility (WCAG AA/AAA)**:
   - Ensure text contrast meets a minimum of 4.5:1.
   - All interactive icons/buttons require accessible `aria-label` or visually hidden screen reader text.
   - Support full keyboard navigation (`Tab`, `Enter`, `Escape`, `Space`).
4. **Loading & Optimistic States**: Use skeletons, spinners, and disabled states during asynchronous operations.

### C. Performance & Architecture
1. **Next.js & React 19 Patterns**:
   - Default to Server Components (`RSC`) for data fetching.
   - Use Client Components (`"use client"`) only at leaf nodes requiring state or event listeners.
   - Prevent unnecessary re-renders using stable callbacks and derived state.
2. **Component Composition**: Compose with Radix UI primitives and Shadcn components rather than building ad-hoc unstyled divs.
