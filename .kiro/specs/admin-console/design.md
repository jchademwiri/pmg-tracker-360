# Design Document — TenderTrack 360 Platform Admin Console

## Overview

The TenderTrack 360 Platform Admin Console is an internal operations panel for Basadipele system administrators. It provides role-gated, read-mostly visibility into the multi-tenant SaaS platform — surfacing critical alerts, KPI metrics, tenant management, support queues, and security monitoring — built entirely on the existing `apps/admin/` Next.js application without any database schema changes.

This document covers the technical design for:

- Route-level authentication proxy (`src/proxy.ts`)
- Centralised admin query helpers (`src/lib/admin-queries.ts`)
- Five shared UI components (`AlertTray`, `MetricCard`, `DataTable`, `OrgDrawer`, `StatusBadge`)
- Replacements/enhancements for three existing pages (Dashboard, Organizations, Users)
- Four new pages (Support Tickets, Feedback, Sessions) plus sidebar navigation update
- Two server action modules with audit logging

### Design Goals

1. **Zero schema changes** — all data is queried from the existing `@pmg/db` schema.
2. **Server-side data isolation** — all database queries live in Server Components or Server Actions; no DB calls in client components.
3. **Defence in depth** — proxy cookie check + per-page session + role check + per-action re-verification.
4. **Operational urgency** — dashboard surfaces critical alerts before KPI metrics; target ≤ 800ms render time.
5. **Minimal dependencies** — Tailwind CSS + Lucide icons only; no charting libraries, no new npm packages beyond what already exists.

---

## Architecture

The admin console is a Next.js 16 App Router application. The overall request lifecycle is:

```
Browser Request
      │
      ▼
┌─────────────────────────────────┐
│  src/proxy.ts                   │  ← Cookie presence check only
│  (Next.js 16 proxy convention)  │    Redirects to /login if no cookie
└──────────────┬──────────────────┘
               │ allowed
               ▼
┌─────────────────────────────────┐
│  Server Component (page.tsx)    │  ← Full session + role assertion
│  auth.api.getSession()          │    Redirects to /login if not admin
└──────────────┬──────────────────┘
               │ verified admin
               ▼
┌─────────────────────────────────┐
│  src/lib/admin-queries.ts       │  ← All DB queries (server-only)
│  Drizzle ORM via @pmg/db        │
└──────────────┬──────────────────┘
               │ data
               ▼
┌─────────────────────────────────┐
│  Server Component renders HTML  │  ← Passes serialisable props to
│  + Client Components (islands)  │    client components (DataTable,
└─────────────────────────────────┘    OrgDrawer, NavMenu, filters)
```

### Key Architectural Decisions

**Next.js 16 `proxy.ts` instead of `middleware.ts`**
Next.js 16 renames `middleware.ts` → `proxy.ts` with the export renamed from `middleware` to `proxy`. The proxy performs only a cookie presence check — no JWT decode, no role assertion. This keeps the proxy fast (no DB round trip) while ensuring unauthenticated requests never reach page code.

**Single query module**
All admin DB queries are exported from `src/lib/admin-queries.ts`. This avoids duplication across pages and provides a single place to add `unstable_cache` or query optimisations in a future iteration.

**Client component islands**
Filtering, search, and pagination state is client-side only. The page fetches all data server-side; client components receive it as props and filter/paginate in memory. This avoids round-trips for filter interactions while keeping DB calls on the server.

**`OrgDrawer` uses a Server Action for detail data**
The org list page fetches count-aggregated rows for all orgs. The full org detail (members + invitations) is fetched via a Server Action when the drawer opens, avoiding an N+1 problem on initial page load.

---

## Components and Interfaces

### `src/proxy.ts` — Route Guard

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Paths allowed without a session cookie
const EXACT_PUBLIC = new Set(['/login', '/setup', '/favicon.ico']);
const PREFIX_PUBLIC = ['/api/auth', '/_next/static', '/_next/image'];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (EXACT_PUBLIC.has(pathname)) return NextResponse.next();
  if (PREFIX_PUBLIC.some((p) => pathname.startsWith(p))) return NextResponse.next();

  const sessionCookie =
    request.cookies.get('tender-track-360.session_token') ||
    request.cookies.get('better-auth.session_token');

  if (!sessionCookie?.value) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl, 307);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
