import type { CSSProperties, ReactNode } from "react";
import clsx from "clsx";
import type { KeyValueItem, PdfTheme } from "../../types/index";

export interface KeyValueCardProps {
  theme: PdfTheme;
  title?: string;
  items: KeyValueItem[];
  columns?: 1 | 2 | 3 | 4;
  style?: CSSProperties;
  className?: string;
}

export function KeyValueCard({
  theme,
  title,
  items,
  columns = 2,
  style,
  className,
}: KeyValueCardProps) {
  const cardStyle: CSSProperties = {
    border: `1px solid ${theme.colors.border}`,
    borderRadius: "6px",
    padding: "12px 14px",
    backgroundColor: theme.colors.card,
    boxSizing: "border-box",
    ...style,
  };

  const gridStyle: CSSProperties = {
    display: "grid",
    gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
    columnGap: "16px",
    rowGap: "10px",
  };

  return (
    <div style={cardStyle} className={clsx("pdf-key-value-card", className)}>
      {title && (
        <div
          style={{
            fontSize: "11px",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            color: theme.colors.primary,
            borderBottom: `1px solid ${theme.colors.borderLight}`,
            paddingBottom: "6px",
            marginBottom: "10px",
          }}
        >
          {title}
        </div>
      )}

      <div style={gridStyle}>
        {items.map((item, idx) => (
          <div
            key={idx}
            style={{
              gridColumn: item.colSpan
                ? `span ${item.colSpan} / span ${item.colSpan}`
                : undefined,
              display: "flex",
              flexDirection: "column",
              gap: "2px",
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
                fontSize: "11px",
                lineHeight: "15px",
                fontWeight: 500,
                color: theme.colors.foreground,
              }}
            >
              {item.value || "-"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export interface TwoColumnCardsProps {
  left: ReactNode;
  right: ReactNode;
  gap?: number;
  style?: CSSProperties;
}

export function TwoColumnCards({
  left,
  right,
  gap = 16,
  style,
}: TwoColumnCardsProps) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: `${gap}px`,
        width: "100%",
        marginBottom: "16px",
        ...style,
      }}
    >
      <div>{left}</div>
      <div>{right}</div>
    </div>
  );
}
