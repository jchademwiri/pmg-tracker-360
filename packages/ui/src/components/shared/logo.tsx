import * as React from "react";
import Image from "next/image";
import { cn } from "../../lib/utils";

interface LogoProps {
  size?: "sm" | "default" | "lg";
  className?: string;
  showText?: boolean;
  /** Path to the full logo SVG (with text). Falls back to icon + text if not provided. */
  src?: string;
  /** Path to the icon-only SVG. Used when showText=false. */
  iconSrc?: string;
}

const sizeMap = {
  sm:      { w: 20, h: 20, textClass: "text-sm" },
  default: { w: 28, h: 28, textClass: "text-base" },
  lg:      { w: 40, h: 40, textClass: "text-xl" },
};

export function Logo({
  size = "default",
  className,
  showText = true,
  src,
  iconSrc,
}: LogoProps) {
  const { w, h, textClass } = sizeMap[size];

  // If a full logo src is provided and we want text, use it directly
  if (src && showText) {
    return (
      <div className={cn("flex items-center", className)}>
        <Image src={src} alt="Tracker 360" width={w * 5} height={h} priority />
      </div>
    );
  }

  // Icon only
  const icon = iconSrc ?? src;
  if (icon) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Image src={icon} alt="Tracker 360" width={w} height={h} priority />
        {showText && (
          <span className={cn("font-bold", textClass)}>Tracker 360</span>
        )}
      </div>
    );
  }

  // Fallback — gradient icon with text (no image file needed)
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        className={cn(
          "rounded-md flex items-center justify-center shrink-0 bg-gradient-to-br from-brand-navy to-brand-gold"
        )}
        aria-hidden="true"
        style={{ width: w, height: h }}
      >
        <span className="text-white font-bold leading-none text-xs">T</span>
      </div>
      {showText && (
        <span className={cn("font-bold", textClass)}>Tracker 360</span>
      )}
    </div>
  );
}
