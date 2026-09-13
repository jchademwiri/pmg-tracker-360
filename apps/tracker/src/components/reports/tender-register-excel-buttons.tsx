"use client";

import { useState } from "react";
import { Download, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { formatClientName } from "@/lib/format";
import type { DateRangePreset } from "@/lib/date-range-presets";

type ClientOption = { id: string; name: string };

const PRESET_OPTIONS: Array<{ value: DateRangePreset; label: string }> = [
  { value: "all", label: "All Time (Complete Register)" },
  { value: "weekly", label: "This Week (Weekly)" },
  { value: "monthly", label: "This Month (Monthly)" },
  { value: "quarterly", label: "This Quarter (Quarterly)" },
  { value: "biannually", label: "Bi-Annually (Half-Year)" },
  { value: "yearly", label: "This Year (Annual)" },
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
  return qs ? "&" + qs : "";
}

export function TenderRegisterButtons() {
  const [preset, setPreset] = useState<DateRangePreset>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [format, setFormat] = useState<"xlsx" | "pdf" | null>(null);

  const handleExport = async (requestedFormat: "xlsx" | "pdf") => {
    if (preset === "custom" && !startDate && !endDate) {
      toast.error("Please pick at least a start date or end date for custom range.");
      return;
    }

    setFormat(requestedFormat);
    const label = requestedFormat === "pdf" ? "PDF" : "Excel";
    const toastId = toast.loading("Preparing " + label + " tender register...");
    try {
      const dateQs = buildDateQueryParams(preset, startDate, endDate);
      const url = "/api/reports/tenders/register/" + requestedFormat + "?" + dateQs.replace(/^&/, "");
      await downloadReport(
        url,
        "tender-register-" + new Date().toISOString().slice(0, 10) + "." + requestedFormat,
      );
      toast.success(label + " tender register downloaded", { id: toastId });
    } catch (error) {
      console.error("Tender register " + label + " export failed:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to export " + label + " report.",
        { id: toastId },
      );
    } finally {
      setFormat(null);
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">
          Reporting Period
        </label>
        <select
          value={preset}
          onChange={(e) => setPreset(e.target.value as DateRangePreset)}
          disabled={format !== null}
          className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
          aria-label="Select report date range"
        >
          {PRESET_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {preset === "custom" && (
        <div className="grid grid-cols-2 gap-2 rounded-md border border-dashed border-border p-2 bg-muted/30">
          <div>
            <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              From Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              disabled={format !== null}
              className="h-8 w-full rounded border border-input bg-background px-2 text-xs"
            />
          </div>
          <div>
            <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              To Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              disabled={format !== null}
              className="h-8 w-full rounded border border-input bg-background px-2 text-xs"
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 pt-1">
        <Button
          type="button"
          onClick={() => handleExport("xlsx")}
          disabled={format !== null}
        >
          {format === "xlsx" ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          {format === "xlsx" ? "Preparing..." : "Excel"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => handleExport("pdf")}
          disabled={format !== null}
        >
          {format === "pdf" ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <FileText className="mr-2 h-4 w-4" />
          )}
          {format === "pdf" ? "Preparing..." : "PDF"}
        </Button>
      </div>
    </div>
  );
}

export function ClientTenderReportButtons({
  clients,
}: {
  clients: ClientOption[];
}) {
  const [clientId, setClientId] = useState("");
  const [preset, setPreset] = useState<DateRangePreset>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [format, setFormat] = useState<"xlsx" | "pdf" | null>(null);

  const handleExport = async (requestedFormat: "xlsx" | "pdf") => {
    if (!clientId) {
      toast.error("Select a client first.");
      return;
    }
    if (preset === "custom" && !startDate && !endDate) {
      toast.error("Please pick at least a start date or end date for custom range.");
      return;
    }

    const client = clients.find((item) => item.id === clientId);
    setFormat(requestedFormat);
    const label = requestedFormat === "pdf" ? "PDF" : "Excel";
    const toastId = toast.loading(
      "Preparing " + (client?.name || "client") + " " + label + " report...",
    );
    try {
      const dateQs = buildDateQueryParams(preset, startDate, endDate);
      const url =
        "/api/reports/tenders/register/" +
        requestedFormat +
        "?clientId=" +
        encodeURIComponent(clientId) +
        dateQs;
      await downloadReport(
        url,
        (client?.name || "client") + "-tenders." + requestedFormat,
      );
      toast.success((client?.name || "Client") + " " + label + " report downloaded", {
        id: toastId,
      });
    } catch (error) {
      console.error("Client tender " + label + " export failed:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to export client " + label + " report.",
        { id: toastId },
      );
    } finally {
      setFormat(null);
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">
          Client
        </label>
        <select
          value={clientId}
          onChange={(event) => setClientId(event.target.value)}
          disabled={format !== null || clients.length === 0}
          className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
          aria-label="Select client for tender report"
        >
          <option value="">Select client...</option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {formatClientName(client.name)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">
          Reporting Period
        </label>
        <select
          value={preset}
          onChange={(e) => setPreset(e.target.value as DateRangePreset)}
          disabled={format !== null}
          className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
          aria-label="Select client report date range"
        >
          {PRESET_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {preset === "custom" && (
        <div className="grid grid-cols-2 gap-2 rounded-md border border-dashed border-border p-2 bg-muted/30">
          <div>
            <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              From Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              disabled={format !== null}
              className="h-8 w-full rounded border border-input bg-background px-2 text-xs"
            />
          </div>
          <div>
            <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              To Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              disabled={format !== null}
              className="h-8 w-full rounded border border-input bg-background px-2 text-xs"
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 pt-1">
        <Button
          type="button"
          onClick={() => handleExport("xlsx")}
          disabled={format !== null || clients.length === 0}
        >
          {format === "xlsx" ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          {format === "xlsx" ? "Preparing..." : "Excel"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => handleExport("pdf")}
          disabled={format !== null || clients.length === 0}
        >
          {format === "pdf" ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <FileText className="mr-2 h-4 w-4" />
          )}
          {format === "pdf" ? "Preparing..." : "PDF"}
        </Button>
      </div>
    </div>
  );
}
