# Phase 1 Spec: Simplify Main Settings Page & Fix Navigation

## Overview

Transform the complex main settings page into a clean, focused interface with working navigation to other settings sections.

## Problem Statement

- Current `/settings/page.tsx` has a complex tabbed interface with redundant functionality
- Navigation links between settings pages are not properly implemented
- Button type attributes are missing, causing linting issues
- User experience is confusing with too many options on one page

## Goals

- Create a clean, focused main settings page
- Implement working navigation between all settings pages
- Fix all linting issues (button type attributes)
- Ensure responsive design works correctly

## Requirements

### Functional Requirements

**FR1.1: Simplified Main Settings Interface**

- Display user's basic profile information (avatar, name, email)
- Show quick stats (profile completion, security score, notification count)
- Provide clear navigation cards to other settings sections

**FR1.2: Navigation Cards**

- Profile Settings card with description and "Manage Profile" button
- Organization Settings card with description and "Manage Organizations" button
- Notification Settings card with description and "Configure Notifications" button
- Each card should show relevant status/count information

**FR1.3: Working Navigation**

- All navigation buttons must route to correct pages
- Back navigation should work properly
- Breadcrumb navigation for better UX

### Technical Requirements

**TR1.1: Code Quality**

- All buttons must have proper `type` attribute
- No TypeScript errors
- No linting warnings
- Clean, maintainable code structure

**TR1.2: Performance**

- Page load time under 2 seconds
- Minimal JavaScript bundle size
- Proper loading states

**TR1.3: Responsive Design**

- Mobile-first approach
- Works on all screen sizes (320px+)
- Touch-friendly interface

## User Stories

**As a user, I want to see a clean overview of my settings** so that I can quickly understand what needs attention and navigate to specific areas.

**As a user, I want quick access to different settings sections** so that I don't have to navigate through complex menus.

**As a user, I want to see my profile completion status** so that I know what information I still need to provide.

## Acceptance Criteria

### AC1: Main Settings Page

- [ ] Page loads without errors in dev and build modes
- [ ] Displays user avatar, name, and email correctly
- [ ] Shows profile completion percentage
- [ ] Shows security score indicator
- [ ] Shows notification count/status
- [ ] All information is accurate and up-to-date

### AC2: Navigation Cards

- [ ] Profile Settings card displays with correct description
- [ ] Organization Settings card displays with correct description
- [ ] Notification Settings card displays with correct description
- [ ] Each card has a clear call-to-action button
- [ ] Cards are visually consistent and well-designed

### AC3: Navigation Functionality

- [ ] Profile Settings button navigates to `/settings/profile`
- [ ] Organization Settings button navigates to `/settings/organisation`
- [ ] Notification Settings button navigates to `/settings/notifications`
- [ ] All navigation works without page refresh (client-side routing)
- [ ] Back button works correctly from all pages

### AC4: Code Quality

- [ ] No TypeScript compilation errors
- [ ] No ESLint warnings or errors
- [ ] All buttons have proper `type="button"` attribute
- [ ] Code follows project conventions
- [ ] Proper error handling implemented

### AC5: Responsive Design

- [ ] Works correctly on mobile (320px-768px)
- [ ] Works correctly on tablet (768px-1024px)
- [ ] Works correctly on desktop (1024px+)
- [ ] Touch interactions work properly on mobile
- [ ] Text is readable on all screen sizes

## Implementation Details

### Files to Modify

- `src/app/(dashboard)/dashboard/settings/page.tsx` - Main settings page
- `src/app/(dashboard)/dashboard/settings/overview/page.tsx` - Fix button types
- Update any shared components as needed

### Components to Create

- `SettingsCard` - Reusable card component for navigation
- `ProfileSummary` - User profile summary component
- `QuickStats` - Statistics display component

### Data Requirements

- Current user information
- Profile completion percentage calculation
- Security score calculation
- Notification count/status

### Styling Guidelines

- Use existing design system components
- Consistent spacing and typography
- Clear visual hierarchy
- Accessible color contrast

## Testing Requirements

### Unit Tests

- [ ] Component rendering tests
- [ ] Navigation functionality tests
- [ ] Data display accuracy tests

### Integration Tests

- [ ] Page-to-page navigation tests
- [ ] User data loading tests
- [ ] Error state handling tests

### Manual Testing

- [ ] Test on different browsers (Chrome, Firefox, Safari)
- [ ] Test on different devices (mobile, tablet, desktop)
- [ ] Test with different user roles
- [ ] Test error scenarios (network issues, etc.)

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Code reviewed and approved
- [ ] Tests passing (unit and integration)
- [ ] Manual testing completed
- [ ] No build or development errors
- [ ] Documentation updated
- [ ] Deployed to staging and verified

## Dependencies

- Existing user authentication system
- Current settings page structure
- Design system components

## Risks and Mitigation

- **Risk**: Breaking existing functionality
  - **Mitigation**: Thorough testing of all navigation paths
- **Risk**: Performance regression
  - **Mitigation**: Monitor bundle size and loading times
- **Risk**: Responsive design issues
  - **Mitigation**: Test on multiple devices and screen sizes

## Success Metrics

- Zero build/development errors
- Page load time under 2 seconds
- 100% navigation success rate
- Positive user feedback on simplified interface
