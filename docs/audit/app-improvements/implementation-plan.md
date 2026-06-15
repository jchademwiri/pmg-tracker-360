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

> 2026-06-15 update: PO line items and delivery notes now follow a project-scoped saved line-item workflow. See `docs/audit/project-line-items-delivery-notes-workflow.md` for the current schema, route, validation, and migration details.
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
| 1.3 | **Create `tender_follow_up` table** | Follow-ups UI exists but data is not persisted — lost on refresh | M | `packages/db/src/schema.ts`, migration | ✅ Done |
| 1.4 | **Expand PO status enum** | Only `open/sent/delivered` — no draft, partially_delivered, completed, cancelled | S | `packages/db/src/schema.ts` | ✅ Done |
| 1.5 | **Add `priority` field to tender** | No way to prioritise tenders | S | `packages/db/src/schema.ts` | ✅ Done |
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
- [✓] Bug fix: awarded tenders appear for project conversion
- [✓] Document upload working in tender and project forms
- [✓] Follow-up data persisted in database
- [✓] PO statuses expanded for lifecycle tracking
- [✓] Shared `StatusBadge` component available across app
- [✓] Tender priority field functional
- [✓] Clean, borderless tables with right-aligned Action dropdown triggers and clickable rows

---

## Phase 2: Dashboard & Navigation Actionability (Week 2)

**Goal:** Make the first screen answer "what needs attention today?"
**Effort:** 4–5 days
**Confidence:** High (all models agree)

### Tasks

| # | Task | Issue | Effort | Files | Status |
|---|------|-------|:------:|-------|:------:|
| 2.1 | **Add dashboard action queue band** | No urgency signals — users must scroll to find critical items | M | `apps/tracker/src/app/(dashboard)/dashboard/` | ✅ Done |
| 2.2 | **Add project/PO risk cards** | Delivery health invisible on dashboard | M | Dashboard components | ✅ Done |
| 2.3 | **Add nav badge counts** | No urgency signalling in sidebar | S | `apps/tracker/src/components/shared/navigation/app-sidebar.tsx` | ✅ Done |
| 2.4 | **Rename navigation groups** | "Procurement Cycle" confusing; "Tender Pipeline" → "Tender Management" | S | `apps/tracker/src/data/dashboad-links.ts` | ✅ Done |
| 2.5 | **Add direct workflow links** | Follow-ups, submitted/awarded tenders, deliveries, overdue items not exposed | M | Sidebar + dashboard | ✅ Done |
| 2.6 | **Add KPI trend indicators** | No context for whether metrics improving or declining | S | Dashboard metric cards | ✅ Done |
| 2.7 | **Add urgency alert banner** | Missing deadlines/overdue items not surfaced at top | S | Dashboard layout | ✅ Done |

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
- [✓] Dashboard shows actionable queue at top (closings, follow-ups, overdue)
- [✓] Navigation badges show counts for urgent items
- [✓] KPI cards show trend arrows (↑↓→)
- [✓] Navigation labels match business workflow
- [✓] Direct links to follow-ups, awarded tenders, deliveries, overdue items

---

## Phase 3: Tender Workflow Workspace (Week 3–4)

**Goal:** Transform tender management from status browsing into a command center.
**Effort:** 5–7 days
**Confidence:** High

### Tasks

| # | Task | Issue | Effort | Files | Status |
|---|------|-------|:------:|-------|:------:|
| 3.1 | **Add tender stages/preparation workflow** | No review/approval/preparation states | L | Schema + tender server actions | ✅ Done |
| 3.2 | **Persist follow-ups + next follow-up date** | Follow-up data lost on refresh (schema from Phase 1) | M | Tender server actions + UI | ✅ Done |
| 3.3 | **Add result capture dialog/form** | Cannot capture award amount, loss reason, or evaluation notes | M | `tender-details.tsx` | ✅ Done |
| 3.4 | **Add tender checklist tied to documents** | Compliance checklist disconnected from uploads | M | Tender detail | ✅ Done |
| 3.5 | **Add tender mobile cards** | Tender register unusable on mobile | L | `tenders-table.tsx` | ✅ Done |
| 3.6 | **Add filtered tender queues** | No way to see "closing soon", "awaiting result", "submitted" | M | Tender overview | ✅ Done |
| 3.7 | **Convert tender form to multi-step** | 15+ fields on one page — overwhelming | L | `tender-form.tsx` | ✅ Done |
| 3.8 | **Add draft saving** | Complex forms must be completed in one sitting | M | All forms | ✅ Done |

### Tender Stages

```
New Opportunity → To Review → Approved to Prepare → In Preparation
→ Ready for Submission → Submitted → Awaiting Result → Awarded/Lost
```

### Deliverables
- [✓] Tender stages with workflow progression
- [✓] Follow-ups persisted with next follow-up date
- [✓] Result capture with award/loss details
- [✓] Compliance checklist linked to document uploads
- [✓] Tender mobile cards in register
- [✓] Multi-step tender form with draft saving
- [✓] Filtered queues (closing soon, awaiting result, etc.)

---

