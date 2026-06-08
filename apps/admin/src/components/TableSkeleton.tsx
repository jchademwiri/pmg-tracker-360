import { Skeleton } from '@/components/ui/skeleton';

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
}

export function TableSkeleton({ rows = 5, columns = 4 }: TableSkeletonProps) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden">
      {/* Header */}
      <div className="bg-zinc-900 border-b border-zinc-800 px-4 py-3 flex gap-8">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-3 w-20 bg-zinc-800" />
        ))}
      </div>

      {/* Rows */}
      <div className="divide-y divide-zinc-800">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div
            key={rowIndex}
            className="px-4 py-3 flex gap-8 items-center"
          >
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton
                key={colIndex}
                className="h-3 bg-zinc-800"
                style={{
                  width: `${((rowIndex * 7 + colIndex * 13) % 40) + 40}%`,
                  maxWidth: colIndex === 0 ? '160px' : '120px',
                }}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Pagination skeleton */}
      <div className="border-t border-zinc-800 px-4 py-3 flex items-center justify-between">
        <Skeleton className="h-3 w-24 bg-zinc-800" />
        <div className="flex gap-2">
          <Skeleton className="h-7 w-16 rounded-lg bg-zinc-800" />
          <Skeleton className="h-7 w-12 rounded-lg bg-zinc-800" />
        </div>
      </div>
    </div>
  );
}
