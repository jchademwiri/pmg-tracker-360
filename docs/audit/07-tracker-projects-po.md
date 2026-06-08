# Tracker App — Projects & Purchase Orders Audit

**Area:** Projects, Purchase Orders  
**Priority:** 🟡 Medium  
**Est. Effort:** 1 day  
**Related Issues:** #5, #22

---

## Projects Module

### Current State
- Responsive table/card layout with status badges
- Search and status filter
- Dropdown menu: View Details, Edit, Delete
- Linked to tenders and clients

### Issues Found
| # | Severity | Issue |
|---|----------|-------|
| 1 | 🟡 Medium | **Hardcoded `alert()` for delete** — Same issue as clients module. |
| 2 | 🟡 Medium | **No project timeline view** — Projects lack a visual timeline or Gantt chart for tracking milestones. |
| 3 | 🟢 Low | **No project-tender link visualization** — The tender link is shown as text but not clickable to navigate to the tender. |

### Suggestions
- Replace `alert()` with AlertDialog
- Add project timeline/milestone view
- Make tender links clickable for navigation
- Add project budget tracking

---

## Purchase Orders Module

### Current State
- PO creation and management linked to projects
- Status workflow: draft → sent → delivered
- Delivery date tracking

### Issues Found
| # | Severity | Issue |
|---|----------|-------|
| 1 | 🟡 Medium | **Limited PO details** — Schema has `poDate` and `deliveryAddress` fields but the migration schema doesn't include `poDate`. Possible schema drift. |
| 2 | 🟢 Low | **No PO PDF generation** — Cannot generate printable PDF purchase orders. |

### Suggestions
- Verify schema consistency between source and migrations
- Add PDF generation for purchase orders
- Add PO approval workflow

---

## Files to Modify

- `apps/tracker/src/components/projects/project-list.tsx` — Replace alert(), clickable links
- `apps/tracker/src/app/(dashboard)/projects/page.tsx` — Project page
- `apps/tracker/src/components/purchase-orders/` — PDF generation
