# Findings: Tender Management Mini Dashboard

---

## Metadata

| Field | Value |
|-------|-------|
| **Prompt** | 03-tender-management.md |
| **Date** | 2026-06-14 |
| **Auditor** | Buffy (AI Audit) |
| **Scope** | Tender mini dashboard, pipeline, register, detail page, and workflow |
| **Depends On** | 01-codebase-audit, 02-dashboard-audit |

---

## Executive Summary

The tender management area has solid CRUD functionality but lacks the operational intelligence needed for effective tender administration. The overview page shows a pipeline funnel and closing-soon widget, but there are no KPI cards, no follow-up tracking, and no result recording workflow. The tender form is comprehensive but complex, and the detail page has a sidebar layout that doesn't work on mobile.

**Overall Score: 5/10**

| Area | Score | Trend |
|------|-------|-------|
| Tender Overview | 5/10 | → |
| Tender Register | 5/10 | → |
| Tender Detail | 4/10 | ↓ |
| Tender Form | 6/10 | → |
| Follow-up Tracking | 2/10 | ↓ |
| Result Recording | 3/10 | ↓ |

---

## Current State

### Tender Overview (`/tenders/overview`)
- `PipelineFunnel` — Visual funnel showing tender counts by status
- `ClosingSoonWidget` — Tenders closing in the next 7 days
- `TendersTable` — Full register with search and filters
- `UpcomingDeadlines` — 30-day deadline list
- `RecentActivity` — Recent tender creation and status updates

### Tender Register (`/tenders`)
- `TendersTable` with `TendersSearchFilters`
- Columns: Tender Number, Description, Client, Status, Submission Date, Value
- Search by text, filter by status
- Row click navigates to detail
- Actions: Edit, Delete (via context menu)

### Tender Detail (`/tenders/[id]`)
- `TenderDetails` component with sidebar layout
- Main content: Description, client, dates, value
- Sidebar: Contact info, briefing details, status
- Extensions: `ExtensionList` and `ExtensionForm`
- Documents: Document manager (currently disabled)
- Actions: Edit, Change Status, Convert to Project

### Tender Form (`/tenders/create`, `/tenders/[id]/edit`)
- `TenderForm` with comprehensive field set
- Fields: Number, Description, Client (select), Status, Value, Submission Date, Evaluation Date, Validity Days, Contact Info, Briefing Info
- Client can be created inline
- Form validation with Zod

---

## Findings

### Critical Issues

| # | Issue | Location | Impact | Effort |
|---|-------|----------|--------|--------|
| C1 | No follow-up tracking in database — UI shows follow-ups but they're not persisted | No `tenderFollowUp` table | Follow-up data lost on refresh | M |
| C2 | No result/outcome recording — status change is the only way to record results | `tender-details.tsx` | Cannot capture evaluation details, award amounts, or loss reasons | M |

### Major Issues

| # | Issue | Location | Impact | Effort |
|---|-------|----------|--------|--------|
| M1 | Tender overview lacks KPI cards — no at-a-glance metrics | `tenders/overview/page.tsx` | Users must scroll to understand pipeline health | M |
| M2 | No internal priority or risk level on tenders | `schema.ts`, `tender-form.tsx` | Cannot prioritise work or flag high-risk tenders | M |
| M3 | No briefcase/preparation tracking — no way to track internal prep progress | — | Cannot see which tenders are being actively prepared | M |
| M4 | Tender form is overwhelming — all fields on one page | `tender-form.tsx` | Complex form causes errors and abandonment | M |
| M5 | No bulk actions on tender register (bulk status change, bulk delete) | `tenders-table.tsx` | Cannot efficiently manage multiple tenders | M |
| M6 | Search doesn't search across client name — only tender number and description | `tenders-search-filters.tsx` | Hard to find tenders by client | S |

### Minor Issues

| # | Issue | Location | Impact | Effort |
|---|-------|----------|--------|--------|
| m1 | Status badges have inconsistent colours | Various | Cannot quickly scan statuses | S |
| m2 | No export functionality for tender register | — | Cannot generate reports | S |
| m3 | Briefing "Attended" toggle has no confirmation | `tender-details.tsx` | Accidental clicks | S |
| m4 | No tender comparison view | — | Cannot compare multiple tenders side-by-side | S |
| m5 | Extension form doesn't show extension history inline | `extension-form.tsx` | Must scroll to see history | S |

---

## Recommendations

### Quick Wins (1-2 days)

1. **Add KPI cards to tender overview**
   - What: Show Total Active, Closing This Week, Submitted, Awaiting Result, Awarded, Lost as KPI cards
   - Where: New `TenderOverviewMetrics` component in `tenders/overview/`
   - Expected outcome: Instant pipeline health visibility

