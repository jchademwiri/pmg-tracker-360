# Requirements Document

## Introduction

The TenderTrack 360 Platform Admin Console is an internal operations panel used exclusively by Basadipele system administrators. It provides structured, role-gated visibility into the multi-tenant SaaS platform's operational data — surfacing critical alerts, KPI metrics, tenant management, support queues, and security monitoring — all without requiring any database schema changes. The console is built in the existing `apps/admin/` Next.js application using `@pmg/db` (Drizzle ORM), Tailwind CSS, Lucide icons, and Better Auth.

This document covers enhancements to three partially-implemented pages (Dashboard, Organizations, Users) and the introduction of four new pages (Support Tickets, Feedback, Sessions, Sidebar Navigation), plus shared infrastructure (middleware, query helpers, shared components).

---

## Glossary

- **Admin_Console**: The Next.js application at `apps/admin/` serving internal system administrators.
- **Admin_User**: A platform user whose `user.role` equals `"admin"`, authenticated via Better Auth.
- **Auth_Guard**: The server-side session verification check that asserts `session.user.role === "admin"` before executing any page render or server action.
- **Proxy**: The `src/proxy.ts` Next.js 16 proxy that redirects unauthenticated requests on all protected routes to `/login`.
- **Dashboard**: The root page (`/`) of the Admin_Console showing platform-wide KPIs, alerts, and activity.
- **Alert_Tray**: The conditional component at the top of the Dashboard that surfaces critical operational alerts when thresholds are met.
- **KPI_Card**: A metric card component displaying a label, primary count value, and secondary context note.
- **Org_Drawer**: The side drawer component that opens when an organisation row is clicked, showing full org metadata without navigating away.
- **DataTable**: The reusable paginated table component used across list pages.
- **Status_Badge**: The reusable pill component for rendering status values (open, in_progress, closed, active, deleted, suspicious).
- **Session_Tracking**: The `session_tracking` database table storing per-session device, location, and suspicious-flag data.
- **Security_Audit_Log**: The `security_audit_log` database table recording all security-relevant platform events.
- **Support_Ticket**: A record in the `support_tickets` table representing an inbound user support request.
- **Feedback_Entry**: A record in the `feedback` table representing a bug report, feature request, or other user feedback submission.
- **Ghost_Account**: A user record in the `user` table with no corresponding rows in the `member` table.
- **Purge_Date**: The value of `organization.permanentDeletionScheduledAt`, indicating when a soft-deleted organisation will be permanently removed.
- **Soft_Deleted_Org**: An organisation record where `organization.deletedAt IS NOT NULL`.
- **Page_Size**: The fixed pagination increment of 50 records per page, applied to all list views.
- **Server_Action**: A Next.js `'use server'` function that performs a database write operation after re-verifying the Admin_User session.

---

## Requirements

### Requirement 1: Route-Level Authentication Proxy

**User Story:** As a system administrator, I want all admin routes protected by a proxy-level auth check, so that unauthenticated requests are rejected before any page code executes.

#### Acceptance Criteria

1. THE Proxy SHALL be defined in `src/proxy.ts` and export a named `proxy` function (or default export) as required by Next.js 16 conventions.
2. THE Proxy SHALL intercept all HTTP requests to `/*` routes in the Admin_Console.
3. WHEN a request path is an exact match for `/login` or `/setup`, THE Proxy SHALL allow the request to proceed without requiring a session cookie.
4. WHEN a request path starts with `/api/auth`, THE Proxy SHALL allow the request to proceed without requiring a session cookie.
5. WHEN a request path starts with `/_next/static` or `/_next/image`, or is an exact match for `/favicon.ico`, THE Proxy SHALL treat the request as a public resource and allow it to proceed without requiring a session cookie.
6. WHEN an incoming request to a protected route does not contain a session cookie named `tender-track-360.session_token` or `better-auth.session_token` with a non-empty value, THE Proxy SHALL issue an HTTP 307 redirect to `/login`, preserving the original URL as a redirect parameter.
7. WHEN an incoming request to a protected route contains a session cookie with a non-empty value, THE Proxy SHALL allow the request to proceed to the page component.
8. THE Proxy SHALL NOT perform role assertion — full `role === "admin"` verification remains the responsibility of each individual page component and Server_Action.

