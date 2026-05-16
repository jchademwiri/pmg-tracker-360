'use client';

import { useState, useEffect } from 'react';
import { authClient } from '@/lib/auth-client';
import { organization } from '@/db/schema';
import { OrganizationGrid } from './organization-grid';

import { RecentActivitySection } from './recent-activity-section';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { RecentActivity } from '@/types/activity';
import type { OrganizationWithStats } from '@/server/organizations';
import { CreateOrganizationForm } from './forms';
import { UpgradeDialog } from './shared/dialogs';
import { OrganizationSearch } from './shared/search';

import { useRouter } from 'next/navigation';

interface OrganizationPageContentProps {
  organizations: OrganizationWithStats[];
  recentActivities: RecentActivity[];
}

export function OrganizationPageContent({
  organizations,
  recentActivities,
}: OrganizationPageContentProps) {
  const router = useRouter();
  const { data: activeOrganization, isPending: isLoading } =
    authClient.useActiveOrganization();
  const [filteredOrganizations, setFilteredOrganizations] =
    useState(organizations);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isQuickActionDialogOpen, setIsQuickActionDialogOpen] = useState(false);
  const [isUpgradeDialogOpen, setIsUpgradeDialogOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Update filtered organizations when organizations prop changes
  useEffect(() => {
    setFilteredOrganizations(organizations);
  }, [organizations]);

  const handleFilter = (filtered: (typeof organization.$inferSelect)[]) => {
    setFilteredOrganizations(filtered as OrganizationWithStats[]);
  };

  const handleCreateOrganization = () => {
    console.log('handleCreateOrganization called - checking limit');
    if (organizations.length >= 2) {
      setIsCreateDialogOpen(false); // Close create dialog first
      // Open upgrade dialog immediately to avoid intentional delay
      setIsUpgradeDialogOpen(true);
      return;
    }
    setIsCreateDialogOpen(true);
  };

  // Prevent hydration mismatch
  if (!isClient) {
    return (
      <div
        className="grid place-items-center min-h-[400px]"
        role="status"
        aria-label="Loading page"
      >
        <div className="text-center">
          <div
            className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"
            aria-hidden="true"
          ></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show loading state while checking organization
  if (isLoading) {
    return (
      <div
        className="grid place-items-center min-h-[400px]"
        role="status"
        aria-label="Loading organizations"
      >
        <div className="text-center">
          <div
            className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"
            aria-hidden="true"
          ></div>
          <p className="text-muted-foreground">Loading your organizations...</p>
        </div>
      </div>
    );
  }

  // If no organizations, show the create form prominently
  if (organizations.length === 0) {
    return (
      <div
        className="max-w-md mx-auto"
        role="main"
        aria-labelledby="empty-state-heading"
      >
        <div className="text-center space-y-6">
          <div className="space-y-2">
            <h2 id="empty-state-heading" className="text-2xl font-semibold">
              Create Your First Organization
            </h2>
            <p className="text-muted-foreground">
              Get started by creating an organization to manage your projects
              and team.
            </p>
          </div>

          <Button
            size="lg"
            className="w-full"
            onClick={() => {
              if (organizations.length >= 2) {
                setIsCreateDialogOpen(false); // Close create dialog first
                // Open upgrade dialog immediately to avoid intentional delay
                setIsUpgradeDialogOpen(true);
                return;
              }
              setIsCreateDialogOpen(true);
            }}
            aria-describedby="empty-state-heading"
          >
            Create Organization
          </Button>

          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
          >
            <DialogContent
              title="Create Organization"
              aria-labelledby="create-dialog-title"
              aria-describedby="create-dialog-description"
            >
              <DialogHeader>
                <DialogTitle id="create-dialog-title">
                  Create Organization
                </DialogTitle>
                <DialogDescription id="create-dialog-description">
                  Please fill in the details to create a new organization.
                </DialogDescription>
              </DialogHeader>
              <CreateOrganizationForm
                currentOrganizationCount={organizations.length}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>
    );
  }

  // Main layout with organizations
  return (
    <div
      className="space-y-8"
      role="main"
      aria-label="Organization management dashboard"
    >
      {/* Search Section */}
      <section aria-label="Search organizations">
        <OrganizationSearch
          organizations={organizations}
          onFilter={handleFilter}
          onSearchChange={setSearchTerm}
          className="mb-8"
        />
      </section>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Organizations Grid - Takes up 3 columns on large screens */}
        <div className="lg:col-span-3">
          <section aria-label="Organizations list">
            <div className="space-y-6">
              {/* Search Results Info */}
              {searchTerm && (
                <div
                  className="text-sm text-muted-foreground"
                  role="status"
                  aria-live="polite"
                >
                  {filteredOrganizations.length === 0 ? (
                    <div className="text-center py-8" role="alert">
                      <h3 className="text-lg font-medium text-foreground mb-2">
                        No organizations found
                      </h3>
                      <p className="text-muted-foreground">
                        Try adjusting your search terms or create a new
                        organization.
                      </p>
                    </div>
                  ) : (
                    <span
                      aria-label={`Search results: showing ${filteredOrganizations.length} of ${organizations.length} organizations`}
                    >
                      Showing {filteredOrganizations.length} of{' '}
                      {organizations.length} organizations
                    </span>
                  )}
                </div>
              )}

              {/* Organizations Grid */}
              {filteredOrganizations.length > 0 && (
                <OrganizationGrid
                  organizations={filteredOrganizations}
                  activeOrganizationId={activeOrganization?.id}
                  onCreateOrganization={handleCreateOrganization}
                />
              )}

              {/* Dialog for Create Organization from Grid */}
              <Dialog
                open={isCreateDialogOpen}
                onOpenChange={setIsCreateDialogOpen}
              >
                <DialogContent
                  title="Create Organization"
                  aria-labelledby="grid-create-dialog-title"
                  aria-describedby="grid-create-dialog-description"
                >
                  <DialogHeader>
                    <DialogTitle id="grid-create-dialog-title">
                      Create Organization
                    </DialogTitle>
                    <DialogDescription id="grid-create-dialog-description">
                      Please fill in the details to create a new organization.
                    </DialogDescription>
                  </DialogHeader>
                  <CreateOrganizationForm
                    currentOrganizationCount={organizations.length}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </section>
        </div>

        {/* Sidebar - Takes up 1 column on large screens */}
        <aside
          className="lg:col-span-1"
          aria-label="Sidebar with recent activity and quick actions"
        >
          <div className="space-y-6">
            {/* Quick Actions Card */}
            <section aria-labelledby="quick-actions-heading">
              <div className="bg-card border rounded-lg p-6">
                <h3 id="quick-actions-heading" className="font-semibold mb-4">
                  Quick Actions
                </h3>
                <div
                  className="space-y-3"
                  role="group"
                  aria-labelledby="quick-actions-heading"
                >
                  <Button
                    variant="outline"
                    className="w-full text-primary justify-start cursor-pointer "
                    onClick={() => {
                      if (organizations.length >= 2) {
                        setIsQuickActionDialogOpen(false); // Close quick action dialog first
                        // Open upgrade dialog immediately to avoid intentional delay
                        setIsUpgradeDialogOpen(true);
                        return;
                      }
                      setIsQuickActionDialogOpen(true);
                    }}
                    aria-describedby="quick-actions-heading"
                  >
                    Create Organization
                  </Button>

                  <Dialog
                    open={isQuickActionDialogOpen}
                    onOpenChange={setIsQuickActionDialogOpen}
                  >
                    <DialogContent
                      title="Create Organization"
                      aria-labelledby="quick-create-dialog-title"
                      aria-describedby="quick-create-dialog-description"
                    >
                      <DialogHeader>
                        <DialogTitle id="quick-create-dialog-title">
                          Create Organization
                        </DialogTitle>
                        <DialogDescription id="quick-create-dialog-description">
                          Please fill in the details to create a new
                          organization.
                        </DialogDescription>
                      </DialogHeader>
                      <CreateOrganizationForm
                        currentOrganizationCount={organizations.length}
                      />
                    </DialogContent>
                  </Dialog>

                  {activeOrganization && (
                    <Button
                      variant="outline"
                      className="w-full justify-start cursor-pointer"
                      onClick={() => {
                        router.push(
                          `/organization/${activeOrganization.slug}/dashboard`
                        );
                      }}
                      aria-label={`Go to ${activeOrganization.name} dashboard`}
                    >
                      Go to Dashboard
                    </Button>
                  )}
                </div>
              </div>
            </section>
            {/* Recent Activity */}
            <section aria-labelledby="recent-activity-heading">
              <RecentActivitySection
                activities={recentActivities}
                showViewAll={recentActivities.length > 0}
                onViewAll={() => {
                  // TODO: Navigate to full activity page
                  console.log('Navigate to full activity page');
                }}
              />
            </section>
          </div>
        </aside>
      </div>

      {/* Upgrade Dialog */}
      <UpgradeDialog
        open={isUpgradeDialogOpen}
        onOpenChange={setIsUpgradeDialogOpen}
        currentCount={organizations.length}
        maxCount={2}
      />
    </div>
  );
}
