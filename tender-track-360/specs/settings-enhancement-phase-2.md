# Phase 2 Spec: Multi-Organization View with Role-Based Access

## Overview

Transform the organization settings page to display all user organizations with proper role-based access control and organization selection interface.

## Problem Statement

- Current `/settings/organisation/page.tsx` is static and doesn't show real organization data
- No support for users who belong to multiple organizations
- No role-based access control implementation
- Missing organization selection and management interface

## Goals

- Display all organizations the user belongs to
- Implement role-based UI (read-only for members, full access for owners/admins/managers)
- Create organization selection interface
- Show organization statistics and member information

## Requirements

### Functional Requirements

**FR2.1: Multi-Organization Display**

- Fetch and display all organizations user belongs to using existing `getorganizations()`
- Show organization cards with key information (name, logo, member count, user role)
- Display user's role in each organization with appropriate badges
- Show last activity date for each organization

**FR2.2: Role-Based Access Control**

- **Member Role**: Read-only view of organization information
- **Manager Role**: Can view and manage basic organization settings and members
- **Admin Role**: Can manage organization settings, members, and invitations
- **Owner Role**: Full access including organization deletion and ownership transfer

**FR2.3: Organization Selection Interface**

- Organization cards with clear visual hierarchy
- Role badges (Owner, Admin, Manager, Member) with distinct colors
- Member count display
- Last activity indicator
- Action buttons based on user role ("Manage" vs "View")

**FR2.4: Organization Statistics**

- Member count display
- Last activity timestamp
- Organization creation date
- Active projects count (if available)

### Technical Requirements

**TR2.1: Data Integration**

- Use existing `getorganizations()` function from `src/server/organizations.ts`
- Leverage existing `OrganizationWithStats` interface
- Use existing role system from `src/lib/auth/permissions.ts`
- Integrate with current user session management

**TR2.2: Permission System**

- Implement role checking using existing permission structure
- Use `['owner', 'admin', 'manager'].includes(userRole)` for management access
- Use `userRole === 'owner'` for owner-only features
- Proper error handling for unauthorized access

**TR2.3: Performance**

- Efficient data fetching with minimal database queries
- Proper loading states during data fetch
- Error handling for failed organization loads
- Caching where appropriate

## User Stories

**As a user who belongs to multiple organizations, I want to see all my organizations** so that I can choose which one to manage.

**As a member of an organization, I want to see organization information in read-only mode** so that I can stay informed without accidentally making changes.

**As an admin/manager/owner, I want to access organization management features** so that I can effectively manage my organization.

**As an owner, I want to have full control over my organization** so that I can make critical decisions like deletion or ownership transfer.

## Acceptance Criteria

### AC1: Organization Data Display

- [ ] All user organizations are fetched and displayed correctly
- [ ] Organization cards show name, logo (if available), and member count
- [ ] User's role in each organization is clearly displayed with appropriate badges
- [ ] Last activity date is shown in a user-friendly format
- [ ] Empty state is handled gracefully (user belongs to no organizations)

### AC2: Role-Based UI

- [ ] Members see read-only view with "View" button
- [ ] Managers see management options with "Manage" button
- [ ] Admins see full management options with "Manage" button
- [ ] Owners see all options including dangerous actions
- [ ] Role badges are visually distinct and properly colored

### AC3: Organization Cards

- [ ] Cards are visually appealing and consistent
- [ ] Information hierarchy is clear and logical
- [ ] Cards are responsive and work on all screen sizes
- [ ] Hover states and interactions are smooth
- [ ] Loading states are implemented during data fetch

### AC4: Navigation and Interaction

- [ ] Clicking "Manage" navigates to organization management (Phase 3)
- [ ] Clicking "View" shows read-only organization details
- [ ] Navigation preserves organization context
- [ ] Back navigation works correctly
- [ ] Error states are handled gracefully

### AC5: Performance and Reliability

- [ ] Page loads within 2 seconds
- [ ] No memory leaks or performance issues
- [ ] Proper error handling for network failures
- [ ] Loading states prevent user confusion
- [ ] Data is accurate and up-to-date

## Implementation Details

### Files to Modify

- `src/app/(dashboard)/dashboard/settings/organisation/page.tsx` - Main organization settings page
- Create new components as needed

### Components to Create

- `OrganizationCard` - Individual organization display card
- `RoleBadge` - Role indicator component
- `OrganizationGrid` - Grid layout for organization cards
- `OrganizationStats` - Statistics display component

### Data Flow

1. Fetch user organizations using `getorganizations()`
2. Process organization data with role information
3. Render organization cards with role-based UI
4. Handle user interactions (view/manage)
5. Navigate to appropriate pages based on role

### Permission Logic

```typescript
const canManage = ['owner', 'admin', 'manager'].includes(userRole);
const canDelete = userRole === 'owner';
const isReadOnly = userRole === 'member';
```

### Styling Guidelines

- Use existing design system components
- Consistent card design with proper spacing
- Clear role badge colors (Owner: gold, Admin: blue, Manager: green, Member: gray)
- Responsive grid layout
- Accessible color contrast and typography

## Testing Requirements

### Unit Tests

- [ ] Organization data fetching and processing
- [ ] Role-based UI rendering
- [ ] Component interaction handling
- [ ] Permission logic validation

### Integration Tests

- [ ] End-to-end organization display flow
- [ ] Role-based access control
- [ ] Navigation between pages
- [ ] Error handling scenarios

### Manual Testing

- [ ] Test with different user roles in different organizations
- [ ] Test with users belonging to multiple organizations
- [ ] Test with users belonging to no organizations
- [ ] Test responsive design on various devices
- [ ] Test error scenarios (network issues, permission errors)

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Code reviewed and approved
- [ ] Unit and integration tests passing
- [ ] Manual testing completed across all user roles
- [ ] No build or development errors
- [ ] Performance requirements met
- [ ] Documentation updated

## Dependencies

- Existing `getorganizations()` function
- Existing role system and permissions
- Current user authentication system
- Design system components

## Risks and Mitigation

- **Risk**: Performance issues with many organizations
  - **Mitigation**: Implement pagination or virtualization if needed
- **Risk**: Role permission confusion
  - **Mitigation**: Clear visual indicators and comprehensive testing
- **Risk**: Data inconsistency
  - **Mitigation**: Proper error handling and data validation

## Success Metrics

- All organizations display correctly for all user roles
- Role-based access control works 100% of the time
- Page load time under 2 seconds
- Zero permission-related security issues
- Positive user feedback on organization selection interface

## Future Considerations

- Organization search and filtering (if user has many organizations)
- Organization favorites or pinning
- Recent activity feed per organization
- Organization switching from header/navigation
