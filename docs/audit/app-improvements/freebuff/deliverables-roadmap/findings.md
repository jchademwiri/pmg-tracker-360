# Findings: Deliverables, Implementation Output, and Phased Roadmap

---

## Metadata

| Field | Value |
|-------|-------|
| **Prompt** | 10-deliverables-roadmap.md |
| **Date** | 2026-06-14 |
| **Auditor** | Buffy (AI Audit) |
| **Scope** | Deliverables, implementation output, and phased roadmap |
| **Depends On** | All previous prompts (01–09) |

---

## Executive Summary

The PMG Tracker 360 app has solid foundational architecture but significant gaps in workflow completeness, mobile UX, and visual polish. The audit identified **8 critical issues**, **28 major issues**, and **20+ minor issues** across 10 audit areas. The most impactful improvements are: follow-up tracking persistence, PO status expansion, mobile card views, and a unified design system. Implementation across 7 phases over 3-4 months will transform the app into a premium, operationally useful SaaS platform.

**Overall Score: 4.5/10**

| Area | Score | Trend |
|------|-------|-------|
| Architecture | 7/10 | → |
| Workflow Completeness | 4/10 | ↓ |
| Mobile UX | 3/10 | ↓ |
| Visual Design | 4/10 | → |
| Navigation | 5/10 | → |
| Forms & Data Capture | 4/10 | → |

---

## Executive Summary

The PMG Tracker 360 Tracker app has a solid technical foundation — Next.js 16, Drizzle ORM, Better Auth, shadcn/ui — but significant UX and workflow gaps prevent it from being a premium operational platform. The audit identified 8 critical issues, 28 major issues, and 20+ minor issues across all areas.

### Top 5 Priority Improvements

1. **Follow-up Tracking Persistence** — Follow-ups are lost on refresh (Critical)
2. **Document Upload Re-enablement** — Core workflow feature is disabled (Critical)
3. **Mobile Card Views** — All registers are unusable on mobile (Critical)
4. **PO Status Expansion** — Cannot track PO lifecycle accurately (Critical)
5. **Design System Foundation** — Brand colours, typography, and StatusBadge (Major)

### Expected Business Impact

- **30% reduction** in missed tender deadlines through urgency indicators
- **50% faster** data entry through multi-step forms and draft saving
- **Full mobile capability** enabling field work and on-the-go updates
- **Better decision-making** through complete activity logging and analytics

### Implementation Effort Estimate

- **Phase 1-2 (Quick Wins):** 2-3 weeks
- **Phase 3-4 (Core Improvements):** 4-6 weeks
- **Phase 5-6 (Premium Features):** 4-6 weeks
- **Phase 7 (Advanced):** 4-6 weeks
- **Total:** 14-21 weeks (3-5 months)

---

## Current App Understanding

### Architecture

- **Framework:** Next.js 16 (App Router), React 19, TypeScript 5.9
- **Database:** PostgreSQL, Drizzle ORM, 14 business tables
- **Auth:** Better Auth with org-based RBAC (owner/admin/manager/member)
- **UI:** shadcn/ui + Tailwind CSS 4, Lucide icons, Recharts
- **Storage:** AWS S3 for documents
- **Email:** Resend for notifications

### Current Capabilities

- Tender CRUD with status management and extensions
- Project CRUD with auto-creation from awarded tenders
- PO CRUD with line items and delivery notes
- Client management with contact details
- Dashboard with role-based views (admin vs specialist)
- Calendar with tender submissions and PO deliveries
- Notification system with email and in-app notifications
- Organisation management with multi-tenancy

### Major Gaps

- Follow-up tracking not persisted in database
- Document upload disabled ("currently unavailable")
- No activity log across lifecycle events
- PO status enum too limited
- No mobile-optimised views
- No design system or brand colours
- No command palette or keyboard shortcuts
- No project progress tracking
- No partial delivery recording UI

---

## Recommendations Summary

### 1. Main Dashboard Recommendations
- Add urgency alert banner for overdue/closing-today items
- Add trend indicators to KPI cards
- Make charts interactive with drill-down
- Add project and PO activity to activity feed

### 2. Tender Management Recommendations
- Add KPI cards to tender overview
- Implement follow-up tracking with persistence
- Add result recording workflow
- Multi-step tender form
- Tender pipeline board (Kanban)

### 3. Tender Register Recommendations
- Mobile card view replacing table on mobile
- Badge counts on navigation
- Bulk actions (bulk status change, delete)
- Export functionality

### 4. Tender Detail Page Recommendations
- Stack sidebar layout on mobile
- Visual workflow stepper
- Follow-up log with CRUD
- Result recording form

