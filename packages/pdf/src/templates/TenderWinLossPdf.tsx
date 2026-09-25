import type { TenderWinLossPdfModel } from "../types/documents";
import { trackerTheme } from "../themes/tracker";
import {
  AnalyticalLayout,
  type AnalyticalSection,
} from "../layouts/AnalyticalLayout";
import { DataTable } from "../components/table/DataTable";
import { formatPercent } from "../formatters/index";

export function TenderWinLossPdf({ data }: { data: TenderWinLossPdfModel }) {
  const totalDecided =
    data.totalSubmissions || data.awardedCount + data.lostCount;

  const kpiCards = [
    {
      label: "TOTAL DECIDED",
      value: totalDecided.toString(),
      variant: "primary" as const,
    },
    {
      label: "AWARDED TENDERS",
      value: data.awardedCount.toString(),
      variant: "success" as const,
    },
    {
      label: "LOST TENDERS",
      value: data.lostCount.toString(),
      variant: (data.lostCount > 0 ? "destructive" : "default") as
        | "destructive"
        | "default",
    },
    {
      label: "WIN RATE",
      value: formatPercent(data.winRate / 100),
      variant: (data.winRate >= 50 ? "success" : "warning") as
        | "success"
        | "warning",
    },
  ];

  type AwardedRow = TenderWinLossPdfModel["awardedTenders"][number];
  type LostRow = TenderWinLossPdfModel["lostTenders"][number];
  type LossReasonRow = TenderWinLossPdfModel["lossReasonsSummary"][number];

  const awardedColumns = [
    {
      id: "tenderNumber",
      header: "TENDER #",
      width: "20%",
      render: (row: AwardedRow) => (
        <span
          style={{
            fontWeight: 700,
            color: trackerTheme.colors.primary,
            letterSpacing: "0.2px",
          }}
        >
          {row.tenderNumber ? String(row.tenderNumber).toUpperCase() : "—"}
        </span>
      ),
    },
    {
      id: "client",
      header: "CLIENT",
      width: "25%",
      render: (row: AwardedRow) => (
        <span style={{ fontWeight: 600, textTransform: "uppercase" }}>
          {row.client || "—"}
        </span>
      ),
    },
    {
      id: "description",
      header: "DESCRIPTION",
      width: "55%",
      render: (row: AwardedRow) => (
        <span style={{ textTransform: "uppercase" }}>
          {row.description || "—"}
        </span>
      ),
    },
  ];

  const lostColumns = [
    {
      id: "tenderNumber",
      header: "TENDER #",
      width: "20%",
      render: (row: LostRow) => (
        <span
          style={{
            fontWeight: 700,
            color: trackerTheme.colors.primary,
            letterSpacing: "0.2px",
          }}
        >
          {row.tenderNumber ? String(row.tenderNumber).toUpperCase() : "—"}
        </span>
      ),
    },
    {
      id: "client",
      header: "CLIENT",
      width: "25%",
      render: (row: LostRow) => (
        <span style={{ fontWeight: 600, textTransform: "uppercase" }}>
          {row.client || "—"}
        </span>
      ),
    },
    {
      id: "description",
      header: "DESCRIPTION",
      width: "30%",
      render: (row: LostRow) => (
        <span style={{ textTransform: "uppercase" }}>
          {row.description || "—"}
        </span>
      ),
    },
    {
      id: "lossReason",
      header: "LOSS REASON",
      width: "25%",
      render: (row: LostRow) => (
        <span
          style={{
            textTransform: "uppercase",
            color: trackerTheme.colors.mutedForeground,
          }}
        >
          {row.lossReason || "NOT SPECIFIED"}
        </span>
      ),
    },
  ];

  const lossReasonColumns = [
    {
      id: "reason",
      header: "RECORDED REASON",
      width: "50%",
      render: (row: LossReasonRow) => (
        <span style={{ textTransform: "uppercase", fontWeight: 600 }}>
          {row.reason || "NOT SPECIFIED"}
        </span>
      ),
    },
    {
      id: "count",
      header: "COUNT",
      width: "25%",
      align: "right" as const,
      render: (row: LossReasonRow) => row.count.toString(),
    },
    {
      id: "percentage",
      header: "SHARE",
      width: "25%",
      align: "right" as const,
      render: (row: LossReasonRow) => (
        <span style={{ fontWeight: 700, color: trackerTheme.colors.primary }}>
          {formatPercent(row.percentage / 100)}
        </span>
      ),
    },
  ];

  const sections: AnalyticalSection[] = [
    {
      id: "awarded",
      title: "AWARDED TENDERS",
      description: "TENDERS SUCCESSFULLY WON AND CONVERTED TO ACTIVE PROJECTS.",
      children: (
        <DataTable
          theme={trackerTheme}
          columns={awardedColumns}
          data={data.awardedTenders}
          emptyMessage="NO TENDERS AWARDED IN THE SELECTED PERIOD."
        />
      ),
    },
    {
      id: "lost",
      title: "LOST TENDERS",
      description: "UNSUCCESSFUL TENDER SUBMISSIONS AND RECORDED OUTCOMES.",
      children: (
        <DataTable
          theme={trackerTheme}
          columns={lostColumns}
          data={data.lostTenders}
          emptyMessage="NO LOST TENDERS RECORDED IN THE SELECTED PERIOD."
        />
      ),
    },
    {
      id: "loss-reasons",
      title: "LOSS REASON FREQUENCY ANALYSIS",
      description:
        "DISTRIBUTION OF REASONS RECORDED DURING POST-SUBMISSION REVIEWS.",
      children: (
        <DataTable
          theme={trackerTheme}
          columns={lossReasonColumns}
          data={data.lossReasonsSummary}
          emptyMessage="NO LOSS REASONS CAPTURED."
        />
      ),
    },
  ];

  return (
    <AnalyticalLayout
      theme={trackerTheme}
      branding={data.branding}
      title="TENDER WIN/LOSS REPORT"
      subtitle="PERFORMANCE OVERVIEW AND WIN RATE ANALYSIS"
      periodLabel={data.periodLabel}
      kpiCards={kpiCards}
      sections={sections}
      confidential={data.confidential}
      generatedAt={data.generatedAt}
    />
  );
}
