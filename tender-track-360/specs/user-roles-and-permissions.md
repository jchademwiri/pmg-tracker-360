# User Roles and Permissions Specification

## 1. Overview

This document provides a definitive specification for User Roles and Permissions within the Tender Track 360 platform. It consolidates information from the user guide and technical specifications to create a single source of truth for role-based access control (RBAC).

The primary goal is to ensure a clear, secure, and hierarchical permission system that aligns with the operational needs of different user personas.

## 2. User Roles Hierarchy

The system employs a clear hierarchical structure. Users with higher-level roles inherit all permissions from the roles below them.

`Owner` > `Admin` > `Manager` > `Specialist`

## 3. Role Definitions

### 👑 Owner

-   **Purpose**: Has absolute and ultimate control over an organization. This role is typically assigned to the creator of the organization.
-   **Key Responsibilities**:
    -   All responsibilities of an Admin.
    -   Making critical decisions, including organization deletion and ownership transfer.
    -   Setting the highest level of security and billing configurations.
-   **Scope**: Full control over a single organization. This is not a system-wide super-admin.

### ⚙️ Admin (Administrator)

-   **Purpose**: Full system administration for an organization, responsible for user management and system configuration.
-   **Key Responsibilities**:
    -   Creating, modifying, and deactivating user accounts within the organization.
    -   Assigning and changing user roles (up to the Admin level).
    -   Managing organization-wide settings and configurations.
    -   Overseeing data integrity and security protocols.
-   **Scope**: Limited to the specific organization they are an Admin of. Cannot delete the organization or transfer ownership.

### 👥 Manager

-   **Purpose**: Portfolio oversight and strategic management of tenders and teams.
-   **Key Responsibilities**:
    -   Overseeing multiple tenders and projects.
    -   Managing team members, including inviting new users and assigning them to tenders.
    -   Making high-level decisions on tender pursuits.
    -   Analyzing performance reports for their teams and projects.
-   **Scope**: Access to all tenders and users within their organization, but with fewer configuration rights than an Admin.

### 🎯 Specialist

-   **Purpose**: The primary "doer" responsible for day-to-day tender execution.
-   **Key Responsibilities**:
    -   Creating, updating, and managing the lifecycle of all tenders in the organization.
    -   Uploading, organizing, and managing documents related to tenders.
    -   Completing assigned tasks and collaborating with team members.
-   **Scope**: Can view and edit all tenders across the organization. All edits are recorded in an audit log.

## 4. Permission Matrix

This matrix details the specific permissions for each role across key functional areas.

| Feature / Action                | Owner | Admin | Manager | Specialist | Notes                                                  |
| ------------------------------- | :---: | :---: | :-----: | :--------: | ------------------------------------------------------ |
| **Organization Management**     |       |       |         |            |                                                        |
| View Organization Details       |   ✅   |   ✅   |    ✅    |     ✅      | All users can view the basic details of their organization. |
| Edit Organization Details       |   ✅   |   ✅   |    ✅    |     ❌      | Specialist has read-only access.           |
| Transfer Ownership              |   ✅   |   ❌   |    ❌    |     ❌      | Only the current Owner can initiate a transfer.        |
| Delete Organization             |   ✅   |   ❌   |    ❌    |     ❌      | A critical, owner-only, multi-step action.             |
|                                 |       |       |         |            |                                                        |
| **User & Member Management**    |       |       |         |            |                                                        |
| View All Members                |   ✅   |   ✅   |    ✅    |     ✅      | Team members are visible to everyone in the organization. |
| Invite New Members              |   ✅   |   ✅   |    ✅    |     ❌      |                                                        |
| Cancel/Resend Invitations       |   ✅   |   ✅   |    ✅    |     ❌      |                                                        |
| Remove Member                   |   ✅   |   ✅   |    ✅    |     ❌      |                                                        |
| Change Member Role              |   ✅   |   ✅   |    ✅    |     ❌      | Cannot elevate a user to a role higher than their own. |
|                                 |       |       |         |            |                                                        |
| **Tender Management**           |       |       |         |            |                                                        |
| Create New Tenders              |   ✅   |   ✅   |    ✅    |     ✅      |                                                        |
| View All Tenders                |   ✅   |   ✅   |    ✅    |     ✅      |                                                        |
| Edit/Update Tenders             |   ✅   |   ✅   |    ✅    |     ✅      | Specialist edits are recorded in an audit log.         |
| Change Tender Status            |   ✅   |   ✅   |    ✅    |     ✅      | Some status changes may require Manager+ approval.     |
| Delete Tenders                  |   ✅   |   ✅   |    ❌    |     ❌      | Manager can typically only archive or mark as lost.    |
|                                 |       |       |         |            |                                                        |
| **Document Management**         |       |       |         |            |                                                        |
| Upload Documents                |   ✅   |   ✅   |    ✅    |     ✅      | Specialist can add documents to any tender.            |
| Download Documents              |   ✅   |   ✅   |    ✅    |     ✅      |                                                        |
| Delete Documents                |   ✅   |   ✅   |    ✅    |     ❌      | Specialist cannot delete documents.                    |
|                                 |       |       |         |            |                                                        |
| **System & Settings**           |       |       |         |            |                                                        |
| Access System-Wide Analytics    |   ✅   |   ✅   |    ✅    |     ❌      |                                                        |
| Access Security / Audit Logs    |   ✅   |   ✅   |    ❌    |     ❌      |                                                        |
| Configure Organization Settings |   ✅   |   ✅   |    ❌    |     ❌      | e.g., Default roles, notification policies.            |

## 5. Technical Implementation Notes

For quick reference, permission checks should follow this logic, as established in the technical specifications.

### General Management Permissions

This logic applies to most create, update, and edit functions within an organization's settings.

```typescript
// Check if the user has rights to manage the organization (edit details, manage members)
const canManage = ['owner', 'admin', 'manager'].includes(userRole);
```

### Destructive / Critical Permissions

This logic applies to irreversible actions like deleting an organization or transferring full control.

```typescript
// Check if the user is the sole owner with rights to delete or transfer
const isOwner = userRole === 'owner';
```

### Content-Specific Access

The system is moving away from content-specific access for tenders. All roles can interact with all tenders.

```typescript
// Pseudo-code for checking access to a tender
function canAccessTender(user, tender) {
  // All roles can view tenders now.
  // Specific edit/delete permissions are handled by the action itself.
  if (user.role) {
    return true;
  }
  return false;
}
```
