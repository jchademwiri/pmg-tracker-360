import type { CSSProperties } from "react";
import clsx from "clsx";
import type { KpiCardItem, PdfTheme } from "../../types/index";

export interface KpiCardsProps {
  theme: PdfTheme;
  items: KpiCardItem[];
  columns?: 2 | 3 | 4 | 5;
  style?: CSSProperties;
  className?: string;
}

export function KpiCards({
  theme,
  items,
  columns = 4,
  style,
  className,
}: KpiCardsProps) {
  const containerStyle: CSSProperties = {
    display: "grid",
    gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
    gap: "12px",
    width: "100%",
    marginBottom: "16px",
    boxSizing: "border-box",
    ...style,
  };

  return (
    <div
      style={containerStyle}
      className={clsx("pdf-kpi-cards-grid", className)}
    >
      {items.map((item, idx) => {
        let borderTopColor = theme.colors.accent;
        let valueColor = theme.colors.foreground;

        if (item.variant === "primary") {
          borderTopColor = "#2563EB";
          valueColor = "#1E40AF";
        } else if (item.variant === "success") {
          borderTopColor = "#16A34A";
          valueColor = "#15803D";
        } else if (item.variant === "warning") {
          borderTopColor = "#D97706";
          valueColor = "#B45309";
        } else if (item.variant === "destructive") {
          borderTopColor = "#DC2626";
          valueColor = "#B91C1C";
        } else if (item.variant === "default") {
          borderTopColor = "#6366F1";
          valueColor = "#4338CA";
        }

        return (
          <div
            key={idx}
            style={{
              backgroundColor: theme.colors.card,
              border: `1px solid ${theme.colors.border}`,
              borderTop: `3px solid ${borderTopColor}`,
              borderRadius: "4px",
              padding: "9px 12px",
              display: "flex",
              flexDirection: "column",
              gap: "3px",
            }}
          >
            <div
              style={{
                fontSize: "8.5px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                color: theme.colors.mutedForeground,
              }}
            >
              {item.label}
            </div>

            <div
              style={{
                fontSize: "17px",
                fontWeight: 800,
                lineHeight: "21px",
                color: valueColor,
              }}
            >
              {item.value}
            </div>

            {item.subtext && (
              <div
                style={{
                  fontSize: "9px",
                  color: theme.colors.mutedForeground,
                  marginTop: "2px",
                }}
              >
                {item.subtext}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
