"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { useRatings } from "@/hooks/use-ratings";

interface RatingStarsProps {
  mediaId: string | number;
  mediaType: "movie" | "series";
  mediaTitle: string;
  mediaCover?: string;
  size?: "sm" | "md" | "lg";
  showAverage?: boolean;
  className?: string;
}

export function RatingStars({
  mediaId,
  mediaType,
  mediaTitle,
  mediaCover,
  size = "md",
  showAverage = false,
  className = "",
}: RatingStarsProps) {
  const { getUserRating, setRating, saving, loading } = useRatings();
  const [hoverRating, setHoverRating] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [hasError, setHasError] = useState(false);

  const userRating = getUserRating(mediaId, mediaType);

  const sizeClasses = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-6 h-6",
  };

  const handleStarClick = async (rating: number) => {
    if (saving || loading) return;
    try {
      await setRating(mediaId, mediaType, mediaTitle, rating, mediaCover);
      setHasError(false);
    } catch (error) {
      console.error("Error setting rating:", error);
      setHasError(true);
      // Don't crash the component, just log the error
    }
  };

  const handleStarHover = (rating: number) => {
    if (loading) return;
    setHoverRating(rating);
  };

  const handleMouseLeave = () => {
    setHoverRating(0);
  };

  const displayRating = hoverRating || userRating;

  // Show loading state
  if (loading) {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClasses[size]} text-gray-300 dark:text-gray-600 animate-pulse`}
          />
        ))}
      </div>
    );
  }

  // If there's an error, show static stars
  if (hasError) {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClasses[size]} text-gray-300 dark:text-gray-600`}
          />
        ))}
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => handleStarClick(star)}
          onMouseEnter={() => handleStarHover(star)}
          onMouseLeave={handleMouseLeave}
          disabled={saving || loading}
          className="transition-colors hover:scale-110 disabled:opacity-50"
        >
          <Star
            className={`${sizeClasses[size]} ${
              displayRating >= star
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300 dark:text-gray-600"
            }`}
          />
        </button>
      ))}
      {showAverage && averageRating > 0 && (
        <span className="text-xs text-muted-foreground ml-1">
          ({averageRating.toFixed(1)})
        </span>
      )}
    </div>
  );
}
