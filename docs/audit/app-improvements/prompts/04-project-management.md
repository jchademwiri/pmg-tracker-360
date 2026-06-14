# 04 – Project Management Mini Dashboard

**Purpose:** When the user clicks **Project Management**, the first page should be a project and PO mini dashboard that quickly communicates the health of active projects and purchase orders.

**Depends on:** [01-codebase-audit.md](./01-codebase-audit.md), [02-dashboard-audit.md](./02-dashboard-audit.md)
**Feeds into:** [05-workflow.md](./05-workflow.md), [09-forms-data-capture.md](./09-forms-data-capture.md)

---

## A. Project Overview Section

Suggest KPI cards such as:
- Total active projects
- Projects created from awarded tenders
- Projects in progress
- Projects awaiting PO
- Projects with open POs
- Projects delayed
- Projects completed this month
- Total PO value
- Pending PO value
- Delivered PO value
- Partially delivered POs
- Overdue deliveries

## B. Project Register

Recommend how the project register should be structured:
- Columns, filters, search
- Status badges, progress indicators
- Client filters, PO status indicators
- Row actions
- Mobile card layout

## C. Project Detail Page

Recommend the ideal structure:
- Project summary
- Linked tender details (if applicable)
- Client details
- Contract/appointment details
- Start date and expected completion date
- Project status
- PO summary
- Delivery progress
- Documents
- Activity log
- Notes
- Risks/issues
- Completion status

## D. Purchase Order Management

Audit and improve the PO flow. The app should support:
1. Create PO under project
2. Capture PO number
3. Capture supplier/client details where applicable
4. Add PO items
5. Track ordered items
6. Track partial deliveries
7. Track fully delivered items
8. Track outstanding quantities
9. Track delivery notes
10. Track invoices, if applicable
11. Mark PO as complete
12. Link PO status back to project progress

### Recommended PO Statuses
- Draft → Issued → Awaiting Delivery → Partially Delivered → Delivered → Completed
- Cancelled
- Disputed / On Hold

### PO UI Recommendations
Recommend the best UI for PO tables, PO detail pages, delivery tracking, and partial delivery handling.

---

## Cross-References

- **Depends on:** [01-codebase-audit.md](./01-codebase-audit.md), [02-dashboard-audit.md](./02-dashboard-audit.md)
- **Next:** [05-workflow.md](./05-workflow.md), [09-forms-data-capture.md](./09-forms-data-capture.md)
- **Related:** [03-tender-management.md](./03-tender-management.md) (tender-to-project handoff), [06-mobile-ux.md](./06-mobile-ux.md) (project views on mobile)
- **See also:** [00-index.md](./00-index.md) for full execution strategy
