'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { authClient } from '@/lib/auth-client';
import { useRouter, usePathname } from 'next/navigation';
import { useTransition } from 'react';
import dynamic from 'next/dynamic';
import { switchOrganization } from '@/lib/organization-utils';
import type { OrganizationWithStats } from '@/server/organizations';

interface OrganizationSwitcherProps {
  organizations: OrganizationWithStats[];
}

function OrganizationSwitcherClient({
  organizations,
}: OrganizationSwitcherProps) {
  const { data: activeOrganization } = authClient.useActiveOrganization();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const handleChangeOrganization = async (organizationId: string) => {
    const selectedOrg = organizations.find((org) => org.id === organizationId);
    if (!selectedOrg) {
      return;
    }

    startTransition(async () => {
      // Handle URL navigation based on current page
      const newUrl = getUpdatedUrl(
        pathname,
        selectedOrg.slug || selectedOrg.id
      );

      await switchOrganization({
        organizationId: selectedOrg.id,
        organizationName: selectedOrg.name,
        router,
        redirectUrl: newUrl,
      });
    });
  };

  // Function to determine the new URL based on current path and organization slug
  const getUpdatedUrl = (currentPath: string, orgSlug: string): string => {
    // If we're on an organization-specific page, update the slug
    if (currentPath.includes('/dashboard/')) {
      return `/organization/${orgSlug}/dashboard`;
    }

    // For dashboard and other pages that should show organization context
    if (currentPath === '/dashboard' || currentPath.endsWith('/dashboard')) {
      return `/organization/${orgSlug}/dashboard`;
    }

    // For profile and other non-org specific pages, stay on the same page
    // but the organization context will still be updated
    if (
      currentPath.startsWith('/profile') ||
      currentPath.startsWith('/settings') ||
      currentPath === '/'
    ) {
      return currentPath;
    }

    // Default: navigate to organization page
    return `/organization`;
  };

  return (
    <Select
      onValueChange={handleChangeOrganization}
      value={activeOrganization?.id}
      disabled={isPending}
    >
      <SelectTrigger className="min-w-[180px]">
        <SelectValue
          placeholder={isPending ? 'Switching...' : 'Organization'}
        />
      </SelectTrigger>
      <SelectContent>
        {organizations.map((organization) => (
          <SelectItem key={organization.id} value={organization.id}>
            {organization.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// Export the dynamically imported component to prevent hydration mismatch
export const OrganizationSwitcher = dynamic(
  () => Promise.resolve(OrganizationSwitcherClient),
  {
    ssr: false,
    loading: () => (
      <Select disabled>
        <SelectTrigger className="min-w-[180px]">
          <SelectValue placeholder="Loading..." />
        </SelectTrigger>
      </Select>
    ),
  }
);
