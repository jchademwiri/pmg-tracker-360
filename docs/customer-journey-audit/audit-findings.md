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

---

## 3. Summary Matrix of Gaps and Severity

| Journey Phase | Step | Identified Gap / Bug | Severity | Impact |
| :--- | :--- | :--- | :--- | :--- |
| **Onboarding** | Org Setup | Invite acceptance form is missing during onboarding. | **Medium** | Invited users forced to create fake orgs. |
| **Onboarding** | Selector | Org selection doesn't invoke `setActive` API. | **High** | Multi-tenant context switching is broken. |
| **Clients** | CRUD | Server actions lack authentication checks. | **Critical** | Data exposure and unauthorized mutations. |
| **Clients** | Schema | Single contact columns instead of multiple contacts. | **Low** | Limited contact log for large departments. |
| **Tenders** | Schema | `value` column is stored as `text` string. | **High** | Aggregations require in-memory calculation. |
| **Tenders** | Actions | Server actions lack authentication checks. | **Critical** | Data exposure and unauthorized mutations. |
| **Tenders** | Bid Prep | Briefing/Clarification meeting dates are not tracked. | **Medium** | Risk of administrative disqualification. |
| **Tenders** | Bid Prep | Bid compliance checklists are missing. | **Medium** | Risk of missing compliance items. |
| **Extensions** | CRUD | Extensions cannot be edited or deleted. | **Medium** | Typos in dates are immutable. |
| **Transition** | Award | Abrupt project creation without confirming SLA details. | **Medium** | Projects initialized with inaccurate values. |
| **PO Tracking** | Form | `deliveredAt` input field is missing from form. | **High** | Cannot record past delivery timestamps. |
| **PO Tracking** | Schema | Flat PO amount and description (no line items). | **Medium** | Cannot track quantities ordered vs. received. |
| **PO Tracking** | Delivery | Proof of Delivery (POD) upload is not enforced. | **Medium** | Compliance gaps for payment verification. |
| **PO Tracking** | Finance | **No invoice table exists in the database.** | **Critical** | Cash flow and payment cycles are untracked. |
