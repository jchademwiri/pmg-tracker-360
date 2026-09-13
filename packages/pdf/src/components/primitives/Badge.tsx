import type { CSSProperties, ReactNode } from "react";
import clsx from "clsx";
import type { BadgeVariant } from "../../types/index";

export interface BadgeProps {
  children?: ReactNode;
  variant?: BadgeVariant;
  dot?: boolean | string;
  style?: CSSProperties;
  className?: string;
}

interface BadgeStyleConfig {
  bg: string;
  border: string;
  color: string;
  dot: string;
}

const variantMap: Record<BadgeVariant, BadgeStyleConfig> = {
  default: { bg: "#0F172A", border: "#0F172A", color: "#FFFFFF", dot: "#FFFFFF" },
  primary: { bg: "#DBEAFE", border: "#93C5FD", color: "#1D4ED8", dot: "#2563EB" },
  secondary: { bg: "#F1F5F9", border: "#CBD5E1", color: "#334155", dot: "#64748B" },
  success: { bg: "#DCFCE7", border: "#86EFAC", color: "#15803D", dot: "#16A34A" },
  warning: { bg: "#FEF3C7", border: "#FDE68A", color: "#B45309", dot: "#D97706" },
  destructive: { bg: "#FEE2E2", border: "#FCA5A5", color: "#B91C1C", dot: "#DC2626" },
  outline: { bg: "#FFFFFF", border: "#CBD5E1", color: "#334155", dot: "#64748B" },
};

export function Badge({
  children,
  variant = "secondary",
  dot = true,
  style,
  className,
}: BadgeProps) {
  const cfg = variantMap[variant] || variantMap.secondary;
  const isDefaultSolid = variant === "default";

  const baseStyle: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "5px",
    borderRadius: "4px",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: cfg.border,
    backgroundColor: cfg.bg,
    color: cfg.color,
    paddingLeft: "8px",
    paddingRight: "8px",
    paddingTop: "2px",
    paddingBottom: "2px",
    fontSize: "8.5px",
    fontWeight: 700,
    lineHeight: "13px",
    textTransform: "uppercase",
    letterSpacing: "0.4px",
    ...style,
  };

  const showDot = dot !== false && !isDefaultSolid;
  const dotColor = typeof dot === "string" ? dot : cfg.dot;

  return (
    <span style={baseStyle} className={clsx("pdf-badge", className)}>
      {showDot && (
        <span
          style={{
            width: "5px",
            height: "5px",
            borderRadius: "50%",
            backgroundColor: dotColor,
            display: "inline-block",
            flexShrink: 0,
          }}
        />
      )}
      {children}
    </span>
  );
}
