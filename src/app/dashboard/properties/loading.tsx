import { Skeleton, StatCardSkeleton, CardGridSkeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-10 w-36 rounded-full" />
      </div>
      <div className="flex gap-3">
        <Skeleton className="h-8 w-28 rounded-full" />
        <Skeleton className="h-8 w-24 rounded-full" />
        <Skeleton className="h-8 w-24 rounded-full" />
        <Skeleton className="h-8 w-28 rounded-full" />
      </div>
      <Skeleton className="h-64 w-full rounded-2xl" />
      <Skeleton className="h-6 w-40" />
      <CardGridSkeleton count={6} />
    </div>
  );
}