---

### Requirement 2: Server-Side Auth Guard on All Pages and Actions

**User Story:** As a security-conscious platform operator, I want every page and write action to verify admin role server-side, so that session hijacking or cookie theft cannot grant unauthorised access to admin operations.

#### Acceptance Criteria

1. WHEN any protected page component renders, THE Auth_Guard SHALL call `auth.api.getSession({ headers: await headers() })` before executing any database query.
2. IF the session is absent or `session.user.role` is not equal to `"admin"`, THEN THE Auth_Guard SHALL redirect to `/login` without rendering any page content or executing any database query.
3. WHEN any Server_Action is invoked, THE Auth_Guard SHALL re-verify the admin session as the first operation inside the action function body before any database write is executed.
4. IF a Server_Action's session re-verification fails, THEN THE Server_Action SHALL throw an authorisation error and abort without modifying any database record.
5. THE Auth_Guard SHALL NOT rely solely on client-side role checks or middleware cookie presence for write operation authorisation.

---

### Requirement 3: Consolidated Admin Query Helpers

**User Story:** As a developer maintaining the Admin_Console, I want all database queries centralised in a single file, so that query logic is not duplicated across page components and can be cached or optimised uniformly.

#### Acceptance Criteria

1. THE Admin_Console SHALL expose all admin database queries through a single module at `src/lib/admin-queries.ts`.
2. THE `admin-queries` module SHALL export a `getDashboardMetrics()` function that executes all eight KPI count queries in parallel using `Promise.all()`.
3. THE `admin-queries` module SHALL export a `getAlertCounts()` function that returns counts for all six alert conditions without fetching full record sets.
4. THE `admin-queries` module SHALL export a `getRecentActivity(limit: number)` function that queries the `security_audit_log` table ordered by `createdAt DESC`.
5. THE `admin-queries` module SHALL export a `getOrganizationsWithCounts()` function that returns each organisation row joined with member count, tender count, project count, and purchase order count as subquery aggregates.
6. THE `admin-queries` module SHALL export a `getUsersWithMemberships()` function that returns each user row joined with their organisation memberships and resolved last-active organisation name.
7. THE `admin-queries` module SHALL export a `getSuspiciousSessions()` function that queries `session_tracking` where `isSuspicious = true AND logoutTime IS NULL`, joined with the associated user email.
8. THE `admin-queries` module SHALL export a `getOpenTickets()` function that queries `support_tickets` ordered by `createdAt DESC`, joined with linked user name where `userId` is not null.
9. THE `admin-queries` module SHALL export a `getFeedback(typeFilter?: string)` function that queries the `feedback` table ordered by `createdAt DESC`, joined with linked user name where `userId` is not null, and filtered by type when a filter value is provided.
10. WHEN any query in `getDashboardMetrics()` fails, THE `admin-queries` module SHALL propagate the error rather than silently returning zero values.

---

### Requirement 4: Shared UI Component Library

**User Story:** As a developer, I want reusable admin UI components, so that visual consistency is maintained across all pages without duplicating markup.

#### Acceptance Criteria

