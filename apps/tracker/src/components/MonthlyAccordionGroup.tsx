"use client";

import { useState } from "react";
import { ChevronDown, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/format";

export interface GroupableItem {
  id: string;
  title: string;
  status: string;
  valueZar?: number;
  date: Date | string | null;
}

type Props = {
  items: GroupableItem[];
  emptyMessage?: string;
  itemTypeLabel?: string;
};

export default function MonthlyAccordionGroup({
  items,
  emptyMessage = "No items found.",
  itemTypeLabel = "Item",
}: Props) {
  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const groups: Record<string, { label: string; items: GroupableItem[] }> = {};

  items.forEach((item) => {
    const itemDate = item.date ? new Date(item.date) : new Date();
    const year = itemDate.getFullYear();
    const month = String(itemDate.getMonth() + 1).padStart(2, "0");
    const monthKey = `${year}-${month}`;
    const monthName = itemDate.toLocaleDateString("en-GB", {
      month: "long",
      year: "numeric",
    });

    if (!groups[monthKey]) {
      groups[monthKey] = { label: monthName, items: [] };
    }
    groups[monthKey].items.push(item);
  });

  const monthKeys = Object.keys(groups).sort().reverse();

  const [openMonth, setOpenMonth] = useState<string | null>(
    monthKeys.includes(currentMonthKey)
      ? currentMonthKey
      : monthKeys[0] || null,
  );

  if (items.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground border border-dashed rounded-xl">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {monthKeys.map((key) => {
        const grp = groups[key]!;
        const isOpen = openMonth === key;
        const isCurrentMonth = key === currentMonthKey;

        return (
          <div
            key={key}
            className="border rounded-xl overflow-hidden transition-all duration-200 bg-card"
          >
            <button
              type="button"
              onClick={() => setOpenMonth(isOpen ? null : key)}
              className="w-full p-4 flex items-center justify-between hover:bg-accent/50 transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-primary" />
                <span className="font-semibold text-sm text-foreground">
                  {grp.label}
                </span>
                {isCurrentMonth && (
                  <Badge
                    variant="default"
                    className="text-[10px] uppercase font-bold"
                  >
                    Current Month
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground font-medium">
                  ({grp.items.length} {itemTypeLabel.toLowerCase()}
                  {grp.items.length > 1 ? "s" : ""})
                </span>
              </div>
              <ChevronDown
                className={`h-4 w-4 text-muted-foreground transition-transform duration-300 ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {isOpen && (
              <div className="p-4 pt-0 border-t border-muted/50 animate-in slide-in-from-top-2 duration-200">
                <div className="divide-y divide-muted/30">
                  {grp.items.map((it) => (
                    <div
                      key={it.id}
                      className="py-3 flex flex-wrap items-center justify-between gap-3 first:pt-2 last:pb-0"
                    >
                      <div className="space-y-0.5">
                        <div className="text-sm font-medium text-foreground">
                          {it.title}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          ID: <span className="font-mono">{it.id}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {it.valueZar !== undefined && (
                          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(it.valueZar)}
                          </span>
                        )}
                        <Badge variant="outline" className="capitalize text-xs">
                          {it.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
