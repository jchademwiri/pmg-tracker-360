# Tender Management Audit

## Current Area Summary

Routes:

- `/tenders/overview`
- `/tenders`
- `/tenders/create`
- `/tenders/[id]`
- `/tenders/[id]/edit`

Core components:

- `TenderForm`
- `TendersOverviewClient`
- `TendersSearchFilters`
- `TendersTable`
- `TenderDetails`
- `TenderToProjectDialog`
- `TenderLostDialog`
- `TenderFollowUpDialog`
- `ExtensionList`
- `DocumentManager`
- `PipelineFunnel`
- `ClosingSoonWidget`
- `UpcomingDeadlines`
- `RecentActivity`

Tender Management is the strongest workflow area in the app. It includes a dashboard, filtered register, multi-step create/edit form, tender lifecycle stage control, document compliance checklist, follow-up logs, extensions, and award-to-project conversion.

## Dashboard Recommendation

The Tender Management dashboard should become a dedicated operational cockpit:

- Top action queue: closing today, closing in 7 days, overdue, mandatory briefing not attended, awaiting result follow-up, awarded not converted.
- Pipeline summary: opportunity, review, approved, preparation, ready, submitted, evaluation, awarded/lost.
- Financial summary: total pipeline value, weighted value, award value, win rate, average tender value.
- Workload summary: tenders by owner/preparer, tenders missing documents, tenders missing client contact.
- Calendar strip: upcoming briefings, closing dates, validity expiry, follow-up dates.
- Fast actions: add tender, log follow-up, upload document, convert awarded tender.

This should replace the current "snapshot only" feel with a work-prioritization dashboard.

## Page Audit

### `/tenders/overview`

- Current purpose: Quick snapshot of tender pipeline and key metrics.
- Observations: Good cards for total tenders, win rate, value, upcoming deadlines. Browse-by-status cards make the register discoverable. Pipeline funnel, closing soon, deadlines, and activity are useful.
- Problems: Status model mixes simple statuses (`open`, `evaluation`, `awarded`) with richer lifecycle statuses used in detail (`new`, `review`, `approved_to_prepare`, `preparation`, `ready`, `submitted`). This creates potential mismatch between dashboard, table filters, and detail workflow.
- Missing states/workflows: No explicit "awaiting conversion" card, no "briefing mandatory but not attended", no "validity expires soon", no "documents incomplete".
- Mobile issues: Five status cards can become a long stack; the dashboard should prioritize action queues before metrics on mobile.
- Accessibility concerns: Color-coded status cards need text labels and consistent status badge semantics.
- Recommended improvements: Add action queue, align all status labels to lifecycle model, add "missing document" and "validity" warnings, add saved filtered links.
- Priority: High.
- Suggested implementation notes: Extend `getTenderStats` to return lifecycle counts and compliance counts. Make each card link to a filter URL.

### `/tenders`

- Current purpose: Search, filter, sort, and manage all tender records.
- Observations: Server-parsed URL filters exist. Copy adapts to status filters. Table has mobile card alternative and pagination.
- Problems: Filters are basic. Search updates appear client-driven through wrapper; no visible "saved views". Filter labels contain emoji for some statuses, which is inconsistent with the rest of the app. Table links are blue but row is also clickable, causing possible interaction ambiguity.
- Missing states/workflows: No bulk actions, no column controls, no export, no owner/preparer filter, no due-date range, no "briefing mandatory" filter.
- Mobile issues: Mobile cards are good, but search/filter controls need a drawer like PO already uses.
- Accessibility concerns: Icon-only row actions are labelled, which is good. Active filter remove buttons need accessible labels such as "Remove Status filter".
- Recommended improvements: Standardize filters into a reusable filter bar: search, status, client, date range, owner, missing docs, reset. Add saved views: Closing Soon, Under Preparation, Awaiting Results, Awarded to Convert.
- Priority: High.
- Suggested implementation notes: Replace emoji labels with icon+text or text-only options. Keep URL-driven filters for shareability.

### `/tenders/create`

