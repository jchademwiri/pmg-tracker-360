"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { authClient } from "@/lib/auth-client";
import { useTransition, useState } from "react";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import { switchOrganization } from "@/lib/organization-utils";
import type { OrganizationWithStats } from "@/server/organizations";

interface OrganizationSwitcherProps {
  organizations: OrganizationWithStats[];
}

function OrganizationSwitcherClient({
  organizations,
}: OrganizationSwitcherProps) {
  const { data: activeOrganization } = authClient.useActiveOrganization();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  // Optimistic local state so the Select updates immediately on click,
  // without waiting for useActiveOrganization() or router.refresh().
  const [optimisticOrgId, setOptimisticOrgId] = useState<string | null>(null);

  // Use the optimistic ID if set, otherwise fall back to the hook value
  const displayOrgId = optimisticOrgId || activeOrganization?.id;

  const handleChangeOrganization = async (organizationId: string) => {
    const selectedOrg = organizations.find((org) => org.id === organizationId);
    if (!selectedOrg) {
      return;
    }

    // Optimistically update the displayed org immediately
    setOptimisticOrgId(organizationId);

    startTransition(async () => {
      // Handle URL navigation based on current page
      const newUrl = getUpdatedUrl(
        pathname,
        selectedOrg.slug || selectedOrg.id,
      );

      const result = await switchOrganization({
        organizationId: selectedOrg.id,
        organizationName: selectedOrg.name,
        redirectUrl: newUrl,
      });

      // Revert optimistic state on failure
      if (!result.success) {
        setOptimisticOrgId(null);
      }
    });
  };

  // Function to determine the new URL based on current path and organization slug.
  // Note: `/organization/[slug]/dashboard` does NOT exist in the app — the org
  // management page lives at `/organization/[slug]` and the dashboard at
  // `/dashboard` (which renders for the session's active organization). Landing
  // on the dashboard is the correct post-switch destination.
  const getUpdatedUrl = (currentPath: string, _orgSlug: string): string => {
    // Organization management pages show the org passed via the slug, so
    // switch the slug in the URL to keep the page in context.
    const orgPageMatch = currentPath.match(/^\/organization\/([^/]+)(\/.*)?$/);
    if (orgPageMatch) {
      return `/organization/${_orgSlug}${orgPageMatch[2] || ""}`;
    }

    // Dashboard and everything else renders for the active organization
    // from the session, so just return there.
    if (
      currentPath.startsWith("/dashboard") ||
      currentPath === "/" ||
      currentPath === "/organization"
    ) {
      return "/dashboard";
    }

    // Profile/settings pages are not organization-scoped: stay put, the
    // session context is updated by the switch.
    if (
      currentPath.startsWith("/profile") ||
      currentPath.startsWith("/settings")
    ) {
      return currentPath;
    }

    return "/dashboard";
  };

  return (
    <Select
      onValueChange={handleChangeOrganization}
      value={displayOrgId}
      disabled={isPending}
    >
      <SelectTrigger className="min-w-[180px]">
        <SelectValue
          placeholder={isPending ? "Switching..." : "Organization"}
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
  },
);
