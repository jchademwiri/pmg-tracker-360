# PMG Tracker 360 Tracker App Final Audit Report

Date: 2026-06-14  
Auditor: Codex  
Scope: Tracker app UI/UX, workflow, mobile, data capture, navigation, schema fit, and roadmap

## Executive Summary

Tracker has a credible foundation: Next.js App Router, Better Auth, Drizzle/Postgres, shared UI primitives, tender/project/PO routes, dashboard widgets, calendar/report areas, and schema support for documents, extensions, PO line items, and delivery notes. The main issue is that the product experience is still too CRUD-oriented for the intended operational SaaS workflow.

Top priorities:

1. Add dashboard action queues for tender deadlines, briefings, follow-ups, missing documents, overdue POs, and delivery risk.
2. Expand Tender Management into a stage-based workflow with checklists, proof of submission, follow-ups, results, and award handoff.
3. Turn Project Detail into a project workspace with PO summary, delivery progress, documents, activity, risks, and closeout.
4. Implement PO line items, delivery notes, partial delivery quantities, outstanding quantities, and completion guardrails.
5. Create shared premium UI/mobile patterns: status badges, mobile cards, filter drawers, sticky actions, timelines, and steppers.

Overall implementation effort: medium to large. The navigation, status UI, and dashboard queue improvements are fast wins. Full tender workflow and PO partial delivery require DB/API/UI work.

## Current App Understanding

The Tracker app lives at `apps/tracker` in a Bun/Turborepo monorepo with `packages/db` and `packages/ui`. The app uses Next.js, React, Tailwind/shadcn-style components, Better Auth, Drizzle, Recharts, FullCalendar, React Hook Form, and Zod.

Current core routes include `/dashboard`, `/tenders/overview`, `/tenders`, `/tenders/create`, `/tenders/[id]`, `/projects/overview`, `/projects`, `/projects/[id]`, `/projects/purchase-orders`, and `/projects/purchase-orders/[id]`.

The DB schema already includes important business entities: tenders, tender extensions, projects, purchase orders, PO line items, delivery notes, delivery items, documents, notifications, organizations, members, and users. The UI does not yet surface all of that capability.

## Recommendations Summary

Main dashboard: Make the first screen queue-driven. Tender admins need closing soon, briefing sessions, missing documents, preparation state, submitted awaiting result, and follow-ups due. Managers need pipeline value, win/loss, awarded work, project delivery risk, overdue POs, and high-value opportunities. General users need assigned tasks and records requiring updates.

Tender Management: Keep the overview, but add a true stage pipeline: New Opportunity, To Review, Approved to Prepare, In Preparation, Ready for Submission, Submitted, Awaiting Result, Awarded, Lost, Cancelled. The register should add mobile cards, risk/date badges, priority, owner, and bulk actions. The detail page should become the tender workspace: summary, dates, briefing, requirements, documents, preparation checklist, pricing/submission status, follow-up log, extension history, result, and conversion.

Project Management: Project overview should show active projects, awaiting PO, open POs, partial deliveries, overdue deliveries, pending value, delivered value, and completed projects. Project detail should show linked tender, contract details, PO summary, delivery progress, documents, activity, risks/issues, and closeout.

PO Management: Replace header-only PO capture with itemized PO lines and delivery notes. Recommended statuses: Draft, Issued, Awaiting Delivery, Partially Delivered, Delivered, Completed, Cancelled, Disputed/On Hold. Delivery capture should validate delivered quantity against ordered/outstanding quantity.

Navigation: Rename “Tender Pipeline” to “Tender Management” and “Project Tracking” to “Project Management”. Add direct routes or filtered links for Tender Overview, Register, Add Tender, Calendar, Follow-ups, Submitted, Awarded, Reports; Project Overview, Register, Add Project, Purchase Orders, Deliveries, Overdue Items, Reports. Add module tabs and mobile bottom navigation.

Mobile UX: Add tender mobile cards, filter drawers, sticky detail actions, and stepped forms. Use touch-friendly target sizes and avoid horizontal table scrolling for operational lists.

Premium UI: Centralize status design, build reusable operational components, and improve hierarchy. Prioritize dense but readable SaaS screens over decorative cards.

Forms/Data Capture: Keep React Hook Form and Zod, but add stepper flows, draft saving, transition-specific dialogs, inline guidance, document upload, review screens, and stronger business validation.

## Recommended Routes

```text
/dashboard
/tenders
/tenders/register
/tenders/new
/tenders/calendar
/tenders/follow-ups
/tenders/submitted
/tenders/awarded
/tenders/[id]
/tenders/[id]/edit
/projects
/projects/register
/projects/new
/projects/[id]
/projects/[id]/edit
/projects/[id]/purchase-orders
/purchase-orders
/purchase-orders/[id]
/purchase-orders/[id]/edit
/purchase-orders/[id]/deliveries
```

