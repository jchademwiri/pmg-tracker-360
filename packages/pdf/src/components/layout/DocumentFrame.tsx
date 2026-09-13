import type { CSSProperties, ReactNode } from "react";
import clsx from "clsx";
import type { PdfBranding, PdfTheme } from "../../types/index.js";
import { PageNumber, TotalPages } from "takumi-pdf/primitives";

export interface DocumentFrameProps {
  children?: ReactNode;
  theme: PdfTheme;
  orientation?: "portrait" | "landscape";
  branding?: PdfBranding;
  documentTitle?: string;
  documentSubtitle?: string;
  confidential?: boolean;
  generatedAt?: Date;
  style?: CSSProperties;
  className?: string;
}

export function DocumentFrame({
  children,
  theme,
  orientation = "portrait",
  branding,
  documentTitle,
  documentSubtitle,
  confidential = false,
  generatedAt,
  style,
  className,
}: DocumentFrameProps) {
  const isLandscape = orientation === "landscape";
  const margins = isLandscape ? theme.margins.landscape : theme.margins.portrait;

  const containerStyle: CSSProperties = {
    fontFamily: theme.fontFamily,
    color: theme.colors.foreground,
    backgroundColor: theme.colors.background,
    paddingTop: `${margins.top}px`,
    paddingRight: `${margins.right}px`,
    paddingBottom: `${margins.bottom}px`,
    paddingLeft: `${margins.left}px`,
    boxSizing: "border-box",
    minHeight: "100%",
    position: "relative",
    ...style,
  };

  return (
    <div style={containerStyle} className={clsx("pdf-document-frame", className)}>
      {children}
    </div>
  );
}

export interface RunningFooterProps {
  theme: PdfTheme;
  branding?: PdfBranding;
  confidential?: boolean;
  generatedAtText?: string;
  documentTitle?: string;
}

export function RunningFooter({
  theme,
  branding,
  confidential = false,
  generatedAtText,
  documentTitle,
}: RunningFooterProps) {
  const footerStyle: CSSProperties = {
    display: "flex",
    width: "100%",
    justifyContent: "space-between",
    alignItems: "center",
    paddingLeft: "32px",
    paddingRight: "32px",
    paddingTop: "8px",
    paddingBottom: "8px",
    borderTop: `1px solid ${theme.colors.border}`,
    fontSize: "9px",
    lineHeight: "12px",
    color: theme.colors.mutedForeground,
    fontFamily: theme.fontFamily,
    boxSizing: "border-box",
  };

  return (
    <div style={footerStyle} className="pdf-running-footer">
      <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
        <span style={{ fontWeight: 600, color: theme.colors.foreground }}>
          {branding?.organizationName || "PMG Tracker 360"}
        </span>
        {documentTitle && <span>• {documentTitle}</span>}
        {confidential && (
          <span style={{ color: theme.colors.destructive, fontWeight: 700 }}>
            CONFIDENTIAL
          </span>
        )}
      </div>

      <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
        {generatedAtText && <span>Generated: {generatedAtText}</span>}
        <span>
          Page <PageNumber /> of <TotalPages />
        </span>
      </div>
    </div>
  );
}

export interface RunningHeaderProps {
  theme: PdfTheme;
  branding?: PdfBranding;
  documentTitle?: string;
  documentNumber?: string;
}

export function RunningHeader({
  theme,
  branding,
  documentTitle,
  documentNumber,
}: RunningHeaderProps) {
  const headerStyle: CSSProperties = {
    display: "flex",
    width: "100%",
    justifyContent: "space-between",
    alignItems: "center",
    paddingLeft: "32px",
    paddingRight: "32px",
    paddingTop: "8px",
    paddingBottom: "8px",
    borderBottom: `1px solid ${theme.colors.borderLight}`,
    fontSize: "9px",
    lineHeight: "12px",
    color: theme.colors.mutedForeground,
    fontFamily: theme.fontFamily,
    boxSizing: "border-box",
  };

  return (
    <div style={headerStyle} className="pdf-running-header">
      <span style={{ fontWeight: 600, color: theme.colors.foreground }}>
        {branding?.organizationName || "PMG Tracker 360"}
      </span>
      {documentTitle && (
        <span>
          {documentTitle} {documentNumber ? `(${documentNumber})` : ""}
        </span>
      )}
    </div>
  );
}
