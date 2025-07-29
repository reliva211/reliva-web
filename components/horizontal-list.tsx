"use client";

import { useRef, useEffect, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Star,
  Crown,
  Play,
  Clock,
  ThumbsUp,
} from "lucide-react";
import "@/styles/horizontal-list.css";

interface CollectionItem {
  id: string;
  title: string;
  cover: string;
  rating?: number;
}

interface HorizontalListProps {
  title: string;
  icon: React.ReactNode;
  items: CollectionItem[];
  onAddItemAction: () => void;
  emptyMessage: string;
  emptyIcon: React.ReactNode;
  showRating?: boolean;
  showSpecialIcon?: boolean;
  specialIcon?: React.ReactNode;
}

export function HorizontalList({
  title,
  icon,
  items,
  onAddItemAction,
  emptyMessage,
  emptyIcon,
  showRating = false,
  showSpecialIcon = false,
  specialIcon,
}: HorizontalListProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const checkScrollButtons = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } =
        scrollContainerRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScrollButtons();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener("scroll", checkScrollButtons);
      return () => container.removeEventListener("scroll", checkScrollButtons);
    }
  }, [items]);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -300, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 300, behavior: "smooth" });
    }
  };

  return (
    <Card>
      <CardHeader className="px-4 sm:px-6">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="hidden sm:block">{icon}</div>
            <span className="text-sm sm:text-base">{title}</span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={onAddItemAction}
            className="flex-shrink-0"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="relative px-4 sm:px-6">
        {items.length === 0 ? (
          <div className="text-center py-8 sm:py-12 text-muted-foreground">
            <div className="hidden sm:block">{emptyIcon}</div>
            <div className="block sm:hidden scale-75">{emptyIcon}</div>
            <p className="mt-2 text-sm sm:text-base">{emptyMessage}</p>
          </div>
        ) : (
          <div className="relative group">
            {/* Left Arrow */}
            {showLeftArrow && (
              <Button
                variant="secondary"
                size="sm"
                className="absolute left-2 top-1/2 -translate-y-1/2 z-10 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:flex"
                onClick={scrollLeft}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}

            {/* Right Arrow */}
            {showRightArrow && (
              <Button
                variant="secondary"
                size="sm"
                className="absolute right-2 top-1/2 -translate-y-1/2 z-10 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:flex"
                onClick={scrollRight}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}

            {/* Horizontal Scroll Container */}
            <div
              ref={scrollContainerRef}
              className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide pb-4 -mx-4 sm:-mx-6 px-4 sm:px-6"
              style={{
                scrollbarWidth: "none",
                msOverflowStyle: "none",
              }}
            >
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex-shrink-0 w-24 sm:w-32 md:w-48 group/item hover:scale-105 transition-transform duration-200"
                >
                  <div className="relative">
                    {/* Poster */}
                    <div className="aspect-[2/3] bg-muted rounded-lg overflow-hidden mb-2">
                      <Image
                        src={item.cover}
                        alt={item.title}
                        fill
                        className="object-cover group-hover/item:scale-110 transition-transform duration-200"
                      />
                    </div>

                    {/* Rating */}
                    {showRating && item.rating && !isNaN(item.rating) && (
                      <div className="flex items-center justify-center gap-1 mt-1">
                        <Star className="h-2 w-2 sm:h-3 sm:w-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs">
                          {item.rating.toFixed(1)}
                        </span>
                      </div>
                    )}

                    {/* Special Icon */}
                    {showSpecialIcon && specialIcon && (
                      <div className="flex items-center justify-center mt-1">
                        <div className="w-2 h-2 sm:w-3 sm:h-3">
                          {specialIcon}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
