import type { CSSProperties, ReactNode } from "react";
import type { KpiCardItem, PdfBranding, PdfTheme } from "../types/index.js";
import { DocumentFrame } from "../components/layout/DocumentFrame.js";
import { Heading } from "../components/primitives/Heading.js";
import { Text } from "../components/primitives/Text.js";
import { KpiCards } from "../components/display/KpiCards.js";
import { formatDateTimeSa } from "../formatters/index.js";

export interface RegisterFilterPill {
  label: string;
  value: string;
}

export interface RegisterLayoutProps {
  theme: PdfTheme;
  branding?: PdfBranding;
  title: string;
  subtitle?: string;
  filterPills?: RegisterFilterPill[];
  kpiCards?: KpiCardItem[];
  children?: ReactNode;
  confidential?: boolean;
  generatedAt?: Date;
  style?: CSSProperties;
}

export function RegisterLayout({
  theme,
  branding,
  title,
  subtitle,
  filterPills,
  kpiCards,
  children,
  confidential = false,
  generatedAt,
  style,
}: RegisterLayoutProps) {
  const generatedAtText = formatDateTimeSa(generatedAt ?? new Date());

  return (
    <DocumentFrame
      theme={theme}
      orientation="landscape"
      branding={branding}
      documentTitle={title}
      confidential={confidential}
      generatedAt={generatedAt}
      style={style}
    >
      {/* Compact Landscape Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: `2px solid ${theme.colors.border}`,
          paddingBottom: "10px",
          marginBottom: "14px",
          width: "100%",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          {branding?.logoDataUri ? (
            <img
              src={branding.logoDataUri}
              alt={branding.organizationName}
              style={{ maxHeight: "32px", maxWidth: "120px", objectFit: "contain" }}
            />
          ) : (
            <span style={{ fontSize: "15px", fontWeight: 800, color: theme.colors.primary }}>
              {branding?.organizationName || "PMG TRACKER 360"}
            </span>
          )}

          <div style={{ borderLeft: `1px solid ${theme.colors.borderLight}`, paddingLeft: "12px" }}>
            <Heading level={2} color={theme.colors.foreground} style={{ fontSize: "16px", lineHeight: "20px" }}>
              {title}
            </Heading>
            {subtitle && (
              <Text variant="muted" style={{ fontSize: "10px", lineHeight: "13px" }}>
                {subtitle}
              </Text>
            )}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
          {/* Active Filter Pills */}
          {filterPills && filterPills.length > 0 && (
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", justifyContent: "flex-end" }}>
              {filterPills.map((pill, idx) => (
                <span
                  key={idx}
                  style={{
                    fontSize: "9px",
                    padding: "2px 6px",
                    backgroundColor: theme.colors.muted,
                    border: `1px solid ${theme.colors.borderLight}`,
                    borderRadius: "3px",
                    color: theme.colors.mutedForeground,
                  }}
                >
                  <strong style={{ color: theme.colors.foreground }}>{pill.label}:</strong> {pill.value}
                </span>
              ))}
            </div>
          )}

          <div style={{ fontSize: "9px", color: theme.colors.mutedForeground }}>
            Exported: {generatedAtText}
          </div>
        </div>
      </div>

      {/* Top KPI Ribbon */}
      {kpiCards && kpiCards.length > 0 && (
        <KpiCards
          theme={theme}
          items={kpiCards}
          columns={kpiCards.length > 4 ? 5 : (kpiCards.length as 2 | 3 | 4)}
          style={{ marginBottom: "14px" }}
        />
      )}

      {/* Tabular Register Content */}
      <div style={{ width: "100%" }}>{children}</div>
    </DocumentFrame>
  );
}
