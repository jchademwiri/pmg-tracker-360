# Findings – 10-deliverables-roadmap.md

## Metadata

| Field | Value |
|-------|-------|
| **Prompt** | 10-deliverables-roadmap.md |
| **Date** | 2026-06-14 |
| **Auditor** | Antigravity |
| **Scope** | Final synthesis and phased implementation roadmap for Tracker app improvements. |
| **Depends On** | All previous sub-prompts (01–09) |

---

## Executive Summary

The audit of the **PMG Tracker 360 monorepo** has identified key areas of improvement across codebase structures, dashboard views, navigation architecture, and forms. While the technical base (Next.js, Drizzle, Tailwind CSS v4, Better Auth) is modern and robust, the operational workflow has critical gaps—namely the broken tender-to-project conversion and the completely unimplemented PO line items and partial delivery tracking.

This findings document synthesizes these insights and outlines a 7-phase implementation roadmap. By correcting the status query mismatch, building itemized PO inputs, and creating a mobile-optimized delivery note wizard, we can transform the Tracker app from a passive admin panel into a high-performance, mobile-friendly SaaS platform for construction and bidding operations.

**Overall Score: 9.0/10**

| Area | Score | Trend |
|------|-------|-------|
| Roadmap Sequencing | 9.0/10 | ↑ |
| Deliverables Completeness | 9.0/10 | ↑ |
| Operational Feasibility | 9.0/10 | ↑ |

---

## Current State

### What Exists Today

The application is structured as a turborepo containing three apps and shared packages for db and ui. The Tracker app is built on Next.js App Router, using Server Actions and Drizzle ORM to perform queries. 

The current interface has separate views for Admin and Specialist roles but lacks modular dashboard landing views, forcing users directly into table registers. The database has tables defined for PO line items and delivery note tracking, but these are completely unmapped to the API or user interface, preventing partial delivery recording.

---

## Findings

### Critical Issues

| # | Issue | Location | Impact | Effort |
|---|-------|----------|--------|--------|
| C1 | **Blocked Tender-to-Project Conversion** | `tenders.ts#L897` | Described in codebase findings. Status checking for `'won'` instead of `'awarded'` completely blocks project creation. | S |
| C2 | **Missing Delivery Note UI and CRUD** | PO views / actions | Described in project findings. No way to capture delivery note numbers, upload PODs, or record partial delivery quantities. | L |

### Major Issues

| # | Issue | Location | Impact | Effort |
|---|-------|----------|--------|--------|
| M1 | **Flat Navigation IA** | `dashboad-links.ts` | Described in navigation findings. Links bypass landing dashboards and drop users directly into large table registers. | S |
| M2 | **No Itemized PO Grids** | `po-form.tsx` | Described in forms findings. Total PO values must be calculated manually by users and typed as a single string. | M |
| M3 | **Member Role Over-Restriction** | `permissions.ts` | Described in codebase findings. Field staff (members) have zero PO access, blocking delivery updates. | S |

### Minor Issues

| # | Issue | Location | Impact | Effort |
|---|-------|----------|--------|--------|
| m1 | **No Keyboard Command Menu** | Codebase | Power users must click through multiple links to search records instead of using standard shortcut commands. | M |
| m2 | **Manual Form Validity Calcs** | `tender-form.tsx` | Users manually calculate validity date timelines, leading to possible forecasting errors. | S |

---

## Recommendations

### Phased Roadmap Summary

1. **Phase 1: Navigation and Dashboard Polish** (Weeks 1-2)
   - Correct C1 status bug. Refactor navigation links to target overview dashboards. load Outfit/Inter typography.
2. **Phase 2: Tender Mini Dashboard and Register Improvements** (Weeks 3-4)
   - Build `/tenders/overview` dashboard page. Add compulsory briefing visual indicators to tables.
3. **Phase 3: Tender Detail Page and Workflow Improvements** (Weeks 5-6)
   - Automate validity date calculator. Link uploader component to compliance checklists.
4. **Phase 4: Project Mini Dashboard and Register Improvements** (Weeks 7-8)
   - Build `/projects/overview` dashboard page. Add project tabs dividing Info, POs, and Documents.
5. **Phase 5: PO Tracking and Partial Delivery Improvements** (Weeks 9-10)
   - Implement PO line items grid component. Build mobile bottom sheet wizard for delivery note capturing.
6. **Phase 6: Mobile Optimisation and Premium UI Polish** (Weeks 11-12)
   - Convert desktop tables to card listings. Style glassmorphism card elevation wrappers.
7. **Phase 7: Reporting, Alerts, and Automation** (Weeks 13-14)
   - Setup Cmd+K command palette. Configure cron jobs for validity reminders.

---

## Component Inventory

Refer to the final report for the complete catalog of KPI cards, mobile register cards, timeline trees, and filter drawers.

---

## Cross-References

### Dependencies (findings this prompt consumed)

- **01-codebase-audit.md**: Codebase structure, packages, and core status bugs.
- **02-dashboard-audit.md**: Admin vs Specialist widgets layout.
- **03-tender-management.md**: Tender details, extension lists, and checklists.
- **04-project-management.md**: PO headers and missing delivery note mechanics.
- **05-workflow.md**: End-to-end lifecycle and handoffs.
- **06-mobile-ux.md**: Bottom sheets, sticky actions, and card transformations.
- **07-premium-ui.md**: OKLCH colors, glassmorphism, and easing functions.
- **08-navigation.md**: Information architecture and Cmd+K menus.
- **09-forms-data-capture.md**: Zod validation schemas and draft saving.

### Outputs (findings to pass forward)

- **FINAL-REPORT.md**: Synthesis of all recommendations into a single comprehensive deliverable.

---

## Implementation Notes

Detailed implementation file changes, database adjustments, and API listings are compiled in the final report.
