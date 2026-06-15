# PMG Tracker 360 — Cross-Model Implementation Plan

> **Date:** 2026-06-14
> **Models:** Antigravity, codebuff, codex
> **Reconciled Score:** 5.5/10
> **Cross-Model Confidence:** High (all 3 models agree on top priorities)

---

## Executive Summary

All three AI models independently audited the Tracker app across 10 areas and converged on the same core diagnosis: **the app has a solid technical foundation but is not yet a complete operational SaaS workflow**. The issues are not cosmetic — they are missing workflow capabilities that prevent the app from being usable for daily operations.

This plan organises **17 critical issues** and **28 major issues** across 7 phases, ordered by:
1. **Impact** — what blocks users most
2. **Dependency** — what must come first
3. **Confidence** — what all 3 models agree on

---

## Cross-Model Agreement Summary

| Issue | Antigravity | codebuff | codex | Confidence |
|-------|:-----------:|:--------:|:-----:|:----------:|
| PO line items + delivery notes not implemented | ✅ | ✅ | ✅ | **High** |
| Partial delivery tracking missing | ✅ | ✅ | ✅ | **High** |
| PO status model too limited | ✅ | ✅ | ✅ | **High** |
| Project detail lacks PO/delivery workspace | ✅ | ✅ | ✅ | **High** |
| Dashboard lacks action queues/urgency | ✅ | ✅ | ✅ | **High** |
| Navigation lacks badge counts | ✅ | ✅ | ✅ | **High** |
| `won` vs `awarded` status mismatch | ✅ | — | ✅ | **High** |
| Document upload disabled | — | ✅ | ✅ | **High** |
| Tender follow-up/result workflow missing | Partial | ✅ | ✅ | **High** |
| Mobile registers need card layouts | ✅ | ✅ | ✅ | **High** |
| Complex forms need stepper/draft support | ✅ | ✅ | ✅ | **High** |
| Shared status/design system needed | ✅ | ✅ | ✅ | **High** |
| Command palette missing | ✅ | ✅ | ✅ | **Medium** |
| Activity log/workflow timeline missing | Partial | ✅ | ✅ | **Medium** |

---

## Reconciled Scores by Area

| Area | codebuff | Antigravity | codex | **Reconciled** |
|------|:--------:|:-----------:|:-----:|:--------------:|
| Codebase audit | 5.0 | 6.5 | 5.8 | **5.8** |
| Dashboard audit | 5.0 | 6.5 | 6.0 | **5.8** |
| Tender management | 5.0 | 7.5 | 5.8 | **6.1** |
| Project management | 4.0 | 4.0 | 5.4 | **4.5** |
| Workflow | 4.0 | 6.0 | 5.0 | **5.0** |
| Mobile UX | 3.0 | 6.0 | 5.5 | **4.8** |
| Premium UI | 4.0 | 8.5 | 6.0 | **6.2** |
| Navigation | 5.0 | 7.0 | 6.0 | **6.0** |
| Forms/data capture | 4.0 | 5.5 | 5.6 | **5.0** |
| Deliverables roadmap | 4.5 | 9.0 | 5.7 | **5.7** |

---

## Phase 1: Stabilize Core (Week 1)

**Goal:** Fix critical bugs and broken workflows that block daily operations.
**Effort:** 3–5 days
**Confidence:** Very High (all models agree)

### Tasks