```

Design decisions:
- Exact-match set for `/login`, `/setup`, `/favicon.ico`; prefix-match array for `/api/auth`, `/_next/static`, `/_next/image`
- Both known session cookie names are checked (Better Auth uses `tender-track-360.session_token` in production, `better-auth.session_token` in some configurations)
- HTTP 307 preserves the HTTP method on redirect
- Original path is passed as `redirect` query param for post-login redirect

---

### `src/lib/admin-queries.ts` — Query Helpers

All functions are `async` and must only be called from Server Components or Server Actions.

```typescript
// Return types (abbreviated)
type DashboardMetrics = {
  totalUsers: number;        newUsersThisWeek: number;
  activeOrgs: number;        newOrgsThisWeek: number;
  totalTenders: number;
  activeProjects: number;
  liveSessions: number;      suspiciousCount: number;
  verifiedCount: number;     unverifiedCount: number;
  openTickets: number;       inProgressTickets: number;
  waitlistTotal: number;     newWaitlistThisWeek: number;
  tenderByStatus: Record<'draft'|'submitted'|'won'|'lost'|'pending', number>;
  planDistribution: Record<'free'|'pro', number>;
};

type AlertCounts = {
  suspiciousSessions: number;
  unverifiedRecentUsers: number;
  expiringInvitations: number;
  expiringTransfers: number;
  pendingPurgeOrgs: number;
  openTickets: number;
};

type ActivityEntry = {
  id: string; action: string; resourceType: string; severity: string;
  createdAt: Date; userId: string | null; userName: string | null;
};

type OrgWithCounts = {
  id: string; name: string; slug: string | null; logo: string | null;
  metadata: string | null; createdAt: Date; deletedAt: Date | null;
  deletionReason: string | null; permanentDeletionScheduledAt: Date | null;
  memberCount: number; tenderCount: number; projectCount: number; poCount: number;
};

type UserWithMemberships = {
  id: string; name: string; email: string; emailVerified: boolean;
  plan: string; role: string; createdAt: Date; lastActiveOrganizationId: string | null;
  lastActiveOrgName: string | null; providerId: string | null;
  memberships: Array<{ orgId: string; orgName: string; role: string }>;
  isGhost: boolean;
};

type SuspiciousSession = {
  id: string; sessionId: string; loginTime: Date; lastActivity: Date;
  logoutTime: Date | null; ipAddress: string | null; deviceInfo: string | null;
  locationInfo: string | null; isSuspicious: boolean; userEmail: string | null;
};

type TicketWithUser = {
  id: string; name: string; email: string; message: string;
  status: string; createdAt: Date; userId: string | null; userName: string | null;
};

type FeedbackWithUser = {
  id: string; type: string; name: string | null; email: string | null;
  message: string; url: string | null; createdAt: Date;
  userId: string | null; userName: string | null;
};

// Exported functions (summary)
// getSuspiciousSessions(): Promise<SuspiciousSession[]>
// getAllActiveSessions(): Promise<SuspiciousSession[]>
```

**`getDashboardMetrics()`** — executes all 8 KPI queries in a single `Promise.all()`. Uses `sql` tagged template literals for status-grouped counts.

**`getAlertCounts()`** — returns count-only queries for the 6 alert conditions. Uses `gt(count(), 0)` pattern — intentionally returns 0 counts, not full rows, to keep the dashboard fast.

**`getRecentActivity(limit: number)`** — left joins `security_audit_log` with `user` to get `user.name` for display. Orders by `createdAt DESC`.

**`getOrganizationsWithCounts()`** — uses four correlated subqueries (`sq(count()).from(member).where(...)` etc.) in the `select()` call. Returns all orgs; filtering happens client-side.

**`getUsersWithMemberships()`** — fetches all users, all members with org names, and all accounts (left join, most recent per user via `orderBy(desc(account.createdAt))`). Assembles ghost flag by checking membership map.

**`getSuspiciousSessions()`** — queries `sessionTracking` joined to `session` joined to `user` on `session.userId`. Filter: `isSuspicious = true AND logoutTime IS NULL`.

**`getAllActiveSessions()`** — same join as `getSuspiciousSessions()` but without the `isSuspicious = true` filter. Returns all rows where `logoutTime IS NULL`, ordered by `loginTime DESC`.

**`getOpenTickets()`** — queries `supportTickets` left joined with `user` on `userId`. Orders by `createdAt DESC`.

**`getFeedback(typeFilter?: string)`** — queries `feedback` left joined with `user` on `userId`. When `typeFilter` is provided, applies `eq(feedback.type, typeFilter)`. Orders by `createdAt DESC`.

---

### `src/components/AlertTray.tsx` — Server Component

Props:
```typescript
type Alert = {
  id: string;
  label: string;
  count: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  href: string;
};

