# Phase 3 Spec: Organization Management Interface

## Overview

Create a comprehensive organization management interface with tabbed navigation, member management, and full CRUD operations using existing invitation system.

## Problem Statement

- No interface for managing organization details and settings
- Missing member management capabilities
- No invitation system integration in settings
- Need tabbed interface for different management areas
- Missing server actions for organization operations

## Goals

- Create full organization management interface with tabbed navigation
- Integrate existing invitation system for member management
- Implement organization details editing
- Add role-based management features
- Create server actions for organization operations

## Requirements

### Functional Requirements

**FR3.1: Tabbed Management Interface**

- **General Tab**: Organization details (name, logo, description, metadata)
- **Members Tab**: Member list, role management, member removal
- **Invitations Tab**: Pending invitations, send new invitations, manage invitations
- **Settings Tab**: Organization preferences and configuration
- **Security Tab**: Security settings (owner/admin only)

**FR3.2: Organization Details Management**

- Edit organization name, logo, and description
- Update organization metadata and preferences
- Save changes with proper validation
- Role-based edit permissions (owner/admin/manager can edit)

**FR3.3: Member Management**

- Display all organization members with roles
- Change member roles (with proper permissions)
- Remove members from organization
- Bulk member operations
- Integration with existing `bulkRemoveMembers()` function

**FR3.4: Invitation Management**

- Send new invitations using existing `inviteMember()` function
- Display pending invitations
- Resend invitations using existing `resendInvitation()` function
- Cancel invitations using existing `cancelInvitation()` function
- Bulk invitation operations using existing `bulkCancelInvitations()` function

**FR3.5: Role-Based Permissions**

- **Owner**: Full access to all tabs and operations
- **Admin**: Access to all tabs except dangerous operations
- **Manager**: Access to General, Members, and Invitations tabs
- **Member**: Read-only access (redirected to view-only mode)

### Technical Requirements

**TR3.1: Server Actions Integration**

- Use existing invitation functions from `src/server/invitations.ts`
- Create new server actions for organization updates
- Implement proper error handling and validation
- Use existing `ServerActionResult<T>` interface

**TR3.2: Data Management**

- Fetch organization details and members
- Real-time updates after operations
- Proper loading states during operations
- Optimistic updates where appropriate

**TR3.3: Form Handling**

- React Hook Form integration for all forms
- Zod schema validation
- Proper error display and handling
- Form state management

## User Stories

**As an organization owner, I want to manage all aspects of my organization** so that I can maintain control and ensure proper configuration.

**As an organization admin, I want to manage members and settings** so that I can help maintain the organization effectively.

**As an organization manager, I want to invite and manage team members** so that I can build and maintain my team.

**As any organization member, I want to see organization information** so that I can stay informed about my organization.

## Acceptance Criteria

### AC1: Tabbed Interface

- [ ] Five tabs are displayed: General, Members, Invitations, Settings, Security
- [ ] Tab visibility is based on user role (Security tab only for owners/admins)
- [ ] Active tab state is maintained during navigation
- [ ] Tabs are responsive and work on mobile devices
- [ ] Tab content loads correctly for each section

### AC2: General Tab - Organization Details

- [ ] Organization name can be edited (owner/admin/manager)
- [ ] Organization logo can be uploaded/changed (owner/admin/manager)
- [ ] Organization description can be edited (owner/admin/manager)
- [ ] Changes are saved successfully with proper validation
- [ ] Read-only view for members
- [ ] Form validation prevents invalid data submission

### AC3: Members Tab - Member Management

- [ ] All organization members are displayed with their roles
- [ ] Member roles can be changed (with proper permissions)
- [ ] Members can be removed from organization (with confirmation)
- [ ] Bulk member operations work correctly
- [ ] Current user cannot remove themselves
- [ ] Owner role cannot be changed by non-owners

### AC4: Invitations Tab - Invitation Management

- [ ] New invitations can be sent with email and role selection
- [ ] Pending invitations are displayed with status
- [ ] Invitations can be resended using existing function
- [ ] Invitations can be cancelled using existing function
- [ ] Bulk invitation operations work correctly
- [ ] Email validation prevents invalid invitations

### AC5: Settings Tab - Organization Configuration