| # | Task | Issue | Effort | Files | Status |
|---|------|-------|:------:|-------|:------:|
| 1.1 | **Fix `won` → `awarded` status mismatch** | `getAvailableTendersForProjects` queries for `status = 'won'` but schema uses `'awarded'` | S | `apps/tracker/src/server/tenders.ts` | ✅ Done |
| 1.2 | **Re-enable document upload** | Upload shows "currently unavailable" despite server support existing | M | `apps/tracker/src/components/tenders/tender-form.tsx`, `tender-details.tsx` | ✅ Done |
| 1.3 | **Create `tender_follow_up` table** | Follow-ups UI exists but data is not persisted — lost on refresh | M | `packages/db/src/schema.ts`, migration | Pending |
| 1.4 | **Expand PO status enum** | Only `open/sent/delivered` — no draft, partially_delivered, completed, cancelled | S | `packages/db/src/schema.ts` | Pending |
| 1.5 | **Add `priority` field to tender** | No way to prioritise tenders | S | `packages/db/src/schema.ts` | Pending |
| 1.6 | **Create shared `StatusBadge` component** | Status colours inconsistent across all components | S | `apps/tracker/src/components/ui/status-badge.tsx` | ✅ Done |
| 1.7 | **Clean table Actions UI & borderless design** | Table action dropdowns had inconsistent icons; tables had double outer borders | S | `apps/tracker/src/components/**/*-table.tsx` and list files | ✅ Done |

### Status Map (for StatusBadge)

```typescript
const STATUS_MAP = {
  // Tenders
  draft:      { label: 'Draft',      color: 'slate',   icon: 'FileEdit' },
  open:       { label: 'Open',       color: 'blue',    icon: 'FolderOpen' },
  submitted:  { label: 'Submitted',  color: 'violet',  icon: 'Send' },
  evaluation: { label: 'Evaluation', color: 'amber',   icon: 'Search' },
  awarded:    { label: 'Awarded',    color: 'emerald', icon: 'CheckCircle' },
  lost:       { label: 'Lost',       color: 'red',     icon: 'XCircle' },
  cancelled:  { label: 'Cancelled',  color: 'slate',   icon: 'Ban' },
  // Projects
  active:     { label: 'Active',     color: 'blue',    icon: 'Briefcase' },
  completed:  { label: 'Completed',  color: 'emerald', icon: 'CheckCircle2' },
  // POs
  draft:                    { label: 'Draft',          color: 'slate',   icon: 'FileEdit' },
  issued:                   { label: 'Issued',         color: 'blue',    icon: 'Send' },
  awaiting_delivery:        { label: 'Awaiting',       color: 'amber',   icon: 'Clock' },
  partially_delivered:      { label: 'Partial',        color: 'orange',  icon: 'Truck' },
  delivered:                { label: 'Delivered',       color: 'emerald', icon: 'CheckCircle' },
  completed:                { label: 'Completed',       color: 'emerald', icon: 'CheckCircle2' },
  cancelled:                { label: 'Cancelled',       color: 'slate',   icon: 'Ban' },
  disputed:                 { label: 'Disputed',        color: 'red',     icon: 'AlertTriangle' },
}
```

### Deliverables
- [x] Bug fix: awarded tenders appear for project conversion
- [x] Document upload working in tender and project forms
- [ ] Follow-up data persisted in database
- [ ] PO statuses expanded for lifecycle tracking
- [x] Shared `StatusBadge` component available across app
- [ ] Tender priority field functional
- [x] Clean, borderless tables with right-aligned Action dropdown triggers and clickable rows

---

## Phase 2: Dashboard & Navigation Actionability (Week 2)

**Goal:** Make the first screen answer "what needs attention today?"
**Effort:** 4–5 days
**Confidence:** High (all models agree)

### Tasks

| # | Task | Issue | Effort | Files | Status |
|---|------|-------|:------:|-------|:------:|
| 2.1 | **Add dashboard action queue band** | No urgency signals — users must scroll to find critical items | M | `apps/tracker/src/app/(dashboard)/dashboard/` | Pending |
| 2.2 | **Add project/PO risk cards** | Delivery health invisible on dashboard | M | Dashboard components | Pending |
| 2.3 | **Add nav badge counts** | No urgency signalling in sidebar | S | `apps/tracker/src/components/shared/navigation/app-sidebar.tsx` | ✅ Done |
| 2.4 | **Rename navigation groups** | "Procurement Cycle" confusing; "Tender Pipeline" → "Tender Management" | S | `apps/tracker/src/data/dashboad-links.ts` | ✅ Done |
| 2.5 | **Add direct workflow links** | Follow-ups, submitted/awarded tenders, deliveries, overdue items not exposed | M | Sidebar + dashboard | ✅ Done |
| 2.6 | **Add KPI trend indicators** | No context for whether metrics improving or declining | S | Dashboard metric cards | Pending |
| 2.7 | **Add urgency alert banner** | Missing deadlines/overdue items not surfaced at top | S | Dashboard layout | Pending |

