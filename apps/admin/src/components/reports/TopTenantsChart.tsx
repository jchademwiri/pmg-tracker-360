'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { TenantStorageUsage } from '@/lib/reports-queries';

type Props = {
  data: TenantStorageUsage[];
};

export function TopTenantsChart({ data }: Props) {
  const chartData = data.slice(0, 6).map((t) => ({
    name: t.name.length > 18 ? t.name.slice(0, 16) + '…' : t.name,
    storageMB: t.storageMB,
    tenders: t.tenderCount,
    projects: t.projectCount,
  }));

  if (chartData.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-zinc-500">
        No tenant activity data yet
      </div>
    );
  }

  return (
    <div className="h-72 w-full pt-2">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 10, right: 20, left: 20, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" horizontal={false} />
          <XAxis
            type="number"
            stroke="#94a3b8"
            fontSize={12}
            tickLine={false}
            axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
            unit=" MB"
          />
          <YAxis
            type="category"
            dataKey="name"
            stroke="#94a3b8"
            fontSize={12}
            tickLine={false}
            axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
            width={120}
          />
          <Tooltip
            formatter={(value: any, name: any) => [
              `${Number(value).toFixed(2)} MB`,
              'Storage',
            ]}
            contentStyle={{
              backgroundColor: '#0f172a',
              borderColor: 'rgba(255,255,255,0.15)',
              borderRadius: '8px',
              color: '#f8fafc',
              fontSize: '12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
            }}
          />
          <Bar
            dataKey="storageMB"
            name="Storage (MB)"
            fill="#d4af37"
            radius={[0, 4, 4, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
