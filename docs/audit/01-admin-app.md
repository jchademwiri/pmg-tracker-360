# Admin App (`apps/admin`) — UI/UX Audit

**Area:** Admin Console  
**Priority:** 🔴 High  
**Est. Effort:** 2-3 days  
**Related Issues:** #4, #11, #12, #14, #15, #17, #18, #24, #26

---

## Layout & Navigation

### Current State
- Fixed 64px sidebar with branded header, nav menu, and user profile card
- Clean header bar with cluster status indicator
- Role-based layout rendering (admin vs non-admin)
- Dark theme with `zinc-950` background

### Issues Found
| # | Severity | Issue |
|---|----------|-------|
| 1 | 🔴 High | **No responsive/mobile layout** — The sidebar is fixed at `w-64` with no collapse or mobile drawer. Admins cannot use the console on tablets or phones. |
| 2 | 🟡 Medium | **Hardcoded color values** — Uses `bg-[oklch(0.16_0.02_255)]` and `bg-zinc-900` instead of CSS custom properties or Tailwind theme tokens. Inconsistent with tracker app's theming approach. |
| 3 | 🟡 Medium | **No breadcrumb navigation** — Tracker app has `DynamicBreadcrumb` but admin console lacks any breadcrumb, making deep navigation confusing. |
| 4 | 🟢 Low | **Static header** — "Live Cluster Nominal" and "Beta v1.0" are hardcoded strings with no actual health check. |

### Suggestions
- Implement a collapsible sidebar using shadcn's `Sidebar` component (already used in tracker)
- Add breadcrumb navigation for consistent UX across both apps
- Replace hardcoded colors with CSS variables or theme tokens
- Add real cluster health check or remove the static indicator

---

## Dashboard

### Current State
- 8 KPI metric cards in a 4-column grid
- Alert tray with severity-based filtering (critical → low)
- Tender pipeline visualization with horizontal bars
- Plan distribution chart
- Quick-status panels (suspicious sessions, support tickets, ownership transfers)
- Recent activity feed

### Issues Found
| # | Severity | Issue |
|---|----------|-------|
| 1 | 🟡 Medium | **No real-time updates** — Dashboard data is fetched once at page load. No polling, SSE, or WebSocket for live metrics. |
| 2 | 🟡 Medium | **`formatRelativeTime` duplicated** — This helper exists in both `page.tsx` and `SessionsListClient.tsx`. Should be extracted to a shared utility. |
| 3 | 🟡 Medium | **Inline styles for pipeline bars** — Uses `style={{ width: `${pct}%` }}` which could be abstracted into a reusable `ProgressBar` component. |
| 4 | 🟢 Low | **No dashboard refresh button** — Manual page refresh is the only way to update data. |

### Suggestions
- Add a "Refresh" button with `router.refresh()` for quick data updates
- Extract `formatRelativeTime` to `@/lib/utils`
- Create a reusable `ProgressBar` component for pipeline and plan distribution charts
- Consider adding auto-refresh via `setInterval` + `router.refresh()` for critical metrics

---

## Organizations Module

### Current State
- DataTable with columns: Organisation, Slug, Members, Tenders, Projects, POs, Status, Purge Date, Created
- Filter bar with Active/Deleted/All toggles
- Search input for name filtering
- Slide-in OrgDrawer with detail view (members, invitations, metadata)

### Issues Found
| # | Severity | Issue |
|---|----------|-------|
| 1 | 🟡 Medium | **No bulk actions** — Cannot select multiple orgs for bulk operations (e.g., bulk delete, export). |
| 2 | 🟡 Medium | **Drawer lacks action buttons** — The OrgDrawer shows details but has no action buttons (e.g., delete org, transfer ownership, impersonate). |
| 3 | 🟢 Low | **No export functionality** — Cannot export org list to CSV for reporting. |
| 4 | 🟢 Low | **Search is name-only** — Should also search by slug, member email, or org ID. |

### Suggestions
- Add action buttons to OrgDrawer (delete, impersonate, view members)
- Implement CSV export for org data
- Expand search to include slug and member names
- Add row selection for bulk operations

---

## Users Module

### Current State
- DataTable with columns: User, Verified, Plan, Role, Organisations, Last Active Org, Provider, Registered
- Three filter toggles: Plan (All/Free/Pro), Role (All/User/Admin), Verified (All/Verified/Unverified)
- Search by name or email
- InviteAdminModal for creating new admin accounts

