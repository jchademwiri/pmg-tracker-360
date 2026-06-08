# Tracker App — Clients Module Audit

**Area:** Clients  
**Priority:** 🟡 Medium  
**Est. Effort:** 0.5 day  
**Related Issues:** #5, #14

---

## Clients Module

### Current State
- Stats cards: Total, With Contact, Missing Contact, Growth
- Responsive table (desktop) / card (mobile) layout
- Search by name, contact name, or email
- Inline delete with confirmation
- Dropdown menu: View Details, Edit, Delete

### Issues Found
| # | Severity | Issue |
|---|----------|-------|
| 1 | 🟡 Medium | **No client detail page preview** — The list shows "View Details" but the detail page content is unknown from this audit. |
| 2 | 🟡 Medium | **Hardcoded `alert()` for delete confirmation** — Uses browser `alert()` instead of a proper confirmation dialog component. |
| 3 | 🟢 Low | **"Growth" card is misleading** — Shows `+{totalClients}` which is just the total count, not actual growth. |
| 4 | 🟢 Low | **No client export** — Cannot export client list to CSV. |

### Suggestions
- Replace `alert()` with shadcn AlertDialog for consistent UX
- Fix "Growth" card to show actual growth (e.g., clients added this month)
- Add CSV export for client data
- Add client detail page with full history

---

## Files to Modify

- `apps/tracker/src/components/clients/client-list.tsx` — Replace alert(), add export
- `apps/tracker/src/app/(dashboard)/clients/page.tsx` — Fix growth card