The app can keep existing URLs initially and add redirects/aliases to avoid breaking current links.

## Recommended Components

Build or improve:

- `StatusBadge`
- `KpiCard` and `RiskCard`
- `DashboardActionQueue`
- `TenderStageBoard`
- `TenderChecklist`
- `FollowUpLog`
- `ExtensionHistory`
- `TenderResultPanel`
- `ProjectWorkspace`
- `ProjectPoSummary`
- `PoLineItemsEditor`
- `DeliveryNoteForm`
- `DeliveryProgress`
- `WorkflowTimeline`
- `RegisterMobileCard`
- `FilterDrawer`
- `MobileActionBar`
- `FormStepper`
- `CommandMenu`

## Database and Status Improvements

Add tender fields or related tables for stage, priority, risk level, assigned owner, next follow-up date, submitted date, submission proof, result received date, result reason, and activity events.

Add project support for risks/issues, closeout state, and stronger use of contract fields already in schema.

Expand PO statuses and fully implement existing line item and delivery note tables. Add server constraints to prevent over-delivery.

Add an activity/event table for reliable timeline and audit history instead of inferring events from `updatedAt`.

## Prioritised Implementation Roadmap

### Phase 1: Navigation and Dashboard Polish

Objective: Make the app immediately actionable after login.  
Pages affected: `/dashboard`, sidebar, tender/project overview pages.  
Components needed: status maps, action queue, risk cards, module tabs.  
Dev notes: Add queue queries before deeper schema changes where possible.

### Phase 2: Tender Mini Dashboard and Register Improvements

Objective: Turn Tender Management into a real command center.  
Pages affected: `/tenders/overview`, `/tenders`.  
Components needed: stage board, mobile tender cards, filter drawer, risk/date badges.  
Dev notes: Start with UI and filters, then add richer stage fields.

### Phase 3: Tender Detail Page and Workflow Improvements

Objective: Support preparation, submission, follow-up, result, and award conversion from one page.  
Pages affected: `/tenders/[id]`, `/tenders/create`, `/tenders/[id]/edit`.  
Components needed: checklist, document manager, follow-up log, result dialog, workflow timeline.  
Dev notes: Add transition-specific server actions instead of generic status flips.

### Phase 4: Project Mini Dashboard and Project Register Improvements

Objective: Surface delivery health and linked tender/contract context.  
Pages affected: `/projects/overview`, `/projects`, `/projects/[id]`.  
Components needed: project workspace, PO summary, delivery risk cards.  
Dev notes: Bring PO summaries directly into project detail.

### Phase 5: PO Tracking and Partial Delivery Improvements

Objective: Implement itemized fulfillment.  
Pages affected: `/projects/purchase-orders/*`, future `/purchase-orders/*`.  
Components needed: line item editor, delivery note form, delivery progress, completion review.  
Dev notes: This is the highest-complexity phase because it touches schema constraints, server actions, and UI.

### Phase 6: Mobile Optimisation and Premium UI Polish

Objective: Make mobile usage practical and visual quality consistent.  
Pages affected: all registers, detail pages, and forms.  
Components needed: mobile action bar, filter drawer, shared register cards, stepper.  
Dev notes: Do this per workflow as pages are touched, then finish with a consistency pass.

### Phase 7: Reporting, Alerts, and Automation

Objective: Add proactive operational control.  
Pages affected: dashboard, reports, notifications, calendar.  
Components needed: alert rules, report cards, notification preferences by workflow.  
Dev notes: Requires stable workflow states and activity events first.

## Final Recommended User Journeys

Tender Administrator: Logs in, sees tenders closing today, mandatory briefings, missing documents, preparation tasks, and follow-ups due. Opens Tender Management, reviews the stage pipeline, works from the highest-risk queue, completes checklist items, uploads proof, records submission, schedules follow-up, records result, and converts awarded tender into a project.

Manager/Owner: Logs in, sees pipeline value, win rate, high-value tenders, awarded work, active projects, delayed POs, overdue deliveries, and operational risk. Reviews exceptions first, drills into filtered registers, and uses reports for performance trends.

General User: Logs in, sees assigned tasks, today’s deadlines, projects/POs needing updates, and notifications. Opens the relevant record, updates delivery/follow-up/status with guided forms, and returns to the task queue.

## Research Sources

- W3C WCAG 2.2 Target Size Minimum: https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html
- W3C WCAG 2.2 Reflow: https://www.w3.org/WAI/WCAG22/Understanding/reflow.html
- W3C WCAG 2.2 Error Identification: https://www.w3.org/WAI/WCAG22/Understanding/error-identification.html
- W3C WCAG 2.2 Error Suggestion: https://www.w3.org/WAI/WCAG22/Understanding/error-suggestion.html
- Material Design 3 navigation guidance: https://m3.material.io/
- Cooperative dashboard design heuristics: https://arxiv.org/abs/2308.04514
