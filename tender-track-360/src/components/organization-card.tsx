'use client';

import { Role } from '@/db/schema';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Calendar, Settings, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { OrganizationWithStats } from '@/server/organizations';

interface OrganizationCardProps {
  organization: OrganizationWithStats;
  memberCount?: number;
  isActive?: boolean;
  userRole?: Role;
  className?: string;
}

export function OrganizationCard({
  organization,
  memberCount,
  isActive = false,
  userRole,
  className,
}: OrganizationCardProps) {
  // Use the organization's built-in data if not provided as props
  const actualMemberCount = memberCount ?? organization.memberCount;
  const actualUserRole = userRole ?? organization.userRole;
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((word) => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      year: 'numeric',
    }).format(new Date(date));
  };

  return (
    <Card
      className={cn(
        'group relative overflow-hidden transition-all duration-300 ease-out',
        // allow clicks through the decorative pseudo element
        'before:absolute before:inset-0 before:bg-linear-to-br before:from-primary/5 before:to-transparent before:opacity-0 before:transition-opacity before:duration-300 hover:before:opacity-100 before:pointer-events-none',
        isActive && 'ring-2 ring-primary ring-offset-2 shadow-lg',
        className
      )}
    >
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="size-12 transition-transform duration-300">
              <AvatarImage src={organization.logo || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold transition-colors duration-300 group-hover:bg-primary/20">
                <Link href={`/dashboard/organization/${organization.slug}`}>
                  {getInitials(organization.name)}
                </Link>
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg leading-tight truncate">
                <Link href={`/dashboard/organization/${organization.slug}`}>
                  {organization.name}
                </Link>
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge
                  variant={isActive ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {actualUserRole}
                </Badge>
                {isActive && (
                  <Badge variant="outline" className="text-xs">
                    Active
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-4">
          {/* Stats */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Users className="size-4" />
              <span>
                {actualMemberCount} member{actualMemberCount !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="size-4" />
              <span>Created {formatDate(organization.createdAt)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 opacity-80 group-hover:opacity-100 transition-opacity duration-300">
            <Button
              asChild
              className="flex-1 transition-all duration-200 hover:scale-105"
              size="sm"
            >
              <Link href={`/dashboard`}>
                <ExternalLink className="size-4 mr-2 py-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                Go to Dashboard
              </Link>
            </Button>
            {(actualUserRole === 'owner' || actualUserRole === 'admin') && (
              <Button
                asChild
                variant="outline"
                size="sm"
                aria-label="Organization settings"
                className="transition-all duration-200 hover:scale-105 hover:rotate-12 p-1 hover:bg-muted rounded"
              >
                <Link href={`/dashboard/organization/${organization.slug}`}>
                  <Settings className="size-4 transition-transform duration-200" />
                </Link>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
