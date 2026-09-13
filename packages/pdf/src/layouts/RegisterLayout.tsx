import type { CSSProperties, ReactNode } from "react";
import type { KpiCardItem, PdfBranding, PdfTheme } from "../types/index";
import { DocumentFrame } from "../components/layout/DocumentFrame";
import { Heading } from "../components/primitives/Heading";
import { Text } from "../components/primitives/Text";
import { KpiCards } from "../components/display/KpiCards";
import { formatDateTimeSa } from "../formatters/index";

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
          alignItems: "flex-start",
          borderBottom: `2px solid ${theme.colors.primary}`,
          paddingBottom: "10px",
          marginBottom: "14px",
          width: "100%",
        }}
      >
        {/* Left Stacked Titles: Organisation on Top, Document Title Below */}
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {branding?.logoDataUri && (
              <img
                src={branding.logoDataUri}
                alt={branding.organizationName}
                style={{ maxHeight: "28px", maxWidth: "110px", objectFit: "contain" }}
              />
            )}
            <div
              style={{
                fontSize: "16px",
                fontWeight: 800,
                color: theme.colors.primary,
                letterSpacing: "-0.2px",
                textTransform: "uppercase",
              }}
            >
              {branding?.organizationName || "PMG TRACKER 360"}
            </div>
          </div>

          <div
            style={{
              fontSize: "14px",
              fontWeight: 800,
              color: theme.colors.foreground,
              letterSpacing: "0.5px",
              textTransform: "uppercase",
              lineHeight: "18px",
            }}
          >
            {title}
          </div>

          {subtitle && (
            <div style={{ fontSize: "9.5px", color: theme.colors.mutedForeground, lineHeight: "13px", textTransform: "uppercase" }}>
              {subtitle}
            </div>
          )}
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
                    padding: "2.5px 8px",
                    backgroundColor: "#EFF6FF",
                    border: "1px solid #BFDBFE",
                    borderRadius: "3px",
                    color: "#1E40AF",
                  }}
                >
                  <strong style={{ color: "#1E3A8A" }}>{pill.label.toUpperCase()}:</strong> {pill.value.toUpperCase()}
                </span>
              ))}
            </div>
          )}

          <div style={{ fontSize: "9px", color: theme.colors.mutedForeground, marginTop: "2px", textTransform: "uppercase" }}>
            EXPORTED: {generatedAtText}
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
