import type {
  TenderFollowUpPdfModel,
  TenderFollowUpRowModel,
} from "../types/documents";
import { trackerTheme } from "../themes/tracker";
import { RegisterLayout } from "../layouts/RegisterLayout";
import { DataTable } from "../components/table/DataTable";
import { Badge } from "../components/primitives/Badge";
import { formatDateSa } from "../formatters/index";

function getValidityBadge(row: TenderFollowUpRowModel) {
  const formatted = formatDateSa(row.validityExpiryDate);
  if (!row.validityExpiryDate || formatted === "—") {
    return <span style={{ color: trackerTheme.colors.mutedForeground }}>—</span>;
  }

  if (row.isExpired) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
        <span style={{ fontWeight: 700, color: trackerTheme.colors.destructive }}>{formatted}</span>
        <Badge variant="destructive" dot={false} style={{ fontSize: "7.5px", padding: "1px 4px" }}>
          EXPIRED
        </Badge>
      </div>
    );
  }

  if (row.isExpiringSoon) {
    const days = row.validityDaysRemaining ?? 0;
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
        <span style={{ fontWeight: 700, color: trackerTheme.colors.warning }}>{formatted}</span>
        <Badge variant="warning" dot={false} style={{ fontSize: "7.5px", padding: "1px 4px" }}>
          {days}D LEFT
        </Badge>
      </div>
    );
  }

  return (
    <span style={{ fontWeight: 600, color: trackerTheme.colors.foreground }}>
      {formatted}
    </span>
  );
}

function getStatusBadge(status: string) {
  const s = status.toLowerCase();
  if (s === "awarded" || s === "won") return <Badge variant="success">AWARDED</Badge>;
  if (s === "submitted") return <Badge variant="primary">SUBMITTED</Badge>;
  if (s === "evaluation" || s === "evaluated") return <Badge variant="primary">EVALUATION</Badge>;
  if (s === "preparation" || s === "draft") return <Badge variant="warning">PREPARATION</Badge>;
  if (s === "lost" || s === "cancelled") return <Badge variant="destructive">{status.toUpperCase()}</Badge>;
  return <Badge variant="outline">{status.toUpperCase()}</Badge>;
}

export function TenderFollowUpPdf({ data }: { data: TenderFollowUpPdfModel }) {
  const title = "MANAGEMENT TENDER FOLLOW-UP REPORT";
  const subtitle = "PIPELINE TRACKING, CLIENT CONTACT DETAILS, AND OFFER VALIDITY EXPIRY FOR MANAGEMENT ACTION";

  const columns = [
    {
      id: "tenderNumber",
      header: "TENDER #",
      width: "14%",
      render: (row: TenderFollowUpRowModel) => (
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          <span style={{ fontWeight: 700, color: trackerTheme.colors.primary, letterSpacing: "0.2px" }}>
            {row.tenderNumber ? row.tenderNumber.toUpperCase() : "—"}
          </span>
          <div style={{ marginTop: "1px" }}>
            {getStatusBadge(row.status)}
          </div>
        </div>
      ),
    },
    {
      id: "client",
      header: "CLIENT",
      width: "18%",
      render: (row: TenderFollowUpRowModel) => (
        <span style={{ fontWeight: 700, color: trackerTheme.colors.foreground, textTransform: "uppercase" }}>
          {row.client || "—"}
        </span>
      ),
    },
    {
      id: "description",
      header: "DESCRIPTION",
      width: "26%",
      render: (row: TenderFollowUpRowModel) => (
        <div style={{ fontSize: "9px", lineHeight: "13px", color: trackerTheme.colors.foreground, textTransform: "uppercase" }}>
          {row.description || "—"}
        </div>
      ),
    },
    {
      id: "contact",
      header: "CONTACT DETAILS",
      width: "18%",
      render: (row: TenderFollowUpRowModel) => {
        const hasContact = row.contactName || row.contactEmail || row.contactPhone;
        if (!hasContact) {
          return <span style={{ color: trackerTheme.colors.mutedForeground }}>NOT SPECIFIED</span>;
        }

        return (
          <div style={{ display: "flex", flexDirection: "column", gap: "2px", fontSize: "9px" }}>
            {row.contactName && (
              <span style={{ fontWeight: 700, color: trackerTheme.colors.foreground, textTransform: "uppercase" }}>
                {row.contactName}
              </span>
            )}
            {row.contactEmail && (
              <span style={{ color: trackerTheme.colors.accent, wordBreak: "break-all", textTransform: "uppercase" }}>
                {row.contactEmail}
              </span>
            )}
            {row.contactPhone && (
              <span style={{ color: trackerTheme.colors.mutedForeground }}>
                TEL: {row.contactPhone}
              </span>
            )}
          </div>
        );
      },
    },
    {
      id: "closingDate",
      header: "CLOSING DATE",
      width: "11%",
      render: (row: TenderFollowUpRowModel) => (
        <span style={{ fontWeight: 600, color: trackerTheme.colors.foreground }}>
          {formatDateSa(row.closingDate)}
        </span>
      ),
    },
    {
      id: "validityExpiryDate",
      header: "VALIDITY EXPIRY",
      width: "13%",
      render: (row: TenderFollowUpRowModel) => getValidityBadge(row),
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
        columns={columns}
        data={data.rows}
        dense={true}
        orientation="landscape"
        emptyMessage="NO PENDING TENDERS FOUND REQUIRING MANAGEMENT FOLLOW-UP."
      />
    </RegisterLayout>
  );
}
