import * as React from "react";
import { cn } from "../../lib/utils";

interface LogoProps {
  size?: "sm" | "default" | "lg";
  className?: string;
  showText?: boolean;
}

const sizeMap = {
  sm: { icon: "w-6 h-6 text-xs", text: "text-sm" },
  default: { icon: "w-8 h-8 text-sm", text: "text-base" },
  lg: { icon: "w-12 h-12 text-lg", text: "text-xl" },
};

export function Logo({ size = "default", className, showText = true }: LogoProps) {
  const { icon, text } = sizeMap[size];
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        className={cn(
          icon,
          "rounded-md flex items-center justify-center shrink-0",
          "bg-gradient-to-br from-brand-navy to-brand-gold"
        )}
        aria-hidden="true"
      >
        <span className="text-white font-bold leading-none">T</span>
      </div>
      {showText && (
        <span className={cn("font-bold text-brand-navy dark:text-white", text)}>
          Tracker 360
        </span>
      )}
    </div>
  );
}
