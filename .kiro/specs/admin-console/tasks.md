# Implementation Plan: TenderTrack 360 Platform Admin Console

## Overview

This plan implements the TenderTrack 360 Platform Admin Console — an internal operations panel for Basadipele system administrators. The implementation covers: a route-level authentication proxy (`src/proxy.ts`), centralised admin query helpers (`src/lib/admin-queries.ts`), five shared UI components (AlertTray, MetricCard, DataTable, OrgDrawer, StatusBadge), a NavMenu client component, replacements/enhancements for three existing pages (Dashboard, Organizations, Users), three new pages (Support Tickets, Feedback, Sessions), a sidebar navigation update, two Server Action modules with audit logging, and property-based tests (fast-check) covering all 15 correctness properties from the design.

Tasks are ordered in strict dependency waves: infrastructure first, then shared components, then pages and their actions, then tests, and finally a full verification pass.

## Task Dependency Graph

```json
{
  "waves": [
    {
      "wave": 1,
      "tasks": [1, 2, 3, 4],
      "description": "Infrastructure: test runner, sentinel org seed + constants, proxy, query helpers"
    },
    {
      "wave": 2,
      "tasks": [5, 6, 7, 8, 9],
      "description": "Shared components: StatusBadge, MetricCard, AlertTray, DataTable, NavMenu"
    },
    {
      "wave": 3,
      "tasks": [10, 11],
      "description": "OrgDrawer and its Server Action dependency"
    },
    {
      "wave": 4,
      "tasks": [12, 13, 14, 16, 19],
      "description": "Page replacements/enhancements and their Server Actions"
    },
    {
      "wave": 5,
      "tasks": [15, 17, 18, 20],
      "description": "New pages (Support Tickets, Feedback, Sessions) and sidebar update"
    },
    {
      "wave": 6,
      "tasks": [21, 22, 23, 24, 25, 26, 27, 28, 29],
      "description": "Property-based tests and unit tests"
    },
    {
      "wave": 7,
      "tasks": [30],
      "description": "Final verification: run all tests and type-check"
    }
  ]
}
```

## Notes

- No new npm packages beyond `fast-check` and `vitest` (plus vitest plugins) should be added. All other dependencies are already installed.
- All pure helper functions (isPublicPath, validateStatusTransition, filterAndSortAlerts, getStatusClasses, getPaginationSlice, getTotalPages, applyUserFilters, isPurgeImminent) must be exported from their respective source files to enable property-based testing without mocking.
- The `securityAuditLog.organizationId` column is NOT NULL with a FK constraint. Server Actions wrap the audit log insert in try/catch and log server-side on failure — the primary operation is never rolled back (Requirement 12.3).
- The existing `adminSignOut` action in `src/app/actions.ts` must be preserved. The InviteAdminModal in users must be preserved.
- All pages are server components that delegate client interactivity to `'use client'` wrapper components (OrgListClient, UserListClient, FeedbackListClient, SessionsListClient, TicketStatusSelect).

---

## Tasks

- [x] 1. Install fast-check and configure Vitest test runner
  - Add `fast-check` and `vitest` (plus `@vitejs/plugin-react`, `jsdom`) as dev dependencies in `apps/admin/package.json`
  - Create `apps/admin/vitest.config.ts` configuring jsdom environment, resolve aliases for `@/` → `src/`, and include `**/*.test.ts` / `**/*.test.tsx` patterns
  - Create `apps/admin/src/test-setup.ts` with any required test global setup (e.g., `@testing-library/jest-dom` matchers if used)
  - Add `"test": "vitest run"` and `"test:watch": "vitest"` scripts to `apps/admin/package.json`
  - Verify the test runner starts successfully with a trivial placeholder test
  - **Requirement references:** Design — Testing Strategy

