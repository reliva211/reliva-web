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
} from "lucide-react";
import { useMovieProfile, type TMDBMovie } from "@/hooks/use-movie-profile";
import { useCurrentUser } from "@/hooks/use-current-user";

interface ProfileMovieSectionProps {
  userId?: string;
  readOnly?: boolean;
}

// No placeholder data - only show actual content

// Helper function to clean up text content
const cleanTextContent = (text: string): string => {
  if (!text) return text;
  return text
    .replace(/\([^)]*\)/g, "") // Remove parentheses and their content
    .replace(/\[[^\]]*\]/g, "") // Remove square brackets and their content
    .replace(/\s+/g, " ") // Replace multiple spaces with single space
    .trim(); // Remove leading/trailing spaces
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
    addToWatchlist,
    removeFromWatchlist,
    addRecommendation,
    removeRecommendation,
    addRating,
    removeRating,
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

  // Scroll to end when new items are added
  useEffect(() => {
    const scrollToEnd = (
      containerRef: React.RefObject<HTMLDivElement | null>
    ) => {
      if (containerRef.current) {
        containerRef.current.scrollTo({
          left: containerRef.current.scrollWidth,
          behavior: "smooth",
        });
      }
    };

    // Only scroll if we have items and the component is mounted
    if (movieProfile) {
      if (movieProfile.favoriteMovies?.length > 0) {
        scrollToEnd(scrollContainerRefs.favoriteMovies);
      }
      if (movieProfile.watchlist?.length > 0) {
        scrollToEnd(scrollContainerRefs.watchlist);
      }
      if (movieProfile.recommendations?.length > 0) {
        scrollToEnd(scrollContainerRefs.recommendations);
      }
      if (movieProfile.ratings?.length > 0) {
        scrollToEnd(scrollContainerRefs.ratings);
      }
    }
  }, [
    movieProfile?.favoriteMovies?.length,
    movieProfile?.watchlist?.length,
    movieProfile?.recommendations?.length,
    movieProfile?.ratings?.length,
  ]);

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
          console.log("Adding to favorite movies");
          await addFavoriteMovie(formattedItem);
          break;
        case "watchlist":
          console.log("Adding to watchlist");
          await addToWatchlist(formattedItem);
          break;
        case "recommendation":
          console.log("Adding to recommendations");
          await addRecommendation(formattedItem);
          break;
        case "rating":
          console.log("Adding to ratings");
          await addRating(formattedItem, 5); // Default 5-star rating
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

  const openSearchDialog = (searchType: any) => {
    setActiveSearchType(searchType);
    setShowSearchDialog(true);
    setSearchQuery("");
    setSearchResults([]);
    setSearchError(null);
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
    <div className="space-y-0 max-w-3xl mx-auto">
      <div>
        {/* currently watching - simplified format */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-muted-foreground">
              currently watching
            </p>
            {!readOnly && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-muted"
                onClick={() => openSearchDialog("recentlyWatched")}
              >
                <Plus className="h-3 w-3" />
              </Button>
            )}
          </div>
          {currentRecentlyWatched ? (
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 p-0 bg-black/50 hover:bg-black/70 text-white rounded-full"
                onClick={navigateRecentlyWatchedLeft}
                disabled={recentlyWatchedList.length <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex gap-4 px-8">
                <div className="aspect-[2/3] w-32 bg-muted rounded-md overflow-hidden flex-shrink-0">
                  <Image
                    src={currentRecentlyWatched.cover || "/placeholder.svg"}
                    alt={
                      getTextContent(currentRecentlyWatched.title) || "Movie"
                    }
                    width={128}
                    height={192}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "/placeholder.svg";
                    }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold leading-tight mb-2">
                    {getTextContent(currentRecentlyWatched.title) ||
                      "Unknown Movie"}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-tight mb-4">
                    {currentRecentlyWatched.overview ||
                      "No description available"}
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1">
                      {recentlyWatchedList.map((_, index) => (
                        <div
                          key={index}
                          className={`w-2 h-2 rounded-full ${
                            index === currentRecentlyWatchedIndex
                              ? "bg-muted-foreground"
                              : "bg-muted-foreground/30"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 hover:bg-muted"
                      onClick={() => handleLikeClick(currentRecentlyWatched)}
                    >
                      <Heart className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs px-3"
                      onClick={() => handleTrailerClick(currentRecentlyWatched)}
                    >
                      trailer
                    </Button>
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 p-0 bg-black/50 hover:bg-black/70 text-white rounded-full"
                onClick={navigateRecentlyWatchedRight}
                disabled={recentlyWatchedList.length <= 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex gap-4">
              <div className="aspect-[2/3] w-32 bg-muted rounded-md flex items-center justify-center flex-shrink-0">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-2">No movie</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 text-xs"
                    onClick={() => openSearchDialog("recentlyWatched")}
                  >
                    Add
                  </Button>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold leading-tight mb-2">
                  No currently watching
                </h3>
                <p className="text-sm text-muted-foreground leading-tight mb-4">
                  Add a movie you're currently watching
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-muted-foreground rounded-full"></div>
                    <div className="w-2 h-2 bg-muted-foreground/30 rounded-full"></div>
                    <div className="w-2 h-2 bg-muted-foreground/30 rounded-full"></div>
                  </div>
                </div>
                <div className="mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs px-3"
                    disabled
                  >
                    trailer
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* favorite movies */}
      <div className="mt-2">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-muted-foreground">favorite</p>
          {!readOnly && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-muted"
              onClick={() => openSearchDialog("favoriteMovies")}
            >
              <Plus className="h-3 w-3" />
            </Button>
          )}
        </div>
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 p-0 bg-black/50 hover:bg-black/70 text-white rounded-full"
            onClick={() => scrollLeft(scrollContainerRefs.favoriteMovies)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div
            ref={scrollContainerRefs.favoriteMovies}
            className="flex gap-4 overflow-x-auto scrollbar-hide"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {limitedFavoriteMovies.length > 0 ? (
              limitedFavoriteMovies.map((movie, idx) => (
                <div
                  key={movie.id || idx}
                  className="relative group flex-shrink-0 w-32"
                >
                  <div className="aspect-[2/3] w-full bg-muted rounded-md overflow-hidden">
                    <Image
                      src={movie.cover || "/placeholder.svg"}
                      alt={movie.title || "Movie"}
                      width={128}
                      height={192}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "/placeholder.svg";
                      }}
                    />
                    {!readOnly && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-1 right-1 h-6 w-6 p-0 bg-black/50 hover:bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() =>
                          handleRemoveItem("favoriteMovies", movie.id)
                        }
                      >
                        <X className="h-3 w-3 text-white" />
                      </Button>
                    )}
                  </div>
                  <div className="mt-2 text-center">
                    <p className="text-sm font-semibold leading-tight">
                      {getTextContent(movie.title) || "Unknown Movie"}
                    </p>
                    <p className="text-xs text-muted-foreground leading-tight mt-1">
                      {movie.year || "Unknown Year"}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              // Show single Add screen when empty
              <div className="flex-shrink-0 w-32">
                <div className="aspect-[2/3] w-full bg-black/20 rounded-md border border-border/30 flex items-center justify-center">
                  <div className="text-center flex items-center justify-center h-full">
                    <p className="text-sm text-muted-foreground/50">Add</p>
                  </div>
                </div>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 p-0 bg-black/50 hover:bg-black/70 text-white rounded-full"
            onClick={() => scrollRight(scrollContainerRefs.favoriteMovies)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* watchlist */}
      <div className="mt-2">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-muted-foreground">watchlist</p>
          {!readOnly && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-muted"
              onClick={() => openSearchDialog("watchlist")}
            >
              <Plus className="h-3 w-3" />
            </Button>
          )}
        </div>
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 p-0 bg-black/50 hover:bg-black/70 text-white rounded-full"
            onClick={() => scrollLeft(scrollContainerRefs.watchlist)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div
            ref={scrollContainerRefs.watchlist}
            className="flex gap-4 overflow-x-auto scrollbar-hide"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {limitedWatchlist.length > 0 ? (
              limitedWatchlist.map((movie, idx) => (
                <div
                  key={movie.id || idx}
                  className="relative group flex-shrink-0 w-32"
                >
                  <div className="aspect-[2/3] w-full bg-muted rounded-md overflow-hidden">
                    <Image
                      src={movie.cover || "/placeholder.svg"}
                      alt={movie.title || "Movie"}
                      width={128}
                      height={192}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "/placeholder.svg";
                      }}
                    />
                    {!readOnly && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-1 right-1 h-6 w-6 p-0 bg-black/50 hover:bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleRemoveItem("watchlist", movie.id)}
                      >
                        <X className="h-3 w-3 text-white" />
                      </Button>
                    )}
                  </div>
                  <div className="mt-2 text-center">
                    <p className="text-sm font-semibold leading-tight">
                      {getTextContent(movie.title) || "Unknown Movie"}
                    </p>
                    <p className="text-xs text-muted-foreground leading-tight mt-1">
                      {movie.year || "Unknown Year"}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              // Show placeholder items when empty
              <div className="flex-shrink-0 w-32">
                <div className="aspect-[2/3] w-full bg-black/20 rounded-md border border-border/30 flex items-center justify-center">
                  <div className="text-center flex items-center justify-center h-full">
                    <p className="text-sm text-muted-foreground/50">Add</p>
                  </div>
                </div>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 p-0 bg-black/50 hover:bg-black/70 text-white rounded-full"
            onClick={() => scrollRight(scrollContainerRefs.watchlist)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* recommendations */}
      <div className="mt-2">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-muted-foreground">
            recommendation
          </p>
          {!readOnly && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-muted"
              onClick={() => openSearchDialog("recommendation")}
            >
              <Plus className="h-3 w-3" />
            </Button>
          )}
        </div>
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 p-0 bg-black/50 hover:bg-black/70 text-white rounded-full"
            onClick={() => scrollLeft(scrollContainerRefs.recommendations)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div
            ref={scrollContainerRefs.recommendations}
            className="flex gap-4 overflow-x-auto scrollbar-hide"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {limitedRecommendations.length > 0 ? (
              limitedRecommendations.map((movie, idx) => (
                <div
                  key={movie.id || idx}
                  className="relative flex-shrink-0 w-32"
                >
                  <div className="aspect-[2/3] w-full bg-muted rounded-md overflow-hidden">
                    <Link href={`/movies/${movie.id}`}>
                      <Image
                        src={movie.cover || "/placeholder.svg"}
                        alt={movie.title || "Movie"}
                        width={128}
                        height={192}
                        className="w-full h-full object-cover cursor-pointer"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = "/placeholder.svg";
                        }}
                      />
                    </Link>
                  </div>
                  <div className="mt-2 text-center">
                    <p className="text-sm font-semibold leading-tight">
                      {getTextContent(movie.title) || "Unknown Movie"}
                    </p>
                    <p className="text-xs text-muted-foreground leading-tight mt-1">
                      {movie.year || "Unknown Year"}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              // Show placeholder items when empty
              <div className="flex-shrink-0 w-32">
                <div className="aspect-[2/3] w-full bg-black/20 rounded-md border border-border/30 flex items-center justify-center">
                  <div className="text-center flex items-center justify-center h-full">
                    <p className="text-sm text-muted-foreground/50">Add</p>
                  </div>
                </div>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 p-0 bg-black/50 hover:bg-black/70 text-white rounded-full"
            onClick={() => scrollRight(scrollContainerRefs.recommendations)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* rating */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-muted-foreground">rating</p>
          {!readOnly && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-muted"
              onClick={() => openSearchDialog("rating")}
            >
              <Plus className="h-3 w-3" />
            </Button>
          )}
        </div>
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 p-0 bg-black/50 hover:bg-black/70 text-white rounded-full"
            onClick={() => scrollLeft(scrollContainerRefs.ratings)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div
            ref={scrollContainerRefs.ratings}
            className="flex gap-4 overflow-x-auto scrollbar-hide"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {limitedRatings.length > 0 ? (
              limitedRatings.map((rating, idx) => (
                <div
                  key={rating.movie.id || idx}
                  className="relative group flex-shrink-0 w-32"
                >
                  <div className="aspect-[2/3] w-full bg-muted rounded-md overflow-hidden">
                    <Image
                      src={rating.movie.cover || "/placeholder.svg"}
                      alt={rating.movie.title || "Movie"}
                      width={128}
                      height={192}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "/placeholder.svg";
                      }}
                    />
                    {!readOnly && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-1 right-1 h-6 w-6 p-0 bg-black/50 hover:bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() =>
                          handleRemoveItem("rating", rating.movie.id)
                        }
                      >
                        <X className="h-3 w-3 text-white" />
                      </Button>
                    )}
                    <div className="absolute bottom-1 left-1 right-1 flex justify-center gap-1 p-2 bg-black/50 rounded-md">
                      {renderInteractiveStars(rating.movie.id, rating.rating)}
                    </div>
                  </div>
                  {/* Removed name and year display - only poster and rating shown */}
                </div>
              ))
            ) : (
              // Show placeholder items when empty
              <div className="flex-shrink-0 w-32">
                <div className="aspect-[2/3] w-full bg-black/20 rounded-md border border-border/30 flex items-center justify-center">
                  <div className="text-center flex items-center justify-center h-full">
                    <p className="text-sm text-muted-foreground/50">Add</p>
                  </div>
                </div>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 p-0 bg-black/50 hover:bg-black/70 text-white rounded-full"
            onClick={() => scrollRight(scrollContainerRefs.ratings)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
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
