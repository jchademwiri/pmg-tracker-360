# Recommended Implementation Roadmap

## Phase 1: Stabilize Core UX Patterns

Priority: High

Goals:

- Make the app feel consistent and reduce daily workflow friction.

Work:

- Centralize status badge maps for Tender, Project, PO, Delivery, Risk.
- Replace browser `confirm` and `alert` with shared dialogs/toasts.
- Create shared table/list shell with search, filters, active chips, empty states, pagination, and mobile cards.
- Add mobile filter drawer to Tender and Project lists.
- Standardize no-organization, not-found, permission-denied, loading, and error states.
- Align Project Workspace visual style with the rest of Tracker.

Suggested first files:

- `src/components/ui/status-badge.tsx`
- `src/components/ui/mobile-card.tsx`
- `src/components/ui/mobile-filter-drawer.tsx`
- `src/components/shared/empty-states/*`
- `src/components/projects/project-workspace.tsx`
- `src/components/tenders/tenders-search-filters.tsx`
- `src/components/projects/project-list.tsx`
- `src/components/purchase-orders/po-list.tsx`

## Phase 2: Tender Management Dashboard and Workflow

Priority: High

Goals:

- Turn Tender Management into an action dashboard, not only a metric summary.

Work:

- Add action queue: closing soon, overdue, briefing required, awaiting follow-up, awarded to convert.
- Align tender statuses across overview, register, detail, and filters.
- Add saved views/quick filters.
- Improve tender detail lifecycle transitions with guarded state changes.
- Add status history/audit timeline.
- Add mobile lifecycle pattern.

Success criteria:

- A user can answer "what tenders need action today?" within 10 seconds.
- Awarded tender conversion is visible until complete.
- Status labels match everywhere.

## Phase 3: Project Management Dashboard and Workspace

Priority: High

Goals:

- Make Project Management a delivery-control workspace.

Work:

- Replace generic Project Overview metrics with health, delivery, risk, and financial metrics.
- Add Project action queue: overdue deliveries, partial deliveries, high risks, close-out candidates.
- Normalize Project Workspace style and header actions.
- Add close-out readiness checks.
- Add item-level status derived from ordered/delivered quantities.

Success criteria:

- A user can identify risky projects and overdue deliveries quickly.
- Project Workspace feels like the same app as Tender Management.

## Phase 4: Purchase Order and Delivery Note Improvements

Priority: High

Goals:

- Improve dense PO and delivery workflows, especially on mobile.

Work:

- Add PO lifecycle strip.
- Add supplier/project/date filters to PO list.
- Sync PO list filters to URL.
- Add mobile item-card editor for PO line items.
- Add mobile item-card editor for delivery quantities.
- Add delivery note correction/void workflow.
- Add PO document upload/attachment area.

Success criteria:

- Users can record partial deliveries from a phone without horizontal table scanning.
- Delivered, outstanding, and financial totals are always clear.

## Phase 5: Directory, Organization, Settings, and Support Polish

Priority: Medium

Goals:

- Improve supporting workflows that feed operations.

Work:

- Make Client detail a relationship hub with tenders, projects, POs, contacts.
- Add duplicate client/tender/project/PO warnings where not already handled.
- Clarify organization switch/manage/create routes.
- Add Settings to discoverable navigation.
- Standardize auth/invitation/onboarding state screens.
- Improve public contact/waitlist success and error states.

Success criteria:

- Users understand organization context and can recover from invitation/onboarding errors.
- Clients become useful operational records, not just contact rows.

## Recommended Design Direction

Tracker should feel:

- Clean
- Professional
- Quietly dense
- Fast to scan
- Mobile-friendly for field updates
- Practical rather than decorative

Use:

- Neutral page backgrounds
- Compact KPI cards
- Clear status labels
- Calm semantic colors
- Strong table hierarchy
- Consistent icon usage
- Sticky mobile action bars only on detail/action pages
- Drawer filters on mobile
- Dialogs for destructive or workflow-changing actions

Avoid:

- One-off dark/glass panels inside standard admin pages
- Large decorative gradients
- Emoji in select labels
- Browser alerts/confirms
- Horizontal editable tables on mobile
- Status colors without text labels

## Recommended Page Layout Patterns

### List Page

1. Page header: title, short purpose, primary action.
2. Optional KPI/action queue band.
3. Filter/search bar with active chips.
4. Desktop table or mobile cards.
5. Pagination and result count.
6. Contextual empty/search/permission states.

### Detail Workspace

1. Compact record header: identifier, status, primary action, overflow actions.
2. Next action/health summary.
3. Tabs or section navigation.
4. Main record content.
5. Related activity/documents/notes.
6. Sticky mobile action bar for primary actions.

### Multi-Step Form

1. Context header and Back.
2. Step status.
3. One task per step.
4. Inline validation and top error summary.
5. Save/draft indicator.
6. Sticky footer actions.

## Final Cross-Check

The route tree listed in `00-overview.md` was compared against the generated report set. All inspected `page.tsx` routes, dashboard sub-pages, public pages, auth pages, organization pages, settings pages, Tender pages, Project pages, Purchase Order pages, Delivery Note page, loading states found in the route tree, and the top-level not-found page are assigned to at least one report.