type AlertTrayProps = { alerts: Alert[] };
```

Behaviour:
- Filters `alerts` to only those with `count > 0`
- Sorts by severity: critical → high → medium → low
- Each alert renders as a full-width banner with severity colour, icon, count, and a link
- When all counts are zero, renders nothing (no wrapper element)

Severity → colour mapping:
| Severity | Background | Border | Icon colour |
|----------|------------|--------|-------------|
| critical | `bg-red-950/60` | `border-red-800/60` | `text-red-400` |
| high | `bg-orange-950/60` | `border-orange-800/60` | `text-orange-400` |
| medium | `bg-yellow-950/60` | `border-yellow-800/60` | `text-yellow-400` |
| low | `bg-blue-950/60` | `border-blue-800/60` | `text-blue-400` |

---

### `src/components/MetricCard.tsx` — Server Component

Props:
```typescript
type MetricCardProps = {
  label: string;
  count: number;
  icon: React.ReactNode;
  variant: 'primary' | 'success' | 'warning' | 'danger';
  secondaryNote?: string;
};
```

Variant → colour token mapping:
| Variant | Icon bg | Icon border | Count colour |
|---------|---------|-------------|--------------|
| primary | `bg-indigo-500/10` | `border-indigo-500/20` | `text-indigo-400` |
| success | `bg-emerald-500/10` | `border-emerald-500/20` | `text-emerald-400` |
| warning | `bg-amber-500/10` | `border-amber-500/20` | `text-amber-400` |
| danger | `bg-red-500/10` | `border-red-500/20` | `text-red-400` |

---

### `src/components/DataTable.tsx` — Client Component (`'use client'`)

Props:
```typescript
type Column<T> = {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
  className?: string;
};

