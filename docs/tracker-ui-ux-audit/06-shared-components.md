# Shared Components, Supporting Routes, and Cross-Cutting UI

## Shared Component Observations

Key shared components include:

- `StatusBadge`
- `MobileCard`
- `MobileFilterDrawer`
- `MobileBottomNav`
- `MobileActionBar`
- `MetricCard`
- `ErrorState`
- `EnhancedSkeleton`
- `DocumentManager`
- `FileUploader`
- `StepIndicator` and `StepActions`
- `ConfirmDialog` / `AlertDialog`
- Search, table, dialog, form, tabs, sidebar, card, badge, button primitives

The component foundation is solid, but usage is inconsistent. Some modules use mobile card patterns, others hand-roll cards. Some deletion flows use `AlertDialog`, while others use browser `confirm`. Some statuses use `StatusBadge`; others use local `Badge` classes. Some dark custom panels appear only in Project Workspace.

## Cross-Cutting Recommendations

### Status Badges

- Problem: Status labels and tones vary by module.
- Recommendation: Centralize status label, tone, icon, and workflow order for tenders, projects, POs, deliveries, risks, and billing.
- Priority: High.
- Implementation notes: Extend `StatusBadge` with domain-specific maps and test coverage.

### Tables

- Problem: Each list implements table controls differently.
- Recommendation: Create a shared admin table pattern with header, count, search, filters, active chips, empty states, pagination, mobile cards, row actions, and optional export.
- Priority: High.
- Implementation notes: Start by aligning Tender, Projects, POs, and Clients.

### Forms

- Problem: Multi-step forms exist but validation and navigation vary. Some forms use browser alerts.
- Recommendation: Standardize form shells: left-aligned title, context summary, stepper, inline errors, sticky actions, save/draft status, success/error toasts.
- Priority: High.
- Implementation notes: Use `react-hook-form` consistently and replace manual state forms where practical.

### Empty States

- Problem: Empty states exist but are mostly generic.
- Recommendation: Use domain-specific empty states with next action and explanation. Separate "empty database" from "no search results" from "no permission".
- Priority: Medium.
- Implementation notes: Reuse shared empty state components.

### Loading States

- Problem: Some pages use skeletons; some show plain loading text.
- Recommendation: Use skeletons for dashboard/table structure and spinners only inside buttons.
- Priority: Medium.
- Implementation notes: Extend existing loading components.

### Error and Permission States

- Problem: No-organization, not-found, and permission redirects vary.
- Recommendation: Create reusable `NoOrganizationState`, `PermissionDeniedState`, `RecordNotFoundState`.
- Priority: Medium.
- Implementation notes: Avoid redirect-only permission failures when users need context.

## Supporting Route Audit

### `/clients`

- Current purpose: Client directory with search, pagination, desktop table, and mobile cards.
- Observations: Strong supporting directory. Inline client creation is also available from Tender and Project forms.
- Problems: Header has nested `Link` and `Button asChild` misuse pattern. Search is immediate; no filters for client type/activity. Mobile cards are custom rather than shared `MobileCard`.
- Missing states/workflows: Client dedupe, merge, client activity timeline, related tenders/projects/POs summary.
- Mobile issues: Contact details can crowd cards.
- Accessibility concerns: Email/phone in table are text, not actionable links.
- Recommendation: Add client detail summary of related tenders/projects, use shared mobile card, add duplicate handling.
- Priority: Medium.
- Implementation notes: Make client directory a true relationship hub.

### `/clients/create`, `/clients/[id]/edit`

- Current purpose: Create/edit client contact records.
- Observations: Simple two-card form.
- Problems: Some muted text uses `text-gray-600` instead of theme tokens. No duplicate-name check before submit.
- Missing states/workflows: Address, organization type, multiple contacts, active/inactive.
- Mobile issues: Fine as stacked form.
- Accessibility concerns: Required field indication should be programmatic.
- Recommendation: Add duplicate warning and optional additional contacts later.
- Priority: Medium.

### `/clients/[id]`

