import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  Users,
  Calendar,
  Activity,
  TrendingUp,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import {
  getOrganizationStats,
  type OrganizationStats,
} from '@/server/organizations';

interface OrganizationStatsProps {
  organizationId: string;
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  badge?: {
    text: string;
    variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  };
  description?: string;
}

function StatCard({ title, value, icon, badge, description }: StatCardProps) {
  return (
    <Card className="transition-colors hover:bg-muted/50">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="h-4 w-4 text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold">{value}</div>
            {description && (
              <p className="text-xs text-muted-foreground mt-1">
                {description}
              </p>
            )}
          </div>
          {badge && (
            <Badge variant={badge.variant || 'secondary'} className="ml-2">
              {badge.text}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function StatCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-4" />
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="h-5 w-12" />
        </div>
      </CardContent>
    </Card>
  );
}

function StatsErrorCard({ onRetry }: { onRetry?: () => void }) {
  return (
    <Card className="border-destructive/50 col-span-full">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-destructive/10">
              <AlertCircle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <h3 className="font-medium text-destructive">
                Failed to Load Statistics
              </h3>
              <p className="text-sm text-muted-foreground">
                Unable to fetch organization statistics at this time.
              </p>
            </div>
          </div>
          {onRetry && (
            <Button onClick={onRetry} variant="outline" size="sm">
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function formatLastActivity(date: Date): string {
  const now = new Date();
  const diffInDays = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffInDays === 0) {
    return 'Today';
  } else if (diffInDays === 1) {
    return 'Yesterday';
  } else if (diffInDays < 7) {
    return `${diffInDays} days ago`;
  } else if (diffInDays < 30) {
    const weeks = Math.floor(diffInDays / 7);
    return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  } else {
    const months = Math.floor(diffInDays / 30);
    return `${months} month${months > 1 ? 's' : ''} ago`;
  }
}

export async function OrganizationStats({
  organizationId,
}: OrganizationStatsProps) {
  try {
    const stats = await getOrganizationStats(organizationId);

    if (!stats) {
      return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
      );
    }

    const lastActivityText = formatLastActivity(stats.lastActivity);
    const isRecentActivity =
      stats.lastActivity &&
      new Date().getTime() - stats.lastActivity.getTime() <
        7 * 24 * 60 * 60 * 1000; // 7 days

    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Members"
          value={stats.memberCount}
          icon={<Users />}
          badge={{
            text: stats.memberCount === 1 ? 'Member' : 'Members',
            variant: 'secondary',
          }}
          description="Active organization members"
        />

        <StatCard
          title="Last Activity"
          value={lastActivityText}
          icon={<Calendar />}
          badge={{
            text: isRecentActivity ? 'Active' : 'Quiet',
            variant: isRecentActivity ? 'default' : 'outline',
          }}
          description="Most recent organization activity"
        />

        {stats.activeProjects !== undefined && (
          <StatCard
            title="Active Projects"
            value={stats.activeProjects}
            icon={<Activity />}
            badge={{
              text: stats.activeProjects > 0 ? 'In Progress' : 'None',
              variant: stats.activeProjects > 0 ? 'default' : 'outline',
            }}
            description="Currently active projects"
          />
        )}

        {stats.recentUpdates !== undefined && (
          <StatCard
            title="Recent Updates"
            value={stats.recentUpdates}
            icon={<TrendingUp />}
            badge={{
              text: stats.recentUpdates > 0 ? 'Updates' : 'None',
              variant: stats.recentUpdates > 0 ? 'default' : 'outline',
            }}
            description="Updates in the last 7 days"
          />
        )}
      </div>
    );
  } catch (error) {
    console.error('Failed to load organization stats:', error);
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsErrorCard onRetry={() => window.location.reload()} />
      </div>
    );
  }
}

// Client-side loading component for when stats are being fetched
export function OrganizationStatsLoading() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCardSkeleton />
      <StatCardSkeleton />
      <StatCardSkeleton />
      <StatCardSkeleton />
    </div>
  );
}
