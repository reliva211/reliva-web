export default function ReviewDetailLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-black dark:to-gray-900">
      {/* Header Skeleton */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="h-10 w-24 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
            <div className="flex items-center space-x-3">
              <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Skeleton */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Media Info Skeleton */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              {/* Media Cover Skeleton */}
              <div className="w-full aspect-[2/3] rounded-2xl bg-gray-200 dark:bg-gray-700 animate-pulse mb-6"></div>

              {/* Media Details Skeleton */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse mb-4"></div>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse mb-4"></div>
                <div className="space-y-3">
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
                    ></div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Review Content Skeleton */}
          <div className="lg:col-span-2">
            {/* Author Info Skeleton */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 mb-6">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
                <div className="flex-1">
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse mb-2"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse w-24"></div>
                </div>
                <div className="h-10 w-20 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
              </div>
            </div>

            {/* Review Content Skeleton */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 mb-6">
              <div className="space-y-4">
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
                  ></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
