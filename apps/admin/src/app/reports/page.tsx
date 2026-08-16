import { requireAdminPage } from '@/lib/require-admin-page';
import {
  BarChart3,
  Building2,
  Users,
  HardDrive,
  Coins,
  FileSpreadsheet,
  TrendingUp,
  PieChart,
  ShieldAlert,
  Layers,
} from 'lucide-react';
import MetricCard from '@/components/MetricCard';
import {
  getPlatformOverviewStats,
  getGrowthTrend,
  getStorageBreakdown,
  getAllTenantsUtilization,
} from '@/lib/reports-queries';
import { GrowthChart } from '@/components/reports/GrowthChart';
import { StorageDonutChart } from '@/components/reports/StorageDonutChart';
import { TopTenantsChart } from '@/components/reports/TopTenantsChart';
import { S3CapacityMeter } from '@/components/reports/S3CapacityMeter';
import { ReportDownloadCards } from '@/components/reports/ReportDownloadCards';
import { TenantUtilizationTable } from './TenantUtilizationTable';

export const dynamic = 'force-dynamic';

export default async function AdminReportsPage() {
  // 1. Auth guard
  await requireAdminPage();

  // 2. Fetch platform aggregates concurrently
  const [overview, growthData, storageData, allTenants] = await Promise.all([
    getPlatformOverviewStats(),
    getGrowthTrend(),
    getStorageBreakdown(),
    getAllTenantsUtilization(),
  ]);

  const fmtCurrency = (v: number) => {
    if (v >= 1_000_000_000) return `R ${(v / 1_000_000_000).toFixed(2)}B`;
    if (v >= 1_000_000) return `R ${(v / 1_000_000).toFixed(2)}M`;
    if (v >= 1_000) return `R ${(v / 1_000).toFixed(1)}k`;
    return `R ${v.toLocaleString('en-ZA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* ── Page Header ────────────────────────────────────────── */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between border-b border-zinc-800 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-[#d4af37]" />
            Platform Reports & Analytics
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            System-wide operational intelligence, tenant growth trajectories, Cloudflare R2 multi-bucket capacity, and downloadable master dossiers.
          </p>
        </div>
      </div>

      {/* ── Top Metric Cards Grid ───────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Active Tenants"
          count={overview.activeTenants}
          icon={<Building2 className="w-5 h-5 text-indigo-400" />}
          variant="primary"
          secondaryNote={`${overview.totalTenants} total registered (${overview.softDeletedTenants} archived)`}
          href="/organizations"
        />

        <MetricCard
          label="Platform Users"
          count={overview.totalUsers}
          icon={<Users className="w-5 h-5 text-emerald-400" />}
          variant="success"
          secondaryNote={`${overview.verifiedUsers} email-verified (${overview.verificationRate}%)`}
          href="/users"
        />

        <MetricCard
          label="Cloudflare R2 Storage"
          count={`${overview.totalStorageMB.toLocaleString()} MB`}
          icon={<HardDrive className="w-5 h-5 text-amber-400" />}
          variant={
            overview.storageWarningStatus === 'critical'
              ? 'danger'
              : overview.storageWarningStatus === 'warning'
              ? 'warning'
              : 'primary'
          }
          secondaryNote={`${overview.availableStorageGB} GB free of ${overview.totalStorageCapacityGB} GB (${overview.storageUtilizationPct}% used)`}
        />

        <MetricCard
          label="Total Tender Pipeline"
          count={fmtCurrency(overview.totalTenderPipelineValue)}
          icon={<Coins className="w-5 h-5 text-[#d4af37]" />}
          variant="primary"
          secondaryNote={`${overview.totalTenders} total tenders (${fmtCurrency(overview.totalTenderAwardedValue)} won)`}
        />
      </div>

      {/* ── Cloudflare R2 Live Capacity & Multi-Bucket Meter ── */}
      <S3CapacityMeter storage={overview.storageOverview} />

      {/* ── Visual Analytics Section ────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Growth Trend (7 cols) */}
        <div className="lg:col-span-7 flex flex-col rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 shadow-sm backdrop-blur">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-[#d4af37]" />
              <h2 className="font-semibold text-zinc-100 text-sm">Tenant & User Acquisition</h2>
            </div>
            <span className="text-xs text-zinc-500 font-mono">Last 6 Months</span>
          </div>
          <p className="text-xs text-zinc-400 mb-4">
            Trajectory of newly created organizations and registered platform users.
          </p>
          <div className="flex-1 min-h-[280px]">
            <GrowthChart data={growthData} />
          </div>
        </div>

        {/* Storage Breakdown Donut (5 cols) */}
        <div className="lg:col-span-5 flex flex-col rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 shadow-sm backdrop-blur">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <PieChart className="h-4 w-4 text-emerald-400" />
              <h2 className="font-semibold text-zinc-100 text-sm">Storage by Resource Type</h2>
            </div>
            <span className="text-xs text-zinc-500 font-mono">Cloudflare R2</span>
          </div>
          <p className="text-xs text-zinc-400 mb-4">
            Distribution of file volume across tenders, contracts, POs, and extensions.
          </p>
          <div className="flex-1 min-h-[280px]">
            <StorageDonutChart data={storageData.categories} />
          </div>
        </div>
      </div>

      {/* ── Top Tenants Chart ────────────────────────────────────── */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 shadow-sm backdrop-blur">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-[#d4af37]" />
            <h2 className="font-semibold text-zinc-100 text-sm">Top 6 Tenants by Storage Footprint</h2>
          </div>
          <span className="text-xs text-zinc-500">Ranked by megabytes</span>
        </div>
        <p className="text-xs text-zinc-400 mb-2">
          Organizations generating the highest storage and document volume.
        </p>
        <TopTenantsChart data={storageData.topTenants} />
      </div>

      {/* ── Downloadable Reports Grid ───────────────────────────── */}
      <div className="space-y-4 pt-2">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-emerald-400" />
            Downloadable Platform Reports
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Export structured Excel spreadsheets and formal PDF dossiers for audits, stakeholders, and capacity planning.
          </p>
        </div>

        <ReportDownloadCards />
      </div>

      {/* ── Tenant Utilization Schedule Table ───────────────────── */}
      <div className="space-y-4 pt-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Building2 className="h-5 w-5 text-indigo-400" />
            Complete Tenant Utilization Roster
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Detailed breakdown of every tenant with member count, tender volume, active projects, and file storage.
          </p>
        </div>

        <TenantUtilizationTable tenants={allTenants} />
      </div>
    </div>
  );
}
