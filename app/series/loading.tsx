import { Skeleton } from "@/components/ui/skeleton";

export default function SeriesLoading() {
  return (
    <div className="container py-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Skeleton */}
        <div className="w-full md:w-64 space-y-6">
          <Skeleton className="h-10 w-full" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-6 w-24" />
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-12" />
              <Skeleton className="h-6 w-24" />
            </div>
          </div>
        </div>

        {/* Main Content Skeleton */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-10 w-36" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="aspect-[2/3] w-full" />
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
