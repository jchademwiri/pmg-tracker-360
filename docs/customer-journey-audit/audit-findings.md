# PMG Tracker 360: Detailed Audit Findings

This document outlines the detailed audit findings for each phase of the PMG Tracker 360 customer journey, from user onboarding to purchase order delivery. Each section analyzes the current implementation, identifies logical and operational gaps, and highlights security vulnerabilities or code discrepancies.

---

## Phase 1: Signup, Login, and Onboarding

### Current Implementation:
* Users register via [sign-up-form.tsx](file:///D:/websites/pmg-tracker-360/apps/tracker/src/components/shared/forms/sign-up-form.tsx) or log in via [login-form.tsx](file:///D:/websites/pmg-tracker-360/apps/tracker/src/components/shared/forms/login-form.tsx).
* If the user doesn't have an active organization, they are redirected to `/onboarding` which uses [onboarding/page.tsx](file:///D:/websites/pmg-tracker-360/apps/tracker/src/app/onboarding/page.tsx) and displays the [create-organization-form.tsx](file:///D:/websites/pmg-tracker-360/apps/tracker/src/components/shared/forms/create-organization-form.tsx).
* Organization selection is handled by the [OrganizationSelector](file:///D:/websites/pmg-tracker-360/apps/tracker/src/components/organization-selector.tsx) component.

### Gaps and Issues:

#### 1. Onboarding Force-Creation Trap (User Flow Gap)
If a user is invited to an organization via email (using Better Auth's invitation system), their registration process should lead to accepting the invitation. However, if they land on the onboarding page, they are presented *only* with the `CreateOrganizationForm`. There is no list of pending invitations or an option to accept them, forcing the user to create a redundant organization just to bypass the onboarding screen.

#### 2. Broken Organization Switcher (Functional Bug)
In [organization-selector.tsx](file:///D:/websites/pmg-tracker-360/apps/tracker/src/components/organization-selector.tsx), when listing organizations that the user belongs to, the buttons are rendered as:
```typescript
<Button
  key={org.id}
  asChild
  variant={activeOrganization?.id === org.id ? 'default' : 'outline'}
  className="w-full justify-start"
>
  <Link href="/dashboard">
    <span className="font-medium">{org.name}</span>
  </Link>
</Button>
```
* **The Bug**: Clicking these buttons simply navigates to `/dashboard` without updating the active organization in Better Auth. The client side never calls `authClient.organization.setActive({ organizationId: org.id })`. If a user belongs to multiple organizations, they cannot switch between them, and the dashboard will continue showing the data of whichever organization happens to be cached as active.

#### 3. Mismatched Organization Slug Preview URL (UI/UX Bug)
In the organization creation form, [create-organization-form.tsx](file:///D:/websites/pmg-tracker-360/apps/tracker/src/components/shared/forms/create-organization-form.tsx#L475-L484), the "URL Preview" displays `/dashboard/settings/organization/{slug}`:
```typescript
<Badge variant="secondary" className="text-xs font-mono">
  /dashboard/settings/organization/{field.value}
</Badge>
```
* **The Bug**: There is no `/dashboard/settings/organization/[slug]` route in the application workspace. The actual organization workspace and settings routes are:
  - Organization Dashboard: `/dashboard/organization/[slug]`
  - Organization Settings: `/dashboard/organization/[slug]/settings`
* **The Impact**: Users are shown an incorrect, broken URL preview during organization onboarding, which misleads them about the route structure.

#### 4. Insecure Settings Overview Route (Security/Access Control Gap)
In [overview/page.tsx](file:///D:/websites/pmg-tracker-360/apps/tracker/src/app/%28dashboard%29/settings/overview/page.tsx), the server page component renders without validating the user session. 
* **The Bug**: Unlike other settings pages, this page completely omits a call to `getCurrentUser()`. While it currently displays static layouts and mock settings data (e.g. Profile completion 85%), this lack of authorization gate exposes the route structure to unauthenticated sessions.

#### 5. Critical Privilege Escalation in Admin Console (`createSystemAdmin`)
In [actions.ts](file:///D:/websites/pmg-tracker-360/apps/admin/src/app/actions.ts#L152-L205), the public server action `createSystemAdmin` is exposed as an HTTP endpoint.
* **The Bug**: While the setup page at `/setup` redirects users to `/login` if at least one administrator exists in the system, the server action `createSystemAdmin` itself performs no validation on the caller or database state.
* **The Vulnerability**: Any unauthenticated client can send a direct POST request to invoke `createSystemAdmin` with a custom email and password. This will register a new user and escalate their role to `admin` (or promote an existing user to `admin`), completely bypassing initial setup guards and granting unauthorized full access to the admin console.

#### 6. Missing Admin CSRF and Trusted Origins Configuration
In [auth.ts](file:///D:/websites/pmg-tracker-360/apps/admin/src/lib/auth.ts), the Better Auth configuration does not specify a `trustedOrigins` parameter.
* **The Bug**: Unlike the tracker app, the admin app lacks a list of trusted origins.
* **The Vulnerability**: In cross-subdomain settings, Better Auth checks request origins against trusted origins for CSRF validation. The absence of `trustedOrigins` can result in CSRF protection bypasses or unexpected origin blockages during cross-subdomain redirections between the main site (`tendertrack360.co.za`) and the admin subdomain (`admin.tendertrack360.co.za`).

#### 7. Session Caching and Redundant Database Queries (Performance Vulnerability)
In [users.ts](file:///D:/websites/pmg-tracker-360/apps/tracker/src/server/users.ts#L12-L35), the `getCurrentUser` server action retrieves the user session by calling `auth.api.getSession` and then queries the database for the user record.
* **The Bug**: Neither the tracker app nor the admin app configures session caching (e.g. secondary storage like Redis/KV or cookieCache strategies). Furthermore, `getCurrentUser()` is called repeatedly across multiple React Server Components and layouts during a single page request cycle, but it is not wrapped in React's `cache` wrapper.
* **The Impact**: This triggers redundant database roundtrips to retrieve the session and user data multiple times per page load, causing a performance bottleneck and exposing the application database to denial of service under modest traffic volumes.

---

## Phase 2: Client Management

### Current Implementation:
* Clients (government departments or private entities) are created and managed via server actions in [clients.ts](file:///D:/websites/pmg-tracker-360/apps/tracker/src/server/clients.ts).
* Clients are stored in the `client` table in [schema.ts](file:///D:/websites/pmg-tracker-360/packages/db/src/schema.ts).

### Gaps and Issues:

#### 1. Critical Authorization Bypass (Security Vulnerability)
Server actions in [clients.ts](file:///D:/websites/pmg-tracker-360/apps/tracker/src/server/clients.ts) (such as `createClient`, `updateClient`, `deleteClient`, `getClients`, and `searchClients`) **completely lack session or role-based permission checks**. They only take `organizationId` as a raw string argument. 
* **The Vulnerability**: Since Server Actions are public HTTP endpoints, any malicious client can POST a request to these actions with arbitrary organization IDs and create, edit, or delete client data without being authenticated.

#### 2. Embedded Contact Limitations (Data Design Gap)
The `client` table in the database schema stores contact details as flat columns:
* `contactName: text('contact_name')`
* `contactEmail: text('contact_email')`
* `contactPhone: text('contact_phone')`
* **The Gap**: In public procurement, bids are handled by multiple departments and contact people (e.g. SCM officer for admin queries, Technical Engineer for scope queries, Bid Committee Chair). A flat single-contact schema prevents tracking multiple communication points for a single government department client.

---

## Phase 3: Tender Opportunity and Bid Tracking

### Current Implementation:
* Tenders are created and managed using [tender-form.tsx](file:///D:/websites/pmg-tracker-360/apps/tracker/src/components/tenders/tender-form.tsx) and server actions in [tenders.ts](file:///D:/websites/pmg-tracker-360/apps/tracker/src/server/tenders.ts).
* Status is resolved dynamically based on submission date using `resolveTenderStatus` in [tender-utils.ts](file:///D:/websites/pmg-tracker-360/apps/tracker/src/lib/tender-utils.ts).

### Gaps and Issues:

#### 1. Critical Authorization Bypass (Security Vulnerability)
Similar to client actions, server actions in [tenders.ts](file:///D:/websites/pmg-tracker-360/apps/tracker/src/server/tenders.ts) (including `createTender`, `updateTender`, `updateTenderStatus`, `deleteTender`, and `getTenders`) **do not perform any authentication or membership validation**. Unauthenticated users can read or mutate tender data for any organization.

#### 2. Numerical Performance Bottleneck (Database Design Gap)
The `tender.value` column is defined in the database as:
* `value: text('value')`
* **The Gap**: Storing financial values as text strings makes it impossible to perform database-level operations like `SUM(value)` or sorting/filtering by price range. To generate the metrics in [reports.ts](file:///D:/websites/pmg-tracker-360/apps/tracker/src/server/reports.ts) or [dashboard-data.ts](file:///D:/websites/pmg-tracker-360/apps/tracker/src/lib/dashboard-data.ts), the application has to fetch all tender rows into memory, parse the strings in JavaScript, and aggregate them. This will cause slow page loads and crash servers once the organization has a realistic volume of tenders.

#### 3. Missing Mandatory Clarification Meetings (South African Context Gap)
Public tenders in South Africa frequently require attending a **mandatory clarification meeting / briefing session**. Failing to sign the attendance register at this meeting results in instant disqualification. 
* **The Gap**: The system has no way to track briefing meeting dates, meeting locations, mandatory status, or whether the team attended them, introducing a high operational risk of missed sessions.

#### 4. Missing Bid Compliance Checklist (Operational Gap)
Submitting a public sector bid requires a strict compliance dossier:
* CSD (Central Supplier Database) registration report
* Tax Compliance Pin
* BBBEE Affidavit or Verification Certificate
* Municipal rates clearance certificate
* Standard Bidding Documents (MBD 4, 6.1, 8, 9)
* **The Gap**: The customer journey provides no compliance checklist. Bidding teams must track documents externally, leading to administrative disqualifications.

#### 5. Date Timezone Shift on Calendars (Data Integrity Bug)
In [tender-form.tsx](file:///D:/websites/pmg-tracker-360/apps/tracker/src/components/tenders/tender-form.tsx#L369-L375), the `submissionDate` calendar value is formatted as:
```typescript
value={
  field.value
    ? new Date(field.value)
        .toISOString()
        .split('T')[0]
    : ''
}
```
* **The Bug**: Using `new Date(field.value).toISOString()` converts the Date object to a UTC string. For users in South Africa (SAST, UTC+2), a Date representing midnight (e.g., `2026-06-05 00:00:00`) translates to `2026-06-04T22:00:00.000Z` in UTC. Splitting by `'T'` extracts `"2026-06-04"`, shifting the date on the calendar back by one full day.
* **The Impact**: This causes serious date discrepancies and errors when viewing or editing existing tender submission dates.

---

## Phase 4: Validity Extension Management

### Current Implementation:
* Tenders validity can be extended via [tenderExtension](file:///D:/websites/pmg-tracker-360/packages/db/src/schema.ts) records, created in [extensions.ts](file:///D:/websites/pmg-tracker-360/apps/tracker/src/server/modules/extensions.ts).
* Creating an extension automatically updates the tender's `evaluationDate` to the `newEvaluationDate`.

### Gaps and Issues:

#### 1. One-Way Immutable Log (Functional Gap)
There are **no server actions or UI inputs to Edit or Delete tender extensions**. If a user enters an incorrect date, typo, or uploads the wrong letter, they cannot delete or change it.
* **The Cascading Reversion Issue**: If deletion were implemented, the system would need to automatically revert the tender's parent `evaluationDate` to the previous extension date or to the original submission validity deadline. This state restoration logic is entirely missing.

#### 2. Missing Expiration Alarms (UX Gap)
Tenders in South Africa are valid for a fixed period (typically 90 or 120 days). If the client does not award it or request an extension, the bid expires. 
* **The Gap**: The platform lacks warning triggers or alerts when a tender's validity period is nearing expiration without an extension.

---

## Phase 5: Transition to Project

### Current Implementation:
* When a tender status is updated to `'awarded'`, the server action automatically creates a `project` in the database and redirects the user to edit it.

### Gaps and Issues:

#### 1. Direct Abrupt Transition (UX Friction)
Updating the status to "Awarded" instantly creates a project. However, winning a tender involves significant adjustments:
* **The Gap**: The system assumes the final contract value is equal to the bid value, and the project description matches the tender description. In reality, contracts are often awarded with altered values or scopes. There is no confirmation modal prompting the user to enter the **actual contract start date, contract end date, signed SLA value, and upload the official appointment letter** before activating the project.

#### 2. SLA / Contract Fields Missing (Schema Gap)
The `project` table in [schema.ts](file:///D:/websites/pmg-tracker-360/packages/db/src/schema.ts) lacks SLA tracking fields. It only stores `projectNumber`, `description`, `clientId`, and `status`. Important parameters like contract start/end dates and value are missing.

---

## Phase 6: Purchase Order (PO) Execution and Delivery

### Current Implementation:
* Users track POs under projects using [po-form.tsx](file:///D:/websites/pmg-tracker-360/apps/tracker/src/components/purchase-orders/po-form.tsx) and [purchase-orders.ts](file:///D:/websites/pmg-tracker-360/apps/tracker/src/server/purchase-orders.ts).

### Gaps and Issues:

#### 1. Immutable Delivery Timestamp (Functional Bug)
The `purchase_order` table in the database schema has a `deliveredAt` column, and [purchase-order.ts validations](file:///D:/websites/pmg-tracker-360/apps/tracker/src/lib/validations/purchase-order.ts) includes `deliveredAt`. 
* **The Bug**: The `POForm` in [po-form.tsx](file:///D:/websites/pmg-tracker-360/apps/tracker/src/components/purchase-orders/po-form.tsx) and its internal `poFormSchema` **completely exclude the `deliveredAt` field**. 
* **The UX Issue**: When a user clicks "Mark as Delivered" on the PO details page, the server action automatically sets `deliveredAt: new Date()` (the current timestamp). If the delivery occurred in the past (e.g. yesterday) and is being recorded retroactively, the user cannot correct the date.

#### 2. Flat PO Structure (Data Design Gap)
The `purchaseOrder` table lacks an items sub-table. All items are compressed into a single `description` text block and a single `totalAmount` text field.
* **The Gap**: In operational procurement, users must track specific item quantities ordered vs. delivered. A flat text structure prevents line-item tracking, invoice reconciliation, and quantity audits.

#### 3. No Proof of Delivery (POD) Validation (Operational Gap)
To claim payment from a South African government department, a signed **Proof of Delivery (POD)** or Goods Received Note (GRN) is legally required. 
* **The Gap**: The PO delivery flow does not require or guide the user to upload a signed POD document when changing the status to `'delivered'`.

#### 4. The "Missing Invoice" Black Hole (Critical Business Gap)
The customer journey stops entirely at PO delivery. In business operations, delivering a PO must be followed by:
1. Raising an **Invoice**.
2. Submitting it to the client.
3. Tracking the payment terms (typically a 30-day payment cycle).
* **The Critical Gap**: The database has **no invoice table** whatsoever. Although the implementation plan outlines invoices, it was never added to the schema. Users cannot track when they got paid, what payments are overdue (a major issue with South African government departments), and cannot generate cash flow projections.

#### 5. Cross-Tenant Authorization Bypass in Purchase Orders & Documents (Security Vulnerability)
Server actions in [purchase-orders.ts](file:///D:/websites/pmg-tracker-360/apps/tracker/src/server/purchase-orders.ts) and [documents.ts](file:///D:/websites/pmg-tracker-360/apps/tracker/src/server/documents.ts) contain critical multi-tenant access control flaws.
* **The Vulnerability**: While PO actions check for role permissions using `auth.api.hasPermission()`, they only verify if the user has permissions *within their own active organization*. They fail to check if the `organizationId` passed as an argument matches the active organization in the session.
* **The Impact**: Any authenticated user can read, create, update, or delete purchase orders and documents for *any* other organization by simply passing the target organization's ID in the HTTP payload. Furthermore, `getDocuments` in [documents.ts](file:///D:/websites/pmg-tracker-360/apps/tracker/src/server/documents.ts#L182) completely omits any authentication or organization validation checks.

#### 6. Date Timezone Shift on PO Calendars (Data Integrity Bug)
Similar to the tender form, the PO form [po-form.tsx](file:///D:/websites/pmg-tracker-360/apps/tracker/src/components/purchase-orders/po-form.tsx#L289-L320) formats the `poDate` and `expectedDeliveryDate` inputs using `.toISOString().split('T')[0]`.
* **The Bug**: Due to local timezone conversions to UTC, dates initialized at midnight shift back by one day on client rendering for South African users (UTC+2).

---

## Phase 7: Performance and Technical SEO Audit

### Current Implementation:
* **Robots & Sitemap**: Basic [robots.ts](file:///D:/websites/pmg-tracker-360/apps/tracker/src/app/robots.ts) and [sitemap.ts](file:///D:/websites/pmg-tracker-360/apps/tracker/src/app/sitemap.ts) exist but hardcode the production domain (`https://tendertrack360.co.za`) and fail to handle dynamic or missing routes.
* **Layouts and Pages**: Set to `force-dynamic` in layout files (e.g. `layout.tsx` in `(dashboard)`) and all page components.
* **SEO Metadata**: Configured in root layout and root landing page, referencing OpenGraph parameters.
* **Query Deduplication**: Server calls (`checkUserSession()`, `getTenderStats()`, etc.) are imported directly into RSCs.

### Gaps and Issues:

#### 1. Private Route Crawl Vulnerabilities (Technical SEO Gap)
The [robots.ts](file:///D:/websites/pmg-tracker-360/apps/tracker/src/app/robots.ts) configuration disallows `/dashboard/` and `/api/`. However, the app structure puts many authenticated panels at the root level using the `(dashboard)` route group:
* `/clients` (Clients Directory)
* `/tenders` and `/tenders/overview` (Tender Pipeline)
* `/projects` and `/projects/purchase-orders` (Project Tracking)
* `/calendar` (Calendar)
* `/reports` (Reports)
* `/settings/profile`, `/settings/notifications`, `/settings/overview` (Settings Pages)
* `/organization` (Organization Management)
* **The Bug**: These private routes are **NOT disallowed** in `robots.ts`. Search engine crawlers can attempt to crawl these internal routes. While they are auth-guarded and will redirect to `/login`, they cause unnecessary crawling overhead, pollute index requests, and could leak route names or structures to search indexers.

#### 2. Missing Core Pages from Sitemap (Technical SEO Gap)
The [sitemap.ts](file:///D:/websites/pmg-tracker-360/apps/tracker/src/app/sitemap.ts) exports a static list of public routes, but excludes `/blog` and `/careers` which exist as public page files in the repository. Additionally, the sitemap URL and domain are hardcoded, making dev/staging indexing configurations fragile.

#### 3. Missing and Broken Asset References in SEO Metadata (SEO Asset Gap)
In the root layout [layout.tsx](file:///D:/websites/pmg-tracker-360/apps/tracker/src/app/layout.tsx#L9-L27), the metadata specifies:
* `openGraph.images: [{ url: '/og-image.png', ... }]`
* JSON-LD `logo: 'https://tendertrack360.co.za/icon.png'`
* **The Bug**: The file `/og-image.png` and `/icon.png` **do not exist** in the `public/` directory (the only files present are `favicon.svg`, `logo.svg`, and basic next/vercel SVGs). This causes broken OG image previews when shared on LinkedIn, WhatsApp, or Twitter, and invalidates the organization structured data.

#### 4. Multiple Duplicate Session DB Hits (RSC Performance Waterfall)
Both the [MainDashboardLayout](file:///D:/websites/pmg-tracker-360/apps/tracker/src/app/%28dashboard%29/layout.tsx#L22) and the individual page components (such as `DashboardPage` in [dashboard/page.tsx](file:///D:/websites/pmg-tracker-360/apps/tracker/src/app/%28dashboard%29/dashboard/page.tsx#L50)) execute the async `checkUserSession()` function sequentially.
* **The Bug**: Because `checkUserSession` is not cached or wrapped in React's `cache()`, Next.js fires two separate cookie parsing and Better Auth DB/API calls for every single authenticated page request.

#### 5. Multiple Redundant Database Queries (RSC Query Waterfall)
The `DashboardPage` renders multiple Suspended child components: `DashboardMetrics` and `DashboardCharts`.
* **The Bug**: `DashboardMetrics` fetches `getTenderStats(organizationId)`. Immediately after, `DashboardCharts` also fetches `getTenderStats(organizationId)`. Because these data-fetching functions are not cached or deduped using `React.cache()`, they hit the Drizzle client with identical queries in parallel, wasting database connection pool capacity.

#### 6. Promise waterfalls in Dashboard Headers (Header Blocking Waterfall)
In `DashboardPage` [dashboard/page.tsx](file:///D:/websites/pmg-tracker-360/apps/tracker/src/app/%28dashboard%29/dashboard/page.tsx#L80-L114), permission checks are awaited sequentially during rendering of header action buttons:
```typescript
const isPOAllowed = (await auth.api.hasPermission({ ... })).success; // awaits first
const isProjectAllowed = (await auth.api.hasPermission({ ... })).success; // awaits second
```
* **The Waterfall**: Each `await` blocks execution of the remainder of the page, turning what could be concurrent API checks into a blocking sequential pipeline before any HTML is streamed.

---

## Phase 8: Database Deletion Constraints and Cascades

### Current Implementation:
* Foreign key relationships and delete constraints are defined in [schema.ts](file:///D:/websites/pmg-tracker-360/packages/db/src/schema.ts).
* The `organization` table supports soft deletion through fields like `deletedAt`, `deletedBy`, and `deletionReason`.

### Gaps and Issues:

#### 1. User Deletion Blocks on Soft-Deleted Organizations
In the `organization` table, `deletedBy` references `user.id` but does not define an `onDelete` constraint.
* **The Bug**: If a user is deleted from the platform (e.g., via administrator action or GDPR request), and they had previously soft-deleted an organization, the database will raise a foreign key constraint violation (`deletedBy` refers to a non-existent user). This blocks user deletion.

#### 2. User Deletion Blocks on Document Uploads
In the `document` table, `uploadedBy` references `user.id` with `.notNull()` and without an `onDelete` cascade or fallback constraint.
* **The Bug**: Deleting a user who has uploaded any documents to the platform will trigger a database constraint violation because the document table's `uploadedBy` column cannot be null, and no action is defined to handle user deletion. This blocks the user deletion flow.

#### 3. Tender Deletion Blocks on Projects
In the `project` table, `tenderId` references `tender.id` but does not define an `onDelete` constraint.
* **The Bug**: Deleting a tender that has associated projects will trigger a database constraint violation, blocking tender deletion rather than decoupling the project from the originating tender.

#### 4. Client Deletion Blocks on Projects
In the `project` table, `clientId` references `client.id` but does not define an `onDelete` constraint.
* **The Bug**: Similarly, deleting a client who has associated projects will raise a foreign key violation, blocking client deletion.

---

## 3. Summary Matrix of Gaps and Severity

| Journey Phase | Step | Identified Gap / Bug | Severity | Impact |
| :--- | :--- | :--- | :--- | :--- |
| **Onboarding** | Settings | Insecure settings overview route (missing session check). | **Low** | Unauthenticated rendering of route layout. |
| **Onboarding** | Org Setup | Invite acceptance form is missing during onboarding. | **Medium** | Invited users forced to create fake orgs. |
| **Onboarding** | Selector | Org selection doesn't invoke `setActive` API. | **High** | Multi-tenant context switching is broken. |
| **Onboarding** | Admin Setup | Privilege escalation in `createSystemAdmin` server action. | **Critical** | Unauthenticated admin creation or role promotion. |
| **Onboarding** | Security | Missing admin `trustedOrigins` CSRF protection. | **Medium** | Origin validation bypass or subdomain redirect issues. |
| **Onboarding** | Performance | Missing session caching and React cache wrapper. | **High** | Heavy database load from redundant session lookups. |
| **Clients** | CRUD | Server actions lack authentication checks. | **Critical** | Data exposure and unauthorized mutations. |
| **Clients** | Schema | Single contact columns instead of multiple contacts. | **Low** | Limited contact log for large departments. |
| **Tenders** | Schema | `value` column is stored as `text` string. | **High** | Aggregations require in-memory calculation. |
| **Tenders** | Actions | Server actions lack authentication checks. | **Critical** | Data exposure and unauthorized mutations. |
| **Tenders** | Bid Prep | Briefing/Clarification meeting dates are not tracked. | **Medium** | Risk of administrative disqualification. |
| **Tenders** | Bid Prep | Bid compliance checklists are missing. | **Medium** | Risk of missing compliance items. |
| **Tenders** | Form | Timezone Date Shift on Calendar inputs (toISOString). | **Medium** | Dates shift back by one day on client view. |
| **Extensions** | CRUD | Extensions cannot be edited or deleted. | **Medium** | Typos in dates are immutable. |
| **Transition** | Award | Abrupt project creation without confirming SLA details. | **Medium** | Projects initialized with inaccurate values. |
| **PO Tracking** | Form | `deliveredAt` input field is missing from form. | **High** | Cannot record past delivery timestamps. |
| **PO Tracking** | Schema | Flat PO amount and description (no line items). | **Medium** | Cannot track quantities ordered vs. received. |
| **PO Tracking** | Delivery | Proof of Delivery (POD) upload is not enforced. | **Medium** | Compliance gaps for payment verification. |
| **PO Tracking** | Actions | Cross-tenant authorization bypass in POs and documents. | **Critical** | Cross-tenant data access and unauthorized mutations. |
| **PO Tracking** | Form | Timezone Date Shift on Calendar inputs (toISOString). | **Medium** | Dates shift back by one day on client view. |
| **PO Tracking** | Finance | **No invoice table exists in the database.** | **Critical** | Cash flow and payment cycles are untracked. |
| **SEO & Perf** | Robots.txt | Authenticated routes `/clients`, `/tenders`, `/projects`, etc. are not disallowed. | **High** | Crawlers attempt to index private dashboard spaces. |
| **SEO & Perf** | Sitemap | Sitemap is missing `/blog` and `/careers` routes. | **Medium** | Public routes are not crawled / indexed. |
| **SEO & Perf** | Metadata | Missing `/og-image.png` and `/icon.png` in static folder. | **Medium** | Broken social shares and schema verification errors. |
| **SEO & Perf** | Session | Redundant `checkUserSession` calls in layout and pages. | **High** | Multiple duplicate session DB calls per request. |
| **SEO & Perf** | Dashboard | Uncached Drizzle stats calls trigger duplicate queries. | **High** | Multiple parallel queries fetch same stats in RSCs. |
| **SEO & Perf** | Dashboard | Blocking waterfall on permissions check. | **Medium** | Slower Initial Server Response times. |
| **Database** | Schema | `deletedBy` on `organization` blocks user deletion. | **Medium** | Database constraint error when deleting a user. |
| **Database** | Schema | `uploadedBy` on `document` blocks user deletion. | **Medium** | Database constraint error when deleting a user. |
| **Database** | Schema | `tenderId`/`clientId` on `project` blocks deletion. | **Medium** | Database constraint error when deleting a tender/client. |