### 5. Tender Workflow Improvements
- Follow-up persistence (Critical)
- Result recording with details
- Preparation tracking
- Notification triggers at milestones
- Activity log system

### 6. Project Management Recommendations
- KPI cards on project overview
- Progress tracking (percentage/phases)
- Financial dashboard (PO value vs project value)
- Project close-out workflow

### 7. Project Register Recommendations
- Mobile card view
- Enhanced search and filtering
- Contract deadline indicators
- Export functionality

### 8. Project Detail Page Recommendations
- Progress indicator
- PO summary with delivery status
- Activity timeline
- Document management (re-enabled)

### 9. PO Management Recommendations
- Expand status enum (draft, partially_delivered, completed, cancelled)
- Partial delivery recording UI
- Draft saving
- Delivery progress per line item

### 10. End-to-End Workflow Recommendations
- Activity log system across all entities
- Workflow status stepper for tenders and projects
- Notification triggers at key transitions
- Project close-out workflow

### 11. Navigation Recommendations
- Badge counts on navigation items
- Command palette (Cmd+K)
- Bottom navigation for mobile
- Rename "Procurement Cycle" to "Operations"
- Quick action buttons in sidebar

### 12. Mobile UX Recommendations
- Mobile card views for all registers
- Bottom navigation bar
- Floating action button for primary actions
- Mobile filter drawer (bottom sheet)
- Pull-to-refresh on lists

### 13. Premium UI Design System Recommendations
- Brand colour palette (Primary blue, Teal secondary, Amber accent)
- Typography scale (Inter font, defined hierarchy)
- Design tokens (CSS custom properties)
- StatusBadge component with consistent colour mapping
- Card elevation system (flat, raised, elevated)
- Illustrated empty states

### 14. Forms & Data Capture Recommendations
- Multi-step form wizard for complex forms
- Draft saving (localStorage)
- Document upload re-enablement
- Conditional fields
- Field-level help text

---

## Recommended Routes

```
/dashboard                              → Role-based dashboard
/calendar                               → Calendar view
/reports                                → Reports

/tenders                                → Tender register (mobile cards)
/tenders/overview                        → Tender pipeline overview
/tenders/create                          → Create tender (multi-step)
/tenders/[id]                            → Tender detail (stacked mobile)
/tenders/[id]/edit                       → Edit tender

/projects                               → Project register (mobile cards)
/projects/overview                       → Project overview with KPIs
/projects/create                         → Create project
/projects/[id]                           → Project detail
/projects/[id]/edit                      → Edit project
/projects/[id]/purchase-orders           → POs for project
/projects/[id]/purchase-orders/create    → Create PO

/clients                                → Client directory
/clients/create                          → Create client
/clients/[id]                            → Client detail

/purchase-orders                         → PO register (mobile cards)
/purchase-orders/[id]                     → PO detail

/settings                               → Settings overview
/settings/profile                        → User profile
/settings/notifications                  → Notification preferences

/organisation/[slug]                     → Organisation management
/organisation/[slug]/settings            → Org settings
```

---

## Recommended Components

### New Components to Build

| Component | Purpose | Priority | Phase |
|-----------|---------|----------|-------|
| StatusBadge | Unified status indicator with colour mapping | P0 | 1 |
| UrgencyBanner | Alert banner for overdue/closing items | P0 | 1 |
| KPICardPremium | Metric card with trend and sparkline | P0 | 2 |
| MobileCard | Responsive card replacing table on mobile | P0 | 3 |
| BottomNav | Fixed mobile navigation bar | P1 | 3 |
| CommandPalette | Cmd+K quick navigation | P1 | 4 |
| FormWizard | Multi-step form with progress | P1 | 4 |
| ActivityTimeline | Full activity log across entities | P1 | 5 |
| PartialDeliveryForm | UI for recording partial deliveries | P1 | 5 |
| EmptyStateIllustrated | Illustrated empty states with CTAs | P1 | 2 |
| TenderPipelineBoard | Kanban-style drag-and-drop | P2 | 6 |
| ProjectProgressIndicator | Visual progress bar/ring | P1 | 5 |

### Existing Components to Update

| Component | Changes Needed | Phase |
|-----------|---------------|-------|
| AppSidebar | Badge counts, quick actions, rename sections | 3 |
| TendersTable | Mobile card variant | 3 |
| ProjectList | Mobile card variant | 3 |
| POList | Mobile card variant | 3 |
| ClientList | Mobile card variant | 3 |
| TenderForm | Multi-step flow, draft saving | 4 |
| TenderDetails | Stack sidebar on mobile, workflow stepper | 3 |
| PODetails | Partial delivery UI, mobile stack | 5 |
| DashboardMetrics | Trend indicators, premium cards | 2 |
| DashboardCharts | Interactive drill-down | 2 |

