# Findings: Codebase Audit

---

## Metadata

| Field | Value |
|-------|-------|
| **Prompt** | 01-codebase-audit.md |
| **Date** | 2026-06-14 |
| **Auditor** | Buffy (AI Audit) |
| **Scope** | Full codebase audit — monorepo structure, routes, components, schema, workflows, mobile, visual |
| **Depends On** | None |

---

## Executive Summary

The PMG Tracker 360 monorepo is a Next.js 16 application with a Drizzle ORM PostgreSQL backend, using Better Auth for authentication and a shadcn/ui component library. The app covers tender management, project management, purchase orders, and client management. While the foundational architecture is solid, there are significant gaps in workflow completeness, mobile responsiveness, and UI polish that prevent it from feeling like a premium SaaS platform.

**Overall Score: 5/10**

| Area | Score | Trend |
|------|-------|-------|
| Architecture & Structure | 7/10 | → |
| Route Coverage | 6/10 | → |
| Component Quality | 5/10 | → |
| Database Schema | 6/10 | → |
| Mobile Responsiveness | 3/10 | ↓ |
| Visual Design | 4/10 | ↓ |
| Workflow Completeness | 4/10 | ↓ |

---

## Current State

### A. Monorepo Structure

```
pmg-tracker-360/
├── apps/
│   ├── tracker/          ← Main Next.js 16 app (App Router)
│   ├── admin/            ← Admin panel (separate Next.js app)
│   └── docs/             ← Documentation (Astro)
├── packages/
│   ├── db/               ← Drizzle ORM schema, migrations, scripts
│   ├── ui/               ← Shared UI components (minimal)
│   ├── eslint-config/    ← Shared ESLint config
│   └── typescript-config/← Shared TypeScript config
├── data/                 ← Import/migration data files
└── docs/                 ← Audit docs, PRDs, implementation plans
```

**Key Observations:**
- Turborepo monorepo with Bun as package manager
- `packages/ui` exists but is mostly empty — UI components live inside `apps/tracker/src/components/ui/` (shadcn/ui)
- No shared component library between apps
- Database schema in `packages/db/src/schema.ts` (single file, ~600 lines)

### B. Tracker App Routes

**Framework:** Next.js 16 with App Router, React 19, TypeScript 5.9

**Route Structure:**
```
/dashboard                          → Main dashboard (admin vs specialist view)
/tenders                            → Tender register/list
/tenders/overview                   → Tender pipeline overview
/tenders/create                     → Add new tender
/tenders/[id]                       → Tender detail page
/tenders/[id]/edit                  → Edit tender
/projects                           → Project register/list
/projects/overview                  → Project overview
/projects/create                    → Create project
/projects/[id]                      → Project detail page
/projects/[id]/edit                 → Edit project
/projects/contracts                 → Contracts page
/projects/purchase-orders           → PO register/list
/projects/purchase-orders/create    → Create PO
/projects/purchase-orders/[id]      → PO detail page
/projects/purchase-orders/[id]/edit → Edit PO
/clients                            → Client directory
/clients/create                     → Create client
/clients/[id]                       → Client detail
/clients/[id]/edit                  → Edit client
/calendar                           → Calendar view
/reports                            → Reports page
/settings                           → Settings overview
/settings/profile                   → User profile
/settings/notifications             → Notification preferences
/organization/[slug]                → Organization management
/billing                            → Billing page
```

**Dashboard Views:**
- `AdminView` — shown to owner/admin/manager roles
- `SpecialistView` — shown to member role
- Role determined via `validateSessionAndOrg()` server function

**Dashboard Components:**
- `DashboardMetrics` — KPI cards (tender stats, project stats, client count)
- `DashboardCharts` — Tender status distribution, monthly trends
- `DashboardDeadlines` — Upcoming tender deadlines (30 days)
- `DashboardBriefings` — Upcoming briefing sessions
- `DashboardActivity` — Recent activity feed
- `MiniCalendarWidget` — Calendar with tender submissions and PO deliveries
- `ClosingSoonWidget` — Tenders closing soon

### C. Navigation Audit

**Sidebar Structure (app-sidebar.tsx):**
```
[TeamSwitcher — Organization selector]
── Overview
   ├── Dashboard
   ├── Calendar
   └── Reports
── Procurement Cycle
   ├── Clients Directory
   ├── Tender Pipeline
   │   ├── Overview
   │   └── Tender Register
   └── Project Tracking
       ├── Overview
       ├── Active Projects
       └── Purchase Orders (hidden for 'member' role)
[NavUser — User menu]
```

