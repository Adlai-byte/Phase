import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6 animate-fade-in">
      <Skeleton className="h-9 w-40" />
      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2">
          <Skeleton className="h-96 w-full rounded-2xl" />
        </div>
        <div className="lg:col-span-3">
          <Skeleton className="h-96 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
