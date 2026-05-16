# Organization Switching Implementation

This document describes the comprehensive organization switching functionality implemented in the Tender Track 360 application.

## Overview

The organization switching feature allows users to seamlessly switch between organizations they belong to, with automatic URL updates and context switching throughout the application.

## Key Features

### 1. Automatic URL Updates

- When switching organizations, URLs automatically update to reflect the active organization
- Organization-specific pages use the pattern `/organization/{slug}`
- Dashboard redirects to the active organization automatically

### 2. Context Preservation

- Organization context is maintained across page navigations
- Server components receive updated organization context
- Client components react to organization changes

### 3. Smart Navigation

- Links automatically become organization-aware when appropriate
- Programmatic navigation respects organization context
- URL synchronization ensures consistency

## Components

### OrganizationSwitcher

**Location**: `src/components/organization-switcher.tsx`

Enhanced dropdown component that:

- Switches active organization in Better Auth session
- Updates URLs based on current page context
- Provides loading states during transitions
- Shows success/error feedback

```tsx
<OrganizationSwitcher organizations={organizations} />
```

### OrganizationProvider

**Location**: `src/components/organization-provider.tsx`

Context provider that:

- Syncs URL organization with active organization
- Handles URL-based organization switching
- Provides organization context to child components

```tsx
<OrganizationProvider organizations={organizations}>
  {children}
</OrganizationProvider>
```

### OrganizationSelector

**Location**: `src/components/organization-selector.tsx`

Handles automatic redirection from `/dashboard` to active organization:

- Redirects to active organization if available
- Redirects to first organization if no active org
- Shows create organization form if no organizations

## Hooks

### Navigation

**Location**: `src/components/nav-links.tsx`

Simple navigation component that handles organization-aware URLs:

```tsx
// Navigation component
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { authClient } from '@/lib/auth-client';

export function NavLinks() {
  const { data: activeOrganization } = authClient.useActiveOrganization();
  const pathname = usePathname();

  // Extract current org slug from URL if available
  const currentOrgSlug = pathname.match(/\/organization\/([^\/]+)/)?.[1];

  // Use current org slug or active org slug as fallback
  const orgSlug = currentOrgSlug || activeOrganization?.slug;

  return (
    <div className="flex items-center gap-2">
      {orgSlug && <Link href={`/organization/${orgSlug}`}>Dashboard</Link>}
      <Link href="/profile">Profile</Link>
    </div>
  );
}
```

## Utilities

### Navigation Utilities

**Location**: `src/lib/navigation.ts`

Helper functions for organization-aware routing:

```tsx
import {
  getOrgAwareUrl,
  isOrgSpecificPath,
  extractOrgSlug,
} from '@/lib/navigation';

// Get organization-aware URL
const url = getOrgAwareUrl('/dashboard', 'my-org'); // '/organization/my-org'

// Check if path is organization-specific
const isOrgPath = isOrgSpecificPath('/organization/my-org'); // true

// Extract organization slug from path
const slug = extractOrgSlug('/organization/my-org'); // 'my-org'
```

## URL Patterns

### Organization-Specific Pages

These pages automatically use organization context:

- `/dashboard` → `/organization/{slug}`
- `/organization/{slug}` → Uses the specified organization

### Non-Organization Pages

These pages maintain organization context but don't change URLs:

- `/profile` → Stays `/profile` (but organization context is available)
- `/settings` → Stays `/settings`

## Implementation Details

### 1. Session Management

- Uses Better Auth's `organization.setActive()` to switch organizations
- Session updates are reflected across all server components
- Client components receive updates through Better Auth hooks

### 2. URL Synchronization

- `OrganizationProvider` ensures URL matches active organization
- Handles both user-initiated switches and direct URL navigation
- Provides fallback behavior for invalid organization slugs

### 3. Navigation Flow

1. User selects organization from switcher
2. Better Auth session updates with new active organization
3. URL updates based on current page context
4. Page refreshes to load new organization data
5. All components receive updated organization context

### 4. Error Handling

- Invalid organization slugs redirect to active organization
- Failed organization switches show error messages
- Graceful fallbacks for missing organizations

## Usage Examples

### Basic Organization Navigation

```tsx
// Use standard Next.js navigation with explicit organization URLs
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';

function MyComponent() {
  const { data: activeOrganization } = authClient.useActiveOrganization();
  const router = useRouter();

  return (
    <div>
      <p>Current org: {activeOrganization?.name}</p>
      <button
        onClick={() => router.push(`/organization/${activeOrganization?.slug}`)}
      >
        Go to Dashboard
      </button>
    </div>
  );
}
```

### Navigation Links

```tsx
// Use standard Next.js Link with explicit organization URLs
import Link from 'next/link';

function Navigation({ orgSlug }: { orgSlug: string }) {
  return (
    <nav>
      <Link href={`/organization/${orgSlug}`}>Dashboard</Link>
      <Link href="/profile">Profile</Link>
    </nav>
  );
}
```

### Smart Navigation Component

```tsx
// NavLinks component handles organization context automatically
import { NavLinks } from '@/components/nav-links';

function Header() {
  return (
    <header>
      <NavLinks />
    </header>
  );
}
```

## Configuration

### Middleware

The middleware is configured to protect organization routes:

```tsx
// src/middleware.ts
export const config = {
  matcher: ['/dashboard', '/onboarding', '/profile', '/organization/:path*'],
};
```

### Layout Integration

Organization provider is integrated at the dashboard layout level:

```tsx
// src/app/(dashboard)/dashboard/layout.tsx
export default async function MainDashboardLayout({ children }) {
  const organizations = await getorganizations();

  return (
    <OrganizationProvider organizations={organizations}>
      <Header />
      {children}
    </OrganizationProvider>
  );
}
```

## Best Practices

1. **Use explicit organization URLs** like `/organization/{slug}` for organization-specific pages
2. **Use standard Next.js Link and useRouter** for navigation
3. **Handle loading states** when organization context is changing
4. **Provide fallbacks** for users with no organizations
5. **Test URL direct access** to ensure proper organization synchronization
6. **Use NavLinks component** for consistent navigation behavior

## Troubleshooting

### Common Issues

1. **Organization not switching**: Check if Better Auth session is updating properly
2. **URL not updating**: Verify OrganizationProvider is wrapping the component tree
3. **Infinite redirects**: Check for circular navigation logic in useEffect hooks
4. **Stale organization data**: Ensure router.refresh() is called after organization changes

### Debug Tips

1. Check browser network tab for Better Auth API calls
2. Verify organization data in React DevTools
3. Monitor console for navigation-related errors
4. Test with multiple organizations to verify switching behavior
