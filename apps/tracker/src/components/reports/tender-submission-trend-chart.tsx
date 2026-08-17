"use client";

import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const STATUS_COLORS: Record<string, string> = {
  won: "#22c55e",
  lost: "#ef4444",
  pending: "#f59e0b",
};

interface TenderSubmissionTrendChartProps {
  data: Array<{
    key: string;
    label: string;
    count: number;
    won: number;
    lost: number;
    pending: number;
  }>;
}

export function TenderSubmissionTrendChart({
  data,
}: TenderSubmissionTrendChartProps) {
  const total = data.reduce((sum, d) => sum + d.count, 0);
  const totals = {
    won: data.reduce((sum, d) => sum + d.won, 0),
    lost: data.reduce((sum, d) => sum + d.lost, 0),
    pending: data.reduce((sum, d) => sum + d.pending, 0),
  };
  const peak = data.reduce((best, d) => (d.count > best.count ? d : best), {
    label: "—",
    count: 0,
  });
  const hasData = total > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tender Submission Trends</CardTitle>
        <p className="text-sm text-muted-foreground">
          Tenders submitted per month, by status (last 12 months)
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-2 mb-6">
          <div className="text-center">
            <div className="text-xs text-muted-foreground">Last 12 months</div>
            <div className="text-2xl font-bold">{total}</div>
            <div className="text-xs text-muted-foreground">
              {peak.label} peak
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground">Won</div>
            <div className="text-2xl font-bold text-green-600">
              {totals.won}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground">Lost</div>
            <div className="text-2xl font-bold text-red-600">{totals.lost}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground">Pending</div>
            <div className="text-2xl font-bold text-amber-500">
              {totals.pending}
            </div>
          </div>
        </div>

        <div className="h-[220px]">
          {hasData ? (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-border/50"
                />
                <XAxis dataKey="label" className="text-xs" />
                <YAxis allowDecimals={false} className="text-xs" />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Bar
                  dataKey="won"
                  name="Won"
                  stackId="status"
                  fill={STATUS_COLORS.won}
                  barSize={32}
                />
                <Bar
                  dataKey="lost"
                  name="Lost"
                  stackId="status"
                  fill={STATUS_COLORS.lost}
                />
                <Bar
                  dataKey="pending"
                  name="Pending"
                  stackId="status"
                  fill={STATUS_COLORS.pending}
                  radius={[4, 4, 0, 0]}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  name="Total"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "#3b82f6" }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center">
              <p className="text-muted-foreground text-sm">
                No tender submissions in the last 12 months
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
