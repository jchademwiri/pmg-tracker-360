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

const dotColors: Record<BadgeVariant, string> = {
  default: "#0F172A",
  primary: "#2563EB",
  secondary: "#64748B",
  success: "#16A34A",
  warning: "#D97706",
  destructive: "#DC2626",
  outline: "#94A3B8",
};

export function Badge({
  children,
  variant = "secondary",
  dot = true,
  style,
  className,
}: BadgeProps) {
  const isDefaultSolid = variant === "default";

  const baseStyle: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "5px",
    borderRadius: "3px",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: isDefaultSolid ? "#0F172A" : "#E2E8F0",
    backgroundColor: isDefaultSolid ? "#0F172A" : "#F8FAFC",
    color: isDefaultSolid ? "#FFFFFF" : "#1E293B",
    paddingLeft: "7px",
    paddingRight: "7px",
    paddingTop: "2px",
    paddingBottom: "2px",
    fontSize: "8.5px",
    fontWeight: 600,
    lineHeight: "13px",
    textTransform: "uppercase",
    letterSpacing: "0.4px",
    ...style,
  };

  const showDot = dot !== false && !isDefaultSolid;
  const dotColor = typeof dot === "string" ? dot : dotColors[variant];

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
