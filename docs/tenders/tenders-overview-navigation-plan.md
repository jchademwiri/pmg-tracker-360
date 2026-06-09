# Tenders Overview & Navigation Implementation Plan

## 1. Current State Audit

### 1.1 Existing Pages

| Route | Purpose | Status |
|---|---|---|
| `/tenders` | Redirects to `/tenders/overview?status=open` | ✅ Working |
| `/tenders/overview` | Combined mini-dashboard + tender register with KPIs, deadlines, activity, and filterable table | ✅ Working (needs restructuring) |
| `/tenders/overview?status=open` | Filtered to open tenders | ✅ Working |
| `/tenders/overview?status=evaluation` | Filtered to evaluation tenders | ✅ Working |
| `/tenders/overview?status=closed` | Filtered to closed tenders | ✅ Working |
| `/tenders/overview?status=awarded` | Filtered to awarded tenders | ✅ Working |
| `/tenders/overview?status=lost` | Filtered to lost/rejected tenders | ✅ Working |
| `/tenders/submitted` | Redirects to `/tenders/overview?status=evaluation` | ✅ Working |
| `/tenders/create` | Create tender form | ✅ Working |
| `/tenders/[id]` | Tender detail page | ✅ Working |
| `/tenders/[id]/edit` | Edit tender form | ✅ Working |

### 1.2 Existing Components (11 total)

| Component | Purpose | Issues |
|---|---|---|
| `tender-form.tsx` | Create/edit form | USD `$` icon instead of ZAR `R` |
| `tenders-table.tsx` | Table with pagination | Value column commented out |
| `tenders-search-filters.tsx` | Search + filter controls | Working |
| `tender-details.tsx` | Detail view | Document upload placeholder |
| `tender-list.tsx` | Legacy list component | May be unused (overview uses table) |
| `extension-form.tsx` | Extension form | **BLOCKED** — file input missing |
| `extension-list.tsx` | Extension history list | Working |
| `recent-activity.tsx` | Activity widget | Working |
| `upcoming-deadlines.tsx` | Deadline widget | Working |
| `status-chart.tsx` | Status breakdown chart | Working |
| `tender-to-project-dialog.tsx` | Convert tender to project | Working |

### 1.3 Database Schema

```sql
-- Tender table
tender: id, organizationId, tenderNumber, description, clientId,
        submissionDate, value, status, evaluationDate, validityDays,
        validityDate, contactName, contactEmail, contactPhone,
        briefingDate, briefingLocation, isBriefingMandatory,
        briefingAttended, createdAt, updatedAt, deletedAt

-- Tender Extension table
tenderExtension: id, organizationId, tenderId, extensionDate,
                 newEvaluationDate, contactName, contactEmail,
                 contactPhone, notes, createdBy, createdAt,
                 updatedAt, deletedAt

-- Statuses: open, closed, evaluation, awarded, lost, cancelled
-- Unique constraint: (organizationId, tenderNumber)
```

### 1.4 Current Navigation (Sidebar)

```
Tender Pipeline
├── Tender Register       → /tenders/overview
├── Open Tenders          → /tenders/overview?status=open
├── Under Evaluation      → /tenders/overview?status=evaluation
├── Closed                → /tenders/overview?status=closed
├── Awarded               → /tenders/overview?status=awarded
└── Lost / Rejected       → /tenders/overview?status=lost
```

### 1.5 Server Actions (17 functions in `tenders.ts`)

- `getTenders()` — Basic fetch with pagination
- `createTender()` — Create with validation
- `getTenderById()` — Single tender fetch
- `getTenderBreadcrumbLabel()` — Breadcrumb text
- `updateTender()` — Full update
- `updateTenderStatus()` — Status-only update
- `deleteTender()` — Soft delete
- `searchTenders()` — Advanced search
- `getTendersWithSorting()` — Sorted fetch
- `getAvailableTendersForProjects()` — For project creation
- `getTenderStats()` — Dashboard statistics
- `getRecentActivity()` — Activity feed
- `getUpcomingDeadlines()` — Deadline widget
- `getUpcomingBriefings()` — Briefing widget
- `getTendersWithCustomSorting()` — Custom status ordering
- `getTendersOverview()` — Filtered overview
- `autoCloseExpiredTenders()` — Auto-close expired

