# Implementation Plan

## Phase 0: Verification And Quick Fixes

**Goal:** Remove obvious blockers and confirm assumptions before larger work.

**Tasks:**

1. Fix tender status mismatch: `won` vs `awarded`.
2. Confirm whether document upload backend works end-to-end.
3. Confirm whether PO line item/delivery tables are unused in server/UI.
4. Confirm `member` role requirements for viewing/updating POs.
5. Add PO number search if missing.
6. Replace native `confirm`/`alert` with app dialogs where easy.

**Output:**

- Awarded tenders can reliably create/link projects.
- Known-good baseline for documents, PO delivery, and permissions.

---

## Phase 1: Shared UI And Status Foundation

**Goal:** Create consistent primitives before touching many screens.

**Tasks:**

1. Create shared `StatusBadge` component.
2. Centralize tender, project, and PO status labels/colors/icons.
3. Define status lifecycle maps:
   - Tender stages
   - Project statuses
   - PO statuses
4. Create shared card variants:
   - KPI card
   - Risk card
   - Deadline card
   - Empty state
   - Mobile register card
5. Normalize status colors across registers and detail pages.

**Output:**

- Consistent visual language.
- Safer foundation for dashboard, registers, and workflow screens.

---

## Phase 2: Dashboard And Navigation Actionability

**Goal:** Make the app immediately useful after login.

**Tasks:**

1. Add dashboard action queue:
   - Tenders closing today/this week
   - Briefings upcoming
   - Follow-ups due
   - Missing documents
   - Overdue POs
   - Delivery risk
2. Add project/PO health cards:
   - Open POs
   - Partially delivered POs
   - Overdue deliveries
   - Projects awaiting PO
3. Add navigation badge counts.
4. Rename navigation groups to clearer business terms:
   - Tender Management
   - Project Management
   - Purchase Orders / Deliveries
5. Add workflow links:
   - Follow-ups
   - Submitted tenders
   - Awarded tenders
   - Deliveries
   - Overdue items

**Output:**

- Users know what needs attention.
- Navigation follows the real business workflow.

---

## Phase 3: Tender Workflow Upgrade

**Goal:** Turn Tender Management into a proper operational workspace.

**Tasks:**

1. Add tender stages:
   - New Opportunity
   - To Review
   - Approved to Prepare
   - In Preparation
   - Ready for Submission
   - Submitted
   - Awaiting Result
   - Awarded
   - Lost
   - Cancelled
2. Add tender follow-up tracking:
   - Follow-up date
   - Contact person
   - Notes
   - Outcome
   - Next follow-up date
3. Add result capture:
   - Awarded/lost/cancelled
   - Award value
   - Award date
   - Loss reason
   - Result notes
   - Result document
4. Enable tender document/proof upload:
   - Tender documents
   - Compliance docs
   - Submission proof
   - Award/result documents
5. Add tender detail workspace tabs:
   - Overview
   - Checklist
   - Documents
   - Follow-ups
   - Extensions
   - Result
   - Activity
6. Add tender mobile cards.

**Output:**

- Tender admins can manage the full tender lifecycle from one place.

---

## Phase 4: Project Workspace Upgrade

**Goal:** Make project detail pages operational, not just informational.

**Tasks:**

1. Add project workspace tabs:
   - Overview
   - Linked Tender
   - Purchase Orders
   - Deliveries
   - Documents
   - Activity
   - Risks / Issues
   - Closeout
2. Show linked PO summary on project detail:
   - Total PO value
   - Open POs
   - Partially delivered POs
   - Completed POs
   - Overdue deliveries
3. Add contract/award details:
   - Award value
   - Contract start/end
   - Signed contract document/reference
4. Add project risk indicators:
   - Awaiting PO
   - Overdue delivery
   - Contract ending soon
   - Incomplete closeout
5. Add project closeout readiness panel.

**Output:**

- Managers can assess project health without leaving the project page.

---

## Phase 5: PO Line Items And Partial Delivery

**Goal:** Implement the most important missing operational workflow.

**Tasks:**

1. Expand PO statuses:
   - Draft
   - Issued
   - Awaiting Delivery
   - Partially Delivered
   - Delivered
   - Completed
   - Cancelled
   - Disputed / On Hold
2. Add PO line item editor:
   - Description
   - Quantity
   - Unit price
   - Subtotal
   - Notes
3. Auto-calculate PO total from line items.
4. Add delivery note capture:
   - Delivery note number
   - Received date
   - Recipient
   - POD upload
   - Notes
5. Add delivered quantity capture per line item.
6. Validate:
   - Delivered quantity cannot exceed outstanding quantity
   - PO cannot be completed with outstanding items
7. Add PO delivery progress:
   - Ordered quantity
   - Delivered quantity
   - Outstanding quantity
   - Partial/complete status
8. Roll delivery status up to project progress.

**Output:**

- Accurate partial delivery tracking.
- Projects and POs reflect real fulfillment state.

---

## Phase 6: Forms And Mobile UX

**Goal:** Make data entry faster, safer, and mobile-friendly.

**Tasks:**

1. Convert complex forms to steppers:
   - Tender form
   - Project form
   - PO form
   - Delivery capture form
2. Add draft/autosave support.
3. Add review step before final submission.
4. Add transition-specific dialogs:
   - Mark submitted
   - Record result
   - Mark awarded
   - Record delivery
   - Complete PO
   - Complete project
5. Add mobile filter drawers.
6. Add sticky mobile action bars.
7. Improve field help text and inline validation.
8. Add double-submit protection.

**Output:**

- Fewer data-entry errors.
- Mobile workflows become usable.

---

## Phase 7: Activity, Notifications, And Reporting

**Goal:** Add operational memory and proactive alerts.

**Tasks:**

1. Add activity log/event table.
2. Record events for:
   - Tender status changes
   - Follow-ups
   - Result capture
   - Project creation
   - PO creation
   - Delivery notes
   - Completion events
3. Add notifications for:
   - Tender closing soon
   - Briefing due
   - Follow-up due
   - Validity expiring
   - PO overdue
   - Delivery disputed
4. Add reports:
   - Win/loss rate
   - Tender pipeline value
   - Follow-up performance
   - PO delivery performance
   - Overdue deliveries
   - Project completion rate
5. Add activity timelines to tender/project/PO detail pages.

**Output:**

- The app becomes auditable, proactive, and manager-friendly.

---

## Recommended Build Order

1. **Phase 0:** Quick fixes and validation
2. **Phase 1:** Shared status/UI foundation
3. **Phase 2:** Dashboard/navigation actionability
4. **Phase 3:** Tender workflow
5. **Phase 5:** PO line items and delivery tracking
6. **Phase 4:** Project workspace
7. **Phase 6:** Mobile/forms polish
8. **Phase 7:** Activity, notifications, reporting

Phase 5 should happen before the full Phase 4 build because the project workspace becomes much more valuable once real PO and delivery data exists.