type DataTableProps<T> = {
  columns: Column<T>[];
  data: T[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
};
```

Behaviour:
- Reads `page` from `useSearchParams()`; defaults to `1` for absent, non-integer, or ≤ 0 values
- Page size is fixed at 50 (`PAGE_SIZE = 50` constant)
- Slices `data` client-side: `data.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)`
- Previous/Next buttons use `router.push()` with updated `page` param while preserving all other existing params via `URLSearchParams` spread
- Previous is disabled when `page === 1`; Next is disabled when `page * PAGE_SIZE >= data.length`
- Shows "Page X of Y" footer where Y = `Math.ceil(data.length / PAGE_SIZE)`

---

### `src/components/OrgDrawer.tsx` — Client Component (`'use client'`)

Props:
```typescript
type OrgDrawerProps = {
  orgId: string | null;
  onClose: () => void;
};
```

State machine:
```typescript
type DrawerState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'loaded'; data: OrgDetail }
```

Behaviour:
- Uses a `useEffect` that depends on `orgId`; at the start of each fetch resets to `{ status: 'loading' }` so re-opening a different org never flashes stale data
- **Loading state:** Renders the drawer shell immediately; inside the content area renders a skeleton — three stacked `h-4 bg-zinc-800 rounded animate-pulse` bars, a divider, and five `h-10 bg-zinc-800 rounded animate-pulse` placeholder rows
- **Error state:** If `getOrgDetail()` throws, renders an inline error inside the drawer (does not close it) with an `AlertCircle` icon, the message "Failed to load organisation details.", and a "Retry" button that re-calls `fetchOrgDetail(orgId)`
- **Loaded state:** Renders the full org metadata, member list, and invitations
- Close via Escape key listener (`useEffect`) and overlay click

The `getOrgDetail` Server Action:
```typescript
'use server'
export async function getOrgDetail(orgId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || (session.user as any).role !== 'admin') throw new Error('Unauthorized');
  // fetch org + members + invitations
}
```

---

### `src/components/StatusBadge.tsx` — Server Component

Props:
```typescript
type StatusBadgeProps = { status: string };
```

Status → colour mapping:
| Status | Bg | Text | Border |
|--------|----|------|--------|
| `open` | `bg-red-500/10` | `text-red-400` | `border-red-500/20` |
| `in_progress` | `bg-amber-500/10` | `text-amber-400` | `border-amber-500/20` |
| `closed` | `bg-emerald-500/10` | `text-emerald-400` | `border-emerald-500/20` |
| `active` | `bg-emerald-500/10` | `text-emerald-400` | `border-emerald-500/20` |
| `deleted` | `bg-red-500/10` | `text-red-400` | `border-red-500/20` |
| `suspicious` | `bg-red-500/10` | `text-red-400` | `border-red-500/20` |
| `bug` | `bg-red-500/10` | `text-red-400` | `border-red-500/20` |
| `feature` | `bg-blue-500/10` | `text-blue-400` | `border-blue-500/20` |
| `other` | `bg-zinc-800/60` | `text-zinc-400` | `border-zinc-700/40` |
| _(unknown)_ | `bg-zinc-800/60` | `text-zinc-400` | `border-zinc-700/40` |

---

## Data Models

The admin console uses the existing `@pmg/db` schema without modification. The following tables are accessed:

| Table | Pages | Key fields |
|-------|-------|------------|
| `user` | Dashboard, Users, Sessions | `id`, `name`, `email`, `emailVerified`, `plan`, `role`, `lastActiveOrganizationId`, `createdAt` |
| `session` | Sessions | `id`, `expiresAt`, `token`, `userId` |
| `account` | Users | `userId`, `providerId`, `createdAt` |
| `organization` | Dashboard, Organizations | `id`, `name`, `slug`, `logo`, `metadata`, `createdAt`, `deletedAt`, `deletionReason`, `permanentDeletionScheduledAt` |
| `member` | Organizations, Users | `organizationId`, `userId`, `role` |
| `invitation` | Dashboard (alerts), OrgDrawer | `organizationId`, `email`, `role`, `status`, `expiresAt` |
| `tender` | Dashboard | `organizationId`, `status` |
| `project` | Dashboard | `organizationId`, `status` |
| `purchaseOrder` | Organizations | `organizationId` |
| `sessionTracking` | Dashboard, Sessions | `id`, `sessionId`, `loginTime`, `lastActivity`, `logoutTime`, `ipAddress`, `deviceInfo`, `locationInfo`, `isSuspicious` |
| `securityAuditLog` | Dashboard (activity feed), write actions | `id`, `organizationId`, `userId`, `action`, `resourceType`, `resourceId`, `severity`, `createdAt` |
| `ownershipTransfer` | Dashboard (alerts) | `status`, `expiresAt` |
| `supportTickets` | Dashboard, Support Tickets | `id`, `name`, `email`, `message`, `status`, `userId`, `createdAt` |
| `feedback` | Feedback | `id`, `type`, `name`, `email`, `message`, `url`, `userId`, `createdAt` |
| `waitlist` | Dashboard (KPI count) | `id`, `createdAt` |

### Important Schema Constraints

- `securityAuditLog.organizationId` is a non-null FK with cascade-delete to `organization.id`. Platform-level admin actions (ticket status update, session revocation) have no tenant org context. **Resolution (Option A — Sentinel Org):** A platform sentinel organisation record with ID `org_platform_admin` and name `[Platform]` is inserted once via a seed script at `packages/db/scripts/seed-platform-org.ts`. All platform-level admin audit log inserts reference `PLATFORM_ORG_ID = 'org_platform_admin'` as the `organizationId`. This satisfies the NOT NULL FK constraint without any schema changes. The sentinel org record has `deletedAt` set to a past timestamp so it is permanently excluded from the Organizations page filter (which defaults to `deletedAt IS NULL`). The constant is exported from `src/lib/constants.ts` in the admin app.

---

## Page Designs

### Dashboard (`src/app/page.tsx`) — Replace

```
Page load sequence:
  1. Auth guard (redirect to /login if not admin)
  2. Promise.all([getDashboardMetrics(), getAlertCounts(), getRecentActivity(20)])
  3. Render order:
     a. Page header
     b. <AlertTray> (filters alerts with count > 0)
     c. KPI grid: 4×2 grid of <MetricCard>
     d. Tender pipeline bars (draft/submitted/won/lost/pending)
     e. Plan distribution bars (free/pro)
     f. Quick-status row: 3 panels
     g. Activity feed: last 20 security_audit_log entries
```

KPI Card definitions:
| Card | Primary count | Secondary note | Variant |
|------|--------------|----------------|---------|
| Total Users | `totalUsers` | `+${newUsersThisWeek} this week` | primary |
| Active Orgs | `activeOrgs` | `+${newOrgsThisWeek} this week` | success |
| Tenders Tracked | `totalTenders` | Pipeline breakdown link | warning |
| Active Projects | `activeProjects` | Active only | success |
| Live Sessions | `liveSessions` | `${suspiciousCount} suspicious` | warning |
| Email Verified | `${verifiedPct}%` | `${unverifiedCount} unverified` | danger (if unverified > 0) |
| Open Tickets | `openTickets` | `${inProgressTickets} in progress` | danger (if open > 0) |
| Waitlist | `waitlistTotal` | `+${newWaitlistThisWeek} this week` | primary |

Pipeline bars: `(count / totalTenders * 100).toFixed(1) + '%'` inline style on a `div` with `bg-indigo-500` etc. Zero total → all bars at 0%.

Plan bars: same calculation against `totalUsers`.

Quick-status panels (3-column grid):
- **Suspicious Sessions**: count + list of up to 5 user emails from `getSuspiciousSessions()` result + Link to `/sessions`
- **Support Tickets**: open / in_progress / closed (30-day window — computed from `getDashboardMetrics()`) + Link to `/support-tickets`
- **Ownership Transfers**: pending / accepted / expired counts

Activity feed entry: severity icon (red for critical, amber for warning, blue for info) + `userName ?? 'System'` + `action` + `formatRelativeTime(createdAt)`

---

### Organizations (`src/app/organizations/page.tsx`) — Enhance

```
Server: auth guard + getOrganizationsWithCounts()
Pass full org list to client wrapper component
Client: OrgListClient (filter + search state + DataTable)
```

`OrgListClient` is a `'use client'` wrapper that holds:
- `filter: 'active' | 'deleted' | 'all'` — default `'active'`
- `search: string` — default `''`

Filter logic:
```typescript
const filtered = orgs
  .filter(o =>
    filter === 'active' ? o.deletedAt === null :
    filter === 'deleted' ? o.deletedAt !== null : true
  )
  .filter(o =>
    search.trim() === '' ? true :
    o.name.toLowerCase().includes(search.toLowerCase())
  );