1. THE Admin_Console SHALL provide an `AlertTray` component that accepts an array of alert objects and renders conditional alert banners only for alerts whose count exceeds zero.
2. THE Admin_Console SHALL provide a `MetricCard` component that accepts a label, primary count, icon, colour variant, and secondary note string, and renders a KPI card.
3. THE Admin_Console SHALL provide a `DataTable` component that accepts column definitions and row data, renders a paginated table with Page_Size rows per page, and exposes a URL-based `page` query parameter for navigation.
4. THE Admin_Console SHALL provide an `OrgDrawer` component that accepts an organisation ID and renders a side drawer with full org metadata, member list with roles, and pending invitations without navigating to a new page.
5. THE Admin_Console SHALL provide a `StatusBadge` component that accepts a status string and renders a colour-coded pill consistent with the design system.
6. WHEN a DataTable has more rows than Page_Size, THE DataTable SHALL render pagination controls that update the `page` URL parameter and preserve other URL query parameters.

---

### Requirement 5: Enhanced Dashboard Page

**User Story:** As a system administrator, I want the Dashboard to surface critical alerts, eight KPI metrics, pipeline health, plan distribution, and a recent activity feed, so that I can assess platform health immediately upon login without navigating to other pages.

#### Acceptance Criteria

1. WHEN the Dashboard page loads, THE Dashboard SHALL execute all metric queries in parallel so that total server render time does not exceed 800ms under normal database load.
2. WHEN any of the six alert threshold conditions are met, THE Alert_Tray SHALL render at the top of the Dashboard above all KPI cards.
3. WHEN `session_tracking` contains records where `isSuspicious = true AND logoutTime IS NULL`, THE Alert_Tray SHALL display a critical-severity alert linking to `/sessions`.
4. WHEN `user` contains records where `emailVerified = false AND createdAt > NOW() - INTERVAL '7 days'`, THE Alert_Tray SHALL display a high-severity alert with the count of unverified recent users.
5. WHEN `invitation` contains records where `status = 'pending' AND expiresAt < NOW() + INTERVAL '48 hours'`, THE Alert_Tray SHALL display a medium-severity alert with the count of expiring invitations.
6. WHEN `ownership_transfer` contains records where `status = 'pending' AND expiresAt < NOW() + INTERVAL '24 hours'`, THE Alert_Tray SHALL display a medium-severity alert with the count of expiring transfers.
7. WHEN `organization` contains records where `permanentDeletionScheduledAt < NOW() + INTERVAL '72 hours'`, THE Alert_Tray SHALL display a high-severity alert with the count of organisations pending purge.
8. WHEN `support_tickets` contains records where `status = 'open'`, THE Alert_Tray SHALL display a low-severity alert with the open ticket count linking to `/support-tickets`.
9. THE Dashboard SHALL render eight KPI_Cards in a four-column grid displaying: total users, active organisations (where `deletedAt IS NULL`), total tenders, active projects (where `status = 'active'`), live sessions (where `session.expiresAt > NOW()`), email verification rate as a percentage, open support tickets, and waitlist count.
10. THE Dashboard SHALL render a tender pipeline health section showing the count of tenders in each status value (`draft`, `submitted`, `won`, `lost`, `pending`) as proportional CSS progress bars.
11. THE Dashboard SHALL render a plan distribution section showing the count of users per `user.plan` value (`free`, `pro`) as proportional CSS bars without using an external charting library.
12. THE Dashboard SHALL render three quick-status panels showing: suspicious session count with user email list, support ticket status breakdown (`open` / `in_progress` / `closed in last 30 days`), and ownership transfer status breakdown (`pending` / `accepted` / `expired`).
13. THE Dashboard SHALL render a recent activity feed showing the last 20 entries from `security_audit_log` ordered by `createdAt DESC`, each displaying event type, user name, action description, and relative timestamp.

---

### Requirement 6: Enhanced Organizations Page

**User Story:** As a system administrator, I want the Organisations page to show member counts, tender counts, project counts, purchase order counts, soft-delete status, and purge dates alongside each organisation, so that I can assess tenant health and identify organisations requiring attention without running manual queries.

#### Acceptance Criteria

