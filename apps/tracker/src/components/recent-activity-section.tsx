'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Users,
  Building2,
  Clock,
  ChevronRight,
  Activity as ActivityIcon,
  FolderOpen,
  Receipt,
  Truck,
} from 'lucide-react';
import type { RecentActivity } from '@/types/activity';
import { formatDistanceToNow, format } from 'date-fns';

interface RecentActivitySectionProps {
  activities: RecentActivity[];
  isLoading?: boolean;
  showViewAll?: boolean;
  onViewAll?: () => void;
  className?: string;
}

export function RecentActivitySection({
  activities,
  isLoading = false,
  showViewAll = false,
  onViewAll,
  className = '',
}: RecentActivitySectionProps) {
  if (isLoading) {
    return <RecentActivitySkeleton className={className} />;
  }

  if (activities.length === 0) {
    return <EmptyActivityState className={className} />;
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <ActivityIcon className="h-5 w-5" />
          Recent Activity
        </CardTitle>
        {showViewAll && onViewAll && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onViewAll}
            className="text-muted-foreground hover:text-foreground"
          >
            View all
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {activities.map((activity) => (
          <ActivityItem key={activity.id} activity={activity} />
        ))}
      </CardContent>
    </Card>
  );
}

interface ActivityItemProps {
  activity: RecentActivity;
}

function ActivityItem({ activity }: ActivityItemProps) {
  const getActivityIcon = (type: RecentActivity['type']) => {
    switch (type) {
      case 'member_joined':
        return <Users className="h-4 w-4 text-green-600" />;
      case 'member_left':
        return <Users className="h-4 w-4 text-red-600" />;
      case 'organization_created':
        return <Building2 className="h-4 w-4 text-blue-600" />;
      case 'organization_updated':
        return <Building2 className="h-4 w-4 text-orange-600" />;
      case 'role_changed':
        return <Users className="h-4 w-4 text-purple-600" />;
      case 'invitation_sent':
        return <Users className="h-4 w-4 text-blue-500" />;
      case 'invitation_accepted':
        return <Users className="h-4 w-4 text-green-500" />;
      case 'project_created':
        return <FolderOpen className="h-4 w-4 text-blue-600" />;
      case 'project_status_changed':
        return <FolderOpen className="h-4 w-4 text-orange-600" />;
      case 'po_created':
        return <Receipt className="h-4 w-4 text-green-600" />;
      case 'po_status_changed':
        return <Receipt className="h-4 w-4 text-yellow-600" />;
      case 'po_delivered':
        return <Truck className="h-4 w-4 text-green-700" />;
      default:
        return <ActivityIcon className="h-4 w-4 text-gray-600" />;
    }
  };

  const getActivityBadgeColor = (type: RecentActivity['type']) => {
    switch (type) {
      case 'member_joined':
      case 'invitation_accepted':
        return 'bg-green-100 text-green-800 hover:bg-green-100';
      case 'member_left':
        return 'bg-red-100 text-red-800 hover:bg-red-100';
      case 'organization_created':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-100';
      case 'organization_updated':
        return 'bg-orange-100 text-orange-800 hover:bg-orange-100';
      case 'role_changed':
        return 'bg-purple-100 text-purple-800 hover:bg-purple-100';
      case 'invitation_sent':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-100';
      case 'project_created':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-100';
      case 'project_status_changed':
        return 'bg-orange-100 text-orange-800 hover:bg-orange-100';
      case 'po_created':
        return 'bg-green-100 text-green-800 hover:bg-green-100';
      case 'po_status_changed':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100';
      case 'po_delivered':
        return 'bg-green-200 text-green-900 hover:bg-green-200';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
    }
  };

  const formatActivityType = (type: RecentActivity['type']) => {
    switch (type) {
      case 'member_joined':
        return 'Member Joined';
      case 'member_left':
        return 'Member Left';
      case 'organization_created':
        return 'Organization Created';
      case 'organization_updated':
        return 'Organization Updated';
      case 'role_changed':
        return 'Role Changed';
      case 'invitation_sent':
        return 'Invitation Sent';
      case 'invitation_accepted':
        return 'Invitation Accepted';
      case 'project_created':
        return 'Project Created';
      case 'project_status_changed':
        return 'Project Status Changed';
      case 'po_created':
        return 'Purchase Order Created';
      case 'po_status_changed':
        return 'Purchase Order Status Changed';
      case 'po_delivered':
        return 'Purchase Order Delivered';
      default:
        return 'Activity';
    }
  };

  return (
    <div className="flex items-start space-x-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
      <div className="flex-shrink-0 mt-0.5">
        {getActivityIcon(activity.type)}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex flex-col mb-1">
          <Badge
            variant="secondary"
            className={`text-xs ${getActivityBadgeColor(activity.type)}`}
          >
            {formatActivityType(activity.type)}
          </Badge>
        </div>

        <p className="text-sm text-foreground mb-2">{activity.description}</p>

        <div className="flex items-center text-xs text-muted-foreground">
          <Clock className="h-3 w-3 mr-1" />
          {format(activity.timestamp, 'dd MMM yyyy')} | {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
        </div>

        <div className="flex flex-col">
          {activity.userName && (
            <div className="flex  items-center space-x-2">
              <Avatar className="h-6 w-6">
                <AvatarImage
                  src={activity.userAvatar}
                  alt={activity.userName}
                />
                <AvatarFallback className="text-xs">
                  {activity.userName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground">
                {activity.userName}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyActivityState({ className }: { className?: string }) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <ActivityIcon className="h-5 w-5" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
            <ActivityIcon className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-sm font-medium text-foreground mb-2">
            No recent activity
          </h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            When you or your team members perform actions in your organizations,
            they&#x27;ll appear here to keep you updated.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function RecentActivitySkeleton({ className }: { className?: string }) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <ActivityIcon className="h-5 w-5" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="flex items-start space-x-3 p-3 rounded-lg border"
          >
            <Skeleton className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-4 w-full" />
              <div className="flex items-center justify-between">
                <Skeleton className="h-3 w-24" />
                <div className="flex items-center space-x-2">
                  <Skeleton className="h-6 w-6 rounded-full" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