- [x] 2. Seed platform sentinel organisation and create constants
  - Create `packages/db/scripts/seed-platform-org.ts` that inserts a row into the `organization` table with `id='org_platform_admin'`, `name='[Platform]'`, `slug='platform-admin'`, `createdAt=new Date()`, and `deletedAt=new Date('2000-01-01')` (permanently soft-deleted so it never appears in active org filters)
  - The script must be idempotent: use `INSERT ... ON CONFLICT (id) DO NOTHING` (via Drizzle's `onConflictDoNothing()`)
  - Create `apps/admin/src/lib/constants.ts` exporting `export const PLATFORM_ORG_ID = 'org_platform_admin' as const`
  - Run the seed script once: `pnpm --filter db tsx scripts/seed-platform-org.ts`
  - **Requirement references:** Requirements 12.1, 12.2, 12.5

- [x] 3. Create `src/proxy.ts` — Route-level authentication proxy
  - Create `apps/admin/src/proxy.ts` exporting a n amed `proxy` function following Next.js 16 proxy conventions
  - Implement exact-match public path set: `/login`, `/setup`, `/favicon.ico`
  - Implement prefix-match public path array: `/api/auth`, `/_next/static`, `/_next/image`
  - Check for both cookie names: `tender-track-360.session_token` and `better-auth.session_token`
  - Issue HTTP 307 redirect to `/login?redirect=<pathname>` when no valid cookie is present on protected routes
  - Export `config` with the `matcher` pattern `['/((?!_next/static|_next/image|favicon.ico).*)']`
  - Extract `isPublicPath(pathname: string): boolean` as a pure exported helper function (required for Property 1 PBT test)
  - **Requirement references:** Requirements 1.1–1.8

- [x] 4. Create `src/lib/admin-queries.ts` — Centralised query helpers
  - Create `apps/admin/src/lib/admin-queries.ts` marked as server-only (add `import 'server-only'` guard)
  - Define all return types: `DashboardMetrics`, `AlertCounts`, `ActivityEntry`, `OrgWithCounts`, `UserWithMemberships`, `SuspiciousSession`, `TicketWithUser`, `FeedbackWithUser`
  - Implement `getDashboardMetrics()`: execute all 8 KPI count queries in a single `Promise.all()` — totalUsers, newUsersThisWeek, activeOrgs, newOrgsThisWeek, totalTenders, activeProjects (status='active'), liveSessions (expiresAt > NOW()), verifiedCount/unverifiedCount, openTickets, inProgressTickets, waitlistTotal, newWaitlistThisWeek, tenderByStatus (grouped), planDistribution (grouped)
  - Implement `getAlertCounts()`: return 6 count-only queries for suspiciousSessions, unverifiedRecentUsers (7-day window), expiringInvitations (48h), expiringTransfers (24h), pendingPurgeOrgs (72h), openTickets
  - Implement `getRecentActivity(limit: number)`: left join `securityAuditLog` with `user` on `userId`, order by `createdAt DESC`, limit to `limit`
  - Implement `getOrganizationsWithCounts()`: select all organization rows with correlated subquery aggregates for memberCount, tenderCount, projectCount, poCount
  - Implement `getUsersWithMemberships()`: fetch all users, all member rows joined to organizations, all accounts (most recent per user); assemble `memberships[]` array and `isGhost` flag (true when no member rows exist for that user); resolve `lastActiveOrgName` from `lastActiveOrganizationId`
  - Implement `getSuspiciousSessions()`: query `sessionTracking` joined to `session` joined to `user`; filter `isSuspicious = true AND logoutTime IS NULL`
  - Implement `getAllActiveSessions()`: same join as `getSuspiciousSessions()` but without the `isSuspicious = true` filter; returns all rows where `logoutTime IS NULL`, ordered by `loginTime DESC`
  - Implement `getOpenTickets()`: query `supportTickets` left joined with `user` on `userId`; order by `createdAt DESC`
  - Implement `getFeedback(typeFilter?: string)`: query `feedback` left joined with `user` on `userId`; apply `eq(feedback.type, typeFilter)` when provided; order by `createdAt DESC`
  - Propagate all query errors without swallowing them
  - **Requirement references:** Requirements 3.1–3.10

- [x] 5. Create `src/components/StatusBadge.tsx` — Status pill component
  - Create `apps/admin/src/components/StatusBadge.tsx` as a Server Component (no `'use client'`)
  - Accept `props: { status: string }`
  - Implement the full colour mapping for known statuses: `open` → red, `in_progress` → amber, `closed` → emerald, `active` → emerald, `deleted` → red, `suspicious` → red, `bug` → red, `feature` → blue, `other` → neutral zinc
  - Unknown status values must fall through to the neutral zinc styling — never throw
  - Export `getStatusClasses(status: string): { bg: string; text: string; border: string }` as a pure helper for testing (required for Property 7 PBT test)
  - **Requirement references:** Requirements 4.5, 8.2, 9.2

- [x] 5. Create `src/components/MetricCard.tsx` — KPI card component
  - Create `apps/admin/src/components/MetricCard.tsx` as a Server Component
  - Accept `props: { label: string; count: number; icon: React.ReactNode; variant: 'primary' | 'success' | 'warning' | 'danger'; secondaryNote?: string }`
  - Implement variant → colour token mapping per design: primary → indigo, success → emerald, warning → amber, danger → red
  - Render label, icon in a coloured rounded box, count in large text, optional secondaryNote in smaller text
  - **Requirement references:** Requirements 4.2, 5.9

- [x] 6. Create `src/components/AlertTray.tsx` — Alert banner component
  - Create `apps/admin/src/components/AlertTray.tsx` as a Server Component
  - Accept `props: { alerts: Alert[] }` where `Alert = { id: string; label: string; count: number; severity: 'critical' | 'high' | 'medium' | 'low'; href: string }`
  - Filter to only alerts where `count > 0`; when all counts are zero, render nothing (no wrapper element)
  - Sort by severity order: critical → high → medium → low
  - Render each alert as a full-width banner with severity-based colour (critical → red-950, high → orange-950, medium → yellow-950, low → blue-950), count, label, and a link to `href`
  - Export `filterAndSortAlerts(alerts: Alert[]): Alert[]` as a pure helper for testing (required for Property 6 PBT test)
  - **Requirement references:** Requirements 4.1, 5.2–5.8

- [x] 7. Create `src/components/DataTable.tsx` — Paginated table component
  - Create `apps/admin/src/components/DataTable.tsx` as a Client Component (`'use client'`)
  - Accept generic props: `columns: Column<T>[]`, `data: T[]`, `rowKey: (row: T) => string`, `onRowClick?: (row: T) => void`
  - Define `Column<T> = { key: string; header: string; render: (row: T) => React.ReactNode; className?: string }`
  - Read `page` from `useSearchParams()`; default to `1` for absent, non-integer, or ≤ 0 values
  - Define `PAGE_SIZE = 50` constant
  - Slice data client-side: `data.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)`
  - Previous/Next buttons use `router.push()` updating only the `page` param while preserving all other existing query params via `URLSearchParams` spread
  - Previous disabled when `page === 1`; Next disabled when `page * PAGE_SIZE >= data.length`
  - Show "Page X of Y" footer where Y = `Math.ceil(data.length / PAGE_SIZE)`; total page count ≥ 1 (empty dataset shows "Page 1 of 1")
  - Export `getPaginationSlice(data: T[], page: number, pageSize: number)` and `getTotalPages(dataLength: number, pageSize: number)` as pure helpers for testing (required for Properties 8 & 9 PBT tests)
  - Use `<table>` with `<thead>`, `<th scope="col">` for accessibility
  - **Requirement references:** Requirements 4.3, 4.6, 13.1–13.6

- [x] 8. Create `src/components/NavMenu.tsx` — Sidebar navigation client component
  - Create `apps/admin/src/components/NavMenu.tsx` as a Client Component (`'use client'`)
  - Define `NAV_GROUPS` array with four groups: "Overview" (Dashboard `/`), "Tenants" (Organizations `/organizations`, Users `/users`), "Support & Growth" (Support Tickets `/support-tickets`, Feedback `/feedback`), "Security" (Sessions `/sessions`)
  - Use `usePathname()` to detect the active route; apply `bg-[oklch(0.25_0.02_255)] text-white` classes for the active link
  - Render group labels in uppercase tracking-wider style above each group's link list
  - Use Lucide icons: `LayoutDashboard`, `Building2`, `Users`, `LifeBuoy`, `MessageSquare`, `ShieldAlert`
  - **Requirement references:** Requirements 11.1–11.5

- [x] 9. Create `src/components/OrgDrawer.tsx` — Org detail side drawer
  - Create `apps/admin/src/components/OrgDrawer.tsx` as a Client Component (`'use client'`)
  - Accept `props: { orgId: string | null; onClose: () => void }`
  - When `orgId` is non-null, call the `getOrgDetail(orgId)` Server Action (from `src/app/organizations/actions.ts`) to fetch org record, members array, and pending invitations
  - Render a slide-in drawer overlay anchored to the right side of the viewport
  - Display: org name, slug, logo (if present), metadata (pretty-printed JSON), createdAt, deletedAt (if set), deletionReason (if set), purge date (if set)
  - Member list: avatar initials, name, email, role badge
  - Pending invitations: email, role, expiresAt
  - Close via Escape key listener (`useEffect`) and overlay click
  - Implement three explicit states via a `DrawerState` discriminated union: `idle`, `loading`, `error`, `loaded`
  - **Loading:** render drawer shell immediately with a skeleton (3 animate-pulse text bars + 5 animate-pulse row placeholders using `bg-zinc-800 rounded`)
  - **Error:** render inline error with `AlertCircle` icon, "Failed to load organisation details." message, and a Retry button that re-invokes `getOrgDetail`
  - **Loaded:** render full org metadata, member list, and invitations
  - Use `useEffect([orgId])` resetting to `loading` at the start of each fetch to prevent stale-data flash
  - **Requirement references:** Requirements 4.4, 6.10

- [x] 10. Create `src/app/organizations/actions.ts` — Org detail Server Action
  - Create `apps/admin/src/app/organizations/actions.ts` with `'use server'` directive
  - Export `getOrgDetail(orgId: string)` that re-verifies the admin session before querying
  - Fetch the org record, all members with user name/email/role via join, and all pending invitations for that org
  - Throw `Error('Unauthorized')` if session is absent or role ≠ `"admin"`
  - **Requirement references:** Requirements 2.3, 2.4, 4.4, 6.10

- [x] 11. Replace `src/app/page.tsx` — Full Dashboard replacement
  - Replace the entire existing `apps/admin/src/app/page.tsx` with the new Dashboard implementation
  - Auth guard: call `auth.api.getSession()`, check for admin count before redirecting to `/setup` vs `/login` (preserve the existing redirect-to-setup logic)
  - Execute `Promise.all([getDashboardMetrics(), getAlertCounts(), getRecentActivity(20)])` for parallel data fetching
  - Render order: page header with "End Session" button (preserve `adminSignOut` action), `<AlertTray>` with all 6 alert definitions, 4×2 KPI grid of `<MetricCard>` components (8 cards per design spec), tender pipeline health section (5 status bars), plan distribution section (free/pro bars), three quick-status panels (suspicious sessions list, ticket breakdown, ownership transfer breakdown), recent activity feed (last 20 entries with severity icon + user name + action + relative time)
  - Pipeline bars: `(count / totalTenders * 100).toFixed(1) + '%'` inline style; zero total → all bars at 0%
  - Plan bars: same calculation against `totalUsers`
  - Quick-status suspicious sessions: show up to 5 user emails from the suspicious sessions list + link to `/sessions`
  - Use `formatRelativeTime(date: Date): string` helper (extract as pure function) for all relative timestamps
  - **Requirement references:** Requirements 5.1–5.13

- [x] 12. Replace `src/app/organizations/page.tsx` — Enhanced Organizations page
  - Replace the entire existing `apps/admin/src/app/organizations/page.tsx`
  - Auth guard + `getOrganizationsWithCounts()` call server-side
  - Create `OrgListClient` as a `'use client'` component (in `src/app/organizations/OrgListClient.tsx`) holding filter/search/selectedOrgId state
  - Filter state: `'active' | 'deleted' | 'all'` — default `'active'` (active-only on initial load)
  - Search state: case-insensitive client-side name filter
  - Pass full org list to `OrgListClient`; filtering happens entirely client-side
  - Table columns: Name+ID(8 chars) | Slug | Members | Tenders | Projects | POs | Status badge | Purge date | Created
  - Status badge: green "Active" when `deletedAt IS NULL`, red "Deleted" when `deletedAt IS NOT NULL`
  - Purge date cell: red text when `permanentDeletionScheduledAt` is within 7 days of now; zinc otherwise
  - Row click: set `selectedOrgId` → render `<OrgDrawer orgId={selectedOrgId} onClose={() => setSelectedOrgId(null)} />`
  - Wrap table in `<DataTable>` component
  - Filter toggle buttons: "Active Only", "Deleted", "All"
  - No write actions exposed
  - **Requirement references:** Requirements 6.1–6.12

- [x] 13. Replace `src/app/users/page.tsx` — Enhanced Users page
  - Replace the entire existing `apps/admin/src/app/users/page.tsx`
  - Auth guard + `getUsersWithMemberships()` call server-side
  - Create `UserListClient` as a `'use client'` component (in `src/app/users/UserListClient.tsx`) holding all filter state
  - Filter state: `planFilter: 'all'|'free'|'pro'`, `roleFilter: 'all'|'user'|'admin'`, `verifiedFilter: 'all'|'verified'|'unverified'`, `search: string`
  - Combined AND filter: plan AND role AND verification AND text search (name or email)
  - New table columns added to existing: Last Active Org (from `lastActiveOrgName ?? '—'`) | Provider (`'credential'` → `'Password'`, else raw `providerId ?? '—'`) | Ghost indicator (shown when `isGhost === true`)
  - Preserve existing InviteAdminModal in the page header
  - Wrap table in `<DataTable>` component
  - **Requirement references:** Requirements 7.1–7.11

- [x] 14. Create `src/app/support-tickets/` — New Support Tickets page
  - Create `apps/admin/src/app/support-tickets/page.tsx` (Server Component)
  - Auth guard + `getOpenTickets()` call
  - Create `TicketStatusSelect` as a `'use client'` component (inline or in `src/app/support-tickets/TicketStatusSelect.tsx`)
  - `TicketStatusSelect` shows only the next valid transition: `open` → shows "in_progress" option; `in_progress` → shows "closed" option; `closed` → renders text only (no dropdown)
  - On selection: calls `updateTicketStatus(ticketId, newStatus)` via `useTransition`
  - Table columns: `#${id.slice(0,8)}` | Name + Email | Message preview (80 chars, truncate with ellipsis) | Status (`<StatusBadge>`) | Linked user (`userName ?? 'Anonymous'`) | Submitted (relative time)
  - Wrap table in `<DataTable>` with default sort by `createdAt DESC`
  - **Requirement references:** Requirements 8.1–8.8

- [x] 15. Create `src/app/support-tickets/actions.ts` — Ticket status Server Action
  - Create `apps/admin/src/app/support-tickets/actions.ts` with `'use server'` directive
  - Export `updateTicketStatus(ticketId: string, newStatus: string)`
  - Re-verify admin session first; throw `Error('Unauthorized')` on failure
  - Fetch current ticket status; throw `Error('Ticket not found')` if not found
  - Validate forward-only transition via `TRANSITIONS: Record<string,string> = { open: 'in_progress', in_progress: 'closed' }`; throw `Error('Invalid status transition')` if `TRANSITIONS[currentStatus] !== newStatus`
  - Execute `db.update(supportTickets).set({ status: newStatus }).where(...)` 
  - Import `PLATFORM_ORG_ID` from `src/lib/constants.ts`; insert `securityAuditLog` row with `organizationId=PLATFORM_ORG_ID`, `action='admin.ticket.status_update'`, `resourceType='support_ticket'`, `resourceId=ticketId`, `userId=session.user.id`, `severity='info'`, server-generated `createdAt=new Date()`; wrap in try/catch and `console.error` on failure — do not rethrow
  - Call `revalidatePath('/support-tickets')`
  - Extract `validateStatusTransition(current: string, requested: string): boolean` as a pure exported helper for PBT testing (required for Property 5)
  - **Requirement references:** Requirements 2.3, 2.4, 8.3–8.6, 12.1, 12.3, 12.4

- [x] 16. Create `src/app/feedback/` — New Feedback page
  - Create `apps/admin/src/app/feedback/page.tsx` (Server Component)
  - Auth guard + `getFeedback()` call (no initial filter — all types fetched server-side)
  - Create `FeedbackListClient` as a `'use client'` component (in `src/app/feedback/FeedbackListClient.tsx`)
  - `typeFilter` state: `'all'|'bug'|'feature'|'other'` — default `'all'`; persist in URL as `type` param via `useRouter` + `useSearchParams`
  - Client-side type filter applied to the full dataset
  - Table columns: Type (`<StatusBadge type={entry.type}>`) | Name+Email | Message preview (80 chars) | URL (`feedback.url ?? '—'`) | Linked user (`userName ?? 'Anonymous'`) | Submitted (relative time)
  - Read-only — no write actions
  - Wrap table in `<DataTable>` 
  - Filter toggle buttons: "All", "Bug", "Feature", "Other"
  - **Requirement references:** Requirements 9.1–9.7

- [x] 17. Create `src/app/sessions/` — New Sessions page
  - Create `apps/admin/src/app/sessions/page.tsx` (Server Component)
  - Auth guard + read `searchParams.view`; call `getAllActiveSessions()` when `view === 'all'`, `getSuspiciousSessions()` otherwise; pass single `sessions` array and `viewMode: 'suspicious' | 'all'` prop to client
  - Create `SessionsListClient` as a `'use client'` component (in `src/app/sessions/SessionsListClient.tsx`)
  - Props: `sessions: SuspiciousSession[]`, `viewMode: 'suspicious' | 'all'`, plus local `revokeModalTarget: SuspiciousSession | null` state
  - Toggle button uses `router.push()` to set/clear `?view=all`, also clears the `page` param on toggle to reset pagination
  - Table columns: SessionID(8 chars) | User Email | IP (red class if `isSuspicious`) | Browser+OS (parsed from `deviceInfo` JSON via `safeParse` helper) | Location (city+country from `locationInfo` JSON via `safeParse`) | Login Time | Last Activity (relative) | Status Badge | Revoke button
  - Define `safeParse<T>(json: string | null, fallback: T): T` helper with try/catch
  - Revoke flow: click → `setRevokeModalTarget(session)` → confirmation modal with session details → "Confirm Revoke" calls `revokeAdminSession(sessionId)` via `useTransition` → on success modal closes + `router.refresh()`
  - Wrap table in `<DataTable>`
  - **Requirement references:** Requirements 10.1–10.9

- [x] 18. Create `src/app/sessions/actions.ts` — Session revoke Server Action
  - Create `apps/admin/src/app/sessions/actions.ts` with `'use server'` directive
  - Export `revokeAdminSession(sessionTrackingId: string)`
  - Re-verify admin session first; throw `Error('Unauthorized')` on failure
  - Look up `sessionTracking.sessionId` from the tracking row; throw `Error('Session not found')` if absent
  - Look up the Better Auth session token via the `session` table; throw `Error('Session token not found')` if absent
  - Call `auth.api.revokeSession({ body: { token: sessionRow.token } })`
  - Import `PLATFORM_ORG_ID` from `src/lib/constants.ts`; insert `securityAuditLog` row with `organizationId=PLATFORM_ORG_ID`, `action='admin.session.revoke'`, `resourceType='session'`, `resourceId=sessionTrackingId`, `userId=session.user.id`, `severity='warning'`, `createdAt=new Date()`; wrap in try/catch and `console.error` on failure — do not rethrow
  - Call `revalidatePath('/sessions')`
  - **Requirement references:** Requirements 2.3, 2.4, 10.6–10.8, 12.2–12.4

- [x] 19. Update `src/app/layout.tsx` — Sidebar with NavMenu and new links
  - Replace the inline nav link list in the sidebar `<nav>` block with `<NavMenu />` (the client component from task 8)
  - Import `NavMenu` and render it inside the sidebar `<nav>` element
  - Ensure the rest of the layout (header, main content area, profile card, auth guard) is preserved unchanged
  - **Requirement references:** Requirements 11.1–11.6

- [x] 20. Write PBT — Property 1: `isPublicPath` classification
  - Create `apps/admin/src/proxy.test.ts`
  - Import `isPublicPath` from `src/proxy`
  - **Property:** For any string, `isPublicPath` returns `true` iff it exactly equals `/login`, `/setup`, `/favicon.ico` or starts with `/api/auth`, `/_next/static`, `/_next/image`; returns `false` otherwise
  - Use `fc.string()` and `fc.constantFrom(...)` generators; minimum 100 iterations
  - Include edge cases: empty string, paths that *contain* but don't *start with* a public prefix, paths with query strings
  - Annotate: `// Feature: admin-console, Property 1: Public path classification is exhaustive and correct`
  - **Validates: Requirements 1.3, 1.4, 1.5**

- [x] 21. Write PBT — Property 2: Proxy redirect for unauthenticated requests
  - Add to `apps/admin/src/proxy.test.ts`
  - Extract a pure `shouldRedirect(pathname: string, cookieValue: string | undefined): boolean` helper from proxy logic and test it
  - **Property:** For any non-public pathname and any absent/empty cookie value, the function returns `true` (redirect); for any valid non-empty cookie value, returns `false`
  - Use `fc.string()` filtered to non-public paths, and `fc.option(fc.string({ minLength: 1 }))` for cookie values
  - Annotate: `// Feature: admin-console, Property 2: Unauthenticated requests to protected routes always redirect`
  - **Validates: Requirements 1.6**

- [x] 22. Write PBT — Property 5: Ticket status transitions are forward-only
  - Create `apps/admin/src/app/support-tickets/actions.test.ts`
  - Import `validateStatusTransition` from `src/app/support-tickets/actions`
  - **Property:** For any `(currentStatus, requestedStatus)` pair, the function returns `true` only when `currentStatus='open'` and `requestedStatus='in_progress'`, or `currentStatus='in_progress'` and `requestedStatus='closed'`; all other combinations including same-status and backward transitions return `false`
  - Use `fc.constantFrom('open', 'in_progress', 'closed')` for both args plus `fc.string()` for arbitrary unknown values
  - Annotate: `// Feature: admin-console, Property 5: Ticket status transitions are forward-only`
  - **Validates: Requirements 8.4**

- [x] 23. Write PBT — Property 6: AlertTray rendering threshold invariant
  - Create `apps/admin/src/components/AlertTray.test.ts`
  - Import `filterAndSortAlerts` from `src/components/AlertTray`
  - **Property 6a:** The output contains exactly the alerts where `count > 0` — no more, no fewer
  - **Property 6b:** The output is ordered by severity: critical before high before medium before low
  - Use `fc.array(fc.record({ id: fc.string(), label: fc.string(), count: fc.integer({ min: 0, max: 1000 }), severity: fc.constantFrom('critical','high','medium','low'), href: fc.string() }))` as generator
  - Annotate: `// Feature: admin-console, Property 6: Alert rendering threshold invariant`
  - **Validates: Requirements 4.1, 5.2–5.8**

- [x] 24. Write PBT — Property 7: StatusBadge colour mapping is consistent and exhaustive
  - Create `apps/admin/src/components/StatusBadge.test.ts`
  - Import `getStatusClasses` from `src/components/StatusBadge`
  - **Property 7a (known statuses):** For each known status string, the returned classes are deterministic and non-empty
  - **Property 7b (unknown statuses):** For any arbitrary string not in the known set, the function returns the neutral zinc classes and never throws
  - Use `fc.string()` plus `fc.constantFrom(...known statuses...)` as generators
  - Annotate: `// Feature: admin-console, Property 7: StatusBadge colour mapping is consistent and exhaustive`
  - **Validates: Requirements 4.5**

- [x] 25. Write PBT — Properties 8 & 9: DataTable pagination invariants
  - Create `apps/admin/src/components/DataTable.test.ts`
  - Import `getPaginationSlice` and `getTotalPages` from `src/components/DataTable`
  - **Property 8a:** `getPaginationSlice(data, page, 50).length <= 50` for all inputs
  - **Property 8b:** `getTotalPages(N, 50) === Math.ceil(N / 50)` for all N ≥ 0; minimum 1
  - **Property 8c:** No row appears in more than one page — union of all pages equals the full dataset
  - **Property 9:** Pagination slice is derived only from `page` — all other URL params are irrelevant to the data slicing
  - Use `fc.array(fc.anything())` for data, `fc.integer({ min: 1, max: 100 })` for page numbers
  - Annotate: `// Feature: admin-console, Property 8: DataTable pagination invariant` and `// Property 9: DataTable URL parameter preservation`
  - **Validates: Requirements 4.3, 4.6, 13.1–13.6**

- [x] 26. Write PBT — Property 10: Client-side user filters apply AND logic
  - Create `apps/admin/src/app/users/UserListClient.test.ts`
  - Extract and export `applyUserFilters(users: UserWithMemberships[], filters: UserFilters): UserWithMemberships[]` as a pure function from `UserListClient.tsx`
  - **Property 10a:** Every user in the output satisfies all active filter criteria simultaneously
  - **Property 10b:** No user satisfying all active filter criteria is absent from the output (completeness)
  - **Property 10c:** When all filters are `'all'` and search is empty, the output equals the input
  - Use `fc.array(fc.record({ id: fc.string(), name: fc.string(), email: fc.string(), plan: fc.constantFrom('free','pro'), role: fc.constantFrom('user','admin'), emailVerified: fc.boolean(), ...rest }))` as data generator
  - Annotate: `// Feature: admin-console, Property 10: Client-side filters apply AND logic`
  - **Validates: Requirements 7.6, 7.7, 7.8, 7.9**

- [x] 27. Write PBT — Property 15: Purge date highlight is time-relative
  - Create `apps/admin/src/app/organizations/OrgListClient.test.ts`
  - Extract and export `isPurgeImminent(purgeDate: Date | null, now: Date): boolean` as a pure function from `OrgListClient.tsx`
  - **Property:** For any non-null `purgeDate`, returns `true` iff `(purgeDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24) <= 7`; returns `false` for null values and for dates more than 7 days away
  - Use `fc.date()` generators for both `purgeDate` and `now`; also test `null` explicitly
  - Annotate: `// Feature: admin-console, Property 15: Purge date highlight is time-relative`
  - **Validates: Requirements 6.4**

- [x] 28. Write unit tests — Infrastructure and components
  - Create `apps/admin/src/components/__tests__/MetricCard.test.tsx`
    - Test each variant renders the correct colour class
    - Test secondaryNote is rendered when provided and absent when not
  - Create `apps/admin/src/components/__tests__/OrgDrawer.test.tsx`
    - Test that OrgDrawer renders member list and invitations from mock data
    - Test that Escape key triggers `onClose`
    - Test error state when `getOrgDetail` throws
  - Create `apps/admin/src/components/__tests__/DataTable.test.tsx`
    - Test defaults to page 1 when `page` param is absent
    - Test defaults to page 1 when `page` is `'0'`, `'-1'`, `'abc'`
    - Test Previous button disabled on page 1
    - Test Next button disabled when on last page
  - Create `apps/admin/src/app/support-tickets/__tests__/actions.test.ts`
    - Unit test `updateTicketStatus` with valid admin session mock — verify DB update called and audit log insert attempted
    - Unit test `updateTicketStatus` with no session — verify it throws `Unauthorized` and no DB calls made
  - **Requirement references:** Requirements 4.2, 4.3, 4.4, 8.3, 8.4, 13.2, 13.6

- [x] 29. Run all tests and verify passing state
  - Run `pnpm --filter admin test` from the workspace root
  - All PBT tests (tasks 20–27) must pass
  - All unit tests (task 28) must pass
  - Fix any compilation errors or test failures
  - Verify TypeScript has no errors: `pnpm --filter admin check-types`
  - **Requirement references:** All requirements