---

## 2. Gap Analysis: What User Wants vs What Exists

### 2.1 User's Requirements

1. **Tenders Overview** (`/tenders/overview`): Mini dashboard with quick overview, KPIs, and quick links
2. **Tender Register**: Show all tenders sorted: open → closing soon → closed → evaluation → others
3. **Filtering links**: Utilizing the tender register page

### 2.2 Current Gaps

| Requirement | Current State | Gap |
|---|---|---|
| Mini dashboard KPIs | ✅ 5 stat cards exist | Need quick-link cards to filtered views |
| Tender register with smart ordering | ⚠️ Table exists but defaults to `submissionDate asc` | Needs `open → closing soon → closed → evaluation → others` ordering |
| Dedicated register page | ❌ Overview IS the register | User wants overview as dashboard, register as separate table view |
| Status filter tabs/pills | ❌ Only dropdown filter | Need visual tab/pill navigation for quick status switching |
| Quick-link cards on overview | ❌ Not implemented | Need clickable cards linking to filtered register views |

---

## 3. Implementation Plan

### Phase 1: Restructure Overview as Pure Mini Dashboard

**Goal**: Make `/tenders/overview` a focused dashboard with KPIs, quick links, and summary widgets — no table.

#### 1.1 Create New `TenderOverviewDashboard` Component

**File**: `apps/tracker/src/components/tenders/tender-overview-dashboard.tsx`

```tsx
// Pure dashboard component — no table, just KPIs + widgets + quick links
// Sections:
// 1. KPI Cards Row: Total Tenders | Open | Evaluation | Win Rate | Total Value
// 2. Quick Links Grid: Clickable cards for each status filter
// 3. Two-column: Upcoming Deadlines + Recent Activity
// 4. Status Breakdown Chart (optional, using existing status-chart.tsx)
```

**Quick Links Cards** (clickable, linking to register with filter):
```
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│  🟢 Open    │ │  🔵 Eval    │ │  ⚫ Closed  │
│  12 tenders │ │  5 tenders  │ │  8 tenders  │
│  View →     │ │  View →     │ │  View →     │
└─────────────┘ └─────────────┘ └─────────────┘
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│  🟡 Awarded │ │  🔴 Lost    │ │  ⚠️ Overdue │
│  3 tenders  │ │  2 tenders  │ │  4 tenders  │
│  View →     │ │  View →     │ │  View →     │
└─────────────┘ └─────────────┘ └─────────────┘
```

#### 1.2 Simplify Overview Page

**File**: `apps/tracker/src/app/(dashboard)/tenders/overview/page.tsx`

- Remove `TendersOverviewClient` (table) from this page
- Keep: KPI cards, deadlines widget, activity widget
- Add: Quick-links grid linking to `/tenders/register?status=X`
- Keep server-side data fetching for stats, deadlines, activity

---

### Phase 2: Create Dedicated Tender Register Page

**Goal**: A new `/tenders/register` page focused on the filterable, sortable table.

#### 2.1 Create Register Page

**File**: `apps/tracker/src/app/(dashboard)/tenders/register/page.tsx`

```tsx
// Server component
// - Fetches tenders with smart ordering (open first, then closing soon, etc.)
// - Passes data to client wrapper for filtering/interaction
// - Includes status pill tabs at the top
```

#### 2.2 Smart Ordering Logic

**File**: `apps/tracker/src/server/tenders.ts` — new `getTenderRegister()` function

Default sort order for "All" view:
```sql
-- Priority ordering:
-- 1. Open tenders, sorted by submissionDate ASC (closing soonest first)
-- 2. Evaluation tenders, sorted by submissionDate DESC (most recent first)
-- 3. Closed tenders, sorted by submissionDate DESC
-- 4. Awarded tenders, sorted by submissionDate DESC
-- 5. Lost/Cancelled tenders, sorted by submissionDate DESC
```

