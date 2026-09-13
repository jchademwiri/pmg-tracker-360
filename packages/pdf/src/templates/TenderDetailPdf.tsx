import type { ReactNode } from "react";
import type { TenderDetailPdfModel } from "../types/documents";
import type { BadgeVariant } from "../types/index";
import { trackerTheme } from "../themes/tracker";
import { TransactionalLayout } from "../layouts/TransactionalLayout";
import { KeyValueCard } from "../components/display/KeyValueGrid";
import { Badge } from "../components/primitives/Badge";
import { Heading } from "../components/primitives/Heading";
import { formatDateSa, formatZar } from "../formatters/index";

function getTenderBadgeVariant(status: string): BadgeVariant {
  const s = status.toLowerCase();
  if (s === "awarded" || s === "won") return "success";
  if (s === "submitted" || s === "evaluated") return "primary";
  if (s === "preparation" || s === "draft") return "secondary";
  if (s === "lost" || s === "cancelled" || s === "disqualified") return "destructive";
  return "secondary";
}

function formatStatusLabel(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, " ");
}

export function TenderDetailPdf({ data }: { data: TenderDetailPdfModel }) {
  const statusVariant = getTenderBadgeVariant(data.status);
  const statusText = formatStatusLabel(data.status);

  const contactPieces = [
    data.clientContact?.name,
    data.clientContact?.email,
    data.clientContact?.phone,
  ].filter(Boolean);

  const leftCard = (
    <KeyValueCard
      theme={trackerTheme}
      title="Client & Contact Details"
      columns={1}
      items={[
        { label: "Client Name", value: data.clientName || "Not specified" },
        {
          label: "Contact Person",
          value: contactPieces.length ? contactPieces.join(" • ") : "Not specified",
        },
      ]}
    />
  );

  const rightCard = (
    <KeyValueCard
      theme={trackerTheme}
      title="Dates & Valuation"
      columns={1}
      items={[
        { label: "Submission Date", value: formatDateSa(data.submissionDate) },
        { label: "Validity Date", value: formatDateSa(data.validityExpiryDate) },
        {
          label: "Estimated Value",
          value: data.estimatedValue ? formatZar(data.estimatedValue) : "R 0.00",
        },
        ...(data.awardValue
          ? [{ label: "Award Value", value: formatZar(data.awardValue) }]
          : []),
      ]}
    />
  );

  return (
    <TransactionalLayout
      theme={trackerTheme}
      branding={data.branding}
      title="TENDER SUMMARY"
      documentNumber={data.tenderNumber}
      subtitle={data.priority ? `${data.priority.toUpperCase()} PRIORITY` : undefined}
      statusBadge={<Badge variant={statusVariant}>{statusText}</Badge>}
      leftCard={leftCard}
      rightCard={rightCard}
      confidential={data.confidential}
      generatedAt={data.generatedAt}
    >
      {/* Briefing Section */}
      {data.briefingDate && (
        <div
          style={{
            backgroundColor: trackerTheme.colors.card,
            border: `1px solid ${trackerTheme.colors.border}`,
            borderRadius: "6px",
            padding: "12px 14px",
            marginBottom: "16px",
          }}
        >
          <div
            style={{
              fontSize: "11px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              color: trackerTheme.colors.primary,
              borderBottom: `1px solid ${trackerTheme.colors.borderLight}`,
              paddingBottom: "6px",
              marginBottom: "8px",
            }}
          >
            Briefing & Site Meeting
          </div>
          <div style={{ fontSize: "11px", lineHeight: "16px", color: trackerTheme.colors.foreground }}>
            <span style={{ fontWeight: 600 }}>Date:</span> {formatDateSa(data.briefingDate)}
            {data.briefingLocation && (
              <span> • <span style={{ fontWeight: 600 }}>Location:</span> {data.briefingLocation}</span>
            )}
          </div>
        </div>
      )}

      {/* Scope / Description Section */}
      {data.description && (
        <div
          style={{
            backgroundColor: trackerTheme.colors.card,
            border: `1px solid ${trackerTheme.colors.border}`,
            borderRadius: "6px",
            padding: "12px 14px",
            marginBottom: "16px",
          }}
        >
          <div
            style={{
              fontSize: "11px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              color: trackerTheme.colors.primary,
              borderBottom: `1px solid ${trackerTheme.colors.borderLight}`,
              paddingBottom: "6px",
              marginBottom: "8px",
            }}
          >
            Scope of Work / Description
          </div>
          <div style={{ fontSize: "11px", lineHeight: "16px", color: trackerTheme.colors.foreground }}>
            {data.description}
          </div>
        </div>
      )}

      {/* Lost Tender Analysis Section */}
      {data.status.toLowerCase() === "lost" && (data.lossReason || data.lossDetails) && (
        <div
          style={{
            backgroundColor: "#FEF2F2",
            border: "1px solid #FECACA",
            borderRadius: "6px",
            padding: "12px 14px",
            marginTop: "16px",
            pageBreakInside: "avoid",
          }}
        >
          <div
            style={{
              fontSize: "11px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              color: "#991B1B",
              borderBottom: "1px solid #FCA5A5",
              paddingBottom: "6px",
              marginBottom: "8px",
            }}
          >
            Loss Analysis & Post-Mortem
          </div>
          {data.lossReason && (
            <div style={{ fontSize: "11px", lineHeight: "16px", marginBottom: "6px" }}>
              <strong style={{ color: "#7F1D1D" }}>Primary Reason:</strong>{" "}
              <span style={{ color: "#991B1B" }}>{data.lossReason}</span>
            </div>
          )}
          {data.lossDetails && (
            <div style={{ fontSize: "11px", lineHeight: "16px", color: "#7F1D1D" }}>
              <strong>Details:</strong> {data.lossDetails}
            </div>
          )}
        </div>
      )}
    </TransactionalLayout>
  );
}
