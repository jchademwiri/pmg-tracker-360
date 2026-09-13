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
    <div style={containerStyle} className={clsx("pdf-kpi-cards-grid", className)}>
      {items.map((item, idx) => {
        let accentColor = theme.colors.primary;
        if (item.variant === "success") accentColor = theme.colors.success;
        if (item.variant === "warning") accentColor = theme.colors.warning;
        if (item.variant === "destructive") accentColor = theme.colors.destructive;

        return (
          <div
            key={idx}
            style={{
              backgroundColor: theme.colors.card,
              border: `1px solid ${theme.colors.border}`,
              borderTop: `3px solid ${accentColor}`,
              borderRadius: "4px",
              padding: "10px 12px",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            <div
              style={{
                fontSize: "9px",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                color: theme.colors.mutedForeground,
              }}
            >
              {item.label}
            </div>

            <div
              style={{
                fontSize: "18px",
                fontWeight: 700,
                lineHeight: "22px",
                color: theme.colors.foreground,
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
