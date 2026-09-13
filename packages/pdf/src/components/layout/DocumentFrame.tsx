import type { CSSProperties, ReactNode } from "react";
import clsx from "clsx";
import type { PdfBranding, PdfTheme } from "../../types/index";
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
  orientation?: "portrait" | "landscape";
  branding?: PdfBranding;
  confidential?: boolean;
  generatedAtText?: string;
  documentTitle?: string;
}

export function RunningFooter({
  theme,
  orientation = "landscape",
  branding,
  confidential = false,
  generatedAtText,
  documentTitle,
}: RunningFooterProps) {
  const isLandscape = orientation === "landscape";
  const margins = isLandscape ? theme.margins.landscape : theme.margins.portrait;

  return (
    <div
      style={{
        width: "100%",
        paddingLeft: `${margins.left}px`,
        paddingRight: `${margins.right}px`,
        boxSizing: "border-box",
      }}
      className="pdf-running-footer-wrapper"
    >
      <div
        style={{
          display: "flex",
          width: "100%",
          justifyContent: "space-between",
          alignItems: "center",
          paddingTop: "6px",
          paddingBottom: "8px",
          borderTop: "1px solid #CBD5E1",
          fontSize: "9px",
          lineHeight: "12px",
          color: theme.colors.mutedForeground,
          fontFamily: theme.fontFamily,
          textTransform: "uppercase",
          boxSizing: "border-box",
        }}
        className="pdf-running-footer"
      >
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <span style={{ fontWeight: 700, color: theme.colors.primary }}>
            {branding?.organizationName || "PMG TRACKER 360"}
          </span>
          {documentTitle && (
            <>
              <span>•</span>
              <span style={{ fontWeight: 600, color: theme.colors.foreground }}>
                {documentTitle}
              </span>
            </>
          )}
          {confidential && (
            <span style={{ color: theme.colors.destructive, fontWeight: 700, marginLeft: "6px" }}>
              CONFIDENTIAL
            </span>
          )}
        </div>

        <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
          {generatedAtText && <span>GENERATED: {generatedAtText}</span>}
          <span style={{ fontWeight: 700, color: theme.colors.primary }}>
            PAGE <PageNumber /> OF <TotalPages />
          </span>
        </div>
      </div>
    </div>
  );
}

export interface RunningHeaderProps {
  theme: PdfTheme;
  orientation?: "portrait" | "landscape";
  branding?: PdfBranding;
  documentTitle?: string;
  documentNumber?: string;
}

export function RunningHeader({
  theme,
  orientation = "landscape",
  branding,
  documentTitle,
  documentNumber,
}: RunningHeaderProps) {
  const isLandscape = orientation === "landscape";
  const margins = isLandscape ? theme.margins.landscape : theme.margins.portrait;

  return (
    <div
      style={{
        width: "100%",
        paddingLeft: `${margins.left}px`,
        paddingRight: `${margins.right}px`,
        boxSizing: "border-box",
      }}
      className="pdf-running-header-wrapper"
    >
      <div
        style={{
          display: "flex",
          width: "100%",
          justifyContent: "space-between",
          alignItems: "center",
          paddingTop: "8px",
          paddingBottom: "8px",
          borderBottom: `1px solid ${theme.colors.borderLight}`,
          fontSize: "9px",
          lineHeight: "12px",
          color: theme.colors.mutedForeground,
          fontFamily: theme.fontFamily,
          textTransform: "uppercase",
          boxSizing: "border-box",
        }}
        className="pdf-running-header"
      >
        <span style={{ fontWeight: 600, color: theme.colors.foreground }}>
          {branding?.organizationName || "PMG TRACKER 360"}
        </span>
        {documentTitle && (
          <span>
            {documentTitle} {documentNumber ? `(${documentNumber})` : ""}
          </span>
        )}
      </div>
    </div>
  );
}
