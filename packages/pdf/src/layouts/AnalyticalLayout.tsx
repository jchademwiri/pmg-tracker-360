import type { CSSProperties, ReactNode } from "react";
import type { KpiCardItem, PdfBranding, PdfTheme } from "../types/index";
import { DocumentFrame } from "../components/layout/DocumentFrame";
import { PageHeader } from "../components/layout/PageHeader";
import { KpiCards } from "../components/display/KpiCards";
import { Heading } from "../components/primitives/Heading";
import { formatDateTimeSa } from "../formatters/index";

export interface AnalyticalSection {
  id: string;
  title: string;
  description?: string;
  children: ReactNode;
  pageBreakBefore?: boolean;
}

export interface AnalyticalLayoutProps {
  theme: PdfTheme;
  branding?: PdfBranding;
  title: string;
  subtitle?: string;
  periodLabel?: string;
  statusBadge?: ReactNode;
  metadataItems?: Array<{ label: string; value: ReactNode }>;
  kpiCards?: KpiCardItem[];
  sections?: AnalyticalSection[];
  children?: ReactNode;
  confidential?: boolean;
  generatedAt?: Date;
  style?: CSSProperties;
}

export function AnalyticalLayout({
  theme,
  branding,
  title,
  subtitle,
  periodLabel,
  statusBadge,
  metadataItems,
  kpiCards,
  sections,
  children,
  confidential = false,
  generatedAt,
  style,
}: AnalyticalLayoutProps) {
  const generatedAtText = formatDateTimeSa(generatedAt ?? new Date());

  const enrichedMetadata = [
    ...(metadataItems ?? []),
    ...(periodLabel ? [{ label: "REPORTING PERIOD", value: periodLabel.toUpperCase() }] : []),
    { label: "GENERATED", value: generatedAtText },
  ];

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
      {/* Executive Report Header */}
      <PageHeader
        theme={theme}
        branding={branding}
        title={title}
        subtitle={subtitle}
        statusBadge={statusBadge}
        metadataItems={enrichedMetadata}
      />

      {/* KPI Cards Grid */}
      {kpiCards && kpiCards.length > 0 && (
        <div style={{ marginBottom: "20px" }}>
          <KpiCards
            theme={theme}
            items={kpiCards}
            columns={kpiCards.length > 3 ? 4 : (kpiCards.length as 2 | 3)}
          />
        </div>
      )}

      {/* Direct Children if passed */}
      {children && <div style={{ marginBottom: "20px" }}>{children}</div>}

      {/* Structured Sections */}
      {sections?.map((section) => (
        <div
          key={section.id}
          style={{
            marginTop: "20px",
            pageBreakBefore: section.pageBreakBefore ? "always" : "auto",
          }}
        >
          <div
            style={{
              borderBottom: `1px solid ${theme.colors.border}`,
              paddingBottom: "6px",
              marginBottom: "12px",
            }}
          >
            <Heading level={3} color={theme.colors.foreground}>
              {section.title}
            </Heading>
            {section.description && (
              <div
                style={{
                  fontSize: "10px",
                  color: theme.colors.mutedForeground,
                  marginTop: "2px",
                }}
              >
                {section.description}
              </div>
            )}
          </div>

          <div>{section.children}</div>
        </div>
      ))}
    </DocumentFrame>
  );
}
