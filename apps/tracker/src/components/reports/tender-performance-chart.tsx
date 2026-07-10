'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const STATUS_COLORS: Record<string, string> = {
  awarded: '#22c55e',
  lost: '#ef4444',
  pending: '#f59e0b',
  evaluation: '#3b82f6',
  closed: '#6b7280',
};

interface TenderPerformanceChartProps {
  stats: {
    wonTenders: number;
    lostTenders: number;
    pendingTenders: number;
    winRate: number;
    totalTenders: number;
  };
}

export function TenderPerformanceChart({ stats }: TenderPerformanceChartProps) {
  const pieData = [
    { name: 'Won', value: stats.wonTenders, color: STATUS_COLORS.awarded },
    { name: 'Lost', value: stats.lostTenders, color: STATUS_COLORS.lost },
    { name: 'Pending', value: stats.pendingTenders, color: STATUS_COLORS.pending },
  ].filter((d) => d.value > 0);

  const barData = [
    { name: 'Won', count: stats.wonTenders },
    { name: 'Lost', count: stats.lostTenders },
    { name: 'Pending', count: stats.pendingTenders },
  ];

  const decidedTenders = stats.wonTenders + stats.lostTenders;
  const winRate = decidedTenders > 0 ? Math.round((stats.wonTenders / decidedTenders) * 100) : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tender Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center gap-6 mb-6">
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Win Rate</div>
            <div className="text-3xl font-bold text-green-600">{winRate}%</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Total</div>
            <div className="text-3xl font-bold">{stats.totalTenders}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Won</div>
            <div className="text-3xl font-bold text-green-600">{stats.wonTenders}</div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Bar Chart */}
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis allowDecimals={false} className="text-xs" />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {barData.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={STATUS_COLORS[entry.name.toLowerCase()] || '#3b82f6'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Pie Chart */}
          <div className="h-[220px] flex items-center justify-center">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-sm">No data to display</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
