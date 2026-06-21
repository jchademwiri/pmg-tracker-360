# Project Management Audit

## Current Area Summary

Routes:

- `/projects/overview`
- `/projects`
- `/projects/create`
- `/projects/contracts`
- `/projects/[id]`
- `/projects/[id]/edit`
- `/projects/[id]/items`
- `/projects/[id]/items/new`
- `/projects/[id]/items/[itemId]/edit`

Core components:

- `ProjectList`
- `ProjectForm`
- `ProjectWorkspace`
- `ProjectLineItemsList`
- `ProjectLineItemForm`
- `ProjectCreateDialog`
- `RecentActivitySection`

Project Management has a basic overview/list layer and a very rich detail workspace. The detail workspace tracks project info, purchase orders, line items, deliveries, documents, activity, risks, and close-out. The main issue is visual and workflow consistency: the workspace uses a dark, dramatic visual style that differs from the calmer app shell and Tender area.

## Dashboard Recommendation

The Project Management dashboard should focus on delivery control:

- Work queue: overdue deliveries, POs awaiting delivery, partial deliveries, high/critical risks, projects ready for close-out.
- Project health: active projects, completion percent, total PO value, delivered value, outstanding value.
- Delivery timeline: upcoming expected delivery dates, recently received delivery notes.
- Risk summary: open high/critical risks, mitigated risks, unresolved old risks.
- Financial view: PO value by project, VAT-exclusive/inclusive totals, delivered value versus ordered value.
- Fast actions: create project, create PO, record delivery note, add line item, log risk.

This dashboard should answer: "What projects need attention today, what money is committed, and what delivery is outstanding?"

## Page Audit

### `/projects/overview`

- Current purpose: Project overview with active projects, active POs, total PO amount, growth, and recent activity.
- Observations: Simple and readable. Uses summary cards and recent activity.
- Problems: It does not surface delivery risk, overdue deliveries, partial deliveries, close-out candidates, or project health.
- Missing states/workflows: No empty organization/new project state beyond no organization. No "needs action" queue.
- Mobile issues: Cards will stack fine, but recent activity may dominate without prioritization.
- Accessibility concerns: Growth uses red/green color; include directional text.
- Recommended improvements: Replace generic growth metric with operational delivery metrics. Add Project Health and Delivery Exceptions.
- Priority: High.
- Suggested implementation notes: Reuse calculations from `ProjectWorkspace` and PO data.

### `/projects`

- Current purpose: List and manage projects.
- Observations: Search, status filter, pagination, desktop table, and mobile cards exist. Delivery progress column is useful.
- Problems: The progress bar uses dark zinc styling inside the standard app table. Search runs on every keystroke without visible debounce/loading skeleton. There are no filters for client, tender source, risk, delivery progress, or close-out state.
- Missing states/workflows: No bulk archive/export, no saved views, no "projects with overdue POs" filter.
- Mobile issues: Mobile cards are solid but need clearer primary action and status/progress hierarchy.
- Accessibility concerns: Progress bars need text alternatives and should not rely on visual width only.
- Recommended improvements: Add filter drawer, consistent progress component, client/status/risk filters, and row links with clear first column.
- Priority: High.
- Suggested implementation notes: Use the same table/filter architecture recommended for Tender Register.

### `/projects/create`

- Current purpose: Create project, optionally from client/tender.
- Observations: Inline client creation and tender prefill are helpful. Related information card provides context.
- Problems: Project number and description are overwritten when a tender is selected, which may surprise users. Related tender selection is optional but conversion from awarded tender should be a guided path.
- Missing states/workflows: No contract dates, award value, signed contract, project owner, or close-out expectations at creation.
- Mobile issues: Two cards stack acceptably.
- Accessibility concerns: Some disabled select items like `loading`/`no-clients` are values inside the select; ensure they cannot be submitted.
- Recommended improvements: Add "Create from awarded tender" guided mode, with review of inherited fields before applying.
- Priority: Medium.
- Suggested implementation notes: Display a confirmation/preview when selecting a tender will overwrite fields.

### `/projects/[id]`

