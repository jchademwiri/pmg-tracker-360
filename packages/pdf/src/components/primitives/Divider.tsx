import type { CSSProperties } from "react";
import clsx from "clsx";

export interface DividerProps {
  color?: string;
  thickness?: number;
  spacing?: number;
  style?: CSSProperties;
  className?: string;
}

export function Divider({
  color = "#E2E8F0",
  thickness = 1,
  spacing = 16,
  style,
  className,
}: DividerProps) {
  const combinedStyle: CSSProperties = {
    width: "100%",
    height: `${thickness}px`,
    backgroundColor: color,
    marginTop: `${spacing}px`,
    marginBottom: `${spacing}px`,
    border: "none",
    ...style,
  };

  return (
    <div style={combinedStyle} className={clsx("pdf-divider", className)} />
  );
}
