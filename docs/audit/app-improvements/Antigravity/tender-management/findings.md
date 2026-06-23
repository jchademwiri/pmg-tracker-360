# Findings – 03-tender-management.md

## Metadata

| Field | Value |
|-------|-------|
| **Prompt** | 03-tender-management.md |
| **Date** | 2026-06-14 |
| **Auditor** | Antigravity |
| **Scope** | Audit of the tender management modules, including the landing page, register, details, and workflow. |
| **Depends On** | 01-codebase-audit.md, 02-dashboard-audit.md |

---

## Executive Summary

The **Tender Management** module is the most complete section of the Tracker app. It has full CRUD actions, a detailed layout (`tender-details.tsx` and `tender-form.tsx`), a document upload checklist, and a tender extension log. 

However, it lacks a dedicated "Tenders Landing Dashboard." Clicking the navigation links takes users directly to a table list rather than an operational dashboard overview. The workflow also suffers from the critical backend status query bug (C1) that blocks tender-to-project conversion, and the document checklists are passive (users check a box manually rather than the system detecting uploaded files).

**Overall Score: 7.5/10**

| Area | Score | Trend |
|------|-------|-------|
| Tender Overview & Mini Dashboard | 3.0/10 | ↓ |
| Pipeline Funnel Chart | 8.0/10 | ↑ |
| Tender Detail Page | 8.5/10 | ↑ |
| Workflow Integrations | 6.5/10 | → |

---

## Current State

### What Exists Today

1. **Tender Register Table (`tenders-table.tsx`):**
   - Renders fields: Reference, Client, Submission Date, Value, Status, and Actions.
   - Includes sorting on column headers and pagination controls.

2. **Detailed Page Tabs (`tender-details.tsx`):**
   - **Tender Info**: Renders client details, submission dates, briefing locations, mandatory flags, and validity date trackers.
   - **Documents**: Shows checklists for files like tax clearances, BBEEE certificates, and CIDB registration.
   - **Extensions**: Renders a log of extensions with dates, contacts, and notes.

3. **Pipeline Funnel (`pipeline-funnel.tsx`):**
   - Shows horizontal colored blocks for stages: Open, Closed, Evaluation, Awarded, Lost, and Cancelled.

### Architecture Notes

- State is managed via Next.js server search params and router updates.
- File uploads use a drag-and-drop component (`file-uploader.tsx`) saving directly to S3.

---

## Findings

### Critical Issues

| # | Issue | Location | Impact | Effort |
|---|-------|----------|--------|--------|
| C1 | **Tender-to-Project Conversion Blocked** | `src/server/tenders.ts#L897` | Described in codebase audit. Awarded tenders cannot be converted because the backend queries for `'won'` status. | S |

### Major Issues

> Issues that significantly degrade UX or operational efficiency.

| # | Issue | Location | Impact | Effort |
|---|-------|----------|--------|--------|
| M1 | **No Dedicated Tender Landing Dashboard** | `src/app/(dashboard)/tenders/page.tsx` | Clicking "Tender Pipeline" immediately opens a table list. Lacks a dedicated workspace dashboard for tender administrators. | M |
| M2 | **Passive Document Checklists** | `tender-details.tsx` | Checking off compliance documents is manual. The system does not verify if files are uploaded, risking compliance errors. | M |

### Minor Issues

> Polish items, inconsistencies, and small UX improvements.

| # | Issue | Location | Impact | Effort |
|---|-------|----------|--------|--------|
| m1 | **Briefing Mandates Not Flagged** | `tenders-table.tsx` | Compulsory briefings are not visually highlighted in the register table, which increases the risk of missing mandatory meetings. | S |
| m2 | **Manual Validity Dates** | `tender-form.tsx` | Users must manually calculate the validity expiration date, even though it is a simple addition of Validity Days to the Submission Date. | S |

---

## Recommendations

### Quick Wins (1-2 days)

1. **Automate Validity Date Calculation**
   - **What**: When a user inputs Submission Date and Validity Days in the form, calculate the Validity Expiry Date automatically.
   - **Where**: `apps/tracker/src/components/tenders/tender-form.tsx`
   - **Expected outcome**: Prevents calculation mistakes.

2. **Visual Briefing Warnings**
   - **What**: Add an icon (e.g. orange calendar) on rows in the table where a briefing is mandatory but has not been marked as attended.
   - **Where**: `apps/tracker/src/components/tenders/tenders-table.tsx`
   - **Expected outcome**: Reduces the risk of missing mandatory sessions.

### Short-Term (1-2 weeks)

1. **Create the Tenders Mini Dashboard**
   - **What**: Build a landing dashboard for the Tenders module that contains KPI metrics (closing this week, follow-ups due, briefings today), a pipeline board, and a quick-action panel.
   - **Where**: `apps/tracker/src/app/(dashboard)/tenders/overview/page.tsx`
   - **Expected outcome**: Clear operational starting point for managers.

2. **Integrate File Uploader with Checklist**
   - **What**: Link the file uploader directly to the compliance checklist, checking off items automatically when a document is uploaded.
   - **Where**: `apps/tracker/src/components/tenders/tender-details.tsx`
   - **Expected outcome**: Accurate audit trails.

### Medium-Term (1-3 months)

1. **Interactive Kanban Pipeline Board**
   - **What**: Implement a visual Kanban board for the tender stages, allowing users to drag cards to update stages.
   - **Where**: `apps/tracker/src/components/tenders/tender-kanban.tsx` (new file)
   - **Expected outcome**: Rich, interactive pipeline view.

---

## Component Inventory

| Component | Current State | Recommended State | Priority |
|-----------|--------------|-------------------|----------|
| **Pipeline Funnel** | Horizontal chart. | Add click interactions to filter the register table by stage. | P1 |
| **Tender Detail Tabs** | Displays info text. | Add checklist triggers and calendar reminders for follow-ups. | P1 |
| **Extension Form** | Basic form. | Add file upload for the extension letter. | P1 |

---

## Cross-References

### Dependencies (findings this prompt consumed)

| Prompt | Key Finding Used |
|--------|------------------|
| 01-codebase-audit.md | Discovered status mismatch in Drizzle filter and hardcoded badge styles. |
| 02-dashboard-audit.md | Structure of Admin/Specialist widgets. |

### Outputs (findings to pass forward)

| Prompt | Key Finding to Consume |
|--------|------------------------|
| 04-project-management.md | Transition parameters when converting a tender to a project. |
| 05-workflow.md | Mapping the full tender-to-project process. |
| 09-forms-data-capture.md | Optimizing form submissions and uploader scripts. |
| 10-deliverables-roadmap.md | Phasing tender module improvements. |

---

## Implementation Notes

### Affected Files

```
apps/tracker/src/components/tenders/tender-form.tsx
apps/tracker/src/components/tenders/tenders-table.tsx
apps/tracker/src/components/tenders/tender-details.tsx
apps/tracker/src/app/(dashboard)/tenders/page.tsx
```

### New Files Required

```
apps/tracker/src/components/tenders/tender-kanban.tsx
apps/tracker/src/components/tenders/tender-mini-dashboard.tsx
```

### Database Changes

*None required.*

### API Changes

- [ ] Add `updateTenderStage` server action.
- [ ] Connect document upload database record with specific checklist fields.
