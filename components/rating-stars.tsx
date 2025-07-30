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
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
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

  const handleHalfStarClick = async (baseRating: number, isHalf: boolean) => {
    if (saving || loading) return;
    const rating = isHalf ? baseRating + 0.5 : baseRating;
    try {
      await setRating(mediaId, mediaType, mediaTitle, rating, mediaCover);
      setHasError(false);
    } catch (error) {
      console.error("Error setting rating:", error);
      setHasError(true);
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
        <div key={star} className="relative">
          {/* Half star (left side) */}
          <button
            onClick={() => handleHalfStarClick(star - 1, true)}
            onMouseEnter={() => setHoverRating(star - 0.5)}
            onMouseLeave={handleMouseLeave}
            disabled={saving || loading}
            className="absolute left-0 top-0 w-1/2 h-full transition-colors hover:scale-110 disabled:opacity-50 z-10"
          />
          {/* Full star (right side) */}
          <button
            onClick={() => handleStarClick(star)}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={handleMouseLeave}
            disabled={saving || loading}
            className="absolute right-0 top-0 w-1/2 h-full transition-colors hover:scale-110 disabled:opacity-50 z-10"
          />
          {/* Star icon */}
          <Star
            className={`${sizeClasses[size]} ${
              displayRating >= star
                ? "fill-yellow-400 text-yellow-400"
                : displayRating >= star - 0.5
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300 dark:text-gray-600"
            }`}
          />
        </div>
      ))}
      {showAverage && averageRating > 0 && (
        <span className="text-xs text-muted-foreground ml-1">
          ({averageRating.toFixed(1)})
        </span>
      )}
    </div>
  );
}