## Phase 4: Project Workspace (Week 5–6)

**Goal:** Turn project detail into a delivery workspace with PO visibility.
**Effort:** 5–7 days
**Confidence:** High

### Tasks

| # | Task | Issue | Effort | Files | Status |
|---|------|-------|:------:|-------|:------:|
| 4.1 | **Add POs to project detail** | Project page doesn't show linked POs | M | `projects/[id]/page.tsx` | ✅ Done |
| 4.2 | **Add contract/linked tender summaries** | No context about originating tender | M | Project detail | ✅ Done |
| 4.3 | **Add project delivery/risk overview** | Delivery health invisible in project context | M | Project detail | ✅ Done |
| 4.4 | **Add activity timeline** | No activity log across lifecycle events | L | Project detail + schema | ✅ Done |
| 4.5 | **Add project progress tracking** | No way to see project completion % | M | Project register + detail | ✅ Done |
| 4.6 | **Add project close-out workflow** | Projects linger as "active" indefinitely | M | Project server actions | ✅ Done |
| 4.7 | **Add awaiting-PO and delayed-project queues** | Managers can't see project health | M | Dashboard | ✅ Done |

### Project Detail Tabs

```
[Info]  [Purchase Orders]  [Documents]  [Activity]  [Risks]
```

### Deliverables
- [✓] Project detail shows linked POs with delivery status
- [✓] Contract and originating tender summaries visible
- [✓] Delivery progress overview with risk indicators
- [✓] Activity timeline for all project events
- [✓] Project completion tracking (percentage)
- [✓] Project close-out workflow

---

## Phase 5: Project Items, PO Line Items & Delivery Tracking (Week 7–9)

**Goal:** Implement project-scoped item management and itemized PO fulfillment from saved project items through delivery notes.
**Effort:** 10–14 days
**Confidence:** Very High (all models agree — highest priority)

### Tasks

| # | Task | Issue | Effort | Files | Status |
|---|------|-------|:------:|-------|:------:|
| 5.1 | **Add project item catalog schema** | PO items need a saved project-scoped source | M | `packages/db/src/schema.ts`, migrations | ✅ Done |
| 5.2 | **Backfill/verify existing PO project links** | Existing POs must be attached to projects before item filtering works | S | DB data check/migration notes | ✅ Done |
| 5.3 | **Project item list page** | Users need to manage saved line items outside PO creation | M | `/projects/[id]/items` | ✅ Done |
| 5.4 | **Create project item page/form** | Saved items need project, description, unit, unit price/rate | M | `/projects/[id]/items/new` | ✅ Done |
| 5.5 | **Edit/archive project item workflow** | Users need to update or retire saved items safely | M | `/projects/[id]/items/[itemId]/edit` | ✅ Done |
| 5.6 | **Item usage and delete safeguards** | Items used on POs should not be hard-deleted accidentally | M | Item server actions + UI | ✅ Done |
| 5.7 | **Add project Items tab/section** | Project workspace should expose the saved item catalog | M | Project workspace/tabs | ✅ Done |
| 5.8 | **PO project-first item selector** | PO line items must come only from selected project's saved items | L | `po-form.tsx`, `purchase-orders.ts` | ✅ Done |
| 5.9 | **Server validation for unrelated project items** | Users must not save PO lines from another project | M | PO validation/server actions | ✅ Done |
| 5.10 | **PO item price snapshot warnings** | Saved item prices can change after a PO is created | M | PO form/detail | Pending |
| 5.11 | **Prevent risky project changes on delivered POs** | Changing PO project after deliveries can corrupt item lineage | M | PO edit validation | Pending |
| 5.12 | **Dedicated delivery note creation page** | Delivery recording should not happen in a modal | L | `/projects/purchase-orders/[id]/deliveries/new` | ✅ Done |
| 5.13 | **Delivery note list page per PO** | Users need to browse all delivery notes for a PO | M | `/projects/purchase-orders/[id]/deliveries` | Pending |
| 5.14 | **Delivery note detail page** | Users need a dedicated receipt/POD view | M | `/projects/purchase-orders/[id]/deliveries/[deliveryNoteId]` | Pending |
| 5.15 | **Delivery note edit/cancel workflow** | Mistakes need correction with safeguards | L | Delivery note server actions + UI | Pending |
| 5.16 | **Delivery note PDF/print view** | Delivery notes need printable operational records | M | Delivery note detail | Pending |
| 5.17 | **Delivery quantity/value calculation** | Delivery value must be delivered quantity × unit price | M | Delivery server actions + UI | ✅ Done |
| 5.18 | **Validate delivered vs outstanding quantities** | No guardrails against over-delivery | M | Server actions | ✅ Done |
| 5.19 | **Auto-calculate PO completion status** | Manual status updates only | M | Server actions | ✅ Done |
| 5.20 | **PO/project item progress summaries** | Users need ordered, delivered, outstanding, and value totals | M | PO detail + project workspace | Pending |
| 5.21 | **Breadcrumb labels for PO/project item/delivery routes** | UUID breadcrumbs are not usable | S | `dynamic-breadcrumb.tsx` | ✅ Done |
| 5.22 | **Move project workspace navigation to top** | Tabs were buried below summary cards and hard to discover | S | `project-workspace.tsx` | ✅ Done |
| 5.23 | **Add project-level deliveries tab** | Delivery notes need project-level visibility, not only PO-level visibility | M | `project-workspace.tsx`, project query | ✅ Done |
| 5.24 | **Add top project command bar actions** | Create PO and Add Item actions should be available immediately | S | `project-workspace.tsx` | ✅ Done |
| 5.25 | **Add itemNumber + sapReference to project items** | Items need unique identifiers and SAP references | M | Schema, forms, PO forms, PO detail | ✅ Done |
| 5.26 | **Generate drizzle migration for item fields** | Schema changes need proper migration tracking | S | `packages/db/migrations/` | ✅ Done |
| 5.27 | **Move delivery progress cards to Overview tab only** | Summary cards were taking space on all tabs | S | `project-workspace.tsx` | ✅ Done |

