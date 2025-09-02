"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  Tv,
  Video,
  Bookmark,
  Share2,
  Folder,
} from "lucide-react";
import { useSeriesProfile, type TMDBSeries } from "@/hooks/use-series-profile";
import { useCurrentUser } from "@/hooks/use-current-user";

interface PublicCollection {
  id: string;
  name: string;
  isPublic: boolean;
  isDefault: boolean;
  type: "movies" | "series" | "books";
  itemCount: number;
}

interface PublicCollectionItems {
  [collectionId: string]: any[];
}

interface ProfileSeriesSectionProps {
  userId?: string;
  readOnly?: boolean;
  publicCollections?: PublicCollection[];
  publicCollectionItems?: PublicCollectionItems;
  loadingPublicCollections?: boolean;
}

// Placeholder content for empty states - inspired by movies section design
const PLACEHOLDER = {
  currentlyWatching: {
    title: "Add your current watch",
    subtitle: "Search for a series you're watching",
    cover:
      "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=256&h=384&fit=crop&crop=center",
  },
  favoriteSeries: {
    title: "Add your favorite series",
    subtitle: "Search for your all-time favorite",
    cover:
      "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=256&h=384&fit=crop&crop=center",
  },
  favoriteCreator: {
    name: "Add your favorite creator",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=faces",
  },
  favoriteSeriesList: new Array(4).fill(0).map((_, i) => ({
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

// Helper function to strip HTML tags and decode HTML entities
const stripHtmlTags = (html: string): string => {
  if (!html) return html;
  return html
    .replace(/<[^>]*>/g, "") // Remove HTML tags
    .replace(/&amp;/g, "&") // Decode HTML entities
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ") // Replace non-breaking spaces
    .replace(/\s+/g, " ") // Normalize whitespace
    .trim();
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

// Helper function to truncate series titles
const truncateTitle = (title: string, maxLength: number = 10): string => {
  if (!title) return "Unknown Series";
  const cleanTitle = cleanTextContent(title);
  return cleanTitle.length > maxLength
    ? cleanTitle.substring(0, maxLength) + "..."
    : cleanTitle;
};

// Helper function to truncate title to first few words
const truncateTitleToWords = (title: string, maxWords: number = 1): string => {
  if (!title) return "Unknown Series";
  const cleanTitle = cleanTextContent(title);
  const words = cleanTitle.split(" ");
  if (words.length <= maxWords) return cleanTitle;
  return words.slice(0, maxWords).join(" ") + "...";
};

// Helper function to safely extract image URLs from various API response formats
const getImageUrl = (image: any): string => {
  try {
    if (typeof image === "string") {
      return image;
    }
    if (image && typeof image === "object") {
      // Handle different image object formats
      return (
        image.poster_path ||
        image.backdrop_path ||
        image.profile_path ||
        image.cover ||
        image.image ||
        image.avatar ||
        ""
      );
    }
    return "";
  } catch (error) {
    console.error("Error extracting image URL:", error);
    return "";
  }
};

export default function ProfileSeriesSection({
  userId,
  readOnly = false,
  publicCollections = [],
  publicCollectionItems = {},
  loadingPublicCollections = false,
}: ProfileSeriesSectionProps) {
  const { user } = useCurrentUser();
  const router = useRouter();
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
    replaceFavoriteSeries,
    replaceWatchlistSeries,
    replaceRecommendation,
    replaceRating,
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
  const [editingItem, setEditingItem] = useState<any>(null);

  // Scroll container refs
  const scrollContainerRefs = {
    favoriteSeriesList: useRef<HTMLDivElement>(null),
    watchlist: useRef<HTMLDivElement>(null),
    recommendations: useRef<HTMLDivElement>(null),
    ratings: useRef<HTMLDivElement>(null),
  };

  // Recently watched navigation state
  const [currentRecentlyWatchedIndex, setCurrentRecentlyWatchedIndex] =
    useState(0);

  // Trailer state
  const [trailerOpen, setTrailerOpen] = useState(false);
  const [selectedTrailer, setSelectedTrailer] = useState<any>(null);

  // Scroll functions
  const scrollLeft = (ref: React.RefObject<HTMLDivElement | null>) => {
    if (ref.current) {
      const scrollDistance = Math.min(200, ref.current.clientWidth * 0.8);
      ref.current.scrollBy({
        left: -scrollDistance,
        behavior: "smooth",
      });
    }
  };

  const scrollRight = (ref: React.RefObject<HTMLDivElement | null>) => {
    if (ref.current) {
      const scrollDistance = Math.min(200, ref.current.clientWidth * 0.8);
      ref.current.scrollBy({
        left: scrollDistance,
        behavior: "smooth",
      });
    }
  };

  // Rating functions
  const handleRatingHover = (seriesId: string, rating: number) => {
    setHoveredRating({ seriesId, rating });
  };

  const handleRatingLeave = () => {
    setHoveredRating(null);
  };

  const handleRatingClick = async (seriesId: string, rating: number) => {
    try {
      if (rating === 0) {
        await removeRating(seriesId);
      } else {
        const series = seriesProfile.ratings.find(
          (r) => r.series.id.toString() === seriesId
        )?.series;
        if (series) {
          await addRating(series, rating);
        }
      }
    } catch (error) {
      console.error("Error updating rating:", error);
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
          className={`h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-4 md:w-4 transition-colors ${
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

  const handleSelectItem = async (item: any) => {
    if (!activeSearchType) return;

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

    try {
      // Check if we're replacing an existing item
      if (editingItem) {
        switch (activeSearchType) {
          case "recentlyWatched":
            // For recently watched, we just update since it's a single item
            await updateRecentlyWatched(formattedItem);
            break;
          case "favoriteSeriesList":
            await replaceFavoriteSeries(
              editingItem.id.toString(),
              formattedItem
            );
            break;
          case "watchlist":
            await replaceWatchlistSeries(
              editingItem.id.toString(),
              formattedItem
            );
            break;
          case "recommendation":
            await replaceRecommendation(
              editingItem.id.toString(),
              formattedItem
            );
            break;
          case "rating":
            await replaceRating(editingItem.id.toString(), formattedItem, 5);
            break;
        }
      } else {
        // Adding new items
        switch (activeSearchType) {
          case "recentlyWatched":
            await updateRecentlyWatched(formattedItem);
            break;
          case "favoriteSeriesList":
            await addFavoriteSeries(formattedItem);
            break;
          case "watchlist":
            await addToWatchlist(formattedItem);
            break;
          case "recommendation":
            await addRecommendation(formattedItem);
            break;
          case "rating":
            await addRating(formattedItem, 5);
            break;
        }
      }

      setShowSearchDialog(false);
      setSearchQuery("");
      setSearchResults([]);
      setActiveSearchType(null);
      setEditingItem(null); // Clear the editing item
    } catch (error) {
      console.error("Error adding/replacing item:", error);
      alert("Failed to add/replace item. Please try again.");
    }
  };

  const handleRemoveItem = async (
    type: "favoriteSeriesList" | "watchlist" | "recommendation" | "rating",
    id: string | number
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
          await removeFromWatchlist(String(id));
          break;
        case "recommendation":
          await removeRecommendation(String(id));
          break;
        case "rating":
          await removeRating(String(id));
          break;
      }
    } catch (error) {
      console.error("Error removing item:", error);
      alert("Failed to remove item. Please try again.");
    }
  };

  const handleRemoveRating = async (seriesId: string) => {
    if (!seriesId) {
      console.error("Invalid series ID for rating removal:", seriesId);
      return;
    }

    try {
      await removeRating(seriesId);
    } catch (error) {
      console.error("Error removing rating:", error);
      alert("Failed to remove rating. Please try again.");
    }
  };

  // Function to handle plus button clicks
  const handlePlusClick = (sectionType: string, itemToReplace?: any) => {
    // For favorite sections, open search dialog
    if (
      sectionType === "favoriteSeries" ||
      sectionType === "favoriteSeriesList"
    ) {
      openSearchDialog(sectionType, itemToReplace);
    } else {
      // For all other sections, redirect to discover page with specific section
      let section = "";
      switch (sectionType) {
        case "recentlyWatched":
          section = "currently-watching";
          break;
        case "watchlist":
          section = "watchlist";
          break;
        case "recommendation":
          section = "recommendations";
          break;
        case "rating":
          section = "ratings";
          break;
        default:
          section = "";
      }
      const url = section ? `/series?section=${section}` : `/series`;
      router.push(url);
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

  // Handle like click
  const handleLikeClick = (series: TMDBSeries) => {
    // Add to favorites if not already there
    if (
      !safeSeriesProfile.favoriteSeriesList?.find((s) => s.id === series.id)
    ) {
      addFavoriteSeries(series);
    }
  };

  // Handle trailer click
  const handleTrailerClick = async (series: TMDBSeries) => {
    const seriesTitle = getTextContent(series.name);

    try {
      // Fetch trailers from TMDB API
      const response = await fetch(
        `https://api.themoviedb.org/3/tv/${series.id}/videos?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}&language=en-US`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch trailers");
      }

      const data = await response.json();
      const trailers = data.results || [];

      if (trailers.length === 0) {
        // Fallback to YouTube search if no trailers found
        const searchQuery = `${seriesTitle} official trailer`;
        const youtubeUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(
          searchQuery
        )}`;
        window.open(youtubeUrl, "_blank");
        return;
      }

      // Prefer official trailers, then the first one
      const officialTrailer = trailers.find((trailer: any) => trailer.official);
      const selectedTrailer = officialTrailer || trailers[0];

      setSelectedTrailer(selectedTrailer);
      setTrailerOpen(true);
    } catch (error) {
      console.error("Error fetching trailers:", error);
      // Fallback to YouTube search
      const searchQuery = `${seriesTitle} official trailer`;
      const youtubeUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(
        searchQuery
      )}`;
      window.open(youtubeUrl, "_blank");
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

  // Safe access to series profile
  const safeSeriesProfile = seriesProfile || {
    recentlyWatched: [],
    favoriteSeries: null,
    favoriteCreator: null,
    favoriteSeriesList: [],
    watchlist: [],
    recommendations: [],
    ratings: [],
  };

  // Recently watched list
  const recentlyWatchedList = safeSeriesProfile.recentlyWatched || [];

  // Navigation functions for recently watched
  const navigateRecentlyWatchedLeft = () => {
    if (recentlyWatchedList.length > 1) {
      setCurrentRecentlyWatchedIndex((prev) =>
        prev === 0 ? recentlyWatchedList.length - 1 : prev - 1
      );
    }
  };

  const navigateRecentlyWatchedRight = () => {
    if (recentlyWatchedList.length > 1) {
      setCurrentRecentlyWatchedIndex((prev) =>
        prev === recentlyWatchedList.length - 1 ? 0 : prev + 1
      );
    }
  };

  // Get current recently watched series
  const currentRecentlyWatched =
    recentlyWatchedList[currentRecentlyWatchedIndex] || null;

  // Limit items to specified limits per section
  const limitedFavoriteSeriesList =
    safeSeriesProfile.favoriteSeriesList?.slice(0, 5) || [];
  const limitedWatchlist = safeSeriesProfile.watchlist || [];
  const limitedRecommendations =
    safeSeriesProfile.recommendations?.slice(0, 20) || [];
  const limitedRatings = safeSeriesProfile.ratings || [];

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Public Collections Section */}
      {publicCollections.length > 0 && (
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-start mb-4">
            <p className="text-sm font-medium text-white">public collections</p>
          </div>
          {loadingPublicCollections ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-muted rounded mb-2"></div>
                  <div className="h-32 bg-muted rounded"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {publicCollections.map((collection) => {
                const items = publicCollectionItems[collection.id] || [];
                return (
                  <Card key={collection.id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Folder className="h-4 w-4 text-muted-foreground" />
                        <h3 className="font-semibold text-sm truncate">
                          {collection.name}
                        </h3>
                      </div>
                      <div className="flex gap-2 overflow-x-auto pb-2 horizontal-scroll-container">
                        {items.slice(0, 4).map((item, idx) => (
                          <div
                            key={`public-${item.id || idx}`}
                            className="flex-shrink-0 w-16 h-24 bg-muted rounded-md overflow-hidden"
                          >
                            <Image
                              src={
                                item.cover || item.poster_path
                                  ? `https://image.tmdb.org/t/p/w200${item.poster_path}`
                                  : "/placeholder.svg"
                              }
                              alt={item.title || item.name || "Series"}
                              width={64}
                              height={96}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = "/placeholder.svg";
                              }}
                            />
                          </div>
                        ))}
                        {items.length === 0 && (
                          <div className="flex-shrink-0 w-16 h-24 bg-muted rounded-md flex items-center justify-center">
                            <Tv className="h-6 w-6 text-muted-foreground/50" />
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{collection.itemCount} series</span>
                        {items.length > 4 && (
                          <span>+{items.length - 4} more</span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-4">
          <p className="text-sm font-medium text-white">currently watching</p>
          <Link href="/series">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-3 text-xs text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded-full transition-all duration-200"
            >
              <Plus className="h-3 w-3 mr-1" />
              add
            </Button>
          </Link>
        </div>

        <div className="relative">
          {currentRecentlyWatched ? (
            <div className="flex gap-6 items-start">
              {/* Series poster */}
              <div className="relative group flex-shrink-0">
                <div className="w-32 h-48 bg-muted rounded-md overflow-hidden">
                  <Link href={`/series/${currentRecentlyWatched.id}`}>
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
                      className="w-full h-full object-cover cursor-pointer"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "/placeholder.svg";
                      }}
                    />
                  </Link>
                  {!readOnly && (
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-md flex items-center justify-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 bg-white/20 hover:bg-white/30 text-white"
                        onClick={() => handlePlusClick("recentlyWatched")}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Content section */}
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-semibold text-white mb-2">
                  {getTextContent(currentRecentlyWatched.name) ||
                    "Unknown Series"}
                </h3>
                <p className="text-sm text-white mb-4 line-clamp-3">
                  {currentRecentlyWatched.overview
                    ? stripHtmlTags(currentRecentlyWatched.overview)
                    : "No description available"}
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
                  <p className="text-sm text-white">Add Current Watch</p>
                </div>
              </div>

              {/* Empty state content */}
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-semibold text-white mb-2">
                  Series Title
                </h3>
                <p className="text-sm text-white mb-4">Series description</p>

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
                <ChevronRight className="h-5 w-5 text-white" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* favorite series */}
      <div className="mt-12 max-w-3xl mx-auto">
        <div className="flex items-center justify-start mb-4">
          <p className="text-sm font-medium text-white">favorite</p>
        </div>
        <div className="relative">
          <div
            ref={scrollContainerRefs.favoriteSeriesList}
            className="flex justify-start gap-6 overflow-x-auto scrollbar-hide pb-4 horizontal-scroll-container"
          >
            {limitedFavoriteSeriesList.length > 0 ? (
              <>
                {limitedFavoriteSeriesList.map((series, idx) => (
                  <div
                    key={`favorite-${series.id || idx}`}
                    className="relative group flex-shrink-0 w-32"
                  >
                    <div className="aspect-[2/3] w-full bg-muted rounded-md overflow-hidden">
                      <Link href={`/series/${series.id}`}>
                        <Image
                          src={
                            series.poster_path
                              ? `https://image.tmdb.org/t/p/w500${series.poster_path}`
                              : "/placeholder.svg"
                          }
                          alt={series.name || "Series"}
                          width={128}
                          height={192}
                          className="w-full h-full object-cover cursor-pointer"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = "/placeholder.svg";
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
                              handlePlusClick("favoriteSeriesList", series)
                            }
                            title="Replace series"
                          >
                            <Edit className="h-3 w-3 text-white" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 bg-red-600/80 hover:bg-red-700/90 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() =>
                              handleRemoveItem(
                                "favoriteSeriesList",
                                series.id.toString()
                              )
                            }
                            title="Delete series"
                          >
                            <Trash2 className="h-3 w-3 text-white" />
                          </Button>
                        </div>
                      )}
                    </div>
                    <div className="mt-2 text-center">
                      <p className="text-sm font-semibold leading-tight min-h-[1.5rem] truncate">
                        {truncateTitleToWords(series.name)}
                      </p>
                      <p className="text-xs text-white leading-tight mt-0.5 truncate">
                        {series.first_air_date?.split("-")[0] || "Unknown Year"}
                      </p>
                    </div>
                  </div>
                ))}

                {/* Add button - only show when less than 5 items */}
                {limitedFavoriteSeriesList.length < 5 && (
                  <div className="flex-shrink-0">
                    <div className="aspect-[2/3] w-32 bg-transparent rounded-md border-2 border-gray-600 flex items-center justify-center overflow-visible">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-12 w-12 p-0 bg-black/70 hover:bg-black/90 text-white rounded-full border-2 border-white/20 shadow-lg"
                        onClick={() => handlePlusClick("favoriteSeriesList")}
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
                  <p className="text-xs text-gray-500 text-center">
                    No favorite series
                  </p>
                </div>
                {!readOnly && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => handlePlusClick("favoriteSeriesList")}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Series
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* watchlist */}
      <div className="mt-12 max-w-3xl mx-auto">
        <div className="flex items-center justify-start mb-4">
          <p className="text-sm font-medium text-white">watchlist</p>
        </div>
        <div className="relative">
          <div
            ref={scrollContainerRefs.watchlist}
            className="flex justify-start gap-6 overflow-x-auto scrollbar-hide pb-4 horizontal-scroll-container"
          >
            {limitedWatchlist.length > 0 ? (
              <>
                {limitedWatchlist.map((series, idx) => (
                  <div
                    key={`watchlist-${series.id || idx}`}
                    className="relative group flex-shrink-0 w-32"
                  >
                    <div className="aspect-[2/3] w-full bg-muted rounded-md overflow-hidden">
                      <Link href={`/series/${series.id}`}>
                        <Image
                          src={
                            series.poster_path
                              ? `https://image.tmdb.org/t/p/w500${series.poster_path}`
                              : "/placeholder.svg"
                          }
                          alt={series.name || "Series"}
                          width={128}
                          height={192}
                          className="w-full h-full object-cover cursor-pointer"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = "/placeholder.svg";
                          }}
                        />
                      </Link>
                      {!readOnly && (
                        <div className="absolute top-2 right-2 flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 bg-black/50 hover:bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handlePlusClick("watchlist", series)}
                            title="Replace series"
                          >
                            <Edit className="h-3 w-3 text-white" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 bg-red-600/80 hover:bg-red-700/90 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() =>
                              handleRemoveItem(
                                "watchlist",
                                series.id.toString()
                              )
                            }
                            title="Delete series"
                          >
                            <Trash2 className="h-3 w-3 text-white" />
                          </Button>
                        </div>
                      )}
                    </div>
                    <div className="mt-2 text-center">
                      <p className="text-sm font-semibold leading-tight truncate min-h-[1.5rem] flex items-center justify-center">
                        {truncateTitleToWords(series.name)}
                      </p>
                      <p className="text-xs text-white leading-tight mt-0.5">
                        {series.first_air_date?.split("-")[0] || "Unknown Year"}
                      </p>
                    </div>
                  </div>
                ))}

                {/* Add button for subsequent items - only show when not read-only */}
                {!readOnly && (
                  <div className="flex-shrink-0">
                    <div className="aspect-[2/3] w-32 bg-transparent rounded-md border-2 border-gray-600 flex items-center justify-center overflow-visible">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-12 w-12 p-0 bg-black/70 hover:bg-black/90 text-white rounded-full border-2 border-white/20 shadow-lg"
                        onClick={() => handlePlusClick("watchlist")}
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
                  <p className="text-xs text-gray-500 text-center">
                    No watchlist series
                  </p>
                </div>
                {!readOnly && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => handlePlusClick("watchlist")}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Series
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
          <p className="text-sm font-medium text-white">recommendation</p>
        </div>
        <div className="relative">
          <div
            ref={scrollContainerRefs.recommendations}
            className="flex justify-start gap-6 overflow-x-auto scrollbar-hide pb-4 horizontal-scroll-container"
          >
            {limitedRecommendations.length > 0 ? (
              <>
                {limitedRecommendations.map((series, idx) => (
                  <div
                    key={`recommendation-${series.id || idx}`}
                    className="relative group flex-shrink-0 w-32"
                  >
                    <div className="aspect-[2/3] w-full bg-muted rounded-md overflow-hidden">
                      <Link href={`/series/${series.id}`}>
                        <Image
                          src={
                            series.poster_path
                              ? `https://image.tmdb.org/t/p/w500${series.poster_path}`
                              : "/placeholder.svg"
                          }
                          alt={series.name || "Series"}
                          width={128}
                          height={192}
                          className="w-full h-full object-cover cursor-pointer"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = "/placeholder.svg";
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
                              handlePlusClick("recommendation", series)
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
                              handleRemoveItem(
                                "recommendation",
                                series.id.toString()
                              )
                            }
                            title="Delete recommendation"
                          >
                            <Trash2 className="h-3 w-3 text-white" />
                          </Button>
                        </div>
                      )}
                    </div>
                    <div className="mt-2 text-center">
                      <p className="text-sm font-semibold leading-tight truncate min-h-[1.5rem] flex items-center justify-center">
                        {truncateTitleToWords(series.name)}
                      </p>
                      <p className="text-xs text-muted-foreground leading-tight mt-0.5">
                        {series.first_air_date?.split("-")[0] || "Unknown Year"}
                      </p>
                    </div>
                  </div>
                ))}

                {/* Add button for subsequent items - only show when not read-only */}
                {!readOnly && (
                  <div className="flex-shrink-0">
                    <div className="aspect-[2/3] w-32 bg-transparent rounded-md border-2 border-gray-600 flex items-center justify-center overflow-visible">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-12 w-12 p-0 bg-black/70 hover:bg-black/90 text-white rounded-full border-2 border-white/20 shadow-lg"
                        onClick={() => handlePlusClick("recommendation")}
                      >
                        <Plus className="h-6 w-6" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              // Show single Add screen when empty
              <div className="flex flex-col items-start justify-start min-h-[200px]">
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
                    onClick={() => handlePlusClick("recommendation")}
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

      {/* rating */}
      <div className="mt-12 max-w-3xl mx-auto">
        <div className="flex items-center justify-start mb-4">
          <p className="text-sm font-medium text-white">rating</p>
        </div>
        <div className="relative">
          <div
            ref={scrollContainerRefs.ratings}
            className="flex justify-start gap-6 overflow-x-auto scrollbar-hide pb-4 horizontal-scroll-container"
          >
            {limitedRatings.length > 0 ? (
              <>
                {limitedRatings.map((rating, idx) => (
                  <div
                    key={`rating-${rating.id || rating.series.id || idx}`}
                    className="relative group flex-shrink-0 w-32"
                  >
                    <div className="aspect-[2/3] w-full bg-muted rounded-md overflow-hidden">
                      <Link href={`/series/${rating.series.id}`}>
                        <Image
                          src={
                            rating.series.poster_path
                              ? `https://image.tmdb.org/t/p/w500${rating.series.poster_path}`
                              : "/placeholder.svg"
                          }
                          alt={rating.series.name || "Series"}
                          width={128}
                          height={192}
                          className="w-full h-full object-cover cursor-pointer"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = "/placeholder.svg";
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
                              handlePlusClick("rating", rating.series)
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
                              handleRemoveItem(
                                "rating",
                                rating.series.id.toString()
                              )
                            }
                            title="Delete rating"
                          >
                            <Trash2 className="h-3 w-3 text-white" />
                          </Button>
                        </div>
                      )}
                    </div>
                    {/* Rating stars - above the series name */}
                    <div className="mt-3 flex justify-center gap-1">
                      {renderInteractiveStars(
                        rating.series.id.toString(),
                        rating.rating
                      )}
                    </div>
                    {/* Series name and year display - below the rating */}
                    <div className="mt-2 text-center w-full">
                      <p className="text-sm font-semibold leading-tight px-2 min-h-[1.5rem] truncate">
                        {truncateTitleToWords(rating.series.name)}
                      </p>
                      <p className="text-xs text-white leading-tight -mt-1 px-2 truncate">
                        {rating.series.first_air_date?.split("-")[0] ||
                          "Unknown Year"}
                      </p>
                    </div>
                  </div>
                ))}

                {/* Add button for subsequent items - only show when not read-only */}
                {!readOnly && (
                  <div className="flex-shrink-0">
                    <div className="aspect-[2/3] w-32 bg-transparent rounded-md border-2 border-gray-600 flex items-center justify-center overflow-visible">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-12 w-12 p-0 bg-black/70 hover:bg-black/90 text-white rounded-full border-2 border-white/20 shadow-lg"
                        onClick={() => handlePlusClick("rating")}
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
                  <p className="text-xs text-gray-500 text-center">
                    No rated series
                  </p>
                </div>
                {!readOnly && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => handlePlusClick("rating")}
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
        <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-[500px] mx-auto search-modal-content">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">
              {editingItem ? "Replace" : "Search"}{" "}
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
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-2 search-dialog-container profile-search-dialog">
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white h-4 w-4" />
                <Input
                  placeholder={`${
                    editingItem ? "Search for replacement" : "Search"
                  } ${
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
                  className="pl-10 w-full search-dialog-input"
                />
              </div>
              <Button
                onClick={() => handleSearch(searchQuery, activeSearchType!)}
                disabled={isSearching || !searchQuery.trim()}
                className="w-full sm:w-auto search-dialog-button"
              >
                {isSearching
                  ? "Searching..."
                  : editingItem
                  ? "Search for Replacement"
                  : "Search"}
              </Button>
            </div>

            {searchError && (
              <div className="text-red-500 text-sm text-center">
                {searchError}
              </div>
            )}

            {searchResults.length > 0 && (
              <div className="max-h-60 overflow-y-auto space-y-2 px-1">
                {searchResults.map((item, index) => (
                  <div
                    key={`search-${item.id || index}`}
                    className="flex items-center gap-3 p-3 rounded-md hover:bg-muted cursor-pointer transition-colors search-result-item"
                    onClick={() => handleSelectItem(item)}
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
                      <p className="text-sm text-white truncate">
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

      {/* Trailer Dialog */}
      <Dialog open={trailerOpen} onOpenChange={setTrailerOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>
              {selectedTrailer?.name || "Series Trailer"}
            </DialogTitle>
          </DialogHeader>
          {selectedTrailer && (
            <div className="relative w-full aspect-video">
              <iframe
                src={`https://www.youtube.com/embed/${selectedTrailer.key}?autoplay=1`}
                title={selectedTrailer.name}
                className="w-full h-full rounded-lg"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
