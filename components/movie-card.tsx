"use client";

import Image from "next/image";
import { Crown, Clock, ThumbsUp, Eye, Play } from "lucide-react";
import { useRouter } from "next/navigation";

interface MovieCardProps {
  movie: {
    id: string;
    title: string;
    year: number;
    cover: string;
    rating?: number;
    status?: string;
    mediaType?: "movie" | "series" | "person";
  };
  variant?:
    | "default"
    | "favorite"
    | "recent"
    | "recommended"
    | "watchlist"
    | "watched";
  rank?: number;
  showRanking?: boolean;
  showActions?: boolean;
  className?: string;
  onClick?: () => void;
}

export function MovieCard({
  movie,
  variant = "default",
  rank,
  showRanking = false,
  showActions = false,
  className = "",
  onClick,
}: MovieCardProps) {
  const router = useRouter();

  const getVariantStyles = () => {
    switch (variant) {
      case "favorite":
        return {
          container: "bg-[#1A1A1A]",
          badge: "bg-yellow-500/90",
          badgeIcon: Crown,
          badgeText: "",
        };
      case "recent":
        return {
          container: "bg-gradient-to-br from-gray-800 to-gray-900",
          badge: "bg-green-500/90",
          badgeIcon: Play,
          badgeText: "Recent",
        };
      case "recommended":
        return {
          container: "bg-gradient-to-br from-gray-800 to-gray-900",
          badge: "bg-blue-500/90",
          badgeIcon: ThumbsUp,
          badgeText: "",
        };
      case "watchlist":
        return {
          container: "bg-gradient-to-br from-gray-800 to-gray-900",
          badge: "bg-blue-500/90",
          badgeIcon: Clock,
          badgeText: "",
        };
      case "watched":
        return {
          container: "bg-gradient-to-br from-gray-800 to-gray-900",
          badge: "bg-green-500/90",
          badgeIcon: Play,
          badgeText: "",
        };
      default:
        return {
          container: "bg-gradient-to-br from-gray-800 to-gray-900",
          badge: "bg-gray-500/90",
          badgeIcon: Eye,
          badgeText: "",
        };
    }
  };

  const handleClick = () => {
    if (onClick) {
      onClick();
      return;
    }

    // Navigate based on media type
    const mediaType = movie.mediaType || "movie";
    switch (mediaType) {
      case "movie":
        router.push(`/movies/${movie.id}`);
        break;
      case "series":
        router.push(`/series/${movie.id}`);
        break;
      case "person":
        router.push(`/person/${movie.id}`);
        break;
      default:
        router.push(`/movies/${movie.id}`);
    }
  };

  const styles = getVariantStyles();
  const BadgeIcon = styles.badgeIcon;

  return (
    <div className={`cursor-pointer ${className}`} onClick={handleClick}>
      <div
        className={`relative aspect-[2/3] rounded-lg overflow-hidden ${styles.container}`}
      >
        <Image
          src={movie.cover || "/placeholder.svg"}
          alt={movie.title}
          fill
          className="object-cover"
        />
      </div>

      {/* Movie Info */}
      <div className="mt-2 sm:mt-3 text-center sm:text-left">
        <h4 className="text-base sm:text-sm md:text-lg font-medium leading-tight line-clamp-2 min-h-[2.5rem] flex items-center justify-center sm:justify-start text-center sm:text-left">
          {movie.title}
        </h4>
        <p className="text-sm sm:text-xs md:text-sm text-muted-foreground mt-1 sm:mt-1.5 text-center sm:text-left">
          {movie.year}
        </p>
      </div>
    </div>
  );
}

export default MovieCard;