```

Table columns: Name+ID(8) | Slug | Members | Tenders | Projects | POs | Status | Purge Date | Created

Purge date cell: `permanentDeletionScheduledAt !== null && daysDiff <= 7 ? 'text-red-400' : 'text-zinc-400'`

Row click: sets `selectedOrgId` state → renders `<OrgDrawer orgId={selectedOrgId} onClose={() => setSelectedOrgId(null)} />`

---

### Users (`src/app/users/page.tsx`) — Enhance

```
Server: auth guard + getUsersWithMemberships()
Pass full user list to UserListClient
```

`UserListClient` is a `'use client'` wrapper holding:
- `planFilter: 'all' | 'free' | 'pro'`
- `roleFilter: 'all' | 'user' | 'admin'`
- `verifiedFilter: 'all' | 'verified' | 'unverified'`
- `search: string`

Combined filter uses AND:
```typescript
const filtered = users
  .filter(u => planFilter === 'all' || u.plan === planFilter)
  .filter(u => roleFilter === 'all' || u.role === roleFilter)
  .filter(u =>
    verifiedFilter === 'all' ? true :
    verifiedFilter === 'verified' ? u.emailVerified :
    !u.emailVerified
  )
  .filter(u =>
    search.trim() === '' ? true :
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );
```

New columns: Last Active Org (from `lastActiveOrgName ?? '—'`) | Provider (`providerId === 'credential' ? 'Password' : providerId ?? '—'`) | Ghost badge (shown when `isGhost === true`)

Existing InviteAdminModal is preserved.

---

### Support Tickets (`src/app/support-tickets/page.tsx`) — New

```
Server: auth guard + getOpenTickets()
Render DataTable with status dropdown per row
```

Table columns: `#${id.slice(0,8)}` | Name + Email | Message(80) | Status (StatusBadge) | Linked User | Submitted (relative)

Status dropdown per row (client island `TicketStatusSelect`):
```typescript
'use client'
// Shows only the next valid state:
// open → shows "in_progress" option
// in_progress → shows "closed" option
// closed → no dropdown (text only)
```

On selection: calls `updateTicketStatus(ticketId, newStatus)` server action with `useTransition` for optimistic loading.

`src/app/support-tickets/actions.ts`:
```typescript
'use server'
export async function updateTicketStatus(ticketId: string, newStatus: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || (session.user as any).role !== 'admin') throw new Error('Unauthorized');

  // Fetch current status
  const [ticket] = await db.select({ status: supportTickets.status })
    .from(supportTickets).where(eq(supportTickets.id, ticketId));
  if (!ticket) throw new Error('Ticket not found');

  // Validate forward-only transition
  const TRANSITIONS: Record<string, string> = { open: 'in_progress', in_progress: 'closed' };
  if (TRANSITIONS[ticket.status] !== newStatus) throw new Error('Invalid status transition');

  // Execute DB write
  await db.update(supportTickets)
    .set({ status: newStatus })
    .where(eq(supportTickets.id, ticketId));

  // Insert audit log (catch and log, do not rethrow)
  try {
    await db.insert(securityAuditLog).values({
      id: crypto.randomUUID(),
      organizationId: null, // platform-level action
      userId: session.user.id,
      action: 'admin.ticket.status_update',
      resourceType: 'support_ticket',
      resourceId: ticketId,
      severity: 'info',
      createdAt: new Date(),
    });
  } catch (err) {
    console.error('[audit-log] Failed to insert for ticket status update:', err);
  }

  revalidatePath('/support-tickets');
}
```

---

### Feedback (`src/app/feedback/page.tsx`) — New

```
Server: auth guard + getFeedback() (no filter — all types fetched)
Pass to FeedbackListClient
```

