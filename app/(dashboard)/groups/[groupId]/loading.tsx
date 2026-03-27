import { Skeleton } from "@/components/ui/skeleton";

export default function GroupLoading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-3xl space-y-6">
        <Skeleton className="h-12 w-full" />
        <div className="flex gap-2 flex-wrap">
          <Skeleton className="h-9 w-28 rounded-full" />
          <Skeleton className="h-9 w-28 rounded-full" />
          <Skeleton className="h-9 w-28 rounded-full" />
        </div>
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-10 w-full" />
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    </div>
  );
}