1. THE Organizations_Page SHALL display each organisation row with: org name, org ID (first 8 characters), slug, member count, tender count, project count, purchase order count, soft-delete status badge, purge date, and creation date.
2. WHEN an organisation's `deletedAt IS NULL`, THE Organizations_Page SHALL render a green "Active" Status_Badge for that row.
3. WHEN an organisation's `deletedAt IS NOT NULL`, THE Organizations_Page SHALL render a red "Deleted" Status_Badge for that row.
4. WHEN an organisation's `permanentDeletionScheduledAt` is within 7 days of the current server time, THE Organizations_Page SHALL highlight the purge date cell in red.
5. WHEN the admin selects the "Active Only" filter, THE Organizations_Page SHALL display only organisations where `deletedAt IS NULL`.
6. WHEN the admin selects the "Deleted" filter, THE Organizations_Page SHALL display only Soft_Deleted_Orgs.
7. WHEN the admin selects the "All" filter, THE Organizations_Page SHALL display all organisations regardless of deletion status.
8. WHEN the admin enters text in the search field, THE Organizations_Page SHALL filter the displayed rows client-side to organisations whose name contains the entered text (case-insensitive).
9. THE Organizations_Page SHALL default to showing active-only organisations (filter state "Active Only") on initial page load.
10. WHEN the admin clicks an organisation row, THE Org_Drawer SHALL open and display: full organisation metadata, a list of members with their roles, and any pending invitations for that organisation.
11. THE Organizations_Page SHALL paginate results with Page_Size records per page using URL-based `page` parameter navigation.
12. THE Organizations_Page SHALL NOT expose any write or delete actions — the page is read-only.

---

### Requirement 7: Enhanced Users Page

**User Story:** As a system administrator, I want the Users page to show last-active organisation, account provider, and Ghost_Account flags alongside existing columns, with client-side filters for plan, role, and verification status, so that I can identify inactive or misconfigured accounts quickly.

#### Acceptance Criteria

1. THE Users_Page SHALL display each user row with: name, email, email verification status badge, plan badge, system role badge, organisation membership pills, last active organisation name (resolved from `user.lastActiveOrganizationId`), account provider (from `account.providerId`), and registration date.
2. WHEN a user has no rows in the `member` table, THE Users_Page SHALL render a "Ghost Account" indicator on that user's row.
3. WHEN a user's `lastActiveOrganizationId` is null or does not resolve to an existing organisation, THE Users_Page SHALL display "—" in the last active org column.
4. WHEN a user's account provider is `"credential"`, THE Users_Page SHALL display "Password" as the provider label.
5. WHEN a user's account provider is not `"credential"`, THE Users_Page SHALL display the raw `providerId` value as the provider label (e.g., "magic-link").
6. WHEN the admin selects a plan filter value, THE Users_Page SHALL filter displayed rows client-side to users matching that plan value.
7. WHEN the admin selects a role filter value, THE Users_Page SHALL filter displayed rows client-side to show only users matching that role value and explicitly hide all users whose role does not match.
8. WHEN the admin selects a verification filter value, THE Users_Page SHALL filter displayed rows client-side to show only users matching that email verification status and explicitly exclude all users whose status does not match.
9. WHEN the admin enters text in the search field, THE Users_Page SHALL filter displayed rows client-side to users whose name or email contains the entered text (case-insensitive).
10. THE Users_Page SHALL retain the existing InviteAdminModal write action for inviting new system administrators.
11. THE Users_Page SHALL paginate results with Page_Size records per page using URL-based `page` parameter navigation.

---

### Requirement 8: Support Tickets Page

**User Story:** As a system administrator, I want a dedicated Support Tickets page that shows all inbound tickets with submitter details and allows status progression, so that support requests can be tracked and resolved without accessing the database directly.

#### Acceptance Criteria

