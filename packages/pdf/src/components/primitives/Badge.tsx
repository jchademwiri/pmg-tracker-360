import type { CSSProperties, ReactNode } from "react";
import clsx from "clsx";
import type { BadgeVariant } from "../../types/index";

export interface BadgeProps {
  children?: ReactNode;
  variant?: BadgeVariant;
  style?: CSSProperties;
  className?: string;
}

export function Badge({
  children,
  variant = "secondary",
  style,
  className,
}: BadgeProps) {
  const variantStyles: Record<BadgeVariant, CSSProperties> = {
    default: {
      backgroundColor: "#0F172A",
      color: "#FFFFFF",
      borderColor: "#0F172A",
    },
    primary: {
      backgroundColor: "#EEF2FF",
      color: "#4338CA",
      borderColor: "#C7D2FE",
    },
    secondary: {
      backgroundColor: "#F1F5F9",
      color: "#334155",
      borderColor: "#E2E8F0",
    },
    success: {
      backgroundColor: "#F0FDF4",
      color: "#166534",
      borderColor: "#BBF7D0",
    },
    warning: {
      backgroundColor: "#FFFBEB",
      color: "#92400E",
      borderColor: "#FDE68A",
    },
    destructive: {
      backgroundColor: "#FEF2F2",
      color: "#991B1B",
      borderColor: "#FECACA",
    },
    outline: {
      backgroundColor: "transparent",
      color: "#334155",
      borderColor: "#CBD5E1",
    },
  };

  const baseStyle: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "4px",
    borderWidth: "1px",
    borderStyle: "solid",
    paddingLeft: "8px",
    paddingRight: "8px",
    paddingTop: "2px",
    paddingBottom: "2px",
    fontSize: "10px",
    fontWeight: 600,
    lineHeight: "14px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    ...variantStyles[variant],
    ...style,
  };

  return (
    <span style={baseStyle} className={clsx("pdf-badge", className)}>
      {children}
    </span>
  );
}