2. **Add priority field to tender schema**
   - What: Add `priority` enum (low, medium, high, critical) to tender table
   - Where: `schema.ts`, migration, `tender-form.tsx`
   - Expected outcome: Users can prioritise tenders

3. **Fix status badge colours**
   - What: Create unified StatusBadge with consistent colour mapping
   - Where: New component, update all tender views
   - Expected outcome: Visual consistency

### Short-Term (1-2 weeks)

1. **Implement follow-up tracking**
   - What: Create `tenderFollowUp` table with date, type, notes, outcome fields
   - Where: `schema.ts`, migration, `tender-details.tsx`, new `FollowUpForm` component
   - Expected outcome: Follow-ups persist across sessions

2. **Add result recording workflow**
   - What: Create `tenderResult` fields for award amount, win reason, loss reason, evaluation notes
   - Where: `schema.ts`, migration, new `ResultForm` component
   - Expected outcome: Detailed outcome capture for analytics

3. **Implement multi-step tender form**
   - What: Break tender form into steps: Basic Info → Dates & Deadlines → Contact & Briefing → Review
   - Where: `tender-form.tsx`, new step components
   - Expected outcome: Reduced form complexity and errors

### Medium-Term (1-3 months)

1. **Build tender pipeline board (Kanban-style)**
   - What: Drag-and-drop board showing tenders by status column
   - Where: New `TenderPipelineBoard` component
   - Expected outcome: Visual workflow management

2. **Add tender analytics and reporting**
   - What: Win/loss rate by client, average tender value, submission frequency
   - Where: New analytics components, server functions
   - Expected outcome: Data-driven tender strategy

---

## Component Inventory

| Component | Current State | Recommended State | Priority |
|-----------|--------------|-------------------|----------|
| TenderOverviewMetrics | Non-existent | KPI cards with pipeline stats | P0 |
| StatusBadge | Inline spans | Unified component with colour mapping | P0 |
| FollowUpForm | UI exists, no DB | Full CRUD with persistence | P0 |
| ResultForm | Non-existent | Detailed outcome recording | P1 |
| TenderPipelineBoard | Non-existent | Kanban-style drag-and-drop | P2 |
| TenderComparison | Non-existent | Side-by-side tender comparison | P2 |

---

## Cross-References

### Dependencies (findings this prompt consumed)

| Prompt | Key Finding Used |
|--------|------------------|
| 01-codebase-audit | Tender CRUD exists; follow-ups not in DB; extensions work; document upload disabled |
| 02-dashboard-audit | Dashboard deadline/briefing widgets exist; pattern to extend |

### Outputs (findings to pass forward)

| Prompt | Key Finding to Consume |
|--------|------------------------|
| 05-workflow | Follow-up and result tracking gaps; multi-step form needed |
| 09-forms-data-capture | Tender form is complex; needs multi-step breakdown |
| 10-deliverables-roadmap | Follow-up table and result fields are foundational |

---

## Implementation Notes

### Affected Files

```
apps/tracker/src/components/tenders/tender-form.tsx
apps/tracker/src/components/tenders/tender-details.tsx
apps/tracker/src/components/tenders/tenders-table.tsx
apps/tracker/src/components/tenders/tenders-search-filters.tsx
apps/tracker/src/components/tenders/pipeline-funnel.tsx
apps/tracker/src/components/tenders/closing-soon-widget.tsx
apps/tracker/src/app/(dashboard)/tenders/overview/page.tsx
packages/db/src/schema.ts
```

### New Files Required

```
components/tenders/tender-overview-metrics.tsx
components/tenders/follow-up-form.tsx
components/tenders/follow-up-list.tsx
components/tenders/result-form.tsx
components/tenders/tender-pipeline-board.tsx
components/shared/status-badge.tsx
```

### Database Changes

- [ ] Create `tender_follow_up` table
- [ ] Add `priority` field to tender table
- [ ] Add `tenderResult` fields (award_amount, win_reason, loss_reason, evaluation_notes)

### API Changes

- [ ] Add `createTenderFollowUp()`, `getTenderFollowUps()`, `deleteTenderFollowUp()`
- [ ] Add `recordTenderResult()` server function
- [ ] Update `getTenderStats()` to include follow-up counts

---

## Open Questions

- [ ] Should follow-ups have types (phone, email, meeting, other)?
- [ ] Should result recording trigger automatic project creation?
- [ ] Is Kanban board a priority, or focus on register improvements first?

---

## Appendix

### Tender Status Flow

```
New Opportunity → To Review → Approved to Prepare → In Preparation → 
Ready for Submission → Submitted → Awaiting Result → Awarded / Lost / Cancelled
```

**Current DB statuses:** open, closed, evaluation, awarded, lost, cancelled
**Recommended statuses:** new, reviewing, preparing, ready, submitted, evaluating, awarded, lost, cancelled
