'use client';

import { useState } from 'react';
import { ChevronDown, Calendar } from 'lucide-react';
import StatusBadge from './StatusBadge';

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
  emptyMessage = 'No items found.',
  itemTypeLabel = 'Item',
}: Props) {
  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // Group items by YYYY-MM
  const groups: Record<string, { label: string; items: GroupableItem[] }> = {};

  items.forEach((item) => {
    const itemDate = item.date ? new Date(item.date) : new Date();
    const year = itemDate.getFullYear();
    const month = String(itemDate.getMonth() + 1).padStart(2, '0');
    const monthKey = `${year}-${month}`;
    const monthName = itemDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

    if (!groups[monthKey]) {
      groups[monthKey] = { label: monthName, items: [] };
    }
    groups[monthKey].items.push(item);
  });

  const monthKeys = Object.keys(groups).sort().reverse();

  // Current month open by default
  const [openMonth, setOpenMonth] = useState<string | null>(
    monthKeys.includes(currentMonthKey) ? currentMonthKey : monthKeys[0] || null
  );

  if (items.length === 0) {
    return (
      <div className="p-8 text-center text-zinc-500 border border-dashed border-zinc-800 rounded-xl">
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
            className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden transition-all duration-200"
          >
            <button
              type="button"
              onClick={() => setOpenMonth(isOpen ? null : key)}
              className="w-full p-4 flex items-center justify-between bg-zinc-900/90 hover:bg-zinc-800/80 transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-indigo-400" />
                <span className="font-semibold text-sm text-white">{grp.label}</span>
                {isCurrentMonth && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-950 text-indigo-300 border border-indigo-800">
                    Current Month
                  </span>
                )}
                <span className="text-xs text-zinc-500 font-medium">
                  ({grp.items.length} {itemTypeLabel.toLowerCase()}{grp.items.length > 1 ? 's' : ''})
                </span>
              </div>
              <ChevronDown
                className={`h-4 w-4 text-zinc-400 transition-transform duration-300 ${
                  isOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {isOpen && (
              <div className="p-4 pt-0 border-t border-zinc-800/80 animate-in slide-in-from-top-2 duration-200">
                <div className="divide-y divide-zinc-800/60">
                  {grp.items.map((it) => (
                    <div
                      key={it.id}
                      className="py-3 flex flex-wrap items-center justify-between gap-3 first:pt-2 last:pb-0"
                    >
                      <div className="space-y-0.5">
                        <div className="text-sm font-medium text-white">{it.title}</div>
                        <div className="text-xs text-zinc-500">
                          ID: <span className="font-mono">{it.id}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {it.valueZar !== undefined && (
                          <span className="text-xs font-bold text-emerald-400">
                            R {it.valueZar.toLocaleString('en-ZA')}
                          </span>
                        )}
                        <StatusBadge status={it.status} />
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
