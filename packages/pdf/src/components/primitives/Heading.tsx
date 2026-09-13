import type { CSSProperties, ReactNode } from "react";
import clsx from "clsx";

export interface HeadingProps {
  children?: ReactNode;
  level?: 1 | 2 | 3 | 4;
  color?: string;
  style?: CSSProperties;
  className?: string;
}

export function Heading({
  children,
  level = 1,
  color = "#0F172A",
  style,
  className,
}: HeadingProps) {
  const levelStyles: Record<number, CSSProperties> = {
    1: { fontSize: "24px", lineHeight: "30px", fontWeight: 700 },
    2: { fontSize: "18px", lineHeight: "24px", fontWeight: 700 },
    3: { fontSize: "15px", lineHeight: "20px", fontWeight: 600 },
    4: {
      fontSize: "13px",
      lineHeight: "18px",
      fontWeight: 600,
      textTransform: "uppercase",
      letterSpacing: "0.5px",
    },
  };

  const combinedStyle: CSSProperties = {
    color,
    margin: 0,
    ...levelStyles[level],
    ...style,
  };

  return (
    <div
      style={combinedStyle}
      className={clsx(`pdf-heading-h${level}`, className)}
    >
      {children}
    </div>
  );
}
