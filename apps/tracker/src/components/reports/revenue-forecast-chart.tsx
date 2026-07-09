'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/format';

interface RevenueForecastChartProps {
  stats: {
    pipelineValue: number;
    totalWonValue: number;
    poRevenue: number;
    pendingTenders: number;
  };
}

export function RevenueForecastChart({ stats }: RevenueForecastChartProps) {
  // Build a simple dataset showing pipeline stages and their values
  const chartData = [
    {
      name: 'Pipeline',
      value: stats.pipelineValue,
      fill: '#f59e0b',
    },
    {
      name: 'Booked',
      value: stats.totalWonValue,
      fill: '#22c55e',
    },
    {
      name: 'Guaranteed',
      value: stats.poRevenue,
      fill: '#06b6d4',
    },
  ].filter((d) => d.value > 0);

  const hasData = chartData.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue Forecast</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <div className="text-xs text-muted-foreground">Pipeline</div>
            <div className="text-lg font-semibold text-amber-500">
              {formatCurrency(stats.pipelineValue)}
            </div>
            <div className="text-xs text-muted-foreground">{stats.pendingTenders} pending</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground">Booked</div>
            <div className="text-lg font-semibold text-green-600">
              {formatCurrency(stats.totalWonValue)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground">Guaranteed</div>
            <div className="text-lg font-semibold text-cyan-500">
              {formatCurrency(stats.poRevenue)}
            </div>
          </div>
        </div>

        <div className="h-[200px]">
          {hasData ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis
                  tickFormatter={(val) => `R${(val / 1000).toFixed(0)}k`}
                  className="text-xs"
                />
                <Tooltip
                  formatter={(value: number) => [formatCurrency(value), 'Value']}
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center">
              <p className="text-muted-foreground text-sm">No revenue data yet</p>
            </div>
          )}
        </div>

        {/* Summary bar */}
        <div className="mt-4 p-3 bg-muted/30 rounded-lg">
          <div className="text-sm text-muted-foreground">
            Total addressable:{' '}
            <span className="font-semibold text-foreground">
              {formatCurrency(stats.pipelineValue + stats.totalWonValue + stats.poRevenue)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