### Dashboard Action Queue Design

```
┌─────────────────────────────────────────────────────────┐
│ ⚠️ 3 tenders closing this week  •  2 follow-ups due     │
│    1 missing document  •  1 overdue delivery            │
├─────────────────────────────────────────────────────────┤
│ [KPI Cards]  [Charts]  [Activity Feed]                  │
│ ...                                                      │
```

### Deliverables
- [ ] Dashboard shows actionable queue at top (closings, follow-ups, overdue)
- [x] Navigation badges show counts for urgent items
- [ ] KPI cards show trend arrows (↑↓→)
- [x] Navigation labels match business workflow
- [x] Direct links to follow-ups, awarded tenders, deliveries, overdue items

---

## Phase 3: Tender Workflow Workspace (Week 3–4)

**Goal:** Transform tender management from status browsing into a command center.
**Effort:** 5–7 days
**Confidence:** High

### Tasks

| # | Task | Issue | Effort | Files | Status |
|---|------|-------|:------:|-------|:------:|
| 3.1 | **Add tender stages/preparation workflow** | No review/approval/preparation states | L | Schema + tender server actions | Pending |
| 3.2 | **Persist follow-ups + next follow-up date** | Follow-up data lost on refresh (schema from Phase 1) | M | Tender server actions + UI | Pending |
| 3.3 | **Add result capture dialog/form** | Cannot capture award amount, loss reason, or evaluation notes | M | `tender-details.tsx` | Pending |
| 3.4 | **Add tender checklist tied to documents** | Compliance checklist disconnected from uploads | M | Tender detail | Pending |
| 3.5 | **Add tender mobile cards** | Tender register unusable on mobile | L | `tenders-table.tsx` | Pending |
| 3.6 | **Add filtered tender queues** | No way to see "closing soon", "awaiting result", "submitted" | M | Tender overview | Pending |
| 3.7 | **Convert tender form to multi-step** | 15+ fields on one page — overwhelming | L | `tender-form.tsx` | Pending |
| 3.8 | **Add draft saving** | Complex forms must be completed in one sitting | M | All forms | Pending |

### Tender Stages

```
New Opportunity → To Review → Approved to Prepare → In Preparation
→ Ready for Submission → Submitted → Awaiting Result → Awarded/Lost
```

### Deliverables
- [ ] Tender stages with workflow progression
- [ ] Follow-ups persisted with next follow-up date
- [ ] Result capture with award/loss details
- [ ] Compliance checklist linked to document uploads
- [ ] Tender mobile cards in register
- [ ] Multi-step tender form with draft saving
- [ ] Filtered queues (closing soon, awaiting result, etc.)

---

## Phase 4: Project Workspace (Week 5–6)

**Goal:** Turn project detail into a delivery workspace with PO visibility.
**Effort:** 5–7 days
**Confidence:** High

### Tasks

| # | Task | Issue | Effort | Files | Status |
|---|------|-------|:------:|-------|:------:|
| 4.1 | **Add POs to project detail** | Project page doesn't show linked POs | M | `projects/[id]/page.tsx` | Pending |
| 4.2 | **Add contract/linked tender summaries** | No context about originating tender | M | Project detail | Pending |
| 4.3 | **Add project delivery/risk overview** | Delivery health invisible in project context | M | Project detail | Pending |
| 4.4 | **Add activity timeline** | No activity log across lifecycle events | L | Project detail + schema | Pending |
| 4.5 | **Add project progress tracking** | No way to see project completion % | M | Project register + detail | Pending |
| 4.6 | **Add project close-out workflow** | Projects linger as "active" indefinitely | M | Project server actions | Pending |
| 4.7 | **Add awaiting-PO and delayed-project queues** | Managers can't see project health | M | Dashboard | Pending |

