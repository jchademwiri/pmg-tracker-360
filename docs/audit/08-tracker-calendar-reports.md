# Tracker App — Calendar & Reports Audit

**Area:** Calendar, Reports  
**Priority:** 🔴 Critical  
**Est. Effort:** 2-3 days  
**Related Issues:** #4, #21

---

## Calendar Module

### Current State
- Full-height calendar component
- Decorative background accents
- `ClientCalendar` component for rendering events

### Issues Found
| # | Severity | Issue |
|---|----------|-------|
| 1 | 🟡 Medium | **No event creation from calendar** — Calendar appears to be view-only. Should allow creating events/tenders directly from the calendar. |
| 2 | 🟢 Low | **No calendar integration** — No Google Calendar or Outlook sync capability. |

### Suggestions
- Add click-to-create functionality on calendar dates
- Add iCal/Google Calendar export for individual events
- Consider calendar integration (Google/Outlook sync)

---

## Reports Module

### Current State
- Stats cards with key metrics
- Two placeholder cards: "Tender Performance" and "Revenue Forecast" with "coming soon" messages

### Issues Found
| # | Severity | Issue |
|---|----------|-------|
| 1 | 🔴 High | **Reports are mostly placeholder** — The reports page is largely non-functional with "coming soon" placeholders. This is a critical gap for a SaaS product. |
| 2 | 🟡 Medium | **No data export** — Cannot export report data for external analysis. |

### Suggestions
- **Implement actual charts** using Recharts or Chart.js
- Add date range filtering for reports
- Add CSV/PDF export for reports
- Add win rate trend analysis over time

---

## Files to Modify

- `apps/tracker/src/components/dashboard/client-calendar.tsx` — Click-to-create
- `apps/tracker/src/app/(dashboard)/reports/page.tsx` — Implement charts
- `apps/tracker/src/components/reports/stats-cards.tsx` — Add export
