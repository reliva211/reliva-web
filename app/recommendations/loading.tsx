export default function RecommendationsLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-black dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header Skeleton */}
        <div className="mb-8">
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-64 mb-2 animate-pulse"></div>
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-96 animate-pulse"></div>
        </div>

        {/* Category Tabs Skeleton */}
        <div className="flex space-x-8 mb-6 border-b border-gray-200 dark:border-gray-700">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse"></div>
          ))}
        </div>

        {/* Source Filter Skeleton */}
        <div className="mb-6">
          <div className="flex items-center gap-4">
            {[1, 2].map((i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Content Skeleton */}
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
                    <div>
                      <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-1 animate-pulse"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse"></div>
                    </div>
                  </div>
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 