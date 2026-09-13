import type { CSSProperties, ReactNode } from "react";
import clsx from "clsx";

export interface TextProps {
  children?: ReactNode;
  variant?: "xs" | "sm" | "base" | "lg" | "muted" | "bold" | "mono";
  color?: string;
  align?: "left" | "center" | "right" | "justify";
  style?: CSSProperties;
  className?: string;
}

export function Text({
  children,
  variant = "base",
  color,
  align = "left",
  style,
  className,
}: TextProps) {
  const variantStyles: Record<string, CSSProperties> = {
    xs: { fontSize: "10px", lineHeight: "14px" },
    sm: { fontSize: "12px", lineHeight: "16px" },
    base: { fontSize: "14px", lineHeight: "20px" },
    lg: { fontSize: "16px", lineHeight: "22px", fontWeight: 600 },
    muted: { fontSize: "12px", lineHeight: "16px", color: "#64748B" },
    bold: { fontSize: "14px", lineHeight: "20px", fontWeight: 700 },
    mono: {
      fontSize: "12px",
      lineHeight: "16px",
      fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
    },
  };

  const combinedStyle: CSSProperties = {
    color: color ?? (variant === "muted" ? "#64748B" : "#0F172A"),
    textAlign: align,
    ...variantStyles[variant],
    ...style,
  };

  return (
    <div style={combinedStyle} className={clsx("pdf-text", className)}>
      {children}
    </div>
  );
}
