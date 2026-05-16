MVP Remediation & Launch Implementation Plan
Goal Description
Fix critical blockers identified in the MVP Scan Report to prepare the application for launch. This includes fixing data integrity tests, enforcing safe deletion, implementing ownership transfer, and integrating Polar for payments.

User Review Required
IMPORTANT

Polar Payments: This plan assumes following the existing 
polar-payments-integration-plan.md
. I will start with the "Starter" tier implementation. Ownership Transfer: I will implement a secure, token-based email flow as defined in the schema.

Proposed Changes
Phase 1: Core Data Integrity & Tests
[MODIFY] 
src/server/
tests
/crud-integration.test.ts
Fix failing client creation tests (likely due to schema validation or mock issues).
Ensure test environment (Dotenv/Database URL) is correctly configured for isolated testing.
[MODIFY] 
src/server/clients.ts
, 
src/server/tenders.ts
, 
src/server/projects.ts
Add dependency checks before deletion (e.g., prevent Client deletion if active Tenders exist).
Return clear error messages to the UI if deletion is blocked.
Phase 2: Organization Ownership Transfer
[NEW] src/server/actions/ownership.ts
Implement initiateTransfer(orgId, targetUserId)
Implement acceptTransfer(token)
Implement cancelTransfer(transferId)
[NEW] src/app/(dashboard)/dashboard/organization/[slug]/settings/ownership/page.tsx
UI for Owner to initiate transfer.
UI list of pending transfers with "Cancel" option.
Phase 3: Polar Payments Integration
Following 
polar-payments-integration-plan.md

[NEW] src/lib/polar/
client.ts: Polar API client (using @polar-sh/sdk or better-auth/plugins/polar).
webhooks.ts: Webhook signature verification and handler.
[MODIFY] src/app/api/webhooks/polar/route.ts
Handle subscription.created, subscription.updated, invoice.paid.
[MODIFY] src/app/(dashboard)/billing/
Connect UI to real Subscription actions.
Replace mock data with real data from subscriptions table.
Phase 4: Member Invitations
[MODIFY] src/components/organization-members-section.tsx
Implement the "Invite Member" modal.
Connect to createInvitation server action.
Verification Plan
Automated Tests
Run Fixed Integration Tests: npm test src/server/__tests__/crud-integration.test.ts
New Ownership Tests: Create src/server/__tests__/ownership.test.ts to test flow (Initiate -> Accept -> Verify Role Change).
Manual Verification
Deletion Safety: Try to delete a Client with Tenders -> Expect Error. Delete Client with NO Tenders -> Expect Success.
Ownership: Transfer ownership to another user -> Log in as that user -> Verify "Role: Owner".
Payments: Use Polar Sandbox to purchase "Starter" plan -> Verify Database subscriptions table is updated.
Invites: Invite email -> Click Link -> Verify added to Org.