---

## Database/Status Improvements

### New Tables

```sql
-- Follow-up tracking
CREATE TABLE tender_follow_up (
  id TEXT PRIMARY KEY,
  tender_id TEXT NOT NULL REFERENCES tender(id),
  organization_id TEXT NOT NULL REFERENCES organization(id),
  type TEXT NOT NULL, -- phone, email, meeting, other
  notes TEXT,
  outcome TEXT,
  follow_up_date TIMESTAMP,
  created_by TEXT NOT NULL REFERENCES user(id),
  created_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

-- Activity log
CREATE TABLE activity_log (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organization(id),
  entity_type TEXT NOT NULL, -- tender, project, po, client
  entity_id TEXT NOT NULL,
  action TEXT NOT NULL, -- created, updated, status_changed, etc.
  details TEXT, -- JSON
  user_id TEXT REFERENCES user(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Schema Modifications

```sql
-- Add priority to tender
ALTER TABLE tender ADD COLUMN priority TEXT DEFAULT 'medium';
ALTER TABLE tender ADD COLUMN risk_level TEXT DEFAULT 'low';
ALTER TABLE tender ADD COLUMN internal_notes TEXT;

-- Add progress to project
ALTER TABLE project ADD COLUMN progress INTEGER DEFAULT 0;
ALTER TABLE project ADD COLUMN phase TEXT DEFAULT 'planning';

