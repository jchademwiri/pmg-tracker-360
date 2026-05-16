# MVP Review and Next Steps Report

This report provides an analysis of implemented MVP features, identifies areas for improvement, and clarifies the functionality of soft deletion and data retrieval based on a deep scan of the codebase.

## 1. MVP Feature Status

Following a detailed code review and user confirmation, the status of the core MVP features has been updated. The outdated documentation in some `docs` and `mvp` files does not reflect the significant progress made.

- **Member Invitation UI:** ✅ Done
- **Real Ownership Transfer:** ✅ Done
- **Core Tender/Project Management:** ✅ Done
- **Safe Deletion Logic:** ✅ Done
- **Payment Provider Integration:** ❌ Not Started

The primary remaining task for a commercially viable MVP is the integration of a payment provider.

## 2. Suggested Improvements for Core Management

While the core CRUD (Create, Read, Update, Delete) functionality for Tenders and Clients is robust, several planned features that enhance traceability and collaboration have not yet been integrated into these workflows.

### **High-Priority Improvement: Implement Audit Trails**

-   **Observation:** The server actions in `src/server/tenders.ts` and `src/server/clients.ts` handle data manipulation correctly, but they do not create entries in the `activityLogs` table.
-   **Recommendation:** Integrate the `auditLogger` service (from `src/lib/audit-logger.ts`) into all CRUD operations. Every create, update, and delete action on a tender, client, or project should generate an audit log entry.
-   **Justification:** This fulfills a key security and compliance requirement outlined in `docs/06-project-management/requirements.md` (FR1.5: Audit Logging) and is essential for tracking changes in a multi-user environment.

### **Other Notable Improvements:**

-   **Task Management:** While a `tasks` table schema exists, the core tender management logic does not yet automatically create or link tasks based on tender status changes.
-   **Notifications:** The `notifications` schema is in place, but the CRUD actions do not trigger user notifications for events like status changes or assignments.

## 3. Analysis of Soft Deletion and Data Retrieval

The user requested clarification on retrieving soft-deleted files and the permissions required.

### **How Deletion is Implemented**

The system correctly uses a **soft-delete** pattern. When a user "deletes" a Tender or a Client, the record is not removed from the database. Instead, the `deletedAt` field is updated with the current timestamp. All data retrieval functions (e.g., `getTenders`, `getClients`) are correctly configured to filter out records where `deletedAt` is not `NULL`.

This means the data is safe and recoverable.

### **Retrieval of Soft-Deleted Items**

-   **Finding:** The application **does not currently have a feature to restore** soft-deleted Tenders or Clients. While `restoreOrganization` exists, there are no corresponding `restoreTender` or `restoreClient` functions in the server actions.
-   **Conclusion:** It is **not possible** for any user to retrieve a soft-deleted tender, client, or associated file through the UI because the functionality has not been built.

### **Permissions for Data Retrieval (Recommendation)**

When the retrieval feature is built, it should be restricted to specific roles to prevent unauthorized data restoration.

-   **Proposed Permissions:**
    -   **Owner & Admin:** Should have the permission to view a "trash" or "archive" list of soft-deleted items and the ability to restore them.
    -   **Manager & Specialist:** Should **not** have permission to view or restore deleted items, as this is an administrative function.
-   **Security Note:** The existing `restoreOrganization` function in `src/server/organization-advanced-actions.ts` **lacks a specific role check**, only verifying that a user is authenticated. It is highly recommended to add a permission check to this function, restricting it to Owners, to prevent potential misuse.

## 4. Summary of Recommendations

1.  **Update `mvp-roadmap-tracker.md`:** Mark all features except "Payment Provider Integration" as complete.
2.  **Implement Audit Trails:** Integrate the `auditLogger` for all Tender and Client CRUD operations as the highest priority improvement.
3.  **Build Restore Functionality:** Create `restoreTender` and `restoreClient` server actions and corresponding UI to allow Admins and Owners to recover soft-deleted records.
4.  **Harden Restore Permissions:** Add role-based permission checks (`owner` or `admin`) to the existing `restoreOrganization` function and any new restore functions that are created.
