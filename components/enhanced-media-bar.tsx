"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { MovieCard } from "./movie-card";

interface MediaItem {
  id: string;
  title: string;
  year: number;
  cover: string;
  rating?: number;
  status?: string;
  mediaType?: "movie" | "series" | "person";
}

interface EnhancedMediaBarProps {
  title: string;
  icon: React.ReactNode;
  items: MediaItem[];
  variant?:
    | "default"
    | "favorite"
    | "recent"
    | "recommended"
    | "watchlist"
    | "watched";
  showRanking?: boolean;
  maxItems?: number;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  onViewAll?: () => void;
  onAddItem?: () => void;
  className?: string;
}

export function EnhancedMediaBar({
  title,
  icon,
  items,
  variant = "default",
  showRanking = false,
  maxItems = 6,
  emptyMessage = "No items available",
  emptyIcon,
  onViewAll,
  onAddItem,
  className = "",
}: EnhancedMediaBarProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const displayedItems = items.slice(0, maxItems);
  const totalPages = Math.ceil(displayedItems.length / 6);
  const currentPage = Math.floor(currentIndex / 6);

  const nextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentIndex(Math.min(currentIndex + 6, displayedItems.length - 6));
    }
  };

  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentIndex(Math.max(currentIndex - 6, 0));
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case "favorite":
        return {
          headerBg: "bg-gradient-to-r from-yellow-500/10 to-orange-500/10",
          borderColor: "border-yellow-500/20",
          iconColor: "text-yellow-500",
        };
      case "recent":
        return {
          headerBg: "bg-gradient-to-r from-green-500/10 to-emerald-500/10",
          borderColor: "border-green-500/20",
          iconColor: "text-green-500",
        };
      case "recommended":
        return {
          headerBg: "bg-gradient-to-r from-blue-500/10 to-indigo-500/10",
          borderColor: "border-blue-500/20",
          iconColor: "text-blue-500",
        };
      case "watchlist":
        return {
          headerBg: "bg-gradient-to-r from-purple-500/10 to-pink-500/10",
          borderColor: "border-purple-500/20",
          iconColor: "text-purple-500",
        };
      case "watched":
        return {
          headerBg: "bg-gradient-to-r from-teal-500/10 to-cyan-500/10",
          borderColor: "border-teal-500/20",
          iconColor: "text-teal-500",
        };
      default:
        return {
          headerBg: "bg-gradient-to-r from-gray-500/10 to-slate-500/10",
          borderColor: "border-gray-500/20",
          iconColor: "text-gray-500",
        };
    }
  };

  const styles = getVariantStyles();

  if (displayedItems.length === 0) {
    return (
      <Card className={`overflow-hidden ${className}`}>
        <CardHeader
          className={`${styles.headerBg} ${styles.borderColor} border-b`}
        >
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={styles.iconColor}>{icon}</div>
              <span className="text-lg font-semibold">{title}</span>
            </div>
            {onAddItem && (
              <Button
                size="sm"
                variant="outline"
                onClick={onAddItem}
                className="flex-shrink-0"
              >
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          <div className="text-center">
            {emptyIcon && <div className="mb-4">{emptyIcon}</div>}
            <h4 className="text-lg font-medium mb-2">{emptyMessage}</h4>
            <p className="text-muted-foreground">
              {variant === "favorite" &&
                "Add movies to your favorites to see them here"}
              {variant === "recent" && "Start watching movies to see them here"}
              {variant === "recommended" &&
                "Your movie recommendations will appear here"}
              {variant === "watchlist" &&
                "Add movies to your watchlist to see them here"}
              {variant === "watched" &&
                "Start watching movies to see them here"}
              {variant === "default" && "No items available"}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardHeader
        className={`${styles.headerBg} ${styles.borderColor} border-b`}
      >
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={styles.iconColor}>{icon}</div>
            <span className="text-lg font-semibold">{title}</span>
            <Badge variant="secondary" className="ml-2">
              {displayedItems.length} items
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            {onAddItem && (
              <Button
                size="sm"
                variant="outline"
                onClick={onAddItem}
                className="flex-shrink-0"
              >
                <Plus className="h-4 w-4" />
              </Button>
            )}
            {onViewAll && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onViewAll}
                className="text-muted-foreground"
              >
                View All
              </Button>
            )}
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="relative p-6">
        {/* Navigation Arrows */}
        {totalPages > 1 && (
          <>
            <Button
              variant="secondary"
              size="sm"
              className={`absolute left-2 top-1/2 -translate-y-1/2 z-10 ${
                currentPage === 0 ? "opacity-50 cursor-not-allowed" : ""
              }`}
              onClick={prevPage}
              disabled={currentPage === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <Button
              variant="secondary"
              size="sm"
              className={`absolute right-2 top-1/2 -translate-y-1/2 z-10 ${
                currentPage === totalPages - 1
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }`}
              onClick={nextPage}
              disabled={currentPage === totalPages - 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        )}

        {/* Media Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 lg:gap-4">
          {displayedItems
            .slice(currentIndex, currentIndex + 6)
            .map((item, index) => (
              <MovieCard
                key={`${item.id}-${currentIndex + index}`}
                movie={item}
                variant={variant}
                rank={showRanking ? currentIndex + index + 1 : undefined}
                showRanking={showRanking}
                onClick={() => {
                  // Item clicked
                }}
              />
            ))}
        </div>

        {/* Page Indicators */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-4">
            <div className="flex gap-1">
              {Array.from({ length: totalPages }, (_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    i === currentPage
                      ? "bg-primary"
                      : "bg-muted hover:bg-muted-foreground/50"
                  }`}
                />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default EnhancedMediaBar;
