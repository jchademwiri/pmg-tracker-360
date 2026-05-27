import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { getTenderStats } from '@/server/tenders';

interface DashboardChartsProps {
  organizationId: string;
}

export async function DashboardCharts({
  organizationId,
}: DashboardChartsProps) {
  const { stats: tenderStats } = await getTenderStats(organizationId);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Tender Status Distribution</CardTitle>
          <CardDescription>
            Current breakdown of tender statuses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(tenderStats.statusCounts).map(([status, count]) => {
              if (count === 0) return null;
              const percentage =
                tenderStats.totalTenders > 0
                  ? (count / tenderStats.totalTenders) * 100
                  : 0;
              const width = `${Math.max(percentage, 5)}%`;

              return (
                <div key={status} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="capitalize font-medium">{status}</span>
                    <span className="text-muted-foreground">
                      {count} ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        status === 'won'
                          ? 'bg-green-500'
                          : status === 'lost'
                            ? 'bg-red-500'
                            : status === 'submitted'
                              ? 'bg-blue-500'
                              : status === 'pending'
                                ? 'bg-yellow-500'
                                : 'bg-gray-500'
                      }`}
                      role="progressbar"
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={
                        typeof width === 'string' ? parseFloat(width) : width
                      }
                      aria-label={`Progress: ${width}`}
                      style={{ width }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Monthly Trends</CardTitle>
          <CardDescription>
            Tender activity over the last 6 months
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-48 text-muted-foreground">
            <p>Not enough data for trends yet</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