1. THE Support_Tickets_Page SHALL display each ticket row with: short ticket reference (first 8 characters of ID prefixed with `#`), submitter name, submitter email, message preview (truncated to 80 characters), status badge, linked user name (or "Anonymous" if `userId IS NULL`), and submission timestamp.
2. THE Support_Tickets_Page SHALL render the status badge using Status_Badge with colour coding: red for `open`, amber for `in_progress`, and green for `closed`.
3. WHEN an admin changes a ticket's status via the status dropdown, THE updateTicketStatus Server_Action SHALL re-verify the admin session before updating the `support_tickets.status` column.
4. THE updateTicketStatus Server_Action SHALL only permit transitions in the sequence `open → in_progress → closed`; it SHALL NOT allow status regression to a previous state.
5. AFTER a successful status update, THE updateTicketStatus Server_Action SHALL insert a record into `security_audit_log` recording the action, the ticket ID, and the acting admin user ID.
6. IF the updateTicketStatus Server_Action's session re-verification fails, THEN THE Server_Action SHALL return an error response without modifying the ticket record.
7. THE Support_Tickets_Page SHALL paginate results with Page_Size records per page using URL-based `page` parameter navigation.
8. THE Support_Tickets_Page SHALL display tickets ordered by `createdAt DESC` by default.

---

### Requirement 9: Feedback Page

**User Story:** As a system administrator, I want a Feedback page that shows all user feedback submissions with type filtering, so that I can triage bug reports and feature requests without accessing the database directly.

#### Acceptance Criteria

1. THE Feedback_Page SHALL display each Feedback_Entry row with: type badge, submitter name, submitter email, message preview (truncated to 80 characters), URL context (the `feedback.url` field, or "—" if null), linked user name (or "Anonymous" if `userId IS NULL`), and submission timestamp.
2. THE Feedback_Page SHALL render the type badge using Status_Badge with distinct colours derived from the `feedback.type` value in the data record regardless of what entries are currently displayed: red for `bug`, blue for `feature`, and grey for `other`.
3. WHEN the admin selects a type filter, THE Feedback_Page SHALL display only Feedback_Entries matching the selected type value (`bug`, `feature`, or `other`).
4. WHEN the admin selects "All" in the type filter, THE Feedback_Page SHALL display all Feedback_Entries regardless of type.
5. THE Feedback_Page SHALL be read-only — it SHALL NOT expose any write actions.
6. THE Feedback_Page SHALL paginate results with Page_Size records per page using URL-based `page` parameter navigation.
7. THE Feedback_Page SHALL display entries ordered by `createdAt DESC` by default.

---

### Requirement 10: Sessions Page

**User Story:** As a system administrator, I want a Sessions page that surfaces suspicious active sessions by default and allows session revocation with confirmation, so that I can respond to security incidents without delay.

#### Acceptance Criteria

1. THE Sessions_Page SHALL default to displaying only sessions where `session_tracking.isSuspicious = true AND session_tracking.logoutTime IS NULL` on initial page load.
2. WHEN the admin activates the "Show All Active" toggle, THE Sessions_Page SHALL navigate to the same route with a `?view=all` URL parameter, and the page SHALL re-fetch from the server using a query that returns all sessions where `session_tracking.logoutTime IS NULL` regardless of the `isSuspicious` flag. WHEN the `view` parameter is absent or any value other than `all`, THE Sessions_Page SHALL default to the suspicious-only query (`isSuspicious = true AND logoutTime IS NULL`).
3. THE Sessions_Page SHALL display each session row with: short session ID (first 8 characters), user email (resolved via join to `session` and then `user`), IP address, browser and OS parsed from the `deviceInfo` JSON field, location parsed from the `locationInfo` JSON field, login time, last activity timestamp, and a status badge.
4. WHEN a session row's `isSuspicious` is true, THE Sessions_Page SHALL render the IP address cell in red.
5. WHEN an admin clicks the revoke button on a session row, THE Sessions_Page SHALL display a confirmation modal before executing the revoke action.
6. WHEN the admin confirms revocation, THE revokeAdminSession Server_Action SHALL re-verify the admin session before calling `auth.api.revokeSession` with the target session token.
7. AFTER a successful session revocation, THE revokeAdminSession Server_Action SHALL insert a record into `security_audit_log` recording the revoked session ID and the acting admin user ID.
8. IF the revokeAdminSession Server_Action's session re-verification fails, THEN THE Server_Action SHALL return an error response without revoking the target session.
9. THE Sessions_Page SHALL paginate results with Page_Size records per page using URL-based `page` parameter navigation.

