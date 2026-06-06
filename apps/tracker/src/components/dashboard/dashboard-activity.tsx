import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { getRecentActivity } from '@/server/tenders';

interface DashboardActivityProps {
  organizationId: string;
}

interface ActivityItem {
  id: string;
  type: 'tender_created' | 'status_updated';
  description: string;
  timestamp: Date;
}

export async function DashboardActivity({
  organizationId,
}: DashboardActivityProps) {
  const { activity: activityData } = await getRecentActivity(
    organizationId,
    10
  );

  const recentActivity: ActivityItem[] = [
    ...activityData.recentTenders.map((t) => ({
      id: `create-${t.id}`,
      type: 'tender_created' as const,
      description: `New tender ${t.tenderNumber}`,
      timestamp: t.createdAt,
    })),
    ...activityData.recentChanges.map((t) => ({
      id: `update-${t.id}`,
      type: 'status_updated' as const,
      description: `Tender ${t.tenderNumber} updated to ${t.status}`,
      timestamp: t.updatedAt || t.createdAt,
    })),
  ]
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, 10);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Latest project and tender activities</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentActivity.length > 0 ? (
            recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start space-x-3 p-3 bg-muted/50 rounded-lg"
              >
                <div
                  className={`w-2 h-2 rounded-full mt-2 ${
                    activity.type.includes('created')
                      ? 'bg-green-500'
                      : activity.type.includes('status')
                        ? 'bg-blue-500'
                        : 'bg-gray-500'
                  }`}
                />
                <div className="flex-1">
                  <p className="text-sm font-medium">{activity.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(activity.timestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              <p className="text-sm">No recent activity</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