- Current purpose: Create a tender via `TenderForm`.
- Observations: Multi-step form is useful. Draft autosave and restore are excellent. Inline client creation reduces context switching. Document upload in step 3 fits tender intake.
- Problems: Form header is right-aligned and visually fights with the Back button. Step 3 documents are optional but may be operationally required. Validity is marked required in label but enforcement is conditional. Browser/local draft restore is per organization but not visible as a persistent save state.
- Missing states/workflows: No template/checklist by tender type, no owner/preparer assignment, no mandatory briefing warning, no duplicate tender number precheck before submit, no autosave status text.
- Mobile issues: Two-column card layout becomes stacked, which is fine, but stepper labels may be cramped.
- Accessibility concerns: Native checkbox inputs are used instead of the shared checkbox component, risking inconsistent focus styles. Required fields are indicated with `*`, but required state should be programmatically connected.
- Recommended improvements: Make form header left-aligned, add sticky action footer, add "Save draft" state, add optional compliance checklist during intake.
- Priority: High.
- Suggested implementation notes: Reuse the shared `Checkbox` and add `aria-describedby` for helper/error text.

### `/tenders/[id]`

- Current purpose: Tender detail workspace with lifecycle, overview, documents, extensions, follow-ups, status management, and quick actions.
- Observations: This is a strong page. Lifecycle stage stepper helps users understand progress. Compliance checklist is a high-value tender-specific feature. Follow-up timeline is useful and practical.
- Problems: Status can be changed from both lifecycle stepper and sidebar status buttons, which may create competing interaction models. Browser `confirm`/`alert` appears for delete/error. Lifecycle stepper can horizontally overflow and may be hard to use on mobile. Some labels use "Awarded", "Appointed", "Submitted / Evaluation" interchangeably.
- Missing states/workflows: No visible audit trail of status transitions, no owner assignment, no "next required action", no disabled/guarded transitions for invalid workflow jumps, no explicit conversion status after award.
- Mobile issues: Header actions and lifecycle stage row are dense. Tabs plus side cards create long scroll.
- Accessibility concerns: Clickable lifecycle stages need clear accessible names like "Move tender to Preparing". Progress line uses color and position; include text.
- Recommended improvements: Pick one primary workflow control. Move status management into lifecycle/action panel. Add a right-side or top "Next action" card. Replace browser confirm with `AlertDialog`.
- Priority: High.
- Suggested implementation notes: Model lifecycle transitions as data with allowed states, confirmation requirements, and result copy.

### `/tenders/[id]/edit`

- Current purpose: Edit tender using same `TenderForm`.
- Observations: Reuse is sensible and keeps fields consistent.
- Problems: Edit mode still looks like creation rather than "editing existing tender". It lacks a compact summary of current lifecycle/status and update impact.
- Missing states/workflows: No change summary before save, no warning when changing status to awarded/lost from edit form instead of status dialogs.
- Mobile issues: Same form stepper concerns as create.
- Accessibility concerns: Same as create.
- Recommended improvements: Add record context header with tender number/client/status and route status transitions through detail dialogs where possible.
- Priority: Medium.
- Suggested implementation notes: In edit mode, hide or constrain status field if status changes require additional data.

## Tender Table and Filters

- Current table strengths: status badge, deadline calculation, mobile card layout, pagination, client and value columns.
- Gaps: no sortable column headers, no row density control, no visible applied filter summary on mobile, no "last activity" or "owner" column.
- Recommended pattern: desktop data table with sticky header, column sort buttons, numeric right alignment, filter chips, and empty/search empty states. Mobile should use cards plus a filter drawer.
- Priority: High.

## Tender Status Badge Direction

Recommended canonical statuses:

- Opportunity
- Review
- Approved to Prepare
- Preparing
- Ready
- Submitted
- Evaluation
- Awarded
- Lost
- Closed
- Cancelled

Each badge should use:

- Text label
- Semantic tone
- Optional icon where it improves scanning
- A non-color textual distinction for critical states

## Tender Workflow Recommendations

1. Intake: create tender, client, contact, briefing, validity, documents.
2. Qualification: review and approve to prepare.
3. Preparation: track documents and compliance.
4. Submission: mark submitted with date and notes.
5. Evaluation: log follow-ups and validity extensions.
6. Outcome: awarded/lost with structured reason/value.
7. Conversion: awarded tender converts into project with preserved tender context.

