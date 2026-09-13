"use client";

import { useState } from "react";
import { CalendarClock, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { DateRangePreset } from "@/lib/date-range-presets";

const PRESET_OPTIONS: Array<{ value: DateRangePreset; label: string }> = [
  { value: "all", label: "All Time (Complete Pipeline)" },
  { value: "weekly", label: "This Week" },
  { value: "monthly", label: "This Month" },
  { value: "quarterly", label: "This Quarter" },
  { value: "yearly", label: "This Year" },
  { value: "custom", label: "Custom Date Range..." },
];

async function downloadReport(url: string, fallbackFilename: string) {
  const response = await fetch(url);
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error || `Export failed with status ${response.status}`);
  }
  const blob = await response.blob();
  const disposition = response.headers.get("content-disposition");
  const match = disposition?.match(/filename="([^"]+)"/i);
  const filename = match?.[1] || fallbackFilename;
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}

function buildDateQueryParams(
  preset: DateRangePreset,
  startDate: string,
  endDate: string,
): string {
  const params = new URLSearchParams();
  if (preset !== "all") {
    params.set("preset", preset);
  }
  if (preset === "custom") {
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
  }
  const qs = params.toString();
  return qs ? "?" + qs : "";
}

export function TenderFollowUpButton() {
  const [preset, setPreset] = useState<DateRangePreset>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (preset === "custom" && !startDate && !endDate) {
      toast.error("Please pick at least a start date or end date for custom range.");
      return;
    }

    setIsExporting(true);
    const toastId = toast.loading("Generating Management Follow-Up PDF...");

    try {
      const qs = buildDateQueryParams(preset, startDate, endDate);
      const url = `/api/reports/tenders/follow-up/pdf${qs}`;
      const fallback = `tender-follow-up-report-${new Date().toISOString().slice(0, 10)}.pdf`;
      await downloadReport(url, fallback);
      toast.success("Follow-up report downloaded successfully", { id: toastId });
    } catch (error) {
      console.error("Management follow-up export failed:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to generate report.",
        { id: toastId },
      );
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-muted-foreground">
          Follow-up Date Range
        </label>
        <select
          value={preset}
          onChange={(e) => setPreset(e.target.value as DateRangePreset)}
          className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          {PRESET_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {preset === "custom" && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[11px] text-muted-foreground">From</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
            />
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground">To</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
            />
          </div>
        </div>
      )}

      <Button
        type="button"
        className="w-full"
        onClick={handleExport}
        disabled={isExporting}
      >
        {isExporting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating Follow-up Report...
          </>
        ) : (
          <>
            <FileText className="mr-2 h-4 w-4" />
            Download Follow-Up PDF
          </>
        )}
      </Button>
    </div>
  );
}
