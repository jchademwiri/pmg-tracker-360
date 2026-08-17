"use client";

import * as React from "react";
import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, Flame } from "lucide-react";

export type PriorityValue = "low" | "medium" | "high" | "urgent";

export const PRIORITY_OPTIONS = [
  {
    value: "low",
    label: "Low Priority",
    dotColor: "bg-emerald-400",
    glowColor: "shadow-[0_0_8px_rgba(52,211,153,0.6)]",
  },
  {
    value: "medium",
    label: "Medium Priority",
    dotColor: "bg-sky-400",
    glowColor: "shadow-[0_0_8px_rgba(56,189,248,0.6)]",
  },
  {
    value: "high",
    label: "High Priority",
    dotColor: "bg-amber-400",
    glowColor: "shadow-[0_0_8px_rgba(251,191,36,0.6)]",
  },
  {
    value: "urgent",
    label: "Urgent / Critical",
    dotColor: "bg-rose-500",
    glowColor: "shadow-[0_0_10px_rgba(244,63,94,0.8)]",
    icon: <Flame className="h-3.5 w-3.5 text-rose-400 fill-rose-400" />,
  },
];

interface PrioritySelectProps {
  value: PriorityValue | string;
  onValueChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
}

export function PrioritySelect({
  value,
  onValueChange,
  className = "",
  disabled = false,
}: PrioritySelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentOption =
    PRIORITY_OPTIONS.find((opt) => opt.value === value) || PRIORITY_OPTIONS[1];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        className={`w-full h-8 px-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 hover:border-amber-500/40 rounded-lg text-xs text-zinc-200 flex items-center justify-between gap-2 transition-all duration-200 outline-none focus:ring-1 focus:ring-amber-500/40 cursor-pointer disabled:opacity-50 select-none ${className}`}
      >
        <div className="flex items-center gap-2">
          <span
            className={`h-2 w-2 rounded-full ${currentOption.dotColor} ${currentOption.glowColor}`}
          />
          <span className="font-medium text-xs flex items-center gap-1">
            {currentOption.icon}
            {currentOption.label}
          </span>
        </div>
        <ChevronDown
          className={`h-3.5 w-3.5 text-zinc-400 opacity-70 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 overflow-hidden rounded-xl border border-zinc-700 bg-zinc-900/98 backdrop-blur-xl shadow-2xl p-1 animate-in fade-in-0 zoom-in-95">
          <div className="p-0.5 space-y-0.5">
            {PRIORITY_OPTIONS.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <div
                  key={opt.value}
                  onClick={() => {
                    onValueChange(opt.value);
                    setOpen(false);
                  }}
                  className={`relative flex items-center justify-between px-2.5 py-1.5 text-xs rounded-md cursor-pointer transition-all duration-150 outline-none select-none ${
                    isSelected
                      ? "bg-amber-500/20 text-white font-semibold border border-amber-500/30"
                      : "text-zinc-300 hover:bg-zinc-800 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2 w-2 rounded-full ${opt.dotColor} ${
                        isSelected ? opt.glowColor : ""
                      }`}
                    />
                    <span className="flex items-center gap-1">
                      {opt.icon}
                      <span>{opt.label}</span>
                    </span>
                  </div>

                  {isSelected && (
                    <Check className="h-3.5 w-3.5 text-amber-400" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