```typescript
export async function getTenderRegister(
  organizationId: string,
  filters: TenderFilters,
  page: number,
  limit: number
) {
  // When status = 'all':
  //   ORDER BY
  //     CASE status
  //       WHEN 'open' THEN 0
  //       WHEN 'evaluation' THEN 1
  //       WHEN 'closed' THEN 2
  //       WHEN 'awarded' THEN 3
  //       WHEN 'lost' THEN 4
  //       WHEN 'cancelled' THEN 5
  //     END,
  //     CASE WHEN status = 'open' THEN submissionDate END ASC NULLS LAST,
  //     submissionDate DESC NULLS LAST
  //
  // When specific status: sort by submissionDate ASC (closing soonest first for open)
}
```

#### 2.3 Status Pill Tabs

**File**: `apps/tracker/src/components/tenders/tender-status-tabs.tsx` (new)

```tsx
// Horizontal pill/tab bar at the top of the register
// Shows: All (count) | Open (count) | Evaluation (count) | Closed (count) | Awarded (count) | Lost (count)
// Each pill is a link: /tenders/register?status=open
// Active pill is highlighted
// Counts come from server-side stats
```

#### 2.4 Register Client Wrapper

**File**: `apps/tracker/src/app/(dashboard)/tenders/register/client-wrapper.tsx`

- Reuse existing `TendersSearchFilters` and `TendersTable` components
- Wire up filter/pagination/sort state
- URL sync for deep-linking

---

### Phase 3: Update Navigation

**Goal**: Restructure sidebar to reflect the new two-page structure.

#### 3.1 Update `dashboad-links.ts`

**File**: `apps/tracker/src/data/dashboad-links.ts`

```typescript
{
  title: 'Tender Pipeline',
  url: '#',
  icon: ClipboardList,
  items: [
    { title: 'Overview', url: '/tenders/overview' },
    { title: 'Tender Register', url: '/tenders' },
    { title: 'Open Tenders', url: '/tenders?status=open' },
    { title: 'Under Evaluation', url: '/tenders?status=evaluation' },
    { title: 'Closed', url: '/tenders?status=closed' },
    { title: 'Awarded', url: '/tenders?status=awarded' },
    { title: 'Lost / Rejected', url: '/tenders?status=lost' },
  ],
}
```

#### 3.2 Update Root Redirect

**File**: `apps/tracker/src/app/(dashboard)/tenders/page.tsx`

```typescript
// Change from: redirect('/tenders/overview?status=open');
// To: redirect('/tenders/overview');
// The overview is now the dashboard entry point
```

#### 3.3 Update Legacy Redirects

**File**: `apps/tracker/src/app/(dashboard)/tenders/submitted/page.tsx`

```typescript
// Change from: redirect('/tenders/overview?status=evaluation');
// To: redirect('/tenders/register?status=evaluation');
```

---

### Phase 4: Enhance Overview Dashboard

**Goal**: Make the overview page a genuinely useful mini dashboard.

#### 4.1 Enhanced KPI Cards

Upgrade the existing 5 cards with trend indicators:

```
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│ Total Tenders    │ │ Open Tenders     │ │ Under Evaluation │
│ 42               │ │ 12               │ │ 5                │
│ ↑ 15% vs last mo │ │ ↓ 3 vs last mo  │ │ ↑ 2 new this wk  │
└──────────────────┘ └──────────────────┘ └──────────────────┘
┌──────────────────┐ ┌──────────────────┐
│ Win Rate         │ │ Pipeline Value   │
│ 28%              │ │ R 4,250,000      │
│ ↑ 5% improvement │ │ ↑ 12% vs last mo │
└──────────────────┘ └──────────────────┘
```

The `getTenderStats()` already returns `trends.value` and `trends.winRate` — just wire them to the UI.

#### 4.2 Add "Closing This Week" Urgency Widget

**File**: `apps/tracker/src/components/tenders/closing-this-week.tsx` (new)

```tsx
// Compact widget showing tenders closing within 7 days
// Red highlight for overdue, orange for 1-3 days, yellow for 4-7 days
// Each item links to /tenders/[id]
// Uses existing getUpcomingDeadlines() with limit=5
```

#### 4.3 Value Summary Widget

Show breakdown of pipeline value by status:

```
Pipeline: R 4,250,000 total
├── Open:     R 2,100,000 (49%)
├── Eval:     R 1,200,000 (28%)
├── Awarded:    R 800,000 (19%)
└── Lost:       R 150,000 (4%)
```

