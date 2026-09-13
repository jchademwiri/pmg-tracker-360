import type { CSSProperties, ReactNode } from "react";
import clsx from "clsx";
import type { PdfBranding, PdfTheme } from "../../types/index";
import { Heading } from "../primitives/Heading";
import { Text } from "../primitives/Text";
import { Stack } from "../primitives/Stack";

export interface PageHeaderProps {
  theme: PdfTheme;
  branding?: PdfBranding;
  title: string;
  subtitle?: string;
  documentNumber?: string;
  statusBadge?: ReactNode;
  metadataItems?: Array<{ label: string; value: ReactNode }>;
  style?: CSSProperties;
  className?: string;
}

export function PageHeader({
  theme,
  branding,
  title,
  subtitle,
  documentNumber,
  statusBadge,
  metadataItems,
  style,
  className,
}: PageHeaderProps) {
  const containerStyle: CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    width: "100%",
    paddingBottom: "16px",
    borderBottom: `2px solid ${theme.colors.border}`,
    marginBottom: "20px",
    boxSizing: "border-box",
    ...style,
  };

  return (
    <div style={containerStyle} className={clsx("pdf-page-header", className)}>
      {/* Left: Organization Branding */}
      <div
        style={{
          maxWidth: "55%",
          display: "flex",
          flexDirection: "column",
          gap: "6px",
        }}
      >
        {branding?.logoDataUri ? (
          <img
            src={branding.logoDataUri}
            alt={branding.organizationName}
            style={{
              maxHeight: "44px",
              maxWidth: "180px",
              objectFit: "contain",
              marginBottom: "4px",
            }}
          />
        ) : (
          <div
            style={{
              fontSize: "18px",
              fontWeight: 800,
              color: theme.colors.primary,
              letterSpacing: "-0.5px",
            }}
          >
            {branding?.organizationName || "PMG TRACKER 360"}
          </div>
        )}

        {branding?.organizationName && branding.logoDataUri && (
          <div
            style={{
              fontSize: "12px",
              fontWeight: 700,
              color: theme.colors.foreground,
            }}
          >
            {branding.organizationName}
          </div>
        )}

        <div
          style={{
            fontSize: "10px",
            lineHeight: "14px",
            color: theme.colors.mutedForeground,
          }}
        >
          {branding?.address && <div>{branding.address}</div>}
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            {branding?.phone && <span>Tel: {branding.phone}</span>}
            {branding?.email && <span>Email: {branding.email}</span>}
            {branding?.website && <span>{branding.website}</span>}
          </div>
          {(branding?.taxNumber || branding?.registrationNumber) && (
            <div style={{ display: "flex", gap: "10px", marginTop: "2px" }}>
              {branding?.taxNumber && (
                <span>VAT/Tax: {branding.taxNumber}</span>
              )}
              {branding?.registrationNumber && (
                <span>Reg: {branding.registrationNumber}</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right: Document Identity & Status */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          textAlign: "right",
          gap: "4px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Heading level={2} color={theme.colors.foreground}>
            {title}
          </Heading>
          {statusBadge}
        </div>

        {documentNumber && (
          <div
            style={{
              fontSize: "13px",
              fontWeight: 700,
              fontFamily: "monospace",
              color: theme.colors.primary,
            }}
          >
            #{documentNumber}
          </div>
        )}

        {subtitle && (
          <Text variant="muted" align="right">
            {subtitle}
          </Text>
        )}

        {metadataItems && metadataItems.length > 0 && (
          <Stack gap={2} style={{ marginTop: "6px" }} align="flex-end">
            {metadataItems.map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  gap: "6px",
                  fontSize: "10px",
                  lineHeight: "14px",
                }}
              >
                <span style={{ color: theme.colors.mutedForeground }}>
                  {item.label}:
                </span>
                <span
                  style={{ fontWeight: 600, color: theme.colors.foreground }}
                >
                  {item.value}
                </span>
              </div>
            ))}
          </Stack>
        )}
      </div>
    </div>
  );
}
