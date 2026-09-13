import type { CSSProperties, ReactNode } from "react";
import clsx from "clsx";
import type { PdfTheme } from "../../types/index";

export interface EmptyStateProps {
  theme: PdfTheme;
  title?: string;
  description?: string;
  icon?: ReactNode;
  style?: CSSProperties;
  className?: string;
}

export function EmptyState({
  theme,
  title = "No records found",
  description = "There is no data to display for the selected criteria.",
  style,
  className,
}: EmptyStateProps) {
  const containerStyle: CSSProperties = {
    padding: "32px 24px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    border: `1px dashed ${theme.colors.border}`,
    borderRadius: "6px",
    backgroundColor: theme.colors.muted,
    color: theme.colors.mutedForeground,
    boxSizing: "border-box",
    ...style,
  };

  return (
    <div style={containerStyle} className={clsx("pdf-empty-state", className)}>
      <div
        style={{
          fontSize: "12px",
          fontWeight: 700,
          color: theme.colors.foreground,
          marginBottom: "4px",
          textTransform: "uppercase",
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontSize: "10px",
          color: theme.colors.mutedForeground,
          maxWidth: "340px",
          textTransform: "uppercase",
        }}
      >
        {description}
      </div>
    </div>
  );
}
