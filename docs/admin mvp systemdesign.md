# TenderTrack 360 — Platform Admin Console
## MVP System Design Document

**Version:** 1.0  
**Owner:** Platform Engineering · admin@tendertrack360.co.za  
**Classification:** Internal — Confidential  
**Prepared:** June 2026

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Design Principles](#2-design-principles)
3. [Information Architecture](#3-information-architecture)
4. [Page Specifications](#4-page-specifications)
   - 4.1 [Dashboard](#41-dashboard-)
   - 4.2 [Organizations](#42-organizations-organizations)
   - 4.3 [Users](#43-users-users)
   - 4.4 [Support Tickets](#44-support-tickets-support-tickets)
   - 4.5 [Waitlist](#45-waitlist-waitlist)
   - 4.6 [Sessions](#46-sessions-sessions)
5. [Data Access Patterns](#5-data-access-patterns)
6. [Authentication & Authorisation](#6-authentication--authorisation)
7. [MVP Scope Matrix](#7-mvp-scope-matrix)
8. [Component Architecture](#8-component-architecture)
9. [Security Requirements](#9-security-requirements)
10. [Delivery Plan](#10-delivery-plan)
11. [V2 Roadmap](#11-v2-roadmap-post-mvp)
12. [Appendix A — Database Tables](#appendix-a--database-tables-used-in-mvp)

---

## 1. Executive Summary

This document defines the Minimum Viable Product (MVP) scope for the TenderTrack 360 Platform Admin Console — the internal operations panel used by Basadipele system administrators to monitor, manage, and govern the multi-tenant SaaS platform.

The MVP admin console exists to solve one core problem:

> **Platform administrators currently have no operational visibility into the system beyond raw database access.**

The MVP delivers a structured, secure, role-gated web interface that surfaces the most critical operational data from the existing PostgreSQL schema — without requiring any schema changes. Everything described in this document is buildable directly from tables already defined in the codebase.

| Dimension | Scope |
|---|---|
| Audience | Internal system administrators only (`role = admin`) |
| Authentication | Existing Better Auth — passphrase + magic link OTP |
| Data source | Existing `@pmg/db` PostgreSQL schema — no new tables required |
| Tech stack | Next.js 16, Drizzle ORM, Tailwind CSS, Lucide icons |
| Hosting | `admin.tendertrack360.co.za` (Vercel) |
| Target delivery | 4–6 weeks from design sign-off |

---

## 2. Design Principles

Every decision in this MVP is guided by the following five principles.

**1. Read-only first.** The MVP surfaces data for visibility. Destructive write actions (hard deletes, role changes, bans) are excluded from v1 to prevent accidental damage. Exceptions: resolving support tickets and revoking suspicious sessions.

**2. Zero schema changes.** All data is queried from the existing schema. Adding new tables or columns is out of scope and would delay delivery.

**3. Security by default.** Every route must verify session and assert `role = admin` server-side before rendering. No client-side role checks are sufficient on their own.

**4. Operational urgency first.** The dashboard surfaces critical alerts (suspicious sessions, unverified emails, expiring invitations) above all other content. An admin logging in at 2am should see what needs attention in under 3 seconds.

**5. Minimal UI, maximum data density.** The admin console is not a customer-facing product. Prioritise information density over aesthetic polish. One well-structured table beats three decorative cards.

---

## 3. Information Architecture

The console is structured into five navigation groups. Each group maps to a distinct operational concern.

| Nav Group | Pages | Primary Concern |
|---|---|---|
| Overview | Dashboard, System Health | At-a-glance platform state and critical alerts |
| Tenants | Organizations, Users, Subscriptions | Customer account governance |
| Data | Tenders, Projects, POs, Support Tickets, Waitlist | Platform content oversight |
| Security | Audit Log, Sessions, Rate Limits | Threat detection and compliance |
| Platform | Email Deliverability, DB Console, Config | Infrastructure and configuration |

**MVP scope covers:** Overview (Dashboard only), Tenants (Organizations + Users), Data (Support Tickets + Waitlist), and Security (Sessions). The remaining pages are v2 scope.

---

## 4. Page Specifications

### 4.1 Dashboard (`/`)

The primary landing page after login. Loads in under 500ms. All queries are parallelised using `Promise.all()`.

#### 4.1.1 Critical Alert Tray

Appears at the very top of the dashboard, above all KPIs. Alerts are conditional — only rendered if the threshold is met. Each alert links to its relevant detail page.

| Alert | Trigger condition | DB source | Severity |
|---|---|---|---|
| Suspicious sessions | `isSuspicious = true AND logoutTime IS NULL` | `session_tracking` | 🔴 Critical |
| Unverified emails | `emailVerified = false AND createdAt > now() - 7d` | `user` | 🟠 High |
| Expiring invitations | `status = pending AND expiresAt < now() + 48h` | `invitation` | 🟡 Medium |
| Pending ownership transfers | `status = pending AND expiresAt < now() + 24h` | `ownership_transfer` | 🟡 Medium |
| Orgs pending purge | `permanentDeletionScheduledAt < now() + 72h` | `organization` | 🟠 High |
| Open support tickets | `status = open, count > 0` | `support_tickets` | 🔵 Low |

#### 4.1.2 KPI Metric Cards

Eight metric cards in a 4-column grid. Each card shows a label, primary count, and a secondary trend note. All values pulled server-side on page load.

| Metric | Query | Secondary note |
|---|---|---|
| Total users | `COUNT(*) FROM user` | New registrations this week |
| Active orgs | `COUNT(*) FROM organization WHERE deletedAt IS NULL` | New orgs this week |
| Tenders tracked | `COUNT(*) FROM tender` | Across all orgs |
| Projects | `COUNT(*) FROM project WHERE status = active` | Active only |
| Live sessions | `COUNT(*) FROM session WHERE expiresAt > now()` | X suspicious |
| Email verification rate | `emailVerified = true / total * 100` | X unverified accounts |
| Open support tickets | `COUNT(*) FROM support_tickets WHERE status = open` | X in_progress |
| Waitlist | `COUNT(*) FROM waitlist` | New this week |

#### 4.1.3 User Plan Distribution

A horizontal bar chart showing the breakdown of `user.plan` values (`free`, `pro`) and a separate breakdown of `member.role` values across all organisations (`owner`, `admin`, `manager`, `member`). Rendered as CSS bars — no charting library required for MVP.

#### 4.1.4 Live Activity Feed

A chronological list of recent platform events sourced from `security_audit_log` (`ORDER BY createdAt DESC LIMIT 20`). Each entry shows: event type icon, user name, action description, and relative timestamp. For MVP, this is a server-rendered list with no real-time websocket. A manual refresh button reloads the page.

#### 4.1.5 Quick-Status Panels

Three compact summary cards in a 3-column row beneath the main content:

- **Suspicious sessions** — count flagged, list of user emails, direct link to Sessions page
- **Support tickets** — `open` / `in_progress` / `closed (30d)` counts, link to Tickets page
- **Ownership transfers** — `pending` / `accepted (30d)` / `expired` counts

---

### 4.2 Organizations (`/organizations`)

Full list of all platform tenant organisations. Read-only in MVP.

#### Columns

| Column | Source field | Notes |
|---|---|---|
| Org name + ID | `organization.name`, `.id` | Truncate ID to first 8 chars |
| Slug | `organization.slug` | Shows `"no-slug-configured"` if null |
| Members | `COUNT(*) FROM member WHERE organizationId` | Joined subquery |
| Tenders | `COUNT(*) FROM tender WHERE organizationId` | Joined subquery |
| Soft-deleted | `organization.deletedAt` | Badge: Active or Deleted |
| Purge date | `permanentDeletionScheduledAt` | Highlight red if within 7 days |
| Created | `organization.createdAt` | Formatted date |

#### Filters

- Show deleted / hide deleted toggle (filters on `deletedAt IS NULL`)
- Text search by org name (client-side filter on loaded data for MVP)

#### Org Detail Drawer

Clicking a row opens a side drawer (no page navigation) showing full org metadata, member list with roles, and pending invitations for that org. No write actions in MVP.

---

### 4.3 Users (`/users`)

Full user roster with organisation membership context. Admins can invite new system administrators from this page (existing functionality — retained from current implementation).

#### Columns

| Column | Source field | Notes |
|---|---|---|
| Name + email | `user.name`, `.email` | Avatar initials circle |
| Email verified | `user.emailVerified` | Green Verified / Red Pending badge |
| Plan | `user.plan` | `free` = grey, `pro` = amber |
| System role | `user.role` | `user` = grey, `admin` = amber |
| Org memberships | `member JOIN organization` | Pill per org: `OrgName: role` |
| Last active org | `user.lastActiveOrganizationId` | Resolved to org name |
| Registered | `user.createdAt` | Formatted date |

#### Filters

- Plan filter: all / free / pro
- Role filter: all / user / admin
- Verification filter: all / verified / unverified
- Text search by name or email

#### Write Actions (MVP — limited)

- **Invite system admin:** existing `InviteAdminModal` (create user with `role = admin`)

---

### 4.4 Support Tickets (`/support-tickets`)

Queue view of all `support_tickets` records. This page is entirely missing from the current implementation and is high-priority for MVP.

#### Columns

| Column | Source field | Notes |
|---|---|---|
| Ticket ID | `support_tickets.id` | Shortened reference, e.g. `#ST-001` |
| Name + email | `.name`, `.email` | Submitter contact |
| Message preview | `.message` | Truncated to 80 chars |
| Status | `.status` | `open` (red) / `in_progress` (amber) / `closed` (green) |
| Linked user | `.userId → user.name` | Null if anonymous |
| Submitted | `.createdAt` | Relative time + absolute date |

#### Write Actions

- **Update status:** dropdown to change `open → in_progress → closed` (single server action)
- No reply/email functionality in MVP — handled externally

---

### 4.5 Waitlist (`/waitlist`)

Displays all waitlist entries. No write actions in MVP beyond export.

| Column | Source field | Notes |
|---|---|---|
| Email | `waitlist.email` | |
| Company | `waitlist.companyName` | `"—"` if null |
| Source | `waitlist.source` | `website` / `webhook` / `other` |
| Joined | `waitlist.createdAt` | Formatted date |

- **CSV export button:** downloads all waitlist entries as a `.csv` file (client-side Blob generation)
- Total count displayed in page header

---

### 4.6 Sessions (`/sessions`)

Security-focused view of the `session_tracking` table. Surfaces suspicious activity for immediate administrator action.

#### Default View — Flagged Sessions Only

On load, the page defaults to showing only records where `isSuspicious = true AND logoutTime IS NULL`. A toggle exposes all active sessions.

| Column | Source field | Notes |
|---|---|---|
| Session ID (short) | `session_tracking.id` | First 8 chars |
| User | `session → user.email` | Resolved via join |
| IP address | `.ipAddress` | Highlighted red if suspicious |
| Device info | `.deviceInfo` | Parsed from JSON — show browser/OS |
| Login time | `.loginTime` | Formatted datetime |
| Last activity | `.lastActivity` | Relative time |
| Status | `.isSuspicious + .logoutTime` | Suspicious / Active / Ended |

#### Write Actions

- **Revoke session:** calls `auth.api.revokeSession` (terminates the Better Auth session record). Requires confirmation modal.

---

## 5. Data Access Patterns

All data access is server-side using Drizzle ORM. No API endpoints are exposed for admin data — pages fetch directly in Next.js Server Components using the `@pmg/db` client.

### 5.1 Dashboard Query Strategy

The dashboard executes all metric queries in parallel to minimise page load time:

```ts
const [users, orgs, tenders, projects, sessions, tickets, waitlist] =
  await Promise.all([
    countUsers(),
    countOrgs(),
    countTenders(),
    countActiveProjects(),
    countLiveSessions(),
    countOpenTickets(),
    countWaitlist(),
  ]);
```

Alert queries are run separately and conditionally — only the counts needed to determine alert visibility, not full record sets.

### 5.2 Pagination

All list pages (Organizations, Users, Support Tickets, Waitlist, Sessions) implement pagination with a default page size of 50 records. The URL contains a `page` param for shareable pages. For MVP, offset pagination (`LIMIT`/`OFFSET`) is acceptable given expected data volumes.

### 5.3 Server Actions for Writes

Write operations use Next.js Server Actions (`'use server'`). Three write actions are in scope for MVP:

| Action | Function | Affected table | Guard |
|---|---|---|---|
| Invite system admin | `createSystemAdmin()` | `user` | `role = admin` check |
| Update ticket status | `updateTicketStatus()` | `support_tickets` | `role = admin` check |
| Revoke session | `revokeAdminSession()` | `session` | `role = admin` + confirmation |

Every server action must re-verify the admin session at the top of the function body before executing any database operation. A stolen request body must not be able to trigger a write.

---

## 6. Authentication & Authorisation

Authentication is handled entirely by Better Auth, already configured in the codebase. No changes to the auth layer are required for MVP.

### 6.1 Session Verification Pattern

Every protected page and server action must include the following guard — identical to the existing implementation:

```ts
const session = await auth.api.getSession({ headers: await headers() });

if (!session || (session.user as any).role !== 'admin') {
  redirect('/login');
}
```

This check happens in the server component body, before any database queries execute. Middleware-level protection is an additional layer but not a substitute.

### 6.2 Admin Route Middleware

A `middleware.ts` file is added to the admin app to intercept all requests to `/*`, excluding `/login`, `/setup`, and `/api/auth/**`. For any matching protected request, the middleware validates that a session cookie exists. If absent, it redirects to `/login`. The full role check remains server-side in each page component.

```ts
// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/login', '/setup', '/api/auth'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some(p => pathname.startsWith(p));
  if (isPublic) return NextResponse.next();

  const sessionCookie =
    request.cookies.get('tender-track-360.session_token') ||
    request.cookies.get('better-auth.session_token');

  if (!sessionCookie) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
```

### 6.3 Authentication Flows

| Flow | Method | Status |
|---|---|---|
| Passphrase login | Better Auth `signInEmail` | Existing — no change |
| Magic link + OTP | Better Auth `magicLink` plugin | Existing — no change |
| Initial setup | `/setup` page | Existing — no change |
| Session revocation | `auth.api.revokeSession` | New server action — trivial addition |

---

## 7. MVP Scope Matrix

| Feature / View | MVP Status | Notes |
|---|---|---|
| Dashboard — alert tray | ✅ MVP v1 | Critical alerts from 5 sources |
| Dashboard — KPI cards (8) | ✅ MVP v1 | All parallelised queries |
| Dashboard — plan distribution bar chart | ✅ MVP v1 | CSS bars, no charting library |
| Dashboard — live activity feed | ✅ MVP v1 | Server-rendered, manual refresh |
| Dashboard — quick-status panels | ✅ MVP v1 | Sessions, tickets, transfers |
| Organizations list + detail drawer | ✅ MVP v1 | Read-only with member + tender counts |
| Users list + filters | ✅ MVP v1 | With org membership pills |
| Invite system admin modal | ✅ MVP v1 | Existing — retained |
| Support tickets queue | ✅ MVP v1 | With status update action |
| Waitlist view + CSV export | ✅ MVP v1 | Simple list + client-side export |
| Sessions — suspicious session view | ✅ MVP v1 | With session revocation |
| Route middleware (auth guard) | ✅ MVP v1 | `middleware.ts` addition |
| Pagination (all list pages) | ✅ MVP v1 | Offset-based, page size 50 |
| Security audit log viewer | 🟡 v2 | Requires date range + actor filters |
| Email deliverability dashboard | 🟡 v2 | Needs Resend webhook integration |
| Ownership transfer management | 🟡 v2 | Approve/cancel actions |
| Subscription / plan management | 🟡 v2 | Billing integration TBD |
| Real-time activity feed (websocket/SSE) | 🟡 v2 | Polling or SSE approach |
| Tenders / Projects list views | 🟡 v2 | Low admin priority in v1 |
| Purchase Orders view | 🟡 v2 | Low admin priority in v1 |
| DB Console (direct SQL) | ❌ Out of scope | Security risk — use Drizzle Studio locally |
| User impersonation | ❌ Out of scope | Legal/privacy risk — excluded entirely |
| Hard delete any records | ❌ Out of scope | Irreversible — database tooling only |
| Role promotion/demotion (non-admin) | ❌ Out of scope | Out of admin scope in v1 |

---

## 8. Component Architecture

The admin app follows the Next.js App Router convention already established in the codebase. The pattern from the existing `users` and `organizations` pages is extended across all new pages.

### 8.1 File Structure (additions only)

| File path | Purpose |
|---|---|
| `src/proxy.ts` | Route-level auth guard for all `/*` routes |
| `src/app/page.tsx` | Dashboard — **replace** existing with full implementation |
| `src/app/organizations/page.tsx` | Org list — **enhance** with member counts + drawer |
| `src/app/users/page.tsx` | User list — **enhance** with filters |
| `src/app/support-tickets/page.tsx` | **New** — ticket queue page |
| `src/app/support-tickets/actions.ts` | **New** — `updateTicketStatus` server action |
| `src/app/waitlist/page.tsx` | **New** — waitlist view |
| `src/app/sessions/page.tsx` | **New** — session security view |
| `src/app/sessions/actions.ts` | **New** — `revokeAdminSession` server action |
| `src/components/AlertTray.tsx` | **New** — shared alert banner component |
| `src/components/MetricCard.tsx` | **New** — KPI card component |
| `src/components/DataTable.tsx` | **New** — reusable sortable table |
| `src/components/OrgDrawer.tsx` | **New** — org detail side drawer |
| `src/components/StatusBadge.tsx` | **New** — reusable status pill |
| `src/lib/admin-queries.ts` | **New** — all admin DB queries consolidated here |

### 8.2 Shared Query Helpers (`src/lib/admin-queries.ts`)

All admin database queries live in a single file. This prevents duplication across pages and makes it easy to add Next.js `cache()` or `unstable_cache` in v2.

```ts
export async function getDashboardMetrics() { ... }   // 8 KPI queries in parallel
export async function getAlertCounts() { ... }        // 6 alert threshold queries
export async function getRecentActivity(limit = 20)   // security_audit_log
export async function getOrganizationsWithCounts()    // org list + member/tender counts
export async function getUsersWithMemberships()       // user list + joined member/org data
export async function getSuspiciousSessions()         // session_tracking WHERE isSuspicious
export async function getOpenTickets()                // support_tickets ORDER BY createdAt
export async function getWaitlist()                   // waitlist ORDER BY createdAt
```

### 8.3 Sidebar Navigation Items (MVP)

```
Overview
  ├── Dashboard          /
  └── (System Health)    — v2

Tenants
  ├── Organizations      /organizations
  └── Users              /users

Data
  ├── Support Tickets    /support-tickets  ← NEW
  └── Waitlist           /waitlist         ← NEW

Security
  └── Sessions           /sessions         ← NEW
```

---

## 9. Security Requirements

The admin console is a high-value target. The following requirements are non-negotiable in MVP.

| Requirement | Implementation | Priority |
|---|---|---|
| Server-side role assertion on every route | `session.user.role === 'admin'` check in every page component | 🔴 Critical |
| Server-side role assertion on every action | Same check at the top of every server action before any DB call | 🔴 Critical |
| No sensitive data in client components | All DB queries in Server Components or Server Actions only | 🔴 Critical |
| HTTPS only | Enforced by Vercel — `admin.tendertrack360.co.za` | 🔴 Critical |
| Cross-subdomain cookie scoped to `tendertrack360.co.za` | Existing Better Auth config — already correct | 🟠 High |
| Rate limiting on auth endpoints | Existing Better Auth `rateLimit` config (10 req / 60s) | 🟠 High |
| Confirmation modal before session revocation | Client-side modal before server action fires | 🟠 High |
| No hard-delete actions exposed | Excluded from MVP entirely | 🟠 High |
| Audit log for admin write actions | Insert into `security_audit_log` from each server action | 🔵 Medium |

---

## 10. Delivery Plan

Estimated 4-week timeline for a single developer.

### Week 1 — Foundation & Security

- `middleware.ts` route guard
- `src/lib/admin-queries.ts` with all query helpers
- `AlertTray`, `MetricCard`, `DataTable`, `StatusBadge` components
- Dashboard skeleton with live KPI data and alert tray working

### Week 2 — Dashboard + Orgs + Users

- Full dashboard implementation: plan distribution bars, activity feed, quick-status panels
- Enhanced Organizations page with member/tender counts and detail drawer
- Enhanced Users page with plan/role/verification filters

### Week 3 — Support Tickets + Waitlist + Sessions

- Support tickets queue with `updateTicketStatus` server action
- Waitlist view with client-side CSV export
- Suspicious sessions view with `revokeAdminSession` and confirmation modal

### Week 4 — QA, Hardening, Deploy

- End-to-end auth guard testing on all routes and actions
- Query performance review — all pages under 800ms on production DB
- Production deployment to `admin.tendertrack360.co.za`
- Smoke test checklist against Definition of Done

### Definition of Done

The MVP is complete when:

1. All 7 pages marked `✅ MVP v1` are deployed and accessible at `admin.tendertrack360.co.za`
2. Every page correctly redirects to `/login` when accessed without an active admin session
3. The alert tray surfaces at least 3 of the 6 defined alert types based on live database conditions
4. The ticket status update action works end-to-end and is reflected immediately on page reload
5. Session revocation terminates the target session and is confirmed via database inspection
6. All queries complete in under 800ms on the production database under normal load
7. No database credentials, session tokens, or admin data appear in client-side JavaScript bundles

---

## 11. V2 Roadmap (Post-MVP)

The following features are explicitly deferred from MVP. They are listed here to ensure the MVP architecture does not inadvertently block them.

### Security & Compliance

- Full security audit log viewer with date range, actor, and severity filtering
- Rate limit dashboard: current utilisation per IP with manual block/unblock capability
- Login attempt monitoring: track failed auth attempts and lock accounts after threshold

### Tenant Management

- Subscription and plan management: change `user.plan`, view billing history (requires Stripe or equivalent)
- Ownership transfer management: admin ability to approve, cancel, or force-expire pending transfers
- Org feature flag management: enable/disable features per organisation

### Operational Intelligence

- Real-time activity feed using Server-Sent Events (SSE) or polling every 30 seconds
- Email deliverability dashboard: Resend webhook integration for delivery, open, and bounce rates
- Tender and project health views: cross-tenant analytics on tender win rates and project completion
- Notification preferences audit: view which users have opted out of which notification types

### Platform

- Feedback viewer: triage the `feedback` table with type filtering (`bug`, `feature`, `other`)
- Bulk operations: resend invitation emails, bulk verify email addresses, export user lists
- Admin activity log: separate log tracking what admin users did inside the console itself

---

## Appendix A — Database Tables Used in MVP

No new tables or columns are required. All queries target the existing `@pmg/db` schema.

| Table | Used by | Key fields accessed |
|---|---|---|
| `user` | Dashboard, Users, Sessions | `id`, `name`, `email`, `emailVerified`, `plan`, `role`, `createdAt` |
| `session` | Sessions | `id`, `expiresAt`, `token`, `userId`, `activeOrganizationId` |
| `organization` | Dashboard, Organizations | `id`, `name`, `slug`, `createdAt`, `deletedAt`, `permanentDeletionScheduledAt` |
| `member` | Organizations, Users | `id`, `organizationId`, `userId`, `role` |
| `invitation` | Dashboard (alerts) | `id`, `organizationId`, `email`, `role`, `status`, `expiresAt` |
| `tender` | Dashboard (KPI count) | `id`, `organizationId`, `status` |
| `project` | Dashboard (KPI count) | `id`, `organizationId`, `status` |
| `session_tracking` | Dashboard, Sessions | `id`, `sessionId`, `isSuspicious`, `loginTime`, `lastActivity`, `logoutTime`, `ipAddress`, `deviceInfo` |
| `security_audit_log` | Dashboard (activity feed) | `id`, `organizationId`, `userId`, `action`, `resourceType`, `severity`, `createdAt` |
| `ownership_transfer` | Dashboard (alerts) | `id`, `organizationId`, `status`, `expiresAt` |
| `support_tickets` | Dashboard, Support Tickets | `id`, `name`, `email`, `message`, `status`, `userId`, `createdAt` |
| `waitlist` | Waitlist | `id`, `email`, `companyName`, `source`, `createdAt` |
| `verification` | Auth (existing) | `id`, `identifier`, `value`, `expiresAt` |

---

*End of document — TenderTrack 360 Platform Admin MVP System Design v1.0*