### Project Detail Tabs

```
[Info]  [Purchase Orders]  [Documents]  [Activity]  [Risks]
```

### Deliverables
- [ ] Project detail shows linked POs with delivery status
- [ ] Contract and originating tender summaries visible
- [ ] Delivery progress overview with risk indicators
- [ ] Activity timeline for all project events
- [ ] Project completion tracking (percentage)
- [ ] Project close-out workflow

---

## Phase 5: PO Line Items & Delivery Tracking (Week 7–8)

**Goal:** Implement the largest post-award workflow gap — itemized PO fulfillment.
**Effort:** 7–10 days
**Confidence:** Very High (all models agree — highest priority)

### Tasks

| # | Task | Issue | Effort | Files | Status |
|---|------|-------|:------:|-------|:------:|
| 5.1 | **PO line-item editor + server CRUD** | Schema exists but no UI or API | L | `po-form.tsx`, `purchase-orders.ts` | Pending |
| 5.2 | **Delivery note capture with POD upload** | No way to record deliveries | L | New delivery components | Pending |
| 5.3 | **Validate delivered vs outstanding quantities** | No guardrails against over-delivery | M | Server actions | Pending |
| 5.4 | **Auto-calculate PO completion status** | Manual status updates only | M | Server actions | Pending |
| 5.5 | **Mobile delivery capture flow** | Field supervisors can't record deliveries on phone | L | New mobile components | Pending |
| 5.6 | **Expand PO form to include line items** | PO creation is header-only | M | `po-form.tsx` | Pending |

### PO Line Item Grid

```
┌──────────────────────────────────────────────────────────┐
│ Description        │ Qty  │ Unit Price │ Total   │ Action │
├──────────────────────────────────────────────────────────┤
│ Cement (tons)       │ 100  │ R2,500     │ R250,000│ [Edit] │
│ Steel rebar (tons)  │ 50   │ R8,000     │ R400,000│ [Edit] │
│ Sand (tons)         │ 200  │ R800       │ R160,000│ [Edit] │
├──────────────────────────────────────────────────────────┤
│                              TOTAL:        R810,000      │
│                              DELIVERED:    R450,000 (56%)│
│                              OUTSTANDING:  R360,000      │
└──────────────────────────────────────────────────────────┘
```

### Delivery Capture (Mobile)

```
┌─────────────────────────────┐
│ 📦 Record Delivery          │
├─────────────────────────────┤
│ PO Number: PO-2026-0042     │
│ Delivery Note: [________]   │
│ Date: [2026-06-14]          │
│                             │
│ Line Items:                 │
│ ☑ Cement    Received: [80]  │
│ ☐ Steel     Received: [__]  │
│                             │
│ 📷 Upload POD Photo         │
│                             │
│ [Save Delivery]             │
└─────────────────────────────┘
```

### Deliverables
- [ ] PO line items editable in form with auto-total calculation
- [ ] Delivery note capture with POD document upload
- [ ] Quantity validation (delivered ≤ outstanding)
- [ ] Auto-status updates (partially_delivered, delivered, completed)
- [ ] Mobile-optimized delivery capture flow
- [ ] PO progress visible from project detail

---

## Phase 6: Mobile & Form System (Week 9–10)

**Goal:** Make mobile a first-class operational mode for all workflows.
**Effort:** 5–7 days
**Confidence:** High

### Tasks

