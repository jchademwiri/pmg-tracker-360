# PMG Tracker 360: UI/UX Assessment & Recommendations

This document provides a UI/UX and accessibility audit of the PMG Tracker 360 customer journey. It focuses on styling choices, typography, dark-mode styling variables, input formatting, form validations, screen-reader focus handling, skip-links, responsive tables, loading/skeleton UI, and recommendations to align the application with modern web standards and the South African procurement context.

---

## 1. Visual Aesthetics & Styling Audit

### Current Status:
* The application uses **Tailwind CSS 4** for styling and standard CSS variables inside [globals.css](../../apps/tracker/src/app/globals.css).
* The brand palette features Navy Blue (`--color-brand-navy: #1a3a52`) and Gold (`--color-brand-gold: #d4af37`), designed to appeal to professional South African businesses.

### Assessment & UI Critique:
1. **Inconsistent Dark Mode Transitions**: While the CSS variables support OS-level dark mode (`prefers-color-scheme`), the components do not always use theme-aware background colors. For example, some cards utilize explicit `bg-white` classes, which creates eye strain when the rest of the application transitions to dark.
2. **Basic / Generic Dashboard Widgets**: The dashboard widgets are flat cards with basic text statistics. A premium dashboard should use rich layouts, clean borders, glassmorphic cards (`backdrop-blur` with subtle translucent backgrounds), and dynamic animations for load states.
3. **Status Badges Lack Visual Cohesion**: The status badges use tailwind colors like red, green, and blue, but they lack a unified style. In [tender-details.tsx](../../apps/tracker/src/components/tenders/tender-details.tsx), the statuses are styled with custom borders:
   * `open`: `bg-green-100/10 text-green-400 border border-green-500/20`
   * `closed`: `bg-zinc-800 text-zinc-400 border border-zinc-700/30`
   * However, on the table list views, the status badges look different, creating visual inconsistency.
4. **Suboptimal Typography Fallbacks**: 
   * The font configuration in `globals.css` overrides `--font-geist-sans` with `Arial, Helvetica, sans-serif` and `--font-geist-mono` with `"Courier New", monospace`.
   * There are no Next.js google font imports (like `Geist`, `Inter`, or `Roboto`) configured in `layout.tsx`. This results in standard browser system font rendering, which lacks the professional, premium polish expected from a high-quality SaaS dashboard.

---

## 2. Forms & Data Input Experience

### Current Status:
* Forms are built using `react-hook-form` and `zod` validation, wrapped with standard Shadcn UI field components.

### Gaps and Recommendations:

#### 1. ZAR Currency Formatting & Icons (Critical Input Friction)
Public sector tenders and POs deal with large currency figures (e.g. millions of Rands). 
* **The Issue**: Currently, the tender value and PO amount fields are raw inputs. The user has to type numbers without commas, or is allowed to type random characters. 
* **Currency Sign Discrepancy**: In [tender-form.tsx](../../apps/tracker/src/components/tenders/tender-form.tsx#L399), the form displays a `<DollarSign />` icon instead of a Rand representation (`R` or `ZAR`), which is inappropriate for a South African procurement context. The PO form lacks any visual currency prefix whatsoever.
* **The UX Recommendation**: Replace the dollar sign with a Rand (`R`) prefix. Implement an input masking component or a ZAR currency formatter hook that displays formatted figures in real-time as the user types (e.g., displaying `R 150 000,00` instead of `150000`), while storing clean numeric floats in the database.

#### 2. Long Form Cognitive Overload
Creating a tender requires filling in basic details, client info, submission timelines, values, and uploading files. 
* **The Issue**: Everything is presented on a single, long form page in [tender-form.tsx](../../apps/tracker/src/components/tenders/tender-form.tsx). This creates high cognitive load and increases form abandonment or input errors.
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

#### 6. Critical Functional Blocker in Tender Extension Form
* **The Issue**: In [extension-form.tsx](../../apps/tracker/src/components/tenders/extension-form.tsx#L70-L81), the form submission logic strictly enforces that a file (the extension letter) must be uploaded (`if (!file) { toast.error('File Required'); return; }`). However, the UI JSX does not contain a file input element, rendering a static placeholder message instead: `"File upload is currently unavailable - Coming soon in a future update"`. This prevents users from ever submitting a tender extension.
* **The UX Recommendation**: Add an actual file input element to the form, or make the file optional in the submission validation logic until the upload service is fully integrated.

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
* **The Issue**: Native browser confirmation popups feel unpolished, are inaccessible to some keyboard users, and disconnect the user from the premium branding of the application.
* **The UX Recommendation**: Replace all native `confirm()` statements with a custom reusable `<AlertDialog>` component from the UI library, styled with brand colors, a clear explanation of consequences, and a double-confirmation input for high-impact actions (like organization deletion).

#### 2. Transition Animations & Micro-interactions
* **The Issue**: Moving between pipeline stages (e.g. marking a tender as Won, which auto-creates a project) happens instantly, causing abrupt screen jumps. The user is redirected to `/dashboard/projects/[id]/edit` without any celebration or visual confirmation of their success.
* **The UX Recommendation**: When a user marks a tender as Won, trigger a celebratory micro-animation (e.g., brief confetti overlay or a gold-accented "Tender Won!" modal) before redirecting them to the project workspace. This positive reinforcement enhances user satisfaction.

---

## 4. Accessibility, Focus Management & Layout Adaptability

### Current Status:
* The dashboard features a collapsible sidebar that responds to screen sizes.
* Data tables gracefully collapse into mobile card layouts below `768px` (implemented in clients, tenders, and PO lists), which is an excellent UX pattern.

### Gaps and Recommendations:

#### 1. Incomplete Skip-Link Navigation
* **The Issue**: The `SkipNavigation` component is only imported and rendered on a single sub-page (`app/(dashboard)/settings/profile/page.tsx`). It is completely missing from the global root layout and the dashboard layout.
* **Structural Selector Bug**: The skip link targets `main, [role="main"]` to skip to main content. However:
  1. The root layout's `<main>` wraps the entire application, including the sidebar.
  2. The dashboard layout houses the page contents inside a plain `div` wrapper.
  This means that if a skip link is clicked, focus is shifted to the root `<main>` containing the sidebar, failing to actually skip the sidebar navigation.
* **The UX Recommendation**: Move the `SkipNavigation` component to the global dashboard layout. Change the dashboard's content wrapper from a `div` to a `<main id="main-content" tabIndex={-1} ...>` element, and configure the skip links to target `#main-content`.

#### 2. Missing Form Error Screen-Reader Announcements
* **The Issue**: A focus management utility `useFormFocusManagement()` exists to focus the first form error field and announce the error to screen readers. However, it is only integrated into `profile-form.tsx` and `password-form.tsx`. Core forms (Tender, Client, PO, Project, Extension) do not use this hook, meaning screen-reader users receive no dynamic feedback when a form submission fails validation.
* **The UX Recommendation**: Integrate `useFormFocusManagement` across all client, project, purchase order, and tender forms.

#### 3. Table Loading UI Lacks Skeleton States
* **The Issue**: When data is being loaded or searched in Tenders, Clients, and PO tables, the application displays a raw text spinner (`"Loading tenders..."`, `"Loading clients..."`). This causes layout shifting and looks unpolished.
* **The UX Recommendation**: Implement visual skeleton screens (using the existing `<Skeleton>` UI component) to represent the table rows while loading, reducing layout shift and improving perceived performance.

---

## 5. Performance-Related UX & Asset Health

### Current Status:
* The dashboard page uses Next.js `<Suspense>` boundaries around the metrics and charts component blocks.
* Skeletons are defined for metrics and charts but do not cover the header action buttons.

### Gaps and Recommendations:

#### 1. Page-Blocking Header Permissions Check (Perceived Performance Gap)
* **The Issue**: In the main Dashboard page, the action buttons (e.g., "Create PO", "Create Project") are rendered conditionally based on permissions resolved via async server calls. Because these calls are awaited directly in the main page component, it forces sequential blocking execution before Next.js can stream the page wrapper or layout. This delays the Time to First Byte (TTFB).
* **The UX Recommendation**: Run permission checks concurrently using `Promise.all` or delegate button rendering to a Client Component that reads user context, allowing the page outline to render instantly.

#### 2. Missing Brand Assets & Social Previews (Perceived Quality Gap)
* **The Issue**: Sharing the app URL on professional channels (LinkedIn, Slack, WhatsApp) shows a generic broken card because the referenced `/og-image.png` and `/icon.png` do not exist in the public directory.
* **The UX Recommendation**: Generate a cohesive high-resolution OpenGraph preview card image (`og-image.png`) with brand assets and store it in `/public` alongside the missing high-res platform icons.

---

## 6. UI/UX Actionable Checklist for Developers

- [ ] **Next.js Web Fonts**: Integrate Google Web Fonts (e.g. Geist or Inter) in the root layout to replace browser-default fallback typography.
- [ ] **ZAR Currency Input Mask**: Replace raw text inputs for tender/PO values with formatted currency text fields.
- [ ] **South African Rand Symbols**: Replace `<DollarSign />` icons in forms with `R` or `ZAR` labels.
- [ ] **Shadcn AlertDialogs**: Replace all native browser `confirm()` and `alert()` calls with customized Alert Dialog components.
- [ ] **Global Skip Links**: Render `<SkipNavigation>` globally in the dashboard layout and refactor layouts to use `<main id="main-content" tabIndex={-1}>`.
- [ ] **Form Error Focus Trap & Announcements**: Wire up `useFormFocusManagement` in the Tender, PO, Project, Client, and Extension forms.
- [ ] **Tender Extension Form File Upload Fix**: Add a file upload input element or make the file optional to fix the form blocker.
- [ ] **Table Skeleton States**: Replace plain text loaders with animated row skeletons inside lists.
- [ ] **Celebration Loops**: Add a "Tender Awarded" celebration animation or transition slide.
- [ ] **Multi-step Bid Wizard**: Break the long tender creation form into a 3-step wizard with a progress indicator.
- [ ] **Invite UI on Onboarding**: Add a panel on the onboarding screen showing pending invitations for the registered email address.
- [ ] **Organization Switcher Fix**: Bind the organization selector items to a click handler that invokes the `authClient.organization.setActive()` method before redirecting.
- [ ] **Local Calendar Date Picker**: Implement a timezone-safe local date formatter for date pickers to prevent the one-day backward shifting issue.
- [ ] **Concurrent Header Permissions**: Parallelize permissions checks in the dashboard header or move them to a client-side layout shell to prevent layout/stream blocking.
- [ ] **Static Brand SEO Assets**: Create and save the missing `/og-image.png` and `/icon.png` brand assets to the `public/` directory.