### Project Item Catalog

```
Project: SS02 - 2025/26

Description       Unit      Unit Price     Used On POs     Status
Cables            unit      R12.50         2               Active
Installation      hour      R350.00        1               Active
Hardware kit      kit       R1,200.00      0               Active
```

### PO Line Item Selection

```
1. Select project
2. Load saved line items for that project only
3. Select saved item
4. Enter PO quantity
5. Snapshot description, unit, unit price, and line total
```

### Deliverables
- [✓] Project-scoped item schema added
- [✓] Existing PO verified against project link
- [✓] Project item list/add/edit/archive pages
- [✓] Project workspace Items tab
- [✓] Project workspace navigation moved to the top
- [✓] Top Create PO and Add Item actions added
- [✓] Project-level Deliveries tab added
- [✓] PO line items selected from saved project items
- [✓] Server validation blocks unrelated project items
- [ ] PO item usage and price-change warnings
- [✓] Dedicated delivery note creation page
- [ ] Delivery note list/detail/edit/cancel pages
- [✓] Quantity validation (delivered ≤ outstanding)
- [✓] Auto-status updates (partially_delivered, delivered, completed)
- [✓] Delivery value calculated from delivered quantity × unit price
- [ ] PO/project item progress summaries
- [ ] Delivery note print/PDF view

---

## Phase 6: Mobile & Form System (Week 9–10)

**Goal:** Make mobile a first-class operational mode for all workflows.
**Effort:** 5–7 days
**Confidence:** High

### Tasks

| # | Task | Issue | Effort | Files | Status |
|---|------|-------|:------:|-------|:------:|
| 6.1 | **Shared mobile card component** | Tables overflow on mobile | M | `apps/tracker/src/components/ui/mobile-card.tsx` | ✅ Done |
| 6.2 | **Mobile filter drawer/bottom sheet** | Desktop search filters don't work on mobile | M | `apps/tracker/src/components/ui/mobile-filter-drawer.tsx` | ✅ Done |
| 6.3 | **Sticky mobile action bars** | No quick actions on mobile detail pages | S | `apps/tracker/src/components/ui/mobile-action-bar.tsx` | ✅ Done |
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
- [✓] Shared mobile card component created and used in tenders-table, po-list, and project-list
- [✓] Mobile filter drawer with apply/clear pattern integrated into PO list
- [✓] Sticky mobile action bar on PO detail page
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
| 7.8 | **Outstanding item quantity report** | Managers need item-level ordered vs delivered visibility | M | Reports pages | Pending |
| 7.9 | **Partially delivered PO report** | Partial fulfillment needs active follow-up | M | Reports pages | Pending |
| 7.10 | **Delivery value report** | Delivery value is now calculated but not summarized | M | Reports pages | Pending |
| 7.11 | **Item spend/value by project** | Project cost exposure needs item-level rollups | M | Reports pages | Pending |
| 7.12 | **POD verification queue** | Delivery notes missing PODs need follow-up | M | Reports + delivery pages | Pending |
| 7.13 | **Item and delivery permissions** | Item edits and delivery corrections need role-specific access | M | Permissions + server actions | Pending |
| 7.14 | **CSV import/export for project items** | Large projects need bulk item setup and review | M | Item pages + export actions | Pending |

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
- [ ] Item-level outstanding quantity and delivery value reports
- [ ] Partially delivered PO and POD verification queues
- [ ] Item/delivery role permissions enforced in server actions and UI
- [ ] Project item CSV import/export
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
    │       │               └── Phase 5: Project Items, PO Line Items & Delivery
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
| 5. Project Items, PO & Delivery | 10–14 days | Week 7–9 | Item catalog, filtered PO items, delivery notes |
| 6. Mobile & Forms | 5–7 days | Week 10–11 | Mobile cards, steppers, draft saving |
| 7. Automation & Polish | 6–9 days | Week 12–13 | Notifications, reporting, permissions, command palette |
| **Total** | **38–54 days** | **~12–13 weeks** | Premium operational SaaS |

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
| Project item management | None | ✅ | ✅ + reports/import |

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
