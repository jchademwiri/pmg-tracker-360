# PMG Tracker 360 – Calendar UI/UX Audit & Enhancement Report

This audit evaluates the current Calendar implementation in the **Tracker** application and details the engineering design system, backend modifications, and UI improvements required to elevate it into a premium, interactive operations console.

---

## Executive Summary

The current Calendar page has a solid technical base (utilizing FullCalendar with React, server actions, and Drizzle ORM). However, a review of the code reveals major UX bugs, layout inefficiencies, and feature gaps. The page renders a small two-column dashboard widget stretched full-width rather than the dedicated full-screen calendar component. Key operational milestones (like briefings, follow-up dates, and contract endings) are omitted, and clicking events results in flat routing to list views rather than interactive modals.

Transforming this into a **premium calendar** involves correcting the page-level component binding, enriching the database event aggregator, adding visual contextual icons, and integrating interactive action popovers for seamless workflow management.

---

## Part 1: Current State & UI/UX Issues

### 1. The Wrong Component is Rendered
- **Issue:** In [page.tsx](file:///D:/websites/pmg-tracker-360/apps/tracker/src/app/(dashboard)/calendar/page.tsx#L33), the page renders the `<ClientCalendar />` component. As defined in [client-calendar.tsx](file:///D:/websites/pmg-tracker-360/apps/tracker/src/components/dashboard/client-calendar.tsx#L5-L23), this component dynamically imports and returns the `<MiniCalendarWidget />`.
- **Impact:** The main `/calendar` page displays the small, dual-column dashboard mini-widget (half calendar grid, half upcoming list) instead of the rich, full-screen `<CalendarClient />` defined in [widget.tsx](file:///D:/websites/pmg-tracker-360/apps/tracker/src/app/(dashboard)/calendar/widget.tsx#L24-L321). The dedicated view with week/day navigation and filter panels is completely bypassed and unused.

### 2. Double & Static Headers (UI Mismatch)
- **Issue:** In the `<MiniCalendarWidget />`, a card header displays the current month using static React state:
  ```typescript
  const currentMonth = today.toLocaleString('default', { month: 'long', year: 'numeric' });
  ```
  Meanwhile, FullCalendar renders its own header toolbar (`headerToolbar={headerToolbar}`).
- **Impact:** The page displays **two competing header titles**. Worse, if a user navigates the calendar to next month via the next button, the FullCalendar view updates, but the Card Title remains stuck on the hardcoded current month, creating confusion.

### 3. Basic and Hardcoded Event Routing
- **Issue:** When an event is clicked in `<CalendarClient />`:
  ```typescript
  const onEventClick = useCallback((info: EventClickArg) => {
    if (info.event.classNames.includes('event-tender_submission')) {
      router.push(`/tenders`);
    } else {
      router.push(`/projects`);
    }
  }, [router]);
  ```
- **Impact:** Users are booted out of the calendar view and dropped onto a general, paginated list view where they must search for the item again. A premium experience should route users **directly to the specific item detail page** (e.g., `/tenders/[id]` or `/projects/[id]?tab=po`) or, ideally, open an overlay detail popover in context.

### 4. Limited Event Scopes
- **Issue:** The calendar only fetches three event types: `tender_submission`, `po_expected_delivery`, and `po_delivered`. 
- **Impact:** Critical dates already tracked in the database are missing:
  - **Tender Mandatory Briefings:** These are operational prerequisites and have scheduled dates.
  - **Tender Expiry / Validity Dates:** Key forecasting deadlines.
  - **Tender Follow-up Dates:** Action items for bid coordinators.
  - **Project Start/End Dates:** Milestones for project coordinators.

### 5. Lack of Mobile Adaptability
- **Issue:** The calendar is forced to load `dayGridMonth` on all screen sizes.
- **Impact:** Monthly grid cells squeeze into tiny vertical strips on mobile screens, wrapping text and hiding events under generic "+3 more" indicators, making the grid unusable on phones.

---

## Part 2: Blueprint for a Premium Calendar

To deliver an exceptional, premium user experience, the calendar must be upgraded across three layers: backend data capture, UI component composition, and visual aesthetics.

### 1. Visual Enhancements (Premium Styling)
- **Glassmorphism Theme:** Set container backgrounds to a translucent card base using Tailwind v4 OKLCH styling:
  ```css
  bg-card/45 backdrop-blur-md border-white/5 shadow-2xl
  ```
- **Fringe Indicator Badges:** Add custom event render styling in FullCalendar. Replace flat colored block text with interactive event rows featuring lead icons:
  - 📝 **Tender Submissions** (Indigo tint)
  - 🗣️ **Mandatory Briefings** (Amber tint, alerts if unattended)
  - 📞 **Follow-up Reminders** (Rose tint)
  - 🚚 **PO Expected Deliveries** (Sky tint)
  - ✅ **PO Delivered** (Emerald check badge)

### 2. Contextual Popover Details (No Flat Redirects)
- Instead of immediately routing away, clicking an event must anchor a Radix/Shadcn Popover or modal overlay displaying key metrics in context:
  ```
  ┌────────────────────────────────────────────────────────┐
  │ 📝 Tender Submission Deadline                          │
  ├────────────────────────────────────────────────────────┤
  │ ID: T-2026-0042                                        │
  │ Client: City of Cape Town                              │
  │ Value: R4,500,000                                      │
  │ Status: [ Evaluation ]                                 │
  ├────────────────────────────────────────────────────────┤
  │ [ View Tender Details ]      [ Mark Briefing Attended ]│
  └────────────────────────────────────────────────────────┘
  ```

### 3. Responsive Auto-View Switching
- Add window width listeners in the client component to dynamically swap FullCalendar views:
  - **Desktop ($\ge 768px$):** `dayGridMonth` or `timeGridWeek`.
  - **Mobile ($< 768px$):** `listMonth` or `timeGridDay` (agenda list view).

---

## Part 3: Step-by-Step Implementation Guide

### Phase 1: Backend Data Aggregator Enhancements
Modify `apps/tracker/src/server/calendar.ts` to expand filters and fetch additional operational dates.

#### 1. Update Types & Color Maps
```typescript
type CalendarEventType =
  | 'tender_submission'
  | 'tender_briefing'
  | 'tender_validity_expiry'
  | 'tender_follow_up'
  | 'project_start'
  | 'project_end'
  | 'po_expected_delivery'
  | 'po_delivered';

const EVENT_TYPE_TO_COLOR: Record<CalendarEventType, string> = {
  tender_submission: 'indigo',
  tender_briefing: 'amber',
  tender_validity_expiry: 'rose',
  tender_follow_up: 'purple',
  project_start: 'teal',
  project_end: 'cyan',
  po_expected_delivery: 'sky',
  po_delivered: 'emerald',
};
```

#### 2. Query Additions in `getCalendarEvents`
Extend Drizzle queries to pull the new dates:
- **Tender Briefing Sessions:** Select `briefingDate` where `briefingDate` falls in range.
- **Tender Validity Expiries:** Select `validityDate` where status is `'open'` or `'evaluation'`.
- **Tender Follow-up Log Items:** Fetch follow-up notes and next scheduled date.
- **Project Schedules:** Fetch `contractStartDate` and `contractEndDate`.

### Phase 2: Create Custom Event Component
Instead of plain text string events, use FullCalendar's `eventContent` property to render rich, icon-anchored React nodes.

```tsx
function renderEventContent(eventInfo: any) {
  const type = eventInfo.event.classNames[0]?.replace('event-', '');
  const title = eventInfo.event.title;
  
  return (
    <div className="flex items-center gap-1.5 px-1.5 py-0.5 w-full overflow-hidden text-xs">
      <span className="shrink-0">{getEventIcon(type)}</span>
      <span className="font-semibold truncate">{title}</span>
    </div>
  );
}

function getEventIcon(type: string) {
  switch (type) {
    case 'tender_submission': return '📝';
    case 'tender_briefing': return '🗣️';
    case 'tender_follow_up': return '📞';
    case 'po_expected_delivery': return '🚚';
    case 'po_delivered': return '✅';
    default: return '📅';
  }
}
```

### Phase 3: Bind the Page Component
Change the client boundary so `/calendar` utilizes the full interactive component instead of the mini-widget.

- **File to Modify:** `apps/tracker/src/app/(dashboard)/calendar/page.tsx`
- **Change:**
  ```diff
  -import { ClientCalendar } from '@/components/dashboard/client-calendar';
  +import { CalendarClient } from './widget';
  
   export default async function CalendarPage() {
     return (
       ...
  -      <Card className="flex flex-col flex-1 border-white/10 bg-card/50 backdrop-blur-sm shadow-xl overflow-hidden min-h-0">
  -        <CardContent className="p-4 flex-1 min-h-0 bg-background/40">
  -          <ClientCalendar className="h-full" />
  -        </CardContent>
  -      </Card>
  +      <div className="flex-1 min-h-0 bg-background/20 rounded-xl border border-white/5 overflow-hidden">
  +        <CalendarClient />
  +      </div>
     );
   }
  ```

---

## Part 4: Success Benchmarks

| Feature | Legacy Calendar | Premium Calendar |
|---------|-----------------|------------------|
| **Primary Render** | Mini Widget (Stretched) | Full page grid with month/week/day selectors |
| **Event Types** | 3 types (submissions, delivery expected/delivered) | 8 types (adding briefings, follow-ups, contract boundaries) |
| **Title Syncing** | Static/Frozen Month Header | Dynamic headers synced to FullCalendar state |
| **Mobile UX** | Tiny wrapped cells, illegible text | List View/Day Agenda auto-swapping |
| **Interactivity** | Simple link redirection to index pages | Radix Popover with detail summaries and quick action buttons |
| **Aesthetics** | Solid box colors | Translucent borders, gradient backing, visual icons |
