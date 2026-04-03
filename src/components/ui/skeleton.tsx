export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-surface-container-high/50 ${className}`}
    />
  );
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-2xl bg-surface-container-lowest p-6 shadow-[0_10px_30px_-5px_rgba(24,28,30,0.04)]">
      <Skeleton className="h-11 w-11 rounded-xl" />
      <Skeleton className="mt-4 h-8 w-20" />
      <Skeleton className="mt-2 h-4 w-28" />
    </div>
  );
}

export function TableRowSkeleton({ cols = 5 }: { cols?: number }) {
  return (
    <div className="flex items-center gap-4 px-5 py-4">
      <Skeleton className="h-10 w-10 rounded-full" />
      {Array.from({ length: cols - 1 }).map((_, i) => (
        <Skeleton key={i} className="h-4 flex-1" />
      ))}
    </div>
  );
}

export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl bg-surface-container-lowest p-5 shadow-[0_10px_30px_-5px_rgba(24,28,30,0.04)]"
        >
          <div className="flex justify-between mb-3">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <Skeleton className="h-4 w-32 mb-2" />
          <Skeleton className="h-6 w-24 mb-3" />
          <div className="flex gap-1.5">
            <Skeleton className="h-5 w-12 rounded-full" />
            <Skeleton className="h-5 w-12 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <Skeleton className="h-9 w-64" />
        <Skeleton className="mt-2 h-5 w-44" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="rounded-2xl bg-surface-container-lowest p-6 shadow-[0_10px_30px_-5px_rgba(24,28,30,0.04)] lg:col-span-8">
          <Skeleton className="h-6 w-40 mb-6" />
          <Skeleton className="h-48 w-full" />
        </div>
        <div className="rounded-2xl bg-surface-container-lowest p-6 shadow-[0_10px_30px_-5px_rgba(24,28,30,0.04)] lg:col-span-4">
          <Skeleton className="h-6 w-32 mb-5" />
          <div className="space-y-2.5">
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="rounded-2xl bg-surface-container-lowest shadow-[0_10px_30px_-5px_rgba(24,28,30,0.04)] overflow-hidden">
      <div className="bg-surface-container-low px-5 py-3">
        <Skeleton className="h-4 w-full" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <TableRowSkeleton key={i} />
      ))}
    </div>
  );
}