| # | Task | Issue | Effort | Files | Status |
|---|------|-------|:------:|-------|:------:|
| 6.1 | **Shared mobile card component** | Tables overflow on mobile | M | `packages/ui/src/components/ui/mobile-card.tsx` | Pending |
| 6.2 | **Mobile filter drawer/bottom sheet** | Desktop search filters don't work on mobile | M | Filter components | Pending |
| 6.3 | **Sticky mobile action bars** | No quick actions on mobile detail pages | S | Detail page layouts | Pending |
| 6.4 | **Mobile bottom navigation** | Sidebar collapses — no mobile nav pattern | M | App layout | Pending |
| 6.5 | **Convert remaining forms to steppers** | Complex forms still single-page on mobile | L | Tender/PO forms | Pending |
| 6.6 | **Add draft/autosave to all forms** | Form abandonment risk | M | Form infrastructure | Pending |
| 6.7 | **Pull-to-refresh on mobile registers** | No mobile refresh pattern | S | Register components | Pending |

### Mobile Card Pattern

```
┌─────────────────────────────┐
│ T-2026-042          [Awarded]│
│ ⚡ High Priority             │
├─────────────────────────────┤
│ Client: Ekurhuleni Municipality │
│ Value: R2,450,000           │
│ Closing: 2026-06-20         │
│ Days left: 6 ⚠️             │
├─────────────────────────────┤
│ [View]  [Edit]  [Follow-up]│
└─────────────────────────────┘
```

### Deliverables
- [ ] All registers show cards on mobile (≤768px)
- [ ] Filter drawers on mobile
- [ ] Sticky action bars on detail pages
- [ ] Bottom navigation for mobile
- [ ] Multi-step forms on mobile
- [ ] Draft saving with autosave

---

## Phase 7: Automation, Reporting & Polish (Week 11–12)

**Goal:** Add proactive operational control and premium finishing touches.
**Effort:** 5–7 days
**Confidence:** Medium

### Tasks

| # | Task | Issue | Effort | Files | Status |
|---|------|-------|:------:|-------|:------:|
| 7.1 | **Activity/event table** | No reliable timeline — inferred from `updatedAt` | M | Schema + server | Pending |
| 7.2 | **Notification triggers** | No email/alert triggers at milestones | L | Notification service | Pending |
| 7.3 | **Command palette (Cmd+K)** | Power users can't navigate quickly | M | New component | Pending |
| 7.4 | **Reporting dashboard** | No win/loss, delivery performance, overdue POs reports | L | Reports pages | Pending |
| 7.5 | **Premium UI polish** | Card elevation, transitions, micro-interactions | M | CSS + components | Pending |
| 7.6 | **Export functionality** | No data export on any register | M | Register components | Pending |
| 7.7 | **Keyboard shortcuts** | No power-user keyboard navigation | M | Layout + shortcuts | Pending |

### Activity Event Table Schema

```sql
CREATE TABLE activity_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  actor_id UUID REFERENCES users(id),
  entity_type VARCHAR(50) NOT NULL,  -- 'tender', 'project', 'purchase_order'
  entity_id UUID NOT NULL,
  event_type VARCHAR(100) NOT NULL,  -- 'status_changed', 'document_uploaded', 'follow_up_created'
  metadata JSONB,                    -- { from: 'draft', to: 'submitted', reason: '...' }
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Deliverables
- [ ] Activity events tracked for all entity changes
- [ ] Notification triggers for deadlines, follow-ups, deliveries
- [ ] Command palette for quick navigation
- [ ] Reporting with win/loss, delivery performance, overdue analysis
- [ ] Premium UI polish (transitions, elevation, micro-interactions)
- [ ] CSV/Excel export on registers
- [ ] Keyboard shortcuts for power users

---

## Dependency Graph

```
Phase 1: Stabilize Core
    │
    ├── Phase 2: Dashboard & Navigation
    │       │
    │       ├── Phase 3: Tender Workflow
    │       │       │
    │       │       └── Phase 4: Project Workspace
    │       │               │
    │       │               └── Phase 5: PO Line Items & Delivery
    │       │                       │
    │       │                       └── Phase 6: Mobile & Forms
    │       │                               │
    │       │                               └── Phase 7: Automation & Polish
    │       │
    │       └── Phase 3 (parallel after Phase 2)
    │
    └── Phase 2 (immediately after Phase 1)
