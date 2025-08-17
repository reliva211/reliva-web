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
      <div className="flex items-center justify-center py-16">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-gray-400 text-lg">
            Loading {title.toLowerCase()}...
          </p>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="space-y-6">
          <div className="h-20 w-20 text-gray-400 mx-auto">
            {itemType === "movie" ? "🎬" : itemType === "book" ? "📚" : "📺"}
          </div>
          <div>
            <h3 className="text-xl font-bold mb-2 text-white">
              No {title.toLowerCase()}
            </h3>
            <p className="text-gray-400 text-lg">
              Unable to load {title.toLowerCase()} at the moment
            </p>
          </div>
          <Button
            onClick={onRetry}
            className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
          {title}
        </h2>
        <p className="text-gray-400 mt-2 text-sm sm:text-base">{subtitle}</p>
      </div>

      <div className="relative w-full overflow-hidden">
        {/* Left Arrow */}
        {showLeftArrow && (
          <button
            onClick={scrollLeft}
            className="absolute left-1 sm:left-2 top-1/2 transform -translate-y-1/2 z-30 bg-black/80 hover:bg-black text-white rounded-full p-2 sm:p-4 transition-all duration-300 backdrop-blur-md shadow-2xl border border-white/10 hover:scale-110 flex items-center justify-center"
          >
            <ChevronLeft className="h-4 w-4 sm:h-6 sm:w-6" />
          </button>
        )}

        {/* Right Arrow */}
        {showRightArrow && (
          <button
            onClick={scrollRight}
            className="absolute right-1 sm:right-2 top-1/2 transform -translate-y-1/2 z-30 bg-black/80 hover:bg-black text-white rounded-full p-2 sm:p-4 transition-all duration-300 backdrop-blur-md shadow-2xl border border-white/10 hover:scale-110 flex items-center justify-center"
          >
            <ChevronRight className="h-4 w-4 sm:h-6 sm:w-6" />
          </button>
        )}

        {/* Items Container */}
        <div
          id={containerId}
          className="flex gap-3 sm:gap-4 overflow-x-auto px-4 sm:px-8 py-4 sm:py-6 scrollbar-hide w-full horizontal-scroll-container"
        >
          {items.map((item) => (
            <div
              key={item.id}
              className="flex-shrink-0 w-[140px] sm:w-[180px] md:w-[220px]"
            >
              <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900 shadow-2xl">
                <Link
                  href={`/${
                    itemType === "series" ? "series" : itemType + "s"
                  }/${item.id}`}
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
              <div className="mt-3 sm:mt-4 space-y-1 sm:space-y-2">
                <h4 className="font-bold text-xs sm:text-sm truncate text-white">
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
