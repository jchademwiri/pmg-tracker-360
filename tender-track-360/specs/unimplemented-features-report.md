# Unimplemented Features Report

This report summarizes features that are documented in the project's `docs` and `specs` directories but have not yet been fully implemented.

### 1. AI-Powered Features

The entire AI implementation is a planned future enhancement. The `docs/07-ai-implementation/` directory outlines a detailed roadmap for features that are not yet built.
-   **AI Document Intelligence:** Automatically parsing tender documents (PDF, Word, scans) using OCR and NLP to extract requirements, deadlines, and criteria.
-   **Compliance Checker:** An AI-powered engine to analyze tender requirements and generate a "readiness report" (Ready/Partial/Not Eligible) by comparing them against a company's profile and stored documents.
-   **Smart Automation:** Auto-generation of compliance checklists and auto-categorization of uploaded company documents.
-   **AI-Assisted Proposals:** Generating pre-filled form templates and drafting sections of bids.
-   **Knowledge Base:** An intelligent document vault for company compliance documents with features like expiry tracking.

*(Source: `docs/07-ai-implementation/README.md`, `ai-architecture.md`, `compliance-checker.md`)*

### 2. Advanced Organization & Security Management

While basic organization creation is implemented, several advanced management and security features specified in `specs/settings-enhancement-phase-4.md` are not.
-   **Safe Organization Deletion:** A multi-step, owner-only process to safely delete an organization, including data export and other safeguards.
-   **Ownership Transfer:** A secure, token-based flow for an owner to transfer ownership of an organization to another user. The MVP reports confirm this is currently a non-functional stub.
-   **Advanced Security Features:** Session management, login activity monitoring, IP whitelisting, and mandatory two-factor authentication (2FA).
-   **Comprehensive Audit Logs:** Detailed, encrypted logs for all critical organization and security events.

*(Source: `specs/settings-enhancement-phase-4.md`, `docs/mvp/mvp-readiness-report-2025-12-16.md`)*

### 3. Core Business & Project Management Logic

The `docs/project-status-report.md` indicates that core business logic is only 15% complete. The feature roadmap details what this includes.
-   **Project Management Module:** The entire post-award workflow, including material tracking, project milestones, and invoicing.
-   **Financial Intelligence:** Features for budget tracking vs. actuals, cash flow management, and project profitability analysis.
-   **Tender & PO Enhancements:** Tender templates, bid history tracking, and smart alerts to prevent duplicate Purchase Order fulfillment.
-   **Data Integrity Checks:** The MVP reports highlight that "safe deletion" (e.g., preventing deletion of a client that has active tenders) is a `TODO`.

*(Source: `docs/FEATURE_ROADMAP.md`, `docs/mvp/mvp-remediation-requirements.md`)*

### 4. Billing and Payments Integration

The UI for billing and upgrades exists, but the backend integration with a payment provider is missing.
-   **Payment Provider Integration:** The connection to a service like Stripe or Polar for handling subscriptions and upgrades is not implemented.
-   **Real-time Plan Management:** The ability for a user to actually upgrade their plan and have it reflected in their account permissions.

*(Source: `docs/mvp/mvp-scan-report.md`)*

### 5. Polishing and Production Readiness

The final phase of the settings enhancement, as well as general project management documents, points to several items that are not yet complete.
-   **Performance Optimization:** Caching strategies, database query optimization, and bundle size reduction are planned but not yet a focus.
-   **Comprehensive Testing:** While some tests exist, the documentation calls for much broader E2E, performance, and security testing.
-   **User Experience Polish:** Onboarding flow improvements, video tutorials, and in-app help guides are documented as future enhancements.

*(Source: `specs/settings-enhancement-phase-5.md`, `docs/ONBOARDING_FLOW_REPORT.md`)*
