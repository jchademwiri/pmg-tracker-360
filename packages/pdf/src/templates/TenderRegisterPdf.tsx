import type { ReactNode } from "react";
import type {
  TenderRegisterPdfModel,
  TenderRegisterRowModel,
} from "../types/documents";
import { trackerTheme } from "../themes/tracker";
import { RegisterLayout } from "../layouts/RegisterLayout";
import { DataTable } from "../components/table/DataTable";
import { Badge } from "../components/primitives/Badge";
import { formatDateSa, formatZar } from "../formatters/index";

function getStatusBadge(status: string) {
  const s = status.toLowerCase();
  if (s === "awarded" || s === "won") return <Badge variant="success">Awarded</Badge>;
  if (s === "submitted") return <Badge variant="primary">Submitted</Badge>;
  if (s === "evaluation" || s === "evaluated") return <Badge variant="primary">Evaluation</Badge>;
  if (s === "preparation" || s === "draft") return <Badge variant="warning">Preparation</Badge>;
  if (s === "lost" || s === "cancelled") return <Badge variant="destructive">{status.toUpperCase()}</Badge>;
  return <Badge variant="outline">{status.toUpperCase()}</Badge>;
}

export function TenderRegisterPdf({ data }: { data: TenderRegisterPdfModel }) {
  const isClientVariant = data.variant === "client";
  const title = isClientVariant
    ? `CLIENT TENDER REPORT: ${data.clientName || "Client"}`
    : "TENDER REGISTER REPORT";
  const subtitle = isClientVariant
    ? `Tender portfolio and submission history for ${data.clientName || "Client"}`
    : "Comprehensive master register and submission tracking";

  const portfolioColumns = [
    {
      id: "tenderNumber",
      header: "TENDER #",
      width: "14%",
      render: (row: TenderRegisterRowModel) => (
        <span style={{ fontWeight: 700, fontFamily: "monospace", color: trackerTheme.colors.primary }}>
          {row.tenderNumber ? row.tenderNumber.toUpperCase() : "—"}
        </span>
      ),
    },
    {
      id: "client",
      header: "CLIENT",
      width: "20%",
      render: (row: TenderRegisterRowModel) => (
        <span style={{ fontWeight: 600 }}>{row.client || "—"}</span>
      ),
    },
    {
      id: "description",
      header: "DESCRIPTION",
      width: "32%",
      accessorKey: "description" as const,
    },
    {
      id: "status",
      header: "STATUS",
      width: "12%",
      render: (row: TenderRegisterRowModel) => getStatusBadge(row.status),
    },
    {
      id: "submissionDate",
      header: "SUBMISSION",
      width: "11%",
      render: (row: TenderRegisterRowModel) => formatDateSa(row.submissionDate),
    },
    {
      id: "validityDate",
      header: "VALIDITY",
      width: "11%",
      render: (row: TenderRegisterRowModel) => formatDateSa(row.validityDate),
    },
  ];

  const clientColumns = [
    {
      id: "tenderNumber",
      header: "TENDER #",
      width: "16%",
      render: (row: TenderRegisterRowModel) => (
        <span style={{ fontWeight: 700, fontFamily: "monospace", color: trackerTheme.colors.primary }}>
          {row.tenderNumber ? row.tenderNumber.toUpperCase() : "—"}
        </span>
      ),
    },
    {
      id: "description",
      header: "DESCRIPTION",
      width: "38%",
      accessorKey: "description" as const,
    },
    {
      id: "contact",
      header: "CONTACT PERSON",
      width: "20%",
      render: (row: TenderRegisterRowModel) => row.contactPerson || "—",
    },
    {
      id: "status",
      header: "STATUS",
      width: "13%",
      render: (row: TenderRegisterRowModel) => getStatusBadge(row.status),
    },
    {
      id: "submissionDate",
      header: "SUBMISSION",
      width: "13%",
      render: (row: TenderRegisterRowModel) => formatDateSa(row.submissionDate),
    },
  ];

  return (
    <RegisterLayout
      theme={trackerTheme}
      branding={data.branding}
      title={title}
      subtitle={subtitle}
      filterPills={data.filterPills}
      kpiCards={data.kpiCards}
      confidential={data.confidential}
      generatedAt={data.generatedAt}
    >
      <DataTable
        theme={trackerTheme}
        columns={isClientVariant ? clientColumns : portfolioColumns}
        data={data.rows}
        dense={true}
        orientation="landscape"
        emptyMessage="No tenders found matching the specified filters."
      />
    </RegisterLayout>
  );
}
