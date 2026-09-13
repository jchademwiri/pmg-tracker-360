import type { ReactNode } from "react";
import type { TenderWinLossPdfModel } from "../types/documents";
import { trackerTheme } from "../themes/tracker";
import { AnalyticalLayout, type AnalyticalSection } from "../layouts/AnalyticalLayout";
import { DataTable } from "../components/table/DataTable";
import { formatDateSa, formatPercent, formatZar } from "../formatters/index";

export function TenderWinLossPdf({ data }: { data: TenderWinLossPdfModel }) {
  const kpiCards = [
    {
      label: "Win Rate",
      value: formatPercent(data.winRate / 100),
      variant: (data.winRate >= 50 ? "success" : "warning") as "success" | "warning",
    },
    {
      label: "Awarded Tenders",
      value: data.awardedCount.toString(),
      variant: "primary" as const,
    },
    {
      label: "Lost Tenders",
      value: data.lostCount.toString(),
      variant: "default" as const,
    },
    {
      label: "Total Awarded Value",
      value: formatZar(data.awardedValueTotal),
      variant: "success" as const,
    },
    {
      label: "Total Lost Value",
      value: formatZar(data.lostValueTotal),
      variant: "default" as const,
    },
  ];

  const awardedColumns = [
    { id: "tenderNumber", header: "Tender #", width: "20%", accessorKey: "tenderNumber" as const },
    { id: "client", header: "Client", width: "25%", accessorKey: "client" as const },
    { id: "description", header: "Description", width: "35%", accessorKey: "description" as const },
    {
      id: "awardValue",
      header: "Award Value",
      width: "20%",
      align: "right" as const,
      render: (row: any) => (
        <span style={{ fontWeight: 700, color: trackerTheme.colors.success }}>
          {formatZar(row.awardValue)}
        </span>
      ),
    },
  ];

  const lostColumns = [
    { id: "tenderNumber", header: "Tender #", width: "20%", accessorKey: "tenderNumber" as const },
    { id: "client", header: "Client", width: "25%", accessorKey: "client" as const },
    {
      id: "estimatedValue",
      header: "Est. Value",
      width: "20%",
      align: "right" as const,
      render: (row: any) => formatZar(row.estimatedValue),
    },
    { id: "lossReason", header: "Loss Reason", width: "35%", accessorKey: "lossReason" as const },
  ];

  const lossReasonColumns = [
    { id: "reason", header: "Recorded Reason", width: "50%", accessorKey: "reason" as const },
    {
      id: "count",
      header: "Count",
      width: "20%",
      align: "right" as const,
      render: (row: any) => row.count.toString(),
    },
    {
      id: "percentage",
      header: "Share",
      width: "30%",
      align: "right" as const,
      render: (row: any) => formatPercent(row.percentage / 100),
    },
  ];

  const sections: AnalyticalSection[] = [
    {
      id: "awarded",
      title: "Awarded Tenders",
      description: "Tenders successfully won and converted to active projects.",
      children: (
        <DataTable
          theme={trackerTheme}
          columns={awardedColumns}
          data={data.awardedTenders}
          emptyMessage="No tenders awarded in the selected period."
        />
      ),
    },
    {
      id: "lost",
      title: "Lost Tenders",
      description: "Unsuccessful tender submissions and their estimated values.",
      children: (
        <DataTable
          theme={trackerTheme}
          columns={lostColumns}
          data={data.lostTenders}
          emptyMessage="No lost tenders recorded in the selected period."
        />
      ),
    },
    {
      id: "loss-reasons",
      title: "Loss Reason Frequency Analysis",
      description: "Distribution of reasons recorded during post-submission reviews.",
      children: (
        <DataTable
          theme={trackerTheme}
          columns={lossReasonColumns}
          data={data.lossReasonsSummary}
          emptyMessage="No loss reasons captured."
        />
      ),
    },
  ];

  return (
    <AnalyticalLayout
      theme={trackerTheme}
      branding={data.branding}
      title="TENDER WIN/LOSS REPORT"
      subtitle="Performance overview and win rate analysis"
      periodLabel={data.periodLabel}
      kpiCards={kpiCards}
      sections={sections}
      confidential={data.confidential}
      generatedAt={data.generatedAt}
    />
  );
}