**Issues:**
- Navigation is flat — no nested sub-routes for tenders or projects
- "Procurement Cycle" label is confusing for non-procurement users
- No quick actions in navigation (e.g., "Add Tender")
- No badge counts on navigation items (e.g., "Closing Soon (3)")
- Mobile navigation relies on collapsible sidebar — not optimal
- No command palette / keyboard shortcuts for power users

### D. Component Audit

**UI Component Library (shadcn/ui):**
- Full set: Button, Card, Dialog, Dropdown, Tabs, Table, Badge, Alert, Avatar, Checkbox, Input, Label, Select, Switch, Textarea, Tooltip, Sheet, Skeleton, Progress, ScrollArea, Separator, Breadcrumb, Collapsible, HoverCard, RadioGroup, Sonner (toasts)
- Custom additions: MetricCard, ErrorState, LoadingSpinner, LoadingCard, OptimizedImage, FileUploader, ConfirmationDialog, EnhancedSkeleton variants

**Domain Components:**

| Category | Components | Quality |
|----------|-----------|---------|
| Dashboard | AdminView, SpecialistView, DashboardMetrics, DashboardCharts, DashboardDeadlines, DashboardBriefings, DashboardActivity, MiniCalendarWidget, ClosingSoonWidget, ActivityTimeline, UpcomingDeadlines | Good coverage but visual polish needed |
| Tenders | TendersTable, TenderForm, TenderDetails, TenderSearchFilters, PipelineFunnel, ClosingSoonWidget, ExtensionForm, ExtensionList, TenderToProjectDialog, UpcomingDeadlines, RecentActivity | Solid but form is complex |
| Projects | ProjectList, ProjectForm, ProjectCreateDialog | Basic — needs enhancement |
| Purchase Orders | POList, PODetails, POForm | Basic — delivery tracking minimal |
| Clients | ClientList, ClientForm, ClientDetails, ClientCreateDialog | Clean implementation |
| Navigation | AppSidebar, NavMain, NavUser, NavProjects, TeamSwitcher, Header, NavLinks, DynamicBreadcrumb | Good structure, needs polish |
| Shared | SearchAndFilters, BulkActionsToolbar, DocumentManager, HelpWidget, NotificationBell | Functional but inconsistent |

**Component Issues:**
- No unified empty state component across all registers
- Loading states inconsistent (some use Skeleton, some use custom loaders)
- No consistent error boundary per section
- Document upload shows "currently unavailable" in multiple places
- No mobile-specific component variants

### E. Database Schema Audit

**Tables (14 business tables):**

| Table | Fields | Status Coverage | Notes |
|-------|--------|----------------|-------|
| `tender` | 20 fields | open, closed, evaluation, awarded, lost, cancelled | Good coverage but missing: follow-up tracking, internal priority, risk level |
| `project` | 12 fields | active, completed, cancelled | Missing: progress percentage, phase tracking |
| `purchaseOrder` | 14 fields | open, sent, delivered | Very limited — missing: draft, partially_delivered, completed, cancelled, disputed |
| `purchaseOrderLineItem` | 6 fields | — | Basic line items |
| `purchaseOrderDeliveryNote` | 8 fields | received, verified, disputed | Good structure |
| `purchaseOrderDeliveryItem` | 4 fields | — | quantityDelivered field exists |
| `client` | 9 fields | — | Good with contact embedding |
| `tenderExtension` | 10 fields | — | Well structured |
| `document` | 11 fields | — | Polymorphic (tender/project/PO/extension) |

**Schema Gaps:**
- No `tenderFollowUp` table — follow-ups are not tracked in DB
- No `activityLog` table — only `securityAuditLog` exists
- No `tenderResult` / `tenderAward` table — results tracked via status only
- No priority/risk fields on tenders
- No internal notes/comments table for tenders or projects
- PO status enum is too limited (open/sent/delivered)
- No budget tracking fields on projects

### F. Business Logic and Workflow Audit