---

### Requirement 11: Sidebar Navigation Update

**User Story:** As a system administrator, I want the sidebar navigation to include all new pages in clearly labelled groups, so that I can reach any area of the console in one click.

#### Acceptance Criteria

1. THE Sidebar SHALL render navigation links in the following named groups: "Overview" (Dashboard), "Tenants" (Organizations, Users), "Support & Growth" (Support Tickets, Feedback), and "Security" (Sessions).
2. THE Sidebar SHALL render a link to `/support-tickets` labelled "Support Tickets" under the "Support & Growth" group.
3. THE Sidebar SHALL render a link to `/feedback` labelled "Feedback" under the "Support & Growth" group.
4. THE Sidebar SHALL render a link to `/sessions` labelled "Sessions" under the "Security" group.
5. WHEN the current route matches a sidebar link's `href`, THE Sidebar SHALL apply an active visual state to that link to indicate the current page.
6. THE Sidebar SHALL NOT include a navigation link to the waitlist page, as that page is explicitly out of scope for this feature.

---

### Requirement 12: Audit Logging for All Write Actions

**User Story:** As a compliance-minded platform operator, I want all admin write actions recorded in the security audit log, so that there is a tamper-evident trail of every administrative action taken in the console.

#### Acceptance Criteria

1. WHEN the updateTicketStatus Server_Action successfully updates a support ticket status, THE Server_Action SHALL insert a row into `security_audit_log` with: `action = "admin.ticket.status_update"`, `resourceType = "support_ticket"`, `resourceId` equal to the ticket ID, `userId` equal to the acting admin user ID, and `severity = "info"`.
2. WHEN the revokeAdminSession Server_Action successfully revokes a session, THE Server_Action SHALL insert a row into `security_audit_log` with: `action = "admin.session.revoke"`, `resourceType = "session"`, `resourceId` equal to the revoked session ID, `userId` equal to the acting admin user ID, and `severity = "warning"`.
3. IF the audit log insert fails after a successful write operation, THE Server_Action SHALL log the error server-side but SHALL NOT roll back the primary operation.
4. THE `security_audit_log` insert SHALL use a server-generated timestamp for `createdAt` and SHALL NOT accept a client-provided timestamp.
5. WHEN a platform-level write action (ticket status update or session revocation) has no associated organisation context, THE Server_Action SHALL use the designated platform sentinel `organizationId` (the fixed ID `org_platform_admin`) to satisfy the `securityAuditLog` FK constraint. THE Server_Action SHALL NOT silently accept a state where the audit log insert is structurally guaranteed to fail.

---

### Requirement 13: Pagination on All List Pages

**User Story:** As a system administrator, I want all list pages to paginate at 50 records per page with URL-based navigation, so that pages remain fast regardless of data volume and specific pages can be bookmarked or shared.

#### Acceptance Criteria

1. THE DataTable SHALL apply offset-based pagination with a fixed Page_Size of 50 records per page.
2. THE DataTable SHALL read the current page number from the `page` URL query parameter, defaulting to page 1 when the parameter is absent or invalid.
3. WHEN the current page is greater than 1, THE DataTable SHALL render a "Previous" control that decrements the `page` parameter.
4. WHEN there are more records beyond the current page and the total record count is greater than zero, THE DataTable SHALL render a "Next" control that increments the `page` parameter.
5. THE DataTable SHALL display the current page number and total page count in the pagination controls.
6. WHEN the `page` parameter value is not a positive integer, THE DataTable SHALL default to page 1 without throwing an error.