`FeedbackListClient` is `'use client'` with:
- `typeFilter: 'all' | 'bug' | 'feature' | 'other'` — default `'all'`, persisted in URL as `type` param via `useRouter` + `useSearchParams`
- Filter applied client-side on the full dataset

Table columns: Type (StatusBadge) | Name+Email | Message(80) | URL/`'—'` | Linked User/`'Anonymous'` | Submitted (relative)

Read-only — no write actions.

---

### Sessions (`src/app/sessions/page.tsx`) — New

```
Server: auth guard + read `searchParams.view`
  const showAll = searchParams?.view === 'all';
  const sessions = showAll
    ? await getAllActiveSessions()   // logoutTime IS NULL, no isSuspicious filter
    : await getSuspiciousSessions(); // isSuspicious = true AND logoutTime IS NULL
Pass single sessions array + viewMode prop to SessionsListClient
```

`SessionsListClient` is `'use client'` with:
- `sessions: SuspiciousSession[]` — server-filtered, passed as prop
- `viewMode: 'suspicious' | 'all'` — derived from URL param, passed as prop
- `revokeModalTarget: SuspiciousSession | null`

Toggle button navigates rather than setting local state:
```typescript
const params = new URLSearchParams(searchParams.toString());
if (viewMode === 'suspicious') {
  params.set('view', 'all');
  params.delete('page'); // reset pagination on view change
} else {
  params.delete('view');
  params.delete('page');
}
router.push(`/sessions?${params.toString()}`);
```

Table columns: SessionID(8) | User Email | IP (red class if `isSuspicious`) | Browser+OS (parsed from `deviceInfo` JSON) | Location (parsed from `locationInfo` JSON) | Login Time | Last Activity (relative) | Status Badge | Revoke button

IP parsing: `JSON.parse(deviceInfo)?.browser ?? '—'` + `JSON.parse(deviceInfo)?.os ?? '—'`
Location: `JSON.parse(locationInfo)?.city ?? '—'` + `JSON.parse(locationInfo)?.country ?? ''`

Revoke flow:
1. Click "Revoke" → `setRevokeModalTarget(session)`
2. Confirmation modal renders with session details
3. "Confirm Revoke" → `revokeAdminSession(sessionId)` via `useTransition`
4. On success → modal closes, page data refreshes via `router.refresh()`

`src/app/sessions/actions.ts`:
```typescript
'use server'
export async function revokeAdminSession(sessionTrackingId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || (session.user as any).role !== 'admin') throw new Error('Unauthorized');

  // Look up the Better Auth session token
  const [trackingRow] = await db.select({ sessionId: sessionTracking.sessionId })
    .from(sessionTracking).where(eq(sessionTracking.id, sessionTrackingId));
  if (!trackingRow) throw new Error('Session not found');

  const [sessionRow] = await db.select({ token: session_table.token })
    .from(session_table).where(eq(session_table.id, trackingRow.sessionId));
  if (!sessionRow) throw new Error('Session token not found');

  // Revoke via Better Auth
  await auth.api.revokeSession({ body: { token: sessionRow.token } });

  // Insert audit log (catch and log, do not rethrow)
  try {
    await db.insert(securityAuditLog).values({
      id: crypto.randomUUID(),
      organizationId: null,
      userId: session.user.id,
      action: 'admin.session.revoke',
      resourceType: 'session',
      resourceId: sessionTrackingId,
      severity: 'warning',
      createdAt: new Date(),
    });
  } catch (err) {
    console.error('[audit-log] Failed to insert for session revoke:', err);
  }

  revalidatePath('/sessions');
}
```

---

### Sidebar (`src/app/layout.tsx`) — Enhance

The sidebar nav links are extracted into a `NavMenu` client component to support `usePathname()` for active state:

```typescript
'use client'
// NavMenu.tsx
const NAV_GROUPS = [
  {
    label: 'Overview',
    items: [{ href: '/', label: 'Dashboard', icon: LayoutDashboard }],
  },
  {
    label: 'Tenants',
    items: [
      { href: '/organizations', label: 'Organizations', icon: Building2 },
      { href: '/users', label: 'Users', icon: Users },
    ],
  },
  {
    label: 'Support & Growth',
    items: [
      { href: '/support-tickets', label: 'Support Tickets', icon: LifeBuoy },
      { href: '/feedback', label: 'Feedback', icon: MessageSquare },
    ],
  },
  {
    label: 'Security',
    items: [
      { href: '/sessions', label: 'Sessions', icon: ShieldAlert },
    ],
  },
];
```

Active state: `pathname === item.href` applies `bg-[oklch(0.25_0.02_255)] text-white` class.

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

