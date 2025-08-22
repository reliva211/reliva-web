"use client";

import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState, useEffect, useRef } from "react";
import {
  Plus,
  Search,
  X,
  Star,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Play,
  Clock,
  Heart,
  ThumbsUp,
  Edit,
  Eye,
  Calendar,
  Award,
  Film,
  Video,
  Bookmark,
  Share2,
} from "lucide-react";
import { useMovieProfile, type TMDBMovie } from "@/hooks/use-movie-profile";
import { useCurrentUser } from "@/hooks/use-current-user";

interface ProfileMovieSectionProps {
  userId?: string;
  readOnly?: boolean;
}

// Placeholder content for empty states - inspired by music section design
const PLACEHOLDER = {
  currentlyWatching: {
    title: "Add your current watch",
    subtitle: "Search for a movie you're watching",
    cover:
      "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=256&h=384&fit=crop&crop=center",
  },
  favoriteMovie: {
    title: "Add your favorite movie",
    subtitle: "Search for your all-time favorite",
    cover:
      "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=256&h=384&fit=crop&crop=center",
  },
  favoriteDirector: {
    name: "Add your favorite director",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=faces",
  },
  favoriteMovies: new Array(4).fill(0).map((_, i) => ({
    id: `fav-${i}`,
    cover:
      "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=160&h=240&fit=crop&crop=center",
  })),
  watchlist: new Array(4).fill(0).map((_, i) => ({
    id: `watch-${i}`,
    cover:
      "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=160&h=240&fit=crop&crop=center",
  })),
  recommendations: new Array(4).fill(0).map((_, i) => ({
    id: `rec-${i}`,
    cover:
      "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=160&h=240&fit=crop&crop=center",
  })),
  ratings: new Array(4).fill(0).map((_, i) => ({
    id: `rt-${i}`,
    cover:
      "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=160&h=240&fit=crop&crop=center",
  })),
};

// Helper function to clean up text content
const cleanTextContent = (text: string): string => {
  if (!text) return text;
  return text
    .replace(/\([^)]*\)/g, "") // Remove parentheses and their content
    .replace(/\[[^\]]*\]/g, "") // Remove square brackets and their content
    .replace(/\s+/g, " ") // Replace multiple spaces with single space
    .trim(); // Remove leading/trailing spaces
};

// Helper function to safely extract image URLs from various API response formats
const getImageUrl = (image: any): string => {
  try {
    if (typeof image === "string") {
      return image;
    }
    if (Array.isArray(image)) {
      // Handle array of image objects with quality and url properties
      const highQualityImage = image.find(
        (img) => img?.quality === "500x500" || img?.quality === "high"
      );
      const mediumQualityImage = image.find(
        (img) => img?.quality === "150x150" || img?.quality === "medium"
      );
      const anyImage = image.find((img) => img?.url);

      return (
        highQualityImage?.url || mediumQualityImage?.url || anyImage?.url || ""
      );
    }
    if (image && typeof image === "object") {
      // Handle single image object
      return image.url || image.src || "";
    }
    return "";
  } catch (error) {
    console.error("Error parsing image URL:", error);
    return "";
  }
};

// Helper function to safely get text content
const getTextContent = (text: any): string => {
  if (typeof text === "string") {
    return text;
  }
  if (text && typeof text === "object") {
    // If it's an object, try to extract a meaningful string
    return text.name || text.title || text.text || JSON.stringify(text);
  }
  return "";
};

// Helper function to truncate movie titles
const truncateTitle = (title: string, maxLength: number = 10): string => {
  if (!title) return "Unknown Movie";
  const cleanTitle = cleanTextContent(title);
  return cleanTitle.length > maxLength
    ? cleanTitle.substring(0, maxLength) + "..."
    : cleanTitle;
};

