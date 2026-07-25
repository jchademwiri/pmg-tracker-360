'use client';

import { Suspense, type ReactNode } from 'react';
import { TableSkeleton } from '@/components/TableSkeleton';
import { useSearchParams, useRouter } from 'next/navigation';
import { Checkbox } from '@/components/ui/checkbox';

export type Column<T> = {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
};

type DataTableProps<T> = {
  columns: Column<T>[];
  data: T[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  selectable?: boolean;
  selectedKeys?: Set<string>;
  onSelectionChange?: (selectedKeys: Set<string>) => void;
};

export const PAGE_SIZE = 50;

/**
 * Pure helper — exported for property-based testing.
 * Returns the slice of data for the given page and page size.
 */
export function getPaginationSlice<T>(data: T[], page: number, pageSize: number): T[] {
  return data.slice((page - 1) * pageSize, page * pageSize);
}

/**
 * Pure helper — exported for property-based testing.
 * Returns total number of pages; minimum 1 for empty datasets.
 */
export function getTotalPages(dataLength: number, pageSize: number): number {
  if (pageSize <= 0) return 1;
  return Math.max(1, Math.ceil(dataLength / pageSize));
}

function parsePage(raw: string | null): number {
  if (raw === null) return 1;
  const n = parseInt(raw, 10);
  if (Number.isNaN(n) || n <= 0) return 1;
  return n;
}

function DataTableInner<T>({
  columns,
  data,
  rowKey,
  onRowClick,
  selectable = false,
  selectedKeys = new Set(),
  onSelectionChange,
}: DataTableProps<T>) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const page = parsePage(searchParams.get('page'));
  const totalPages = getTotalPages(data.length, PAGE_SIZE);
  const currentPage = Math.min(page, totalPages);

  const sliced = getPaginationSlice(data, currentPage, PAGE_SIZE);

  function navigate(newPage: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(newPage));
    router.push(`?${params.toString()}`);
  }

  const isPrevDisabled = currentPage === 1;
  const isNextDisabled = currentPage * PAGE_SIZE >= data.length;

  const currentSlicedKeys = sliced.map(rowKey);
  const isAllSlicedSelected =
    currentSlicedKeys.length > 0 &&
    currentSlicedKeys.every((key) => selectedKeys.has(key));

  function handleSelectAllToggle() {
    if (!onSelectionChange) return;
    const next = new Set(selectedKeys);
    if (isAllSlicedSelected) {
      currentSlicedKeys.forEach((key) => next.delete(key));
    } else {
      currentSlicedKeys.forEach((key) => next.add(key));
    }
    onSelectionChange(next);
  }

  function handleRowSelectToggle(key: string) {
    if (!onSelectionChange) return;
    const next = new Set(selectedKeys);
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    onSelectionChange(next);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-x-auto rounded-xl border border-zinc-800">
        <table className="w-full text-sm text-left">
          <thead className="bg-zinc-900 border-b border-zinc-800">
            <tr>
              {selectable && (
                <th scope="col" className="w-10 px-4 py-3">
                  <Checkbox
                    checked={isAllSlicedSelected}
                    onCheckedChange={handleSelectAllToggle}
                    aria-label="Select all rows"
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className={`px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wide whitespace-nowrap ${col.className ?? ''}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {sliced.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  className="px-4 py-8 text-center text-zinc-500 text-sm"
                >
                  No records found
                </td>
              </tr>
            ) : (
              sliced.map((row) => {
                const key = rowKey(row);
                const isSelected = selectedKeys.has(key);
                return (
                  <tr
                    key={key}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    className={`transition-colors ${
                      isSelected ? 'bg-zinc-900/90' : 'bg-zinc-950 hover:bg-zinc-900'
                    } ${onRowClick ? 'cursor-pointer' : ''}`}
                  >
                    {selectable && (
                      <td
                        className="w-10 px-4 py-3"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => handleRowSelectToggle(key)}
                          aria-label={`Select row ${key}`}
                        />
                      </td>
                    )}
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={`px-4 py-3 text-zinc-300 ${col.className ?? ''}`}
                      >
                        {col.render(row)}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination footer */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs text-zinc-500">
          Page {currentPage} of {totalPages}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={isPrevDisabled}
            onClick={() => navigate(currentPage - 1)}
            className="px-3 py-1.5 text-xs rounded-lg border border-zinc-700 text-zinc-300 hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <button
            type="button"
            disabled={isNextDisabled}
            onClick={() => navigate(currentPage + 1)}
            className="px-3 py-1.5 text-xs rounded-lg border border-zinc-700 text-zinc-300 hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DataTable<T>(props: DataTableProps<T>) {
  return (
    <Suspense
      fallback={<TableSkeleton columns={props.columns.length} />}
    >
      <DataTableInner {...props} />
    </Suspense>
  );
}