This feature is well-suited for property-based testing in its pure logic layer: path classification, status badge rendering, filter functions, pagination, status transition validation, and data transformation functions are all pure functions with large input spaces.

### Property 1: Public path classification is exhaustive and correct

*For any* URL pathname string, the `isPublicPath(pathname)` function should return `true` if and only if the pathname exactly equals `/login`, `/setup`, or `/favicon.ico`, or starts with `/api/auth`, `/_next/static`, or `/_next/image`. For all other pathnames (including those that contain these strings in non-prefix/non-exact positions), the function returns `false`.

**Validates: Requirements 1.3, 1.4, 1.5**

---

### Property 2: Unauthenticated requests to protected routes always redirect

*For any* pathname that is not a public path, and any request with an absent or empty session cookie, the proxy should produce an HTTP 307 redirect response to `/login`. The redirect URL should preserve the original pathname in a query parameter.

**Validates: Requirements 1.6**

---

### Property 3: Auth guard rejects all non-admin sessions

*For any* session object where `session.user.role !== "admin"` (including null session, expired session, or session with role `"user"`) passed to the auth guard function, the guard should trigger a redirect to `/login` and the result should not include any rendered page content or executed database queries.

**Validates: Requirements 2.2**

---

### Property 4: Server actions reject unauthorised calls without DB mutation

*For any* invocation of `updateTicketStatus` or `revokeAdminSession` where the re-verified session is absent or the role is not `"admin"`, the action should throw an authorization error and no rows in `support_tickets`, `session`, `sessionTracking`, or `securityAuditLog` should be mutated.

**Validates: Requirements 2.4, 8.3, 8.6, 10.6, 10.8**

---

### Property 5: Ticket status transitions are forward-only

*For any* pair `(currentStatus, requestedStatus)` where `requestedStatus` is not the immediate successor of `currentStatus` in the sequence `open → in_progress → closed`, the `updateTicketStatus` action should reject the transition without modifying the ticket record. Specifically: from `open` only `in_progress` is valid; from `in_progress` only `closed` is valid; from `closed` no transition is valid.

**Validates: Requirements 8.4**

---

### Property 6: Alert rendering threshold invariant

*For any* array of alert objects, `AlertTray` should render banner elements for exactly the subset of alerts where `count > 0`, in severity order (critical first, low last). Alerts with `count === 0` must produce no rendered DOM output.

**Validates: Requirements 4.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8**

---

### Property 7: StatusBadge colour mapping is consistent and exhaustive

*For any* status string from the defined set `{open, in_progress, closed, active, deleted, suspicious, bug, feature, other}`, `StatusBadge` should render a pill with a deterministic colour class. Any status string not in the defined set (unknown values) should render with the neutral grey colour class, never throwing an error.

**Validates: Requirements 4.5**

---

### Property 8: DataTable pagination invariant

*For any* dataset of N rows, `DataTable` should render at most `PAGE_SIZE` (50) rows for any given page, the total page count should equal `Math.ceil(N / PAGE_SIZE)`, and no row from the dataset should appear on more than one page.

**Validates: Requirements 4.3, 4.6, 13.1, 13.3, 13.4**

---

### Property 9: DataTable URL parameter preservation

*For any* URL query string containing arbitrary existing parameters, navigating to the next or previous page should update only the `page` parameter while all other parameters remain unchanged.

**Validates: Requirements 4.6, 13.2**

---

### Property 10: Client-side filters apply AND logic

*For any* user dataset and any combination of active filters (plan, role, verification, text search), the set of displayed users should be exactly those satisfying all active filter criteria simultaneously. No user failing any single active filter should appear in the results, and no user satisfying all active filters should be absent.

**Validates: Requirements 7.6, 7.7, 7.8, 7.9**

---

### Property 11: Ghost account detection

*For any* user in the system, if that user has zero rows in the `member` table, `getUsersWithMemberships()` should return `isGhost = true` for that user. If a user has at least one row in `member`, `isGhost` should be `false`.

**Validates: Requirements 7.2**

---

### Property 12: Suspicious session filter correctness

*For any* collection of `sessionTracking` rows with varying `isSuspicious` and `logoutTime` values, `getSuspiciousSessions()` should return exactly and only the rows where `isSuspicious = true AND logoutTime IS NULL`.

**Validates: Requirements 3.7, 10.1**

---

### Property 13: Feedback type filter correctness

*For any* collection of feedback entries and any non-null type filter string, `getFeedback(typeFilter)` should return only entries where `feedback.type === typeFilter`. When `typeFilter` is `undefined`, all entries should be returned.

**Validates: Requirements 3.9, 9.3, 9.4**

---

### Property 14: Audit log failure does not roll back primary operation

