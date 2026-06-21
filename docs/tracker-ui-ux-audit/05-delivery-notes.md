# Delivery Notes Audit

## Current Area Summary

Route:

- `/projects/purchase-orders/[id]/deliveries/new`

Delivery note records are also surfaced inside:

- `/projects/purchase-orders/[id]` deliveries tab
- `/projects/[id]` project workspace deliveries tab

Core component:

- `DeliveryNoteForm`

Delivery Notes are functional and directly tied to PO line-item fulfillment. The workflow captures delivery note number, recipient, received date, proof-of-delivery upload, notes, delivered quantities, and delivery value.

## Page Audit

### `/projects/purchase-orders/[id]/deliveries/new`

- Current purpose: Record a delivery note against a purchase order.
- Observations: Good relationship context in sidebar. Delivered quantity cannot exceed outstanding quantity. Submit button is disabled until required information and quantities are valid.
- Problems: The delivered-items table is dense and will be difficult on mobile. Required fields are managed manually instead of via the form system. The proof-of-delivery upload is optional but may be operationally required. Errors are inline for quantities but not summarized.
- Missing states/workflows: No delivery note duplicate check, no partial receipt reason, no damaged/rejected quantity, no "received by signature/photo" state, no delivery location confirmation, no draft state if interrupted.
- Mobile issues: Seven-column delivered-items table is the largest mobile risk in the app.
- Accessibility concerns: Quantity inputs need clearer labels per item, such as "Delivered quantity for Item X". Disabled submit needs visible explanation.
- Recommended improvements: Replace mobile table with item cards: item description, ordered, previously delivered, outstanding, delivered input, value. Add error summary before submit.
- Priority: High.
- Suggested implementation notes: Keep desktop table, but add a `md:hidden` delivery item card editor.

### Delivery Notes in `/projects/purchase-orders/[id]`

- Current purpose: Display delivery notes and item receipts for a PO.
- Observations: Good card-based delivery history. POD file link is visible. Item received table provides traceability.
- Problems: Delivery notes are display-only; there is no edit/correct/cancel workflow.
- Missing states/workflows: Correction workflow, duplicate attachment handling, damaged/rejected item tracking.
- Mobile issues: Nested item table needs responsive cards.
- Accessibility concerns: "View POD File" should include delivery note number in accessible label.
- Recommended improvements: Add delivery note detail or edit route when business rules allow. Add correction history if edits are restricted.
- Priority: Medium.
- Suggested implementation notes: If corrections are sensitive, implement "void and re-record" with audit trail.

### Delivery Notes in `/projects/[id]`

- Current purpose: Aggregate delivery notes across project purchase orders.
- Observations: Useful project-level delivery visibility.
- Problems: Users must click through to PO details to act. There is no direct aggregate Delivery Notes route.
- Missing states/workflows: No global delivery note register, no filter by date/supplier/status, no export.
- Mobile issues: Aggregated rows need card layout.
- Accessibility concerns: Delivery note action buttons need explicit labels.
- Recommended improvements: Add `/projects/deliveries` or a Project Management nav item for Delivery Notes once volume grows.
- Priority: Medium.
- Suggested implementation notes: Start with a filtered table backed by existing PO delivery data.

## Recommended Delivery Workflow

1. Open PO detail.
2. Review ordered, delivered, and outstanding quantities.
3. Record delivery note with recipient, date, proof, and item quantities.
4. Automatically update PO status to partially delivered or delivered.
5. Show delivery note in PO and project workspace.
6. Allow controlled correction/void workflow.

## Delivery-Specific Dashboard Widgets

- Expected deliveries this week
- Overdue expected deliveries
- Partially delivered POs
- Recent delivery notes
- Delivery value received this month
- Outstanding value by project

