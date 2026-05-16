# MVP Remediation and Implementation Plan

## 1. Overview

This document outlines the critical features and fixes that are **necessary for a Minimum Viable Product (MVP) launch**. It is derived from the analysis of existing `docs` and `specs`, particularly the `mvp-readiness-report` and `project-status-report`. The items listed below represent the gap between the current implementation and a viable, launch-ready product.

## 2. Core MVP Requirements

The following features must be implemented to ensure the application is functional, secure, and provides core business value.

### Category 1: User & Organization Management

These features are fundamental for a multi-tenant B2B application. Without them, collaboration and user lifecycle management are impossible.

| Feature                      | Current State                                                                                                | Required Implementation                                                                                                                                                                                                                                                        | Source Document                                         |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------- |
| **Member Invitation UI**     | The backend server action (`inviteMember`) is complete and functional, but the UI to trigger it is a stub. | Implement the "Invite Member" modal in the organization dashboard. This includes the form (email, role) and connecting it to the existing server action. Must include loading/error/success states.                                                                                 | `docs/mvp/mvp-remediation-requirements.md`              |
| **Real Ownership Transfer**  | The ownership transfer feature is a non-functional stub that only logs to the console and does not update the database. | Implement a secure, token-based email flow. The process must include initiating the transfer, sending a confirmation email, and a secure endpoint for the new owner to accept. The database must be updated transactionally to change the owner and adjust roles. | `docs/mvp/mvp-readiness-report-2025-12-16.md`             |

### Category 2: Core Business Logic & Data Integrity

The application's primary function is to manage tenders and projects. The current state has critical data integrity flaws.

| Feature                           | Current State                                                                                             | Required Implementation                                                                                                                                                                                            | Source Document                                      |
| --------------------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------- |
| **Tender & Project Management**   | Core CRUD (Create, Read, Update, Delete) operations for tenders and projects are largely missing or incomplete. | Implement the full lifecycle for tenders and projects. Users must be able to create, view, update, and manage these core entities as this forms the primary value proposition of the application.                        | `docs/project-status-report.md`                      |
| **Safe Deletion (Data Integrity)** | Deletion logic is a "soft delete" but lacks crucial dependency checks.                                   | Before processing a deletion, the system must check for active dependencies. For example, block the deletion of a `Client` if they have active `Tenders`. This prevents orphaned data and application errors. | `docs/mvp/mvp-remediation-requirements.md`           |

### Category 3: Billing & Payments

To function as a commercial product, the payment and subscription workflow must be functional.

| Feature                      | Current State                                                               | Required Implementation                                                                                                                                                                                     | Source Document                        |
| ---------------------------- | --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| **Payment Provider Integration** | The billing and upgrade UIs are placeholders. Buttons do not trigger a real payment flow. | Integrate a payment provider (e.g., Stripe, or Polar as hinted at in docs) to handle subscriptions. The "Upgrade" button must initiate a real transaction, and webhooks should be handled to update the user's plan in the database. | `docs/mvp/mvp-scan-report.md` |

## 3. Exclusions from MVP

The following features, while documented, are explicitly **not** considered part of the MVP and should be deferred to post-launch phases:

-   **All AI-Powered Features:** Document intelligence, compliance checking, and AI-assisted proposals are part of a future roadmap.
-   **Advanced Financial & Analytics:** In-depth budget tracking, cash flow management, and detailed win-rate analysis are post-MVP.
-   **Automation & Advanced Workflows:** Tender templates, automated email integration, and other features from Phases 3-4 of the `FEATURE_ROADMAP.md` are not required for launch.
-   **UI/UX Polish:** While the app should be usable, extensive polishing, animations, and micro-interactions detailed in `specs/settings-enhancement-phase-5.md` can be refined later.

---

By focusing on these core MVP requirements, the application can be launched with a stable, secure, and valuable feature set.