*For any* scenario where the `securityAuditLog` insert throws an error after a successful `support_tickets` status update or session revoke, the primary operation should remain committed — the ticket status or session revocation should not be reversed, and the error should be logged server-side.

**Validates: Requirements 12.3**

---

### Property 15: Purge date highlight is time-relative

*For any* organisation row with a non-null `permanentDeletionScheduledAt` value, the purge date cell should apply the red highlight class if and only if the number of days between the server render time and `permanentDeletionScheduledAt` is ≤ 7 days. For purge dates more than 7 days in the future or null, the red class must not be applied.

**Validates: Requirements 6.4**

---

## Error Handling

### Proxy Errors

The proxy is kept minimal by design. It performs no async operations. Malformed cookie values are treated as absent (the cookie presence check only inspects `cookie.value` truthiness, not its contents). Any thrown error in the proxy propagates as a 500 response — there is no graceful fallback since the proxy must not allow access on error.

### Query Errors (`admin-queries.ts`)

All query functions propagate errors to the calling page. Pages should be wrapped in an error boundary or use Next.js's `error.tsx` convention. Errors are not silently swallowed — Requirement 3.10 explicitly requires propagation.

### Server Action Errors

Two categories:

1. **Auth failures** — throw `Error('Unauthorized')`. The client receives this as an error response and should display a toast or alert.
2. **DB write failures** — bubble up to the caller. The client should handle and display an appropriate error message.
3. **Audit log failures** — caught, logged server-side with `console.error('[audit-log] ...')`, and not rethrown. The primary operation is already committed.

### Client Component Errors

`OrgDrawer` catches errors from `getOrgDetail()` and displays an inline error message rather than crashing the drawer. `TicketStatusSelect` and session revocation use `useTransition` and handle errors via local state.

### Invalid Pagination

`DataTable` clamps `page` to the valid range: non-numeric or ≤ 0 → page 1; page > total → page `totalPages`. No errors are thrown.

### JSON Parsing in Sessions Page

`deviceInfo` and `locationInfo` are JSON strings that may be malformed. The Sessions page uses a safe parse helper:
```typescript
function safeParse<T>(json: string | null, fallback: T): T {
  if (!json) return fallback;
  try { return JSON.parse(json); } catch { return fallback; }
}
```

---

## Testing Strategy

### Property-Based Testing

Property-based testing is appropriate for this feature's pure logic layer. The recommended library for TypeScript is **fast-check**.

Each property test should be configured with a minimum of **100 iterations** and annotated with a comment linking to the design property.

```typescript
// Feature: admin-console, Property 5: Ticket status transitions are forward-only
it.prop([fc.constantFrom('open', 'in_progress', 'closed'), fc.string()])(
  'rejects invalid ticket status transitions',
  async (currentStatus, requestedStatus) => {
    const TRANSITIONS: Record<string, string> = {
      open: 'in_progress',
      in_progress: 'closed',
    };
    const isValid = TRANSITIONS[currentStatus] === requestedStatus;
    // test body...
  }
);
```

Properties to implement as PBT tests:
- Property 1: `isPublicPath` pure function test
- Property 2: proxy redirect logic (pure function extracted from the handler)
- Property 5: `validateStatusTransition` pure function test
- Property 6: `AlertTray` rendering filter test
- Property 7: `StatusBadge` colour mapping test
- Property 8 & 9: `DataTable` pagination pure logic test
- Property 10: user filter function test
- Property 11: `isGhost` computation in `getUsersWithMemberships` (with mock DB)
- Property 15: purge date highlight function test

### Unit Tests (Example-Based)

Focus on specific scenarios and integration points:

- Auth guard redirect flow with mock session objects
- `getDashboardMetrics()` returns correct shape (mock DB)
- `getAlertCounts()` returns all 6 keys (mock DB)
- `updateTicketStatus` with valid admin session — verifies DB update called and audit log inserted
- `revokeAdminSession` with valid admin session — verifies `auth.api.revokeSession` called
- `DataTable` defaults to page 1 when param is absent/invalid
- StatusBadge renders correct element for each known status value
- OrgDrawer renders member list and invitations from mock data

### Integration Tests

- End-to-end proxy redirect: unauthenticated request to `/` returns 307 to `/login`
- End-to-end ticket status update: POST with admin session token → DB state changes
- Session revocation: `revokeAdminSession` with live session token terminates the session

### Accessibility

All interactive elements (dropdowns, buttons, drawer) use semantic HTML and include `aria-label` attributes. The DataTable uses a `<table>` with proper `<thead>` / `<th scope="col">` markup. Status badges use `role="status"` where appropriate. Confirmation modals trap focus.

> Note: Full WCAG compliance requires manual testing with assistive technologies and expert accessibility review.