- Current purpose: Client detail.
- Observations: Supports directory workflow.
- Problems: Needs to become a relationship view: tenders, projects, POs, contacts, notes.
- Missing states/workflows: Related record tabs and contact action history.
- Mobile issues: Use stacked sections.
- Accessibility concerns: Contact actions should be real links.
- Recommendation: Add related records and quick-create tender/project for client.
- Priority: Medium.

### `/settings`, `/settings/overview`, `/settings/notifications`, `/settings/profile`

- Current purpose: User and app settings.
- Observations: Profile has many subcomponents: security, privacy, preferences, password, organization info, email, avatar, activity.
- Problems: Settings route split is not obvious from main sidebar. Some content may be too deep for users to find.
- Missing states/workflows: Unsaved changes, notification preview, account deletion/export.
- Mobile issues: Profile tabs/sidebar should collapse into a select or segmented list.
- Accessibility concerns: Form errors, tab focus, and security actions need careful handling.
- Recommendation: Add Settings to sidebar/footer nav and unify page header/tabs.
- Priority: Medium.

### `/billing`, `/billing/upgrade`

- Current purpose: Billing and plan upgrade.
- Observations: Support route for subscription/plan.
- Problems: May feel disconnected from modules/permissions.
- Missing states/workflows: Payment failed, invoice history, plan limits, permission gating.
- Mobile issues: Pricing/plan comparisons should stack cleanly.
- Accessibility concerns: Plan selection must not rely on highlighted color only.
- Recommendation: Show current plan, limits used, upgrade CTA, billing history.
- Priority: Low to Medium.

### Auth Routes: `/login`, `/sign-up`, `/forgot-password`, `/reset-password`, `/check-email`

- Current purpose: Authentication and recovery.
- Observations: Shared auth forms exist.
- Problems: Auth success/failure states need consistent copy and links back to support.
- Missing states/workflows: Expired reset link, resend verification, organization invitation context.
- Mobile issues: Auth forms should remain single-column and avoid crowded nav.
- Accessibility concerns: Error summaries and password requirements should be readable by screen readers.
- Recommendation: Standardize auth form shell and recovery state copy.
- Priority: Medium.

### `/invite/accept/[invitationId]`

- Current purpose: Accept organization invitation.
- Observations: Important onboarding workflow.
- Problems: Needs clear states for invalid, expired, already accepted, sign-in required, and signup required.
- Missing states/workflows: Resend/request new invitation.
- Mobile issues: Keep as focused single task.
- Accessibility concerns: Status and error copy must be announced.
- Recommendation: Add explicit invitation state screen variants.
- Priority: High.

### `/onboarding`

- Current purpose: First organization setup.
- Observations: Used when no organization exists.
- Problems: Needs clear relationship to organization selection and create organization.
- Missing states/workflows: Invite-only users, skipped setup, organization creation failure.
- Mobile issues: Keep steps short.
- Accessibility concerns: Step state and validation.
- Recommendation: Make onboarding a guided organization/workspace setup.
- Priority: Medium.

### Public Routes: `/`, `/about`, `/blog`, `/careers`, `/contact`, `/help`, `/privacy`, `/terms`, `/training`, `/waitlist`

- Current purpose: Marketing, support, legal, training, and lead capture surfaces.
- Observations: Home page has marketing sections and authenticated user dashboard variant.
- Problems: These routes are outside the operational app but still share brand expectations. Public pages should not compete with authenticated dashboard clarity.
- Missing states/workflows: Contact/waitlist submission success/error, help search, training module progress.
- Mobile issues: Public pages need clear first viewport and readable forms.
- Accessibility concerns: Forms need labels, success/error feedback, and legal pages need clear headings.
- Recommendation: Keep public site visually related but separate from internal dashboard patterns.
- Priority: Low, except contact/waitlist form states are Medium.

### `not-found`

- Current purpose: 404 page.
- Observations: Top-level not-found exists.
- Problems: Domain records often render local "not found" states instead of using a consistent 404/empty state.
- Missing states/workflows: Back to dashboard, search, contact support.
- Mobile issues: Keep compact.
- Accessibility concerns: Clear heading and focus target.
- Recommendation: Create consistent not-found states for tender/project/PO/client records.
- Priority: Medium.

