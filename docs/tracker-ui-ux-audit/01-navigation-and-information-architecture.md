# Navigation and Information Architecture

## Current Navigation Structure

The dashboard shell uses `src/app/(dashboard)/layout.tsx` with:

- Persistent sidebar via `AppSidebarClient`
- Header row with sidebar trigger, breadcrumb, and notification bell
- Main content area with bottom padding for mobile
- Mobile bottom navigation

Sidebar groups come from `src/data/dashboad-links.ts`:

- Overview: Dashboard, Calendar, Reports
- Operations: Tender Management, Project Delivery, Clients Directory
- Conditional "Needs Action" workflow shortcuts for overdue items, closing soon, and awarded tenders awaiting conversion

## High-Level Observations

The current navigation is compact and task-oriented, which is right for an internal business dashboard. The biggest IA issue is that "Project Delivery" contains projects and purchase orders, while delivery notes are only reachable inside PO/detail workflows. Tender Management has "Overview" and "Tender Register"; Project Delivery has "Overview", "Active Projects", and "Purchase Orders". This is close, but users who think in daily work queues need clearer pathways to "Needs action", "Awaiting conversion", "Deliveries due", "Partially delivered", and "Risks".

The app also has multiple organization routes:

- `/organization/select`
- `/organization`
- `/organization/create`
- `/organization/[slug]`
- `/organization/[slug]/settings/transfer-ownership`

These are operationally important but not fully represented in the main navigation. Breadcrumbs help, but users may not understand the difference between organization selection, organization management, and settings.

## Recommended Navigation Model

Recommended sidebar:

1. Home
   - Dashboard
   - Calendar
   - Reports
2. Tender Management
   - Tender Dashboard
   - Tender Register
   - Closing Soon
   - Awaiting Results
   - Awarded to Convert
3. Project Management
   - Project Dashboard
   - Projects
   - Purchase Orders
   - Delivery Notes
   - Risks
4. Directory
   - Clients
   - Team and Organization
5. Settings
   - Profile
   - Notifications
   - Billing

Implementation note: several proposed links can initially be filtered versions of existing routes, for example `/tenders?status=awarded`, `/projects/purchase-orders?status=partially_delivered`, and a future `/projects/deliveries` aggregation route.

## Route and Page Audit

### `/dashboard`

- Current purpose: Main role-aware dashboard with quick-create actions, urgency banner, admin/specialist dashboard components.
- Observations: Good starting point. Role-aware content is useful. Quick actions are broad and can wrap on mobile.
- Problems: It mixes Tender and Project concerns without a strong "today's work" hierarchy. Create actions are all outline buttons, so primary next action is unclear.
- Missing states/workflows: Needs richer empty state for new organizations and explicit "nothing urgent" state.
- Mobile issues: Button stack may become tall before content. Urgency and cards need a prioritized order.
- Accessibility concerns: Ensure urgency banner does not rely only on red/amber/green.
- Recommendation: Make it an executive/action dashboard: "Needs action", "Tender pipeline", "Project delivery", "Recent activity".
- Priority: High.
- Implementation notes: Keep role split, but centralize dashboard card and action queue patterns.

### `/calendar`

- Current purpose: Calendar view/widget for deadlines and schedule context.
- Observations: Present in Overview nav and likely valuable for tender deadlines and deliveries.
- Problems: Calendar is separated from list workflows; users need direct links back to tender/PO/project records.
- Missing states/workflows: Empty calendar, filtered calendar, and overdue event state should be explicit.
- Mobile issues: Month grids are often hard on mobile; offer agenda mode first.
- Accessibility concerns: Calendar cells need labels that include event title/date/status.
- Recommendation: Add mode switch: Agenda, Week, Month. Default mobile to Agenda.
- Priority: Medium.
- Implementation notes: Reuse deadline and delivery events; deep-link each event to record details.

### `/reports`

- Current purpose: Reporting page.
- Observations: Useful top-level nav item.
- Problems: Reports need to be grouped around Tender and Project outcomes, not generic analytics.
- Missing states/workflows: Export state, no-data state, role-limited reports.
- Mobile issues: Charts and tables should stack with summaries before charts.
- Accessibility concerns: Charts need textual summaries and data tables.
- Recommendation: Split into Tender Reports and Project Delivery Reports sections.
- Priority: Medium.
- Implementation notes: Pair every chart with key numbers and export/download action.

### `/organization/select`

- Current purpose: Select active organization when multiple exist or session lacks active org.
- Observations: Important transition point.
- Problems: It is not clear from sidebar where users manage versus switch organizations.
- Missing states/workflows: Empty organization state, invitation pending state, failed switch state.
- Mobile issues: Organization cards should be full-width tappable rows.
- Accessibility concerns: Active organization must be announced with text, not just styling.
- Recommendation: Treat as a workspace switcher with "current", "available", and "create/join" sections.
- Priority: Medium.
- Implementation notes: Align with `TeamSwitcher` terminology.

### `/organization`, `/organization/create`, `/organization/[slug]`, `/organization/[slug]/settings/transfer-ownership`

- Current purpose: Organization management, creation, detail/settings, ownership transfer.
- Observations: The app has organization-specific management tabs and transfer ownership UI.
- Problems: This area sits outside the main sidebar mental model.
- Missing states/workflows: Deletion/export/transfer flows need strong confirmation patterns and audit-copy clarity.
- Mobile issues: Management tabs can overflow; use segmented controls or stacked nav on small screens.
- Accessibility concerns: Dangerous actions need clear labels, confirmation, and focus handling.
- Recommendation: Put organization management under Directory or Settings, with a clear distinction between "switch organization" and "manage organization".
- Priority: Medium.
- Implementation notes: Use consistent destructive-action dialog component instead of browser confirm.

### `/modules`

- Current purpose: Module discovery/management.
- Observations: This can explain enabled Tracker capabilities.
- Problems: It is disconnected from sidebar operations.
- Missing states/workflows: Enabled/disabled, permission required, upgrade required.
- Mobile issues: Module cards should not become marketing blocks inside the app.
- Accessibility concerns: Module state should be label text, not color only.
- Recommendation: Move under Settings or Admin if it controls capabilities.
- Priority: Low.
- Implementation notes: Use compact settings rows rather than large feature cards.

## Navigation Components

### Sidebar

- Current purpose: Main app navigation.
- Observations: Collapsible, role-aware PO hiding, and active matching utilities exist.
- Problems: Parent items with `url: '#'` are not links, so the group label itself cannot be selected. "Project Delivery" versus "Project Management" terminology is inconsistent with the user-facing domain.
- Recommendation: Give each parent a dashboard route. Use "Project Management" consistently.
- Priority: High.

### Workflow Shortcuts

- Current purpose: Show urgent counts only when action is needed.
- Observations: Strong idea.
- Problems: URLs point to filtered Tender Register only; no Project/PO shortcuts yet.
- Recommendation: Extend to PO/delivery/project risks and make it a permanent "Action Queue" concept.
- Priority: High.

### Breadcrumb

- Current purpose: Orientation in dashboard shell.
- Observations: Helpful because routes are nested.
- Problems: Dynamic record names may be ids rather than human-readable names unless mapped.
- Recommendation: For detail routes, show tender number, project number, PO number.
- Priority: Medium.