```

---

## Estimated Timeline

| Phase | Duration | Cumulative | Key Deliverable |
|-------|:--------:|:----------:|-----------------|
| 1. Stabilize Core | 3–5 days | Week 1 | Bugs fixed, StatusBadge, follow-ups persisted |
| 2. Dashboard & Nav | 4–5 days | Week 2 | Action queues, badge counts, urgency signals |
| 3. Tender Workflow | 5–7 days | Week 3–4 | Tender stages, result capture, mobile cards |
| 4. Project Workspace | 5–7 days | Week 5–6 | PO visibility, delivery progress, activity |
| 5. PO & Delivery | 7–10 days | Week 7–8 | Line items, delivery notes, quantity tracking |
| 6. Mobile & Forms | 5–7 days | Week 9–10 | Mobile cards, steppers, draft saving |
| 7. Automation & Polish | 5–7 days | Week 11–12 | Notifications, reporting, command palette |
| **Total** | **34–48 days** | **~10–12 weeks** | Premium operational SaaS |

---

## Open Decisions

Before starting implementation, these decisions should be made:

| # | Question | Options | Recommendation |
|---|----------|---------|----------------|
| 1 | PO numbers: global or org-scoped? | Global / Org-scoped | **Org-scoped** (allows parallel orgs) |
| 2 | Tender stages: DB enum or lookup table? | Enum / Lookup / App text | **DB enum** (type safety + migrations) |
| 3 | PO statuses: DB enum or lookup table? | Enum / Lookup / App text | **DB enum** (same as tenders) |
| 4 | Offline mobile delivery capture? | Yes / No / Future | **No** (add in Phase 7+) |
| 5 | Role mapping: which roles map to which personas? | See below | **Define in Phase 1** |

### Recommended Role Mapping

| Role | Persona | Access |
|------|---------|--------|
| `admin` / `manager` | Tender Administrator, Manager/Owner | Full CRUD, reports, settings |
| `user` | General User, Site Supervisor | Read + update assigned records |
| `system_admin` | Platform Admin | Admin app only |

---

## Success Metrics

| Metric | Current | After Phase 5 | After Phase 7 |
|--------|:-------:|:-------------:|:-------------:|
| Cross-model score | 5.5/10 | 7.5/10 | 9.0/10 |
| Critical issues open | 17 | 0 | 0 |
| Mobile usability | Near zero | Good | Excellent |
| Data entry speed | Slow | 2× faster | 3× faster |
| Operational visibility | Limited | Good | Complete |
| Follow-up persistence | None | ✅ | ✅ + notifications |
| Delivery tracking | None | ✅ | ✅ + alerts |
| PO lifecycle visibility | Broken | ✅ | ✅ + reporting |

---

## Quick Wins (Do First — All Models Agree)

These are high-impact, low-effort items that can be done in 1–2 days:

1. **Fix `won` → `awarded`** — 5 min fix, unblocks project creation (✅ Completed)
2. **Expand PO status enum** — 30 min, enables lifecycle tracking (Pending)
3. **Add `priority` to tenders** — 30 min, enables prioritisation (Pending)
4. **Create `StatusBadge` component** — 1 day, consistent status display everywhere (✅ Completed)
5. **Add nav badge counts** — 1 day, immediate urgency signalling (✅ Completed)
6. **Rename confusing nav labels** — 10 min, reduces cognitive load (✅ Completed)
7. **Add KPI trend arrows** — 2 hours, gives context to metrics (Pending)
8. **Add urgency alert banner** — 2 hours, surfaces critical items (Pending)
9. **Clean table Actions UI & borderless layout** — 1 day, right-aligned compact triggers, text-only dropdown items, no outer borders, clickable rows (✅ Completed)

---

*This plan was generated from cross-model audit findings by Antigravity, codebuff, and codex. Run `bun run docs/audit/app-improvements/scripts/generate-index.ts` to refresh the findings index.*