- Current purpose: Full project workspace with overview, orders, items, deliveries, documents, activity, risks, and close-out.
- Observations: Strong domain coverage. Tabs reflect the project delivery lifecycle. Risk logging and close-out are valuable. Aggregated delivery notes are useful.
- Problems: Visual language is inconsistent with the rest of Tracker: dark panels, gradient text, decorative blurred backgrounds, rounder styling, and dramatic shadows. The sticky tab bar can fight the dashboard shell header. Several nested tabs/sections are dense.
- Missing states/workflows: No "next best action" based on PO/delivery/risk status. No clear health score. Close-out is available from header but should be gated by outstanding delivery/risk checks.
- Mobile issues: Header actions can become a long stack. Horizontal workspace nav helps, but dense sections may become difficult to scan.
- Accessibility concerns: Gradient text and low-contrast zinc tones may fail contrast. Icon tabs need accessible names and selected state. Risk severity badges rely heavily on color.
- Recommended improvements: Align the workspace to the standard card/table style, use a compact page header, add health summary, and gate close-out with unresolved items.
- Priority: High.
- Suggested implementation notes: Replace decorative hero with standard page header and summary KPI band. Use shared `StatusBadge`, `MetricCard`, and table patterns.

### `/projects/[id]/edit`

- Current purpose: Edit project using `ProjectForm`.
- Observations: Reuse is sensible.
- Problems: Same create/edit issues as `/projects/create`. Does not show impact of changing tender/client/status.
- Missing states/workflows: No change confirmation for status or tender linkage.
- Mobile issues: Same as project form.
- Accessibility concerns: Same as project form.
- Recommended improvements: Add contextual edit header and change-impact copy.
- Priority: Medium.
- Suggested implementation notes: Keep status updates consistent with workspace actions.

### `/projects/contracts`

- Current purpose: Contract-related project area.
- Observations: Route exists but is not in sidebar.
- Problems: Users may not discover it. Its relationship to projects, tenders, and signed contracts is unclear.
- Missing states/workflows: Contract upload, expiry, renewal, signed status, award linkage.
- Mobile issues: Should follow document/list card patterns.
- Accessibility concerns: Contract status needs text labels.
- Recommended improvements: Either add to Project Management nav or fold into Project Workspace Documents/Info until contract workflow is fully defined.
- Priority: Medium.
- Suggested implementation notes: If retained, make it a filtered document/contract register.

### `/projects/[id]/items`

- Current purpose: View project line items.
- Observations: Line items are foundational for PO creation and delivery tracking.
- Problems: Line items are not prominent enough in the project list or dashboard.
- Missing states/workflows: Import from awarded tender/contract, bulk item creation, item-level delivery status, SAP reference validation.
- Mobile issues: Line-item tables are likely dense.
- Accessibility concerns: Numeric columns need labels and alignment.
- Recommended improvements: Treat line items as a project bill of materials with status: planned, ordered, partially delivered, delivered.
- Priority: High.
- Suggested implementation notes: Add item status derived from PO/delivery quantities.

### `/projects/[id]/items/new`

- Current purpose: Create project line item.
- Observations: Necessary setup flow.
- Problems: Users may only discover item creation when blocked in PO creation.
- Missing states/workflows: Duplicate item number precheck, unit suggestions, bulk add.
- Mobile issues: Form should remain single-column on mobile.
- Accessibility concerns: Unit/price fields require clear validation.
- Recommended improvements: Add "Add multiple items" support or keep users in context after save.
- Priority: Medium.
- Suggested implementation notes: After save, offer "Add another" and "Create PO from items".

### `/projects/[id]/items/[itemId]/edit`

- Current purpose: Edit project line item.
- Observations: Necessary maintenance flow.
- Problems: Editing line items after POs/deliveries may affect financial and delivery history.
- Missing states/workflows: Impact warning when item is already used in POs.
- Mobile issues: Same as item form.
- Accessibility concerns: Same as item form.
- Recommended improvements: Warn/lock fields that affect historical PO totals.
- Priority: Medium.
- Suggested implementation notes: Derive usage count and display before editable fields.

