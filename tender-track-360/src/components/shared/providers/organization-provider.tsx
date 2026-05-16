'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { switchOrganization } from '@/lib/organization-utils';

interface OrganizationProviderProps {
  children: React.ReactNode;
  organizations?: Array<{ id: string; slug: string; name: string }>;
}

export function OrganizationProvider({
  children,
  organizations = [],
}: OrganizationProviderProps) {
  const { data: activeOrganization } = authClient.useActiveOrganization();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Only run this effect on organization-specific pages
    if (!pathname.includes('/organization/')) {
      return;
    }

    // Extract slug from current URL
    const urlSlugMatch = pathname.match(/\/organization\/([^\/]+)/);
    const urlSlug = urlSlugMatch ? urlSlugMatch[1] : null;

    if (!urlSlug || !activeOrganization) {
      return;
    }

    // Check if the URL slug matches the active organization
    if (activeOrganization.slug !== urlSlug) {
      // Find the organization that matches the URL slug
      const urlOrganization = organizations.find((org) => org.slug === urlSlug);

      if (urlOrganization) {
        // Switch to the organization that matches the URL
        switchOrganization({
          organizationId: urlOrganization.id,
          organizationName: urlOrganization.name,
          router,
          showToast: false, // Don't show toast for automatic URL sync
        }).catch(() => {
          // Redirect to the correct organization URL on error
          window.location.href = `/organization/${activeOrganization.slug}`;
        });
      } else {
        // URL has invalid organization slug, redirect to active organization
        console.warn(`Invalid organization slug in URL: ${urlSlug}`);
        window.location.href = `/organization/${activeOrganization.slug}`;
      }
    }
  }, [pathname, activeOrganization, organizations, router]);

  return <>{children}</>;
}
