'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, CalendarDays, Users, Clock } from 'lucide-react';

interface OrganizationMembership {
  id: string;
  role: string;
  createdAt: Date;
  organization: {
    id: string;
    name: string;
    slug: string | null;
    createdAt: Date;
  };
}

interface OrganizationInfoProps {
  membership: OrganizationMembership | null;
  userUpdatedAt: Date;
}

export function OrganizationInfo({
  membership,
  userUpdatedAt,
}: OrganizationInfoProps) {
  // Format date for display
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(date));
  };

  return (
    <section aria-labelledby="organization-info-heading">
      <Card>
        <CardHeader>
          <CardTitle
            id="organization-info-heading"
            className="flex items-center space-x-2 text-base sm:text-lg"
            // If they are not in an org, maybe "Account Settings" is a better title?
            // But user said "Right column... showing organization information".
            // Let's keep "Organization" or maybe "Organization & Account" if requested,
            // but sticking to user request "Organization info" for now.
          >
            <Building2 className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
            <span>Organization</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {membership ? (
            <div className="space-y-6">
              {/* Org Name & Role */}
              <div>
                <label
                  className="text-sm font-medium text-muted-foreground"
                  id="organization-name-label"
                >
                  Organization Name
                </label>
                <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 mt-2">
                  <p
                    className="text-sm sm:text-base font-medium"
                    aria-labelledby="organization-name-label"
                  >
                    {membership.organization.name}
                  </p>
                  <Badge
                    variant="outline"
                    className="text-xs w-fit"
                    aria-label={`Role: ${membership.role}`}
                  >
                    <Users className="h-3 w-3 mr-1" aria-hidden="true" />
                    {membership.role}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-1">
                  <label
                    className="text-sm font-medium text-muted-foreground"
                    id="organization-slug-label"
                  >
                    Organization Slug
                  </label>
                  <p
                    className="mt-1 text-sm sm:text-base font-mono"
                    aria-labelledby="organization-slug-label"
                  >
                    {membership.organization.slug}
                  </p>
                </div>
                <div className="space-y-1">
                  <label
                    className="text-sm font-medium text-muted-foreground"
                    id="joined-date-label"
                  >
                    Member Since
                  </label>
                  <div className="flex items-center space-x-2 mt-1">
                    <CalendarDays
                      className="h-4 w-4 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <p
                      className="text-sm sm:text-base"
                      aria-labelledby="joined-date-label"
                    >
                      {formatDate(membership.createdAt)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-1">
                  <label
                    className="text-sm font-medium text-muted-foreground"
                    id="organization-created-label"
                  >
                    Organization Created
                  </label>
                  <p
                    className="mt-1 text-sm sm:text-base"
                    aria-labelledby="organization-created-label"
                  >
                    {formatDate(membership.organization.createdAt)}
                  </p>
                </div>

                {/* Last Updated (Moved from Sidebar) */}
                <div className="space-y-1">
                  <label
                    className="text-sm font-medium text-muted-foreground"
                    id="user-updated-label"
                  >
                    Profile Last Updated
                  </label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Clock
                      className="h-4 w-4 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <p
                      className="text-sm sm:text-base"
                      aria-labelledby="user-updated-label"
                    >
                      {formatDate(userUpdatedAt)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-center py-6 text-muted-foreground border-b border-border pb-6">
                <Building2
                  className="h-8 w-8 mx-auto mb-2 opacity-50"
                  aria-hidden="true"
                />
                <p className="text-sm">No organization membership</p>
                <p className="text-xs mt-1">
                  You are not currently a member of any organization
                </p>
              </div>

              {/* Show generic account info even if no org */}
              <div className="space-y-1">
                <label
                  className="text-sm font-medium text-muted-foreground"
                  id="user-updated-label-no-org"
                >
                  Profile Last Updated
                </label>
                <div className="flex items-center space-x-2 mt-1">
                  <Clock
                    className="h-4 w-4 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <p
                    className="text-sm sm:text-base"
                    aria-labelledby="user-updated-label-no-org"
                  >
                    {formatDate(userUpdatedAt)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
