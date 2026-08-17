"use client";

import { useState } from "react";
import {
  FileSpreadsheet,
  FileText,
  Download,
  Loader2,
  CheckCircle2,
  Building2,
  HardDrive,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type ReportCardConfig = {
  id: string;
  title: string;
  badge: string;
  badgeColor: string;
  icon: typeof Building2;
  iconBg: string;
  iconColor: string;
  description: string;
  bullets: string[];
  excelEndpoint: string;
  pdfEndpoint: string;
  excelFilenamePrefix: string;
  pdfFilenamePrefix: string;
};

export function ReportDownloadCards() {
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleDownload = async (
    reportKey: string,
    endpoint: string,
    filename: string,
  ) => {
    try {
      setDownloading(reportKey);
      const res = await fetch(endpoint);
      if (!res.ok) {
        throw new Error("Failed to generate report");
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error(err);
      alert("Failed to download report. Please try again.");
    } finally {
      setDownloading(null);
    }
  };

  const dateStr = new Date().toISOString().split("T")[0];

  const reports: ReportCardConfig[] = [
    {
      id: "platform-master",
      title: "Platform Master Portfolio",
      badge: "Portfolio & Tenants",
      badgeColor: "text-indigo-400",
      icon: Building2,
      iconBg: "bg-indigo-950/80 border-indigo-800/60",
      iconColor: "text-indigo-400",
      description:
        "Executive platform intelligence across all tenants, user growth trajectories, commercial pipeline sums, and active project counts.",
      bullets: [
        "Complete tenant roster & status indicators",
        "Commercial pipeline & tender conversion sums",
        "User verification rates & plan distribution",
      ],
      excelEndpoint: "/api/reports/platform/xlsx",
      pdfEndpoint: "/api/reports/platform/pdf",
      excelFilenamePrefix: "pmg-platform-master",
      pdfFilenamePrefix: "pmg-executive-platform-report",
    },
    {
      id: "storage-audit",
      title: "Storage & S3 Infrastructure",
      badge: "Resource Quota",
      badgeColor: "text-amber-400",
      icon: HardDrive,
      iconBg: "bg-amber-950/80 border-amber-800/60",
      iconColor: "text-amber-400",
      description:
        "Detailed AWS S3 storage footprint breakdown by document attachment categories (Tenders, POs, Contracts, PODs) and top consuming tenants.",
      bullets: [
        "S3 megabytes consumed by document category",
        "Ranked tenant storage quota consumption",
        "Lifetime file count & storage capacity audit",
      ],
      excelEndpoint: "/api/reports/storage/xlsx",
      pdfEndpoint: "/api/reports/storage/pdf",
      excelFilenamePrefix: "pmg-storage-audit",
      pdfFilenamePrefix: "pmg-storage-audit",
    },
    {
      id: "security-audit",
      title: "Security & Compliance Trail",
      badge: "Audit & Access",
      badgeColor: "text-emerald-400",
      icon: ShieldCheck,
      iconBg: "bg-emerald-950/80 border-emerald-800/60",
      iconColor: "text-emerald-400",
      description:
        "Comprehensive security audit event log, suspicious IP/session origin flags, admin privilege transitions, and ownership transfer records.",
      bullets: [
        "Critical, warning, and info security event trail",
        "Suspicious session tracking & IP detection",
        "Immutable admin actions & compliance record",
      ],
      excelEndpoint: "/api/reports/security/xlsx",
      pdfEndpoint: "/api/reports/security/pdf",
      excelFilenamePrefix: "pmg-security-audit",
      pdfFilenamePrefix: "pmg-security-audit",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 items-stretch">
      {reports.map((r) => {
        const Icon = r.icon;
        const excelKey = `${r.id}-xlsx`;
        const pdfKey = `${r.id}-pdf`;
        const isExcelLoading = downloading === excelKey;
        const isPdfLoading = downloading === pdfKey;

        return (
          <div
            key={r.id}
            className="flex h-full flex-col rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 shadow-sm backdrop-blur transition-all hover:border-zinc-700 hover:shadow-md"
          >
            {/* Card Header */}
            <div className="flex items-center gap-3 mb-3">
              <div
                className={`rounded-lg border p-2.5 ${r.iconBg} ${r.iconColor}`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-zinc-100">{r.title}</h3>
                <span
                  className={`text-[11px] font-medium uppercase tracking-wider ${r.badgeColor}`}
                >
                  {r.badge}
                </span>
              </div>
            </div>

            {/* Description */}
            <p className="text-xs leading-relaxed text-zinc-400 mb-4 flex-1">
              {r.description}
            </p>

            {/* Bullet Points */}
            <div className="space-y-1.5 border-t border-zinc-800/80 pt-3 mb-4 text-[11px] text-zinc-400">
              {r.bullets.map((b, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <span>{b}</span>
                </div>
              ))}
            </div>

            {/* 2-Button Row (Excel & PDF) */}
            <div className="mt-auto pt-2">
              <div className="grid grid-cols-2 gap-2">
                {/* Excel Option */}
                <Button
                  onClick={() =>
                    handleDownload(
                      excelKey,
                      r.excelEndpoint,
                      `${r.excelFilenamePrefix}-${dateStr}.xlsx`,
                    )
                  }
                  disabled={downloading !== null}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs h-9 shadow-sm flex items-center justify-center gap-1.5"
                >
                  {isExcelLoading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Excel...</span>
                    </>
                  ) : (
                    <>
                      <FileSpreadsheet className="h-3.5 w-3.5" />
                      <span>Excel</span>
                    </>
                  )}
                </Button>

                {/* PDF Option */}
                <Button
                  onClick={() =>
                    handleDownload(
                      pdfKey,
                      r.pdfEndpoint,
                      `${r.pdfFilenamePrefix}-${dateStr}.pdf`,
                    )
                  }
                  disabled={downloading !== null}
                  className="bg-amber-600 hover:bg-amber-500 text-white font-medium text-xs h-9 shadow-sm flex items-center justify-center gap-1.5"
                >
                  {isPdfLoading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>PDF...</span>
                    </>
                  ) : (
                    <>
                      <FileText className="h-3.5 w-3.5" />
                      <span>PDF</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
