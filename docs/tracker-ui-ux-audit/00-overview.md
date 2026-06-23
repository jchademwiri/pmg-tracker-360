# Tracker UI/UX Audit Overview

Date: 2026-06-21  
App audited: `D:/websites/pmg-tracker-360/apps/tracker/`  
Docs output: `D:/websites/pmg-tracker-360/docs/tracker-ui-ux-audit/`

## Scope

This audit covers the Tracker application route tree, navigation structure, route groups, page shells, forms, tables, dashboards, empty states, loading states, error states, mobile patterns, accessibility concerns, and end-to-end workflows.

The app has two main operational domains:

1. Tender Management
2. Project Management, including purchase orders, line items, delivery notes, and project close-out

Supporting areas are also covered because they affect the daily experience: dashboard, calendar, reports, clients, organization management, settings, billing, auth, onboarding, help, and public pages.

## Research Baseline

External UX references used for comparison:

- GOV.UK Design System table guidance: tables should help users compare and scan rows and columns, include clear headers/captions, and align numeric data for comparison. Source: https://design-system.service.gov.uk/components/table/
- GOV.UK Design System tag guidance: status tags should be short, consistent labels that communicate state without relying on color alone. Source: https://design-system.service.gov.uk/components/tag/
- Atlassian Design lozenge guidance: compact status indicators work best when semantic tone and label text are consistent across products. Source: https://atlassian.design/components/lozenge/
- W3C WAI accessibility guidance: navigation should be consistent, form controls need clear labels, feedback should be prominent, color cannot be the only carrier of meaning, and layouts must adapt across viewport sizes. Source: https://www.w3.org/WAI/tips/designing/
- Vercel Web Interface Guidelines: audit emphasis on responsive layout, accessible controls, clear hierarchy, predictable interaction, and avoiding decorative UI that competes with task completion. Source: https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md

## Executive Summary

Tracker already has the structural foundation of a useful internal operations tool: a persistent sidebar, dashboard route group, mobile bottom navigation, role-aware purchase-order access, status badges, responsive cards for some tables, and specific workflows for tender follow-up, tender award conversion, purchase order delivery, project risk tracking, and document management.

The main UX issue is uneven maturity across modules. Tender Management has the most complete workflow model, with overview metrics, lifecycle stages, status filters, document compliance, extensions, and follow-ups. Project Management has a more ambitious detail workspace, but its list and overview pages are less informative, and the workspace visual language diverges sharply from the rest of the app. Purchase Orders and Delivery Notes are functional, but their tables and forms need stronger guided states, clearer status transitions, and better mobile handling for dense line-item entry.

The highest-value improvements are:

- Create two first-class operational dashboards: Tender Management and Project Management.
- Normalize navigation labels and route grouping around work users actually do.
- Standardize table, filter, empty state, loading, error, and status badge patterns.
- Reduce one-off dark/glass styling in project workspace and align it with the calmer admin interface.
- Add explicit workflow states for draft, submitted, evaluation, awarded, converted, sent, partially delivered, completed, disputed, and closed-out.
- Improve mobile line-item workflows by using stacked item editors or progressive detail drawers instead of wide editable tables.
- Add better permission, no-organization, not-found, and destructive-action patterns.

## Route Tree Cross-Check

The live route tree was inspected from `apps/tracker/src/app`. Every page/sub-page below is assigned to a report file.

