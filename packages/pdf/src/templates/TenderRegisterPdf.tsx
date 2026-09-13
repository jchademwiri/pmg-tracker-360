import type {
  TenderRegisterPdfModel,
  TenderRegisterRowModel,
} from "../types/documents";
import { trackerTheme } from "../themes/tracker";
import { RegisterLayout } from "../layouts/RegisterLayout";
import { DataTable } from "../components/table/DataTable";
import { Badge } from "../components/primitives/Badge";
import { formatDateSa } from "../formatters/index";

function getStatusBadge(status: string) {
  const s = status.toLowerCase();
  if (s === "awarded" || s === "won") return <Badge variant="success">AWARDED</Badge>;
  if (s === "submitted") return <Badge variant="primary">SUBMITTED</Badge>;
  if (s === "evaluation" || s === "evaluated") return <Badge variant="primary">EVALUATION</Badge>;
  if (s === "preparation" || s === "draft") return <Badge variant="warning">PREPARATION</Badge>;
  if (s === "lost" || s === "cancelled") return <Badge variant="destructive">{status.toUpperCase()}</Badge>;
  return <Badge variant="outline">{status.toUpperCase()}</Badge>;
}

export function TenderRegisterPdf({ data }: { data: TenderRegisterPdfModel }) {
  const isClientVariant = data.variant === "client";
  const title = isClientVariant
    ? `CLIENT TENDER REPORT: ${data.clientName || "Client"}`
    : "TENDER REGISTER REPORT";
  const subtitle = isClientVariant
    ? `TENDER PORTFOLIO AND SUBMISSION HISTORY FOR ${(data.clientName || "CLIENT").toUpperCase()}`
    : "COMPREHENSIVE MASTER REGISTER AND SUBMISSION TRACKING";

  const portfolioColumns = [
    {
      id: "tenderNumber",
      header: "TENDER #",
      width: "14%",
      render: (row: TenderRegisterRowModel) => (
        <span style={{ fontWeight: 700, color: trackerTheme.colors.primary, letterSpacing: "0.2px" }}>
          {row.tenderNumber ? row.tenderNumber.toUpperCase() : "—"}
        </span>
      ),
    },
    {
      id: "client",
      header: "CLIENT",
      width: "20%",
      render: (row: TenderRegisterRowModel) => (
        <span style={{ fontWeight: 600, textTransform: "uppercase" }}>{row.client || "—"}</span>
      ),
    },
    {
      id: "description",
      header: "DESCRIPTION",
      width: "32%",
      render: (row: TenderRegisterRowModel) => (
        <span style={{ textTransform: "uppercase" }}>{row.description || "—"}</span>
      ),
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
        <span style={{ fontWeight: 700, color: trackerTheme.colors.primary, letterSpacing: "0.2px" }}>
          {row.tenderNumber ? row.tenderNumber.toUpperCase() : "—"}
        </span>
      ),
    },
    {
      id: "description",
      header: "DESCRIPTION",
      width: "38%",
      render: (row: TenderRegisterRowModel) => (
        <span style={{ textTransform: "uppercase" }}>{row.description || "—"}</span>
      ),
    },
    {
      id: "contact",
      header: "CONTACT PERSON",
      width: "20%",
      render: (row: TenderRegisterRowModel) => (
        <span style={{ textTransform: "uppercase" }}>{row.contactPerson || "—"}</span>
      ),
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
