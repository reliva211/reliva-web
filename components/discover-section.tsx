"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";

interface DiscoverItem {
  id: string | number;
  title: string;
  cover: string;
  year?: number;
  author?: string;
  overview?: string;
}

interface DiscoverSectionProps {
  title: string;
  subtitle: string;
  items: DiscoverItem[];
  isLoading: boolean;
  onRetry: () => void;
  itemType: "movie" | "book" | "series";
  containerId: string;
}

export default function DiscoverSection({
  title,
  subtitle,
  items,
  isLoading,
  onRetry,
  itemType,
  containerId,
}: DiscoverSectionProps) {
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const checkScrollButtons = () => {
    const container = document.getElementById(containerId);
    if (container) {
      const { scrollLeft, scrollWidth, clientWidth } = container;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScrollButtons();
    const container = document.getElementById(containerId);
    if (container) {
      container.addEventListener("scroll", checkScrollButtons);
      return () => container.removeEventListener("scroll", checkScrollButtons);
    }
  }, [items, containerId]);

  const scrollLeft = () => {
    const container = document.getElementById(containerId);
    if (container) {
      container.scrollBy({ left: -300, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    const container = document.getElementById(containerId);
    if (container) {
      container.scrollBy({ left: 300, behavior: "smooth" });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8 sm:py-16">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-gray-400 text-base sm:text-lg">
            Loading {title.toLowerCase()}...
          </p>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12 sm:py-20">
        <div className="space-y-4 sm:space-y-6">
          <div className="h-16 w-16 sm:h-20 sm:w-20 text-gray-400 mx-auto">
            {itemType === "movie" ? "🎬" : itemType === "book" ? "📚" : "📺"}
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-bold mb-2 text-white">
              No {title.toLowerCase()}
            </h3>
            <p className="text-gray-400 text-base sm:text-lg">
              Unable to load {title.toLowerCase()} at the moment
            </p>
          </div>
          <Button
            onClick={onRetry}
            className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-semibold transition-all duration-200 text-sm sm:text-base"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full discover-section">
      <div className="mb-3 sm:mb-4 px-1 sm:px-0 discover-header">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white leading-tight discover-title">
          {title}
        </h2>
        <p className="text-gray-400 mt-1 sm:mt-2 text-sm sm:text-base discover-subtitle">
          {subtitle}
        </p>
      </div>

      <div className="relative w-full overflow-hidden">
        {/* Left Arrow */}
        {showLeftArrow && (
          <button
            onClick={scrollLeft}
            className="absolute left-2 sm:left-2 top-1/2 transform -translate-y-1/2 z-30 bg-black/90 hover:bg-black text-white rounded-full p-3 sm:p-4 transition-all duration-300 backdrop-blur-md shadow-2xl border border-white/20 hover:scale-110 flex items-center justify-center min-w-[44px] min-h-[44px] discover-nav-arrow"
          >
            <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
        )}

        {/* Right Arrow */}
        {showRightArrow && (
          <button
            onClick={scrollRight}
            className="absolute right-2 sm:right-2 top-1/2 transform -translate-y-1/2 z-30 bg-black/90 hover:bg-black text-white rounded-full p-3 sm:p-4 transition-all duration-300 backdrop-blur-md shadow-2xl border border-white/20 hover:scale-110 flex items-center justify-center min-w-[44px] min-h-[44px] discover-nav-arrow"
          >
            <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
        )}

        {/* Items Container */}
        <div
          id={containerId}
          className={`flex gap-2 sm:gap-4 md:gap-6 overflow-x-auto px-2 sm:px-4 md:px-8 py-3 sm:py-4 md:py-6 scrollbar-hide horizontal-scroll-container ${
            itemType === "book" ? "books-horizontal-container" : "w-full"
          }`}
          style={{
            WebkitOverflowScrolling: "touch",
            overscrollBehaviorX: "contain",
          }}
        >
          {items.map((item) => (
            <div
              key={item.id}
              className="flex-shrink-0 w-[120px] sm:w-[140px] md:w-[160px] lg:w-[180px] discover-card"
            >
              <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900 shadow-2xl">
                <Link
                  href={`/${
                    itemType === "series" ? "series" : itemType + "s"
                  }/${item.id}`}
                  className="block w-full h-full"
                >
                  <Image
                    src={item.cover || "/placeholder.svg"}
                    alt={item.title || "Unknown"}
                    fill
                    className="object-cover cursor-pointer transition-transform duration-300 hover:scale-105"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "/placeholder.svg";
                    }}
                  />
                </Link>
              </div>
              <div className="mt-2 sm:mt-3 space-y-1 sm:space-y-2">
                <h4 className="font-bold text-xs sm:text-sm md:text-base truncate text-white leading-tight">
                  {item.title || "Unknown Title"}
                </h4>
                {item.author && (
                  <p className="text-xs text-gray-400 font-medium truncate">
                    {item.author}
                  </p>
                )}
                <p className="text-xs text-gray-400 font-medium">
                  {item.year || "N/A"}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