**Tender Flow:**
1. ✅ Create tender — `TenderForm` with validation
2. ✅ Edit tender — `TenderForm` in edit mode
3. ✅ Update status — `updateTenderStatus()` server function
4. ✅ Record extensions — `ExtensionForm` + `tenderExtension` table
5. ✅ Convert to project — `TenderToProjectDialog` + `autoCreateProjectForTender()`
6. ⚠️ Follow-ups — UI exists but no DB tracking
7. ❌ Results recording — status-only, no detailed outcome capture
8. ❌ Internal preparation tracking — not implemented

**Project Flow:**
1. ✅ Create project — `ProjectForm` + `ProjectCreateDialog`
2. ✅ Auto-create from tender — linked via `tenderId`
3. ✅ Edit project — `ProjectForm` in edit mode
4. ⚠️ PO management — basic CRUD exists
5. ❌ Delivery tracking — delivery notes exist but partial delivery UX is minimal
6. ❌ Project completion workflow — no formal close-out process

**PO Flow:**
1. ✅ Create PO — `POForm` with line items
2. ✅ Edit PO — `POForm` in edit mode
3. ⚠️ Delivery notes — `purchaseOrderDeliveryNote` table exists
4. ❌ Partial delivery recording — schema supports it but UI doesn't
5. ❌ PO completion — no workflow
6. ❌ Invoice tracking — not implemented

**Server Functions:**
- `getTenderStats()` — Aggregate tender statistics
- `getProjectStats()` — Aggregate project statistics
- `autoCloseExpiredTenders()` — Auto-close expired tenders
- `autoCreateProjectForTender()` — Auto-create project on award
- `getUpcomingDeadlines()` — 30-day deadline queries
- `getUpcomingBriefings()` — Briefing session queries
- `getRecentActivity()` — Activity feed (tender-focused only)

### G. Mobile Responsiveness Audit

**Current State:**
- Sidebar collapses to icon mode on mobile (via shadcn Sidebar)
- Tables are not responsive — horizontal scroll on mobile
- No mobile card views for registers
- Forms are desktop-first — not optimised for mobile
- Detail pages use sidebar layout that doesn't stack well on mobile
- No bottom navigation for mobile
- No touch gestures or swipe actions
- Calendar widget is desktop-sized

**Critical Mobile Issues:**
- Tender register table overflows on mobile
- Project register table overflows on mobile
- PO register table overflows on mobile
- Tender detail page sidebar doesn't stack
- Forms have too many fields per row on mobile
- No mobile-optimised action buttons (FAB)
- Filter/search drawers don't exist for mobile

### H. Visual Design Audit

**Current Quality:**
- Uses Tailwind CSS 4 with shadcn/ui components
- Theme system exists (ThemeProvider with next-themes)
- Dark mode support via ThemeSwitcher
- Lucide icons used throughout
- Recharts for data visualisation
- Sonner for toast notifications

**Visual Issues:**
- Inconsistent card styling — some use `Card`, some use raw `div`
- Status badges lack consistent colour mapping
- No premium feel — looks like a standard admin template
- Typography hierarchy is flat — headings lack distinction
- Spacing is inconsistent between sections
- Empty states are basic text — no illustrations
- Loading states vary between components
- No brand colour system — relies on shadcn defaults
- No gradient or depth effects
- Button hierarchy is unclear (multiple outline buttons)

---

## Findings

### Critical Issues

| # | Issue | Location | Impact | Effort |
|---|-------|----------|--------|--------|
| C1 | Document upload is disabled ("currently unavailable") across tender and project forms | `tender-form.tsx:784`, `tender-details.tsx:682` | Users cannot attach supporting documents — core workflow broken | M |
| C2 | No tender follow-up tracking in database — UI exists but data is not persisted | No `tenderFollowUp` table | Follow-ups are lost on page refresh — operational data loss | M |
| C3 | PO status enum is too limited (open/sent/delivered) — no draft, partially delivered, completed, or cancelled states | `schema.ts` purchaseOrder.status | Cannot accurately track PO lifecycle — misleading status display | S |

### Major Issues

