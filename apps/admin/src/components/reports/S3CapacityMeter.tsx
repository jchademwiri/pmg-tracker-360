"use client";

import { useState } from "react";
import type { CloudflareStorageOverview } from "@/lib/cloudflare-r2";
import {
  HardDrive,
  Cloud,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Database,
  Layers,
  Sparkles,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

type Props = {
  storage: CloudflareStorageOverview;
};

function formatMB(mb: number): string {
  if (mb === 0) return "0.00 MB";
  return `${Number(mb.toFixed(2)).toLocaleString("en-US")} MB`;
}

function formatNum(n: number): string {
  return n.toLocaleString("en-US");
}

export function S3CapacityMeter({ storage }: Props) {
  const [showBuckets, setShowBuckets] = useState(true);

  const {
    connectedLiveApi,
    totalCapacityGB,
    totalUsedMB,
    totalUsedGB,
    availableStorageGB,
    availableStorageMB,
    utilizationPct,
    warningStatus,
    buckets,
    pmgDocumentCount,
    pmgStorageMB,
    pmgStorageGB,
    otherAppsStorageMB,
    otherAppsStorageGB,
  } = storage;

  // Determine colors based on warningStatus
  let barColor = "bg-gradient-to-r from-emerald-500 to-teal-400";
  let badgeBg = "bg-emerald-950/70 border-emerald-800/80 text-emerald-300";
  let statusIcon = <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
  let statusTitle = "Cloudflare R2 Free Tier Healthy";

  if (warningStatus === "critical") {
    barColor = "bg-gradient-to-r from-rose-500 to-red-600";
    badgeBg = "bg-rose-950/70 border-rose-800/80 text-rose-300";
    statusIcon = <AlertCircle className="h-4 w-4 text-rose-400" />;
    statusTitle = "Storage Capacity Critical (≥ 90%)";
  } else if (warningStatus === "warning") {
    barColor = "bg-gradient-to-r from-amber-500 to-orange-400";
    badgeBg = "bg-amber-950/70 border-amber-800/80 text-amber-300";
    statusIcon = <AlertTriangle className="h-4 w-4 text-amber-400" />;
    statusTitle = "Approaching Free Tier Limit (≥ 75%)";
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 shadow-sm backdrop-blur space-y-6">
      {/* ── Top Header & Status ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-zinc-800/80 border border-zinc-700/60 text-amber-400">
            <Cloud className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-tight">
                Cloudflare R2 Storage & Multi-Bucket Capacity
              </h2>
              {connectedLiveApi ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-800/70">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live API Connected
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
                  DB Monitored
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Account-wide object storage footprint across all buckets vs
              provisioned capacity.
            </p>
          </div>
        </div>

        <div
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold ${badgeBg}`}
        >
          {statusIcon}
          <span>{statusTitle}</span>
        </div>
      </div>

      {/* ── Capacity Progress Bar & Visual Gauge ── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-medium">
          <div className="flex items-center gap-2">
            <span className="text-zinc-200 font-bold text-sm">
              {totalUsedGB >= 1 ? `${totalUsedGB} GB` : formatMB(totalUsedMB)}
            </span>
            <span className="text-zinc-500">used of</span>
            <span className="text-zinc-200 font-bold text-sm">
              {totalCapacityGB} GB
            </span>
            <span className="text-zinc-500">({utilizationPct}% utilized)</span>
          </div>
          <div className="text-zinc-400 text-xs">
            <span className="font-semibold text-emerald-400">
              {availableStorageGB} GB
            </span>{" "}
            available
          </div>
        </div>

        {/* Progress Bar Container */}
        <div className="relative h-4 w-full bg-zinc-950 rounded-full overflow-hidden border border-zinc-800">
          {/* Threshold markers */}
          <div
            className="absolute top-0 bottom-0 w-[1px] bg-amber-500/40 z-10"
            style={{ left: "75%" }}
            title="Warning Threshold (75% / 7.5 GB)"
          />
          <div
            className="absolute top-0 bottom-0 w-[1px] bg-rose-500/40 z-10"
            style={{ left: "90%" }}
            title="Critical Threshold (90% / 9.0 GB)"
          />

          {/* Active Progress Fill */}
          <div
            className={`h-full ${barColor} rounded-full transition-all duration-700 ease-out shadow-sm`}
            style={{ width: `${Math.max(1, Math.min(100, utilizationPct))}%` }}
          />
        </div>

        {/* Marker Ticks Legend */}
        <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono pt-0.5">
          <span>0 GB (0%)</span>
          <span className="hidden sm:inline">5 GB (50%)</span>
          <span className="text-amber-400/80">7.5 GB (75% Warning)</span>
          <span className="text-rose-400/80">9.0 GB (90% Critical)</span>
          <span>{totalCapacityGB} GB (100%)</span>
        </div>
      </div>

      {/* ── Key Metrics Grid (4 Cards) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 bg-zinc-950/60 border border-zinc-800/80 rounded-xl space-y-1">
          <div className="text-[11px] text-zinc-500 font-medium flex items-center gap-1.5">
            <HardDrive className="h-3.5 w-3.5 text-indigo-400" />
            Total Tier Limit
          </div>
          <div className="text-base font-bold text-white">
            {totalCapacityGB}.00 GB
          </div>
          <div className="text-[10px] text-zinc-500">Cloudflare Free Tier</div>
        </div>

        <div className="p-3 bg-zinc-950/60 border border-zinc-800/80 rounded-xl space-y-1">
          <div className="text-[11px] text-zinc-500 font-medium flex items-center gap-1.5">
            <Database className="h-3.5 w-3.5 text-amber-400" />
            Combined Used
          </div>
          <div className="text-base font-bold text-amber-400">
            {formatMB(totalUsedMB)}
          </div>
          <div className="text-[10px] text-zinc-500">
            {totalUsedGB} GB across all buckets
          </div>
        </div>

        <div className="p-3 bg-zinc-950/60 border border-zinc-800/80 rounded-xl space-y-1">
          <div className="text-[11px] text-zinc-500 font-medium flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            Available Space
          </div>
          <div className="text-base font-bold text-emerald-400">
            {availableStorageGB} GB
          </div>
          <div className="text-[10px] text-zinc-500">
            {formatMB(availableStorageMB)} remaining
          </div>
        </div>

        <div className="p-3 bg-zinc-950/60 border border-zinc-800/80 rounded-xl space-y-1">
          <div className="text-[11px] text-zinc-500 font-medium flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-blue-400" />
            PMG Tracker Share
          </div>
          <div className="text-base font-bold text-blue-400">
            {formatMB(pmgStorageMB)}
          </div>
          <div className="text-[10px] text-zinc-500">
            {formatNum(pmgDocumentCount)} documents
          </div>
        </div>
      </div>

      {/* ── Multi-Bucket Breakdown Inventory Table ── */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowBuckets(!showBuckets)}
            className="flex items-center gap-2 text-xs font-semibold text-zinc-300 hover:text-white transition-colors cursor-pointer"
          >
            <Layers className="h-4 w-4 text-[#d4af37]" />
            <span>Detected Cloudflare R2 Buckets ({buckets.length})</span>
            {showBuckets ? (
              <ChevronUp className="h-3.5 w-3.5 text-zinc-500" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 text-zinc-500" />
            )}
          </button>
          {!connectedLiveApi && (
            <span className="text-[11px] text-zinc-500">
              Set{" "}
              <code className="text-zinc-400 bg-zinc-800 px-1 py-0.5 rounded">
                CLOUDFLARE_API_TOKEN
              </code>{" "}
              for live multi-app discovery
            </span>
          )}
        </div>

        {showBuckets && (
          <div className="overflow-x-auto rounded-lg border border-zinc-800/80 bg-zinc-950/40">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-zinc-800 bg-zinc-900/80 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-2.5">Bucket Name</th>
                  <th className="px-4 py-2.5">App / Role</th>
                  <th className="px-4 py-2.5 text-right">Objects</th>
                  <th className="px-4 py-2.5 text-right">Storage (MB)</th>
                  <th className="px-4 py-2.5 text-right">Storage (GB)</th>
                  <th className="px-4 py-2.5 text-center">Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 font-mono">
                {buckets.map((b) => (
                  <tr
                    key={b.name}
                    className={`hover:bg-zinc-900/50 transition-colors ${
                      b.isCurrentApp ? "bg-indigo-950/20" : ""
                    }`}
                  >
                    <td className="px-4 py-2.5 font-sans font-medium text-zinc-200 flex items-center gap-2">
                      <HardDrive className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                      <span>{b.name}</span>
                    </td>
                    <td className="px-4 py-2.5 font-sans">
                      {b.isCurrentApp ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-950 text-indigo-300 border border-indigo-800/60">
                          PMG Tracker 360 (Current App)
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-zinc-800 text-zinc-300 border border-zinc-700">
                          Other App / Storage
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right text-zinc-300">
                      {formatNum(b.objectCount)}
                    </td>
                    <td className="px-4 py-2.5 text-right font-semibold text-zinc-200">
                      {formatMB(b.sizeMB)}
                    </td>
                    <td className="px-4 py-2.5 text-right text-zinc-400">
                      {b.sizeGB} GB
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <span className="inline-block px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 text-[10px] font-sans font-medium">
                        {b.percentage}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
