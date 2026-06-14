# 01 – Codebase Audit

**Purpose:** Before making any UI/UX recommendations, perform a detailed audit of the existing codebase. Do not make assumptions — first understand what already exists.

**Depends on:** Nothing (Phase 1 — run first)
**Feeds into:** All subsequent prompts

---

## Task

Audit the **PMG Tracker 360 monorepo**, with primary focus on the **Tracker app**. Document findings in detail.

---

## A. Monorepo Structure

Identify:
- The apps inside the monorepo
- The location of the Tracker app
- The framework and routing structure used
- Shared packages or components
- Shared UI libraries
- Shared database/schema packages
- Authentication and layout structure
- Existing navigation structure

## B. Tracker App Pages and Routes

Inspect and document all current Tracker routes/pages, especially:
- Main dashboard
- Tender management pages (register/list, add/edit, detail)
- Project management pages (register/list, add/edit, detail)
- Purchase order pages
- Delivery-related pages, if any

For each page, explain:
- What the page currently does
- What data it displays
- What actions are available
- What components it uses
- What UX problems are visible
- What is missing compared to the intended workflow

## C. Navigation Audit

Review the current sidebar/top navigation. Document:
- Current navigation groups, links, and labels
- Active states
- Mobile navigation behaviour
- Whether the navigation matches the actual tender and project workflow
- Any confusing, duplicated, or missing links

Recommend improvements only after documenting the current state.

## D. Component Audit

Inspect existing UI components used in Tracker:
- Dashboard cards, tables/registers, forms, buttons, badges
- Dialogs/modals, tabs, filters, search fields
- Empty states, loading states
- Detail page components
- Mobile-specific components, if any

For each major component, assess:
- Reusability, consistency, responsiveness
- Visual polish, accessibility, data clarity
- Whether it supports the tender/project workflow properly

## E. Database and Data Model Audit

Inspect the schema and data flow related to:
- Tenders (statuses, follow-ups, extensions, results/outcomes)
- Projects (linked tender-to-project conversion)
- Purchase orders, PO items, partial deliveries, delivery status
- Activity logs, users/roles

Document:
- Existing tables/models and fields
- Missing fields needed for the improved UX
- Status values currently used
- Whether relationships support the full tender-to-project lifecycle
- Any schema limitations affecting the UI/UX

## F. Business Logic and Workflow Audit

Inspect existing actions, server functions, API routes, services, or mutations. Identify how the app currently handles:
- Adding/editing tenders, updating status
- Recording follow-ups, extensions, results
- Converting awarded tender to project
- Creating projects and purchase orders
- Updating PO statuses, recording partial deliveries
- Completing POs and projects

For each flow, document what exists, what is incomplete, what is confusing, what should be improved/automated, and what validations are missing.

## G. Mobile Responsiveness Audit

Inspect layouts and components for mobile usability:
- Sidebar/header behaviour
- Dashboard layout and table responsiveness
- Forms on mobile
- Detail pages, action buttons, filters/search on mobile
- Whether registers become usable mobile cards
- Whether important actions remain accessible on small screens

## H. Visual Design Audit

Review the current visual quality:
- Spacing, typography, card design, colour usage
- Status colours, button hierarchy, icon usage
- Page headers, section hierarchy
- Empty states, loading states, error/success states
- Overall premium SaaS feel

## I. Audit Output

Provide a clear summary of:
1. Current route structure
2. Current navigation structure
3. Current dashboard structure
4. Current tender management flow
5. Current project management flow
6. Current PO management flow
7. Existing reusable components
8. Existing database/schema support
9. Existing mobile issues
10. Existing UI polish issues
11. Missing workflow steps
12. Highest-risk UX gaps

---

## Cross-References

- **Next:** [02-dashboard-audit.md](./02-dashboard-audit.md), [07-premium-ui.md](./07-premium-ui.md)
- **Also informs:** All other sub-prompts
- **See also:** [00-index.md](./00-index.md) for full execution strategy
