# MVP Remediation Requirements

## Overview

This document outlines the technical requirements to address critical blockers identified in the [MVP Readiness Report](./mvp-readiness-report-2025-12-16.md). Completing these items is a prerequisite for the MVP launch.

## 1. Member Invitations UI

**Objective:** Enable users to invite team members via the application UI.
**Current State:** Backend `inviteMember` action exists. UI button is unconnected/stubbed.

### Requirements

- [ ] **Invite Modal Component:**
  - Create a reusable `InviteMemberModal` using `shadcn/ui` Dialog.
  - Fields: Email Address (email input), Role (Select: Admin, Member, etc.).
  - Validation: properties required, valid email format.
- [ ] **Integration:**
  - Connect `OrganizationMembersSection` "Invite Member" button to open the modal.
  - On submit, call server action `inviteMember`.
  - Handle loading states (disable button, show spinner/text).
  - Handle error states (show toast notification with error message).
  - Handle success (close modal, show success toast, list updates automatically via revalidation).

## 2. Real Ownership Transfer

**Objective:** Replace stubbed ownership transfer logic with secure, persistent database operations.
**Current State:** `OwnershipTransferManager` logs to console but does not update DB.

### Requirements

- [ ] **Database Schema:**
  - Verify `ownershipTransfer` table exists and matches requirements (token, expiry, fromUser, toUser).
- [ ] **Initiate Transfer:**
  - Update `initiateOwnershipTransfer` to insert a record into `ownershipTransfer`.
  - Generate a secure random token.
  - **Email Notification:** Send an email to the `toUser` with the acceptance link (e.g., `/dashboard/settings/ownership/accept?token=...`).
- [ ] **Accept Transfer:**
  - Validate token (exists, not expired).
  - Transactional Update:
    - Update `organization.ownerId` to `toUser`.
    - Update `members` table: Set old owner to 'admin' (or 'member'), set new owner to 'owner'.
    - Mark transfer record as `accepted`.
- [ ] **Cancel/Expire:**
  - Allow owner to cancel pending transfers (update status to `cancelled`).

## 3. Data Integrity & Safe Deletion

**Objective:** Prevent accidental deletion of parent records (Clients, Tenders) that would leave child records orphaned.
**Current State:** Deletion logic is "soft delete" only, without dependency checks.

### Requirements

- [ ] **Client Deletion:**
  - Before deleting Client: Check for active Tenders (`deletedAt` is null).
  - If active Tenders exist: abort and return error "Cannot delete Client with active Tenders."
- [ ] **Tender Deletion:**
  - Before deleting Tender: Check for active Projects.
  - If active Projects exist: abort and return error "Cannot delete Tender with active Projects."
- [ ] **Project Deletion:**
  - Before deleting Project: Check for active Purchase Orders? (Optional for MVP, but good practice).

## 4. Testing & Verification

### Automated Tests

- Create `tests/ownership-transfer.test.ts` to verify the initiation and acceptance flow.
- Update `crud-integration.test.ts` to assert that deletion fails when dependencies exist.

### Manual Verification

- **Invites:** User A invites User B -> User B receives email -> User B joins org.
- **Ownership:** User A transfers to User B -> User B becomes Owner -> User A becomes Admin.
- **Integrity:** Try to delete Client with Tenders -> Error displayed in UI.
