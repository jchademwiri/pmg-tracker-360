'use client';

import * as React from 'react';
import { ChevronsUpDown, Plus, Building2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { switchOrganization } from '@/lib/organization-utils';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { CreateOrganizationForm } from '@/components/shared/forms';
import { UpgradeDialog } from '@/components/shared/dialogs';
import type { OrganizationWithStats } from '@/server/organizations';

export function TeamSwitcher({
  organizations,
  activeOrganizationId,
}: {
  organizations: OrganizationWithStats[];
  activeOrganizationId?: string | null;
}) {
  const { isMobile } = useSidebar();
  const router = useRouter();
  const { data: activeOrganization } = authClient.useActiveOrganization();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false);
  const [isUpgradeDialogOpen, setIsUpgradeDialogOpen] = React.useState(false);

  // Find the active organization from the list or use the first one as fallback
  const activeOrg = React.useMemo(() => {
    // Priority:
    // 1. Client-side active organization (if available/switched)
    // 2. Server-side active organization (passed via prop)
    // 3. Fallback to first organization

    // Note: We prioritize the prop for the initial render to match server HTML,
    // but we need to verify if `activeOrganization` is already defined (e.g. from hydration state).
    // Actually, to prevent hydration mismatch, we should rely on the Prop if `activeOrganization` is undefined,
    // OR if we want to ensure the HTML matches, we should use the Prop as the default.

    const targetId = activeOrganization?.id || activeOrganizationId;

    if (targetId) {
      return (
        organizations.find((org) => org.id === targetId) || organizations[0]
      );
    }
    return organizations[0];
  }, [activeOrganization, organizations, activeOrganizationId]);

  const handleOrganizationSwitch = async (
    organization: OrganizationWithStats
  ) => {
    await switchOrganization({
      organizationId: organization.id,
      organizationName: organization.name,
      router,
    });
  };

  if (!activeOrg) {
    return null;
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                <Building2 className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate font-medium">{activeOrg.name}</span>
                <span className="truncate text-xs">
                  {activeOrg.memberCount}{' '}
                  {activeOrg.memberCount === 1 ? 'member' : 'members'}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto group-data-[collapsible=icon]:hidden" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="start"
            side={isMobile ? 'bottom' : 'right'}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-muted-foreground text-xs">
              Organizations
            </DropdownMenuLabel>
            {organizations.map((organization, index) => (
              <DropdownMenuItem
                key={organization.id}
                onClick={() => handleOrganizationSwitch(organization)}
                className="gap-2 p-2"
              >
                <div className="flex size-6 items-center justify-center rounded-md border">
                  <Building2 className="size-3.5 shrink-0" />
                </div>
                <div className="flex flex-col">
                  <span className="font-medium">{organization.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {organization.memberCount}{' '}
                    {organization.memberCount === 1 ? 'member' : 'members'}
                  </span>
                </div>
                <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <Dialog
              open={isCreateDialogOpen}
              onOpenChange={setIsCreateDialogOpen}
            >
              <DialogTrigger asChild>
                <DropdownMenuItem
                  className="gap-2 p-2"
                  onSelect={(e) => {
                    e.preventDefault();
                    if (organizations.length >= 2) {
                      setIsCreateDialogOpen(false); // Close create dialog first
                      // Open upgrade dialog immediately to improve responsiveness
                      setIsUpgradeDialogOpen(true);
                      return;
                    }
                    setIsCreateDialogOpen(true);
                  }}
                >
                  <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                    <Plus className="size-4" />
                  </div>
                  <div className="text-muted-foreground font-medium">
                    Add organization
                  </div>
                </DropdownMenuItem>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Create Organization</DialogTitle>
                  <DialogDescription>
                    Create a new organization to collaborate with your team. (
                    {organizations.length}/2 organizations used)
                  </DialogDescription>
                </DialogHeader>
                <CreateOrganizationForm
                  currentOrganizationCount={organizations.length}
                />
              </DialogContent>
            </Dialog>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>

      {/* Upgrade Dialog */}
      <UpgradeDialog
        open={isUpgradeDialogOpen}
        onOpenChange={setIsUpgradeDialogOpen}
        currentCount={organizations.length}
        maxCount={2}
      />
    </SidebarMenu>
  );
}