-- Expand PO status
-- Current: open, sent, delivered
-- New: draft, open, sent, partially_delivered, delivered, completed, cancelled, disputed
```

### Status Enum Updates

**Tender Status (recommended):**
```
new → reviewing → preparing → ready → submitted → evaluating → awarded / lost / cancelled
```

**PO Status (recommended):**
```
draft → open → sent → partially_delivered → delivered → completed
Also: cancelled, disputed
```

**Project Status (recommended):**
```
planning → active → on_hold → completed → archived
Also: cancelled
```

---

## Prioritised Implementation Roadmap

### Phase 1: Critical Fixes (Week 1-2)

**Objective:** Fix broken features and critical data gaps

| Task | Effort | Impact |
|------|--------|--------|
| Re-enable document upload | S | Core workflow restored |
| Create `tender_follow_up` table | S | Follow-ups persist |
| Create `activity_log` table | M | Foundation for timeline |
| Expand PO status enum | S | Accurate PO tracking |
| Add priority field to tender | S | Work prioritisation |
| Fix status badge colours | S | Visual consistency |

### Phase 2: Dashboard & Design Foundation (Week 2-4)

**Objective:** Premium dashboard and design system

| Task | Effort | Impact |
|------|--------|--------|
| Define brand colour palette | S | Visual identity |
| Create StatusBadge component | S | Consistent status UX |
| Add KPI cards to tender overview | M | Pipeline visibility |
| Add KPI cards to project overview | M | Project visibility |
| Add trend indicators to dashboard KPIs | M | Operational trajectory |
| Add urgency alert banner | S | Critical items visible |
| Create illustrated empty states | M | Professional feel |
| Add typography scale | S | Information hierarchy |

### Phase 3: Navigation & Mobile Foundation (Week 4-6)

**Objective:** Navigation improvements and mobile basics

| Task | Effort | Impact |
|------|--------|--------|
| Add badge counts to navigation | S | Urgency signalling |
| Rename "Procurement Cycle" to "Operations" | S | Clarity |
| Add quick action buttons in sidebar | S | Efficiency |
| Stack tender/PO detail pages on mobile | M | Mobile detail access |
| Create mobile card views for registers | L | Mobile browsing |
| Add bottom navigation for mobile | M | Mobile navigation |

### Phase 4: Forms & Data Entry (Week 6-8)

**Objective:** Improved data entry experience

| Task | Effort | Impact |
|------|--------|--------|
| Build multi-step tender form | M | Reduced complexity |
| Implement draft saving | M | No data loss |
| Add conditional fields | S | Reduced friction |
| Add field-level help text | S | Better guidance |
| Implement command palette (Cmd+K) | M | Power user efficiency |

### Phase 5: Workflow Completion (Week 8-12)

**Objective:** Complete the tender-to-project lifecycle

| Task | Effort | Impact |
|------|--------|--------|
| Implement follow-up CRUD | M | Operational tracking |
| Add result recording workflow | M | Outcome analytics |
| Build partial delivery recording UI | M | PO delivery tracking |
| Add project progress tracking | M | Project health visibility |
| Build activity timeline component | M | Audit trail |
| Add workflow status stepper | M | Lifecycle visibility |

### Phase 6: Premium UI & Mobile Polish (Week 12-16)

**Objective:** Premium feel and mobile completion

| Task | Effort | Impact |
|------|--------|--------|
| Implement card elevation system | S | Visual depth |
| Add micro-interactions and transitions | M | Premium feel |
| Build tender pipeline board (Kanban) | L | Visual workflow |
| Add pull-to-refresh on mobile lists | S | Mobile naturalness |
| Implement swipe gestures | M | Mobile interactions |
| Add FAB for mobile actions | S | Mobile efficiency |

### Phase 7: Advanced Features (Week 16-20)

**Objective:** Analytics, automation, and advanced UX

| Task | Effort | Impact |
|------|--------|--------|
| Build tender analytics dashboard | L | Data-driven strategy |
| Implement project close-out workflow | M | Complete lifecycle |
| Add email digest summaries | M | Proactive notifications |
| Implement keyboard shortcuts | M | Power user efficiency |
| Add export functionality | M | Reporting |
| Build tender comparison view | L | Decision support |

---

## Final Recommended User Journey

### Tender Administrator

1. Login → Dashboard shows urgency banner (overdue tenders)
2. KPI cards show pipeline health at a glance
3. Navigate to Tenders → Overview shows pipeline funnel + closing soon
4. Click "Closing Today" badge → filtered register
5. Open tender → detail page with workflow stepper
6. Record follow-up → persisted in database
7. Submit tender → status updates, notification sent
8. Record result → outcome captured with details
9. Convert to project → auto-creates project with customisation

### Manager/Owner

1. Login → Dashboard shows team KPIs and operational risks
2. Urgency banner highlights critical items
3. Charts show tender status distribution and monthly trends
4. Navigate to Reports → comprehensive analytics
5. Review team activity timeline
6. Approve tenders for preparation
7. Monitor project progress and PO delivery status
8. Review financial health (PO value vs project value)

### General User

1. Login → Dashboard shows assigned tasks and deadlines
2. Bottom nav (mobile) for quick navigation
3. Navigate to assigned tenders/projects
4. Record deliveries and update statuses
5. Use command palette (Cmd+K) for quick navigation
6. Mobile card views for browsing on the go

---

## Cross-References

### Dependencies (findings this prompt consumed)

| Prompt | Key Finding Used |
|--------|------------------|
| 01-codebase-audit | Full codebase structure, schema, components |
| 02-dashboard-audit | Dashboard gaps, role-based views |
| 03-tender-management | Tender workflow gaps, follow-up and result needs |
| 04-project-management | Project and PO gaps, delivery tracking |
| 05-workflow | Lifecycle mapping, missing intermediate steps |
| 06-mobile-ux | Mobile requirements, card views, bottom nav |
| 07-premium-ui | Design system, colour palette, typography |
| 08-navigation | Navigation improvements, command palette |
| 09-forms-data-capture | Form UX, multi-step, draft saving |

### Outputs (findings to pass forward)

| Prompt | Key Finding to Consume |
|--------|------------------------|
| FINAL-REPORT | All findings synthesised above |

---

## Implementation Notes

### Affected Files

```
packages/db/src/schema.ts (new tables, field additions)
apps/tracker/src/components/**/*.tsx (updates across all components)
apps/tracker/src/app/(dashboard)/**/page.tsx (route updates)
apps/tracker/src/styles/ (new design tokens)
```

### New Files Required

```
~25 new components (see Recommended Components table)
2 new database tables
~5 new server functions
1 design tokens file
```

### Database Changes

- [ ] Create `tender_follow_up` table
- [ ] Create `activity_log` table
- [ ] Add `priority`, `risk_level`, `internal_notes` to tender
- [ ] Add `progress`, `phase` to project
- [ ] Expand PO status enum

### API Changes

- [ ] Add follow-up CRUD server functions
- [ ] Add activity log server functions
- [ ] Add result recording server function
- [ ] Add partial delivery recording server function
- [ ] Add navigation counts server function
- [ ] Update stats functions to include new fields

---

## Open Questions

- [ ] What is the budget for this implementation?
- [ ] Is there a development team available, or is this AI-assisted?
- [ ] Should we prioritise mobile or desktop first?
- [ ] Are there any integrations planned (accounting, email, etc.)?
- [ ] What is the timeline pressure — can we do this properly or need quick wins only?
