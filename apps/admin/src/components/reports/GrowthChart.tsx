"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { GrowthTrendItem } from "@/lib/reports-queries";

type Props = {
  data: GrowthTrendItem[];
};

export function GrowthChart({ data }: Props) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-zinc-500">
        No growth data available
      </div>
    );
  }

  return (
    <div className="h-72 w-full pt-2">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
        >
          <defs>
            <linearGradient id="orgGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#d4af37" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#d4af37" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="userGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.08)"
            vertical={false}
          />
          <XAxis
            dataKey="period"
            stroke="#94a3b8"
            fontSize={12}
            tickLine={false}
            axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
          />
          <YAxis
            stroke="#94a3b8"
            fontSize={12}
            tickLine={false}
            axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
            allowDecimals={false}
          />
          <Tooltip
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
            verticalAlign="top"
            height={36}
            wrapperStyle={{ fontSize: "12px", color: "#cbd5e1" }}
          />
          <Area
            type="monotone"
            dataKey="organizations"
            name="Organizations"
            stroke="#d4af37"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#orgGradient)"
          />
          <Area
            type="monotone"
            dataKey="users"
            name="Users"
            stroke="#38bdf8"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#userGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
