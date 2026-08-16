import { requireAdminPage } from '@/lib/require-admin-page';
import {
  HardDrive,
  Database,
  FileText,
  Building2,
  PieChart,
  ShieldCheck,
  AlertTriangle,
  FileSpreadsheet,
  Download,
  Coins,
  Layers,
} from 'lucide-react';
import MetricCard from '@/components/MetricCard';
import {
  getPlatformOverviewStats,
  getStorageBreakdown,
  getAllTenantsUtilization,
} from '@/lib/reports-queries';
import { S3CapacityMeter } from '@/components/reports/S3CapacityMeter';
import { StorageDonutChart } from '@/components/reports/StorageDonutChart';
import { TopTenantsChart } from '@/components/reports/TopTenantsChart';
import { TenantUtilizationTable } from '../reports/TenantUtilizationTable';
import { ReportDownloadCards } from '@/components/reports/ReportDownloadCards';

export const dynamic = 'force-dynamic';

export default async function AdminStoragePage() {
  // 1. Auth guard
  await requireAdminPage();

  // 2. Fetch storage analytics concurrently
  const [overview, storageData, allTenants] = await Promise.all([
    getPlatformOverviewStats(),
    getStorageBreakdown(),
    getAllTenantsUtilization(),
  ]);

  // Compute active tenant storage users
  const activeStorageTenants = allTenants.filter((t) => t.storageBytes > 0).length;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* ── Page Header ────────────────────────────────────────── */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between border-b border-zinc-800 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <HardDrive className="h-8 w-8 text-[#d4af37]" />
            Platform Storage & Cloudflare R2
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Global object storage capacity, multi-bucket Cloudflare R2 infrastructure, tenant consumption quotas, and downloadable storage audit dossiers.
          </p>
        </div>
      </div>

      {/* ── 4 Key Storage Metric Cards ──────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Total Stored Volume"
          count={`${overview.totalStorageMB.toLocaleString('en-US')} MB`}
          icon={<Database className="w-5 h-5 text-indigo-400" />}
          variant="primary"
          secondaryNote={`${overview.availableStorageGB} GB free of ${overview.totalStorageCapacityGB} GB tier (${overview.storageUtilizationPct}% used)`}
        />
        <MetricCard
          label="Total Documents"
          count={storageData.storageOverview.pmgDocumentCount.toLocaleString()}
          icon={<FileText className="w-5 h-5 text-emerald-400" />}
          variant="success"
          secondaryNote="Across all tenant workspaces & buckets"
        />
        <MetricCard
          label="Active Storage Tenants"
          count={`${activeStorageTenants} / ${allTenants.length}`}
          icon={<Building2 className="w-5 h-5 text-amber-400" />}
          variant="warning"
          secondaryNote="Organizations with stored files"
          href="/organizations"
        />
        <MetricCard
          label="Cloudflare R2 Overage"
          count={
            overview.storageUtilizationPct > 100
              ? '$0.015/GB-mo'
              : '$0.00'
          }
          icon={<Coins className="w-5 h-5 text-[#d4af37]" />}
          variant={overview.storageUtilizationPct > 100 ? 'danger' : 'primary'}
          secondaryNote={
            overview.storageUtilizationPct > 100
              ? 'Tier capacity exceeded'
              : 'Within 10 GB free allowance'
          }
        />
      </div>

      {/* ── Live Cloudflare R2 Capacity Meter ───────────────────── */}
      <S3CapacityMeter storage={overview.storageOverview} />

      {/* ── Storage Analytics Visualizations ───────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="flex flex-col rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 shadow-sm backdrop-blur">
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

        <div className="flex flex-col rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 shadow-sm backdrop-blur">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-indigo-400" />
              <h2 className="font-semibold text-zinc-100 text-sm">Top Storage Consumers</h2>
            </div>
            <span className="text-xs text-zinc-500 font-mono">Top 5 Tenants</span>
          </div>
          <p className="text-xs text-zinc-400 mb-4">
            Organizations with the largest object storage footprint.
          </p>
          <div className="flex-1 min-h-[280px]">
            <TopTenantsChart data={storageData.topTenants} />
          </div>
        </div>
      </div>

      {/* ── All Tenants Storage Utilization Table ──────────────── */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Layers className="h-5 w-5 text-[#d4af37]" />
            Tenant Storage Utilization Inventory
          </h2>
          <p className="text-sm text-zinc-400">
            Real-time storage footprints, document counts, and plan quota utilization per organization.
          </p>
        </div>
        <TenantUtilizationTable tenants={allTenants} />
      </div>

      {/* ── Downloadable Storage Audit Dossiers ─────────────────── */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Download className="h-5 w-5 text-[#d4af37]" />
            Downloadable Storage Audit Reports
          </h2>
          <p className="text-sm text-zinc-400">
            Export comprehensive storage utilization dossiers for capacity planning, cost accounting, and compliance reporting.
          </p>
        </div>
        <ReportDownloadCards />
      </div>
    </div>
  );
}
