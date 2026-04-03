import { Skeleton, TableSkeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between">
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-10 w-36 rounded-full" />
      </div>
      <div className="flex gap-3">
        <Skeleton className="h-12 flex-1 rounded-xl" />
        <Skeleton className="h-12 w-20 rounded-full" />
        <Skeleton className="h-12 w-24 rounded-full" />
        <Skeleton className="h-12 w-20 rounded-full" />
        <Skeleton className="h-12 w-24 rounded-full" />
      </div>
      <TableSkeleton rows={6} />
    </div>
  );
}
