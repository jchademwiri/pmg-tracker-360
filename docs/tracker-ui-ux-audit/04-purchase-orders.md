# Purchase Orders Audit

## Current Area Summary

Routes:

- `/projects/purchase-orders`
- `/projects/purchase-orders/create`
- `/projects/purchase-orders/[id]`
- `/projects/purchase-orders/[id]/edit`

Core components:

- `POList`
- `POForm`
- `PODetails`

Purchase Orders are nested under Project Management and permission-gated for read/create in several places. The workflow supports project selection, supplier details, PO status, line items, VAT summary, detail view, fulfillment progress, and status updates.

## Page Audit

### `/projects/purchase-orders`

- Current purpose: List and manage purchase orders.
- Observations: Search, status filter, pagination, desktop table, mobile cards, and mobile filter drawer exist. Permission redirect protects unauthorized access.
- Problems: Page header includes both Add Project and Add Purchase Order, which dilutes the page purpose. No filtered URL state is currently used in list component. `searchParams` is resolved but not used.
- Missing states/workflows: No overdue expected delivery view, no supplier filter, no project filter, no delivered/outstanding summary, no export.
- Mobile issues: Mobile filter drawer is a good pattern and should be reused elsewhere.
- Accessibility concerns: Deletion uses browser confirm inside list; replace with consistent alert dialog.
- Recommended improvements: Make Create PO primary. Add saved views: Open, Sent, Partially Delivered, Overdue Delivery, Disputed.
- Priority: High.
- Suggested implementation notes: Sync search/status/page to URL and add project/supplier/date filters.

### `/projects/purchase-orders/create`

- Current purpose: Create a PO via multi-step `POForm`.
- Observations: Stepper is useful. Line-item selection from saved project line items is strong. VAT-exclusive/inclusive summary is valuable.
- Problems: Step 3 is a wide editable table, difficult on small screens. The user must save project line items before adding them to PO, which may be confusing. Stepper does not validate before moving forward.
- Missing states/workflows: No duplicate PO number precheck, no supplier directory, no delivery terms, no attachment/upload for PO document, no draft save.
- Mobile issues: Line-item table will be the hardest PO workflow on mobile.
- Accessibility concerns: Buttons that are disabled because no project/items exist need explanatory helper text. Alerts use browser `alert`.
- Recommended improvements: Use guided line-item builder: select saved item, set quantity, review totals. Add draft state and project-context header.
- Priority: High.
- Suggested implementation notes: For mobile, replace table rows with expandable item cards.

### `/projects/purchase-orders/[id]`

- Current purpose: PO detail with overview, item fulfillment tracking, project info, status management, deliveries tab, and mobile action bar.
- Observations: The item fulfillment table is one of the strongest workflow-specific UI pieces in the app. Delivery tab and mobile action bar are useful.
- Problems: Status update buttons are rule-based but not presented as a clear lifecycle. Overview and delivery actions repeat in header/sidebar/mobile bar.
- Missing states/workflows: No document upload tab for original PO, no dispute notes, no supplier contact, no audit trail of status changes.
- Mobile issues: Fulfillment table is dense; mobile needs cards showing ordered/delivered/outstanding.
- Accessibility concerns: Progress bars need text alternatives. Status buttons should announce the result.
- Recommended improvements: Add PO lifecycle strip: Draft/Open, Sent, Partially Delivered, Delivered, Completed, Disputed/Cancelled. Add fulfillment cards on mobile.
- Priority: High.
- Suggested implementation notes: Reuse Tender lifecycle data-driven transition pattern.

### `/projects/purchase-orders/[id]/edit`

- Current purpose: Edit PO using `POForm`.
- Observations: Reuse preserves consistency.
- Problems: Editing PO line items after delivery may be risky. The form does not clearly show delivery history or lock delivered quantities.
- Missing states/workflows: Impact warning when delivered items exist, reason for status changes, update audit.
- Mobile issues: Same line-item table concerns as create.
- Accessibility concerns: Same as PO form.
- Recommended improvements: Add a delivered-state guard. For delivered/completed POs, require an explicit "revise PO" workflow.
- Priority: High.
- Suggested implementation notes: Disable line-item removal when delivery notes reference the line item, or add a warning with clear consequences.

## Table and Filter Recommendations

PO list should include:

- PO number
- Project
- Supplier
- Status
- PO date
- Expected delivery
- Delivered/outstanding progress
- Total amount
- Last activity

Recommended filters:

- Search
- Status
- Project
- Supplier
- Expected delivery range
- Overdue only
- Has disputes
- Has partial delivery

Recommended empty states:

- No POs yet: explain that POs are created against projects and line items.
- No search results: show active filters and clear action.
- No permission: explain read/create access and who to contact.

