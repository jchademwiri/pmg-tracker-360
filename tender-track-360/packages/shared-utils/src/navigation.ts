/**
 * Navigation utilities for organization-aware routing
 */

// Get organization-aware URL for a given path
export function getOrgAwareUrl(path: string, orgSlug?: string): string {
  if (!orgSlug) {
    return path;
  }

  // Organization-specific pages should use the org slug
  if (path.startsWith('/dashboard') || path === '/dashboard') {
    return `/organization/${orgSlug}`;
  }

  if (path.startsWith('/organization')) {
    // Replace any existing org slug with the current one
    return path.replace(/\/organization\/[^\/]+/, `/organization/${orgSlug}`);
  }

  // For other paths, return as-is (profile, settings, etc.)
  return path;
}

// Check if a path is organization-specific
export function isOrgSpecificPath(path: string): boolean {
  return (
    path.includes('/organization/') ||
    path.startsWith('/dashboard') ||
    path === '/dashboard'
  );
}

// Extract organization slug from URL path
export function extractOrgSlug(path: string): string | null {
  const match = path.match(/\/organization\/([^\/]+)/);
  return match ? match[1] : null;
}
