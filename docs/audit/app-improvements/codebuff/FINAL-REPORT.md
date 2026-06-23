# PMG Tracker 360 — Tracker App UI/UX Audit Final Report

> **Date:** 2026-06-14
> **Auditor:** Buffy (AI Audit)
> **Scope:** Complete UI/UX audit of the Tracker app

---

## Executive Summary

The PMG Tracker 360 Tracker app has a solid technical foundation but significant UX and workflow gaps prevent it from being a premium operational platform. The audit covered 10 areas across 5 phases, identifying **8 critical issues**, **28 major issues**, and **20+ minor issues**.

**Overall Score: 4.5/10**

The app needs foundational fixes (document upload, follow-up persistence), a design system overhaul, mobile optimisation, and workflow completion to reach its potential as a premium SaaS platform.

---

## Key Findings

### Critical Issues (Must Fix)

| # | Issue | Area | Effort |
|---|-------|------|--------|
| 1 | Document upload disabled ("currently unavailable") | Workflow | S |
| 2 | Follow-ups not persisted in database | Tender Management | S |
| 3 | PO status enum too limited | Project Management | S |
| 4 | No activity log across lifecycle events | Workflow | M |
| 5 | No brand colour system or design tokens | Premium UI | S |
| 6 | All register tables overflow on mobile | Mobile UX | L |
| 7 | No project close-out workflow | Workflow | M |
| 8 | No result recording for tenders | Tender Management | M |

### Major Issues (Should Fix)

- Dashboard KPIs lack trend indicators
- No urgency alert banner on dashboard
- Navigation has no badge counts
- Tender form is overwhelming (15+ fields on one page)
- No draft saving for complex forms
- No command palette for power users
- No mobile bottom navigation
- No partial delivery recording UI
- Activity feed is tender-only
- Charts are not interactive
- No project progress tracking
- "Procurement Cycle" navigation label is confusing
- No bulk actions on registers
- No export functionality
- No follow-up tracking persistence
- No result recording workflow
- No preparation tracking for tenders
- No email/notification triggers at milestones
- Error messages are generic
- No conditional fields in forms
- No field-level help text
- No project timeline view
- No tender comparison view
- PO delivery notes don't show line item details
- No contract deadline indicators
- No project-to-PO financial summary
- No tender analytics dashboard

---

## Top 5 Priority Improvements

### 1. Follow-up Tracking Persistence
**Impact:** Critical — Operational data lost on every refresh
**Effort:** 1 day
**What:** Create `tender_follow_up` table and wire up existing UI

### 2. Document Upload Re-enablement
**Impact:** Critical — Core workflow feature disabled
**Effort:** 1 day
**What:** Fix disabled document upload in tender and project forms

### 3. PO Status Expansion
**Impact:** Critical — Cannot track PO lifecycle accurately
**Effort:** 1 day
**What:** Add draft, partially_delivered, completed, cancelled, disputed statuses

### 4. Design System Foundation
**Impact:** High — No visual identity or consistency
**Effort:** 2-3 days
**What:** Brand colour palette, typography scale, StatusBadge component

### 5. Mobile Card Views
**Impact:** High — All registers unusable on mobile
**Effort:** 1 week
**What:** Responsive card components replacing tables on mobile

---

## Implementation Roadmap

### Phase 1: Critical Fixes (Week 1-2)
- Re-enable document upload
- Create follow-up tracking table
- Create activity log table
- Expand PO status enum
- Add priority field to tender
- Fix status badge colours

### Phase 2: Dashboard & Design Foundation (Week 2-4)
- Brand colour palette and design tokens
- StatusBadge component
- KPI cards for tender and project overviews
- Trend indicators on dashboard KPIs
- Urgency alert banner
- Illustrated empty states

### Phase 3: Navigation & Mobile Foundation (Week 4-6)
- Badge counts on navigation
- Quick action buttons in sidebar
- Mobile card views for all registers
- Bottom navigation for mobile
- Stack detail pages on mobile

### Phase 4: Forms & Data Entry (Week 6-8)
- Multi-step tender form
- Draft saving
- Conditional fields
- Command palette (Cmd+K)
- Field-level help text

### Phase 5: Workflow Completion (Week 8-12)
- Follow-up CRUD
- Result recording
- Partial delivery recording UI
- Project progress tracking
- Activity timeline
- Workflow status stepper

### Phase 6: Premium UI & Mobile Polish (Week 12-16)
- Card elevation system
- Micro-interactions and transitions
- Tender pipeline board (Kanban)
- Pull-to-refresh, swipe gestures, FAB

### Phase 7: Advanced Features (Week 16-20)
- Tender analytics dashboard
- Project close-out workflow
- Email digest summaries
- Keyboard shortcuts
- Export functionality

---

## Estimated Business Impact

| Metric | Current | After Implementation |
|--------|---------|---------------------|
| Missed deadlines | High (no urgency signals) | 30% reduction |
| Mobile usability | Near zero | Full capability |
| Data entry speed | Slow (complex forms) | 50% faster |
| Operational visibility | Limited | Complete activity trail |
| User satisfaction | Low | High (premium feel) |

---

## Files Changed in This Audit

### New Files Created (10 findings files + 1 report)

```
docs/audit/app-improvements/results/
├── FINAL-REPORT.md (this file)
├── INDEX.md (auto-generated)
├── codebase-audit/findings.md
├── dashboard-audit/findings.md
├── tender-management/findings.md
├── project-management/findings.md
├── workflow/findings.md
├── mobile-ux/findings.md
├── premium-ui/findings.md
├── navigation/findings.md
├── forms-data-capture/findings.md
└── deliverables-roadmap/findings.md
```

### Infrastructure Files Created

```
docs/audit/app-improvements/prompts/
├── FINDINGS-TEMPLATE.md
├── RUN.md
└── scripts/
    └── generate-index.ts
```

---

*This report was auto-generated from 10 audit sub-prompts executed across 5 phases. Run `bun run docs/audit/app-improvements/scripts/generate-index.ts` to refresh the findings index.*