### Issues Found
| # | Severity | Issue |
|---|----------|-------|
| 1 | 🟡 Medium | **No user detail view** — Clicking a user row does nothing. Should open a drawer or modal with user details, session history, and org memberships. |
| 2 | 🟡 Medium | **Verified badge reuse** — Uses `StatusBadge` with `active`/`deleted` statuses for verified/unverified, which is semantically confusing. |
| 3 | 🟢 Low | **No last-active timestamp** — Users table shows "Last Active Org" but not when they last logged in. |
| 4 | 🟢 Low | **No ability to ban/disable users** — Admin console lacks user suspension capabilities. |

### Suggestions
- Add a UserDetailDrawer similar to OrgDrawer
- Create a dedicated `VerifiedBadge` component with proper semantics
- Add last-login timestamp display
- Implement user suspension/ban functionality

---

## Sessions Module

### Current State
- Toggle between "Suspicious Only" and "All Active" views
- DataTable with: Session ID, User Email, IP Address, Browser/OS, Location, Login Time, Last Activity, Status, Revoke action
- Revoke confirmation modal with session details

### Issues Found
| # | Severity | Issue |
|---|----------|-------|
| 1 | 🟡 Medium | **No session details view** — Cannot see full session metadata (headers, device fingerprint, etc.) |
| 2 | 🟢 Low | **No bulk revoke** — Cannot select and revoke multiple suspicious sessions at once. |
| 3 | 🟢 Low | **No session history** — Only shows active sessions, not historical session data. |

### Suggestions
- Add expandable row or drawer for full session details
- Implement bulk revoke with multi-select
- Add session history view with date range filtering

---

## Support Tickets Module

### Current State
- DataTable with: Ticket ref, Submitter, Message, Status, Linked User, Submitted, Actions
- Status progression: open → in_progress → closed (linear workflow)
- Inline status update via `TicketStatusSelect`

### Issues Found
| # | Severity | Issue |
|---|----------|-------|
| 1 | 🟡 Medium | **No ticket detail view** — Cannot see full message or ticket history. Message is truncated to 80 chars. |
| 2 | 🟡 Medium | **No priority/severity field** — Tickets lack priority classification (urgent, high, medium, low). |
| 3 | 🟢 Low | **No response/notes system** — Admins cannot add internal notes or respond to tickets. |
| 4 | 🟢 Low | **No filtering** — No way to filter tickets by status, date range, or submitter. |

### Suggestions
- Add a TicketDetailDrawer with full message, history, and notes
- Add priority field to ticket schema and UI
- Implement internal notes/response system
- Add status and date range filters

---

## Feedback Module

### Current State
- DataTable with: Type, Submitter, Message, URL, Linked User, Submitted
- Type filter toggles: All, Bug, Feature, Other

### Issues Found
| # | Severity | Issue |
|---|----------|-------|
| 1 | 🟡 Medium | **No feedback detail view** — Same truncation issue as support tickets. |
| 2 | 🟢 Low | **No status tracking** — Feedback items have no status (new, reviewed, implemented, wontfix). |
| 3 | 🟢 Low | **No upvote/engagement metrics** — Cannot see how many users requested similar features. |

### Suggestions
- Add status field and tracking workflow
- Add a detail view for full message content
- Consider grouping similar feedback for feature request prioritization

---

## Login & Setup

### Current State
- Clean centered login form with dark background
- Magic link + OTP verification flow
- Auto-redirect to setup page if no admin exists
- Role enforcement on login

### Issues Found
| # | Severity | Issue |
|---|----------|-------|
| 1 | 🟢 Low | **No "forgot password" link** — Admin login lacks password recovery flow. |
| 2 | 🟢 Low | **No login attempt logging** — Failed login attempts are not tracked for security auditing. |

### Suggestions
- Add password recovery flow for admin accounts
- Log failed login attempts with IP and timestamp

---

## Files to Modify

- `apps/admin/src/app/layout.tsx` — Responsive sidebar, breadcrumbs
- `apps/admin/src/components/NavMenu.tsx` — Mobile nav support
- `apps/admin/src/app/page.tsx` — Dashboard refresh, shared utils
- `apps/admin/src/components/OrgDrawer.tsx` — Action buttons
- `apps/admin/src/app/users/UserListClient.tsx` — User detail drawer
- `apps/admin/src/app/sessions/SessionsListClient.tsx` — Session details
- `apps/admin/src/app/support-tickets/TicketsListClient.tsx` — Ticket detail
- `apps/admin/src/app/feedback/FeedbackListClient.tsx` — Feedback detail