---

### Phase 5: Bug Fixes (from existing PRD/UI audit)

These are existing issues that should be addressed alongside the restructuring:

#### 5.1 Uncomment Value Column in TendersTable

**File**: `apps/tracker/src/components/tenders/tenders-table.tsx`

Un-comment the Value column and apply `formatCurrency()` (already uses `R` prefix).

#### 5.2 Fix Extension Form Blocker

**File**: `apps/tracker/src/components/tenders/extension-form.tsx`

Either:
- Add a working `<Input type="file" />` element, OR
- Make file upload optional (remove the `if (!file)` check)

#### 5.3 Fix USD Currency References

**File**: `apps/tracker/src/components/tenders/tender-form.tsx`

Replace `<DollarSign />` icon with `R` prefix for ZAR.

#### 5.4 Auto-Close Expired Tenders

**File**: `apps/tracker/src/server/tenders.ts`

The `autoCloseExpiredTenders()` function already exists. Wire it to run:
- On overview page load (already possible via server action call)
- OR on a background schedule

---

## 4. File Changes Summary

### New Files
| File | Purpose |
|---|---|
| `components/tenders/tender-overview-dashboard.tsx` | Pure dashboard component (KPIs + quick links + widgets) |
| `components/tenders/tender-status-tabs.tsx` | Status pill/tab bar for register page |
| `components/tenders/closing-this-week.tsx` | Urgency widget for closing soon tenders |
| `app/(dashboard)/tenders/register/page.tsx` | Dedicated register page (server component) |
| `app/(dashboard)/tenders/register/client-wrapper.tsx` | Register client wrapper with filters/table |

### Modified Files
| File | Changes |
|---|---|
| `app/(dashboard)/tenders/overview/page.tsx` | Remove table, add quick-links grid |
| `app/(dashboard)/tenders/page.tsx` | Redirect to `/tenders/overview` (no status param) |
| `app/(dashboard)/tenders/submitted/page.tsx` | Redirect to `/tenders/register?status=evaluation` |
| `data/dashboad-links.ts` | Restructure navigation items |
| `server/tenders.ts` | Add `getTenderRegister()` with smart ordering |
| `components/tenders/tenders-table.tsx` | Uncomment value column |
| `components/tenders/tender-form.tsx` | Fix USD → ZAR |
| `components/tenders/extension-form.tsx` | Fix file upload blocker |

### Unchanged Files
| File | Reason |
|---|---|
| `components/tenders/tenders-search-filters.tsx` | Reused as-is in register page |
| `components/tenders/recent-activity.tsx` | Reused as-is |
| `components/tenders/upcoming-deadlines.tsx` | Reused as-is |
| `components/tenders/tender-details.tsx` | No changes needed |
| `components/tenders/status-chart.tsx` | Optional integration |
| `components/tenders/tender-to-project-dialog.tsx` | No changes needed |
| `components/tenders/extension-list.tsx` | No changes needed |

---

## 5. Implementation Order

1. **Phase 2 first** — Create `/tenders/register` page (new route, doesn't break existing)
2. **Phase 1** — Restructure overview as pure dashboard
3. **Phase 3** — Update navigation links
4. **Phase 4** — Enhance dashboard widgets
5. **Phase 5** — Bug fixes (can be done in parallel)

---

## 6. Testing Checklist

- [ ] `/tenders/overview` shows KPIs + quick links + widgets (no table)
- [ ] `/tenders/register` shows full table with status tabs
- [ ] `/tenders/register?status=open` filters to open tenders
- [ ] Default register sort: open → closing soon → evaluation → closed → awarded → lost
- [ ] Sidebar links navigate correctly to each view
- [ ] `/tenders` root redirects to overview
- [ ] `/tenders/submitted` redirects to register with evaluation filter
- [ ] Value column visible and formatted in ZAR (`R`)
- [ ] Extension form accepts file uploads
- [ ] Tender form shows `R` not `$`
- [ ] Quick-link cards show correct counts and link to filtered register
- [ ] Auto-close runs on overview page load for expired tenders
- [ ] Typecheck passes
