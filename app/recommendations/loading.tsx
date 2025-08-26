export default function RecommendationsLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-16 sm:pt-20 pb-6 sm:pb-8">
        {/* Header Skeleton */}
        <div className="mb-8 sm:mb-12 text-center">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-2xl animate-pulse"></div>
            <div className="h-8 sm:h-10 bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent rounded w-40 sm:w-48 animate-pulse"></div>
          </div>
          <div className="h-5 sm:h-6 bg-gray-700 rounded w-80 sm:w-96 mx-auto animate-pulse"></div>
        </div>

        {/* Category Tabs Skeleton */}
        <div className="flex justify-center mb-8 sm:mb-12">
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-1 sm:p-2 border border-gray-600 w-full max-w-lg sm:max-w-none">
            <div className="flex flex-wrap justify-center gap-1 sm:gap-0">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="inline-block h-10 bg-gray-700 rounded-xl w-20 sm:w-24 mx-1 animate-pulse"
                ></div>
              ))}
            </div>
          </div>
        </div>

        {/* Content Skeleton */}
        <div className="space-y-8 sm:space-y-12">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-slate-800/30 backdrop-blur-sm rounded-3xl p-4 sm:p-6 md:p-8 border border-slate-700/30 relative overflow-hidden"
            >
              {/* Subtle gradient overlay for loading effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse"></div>
              {/* User Header Skeleton */}
              <div className="flex items-center gap-4 mb-6">
                <div className="relative">
                  <div className="w-12 h-12 bg-gray-700 rounded-full animate-pulse"></div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gray-600 rounded-full animate-pulse"></div>
                </div>
                <div className="flex-1">
                  <div className="h-6 bg-gray-700 rounded w-32 mb-2 animate-pulse"></div>
                  <div className="h-4 bg-gray-700 rounded w-24 animate-pulse"></div>
                </div>
              </div>

              {/* Items Grid Skeleton */}
              <div className="flex gap-4 overflow-x-auto pb-4">
                {[1, 2, 3, 4, 5, 6].map((item) => (
                  <div key={item} className="flex-shrink-0">
                    <div className="w-[100px] sm:w-[140px] md:w-[160px] h-[150px] sm:h-[200px] md:h-[240px] bg-gray-700 rounded-xl animate-pulse relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse"></div>
                    </div>
                    <div className="mt-3 space-y-2">
                      <div className="h-4 bg-gray-700 rounded w-full animate-pulse"></div>
                      <div className="h-3 bg-gray-700 rounded w-3/4 animate-pulse"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
