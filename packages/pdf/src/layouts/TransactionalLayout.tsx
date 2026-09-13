import type { CSSProperties, ReactNode } from "react";
import type { PdfBranding, PdfTheme } from "../types/index";
import { DocumentFrame, RunningFooter, RunningHeader } from "../components/layout/DocumentFrame";
import { PageHeader } from "../components/layout/PageHeader";
import { TwoColumnCards } from "../components/display/KeyValueGrid";
import { Divider } from "../components/primitives/Divider";
import { formatDateTimeSa, formatZar } from "../formatters/index";

export interface TransactionalTotals {
  subtotal: number | string;
  vatRatePercent?: number;
  vatAmount?: number | string;
  total: number | string;
  customRows?: Array<{ label: string; value: string; isBold?: boolean }>;
}

export interface TransactionalLayoutProps {
  theme: PdfTheme;
  branding?: PdfBranding;
  title: string;
  documentNumber?: string;
  subtitle?: string;
  statusBadge?: ReactNode;
  metadataItems?: Array<{ label: string; value: ReactNode }>;
  leftCard?: ReactNode;
  rightCard?: ReactNode;
  children?: ReactNode;
  totals?: TransactionalTotals;
  notes?: ReactNode;
  terms?: ReactNode;
  signOff?: ReactNode;
  confidential?: boolean;
  generatedAt?: Date;
  style?: CSSProperties;
}

export function TransactionalLayout({
  theme,
  branding,
  title,
  documentNumber,
  subtitle,
  statusBadge,
  metadataItems,
  leftCard,
  rightCard,
  children,
  totals,
  notes,
  terms,
  signOff,
  confidential = false,
  generatedAt,
  style,
}: TransactionalLayoutProps) {
  const generatedAtText = formatDateTimeSa(generatedAt ?? new Date());

  return (
    <DocumentFrame
      theme={theme}
      orientation="portrait"
      branding={branding}
      documentTitle={title}
      confidential={confidential}
      generatedAt={generatedAt}
      style={style}
    >
      {/* Primary Page Header */}
      <PageHeader
        theme={theme}
        branding={branding}
        title={title}
        subtitle={subtitle}
        documentNumber={documentNumber}
        statusBadge={statusBadge}
        metadataItems={metadataItems}
      />

      {/* Two Metadata Cards (e.g. Vendor vs Delivery) */}
      {(leftCard || rightCard) && (
        <TwoColumnCards
          left={leftCard ?? null}
          right={rightCard ?? null}
          gap={16}
        />
      )}

      {/* Primary Content (Line items table, etc.) */}
      <div style={{ marginTop: "12px", marginBottom: "16px" }}>
        {children}
      </div>

      {/* Financial Totals Block */}
      {totals && (
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            marginTop: "16px",
            pageBreakInside: "avoid",
          }}
        >
          <div
            style={{
              width: "260px",
              backgroundColor: theme.colors.card,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: "6px",
              padding: "12px 14px",
              display: "flex",
              flexDirection: "column",
              gap: "6px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px" }}>
              <span style={{ color: theme.colors.mutedForeground }}>Subtotal:</span>
              <span style={{ fontWeight: 600, color: theme.colors.foreground }}>
                {typeof totals.subtotal === "number" ? formatZar(totals.subtotal) : totals.subtotal}
              </span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px" }}>
              <span style={{ color: theme.colors.mutedForeground }}>
                VAT ({totals.vatRatePercent ?? 15}%):
              </span>
              <span style={{ fontWeight: 600, color: theme.colors.foreground }}>
                {typeof totals.vatAmount === "number" ? formatZar(totals.vatAmount) : (totals.vatAmount ?? "R 0.00")}
              </span>
            </div>

            {totals.customRows?.map((row, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "11px",
                  fontWeight: row.isBold ? 700 : 500,
                }}
              >
                <span style={{ color: theme.colors.mutedForeground }}>{row.label}:</span>
                <span style={{ color: theme.colors.foreground }}>{row.value}</span>
              </div>
            ))}

            <div
              style={{
                borderTop: `2px solid ${theme.colors.border}`,
                paddingTop: "6px",
                marginTop: "4px",
                display: "flex",
                justifyContent: "space-between",
                fontSize: "13px",
                fontWeight: 700,
              }}
            >
              <span style={{ color: theme.colors.foreground }}>Total (ZAR):</span>
              <span style={{ color: theme.colors.primary }}>
                {typeof totals.total === "number" ? formatZar(totals.total) : totals.total}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Notes & Terms Block */}
      {(notes || terms) && (
        <div style={{ marginTop: "20px", pageBreakInside: "avoid" }}>
          {notes && (
            <div style={{ marginBottom: "12px" }}>
              <div
                style={{
                  fontSize: "10px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  color: theme.colors.mutedForeground,
                  marginBottom: "4px",
                }}
              >
                Notes / Scope
              </div>
              <div style={{ fontSize: "10px", lineHeight: "14px", color: theme.colors.foreground }}>
                {notes}
              </div>
            </div>
          )}

          {terms && (
            <div>
              <div
                style={{
                  fontSize: "10px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  color: theme.colors.mutedForeground,
                  marginBottom: "4px",
                }}
              >
                Terms & Conditions
              </div>
              <div style={{ fontSize: "9px", lineHeight: "13px", color: theme.colors.mutedForeground }}>
                {terms}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Sign-off / Signature Block */}
      {signOff && (
        <div style={{ marginTop: "24px", pageBreakInside: "avoid" }}>
          <Divider color={theme.colors.borderLight} spacing={12} />
          {signOff}
        </div>
      )}
    </DocumentFrame>
  );
}
