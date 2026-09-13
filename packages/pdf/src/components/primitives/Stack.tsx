import type { CSSProperties, ReactNode } from "react";
import clsx from "clsx";

export interface StackProps {
  children?: ReactNode;
  direction?: "row" | "column";
  gap?: number;
  align?: "flex-start" | "center" | "flex-end" | "stretch";
  justify?: "flex-start" | "center" | "flex-end" | "space-between" | "space-around";
  wrap?: boolean;
  style?: CSSProperties;
  className?: string;
}

export function Stack({
  children,
  direction = "column",
  gap = 8,
  align = "stretch",
  justify = "flex-start",
  wrap = false,
  style,
  className,
}: StackProps) {
  const combinedStyle: CSSProperties = {
    display: "flex",
    flexDirection: direction,
    gap: `${gap}px`,
    alignItems: align,
    justifyContent: justify,
    flexWrap: wrap ? "wrap" : "nowrap",
    ...style,
  };

  return (
    <div style={combinedStyle} className={clsx("pdf-stack", className)}>
      {children}
    </div>
  );
}