| # | Issue | Location | Impact | Effort |
|---|-------|----------|--------|--------|
| M1 | Tender register table has no mobile card view — overflows on small screens | `tenders-table.tsx` | Mobile users cannot browse tenders | M |
| M2 | No activity log table — only security audit log exists | `schema.ts` | Cannot show comprehensive activity timeline | M |
| M3 | Dashboard has no role-based KPI customisation — admin and specialist views are hardcoded | `dashboard/page.tsx` | Different user types see same information density | L |
| M4 | No command palette / keyboard shortcuts for power users | — | Power users cannot navigate efficiently | L |
| M5 | Tender detail page uses sidebar layout that doesn't stack on mobile | `tender-details.tsx:517` | Mobile detail pages are unusable | M |
| M6 | No partial delivery recording UI — schema supports it but UI doesn't | `po-details.tsx` | Cannot track partial deliveries operationally | M |
| M7 | Navigation has no badge counts or urgency indicators | `app-sidebar.tsx` | Users miss deadlines and urgent items | S |
| M8 | Search and filters are inconsistent across registers | `tenders-search-filters.tsx` vs others | Confusing UX — users learn one pattern, encounter another | M |

### Minor Issues

| # | Issue | Location | Impact | Effort |
|---|-------|----------|--------|--------|
| m1 | Loading states are inconsistent — mix of Skeleton, LoadingSpinner, and custom variants | Various | Feels unpolished | S |
| m2 | Empty states are basic text — no illustrations or helpful CTAs | `no-results.tsx`, `empty-search-results.tsx` | Feels incomplete | S |
| m3 | Status badge colours are not consistently mapped across components | Various | Confusing status interpretation | S |
| m4 | Typography hierarchy is flat — h1/h2/h3 lack visual distinction | Global | Poor information hierarchy | S |
| m5 | No gradient or depth effects on cards — flat design feels dated | Global | Not premium SaaS feel | S |
| m6 | Calendar widget is desktop-sized — doesn't adapt to mobile | `mini-calendar-widget.tsx` | Calendar unusable on mobile | S |
| m7 | "Procurement Cycle" navigation label is confusing | `app-sidebar.tsx` | Non-procurement users confused | S |
| m8 | No breadcrumbs on some deep routes | Various | Navigation confusion | S |

---

## Recommendations

### Quick Wins (1-2 days)

1. **Fix document upload availability**
   - What: Re-enable document upload in tender and project forms — the schema and server functions exist
   - Where: `tender-form.tsx`, `tender-details.tsx`, `document-manager.tsx`
   - Expected outcome: Users can attach supporting documents immediately

2. **Add status badge colour system**
   - What: Create a unified `StatusBadge` component with consistent colour mapping for tender/project/PO statuses
   - Where: New component `components/shared/status-badge.tsx`, update all registers
   - Expected outcome: Consistent visual language across the app

3. **Add badge counts to navigation**
   - What: Show "Closing Soon (3)" and "Overdue (2)" counts on navigation items
   - Where: `app-sidebar.tsx`, `nav-main.tsx`
   - Expected outcome: Users see urgency without navigating to each section

### Short-Term (1-2 weeks)

1. **Implement mobile card views for all registers**
   - What: Create responsive card components that replace tables on mobile
   - Where: New components for tender, project, PO, and client registers
   - Expected outcome: Full mobile usability for all list views

2. **Add tender follow-up tracking to database**
   - What: Create `tenderFollowUp` table and wire up the existing UI
   - Where: `schema.ts`, new migration, `tender-details.tsx`
   - Expected outcome: Follow-up data persists across sessions

3. **Expand PO status enum**
   - What: Add draft, partially_delivered, completed, cancelled, disputed statuses
   - Where: `schema.ts`, migration, `po-form.tsx`, `po-details.tsx`
   - Expected outcome: Accurate PO lifecycle tracking

### Medium-Term (1-3 months)

1. **Build activity log system**
   - What: Create `activityLog` table and populate it from all CRUD operations
   - Where: `schema.ts`, new migration, all server functions
   - Expected outcome: Comprehensive activity timeline across all entities

2. **Implement command palette**
   - What: Add Cmd+K command palette for quick navigation and actions
   - Where: New component `components/command-palette.tsx`
   - Expected outcome: Power users can navigate 10x faster

3. **Redesign dashboard with role-based KPIs**
   - What: Customise dashboard layout based on user role and preferences
   - Where: `dashboard/page.tsx`, new role-based dashboard components
   - Expected outcome: Each user type sees immediately relevant information

---

## Component Inventory

