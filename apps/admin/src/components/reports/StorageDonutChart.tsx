"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { StorageCategoryBreakdown } from "@/lib/reports-queries";

type Props = {
  data: StorageCategoryBreakdown[];
};

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#8b5cf6", "#64748b"];

export function StorageDonutChart({ data }: Props) {
  const chartData = data
    .filter((d) => d.sizeBytes > 0)
    .map((d) => ({
      name: d.category,
      value: d.sizeMB,
      count: d.count,
    }));

  if (chartData.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-zinc-500">
        No document storage recorded yet
      </div>
    );
  }

  return (
    <div className="h-72 w-full pt-2">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={4}
            dataKey="value"
          >
            {chartData.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
                stroke="rgba(0,0,0,0.3)"
                strokeWidth={1}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: any, name: any, item: any) => [
              `${Number(value).toFixed(2)} MB (${item.payload.count} files)`,
              name,
            ]}
            contentStyle={{
              backgroundColor: "#0f172a",
              borderColor: "rgba(255,255,255,0.15)",
              borderRadius: "8px",
              color: "#f8fafc",
              fontSize: "12px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
            }}
          />
          <Legend
            verticalAlign="bottom"
            height={48}
            wrapperStyle={{
              fontSize: "11px",
              color: "#cbd5e1",
              paddingTop: "8px",
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