export default function ProfileMovieSection({
  userId,
  readOnly = false,
}: ProfileMovieSectionProps) {
  const { user } = useCurrentUser();
  const targetUserId = userId || user?.uid;
  const {
    movieProfile,
    loading,
    error,
    updateRecentlyWatched,
    updateFavoriteMovie,
    updateFavoriteDirector,
    addFavoriteMovie,
    removeFavoriteMovie,
    replaceFavoriteMovie,
    addToWatchlist,
    removeFromWatchlist,
    replaceWatchlistMovie,
    addRecommendation,
    removeRecommendation,
    replaceRecommendation,
    addRating,
    removeRating,
    replaceRating,
    searchMovie,
    searchDirector,
  } = useMovieProfile(targetUserId);

  // Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeSearchType, setActiveSearchType] = useState<
    | "recentlyWatched"
    | "favoriteDirector"
    | "favoriteMovie"
    | "favoriteMovies"
    | "watchlist"
    | "recommendation"
    | "rating"
    | null
  >(null);
  const [showSearchDialog, setShowSearchDialog] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hoveredRating, setHoveredRating] = useState<{
    movieId: string;
    rating: number;
  } | null>(null);
  const [editingItem, setEditingItem] = useState<any>(null);

  // Horizontal scroll functionality
  const scrollContainerRefs = {
    favoriteMovies: useRef<HTMLDivElement>(null),
    watchlist: useRef<HTMLDivElement>(null),
    recommendations: useRef<HTMLDivElement>(null),
    ratings: useRef<HTMLDivElement>(null),
  };

  // Recently watched navigation state
  const [currentRecentlyWatchedIndex, setCurrentRecentlyWatchedIndex] =
    useState(0);

  const scrollLeft = (containerRef: React.RefObject<HTMLDivElement | null>) => {
    if (containerRef.current) {
      const scrollDistance = Math.min(
        200,
        containerRef.current.clientWidth * 0.8
      );
      containerRef.current.scrollBy({
        left: -scrollDistance,
        behavior: "smooth",
      });
    }
  };

  const scrollRight = (
    containerRef: React.RefObject<HTMLDivElement | null>
  ) => {
    if (containerRef.current) {
      const scrollDistance = Math.min(
        200,
        containerRef.current.clientWidth * 0.8
      );
      containerRef.current.scrollBy({
        left: scrollDistance,
        behavior: "smooth",
      });
    }
  };

  // Rating functionality
  const handleRatingHover = (movieId: string, rating: number) => {
    setHoveredRating({ movieId, rating });
  };

  const handleRatingLeave = () => {
    setHoveredRating(null);
  };

  const handleRatingClick = async (movieId: string, rating: number) => {
    try {
      const movie = movieProfile.ratings.find(
        (r) => r.movie.id === movieId
      )?.movie;
      if (movie) {
        await addRating(movie, rating);
      }
    } catch (error) {
      console.error("Error updating rating:", error);
      alert("Failed to update rating. Please try again.");
    }
  };

  const renderInteractiveStars = (movieId: string, currentRating: number) => {
    const displayRating =
      hoveredRating?.movieId === movieId ? hoveredRating.rating : currentRating;

    return Array.from({ length: 5 }, (_, i) => {
      const starValue = i + 1;
      const isFullStar = displayRating >= starValue;

      return (
        <Star
          key={i}
          className={`h-4 w-4 transition-colors ${
            isFullStar ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
          } ${!readOnly ? "cursor-pointer" : ""}`}
          onMouseEnter={
            !readOnly ? () => handleRatingHover(movieId, starValue) : undefined
          }
          onMouseLeave={!readOnly ? handleRatingLeave : undefined}
          onClick={
            !readOnly ? () => handleRatingClick(movieId, starValue) : undefined
          }
        />
      );
    });
  };

  // Search functionality
  const handleSearch = async (
    query: string,
    searchType:
      | "recentlyWatched"
      | "favoriteDirector"
      | "favoriteMovie"
      | "favoriteMovies"
      | "watchlist"
      | "recommendation"
      | "rating"
  ) => {
    if (!query.trim()) return;

    setIsSearching(true);
    setSearchError(null);
    setActiveSearchType(searchType);

    try {
      let results;
      let isFallback = false;

      if (searchType === "favoriteDirector") {
        results = await searchDirector(query, 10);
      } else {
        results = await searchMovie(query, 10);
      }

      // Check if we're using fallback data
      if (
        results &&
        Array.isArray(results) &&
        results.length > 0 &&
        results[0].fallback
      ) {
        isFallback = true;
      }

      // Validate and sanitize search results
      const validatedResults = (results || []).map((item: any) => {
        const itemName = cleanTextContent(
          getTextContent(item.title || item.name)
        );
        const year = item.year || item.release_date?.split("-")[0] || "";

        return {
          id: item.id || `item-${Math.random()}`,
          title: itemName,
          name: itemName,
          year: year,
          cover: item.cover || item.image || item.poster_path,
          rating: item.rating || item.vote_average,
          overview: item.overview,
          release_date: item.release_date,
          vote_average: item.vote_average,
          vote_count: item.vote_count,
          genre_ids: item.genre_ids,
          genres: item.genres,
          director: item.director,
          cast: item.cast,
          type: item.type || "movie",
        };
      });

      setSearchResults(validatedResults);

      // Show fallback message if using mock data
      if (isFallback) {
        setSearchError(
          "Using demo data - TMDB API not configured. Add NEXT_PUBLIC_TMDB_API_KEY to your environment variables."
        );
      }
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
      setSearchError("Search failed. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectItem = async (
    item: any,
    searchType:
      | "recentlyWatched"
      | "favoriteDirector"
      | "favoriteMovie"
      | "favoriteMovies"
      | "watchlist"
      | "recommendation"
      | "rating"
  ) => {
    if (!item || !item.id) {
      console.error("Invalid item selected:", item);
      return;
    }

    try {
      console.log("Adding item:", item, "to section:", searchType);

      const formattedItem = {
        id: item.id || "",
        title: cleanTextContent(getTextContent(item.title || item.name)) || "",
        name: cleanTextContent(getTextContent(item.title || item.name)) || "",
        year: parseInt(
          item.year || item.release_date?.split("-")[0] || "0",
          10
        ),
        cover: item.cover || item.image || item.poster_path || "",
        rating: item.rating || item.vote_average || 0,
        overview: item.overview || "",
        release_date: item.release_date || "",
        vote_average: item.vote_average || 0,
        vote_count: item.vote_count || 0,
        genre_ids: Array.isArray(item.genre_ids) ? item.genre_ids : [],
        genres: Array.isArray(item.genres) ? item.genres : [],
        director: item.director || "",
        cast: Array.isArray(item.cast) ? item.cast : [],
        type: item.type || "movie",
      };

      console.log("Formatted item:", formattedItem);

      switch (searchType) {
        case "recentlyWatched":
          console.log("Updating recently watched");
          await updateRecentlyWatched(formattedItem);
          break;
        case "favoriteMovie":
          console.log("Updating favorite movie");
          await updateFavoriteMovie(formattedItem);
          break;
        case "favoriteMovies":
          if (editingItem) {
            // Replace the specific movie at its original position
            await replaceFavoriteMovie(editingItem.id, formattedItem);
          } else {
            // Add new movie
            await addFavoriteMovie(formattedItem);
          }
          break;
        case "watchlist":
          if (editingItem) {
            // Replace the specific movie at its original position
            await replaceWatchlistMovie(editingItem.id, formattedItem);
          } else {
            // Add new movie
            await addToWatchlist(formattedItem);
          }
          break;
        case "recommendation":
          if (editingItem) {
            // Replace the specific recommendation at its original position
            await replaceRecommendation(editingItem.id, formattedItem);
          } else {
            // Add new recommendation
            await addRecommendation(formattedItem);
          }
          break;
        case "rating":
          if (editingItem) {
            // Replace the specific rating at its original position
            await replaceRating(editingItem.id, formattedItem, 5); // Default 5-star rating
          } else {
            // Add new rating
            await addRating(formattedItem, 5); // Default 5-star rating
          }
          break;
        case "favoriteDirector":
          console.log("Updating favorite director");
          await updateFavoriteDirector({
            id: item.id,
            name: item.name,
            image: item.image || item.cover,
          });
          break;
      }

      console.log("Item added successfully");
      setShowSearchDialog(false);
      setSearchQuery("");
      setSearchResults([]);
      setEditingItem(null); // Clear the editing item after operation
    } catch (error) {
      console.error("Error adding item:", error);
      alert(
        `Failed to add item: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  const handleRemoveItem = async (
    type: "favoriteMovies" | "watchlist" | "recommendation" | "rating",
    id: string
  ) => {
    if (!id) {
      console.error("Invalid ID for removal:", id);
      return;
    }

    try {
      switch (type) {
        case "favoriteMovies":
          await removeFavoriteMovie(id);
          break;
        case "watchlist":
          await removeFromWatchlist(id);
          break;
        case "recommendation":
          await removeRecommendation(id);
          break;
        case "rating":
          await removeRating(id);
          break;
      }
    } catch (error) {
      console.error("Error removing item:", error);
      alert("Failed to remove item. Please try again.");
    }
  };

  const openSearchDialog = (searchType: any, itemToReplace?: any) => {
    setActiveSearchType(searchType);
    setShowSearchDialog(true);
    setSearchQuery("");
    setSearchResults([]);
    setSearchError(null);

    // Store the item to replace if provided
    if (itemToReplace) {
      setEditingItem(itemToReplace);
    } else {
      setEditingItem(null);
    }
  };

  // Handle trailer click
  const handleTrailerClick = (movie: TMDBMovie) => {
    const movieTitle = getTextContent(movie.title);

    // Try to find trailer on YouTube
    const searchQuery = `${movieTitle} official trailer`;
    const youtubeUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(
      searchQuery
    )}`;

    // Open in new tab
    window.open(youtubeUrl, "_blank");
  };

  // Handle like click
  const handleLikeClick = (movie: TMDBMovie) => {
    // Add to favorites if not already there
    if (!safeMovieProfile.favoriteMovies?.find((m) => m.id === movie.id)) {
      addFavoriteMovie(movie);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="space-y-5 max-w-5xl mx-auto">
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-muted rounded mb-2"></div>
              <div className="h-32 bg-muted rounded"></div>
            </div>
          ))}
        </div>
        <div className="space-y-4">
          <div className="h-4 bg-muted rounded w-1/3"></div>
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-square bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="space-y-5 max-w-5xl mx-auto">
        <div className="text-center p-8">
          <div className="text-red-500 mb-4">
            Error loading movie profile: {error}
          </div>
          <Button onClick={() => window.location.reload()} variant="outline">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // Show setup instructions if no TMDB API key
  if (!process.env.NEXT_PUBLIC_TMDB_API_KEY) {
    return (
      <div className="space-y-5 max-w-5xl mx-auto">
        <div className="text-center p-8">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-4">
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">
              TMDB API Key Required
            </h3>
            <p className="text-yellow-700 mb-4">
              To use the movie profile features, you need to configure the TMDB
              API key.
            </p>
            <div className="text-left bg-white p-4 rounded border">
              <p className="text-sm text-gray-700 mb-2">
                <strong>Steps to set up:</strong>
              </p>
              <ol className="text-sm text-gray-600 list-decimal list-inside space-y-1">
                <li>
                  Get a free API key from{" "}
                  <a
                    href="https://www.themoviedb.org/settings/api"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    TMDB
                  </a>
                </li>
                <li>
                  Create a{" "}
                  <code className="bg-gray-100 px-1 rounded">.env.local</code>{" "}
                  file in your project root
                </li>
                <li>
                  Add:{" "}
                  <code className="bg-gray-100 px-1 rounded">
                    NEXT_PUBLIC_TMDB_API_KEY=your_api_key_here
                  </code>
                </li>
                <li>Restart your development server</li>
              </ol>
            </div>
          </div>
          <Button onClick={() => window.location.reload()} variant="outline">
            Retry After Setup
          </Button>
        </div>
      </div>
    );
  }

  // Ensure movieProfile exists
  const safeMovieProfile = movieProfile || {
    recentlyWatched: [],
    favoriteMovie: null,
    favoriteDirector: null,
    favoriteMovies: [],
    watchlist: [],
    recommendations: [],
    ratings: [],
  };

  // Create a list of recently watched movies
  const recentlyWatchedList = safeMovieProfile.recentlyWatched || [];

  // Navigation functions for recently watched
  const navigateRecentlyWatchedLeft = () => {
    if (recentlyWatchedList.length > 1) {
      setCurrentRecentlyWatchedIndex((prev) =>
        prev === recentlyWatchedList.length - 1 ? 0 : prev + 1
      );
    }
  };

  const navigateRecentlyWatchedRight = () => {
    if (recentlyWatchedList.length > 1) {
      setCurrentRecentlyWatchedIndex((prev) =>
        prev === 0 ? recentlyWatchedList.length - 1 : prev - 1
      );
    }
  };

  // Get current recently watched movie
  const currentRecentlyWatched =
    recentlyWatchedList[currentRecentlyWatchedIndex] || null;

  // Limit items to specified limits per section
  const limitedFavoriteMovies =
    safeMovieProfile.favoriteMovies?.slice(0, 5) || [];
  const limitedWatchlist = safeMovieProfile.watchlist || [];
  const limitedRecommendations =
    safeMovieProfile.recommendations?.slice(0, 20) || [];
  const limitedRatings = safeMovieProfile.ratings || [];

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Recently watched section - horizontal layout */}
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-start mb-4">
          <p className="text-sm font-medium text-muted-foreground">
            recently watched
          </p>
        </div>

        <div className="relative">
          {currentRecentlyWatched ? (
            <div className="flex gap-6 items-start">
              {/* Movie poster */}
              <div className="relative group flex-shrink-0">
                <div className="w-48 h-72 bg-muted rounded-md overflow-hidden">
                  <Link href={`/movies/${currentRecentlyWatched.id}`}>
                    <Image
                      src={
                        currentRecentlyWatched.cover ||
                        PLACEHOLDER.currentlyWatching.cover
                      }
                      alt={
                        getTextContent(currentRecentlyWatched.title) || "Movie"
                      }
                      width={192}
                      height={288}
                      className="w-full h-full object-cover cursor-pointer"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = PLACEHOLDER.currentlyWatching.cover;
                      }}
                    />
                  </Link>
                  {!readOnly && (
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-md flex items-center justify-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 bg-white/20 hover:bg-white/30 text-white"
                        onClick={() => openSearchDialog("recentlyWatched")}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Content section */}
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {getTextContent(currentRecentlyWatched.title) ||
                    "Unknown Movie"}
                </h3>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                  {currentRecentlyWatched.overview ||
                    "No description available"}
                </p>

                {/* Action buttons and navigation */}
                <div className="flex items-center gap-4">
                  {/* Navigation dots */}
                  {recentlyWatchedList.length > 1 && (
                    <div className="flex gap-1">
                      {recentlyWatchedList.map((_, index) => (
                        <div
                          key={index}
                          className={`w-2 h-2 rounded-full transition-colors ${
                            index === currentRecentlyWatchedIndex
                              ? "bg-primary"
                              : "bg-muted-foreground/30"
                          }`}
                        />
                      ))}
                    </div>
                  )}

                  {/* Trailer button */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-4"
                    onClick={() => handleTrailerClick(currentRecentlyWatched)}
                  >
                    <Play className="h-3 w-3 mr-1" />
                    trailer
                  </Button>
                </div>
              </div>

              {/* Navigation arrow */}
              {recentlyWatchedList.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-10 w-10 p-0 bg-black/80 hover:bg-black backdrop-blur-md border border-white/10 rounded-full flex-shrink-0 shadow-2xl hover:scale-110 transition-all duration-300 z-30"
                  onClick={navigateRecentlyWatchedRight}
                >
                  <ChevronRight className="h-5 w-5 text-white" />
                </Button>
              )}
            </div>
          ) : (
            <div className="flex gap-6 items-start">
              {/* Empty state poster */}
              <div className="w-48 h-72 bg-muted rounded-md border border-border/30 flex items-center justify-center flex-shrink-0">
                <div className="text-center">
                  <Video className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground/50">
                    Add Current Watch
                  </p>
                </div>
              </div>

              {/* Empty state content */}
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-semibold text-muted-foreground/50 mb-2">
                  Movie Title
                </h3>
                <p className="text-sm text-muted-foreground/50 mb-4">
                  Movie description
                </p>

                <div className="flex items-center gap-4">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-muted-foreground/30 rounded-full"></div>
                    <div className="w-2 h-2 bg-muted-foreground/30 rounded-full"></div>
                    <div className="w-2 h-2 bg-muted-foreground/30 rounded-full"></div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-4"
                    disabled
                  >
                    <Play className="h-3 w-3 mr-1" />
                    trailer
                  </Button>
                </div>
              </div>

              {/* Navigation arrow */}
              <Button
                variant="ghost"
                size="sm"
                className="h-10 w-10 p-0 bg-black/80 hover:bg-black backdrop-blur-md border border-white/10 rounded-full flex-shrink-0 shadow-2xl hover:scale-110 transition-all duration-300 z-30"
                disabled
              >
                <ChevronRight className="h-5 w-5 text-white/50" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Bottom row - favorite movies aligned with top grid */}
      <div className="grid grid-cols-3 gap-4 sm:gap-6 lg:gap-8 max-w-3xl mx-auto">
        {/* favorite movies - takes first column */}
        <div className="col-span-3">
          <div className="flex items-center justify-start mb-4">
            <p className="text-sm font-medium text-muted-foreground">
              favorite movies
            </p>
          </div>
          <div className="relative">
            <div
              ref={scrollContainerRefs.favoriteMovies}
              className="flex justify-start gap-6 overflow-hidden"
            >
              {limitedFavoriteMovies.length > 0 ? (
                <>
                  {limitedFavoriteMovies.map((movie, idx) => (
                    <div
                      key={movie.id || idx}
                      className="relative group flex-shrink-0"
                    >
                      <div className="aspect-[2/3] w-32 bg-muted rounded-md overflow-hidden">
                        <Link href={`/movies/${movie.id}`}>
                          <Image
                            src={
                              movie.cover || PLACEHOLDER.favoriteMovies[0].cover
                            }
                            alt={movie.title || "Movie"}
                            width={128}
                            height={192}
                            className="w-full h-full object-cover cursor-pointer"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = PLACEHOLDER.favoriteMovies[0].cover;
                            }}
                          />
                        </Link>
                        {!readOnly && (
                          <div className="absolute top-2 right-2 flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 bg-black/50 hover:bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() =>
                                openSearchDialog("favoriteMovies", movie)
                              }
                              title="Replace movie"
                            >
                              <Edit className="h-3 w-3 text-white" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 bg-red-600/80 hover:bg-red-700/90 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() =>
                                handleRemoveItem("favoriteMovies", movie.id)
                              }
                              title="Delete movie"
                            >
                              <Trash2 className="h-3 w-3 text-white" />
                            </Button>
                          </div>
                        )}
                      </div>
                      {/* Movie name and year display */}
                      <div className="mt-3 text-center w-full">
                        <p className="text-base font-semibold leading-tight px-2 truncate min-h-[1.5rem] flex items-center justify-center">
                          {truncateTitle(getTextContent(movie.title))}
                        </p>
                        <p className="text-sm text-muted-foreground leading-tight mt-0.5 px-2">
                          {movie.year || "Unknown Year"}
                        </p>
                      </div>
                    </div>
                  ))}

                  {/* Add button - only show when less than 5 items */}
                  {limitedFavoriteMovies.length < 5 && (
                    <div className="flex-shrink-0">
                      <div className="aspect-[2/3] w-32 bg-transparent rounded-md border-2 border-gray-600 flex items-center justify-center overflow-visible">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-12 w-12 p-0 bg-black/70 hover:bg-black/90 text-white rounded-full border-2 border-white/20 shadow-lg"
                          onClick={() => openSearchDialog("favoriteMovies")}
                        >
                          <Plus className="h-6 w-6" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                // Show single Add screen when empty
                <div className="flex flex-col items-center justify-center min-h-[200px]">
                  <div className="aspect-[2/3] w-32 bg-transparent rounded-md border-2 border-gray-600 flex flex-col items-center justify-center mb-3">
                    <p className="text-sm text-gray-400 mb-1 text-center">
                      Add
                    </p>
                    <p className="text-xs text-gray-500 text-center">
                      No favorite movies
                    </p>
                  </div>
                  {!readOnly && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => openSearchDialog("favoriteMovies")}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add Movie
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* watchlist */}
      <div className="mt-12 max-w-3xl mx-auto">
        <div className="flex items-center justify-start mb-4">
          <p className="text-sm font-medium text-muted-foreground">watchlist</p>
        </div>
        <div className="relative">
          <div
            ref={scrollContainerRefs.watchlist}
            className="flex justify-start gap-6 overflow-hidden"
          >
            {limitedWatchlist.length > 0 ? (
              <>
                {limitedWatchlist.map((movie, idx) => (
                  <div
                    key={movie.id || idx}
                    className="relative group flex-shrink-0"
                  >
                    <div className="aspect-[2/3] w-32 bg-muted rounded-md overflow-hidden">
                      <Link href={`/movies/${movie.id}`}>
                        <Image
                          src={movie.cover || PLACEHOLDER.watchlist[0].cover}
                          alt={movie.title || "Movie"}
                          width={128}
                          height={192}
                          className="w-full h-full object-cover cursor-pointer"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = PLACEHOLDER.watchlist[0].cover;
                          }}
                        />
                      </Link>
                      {!readOnly && (
                        <div className="absolute top-2 right-2 flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 bg-black/50 hover:bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => openSearchDialog("watchlist", movie)}
                            title="Replace movie"
                          >
                            <Edit className="h-3 w-3 text-white" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 bg-red-600/80 hover:bg-red-700/90 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() =>
                              handleRemoveItem("watchlist", movie.id)
                            }
                            title="Delete movie"
                          >
                            <Trash2 className="h-3 w-3 text-white" />
                          </Button>
                        </div>
                      )}
                    </div>
                    {/* Movie name and year display */}
                    <div className="mt-3 text-center w-full">
                      <p className="text-base font-semibold leading-tight px-2 truncate min-h-[1.5rem] flex items-center justify-center">
                        {truncateTitle(getTextContent(movie.title))}
                      </p>
                      <p className="text-sm text-muted-foreground leading-tight mt-0.5 px-2">
                        {movie.year || "Unknown Year"}
                      </p>
                    </div>
                  </div>
                ))}

                {/* Add button for subsequent items - always show when items exist */}
                <div className="flex-shrink-0">
                  <div className="aspect-[2/3] w-32 bg-transparent rounded-md border-2 border-gray-600 flex items-center justify-center overflow-visible">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-12 w-12 p-0 bg-black/70 hover:bg-black/90 text-white rounded-full border-2 border-white/20 shadow-lg"
                      onClick={() => openSearchDialog("watchlist")}
                    >
                      <Plus className="h-6 w-6" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              // Show single Add screen when empty
              <div className="flex flex-col items-center justify-center min-h-[200px]">
                <div className="aspect-[2/3] w-32 bg-transparent rounded-md border-2 border-gray-600 flex flex-col items-center justify-center mb-3">
                  <p className="text-xs text-gray-500 text-center">
                    No watchlist movies
                  </p>
                </div>
                {!readOnly && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => openSearchDialog("watchlist")}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Movie
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Navigation arrows for watchlist */}
          {limitedWatchlist.length > 0 && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="absolute left-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 bg-black/80 hover:bg-black backdrop-blur-md border border-white/10 text-white rounded-full shadow-2xl hover:scale-110 transition-all duration-300 z-30"
                onClick={() => scrollLeft(scrollContainerRefs.watchlist)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 bg-black/80 hover:bg-black backdrop-blur-md border border-white/10 text-white rounded-full shadow-2xl hover:scale-110 transition-all duration-300 z-30"
                onClick={() => scrollRight(scrollContainerRefs.watchlist)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* recommendations */}
      <div className="mt-12 max-w-3xl mx-auto">
        <div className="flex items-center justify-start mb-4">
          <p className="text-sm font-medium text-muted-foreground">
            recommendations
          </p>
        </div>
        <div className="relative">
          <div
            ref={scrollContainerRefs.recommendations}
            className="flex justify-start gap-6 overflow-hidden"
          >
            {limitedRecommendations.length > 0 ? (
              <>
                {limitedRecommendations.map((movie, idx) => (
                  <div
                    key={movie.id || idx}
                    className="relative group flex-shrink-0"
                  >
                    <div className="aspect-[2/3] w-32 bg-muted rounded-md overflow-hidden">
                      <Link href={`/movies/${movie.id}`}>
                        <Image
                          src={
                            movie.cover || PLACEHOLDER.recommendations[0].cover
                          }
                          alt={movie.title || "Movie"}
                          width={128}
                          height={192}
                          className="w-full h-full object-cover cursor-pointer"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = PLACEHOLDER.recommendations[0].cover;
                          }}
                        />
                      </Link>
                      {!readOnly && (
                        <div className="absolute top-2 right-2 flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 bg-black/50 hover:bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() =>
                              openSearchDialog("recommendation", movie)
                            }
                            title="Replace recommendation"
                          >
                            <Edit className="h-3 w-3 text-white" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 bg-red-600/80 hover:bg-red-700/90 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() =>
                              handleRemoveItem("recommendation", movie.id)
                            }
                            title="Delete recommendation"
                          >
                            <Trash2 className="h-3 w-3 text-white" />
                          </Button>
                        </div>
                      )}
                    </div>
                    {/* Movie name and year display */}
                    <div className="mt-3 text-center w-full">
                      <p className="text-base font-semibold leading-tight px-2 truncate min-h-[1.5rem] flex items-center justify-center">
                        {truncateTitle(getTextContent(movie.title))}
                      </p>
                      <p className="text-sm text-muted-foreground leading-tight mt-0.5 px-2">
                        {movie.year || "Unknown Year"}
                      </p>
                    </div>
                  </div>
                ))}

                {/* Add button for subsequent items - always show when items exist */}
                <div className="flex-shrink-0">
                  <div className="aspect-[2/3] w-32 bg-transparent rounded-md border-2 border-gray-600 flex items-center justify-center overflow-visible">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-12 w-12 p-0 bg-black/70 hover:bg-black/90 text-white rounded-full border-2 border-white/20 shadow-lg"
                      onClick={() => openSearchDialog("recommendation")}
                    >
                      <Plus className="h-6 w-6" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              // Show single Add screen when empty
              <div className="flex flex-col items-center justify-center min-h-[200px]">
                <div className="aspect-[2/3] w-32 bg-transparent rounded-md border-2 border-gray-600 flex flex-col items-center justify-center mb-3">
                  <p className="text-xs text-gray-500 text-center">
                    No recommendations
                  </p>
                </div>
                {!readOnly && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => openSearchDialog("recommendation")}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Recommendation
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Navigation arrows for recommendations */}
          {limitedRecommendations.length > 0 && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="absolute left-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 bg-black/80 hover:bg-black backdrop-blur-md border border-white/10 text-white rounded-full shadow-2xl hover:scale-110 transition-all duration-300 z-30"
                onClick={() => scrollLeft(scrollContainerRefs.recommendations)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 bg-black/80 hover:bg-black backdrop-blur-md border border-white/10 text-white rounded-full shadow-2xl hover:scale-110 transition-all duration-300 z-30"
                onClick={() => scrollRight(scrollContainerRefs.recommendations)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* ratings */}
      <div className="mt-12 max-w-3xl mx-auto">
        <div className="flex items-center justify-start mb-4">
          <p className="text-sm font-medium text-muted-foreground">ratings</p>
        </div>
        <div className="relative">
          <div
            ref={scrollContainerRefs.ratings}
            className="flex justify-start gap-6 overflow-hidden"
          >
            {limitedRatings.length > 0 ? (
              <>
                {limitedRatings.map((rating, idx) => (
                  <div
                    key={`rating-${rating.movie.id}-${idx}`}
                    className="relative group flex-shrink-0"
                  >
                    <div className="aspect-[2/3] w-32 bg-muted rounded-md overflow-hidden">
                      <Link href={`/movies/${rating.movie.id}`}>
                        <Image
                          src={
                            rating.movie.cover || PLACEHOLDER.ratings[0].cover
                          }
                          alt={rating.movie.title || "Movie"}
                          width={128}
                          height={192}
                          className="w-full h-full object-cover cursor-pointer"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = PLACEHOLDER.ratings[0].cover;
                          }}
                        />
                      </Link>
                      {!readOnly && (
                        <div className="absolute top-2 right-2 flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 bg-black/50 hover:bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() =>
                              openSearchDialog("rating", rating.movie)
                            }
                            title="Replace rating"
                          >
                            <Edit className="h-3 w-3 text-white" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 bg-red-600/80 hover:bg-red-700/90 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() =>
                              handleRemoveItem("rating", rating.movie.id)
                            }
                            title="Delete rating"
                          >
                            <Trash2 className="h-3 w-3 text-white" />
                          </Button>
                        </div>
                      )}
                    </div>
                    {/* Rating stars - above the movie name */}
                    <div className="mt-3 flex justify-center gap-1">
                      {renderInteractiveStars(rating.movie.id, rating.rating)}
                    </div>
                    {/* Movie name and year display - below the rating */}
                    <div className="mt-2 text-center w-full">
                      <p className="text-sm font-semibold leading-tight px-2 truncate min-h-[1.5rem] flex items-center justify-center">
                        {truncateTitle(getTextContent(rating.movie.title))}
                      </p>
                      <p className="text-xs text-muted-foreground leading-tight mt-0.5 px-2">
                        {rating.movie.year || "Unknown Year"}
                      </p>
                    </div>
                  </div>
                ))}

                {/* Add button for subsequent items - always show when items exist */}
                <div className="flex-shrink-0">
                  <div className="aspect-[2/3] w-32 bg-transparent rounded-md border-2 border-gray-600 flex items-center justify-center overflow-visible">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-12 w-12 p-0 bg-black/70 hover:bg-black/90 text-white rounded-full border-2 border-white/20 shadow-lg"
                      onClick={() => openSearchDialog("rating")}
                    >
                      <Plus className="h-6 w-6" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              // Show single Add screen when empty
              <div className="flex flex-col items-center justify-center min-h-[200px]">
                <div className="aspect-[2/3] w-32 bg-transparent rounded-md border-2 border-gray-600 flex flex-col items-center justify-center mb-3">
                  <p className="text-xs text-gray-500 text-center">
                    No rated movies
                  </p>
                </div>
                {!readOnly && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => openSearchDialog("rating")}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Rating
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Navigation arrows for ratings */}
          {limitedRatings.length > 0 && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="absolute left-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 bg-black/80 hover:bg-black backdrop-blur-md border border-white/10 text-white rounded-full shadow-2xl hover:scale-110 transition-all duration-300 z-30"
                onClick={() => scrollLeft(scrollContainerRefs.ratings)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 bg-black/80 hover:bg-black backdrop-blur-md border border-white/10 text-white rounded-full shadow-2xl hover:scale-110 transition-all duration-300 z-30"
                onClick={() => scrollRight(scrollContainerRefs.ratings)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Search Dialog */}
      <Dialog open={showSearchDialog} onOpenChange={setShowSearchDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              Search{" "}
              {activeSearchType === "favoriteDirector"
                ? "Directors"
                : activeSearchType === "recentlyWatched"
                ? "Recently Watched"
                : activeSearchType === "favoriteMovie"
                ? "Favorite Movie"
                : activeSearchType === "favoriteMovies"
                ? "Favorite Movies"
                : activeSearchType === "watchlist"
                ? "Watchlist"
                : activeSearchType === "recommendation"
                ? "Recommendations"
                : activeSearchType === "rating"
                ? "Ratings"
                : "Movies"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder={`Search ${
                    activeSearchType === "favoriteDirector"
                      ? "directors"
                      : activeSearchType === "recentlyWatched"
                      ? "movies for recently watched"
                      : activeSearchType === "favoriteMovie"
                      ? "movies for favorite movie"
                      : activeSearchType === "favoriteMovies"
                      ? "movies for favorites"
                      : activeSearchType === "watchlist"
                      ? "movies for watchlist"
                      : activeSearchType === "recommendation"
                      ? "movies for recommendations"
                      : activeSearchType === "rating"
                      ? "movies for ratings"
                      : "movies"
                  }...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      handleSearch(searchQuery, activeSearchType!);
                    }
                  }}
                  className="pl-10"
                />
              </div>
              <Button
                onClick={() => handleSearch(searchQuery, activeSearchType!)}
                disabled={isSearching || !searchQuery.trim()}
              >
                {isSearching ? "Searching..." : "Search"}
              </Button>
            </div>

            {searchError && (
              <div className="text-red-500 text-sm text-center">
                {searchError}
              </div>
            )}

            {searchResults.length > 0 && (
              <div className="max-h-60 overflow-y-auto space-y-2">
                {searchResults.map((item, index) => (
                  <div
                    key={item.id || index}
                    className="flex items-center gap-3 p-2 rounded-md hover:bg-muted cursor-pointer"
                    onClick={() => handleSelectItem(item, activeSearchType!)}
                  >
                    <div className="w-12 h-16 rounded-md overflow-hidden flex-shrink-0">
                      <Image
                        src={item.cover || "/placeholder.svg"}
                        alt={getTextContent(item.title || item.name) || "Movie"}
                        width={48}
                        height={64}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = "/placeholder.svg";
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-semibold truncate">
                        {cleanTextContent(
                          getTextContent(item.title || item.name)
                        ) || "Unknown"}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        {item.year || "Unknown Year"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