| Component | Current State | Recommended State | Priority |
|-----------|--------------|-------------------|----------|
| StatusBadge | Non-existent — inline spans with inconsistent colours | Unified component with colour mapping per entity type | P0 |
| EmptyState | Basic text in some registers | Illustrated empty states with CTAs | P1 |
| MobileCard | Non-existent | Responsive card for each register type | P1 |
| CommandPalette | Non-existent | Cmd+K quick navigation | P2 |
| ActivityTimeline | Partial (tender-only) | Full activity log across all entities | P1 |
| DeliveryTracker | Schema exists, no UI | Full partial delivery recording UI | P1 |
| DocumentUpload | Disabled ("currently unavailable") | Re-enabled with drag-and-drop | P0 |

---

## Cross-References

### Dependencies (findings this prompt consumed)

| Prompt | Key Finding Used |
|--------|------------------|
| — | First prompt — no dependencies |

### Outputs (findings to pass forward)

| Prompt | Key Finding to Consume |
|--------|------------------------|
| 02-dashboard-audit | Dashboard has role-based views but KPIs are not customised; metrics component exists |
| 03-tender-management | Tender register table, form, details, pipeline, extensions all exist; follow-ups not in DB |
| 04-project-management | Project CRUD exists but basic; PO management limited by status enum |
| 05-workflow | Tender-to-project conversion works via autoCreateProjectForTender; missing intermediate steps |
| 06-mobile-ux | All registers are table-only; no mobile card views; detail pages don't stack |
| 07-premium-ui | Component library is shadcn/ui; no custom design system; visual polish needed |
| 08-navigation | Sidebar structure is flat; no badge counts; no command palette |
| 09-forms-data-capture | TenderForm is complex but functional; POForm basic; document upload disabled |

---

## Implementation Notes

### Affected Files

```
apps/tracker/src/components/tenders/tender-form.tsx
apps/tracker/src/components/tenders/tender-details.tsx
apps/tracker/src/components/tenders/tenders-table.tsx
apps/tracker/src/components/projects/project-list.tsx
apps/tracker/src/components/projects/project-form.tsx
apps/tracker/src/components/purchase-orders/po-list.tsx
apps/tracker/src/components/purchase-orders/po-details.tsx
apps/tracker/src/components/purchase-orders/po-form.tsx
apps/tracker/src/components/shared/navigation/app-sidebar.tsx
apps/tracker/src/components/shared/navigation/nav-main.tsx
apps/tracker/src/components/dashboard/admin-view.tsx
apps/tracker/src/components/dashboard/specialist-view.tsx
packages/db/src/schema.ts
```

### New Files Required

```
components/shared/status-badge.tsx
components/shared/empty-state-illustrated.tsx
components/shared/mobile-card-view.tsx
components/command-palette.tsx
components/dashboard/role-based-dashboard.tsx
```

### Database Changes

- [ ] Create `tender_follow_up` table
- [ ] Create `activity_log` table
- [ ] Expand `purchase_order.status` enum values
- [ ] Add priority/risk fields to tender table

### API Changes

- [ ] Add `getActivityLog()` server function
- [ ] Add `getTenderFollowUps()` server function
- [ ] Update `getTenderStats()` to include follow-up counts

---

## Open Questions

- [ ] Should the admin app also be improved, or focus solely on tracker?
- [ ] Is there a brand colour palette defined, or should we propose one?
- [ ] What is the target mobile usage percentage?
- [ ] Should we implement offline support for mobile users?
- [ ] Are there any third-party integrations planned (e.g., email, accounting)?

---

## Appendix

### File Counts

| Category | Count |
|----------|-------|
| TSX components | 241 |
| TypeScript files | ~50 |
| Database tables | 14 business + 8 auth/system |
| Server functions | ~15 |
| Route pages | ~30 |

### Technology Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| UI | React 19, shadcn/ui, Tailwind CSS 4 |
| Database | PostgreSQL, Drizzle ORM |
| Auth | Better Auth |
| State | Server Components + React hooks |
| Charts | Recharts |
| Icons | Lucide React |
| Notifications | Sonner (toasts), custom notification bell |
| Email | Resend |
| Storage | AWS S3 |
| Testing | Jest, Playwright |

### Research Sources

- Codebase analysis of all 241 TSX files
- Database schema inspection (packages/db/src/schema.ts)
- Server function analysis (apps/tracker/src/server/)
- Navigation structure analysis (dashboad-links.ts, app-sidebar.tsx)
- Dashboard component analysis (admin-view.tsx, specialist-view.tsx)
