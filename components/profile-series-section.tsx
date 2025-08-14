"use client";

import Image from "next/image";
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
  Tv,
} from "lucide-react";
import { useSeriesProfile, type TMDBSeries } from "@/hooks/use-series-profile";
import { useCurrentUser } from "@/hooks/use-current-user";

interface ProfileSeriesSectionProps {
  userId?: string;
  readOnly?: boolean;
}

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

export default function ProfileSeriesSection({
  userId,
  readOnly = false,
}: ProfileSeriesSectionProps) {
  const { user } = useCurrentUser();
  const targetUserId = userId || user?.uid;
  const {
    seriesProfile,
    loading,
    error,
    updateRecentlyWatched,
    updateFavoriteSeries,
    updateFavoriteCreator,
    addFavoriteSeries,
    removeFavoriteSeries,
    addToWatchlist,
    removeFromWatchlist,
    addRecommendation,
    removeRecommendation,
    addRating,
    removeRating,
    searchSeries,
    searchCreator,
  } = useSeriesProfile(targetUserId);

  // Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeSearchType, setActiveSearchType] = useState<
    | "recentlyWatched"
    | "favoriteCreator"
    | "favoriteSeries"
    | "favoriteSeriesList"
    | "watchlist"
    | "recommendation"
    | "rating"
    | null
  >(null);
  const [showSearchDialog, setShowSearchDialog] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hoveredRating, setHoveredRating] = useState<{
    seriesId: string;
    rating: number;
  } | null>(null);

  // Horizontal scroll functionality
  const scrollContainerRefs = {
    favoriteSeriesList: useRef<HTMLDivElement>(null),
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
    if (seriesProfile) {
      if (seriesProfile.favoriteSeriesList?.length > 0) {
        scrollToEnd(scrollContainerRefs.favoriteSeriesList);
      }
      if (seriesProfile.watchlist?.length > 0) {
        scrollToEnd(scrollContainerRefs.watchlist);
      }
      if (seriesProfile.recommendations?.length > 0) {
        scrollToEnd(scrollContainerRefs.recommendations);
      }
      if (seriesProfile.ratings?.length > 0) {
        scrollToEnd(scrollContainerRefs.ratings);
      }
    }
  }, [
    seriesProfile?.favoriteSeriesList?.length,
    seriesProfile?.watchlist?.length,
    seriesProfile?.recommendations?.length,
    seriesProfile?.ratings?.length,
  ]);

  // Rating functionality
  const handleRatingHover = (seriesId: string, rating: number) => {
    setHoveredRating({ seriesId, rating });
  };

  const handleRatingLeave = () => {
    setHoveredRating(null);
  };

  const handleRatingClick = async (seriesId: string, rating: number) => {
    try {
      const series = seriesProfile.ratings.find(
        (r) => r.series.id.toString() === seriesId
      )?.series;
      if (series) {
        await addRating(series, rating);
      }
    } catch (error) {
      console.error("Error updating rating:", error);
      alert("Failed to update rating. Please try again.");
    }
  };

  const renderInteractiveStars = (seriesId: string, currentRating: number) => {
    const displayRating =
      hoveredRating?.seriesId === seriesId
        ? hoveredRating.rating
        : currentRating;

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
            !readOnly ? () => handleRatingHover(seriesId, starValue) : undefined
          }
          onMouseLeave={!readOnly ? handleRatingLeave : undefined}
          onClick={
            !readOnly ? () => handleRatingClick(seriesId, starValue) : undefined
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
      | "favoriteCreator"
      | "favoriteSeries"
      | "favoriteSeriesList"
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

      if (searchType === "favoriteCreator") {
        results = await searchCreator(query, 10);
      } else {
        results = await searchSeries(query, 10);
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
          getTextContent(item.name || item.title)
        );
        const year = item.year || item.first_air_date?.split("-")[0] || "";

        return {
          id: item.id || `item-${Math.random()}`,
          name: itemName,
          title: itemName,
          year: year,
          cover: item.cover || item.image || item.poster_path,
          poster_path: item.poster_path,
          rating: item.rating || item.vote_average,
          overview: item.overview,
          first_air_date: item.first_air_date,
          vote_average: item.vote_average,
          vote_count: item.vote_count,
          genre_ids: item.genre_ids,
          genres: item.genres,
          number_of_seasons: item.number_of_seasons,
          number_of_episodes: item.number_of_episodes,
          status: item.status,
          type: item.type || "tv",
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
      | "favoriteCreator"
      | "favoriteSeries"
      | "favoriteSeriesList"
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
        name: cleanTextContent(getTextContent(item.name || item.title)) || "",
        title: cleanTextContent(getTextContent(item.name || item.title)) || "",
        year: parseInt(
          item.year || item.first_air_date?.split("-")[0] || "0",
          10
        ),
        cover: item.cover || item.image || item.poster_path || "",
        poster_path: item.poster_path || item.cover || item.image || "",
        rating: item.rating || item.vote_average || 0,
        overview: item.overview || "",
        first_air_date: item.first_air_date || "",
        vote_average: item.vote_average || 0,
        vote_count: item.vote_count || 0,
        genre_ids: Array.isArray(item.genre_ids) ? item.genre_ids : [],
        genres: Array.isArray(item.genres) ? item.genres : [],
        number_of_seasons: item.number_of_seasons || 0,
        number_of_episodes: item.number_of_episodes || 0,
        status: item.status || "",
        type: item.type || "tv",
      };

      console.log("Formatted item:", formattedItem);

      switch (searchType) {
        case "recentlyWatched":
          console.log("Updating recently watched");
          await updateRecentlyWatched(formattedItem);
          break;
        case "favoriteSeries":
          console.log("Updating favorite series");
          await updateFavoriteSeries(formattedItem);
          break;
        case "favoriteSeriesList":
          console.log("Adding to favorite series list");
          await addFavoriteSeries(formattedItem);
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
        case "favoriteCreator":
          console.log("Updating favorite creator");
          await updateFavoriteCreator({
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
    type: "favoriteSeriesList" | "watchlist" | "recommendation" | "rating",
    id: string
  ) => {
    if (!id) {
      console.error("Invalid ID for removal:", id);
      return;
    }

    try {
      switch (type) {
        case "favoriteSeriesList":
          await removeFavoriteSeries(id);
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
  const handleTrailerClick = (series: TMDBSeries) => {
    const seriesTitle = getTextContent(series.name);

    // Try to find trailer on YouTube
    const searchQuery = `${seriesTitle} official trailer`;
    const youtubeUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(
      searchQuery
    )}`;

    // Open in new tab
    window.open(youtubeUrl, "_blank");
  };

  // Handle like click
  const handleLikeClick = (series: TMDBSeries) => {
    // Add to favorites if not already there
    if (
      !safeSeriesProfile.favoriteSeriesList?.find((s) => s.id === series.id)
    ) {
      addFavoriteSeries(series);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="space-y-5 max-w-[800px] mx-auto">
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
      <div className="space-y-5 max-w-[800px] mx-auto">
        <div className="text-center p-8">
          <div className="text-red-500 mb-4">
            Error loading series profile: {error}
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
      <div className="space-y-5 max-w-[800px] mx-auto">
        <div className="text-center p-8">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-4">
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">
              TMDB API Key Required
            </h3>
            <p className="text-yellow-700 mb-4">
              To use the series profile features, you need to configure the TMDB
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

  // Ensure seriesProfile exists
  const safeSeriesProfile = seriesProfile || {
    recentlyWatched: [],
    favoriteSeries: null,
    favoriteCreator: null,
    favoriteSeriesList: [],
    watchlist: [],
    recommendations: [],
    ratings: [],
  };

  // Create a list of recently watched series
  const recentlyWatchedList = safeSeriesProfile.recentlyWatched || [];

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

  // Get current recently watched series
  const currentRecentlyWatched =
    recentlyWatchedList[currentRecentlyWatchedIndex] || null;

  // Limit items to 15 per section
  const limitedFavoriteSeriesList =
    safeSeriesProfile.favoriteSeriesList?.slice(0, 5) || [];
  const limitedWatchlist = safeSeriesProfile.watchlist || [];
  const limitedRecommendations =
    safeSeriesProfile.recommendations?.slice(0, 20) || [];
  const limitedRatings = safeSeriesProfile.ratings || [];

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
                    src={
                      currentRecentlyWatched.poster_path
                        ? `https://image.tmdb.org/t/p/w500${currentRecentlyWatched.poster_path}`
                        : "/placeholder.svg"
                    }
                    alt={
                      getTextContent(currentRecentlyWatched.name) || "Series"
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
                    {getTextContent(currentRecentlyWatched.name) ||
                      "Unknown Series"}
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
                  <p className="text-xs text-muted-foreground mb-2">
                    No series
                  </p>
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
                  Add a series you're currently watching
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

      {/* favorite series */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-muted-foreground">favorite</p>
          {!readOnly && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-muted"
              onClick={() => openSearchDialog("favoriteSeriesList")}
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
            onClick={() => scrollLeft(scrollContainerRefs.favoriteSeriesList)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div
            ref={scrollContainerRefs.favoriteSeriesList}
            className="flex gap-4 overflow-x-auto scrollbar-hide"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {limitedFavoriteSeriesList.length > 0
              ? limitedFavoriteSeriesList.map((series, idx) => (
                  <div
                    key={series.id || idx}
                    className="relative group flex-shrink-0 w-32"
                  >
                    <div className="aspect-[2/3] w-full bg-muted rounded-md overflow-hidden">
                      <Image
                        src={
                          series.poster_path
                            ? `https://image.tmdb.org/t/p/w500${series.poster_path}`
                            : "/placeholder.svg"
                        }
                        alt={series.name || "Series"}
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
                            handleRemoveItem(
                              "favoriteSeriesList",
                              series.id.toString()
                            )
                          }
                        >
                          <X className="h-3 w-3 text-white" />
                        </Button>
                      )}
                    </div>
                    <div className="mt-2 text-center">
                      <p className="text-sm font-semibold leading-tight">
                        {getTextContent(series.name) || "Unknown Series"}
                      </p>
                      <p className="text-xs text-muted-foreground leading-tight mt-1">
                        {series.first_air_date?.split("-")[0] || "Unknown Year"}
                      </p>
                    </div>
                  </div>
                ))
              : // Show placeholder items when empty
                Array.from({ length: 4 }, (_, idx) => (
                  <div
                    key={`placeholder-favorite-series-${idx}`}
                    className="flex-shrink-0 w-32"
                  >
                    <div className="aspect-[2/3] w-full bg-black/20 rounded-md border border-border/30 flex items-center justify-center">
                      <div className="text-center">
                        <Plus className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                        <p className="text-xs text-muted-foreground/50">
                          Add Series
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 text-center">
                      <p className="text-sm font-semibold leading-tight text-muted-foreground/50">
                        Series Title
                      </p>
                      <p className="text-xs text-muted-foreground/50 leading-tight mt-1">
                        Year
                      </p>
                    </div>
                  </div>
                ))}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 p-0 bg-black/50 hover:bg-black/70 text-white rounded-full"
            onClick={() => scrollRight(scrollContainerRefs.favoriteSeriesList)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* watchlist */}
      <div>
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
            {limitedWatchlist.length > 0
              ? limitedWatchlist.map((series, idx) => (
                  <div
                    key={series.id || idx}
                    className="relative group flex-shrink-0 w-32"
                  >
                    <div className="aspect-[2/3] w-full bg-muted rounded-md overflow-hidden">
                      <Image
                        src={
                          series.poster_path
                            ? `https://image.tmdb.org/t/p/w500${series.poster_path}`
                            : "/placeholder.svg"
                        }
                        alt={series.name || "Series"}
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
                            handleRemoveItem("watchlist", series.id.toString())
                          }
                        >
                          <X className="h-3 w-3 text-white" />
                        </Button>
                      )}
                    </div>
                    <div className="mt-2 text-center">
                      <p className="text-sm font-semibold leading-tight">
                        {getTextContent(series.name) || "Unknown Series"}
                      </p>
                      <p className="text-xs text-muted-foreground leading-tight mt-1">
                        {series.first_air_date?.split("-")[0] || "Unknown Year"}
                      </p>
                    </div>
                  </div>
                ))
              : // Show placeholder items when empty
                Array.from({ length: 4 }, (_, idx) => (
                  <div
                    key={`placeholder-watchlist-${idx}`}
                    className="flex-shrink-0 w-32"
                  >
                    <div className="aspect-[2/3] w-full bg-black/20 rounded-md border border-border/30 flex items-center justify-center">
                      <div className="text-center">
                        <Plus className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                        <p className="text-xs text-muted-foreground/50">
                          Add Series
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 text-center">
                      <p className="text-sm font-semibold leading-tight text-muted-foreground/50">
                        Series Title
                      </p>
                      <p className="text-xs text-muted-foreground/50 leading-tight mt-1">
                        Year
                      </p>
                    </div>
                  </div>
                ))}
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
      <div>
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
            {limitedRecommendations.length > 0
              ? limitedRecommendations.map((series, idx) => (
                  <div
                    key={series.id || idx}
                    className="relative group flex-shrink-0 w-32"
                  >
                    <div className="aspect-[2/3] w-full bg-muted rounded-md overflow-hidden">
                      <Image
                        src={
                          series.poster_path
                            ? `https://image.tmdb.org/t/p/w500${series.poster_path}`
                            : "/placeholder.svg"
                        }
                        alt={series.name || "Series"}
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
                            handleRemoveItem(
                              "recommendation",
                              series.id.toString()
                            )
                          }
                        >
                          <X className="h-3 w-3 text-white" />
                        </Button>
                      )}
                    </div>
                    <div className="mt-2 text-center">
                      <p className="text-sm font-semibold leading-tight">
                        {getTextContent(series.name) || "Unknown Series"}
                      </p>
                      <p className="text-xs text-muted-foreground leading-tight mt-1">
                        {series.first_air_date?.split("-")[0] || "Unknown Year"}
                      </p>
                    </div>
                  </div>
                ))
              : // Show placeholder items when empty
                Array.from({ length: 4 }, (_, idx) => (
                  <div
                    key={`placeholder-recommendation-${idx}`}
                    className="flex-shrink-0 w-32"
                  >
                    <div className="aspect-[2/3] w-full bg-black/20 rounded-md border border-border/30 flex items-center justify-center">
                      <div className="text-center">
                        <Plus className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                        <p className="text-xs text-muted-foreground/50">
                          Add Series
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 text-center">
                      <p className="text-sm font-semibold leading-tight text-muted-foreground/50">
                        Series Title
                      </p>
                      <p className="text-xs text-muted-foreground/50 leading-tight mt-1">
                        Year
                      </p>
                    </div>
                  </div>
                ))}
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
            {limitedRatings.length > 0
              ? limitedRatings.map((rating, idx) => (
                  <div
                    key={rating.series.id || idx}
                    className="relative group flex-shrink-0 w-32"
                  >
                    <div className="aspect-[2/3] w-full bg-muted rounded-md overflow-hidden">
                      <Image
                        src={
                          rating.series.poster_path
                            ? `https://image.tmdb.org/t/p/w500${rating.series.poster_path}`
                            : "/placeholder.svg"
                        }
                        alt={rating.series.name || "Series"}
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
                            handleRemoveItem(
                              "rating",
                              rating.series.id.toString()
                            )
                          }
                        >
                          <X className="h-3 w-3 text-white" />
                        </Button>
                      )}
                      <div className="absolute bottom-1 left-1 right-1 flex justify-center gap-1 p-2 bg-black/50 rounded-md">
                        {renderInteractiveStars(
                          rating.series.id.toString(),
                          rating.rating
                        )}
                      </div>
                    </div>
                    {/* Removed name and year display - only poster and rating shown */}
                  </div>
                ))
              : // Show placeholder items when empty
                Array.from({ length: 4 }, (_, idx) => (
                  <div
                    key={`placeholder-rating-${idx}`}
                    className="flex-shrink-0 w-32"
                  >
                    <div className="aspect-[2/3] w-full bg-black/20 rounded-md border border-border/30 flex items-center justify-center">
                      <div className="text-center">
                        <Plus className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                        <p className="text-xs text-muted-foreground/50">
                          Add Series
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 text-center">
                      <p className="text-sm font-semibold leading-tight text-muted-foreground/50">
                        Series Title
                      </p>
                      <p className="text-xs text-muted-foreground/50 leading-tight mt-1">
                        Year
                      </p>
                    </div>
                  </div>
                ))}
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
              {activeSearchType === "favoriteCreator"
                ? "Creators"
                : activeSearchType === "recentlyWatched"
                ? "Recently Watched"
                : activeSearchType === "favoriteSeries"
                ? "Favorite Series"
                : activeSearchType === "favoriteSeriesList"
                ? "Favorite Series"
                : activeSearchType === "watchlist"
                ? "Watchlist"
                : activeSearchType === "recommendation"
                ? "Recommendations"
                : activeSearchType === "rating"
                ? "Ratings"
                : "Series"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder={`Search ${
                    activeSearchType === "favoriteCreator"
                      ? "creators"
                      : activeSearchType === "recentlyWatched"
                      ? "series for recently watched"
                      : activeSearchType === "favoriteSeries"
                      ? "series for favorite series"
                      : activeSearchType === "favoriteSeriesList"
                      ? "series for favorites"
                      : activeSearchType === "watchlist"
                      ? "series for watchlist"
                      : activeSearchType === "recommendation"
                      ? "series for recommendations"
                      : activeSearchType === "rating"
                      ? "series for ratings"
                      : "series"
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
                        src={
                          item.poster_path
                            ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
                            : item.cover || "/placeholder.svg"
                        }
                        alt={
                          getTextContent(item.name || item.title) || "Series"
                        }
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
                          getTextContent(item.name || item.title)
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
