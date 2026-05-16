# Implementation Plan: Roles and Permissions

This document outlines the steps to implement the roles and permissions defined in `docs/organization-role-permissions.md`.

## 1. Update Access Control List (ACL)

The first step is to update the ACL in `src/lib/auth/permissions.ts` to match the permissions matrix. This will involve defining all the required permissions and assigning them to the `owner`, `admin`, and `member` roles.

**File:** `src/lib/auth/permissions.ts`

**Actions:**

- Define a comprehensive set of permissions based on the actions in `organization-role-permissions.md`.
- Update the `owner`, `admin`, and `member` roles with the correct permissions.

**Example:**

```typescript
const statement = {
  ...defaultStatements,
  organization: ['read', 'update', 'delete', 'manage-members', 'manage-roles'],
  billing: ['read', 'manage'],
  // ... other permissions
} as const;

const ac = createAccessControl(statement);

const owner = ac.newRole({
  ...defaultStatements,
  ...adminAc.statements,
  organization: ['read', 'update', 'delete', 'manage-members', 'manage-roles'],
  billing: ['read', 'manage'],
});

const admin = ac.newRole({
  organization: ['read', 'update', 'manage-members'],
});

const member = ac.newRole({
  organization: ['read'],
});
```

## 2. Implement Middleware for Route Protection

Next, we need to create a middleware to protect routes based on user roles and permissions. This middleware will check the user's session and their role in the active organization to determine if they have access to the requested route.

**File:** `src/middleware.ts` (or similar)

**Actions:**

- Create a middleware that intercepts requests to protected routes.
- In the middleware, get the user's session and their role for the current organization.
- Use `better-auth`'s `hasPermission` function to check if the user has the required permissions for the route.
- Redirect unauthorized users to a "not authorized" page or the login page.

## 3. Implement Permission Checks in Server Actions

We need to add permission checks to all server actions to ensure that only authorized users can perform create, update, and delete operations.

**Files:** All server action files in `src/server/actions/`

**Actions:**

- In each server action that performs a sensitive operation, add a permission check at the beginning of the function.
- Use the `checkIfAdmin` function as a template to create more specific permission-checking functions (e.g., `checkIfOwner`, `checkIfMember`).
- Throw an error or return an unauthorized response if the user does not have the required permissions.

## 4. Conditionally Render UI Elements on the Frontend

To provide a good user experience, we should conditionally render UI elements based on the user's permissions. For example, a user who does not have permission to delete an organization should not see the "Delete Organization" button.

**Files:** All relevant React components in `src/components/` and `src/app/`

**Actions:**

- Create a hook (e.g., `usePermissions`) that provides an easy way to check for permissions in React components. This hook would use `better-auth`'s client-side API.
- In each component that contains a restricted element, use the `usePermissions` hook to check if the user has the necessary permissions.
- Conditionally render the element based on the result of the permission check.

## 5. Testing

Thoroughly test the implementation to ensure that the roles and permissions are enforced correctly.

**Actions:**

- Write unit tests for the permission-checking functions.
- Write integration tests to verify that routes are protected correctly.
- Write end-to-end tests to simulate user interactions and verify that the UI is rendered correctly based on user permissions.

By following these steps, we can implement a robust and secure roles and permissions system that meets the requirements of the application.
