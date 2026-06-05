# PMG Tracker 360: UI/UX Assessment & Recommendations

This document provides a UI/UX audit of the PMG Tracker 360 customer journey. It focuses on styling choices, visual hierarchy, user feedback loops, currency inputs, responsive layouts, and recommendations to align the application with modern web standards and the South African procurement context.

---

## 1. Visual Aesthetics & Styling Audit

### Current Status:
* The application uses **Tailwind CSS 4** for styling and standard CSS variables inside [globals.css](file:///D:/websites/pmg-tracker-360/apps/tracker/src/app/globals.css).
* The brand palette features Navy Blue (`--color-brand-navy: #1a3a52`) and Gold (`--color-brand-gold: #d4af37`), designed to appeal to professional South African businesses.

### Assessment & UI Critique:
1. **Inconsistent Dark Mode Transitions**: While the CSS variables support OS-level dark mode (`prefers-color-scheme`), the components do not always use theme-aware background colors. For example, some cards utilize explicit `bg-white` classes, which creates eye strain when the rest of the application transitions to dark.
2. **Basic / Generic Dashboard Widgets**: The dashboard widgets are flat cards with basic text statistics. A premium dashboard should use rich layouts, clean borders, glassmorphic cards (`backdrop-blur` with subtle translucent backgrounds), and dynamic animations for load states.
3. **Status Badges Lack Visual Cohesion**: The status badges use tailwind colors like red, green, and blue, but they lack a unified style. In [tender-details.tsx](file:///D:/websites/pmg-tracker-360/apps/tracker/src/components/tenders/tender-details.tsx), the statuses are styled with custom borders:
   * `open`: `bg-green-100/10 text-green-400 border border-green-500/20`
   * `closed`: `bg-zinc-800 text-zinc-400 border border-zinc-700/30`
   * However, on the table list views, the status badges look different, creating visual inconsistency.

---

## 2. Forms & Data Input Experience

### Current Status:
* Forms are built using `react-hook-form` and `zod` validation, wrapped with standard Shadcn UI field components.

### Gaps and Recommendations:

#### 1. ZAR Currency Formatting (Critical Input Friction)
Public sector tenders and POs deal with large currency figures (e.g. millions of Rands). 
* **The Issue**: Currently, the tender value and PO amount fields are raw text inputs. The user has to type numbers without commas, or is allowed to type random characters. There is no automatic currency formatting (e.g., typing `150000` should display as `R 150 000,00` or `R 150,000.00`).
* **The UX Recommendation**: Implement an input masking component or a ZAR currency formatter hook that displays formatted figures in real-time as the user types, while storing clean numeric floats in the background.

#### 2. Long Form Cognitive Overload
Creating a tender requires filling in basic details, client info, submission timelines, values, and uploading files. 
* **The Issue**: Everything is presented on a single, long form page in [tender-form.tsx](file:///D:/websites/pmg-tracker-360/apps/tracker/src/components/tenders/tender-form.tsx). This creates high cognitive load and increases form abandonment or input errors.
* **The UX Recommendation**: Transition long forms into a multi-step tabbed wizard (Step 1: Tender Details, Step 2: Client & Compliance, Step 3: Timelines & Value, Step 4: Documents).

#### 3. Dynamic Client Creation UX
When creating a tender, the user must select a Client. If the client doesn't exist, they can open the `ClientCreateDialog` inline.
* **The Issue**: While the inline creation dialog is a good idea, after creating the client, the dropdown does not visually highlight or animate the newly created client, leading to a brief moment of confusion about whether the client was successfully added and selected.
* **The UX Recommendation**: Add a subtle toast notification ("Client 'City of Joburg' added and selected") and scroll the dropdown item into view with a highlighted flash animation.

#### 4. Broken URL Preview in Organization Creation
During onboarding, the user creates their organization and its URL slug.
* **The Issue**: The "URL Preview" displays a path that does not exist in the application workspace (`/dashboard/settings/organization/[slug]`). The actual route structure utilizes `/dashboard/organization/[slug]`. This misleads the user regarding their organization workspace location.
* **The UX Recommendation**: Correct the preview string to display `/dashboard/organization/[slug]` to ensure the onboarding experience is accurate.

#### 5. Date Timezone Shift on Calendar Inputs
Date components in the Tender and PO forms display incorrect dates after saving.
* **The Issue**: Form values are converted using `.toISOString().split('T')[0]`. Since South Africa runs on SAST (UTC+2), a Date representing local midnight (00:00:00) gets converted to the previous day at 22:00:00 UTC, causing the date input to retroactively shift back by one day on the UI calendar.
* **The UX Recommendation**: Use local timezone date string formatter utility functions (e.g. `YYYY-MM-DD` formatting based on local timezone offsets or native date methods like `.toLocaleDateString()` with custom formats) instead of converting directly to UTC via `.toISOString()`.

---

## 3. User Feedback & Interactive State Loops

### Current Status:
* Actions like creating a tender or deleting a PO show raw alerts or basic redirect behaviors.

### Gaps and Recommendations:

#### 1. Confirmations and Destructive Actions
Deleting a tender, client, or PO uses browser-native `confirm()` dialogs:
```typescript
if (!confirm('Are you sure you want to delete this tender? ...')) return;
```
* **The Issue**: Native browser confirmation popups feel unpolished and disconnect the user from the premium branding of the application.
* **The UX Recommendation**: Replace all native `confirm()` statements with a custom reusable `<AlertDialog>` component from the UI library, styled with brand colors, a clear explanation of consequences, and a double-confirmation input for high-impact actions (like organization deletion).

#### 2. Transition Animations & Micro-interactions
* **The Issue**: Moving between pipeline stages (e.g. marking a tender as Won, which auto-creates a project) happens instantly, causing abrupt screen jumps. The user is redirected to `/dashboard/projects/[id]/edit` without any celebration or visual confirmation of their success.
* **The UX Recommendation**: When a user marks a tender as Won, trigger a celebratory micro-animation (e.g., brief confetti overlay or a gold-accented "Tender Won!" modal) before redirecting them to the project workspace. This positive reinforcement enhances user satisfaction.

---

## 4. Mobile Responsiveness & Layout Adaptability

### Current Status:
* The dashboard features a collapsible sidebar that responds to screen sizes.
* Data tables use horizontal scrolling on mobile.

### Gaps and Recommendations:

#### 1. Data Tables on Mobile Screens
* **The Issue**: The tender and PO tables become difficult to navigate on mobile devices, forcing users to scroll horizontally back and forth to see columns like values, dates, and status.
* **The UX Recommendation**: Implement responsive table cards for smaller screens. On mobile views, collapse each table row into a structured card block displaying key fields (Tender No, Client Name, Status badge, and Value) stacked vertically, hiding secondary metadata like creation dates.

---

## 5. UI/UX Actionable Checklist for Developers

- [ ] **ZAR Currency Input Mask**: Replace raw text inputs for tender/PO values with formatted currency text fields.
- [ ] **Shadcn AlertDialogs**: Replace all native browser `confirm()` calls with a customized Alert Dialog component.
- [ ] **Celebration Loops**: Add a "Tender Awarded" celebration animation or transition slide.
- [ ] **Multi-step Bid Wizard**: Break the long tender creation form into a 3-step wizard with a progress indicator.
- [ ] **Invite UI on Onboarding**: Add a panel on the onboarding screen showing pending invitations for the registered email address.
- [ ] **Mobile-Friendly Cards**: Collapse desktop tables into card layouts on screen widths below `768px`.
- [ ] **Unified Status Badges**: Standardize status badge sizes, typography, and theme variables across all dashboard tables and detail headers.
- [ ] **Organization Switcher Fix**: Bind the organization selector items to a click handler that invokes the `authClient.organization.setActive()` method before redirecting.
- [ ] **Local Calendar Date Picker**: Implement a timezone-safe local date formatter for date pickers to prevent the one-day backward shifting issue.
