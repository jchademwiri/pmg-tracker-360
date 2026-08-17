"use client";

import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import {
  ChevronDown,
  Check,
  Flame,
  Clock,
  ShieldAlert,
  Sparkles,
} from "lucide-react";

export type PriorityValue = "low" | "medium" | "high" | "urgent";

interface PriorityOption {
  value: PriorityValue;
  label: string;
  dotColor: string;
  glowColor: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  icon?: React.ReactNode;
}

export const PRIORITY_OPTIONS: PriorityOption[] = [
  {
    value: "low",
    label: "Low Priority",
    dotColor: "bg-emerald-400",
    glowColor: "shadow-[0_0_8px_rgba(52,211,153,0.6)]",
    badgeBg: "bg-emerald-950/60",
    badgeText: "text-emerald-300",
    badgeBorder: "border-emerald-700/50",
  },
  {
    value: "medium",
    label: "Medium Priority",
    dotColor: "bg-sky-400",
    glowColor: "shadow-[0_0_8px_rgba(56,189,248,0.6)]",
    badgeBg: "bg-sky-950/60",
    badgeText: "text-sky-300",
    badgeBorder: "border-sky-700/50",
  },
  {
    value: "high",
    label: "High Priority",
    dotColor: "bg-amber-400",
    glowColor: "shadow-[0_0_8px_rgba(251,191,36,0.6)]",
    badgeBg: "bg-amber-950/60",
    badgeText: "text-amber-300",
    badgeBorder: "border-amber-700/50",
  },
  {
    value: "urgent",
    label: "Urgent / Critical",
    dotColor: "bg-rose-500",
    glowColor: "shadow-[0_0_10px_rgba(244,63,94,0.8)]",
    badgeBg: "bg-rose-950/70",
    badgeText: "text-rose-300",
    badgeBorder: "border-rose-700/60",
    icon: <Flame className="h-3.5 w-3.5 text-rose-400 fill-rose-400" />,
  },
];

interface PrioritySelectProps {
  value: PriorityValue;
  onValueChange: (value: PriorityValue) => void;
  className?: string;
}

export function PrioritySelect({
  value,
  onValueChange,
  className = "",
}: PrioritySelectProps) {
  const currentOption =
    PRIORITY_OPTIONS.find((opt) => opt.value === value) || PRIORITY_OPTIONS[1];

  return (
    <SelectPrimitive.Root
      value={value}
      onValueChange={(val) => onValueChange(val as PriorityValue)}
    >
      <SelectPrimitive.Trigger
        className={`w-full h-11 px-3.5 bg-muted/40 hover:bg-muted/60 border border-border/80 hover:border-amber-500/40 rounded-xl text-sm text-foreground flex items-center justify-between gap-2 shadow-xs transition-all duration-200 outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/80 cursor-pointer ${className}`}
      >
        <div className="flex items-center gap-2.5">
          <span
            className={`h-2.5 w-2.5 rounded-full ${currentOption.dotColor} ${currentOption.glowColor}`}
          />
          <span className="font-medium text-foreground text-xs sm:text-sm flex items-center gap-1.5">
            {currentOption.icon}
            {currentOption.label}
          </span>
        </div>
        <SelectPrimitive.Icon asChild>
          <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>

      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          sideOffset={6}
          className="z-50 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-xl border border-border/90 bg-[#121826]/95 backdrop-blur-xl shadow-2xl p-1.5 animate-in fade-in-0 zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2"
        >
          <SelectPrimitive.Viewport className="p-1 space-y-1">
            {PRIORITY_OPTIONS.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <SelectPrimitive.Item
                  key={opt.value}
                  value={opt.value}
                  className={`relative flex items-center justify-between px-3 py-2.5 text-xs sm:text-sm rounded-lg cursor-pointer transition-all duration-150 outline-none select-none ${
                    isSelected
                      ? "bg-amber-500/15 text-foreground font-semibold border border-amber-500/30"
                      : "text-zinc-300 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${opt.dotColor} ${
                        isSelected ? opt.glowColor : ""
                      }`}
                    />
                    <span className="flex items-center gap-1.5">
                      {opt.icon}
                      <span>{opt.label}</span>
                    </span>
                  </div>

                  <SelectPrimitive.ItemIndicator>
                    <Check className="h-4 w-4 text-amber-400" />
                  </SelectPrimitive.ItemIndicator>
                </SelectPrimitive.Item>
              );
            })}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}