| Route | Source page | Covered in |
|---|---|---|
| `/` | `src/app/page.tsx` | `06-shared-components.md` |
| `/about` | `src/app/about/page.tsx` | `06-shared-components.md` |
| `/blog` | `src/app/blog/page.tsx` | `06-shared-components.md` |
| `/careers` | `src/app/careers/page.tsx` | `06-shared-components.md` |
| `/contact` | `src/app/contact/page.tsx` | `06-shared-components.md` |
| `/help` | `src/app/help/page.tsx` | `06-shared-components.md` |
| `/modules` | `src/app/modules/page.tsx` | `01-navigation-and-information-architecture.md` |
| `/privacy` | `src/app/privacy/page.tsx` | `06-shared-components.md` |
| `/terms` | `src/app/terms/page.tsx` | `06-shared-components.md` |
| `/training` | `src/app/training/page.tsx` | `06-shared-components.md` |
| `/waitlist` | `src/app/waitlist/page.tsx` | `06-shared-components.md` |
| `/login` | `src/app/(auth)/login/page.tsx` | `06-shared-components.md` |
| `/sign-up` | `src/app/(auth)/sign-up/page.tsx` | `06-shared-components.md` |
| `/forgot-password` | `src/app/(auth)/forgot-password/page.tsx` | `06-shared-components.md` |
| `/reset-password` | `src/app/(auth)/reset-password/page.tsx` | `06-shared-components.md` |
| `/check-email` | `src/app/(auth)/check-email/page.tsx` | `06-shared-components.md` |
| `/invite/accept/[invitationId]` | `src/app/invite/accept/[invitationId]/page.tsx` | `06-shared-components.md` |
| `/onboarding` | `src/app/onboarding/page.tsx` | `06-shared-components.md` |
| `/organization/select` | `src/app/organization/select/page.tsx` | `01-navigation-and-information-architecture.md` |
| `/dashboard` | `src/app/(dashboard)/dashboard/page.tsx` | `01-navigation-and-information-architecture.md` |
| `/calendar` | `src/app/(dashboard)/calendar/page.tsx` | `01-navigation-and-information-architecture.md` |
| `/reports` | `src/app/(dashboard)/reports/page.tsx` | `01-navigation-and-information-architecture.md` |
| `/clients` | `src/app/(dashboard)/clients/page.tsx` | `06-shared-components.md` |
| `/clients/create` | `src/app/(dashboard)/clients/create/page.tsx` | `06-shared-components.md` |
| `/clients/[id]` | `src/app/(dashboard)/clients/[id]/page.tsx` | `06-shared-components.md` |
| `/clients/[id]/edit` | `src/app/(dashboard)/clients/[id]/edit/page.tsx` | `06-shared-components.md` |
| `/organization` | `src/app/(dashboard)/organization/page.tsx` | `01-navigation-and-information-architecture.md` |
| `/organization/create` | `src/app/(dashboard)/organization/create/page.tsx` | `01-navigation-and-information-architecture.md` |
| `/organization/[slug]` | `src/app/(dashboard)/organization/[slug]/page.tsx` | `01-navigation-and-information-architecture.md` |
| `/organization/[slug]/settings/transfer-ownership` | `src/app/(dashboard)/organization/[slug]/settings/transfer-ownership/page.tsx` | `01-navigation-and-information-architecture.md` |
| `/settings` | `src/app/(dashboard)/settings/page.tsx` | `06-shared-components.md` |
| `/settings/overview` | `src/app/(dashboard)/settings/overview/page.tsx` | `06-shared-components.md` |
| `/settings/notifications` | `src/app/(dashboard)/settings/notifications/page.tsx` | `06-shared-components.md` |
| `/settings/profile` | `src/app/(dashboard)/settings/profile/page.tsx` | `06-shared-components.md` |
| `/billing` | `src/app/(dashboard)/billing/page.tsx` | `06-shared-components.md` |
| `/billing/upgrade` | `src/app/(dashboard)/billing/upgrade/page.tsx` | `06-shared-components.md` |
| `/tenders/overview` | `src/app/(dashboard)/tenders/overview/page.tsx` | `02-tender-management.md` |
| `/tenders` | `src/app/(dashboard)/tenders/page.tsx` | `02-tender-management.md` |
| `/tenders/create` | `src/app/(dashboard)/tenders/create/page.tsx` | `02-tender-management.md` |
| `/tenders/[id]` | `src/app/(dashboard)/tenders/[id]/page.tsx` | `02-tender-management.md` |
| `/tenders/[id]/edit` | `src/app/(dashboard)/tenders/[id]/edit/page.tsx` | `02-tender-management.md` |
| `/projects/overview` | `src/app/(dashboard)/projects/overview/page.tsx` | `03-project-management.md` |
| `/projects` | `src/app/(dashboard)/projects/page.tsx` | `03-project-management.md` |
| `/projects/create` | `src/app/(dashboard)/projects/create/page.tsx` | `03-project-management.md` |
| `/projects/contracts` | `src/app/(dashboard)/projects/contracts/page.tsx` | `03-project-management.md` |
| `/projects/[id]` | `src/app/(dashboard)/projects/[id]/page.tsx` | `03-project-management.md` |
| `/projects/[id]/edit` | `src/app/(dashboard)/projects/[id]/edit/page.tsx` | `03-project-management.md` |
| `/projects/[id]/items` | `src/app/(dashboard)/projects/[id]/items/page.tsx` | `03-project-management.md` |
| `/projects/[id]/items/new` | `src/app/(dashboard)/projects/[id]/items/new/page.tsx` | `03-project-management.md` |
| `/projects/[id]/items/[itemId]/edit` | `src/app/(dashboard)/projects/[id]/items/[itemId]/edit/page.tsx` | `03-project-management.md` |
| `/projects/purchase-orders` | `src/app/(dashboard)/projects/purchase-orders/page.tsx` | `04-purchase-orders.md` |
| `/projects/purchase-orders/create` | `src/app/(dashboard)/projects/purchase-orders/create/page.tsx` | `04-purchase-orders.md` |
| `/projects/purchase-orders/[id]` | `src/app/(dashboard)/projects/purchase-orders/[id]/page.tsx` | `04-purchase-orders.md` |
| `/projects/purchase-orders/[id]/edit` | `src/app/(dashboard)/projects/purchase-orders/[id]/edit/page.tsx` | `04-purchase-orders.md` |
| `/projects/purchase-orders/[id]/deliveries/new` | `src/app/(dashboard)/projects/purchase-orders/[id]/deliveries/new/page.tsx` | `05-delivery-notes.md` |
| `not-found` | `src/app/not-found.tsx` | `06-shared-components.md` |

Cross-check result: no `page.tsx`, route-group page, loading file, or top-level not-found page from the inspected route tree is intentionally excluded.

## Report Index

- `01-navigation-and-information-architecture.md`
- `02-tender-management.md`
- `03-project-management.md`
- `04-purchase-orders.md`
- `05-delivery-notes.md`
- `06-shared-components.md`
- `07-mobile-responsiveness.md`
- `08-recommended-roadmap.md`