- [ ] Organization preferences can be configured
- [ ] Default member role can be set (owner only)
- [ ] Notification settings can be managed
- [ ] Changes are saved and applied correctly
- [ ] Proper validation for all settings

### AC6: Security Tab - Security Settings

- [ ] Only visible to owners and admins
- [ ] Security settings can be configured
- [ ] Audit logs are displayed (if available)
- [ ] Dangerous operations require confirmation
- [ ] Proper access control enforcement

### AC7: Role-Based Access Control

- [ ] Members are redirected to read-only view
- [ ] Managers can access General, Members, and Invitations tabs
- [ ] Admins can access all tabs except owner-only features
- [ ] Owners have full access to all features
- [ ] Unauthorized actions are prevented and show appropriate errors

## Implementation Details

### Files to Create/Modify

- `src/app/(dashboard)/dashboard/settings/organisation/[organizationId]/page.tsx` - Main management page
- `src/app/(dashboard)/dashboard/settings/organisation/[organizationId]/components/` - Tab components
- `src/server/organizations-actions.ts` - New server actions for organization management

### Components to Create

- `OrganizationManagementTabs` - Main tabbed interface
- `GeneralTab` - Organization details management
- `MembersTab` - Member management interface
- `InvitationsTab` - Invitation management interface
- `SettingsTab` - Organization settings
- `SecurityTab` - Security settings (owner/admin only)
- `MemberList` - Member display and management
- `InvitationForm` - New invitation form
- `PendingInvitations` - Pending invitations display

### Server Actions to Create

```typescript
// Organization management actions
updateOrganizationDetails(organizationId: string, data: OrganizationUpdateData)
updateMemberRole(organizationId: string, memberId: string, newRole: Role)
removeMember(organizationId: string, memberId: string)
updateOrganizationSettings(organizationId: string, settings: OrganizationSettings)
```

### Integration with Existing Functions

- `inviteMember(organizationId, email, role)` - For sending invitations
- `cancelInvitation(invitationId)` - For cancelling invitations
- `resendInvitation(invitationId)` - For resending invitations
- `bulkRemoveMembers(memberIds)` - For bulk member removal
- `bulkCancelInvitations(invitationIds)` - For bulk invitation cancellation

### Data Flow

1. Load organization data and user permissions
2. Render appropriate tabs based on user role
3. Handle tab switching and content loading
4. Process form submissions and API calls
5. Update UI with results and handle errors
6. Refresh data after successful operations

## Testing Requirements

### Unit Tests

- [ ] Tab rendering and switching functionality
- [ ] Form validation and submission
- [ ] Permission checking logic
- [ ] Server action integration
- [ ] Error handling scenarios

### Integration Tests

- [ ] End-to-end organization management flow
- [ ] Member management operations
- [ ] Invitation management operations
- [ ] Role-based access control
- [ ] Data persistence and updates

### Manual Testing

- [ ] Test all tabs with different user roles
- [ ] Test all CRUD operations
- [ ] Test form validation and error handling
- [ ] Test responsive design on various devices
- [ ] Test integration with existing invitation system

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Code reviewed and approved
- [ ] Unit and integration tests passing
- [ ] Manual testing completed for all user roles
- [ ] No build or development errors
- [ ] Integration with existing systems verified
- [ ] Documentation updated

## Dependencies

- Existing invitation system (`src/server/invitations.ts`)
- Existing organization data structure
- Current user authentication and role system
- Design system components
- Form handling libraries (React Hook Form, Zod)

## Risks and Mitigation

- **Risk**: Complex permission logic leading to security issues
  - **Mitigation**: Comprehensive testing and code review
- **Risk**: Integration issues with existing invitation system
  - **Mitigation**: Thorough testing of all integration points
- **Risk**: Performance issues with large member lists
  - **Mitigation**: Implement pagination and virtualization
- **Risk**: Data consistency issues during concurrent operations
  - **Mitigation**: Proper locking and conflict resolution

## Success Metrics

- All organization management operations work correctly
- Role-based access control is 100% secure
- Integration with existing invitation system is seamless
- User can complete all management tasks without errors
- Performance remains acceptable with realistic data volumes

## Future Considerations

- Organization analytics and insights
- Advanced member permissions and custom roles
- Organization templates and cloning
- Integration with external systems
- Advanced audit logging and compliance features
