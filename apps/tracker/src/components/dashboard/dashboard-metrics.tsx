import { TrendingUp, FileText, FolderOpen, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@pmg/ui/components/ui/card';

interface TenderStats {
  success: boolean;
  stats?: {
    totalTenders: number;
    statusCounts: { draft: number; submitted: number; won: number; lost: number; pending: number };
    totalValue: number;
    winRate: number;
    upcomingDeadlines: number;
    overdueCount: number;
  };
}

interface ProjectStats {
  success: boolean;
  stats?: {
    totalProjects: number;
    statusCounts: { active: number; completed: number; cancelled: number };
    activePOs: number;
    totalPOAmount: number;
  };
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', maximumFractionDigits: 0 }).format(value);
}

function formatPercent(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

export function DashboardMetrics({ tenderStats, projectStats }: { tenderStats: TenderStats; projectStats: ProjectStats }) {
  const ts = tenderStats.stats;
  const ps = projectStats.stats;

  const metrics = [
    {
      title: 'Total Tenders',
      value: ts?.totalTenders ?? 0,
      sub: `${ts?.statusCounts.submitted ?? 0} submitted · ${ts?.statusCounts.won ?? 0} won`,
      icon: <FileText className="h-4 w-4 text-muted-foreground" />,
    },
    {
      title: 'Win Rate',
      value: ts ? formatPercent(ts.winRate) : '0%',
      sub: `${ts?.statusCounts.won ?? 0} won out of ${ts?.totalTenders ?? 0}`,
      icon: <TrendingUp className="h-4 w-4 text-muted-foreground" />,
    },
    {
      title: 'Active Projects',
      value: ps?.statusCounts.active ?? 0,
      sub: `${ps?.activePOs ?? 0} active POs · ${formatCurrency(ps?.totalPOAmount ?? 0)}`,
      icon: <FolderOpen className="h-4 w-4 text-muted-foreground" />,
    },
    {
      title: 'Upcoming Deadlines',
      value: ts?.upcomingDeadlines ?? 0,
      sub: `${ts?.overdueCount ?? 0} overdue`,
      icon: <AlertCircle className="h-4 w-4 text-muted-foreground" />,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {metrics.map((m) => (
        <Card key={m.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{m.title}</CardTitle>
            {m.icon}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{m.value}</div>
            <p className="text-xs text-muted-foreground mt-1">{m.sub}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
