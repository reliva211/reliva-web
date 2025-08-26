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
  Heart,
  Edit,
} from "lucide-react";
import {
  useMusicProfile,
  type SaavnSong,
  type SaavnArtist,
  type SaavnAlbum,
} from "@/hooks/use-music-profile";
import { useCurrentUser } from "@/hooks/use-current-user";

interface ProfileMusicSectionProps {
  userId?: string;
  readOnly?: boolean;
}

// Placeholder content for empty states
const PLACEHOLDER = {
  currentObsession: {
    title: "Add your current obsession",
    subtitle: "Search for a song",
    cover:
      "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=256&h=256&fit=crop&crop=center",
  },
  favoriteArtist: {
    name: "Add your favorite artist",
    avatar:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&h=300&fit=crop&crop=faces",
  },
  favoriteSong: {
    title: "Add your favorite song",
    subtitle: "Search for a song",
    cover:
      "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=256&h=256&fit=crop&crop=center",
  },
  favoriteAlbums: new Array(4).fill(0).map((_, i) => ({
    id: `alb-${i}`,
    cover:
      "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=160&h=160&fit=crop&crop=center",
  })),
  recommendations: new Array(4).fill(0).map((_, i) => ({
    id: `rec-${i}`,
    cover:
      "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=160&h=160&fit=crop&crop=center",
  })),
  ratings: new Array(4).fill(0).map((_, i) => ({
    id: `rt-${i}`,
    cover:
      "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=160&h=160&fit=crop&crop=center",
  })),
};

// Helper function to clean up text content (remove brackets, parentheses, etc.)
const cleanTextContent = (text: string): string => {
  if (!text) return text;
  return text
    .replace(/\([^)]*\)/g, "") // Remove parentheses and their content
    .replace(/\[[^\]]*\]/g, "") // Remove square brackets and their content
    .replace(/from\s+["'][^"']*["']/gi, "") // Remove "from 'album name'" patterns
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

// Helper function to truncate music titles
const truncateTitle = (title: string, maxLength: number = 10): string => {
  if (!title) return "Unknown Song";
  const cleanTitle = cleanTextContent(title);
  return cleanTitle.length > maxLength
    ? cleanTitle.substring(0, maxLength) + "..."
    : cleanTitle;
};

export default function ProfileMusicSection({
  userId,
  readOnly = false,
}: ProfileMusicSectionProps) {
  const { user, loading: userLoading } = useCurrentUser();
  const targetUserId = userId || user?.uid;

  // Check if current user is viewing their own profile
  const isOwnProfile = !userId || userId === user?.uid;

  // Only fetch music profile if user is authenticated
  const shouldFetchProfile = !userLoading && !!targetUserId && !!user;

  const {
    musicProfile,
    loading,
    error,
    updateCurrentObsession,
    updateFavoriteArtist,
    updateFavoriteSong,
    addFavoriteAlbum,
    removeFavoriteAlbum,
    replaceFavoriteAlbum,
    addRecommendation,
    removeRecommendation,
    replaceRecommendation,
    addRating,
    removeRating,
    replaceRating,
    searchMusic,
  } = useMusicProfile(shouldFetchProfile ? targetUserId : undefined);

  // Ensure musicProfile exists
  const safeMusicProfile = musicProfile || {
    currentObsession: null,
    favoriteArtist: null,
    favoriteSong: null,
    favoriteAlbums: [],
    recommendations: [],
    ratings: [],
  };

  // Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeSearchType, setActiveSearchType] = useState<
    | "currentObsession"
    | "favoriteArtist"
    | "favoriteSong"
    | "album"
    | "recommendation"
    | "rating"
    | null
  >(null);
  const [showSearchDialog, setShowSearchDialog] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hoveredRating, setHoveredRating] = useState<{
    songId: string;
    rating: number;
  } | null>(null);
  const [editingItem, setEditingItem] = useState<any>(null);

  // Rating functionality
  const handleRatingHover = (songId: string, rating: number) => {
    setHoveredRating({ songId, rating });
  };

  const handleRatingLeave = () => {
    setHoveredRating(null);
  };

  const handleRatingClick = async (songId: string, rating: number) => {
    try {
      const song = safeMusicProfile.ratings.find(
        (r) => r.song.id === songId
      )?.song;
      if (song) {
        await addRating(song, rating);
      }
    } catch (error) {
      console.error("Error updating rating:", error);
      alert("Failed to update rating. Please try again.");
    }
  };

  // Horizontal scroll functionality
  const scrollContainerRefs = {
    favoriteAlbums: useRef<HTMLDivElement>(null),
    recommendations: useRef<HTMLDivElement>(null),
    ratings: useRef<HTMLDivElement>(null),
  };

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

  const renderInteractiveStars = (songId: string, currentRating: number) => {
    const displayRating =
      hoveredRating?.songId === songId ? hoveredRating.rating : currentRating;

    return Array.from({ length: 5 }, (_, i) => {
      const starValue = i + 1;
      const halfStarValue = i + 0.5;
      const isFullStar = displayRating >= starValue;
      const isHalfStar =
        displayRating >= halfStarValue && displayRating < starValue;

      return (
        <div key={i} className="relative inline-block">
          {/* Full star */}
          <Star
            className={`h-3 w-3 sm:h-4 sm:w-4 transition-colors ${
              isFullStar ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
            } ${!readOnly && isOwnProfile ? "cursor-pointer" : ""}`}
            onMouseEnter={
              !readOnly && isOwnProfile
                ? () => handleRatingHover(songId, starValue)
                : undefined
            }
            onMouseLeave={
              !readOnly && isOwnProfile ? handleRatingLeave : undefined
            }
            onClick={
              !readOnly && isOwnProfile
                ? () => handleRatingClick(songId, starValue)
                : undefined
            }
          />
          {/* Half star overlay */}
          {isHalfStar && (
            <div className="absolute inset-0 overflow-hidden">
              <Star
                className={`h-3 w-3 sm:h-4 sm:w-4 fill-yellow-400 text-yellow-400 ${
                  !readOnly && isOwnProfile ? "cursor-pointer" : ""
                }`}
                onMouseEnter={
                  !readOnly && isOwnProfile
                    ? () => handleRatingHover(songId, halfStarValue)
                    : undefined
                }
                onMouseLeave={
                  !readOnly && isOwnProfile ? handleRatingLeave : undefined
                }
                onClick={
                  !readOnly && isOwnProfile
                    ? () => handleRatingClick(songId, halfStarValue)
                    : undefined
                }
                style={{ clipPath: "inset(0 50% 0 0)" }}
              />
            </div>
          )}
        </div>
      );
    });
  };

  // Search functionality
  const handleSearch = async (
    query: string,
    searchType:
      | "currentObsession"
      | "favoriteArtist"
      | "favoriteSong"
      | "album"
      | "recommendation"
      | "rating"
  ) => {
    if (!query.trim()) return;

    setIsSearching(true);
    setSearchError(null);
    setActiveSearchType(searchType);

    try {
      // Map search types to API types
      let apiType: "song" | "artist" | "album" = "song";
      if (searchType === "favoriteArtist") {
        apiType = "artist";
      } else if (searchType === "album" || searchType === "recommendation") {
        apiType = "album";
      } else {
        apiType = "song";
      }

      const results = await searchMusic(query, apiType, 10);

      // Validate and sanitize search results
      const validatedResults = (results || []).map((item: any) => {
        // Extract clean name (could be song name or album name)
        let itemName = cleanTextContent(
          getTextContent(item.name || item.title)
        );

        // Extract clean artist name - try multiple sources
        let artistName = cleanTextContent(
          getTextContent(
            item.primaryArtists ||
              item.artist ||
              item.artists?.primary?.[0]?.name ||
              item.artists?.name ||
              item.featuredArtists ||
              item.singer ||
              ""
          )
        );

        // Extract clean album name
        const albumName = cleanTextContent(
          getTextContent(item.album?.name || item.album)
        );

        // For recommendations and albums, ensure we have proper separation
        if (searchType === "recommendation" || searchType === "album") {
          // If the item name contains artist info (e.g., "Still Here - Krsna"), separate them
          if (itemName && !artistName) {
            const nameParts = itemName.split(/[-–—]/);
            if (nameParts.length > 1) {
              itemName = nameParts[0].trim();
              artistName = nameParts.slice(1).join("-").trim();
            }
          }
        }

        return {
          id: item.id || `item-${Math.random()}`,
          name: itemName,
          title: itemName,
          primaryArtists: artistName,
          artist: artistName,
          album: albumName,
          image: item.image || [],
          type: item.type || apiType,
        };
      });

      setSearchResults(validatedResults);
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
      | "currentObsession"
      | "favoriteArtist"
      | "favoriteSong"
      | "album"
      | "recommendation"
      | "rating"
  ) => {
    if (!item || !item.id) {
      console.error("Invalid item selected:", item);
      return;
    }

    try {
      // Create a properly formatted item for Firebase storage
      let itemName = cleanTextContent(getTextContent(item.name || item.title));
      let artistName = cleanTextContent(
        getTextContent(
          item.primaryArtists ||
            item.artist ||
            item.artists?.primary?.[0]?.name ||
            item.artists?.name ||
            item.featuredArtists ||
            item.singer ||
            ""
        )
      );

      // For recommendations and albums, ensure proper separation
      if (searchType === "recommendation" || searchType === "album") {
        // If the item name contains artist info (e.g., "Still Here - Krsna"), separate them
        if (itemName && !artistName) {
          const nameParts = itemName.split(/[-–—]/);
          if (nameParts.length > 1) {
            itemName = nameParts[0].trim();
            artistName = nameParts.slice(1).join("-").trim();
          }
        }
      }

      const formattedItem = {
        id: item.id,
        name: itemName,
        title: itemName,
        primaryArtists: artistName,
        artist: artistName,
        album: cleanTextContent(getTextContent(item.album?.name || item.album)),
        image: item.image || [],
        type: item.type || "song",
      };

      switch (searchType) {
        case "currentObsession":
          await updateCurrentObsession(formattedItem);
          break;
        case "favoriteArtist":
          await updateFavoriteArtist(formattedItem);
          break;
        case "favoriteSong":
          await updateFavoriteSong(formattedItem);
          break;
        case "album":
          if (editingItem) {
            // Replace the specific album at its original position
            await replaceFavoriteAlbum(editingItem.id, formattedItem);
          } else {
            // Add new album
            await addFavoriteAlbum(formattedItem);
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
            await replaceRating(editingItem.id, formattedItem, 3); // Default 3-star rating
          } else {
            // Add new rating
            await addRating(formattedItem, 3); // Default 3-star rating
          }
          break;
      }
      setShowSearchDialog(false);
      setSearchQuery("");
      setSearchResults([]);
      setEditingItem(null); // Clear the editing item after operation
    } catch (error) {
      console.error("Error updating music profile:", error);
      alert("Failed to update music profile. Please try again.");
    }
  };

  const openSearchDialog = (
    searchType:
      | "currentObsession"
      | "favoriteArtist"
      | "favoriteSong"
      | "album"
      | "recommendation"
      | "rating",
    itemToReplace?: any
  ) => {
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
  const handleLikeClick = (song: any) => {
    // Add to favorites if not already there
    if (!safeMusicProfile.favoriteAlbums?.find((s) => s.id === song.id)) {
      addFavoriteAlbum(song);
    }
  };

  // Handle add to list click
  const handleAddToListClick = (song: any) => {
    // Add to recommendations if not already there
    if (!safeMusicProfile.recommendations?.find((s) => s.id === song.id)) {
      addRecommendation(song);
    }
  };

  const handleRemoveItem = async (
    type: "album" | "recommendation" | "rating",
    id: string
  ) => {
    if (!id) {
      console.error("Invalid ID for removal:", id);
      return;
    }

    try {
      switch (type) {
        case "album":
          await removeFavoriteAlbum(id);
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

  const renderStars = (rating: number) => {
    if (!rating || rating < 1 || rating > 5) return null;

    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-3 w-3 ${
          i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
        }`}
      />
    ));
  };

  // Show loading state
  if (loading) {
    return (
      <div className="space-y-5 max-w-5xl mx-auto">
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
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
            Error loading music profile: {error}
          </div>
          <Button onClick={() => window.location.reload()} variant="outline">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // Limit items to specified limits per section
  const limitedFavoriteAlbums =
    safeMusicProfile.favoriteAlbums?.slice(0, 5) || [];
  const limitedRecommendations = safeMusicProfile.recommendations || [];
  const limitedRatings = safeMusicProfile.ratings || [];

  // Show loading state while user is being authenticated
  if (userLoading || loading) {
    return (
      <div className="space-y-8 max-w-4xl mx-auto">
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-300 mx-auto mb-4"></div>
            <p className="text-sm text-muted-foreground">
              Loading music profile...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state if there's an authentication error
  if (
    error &&
    (error.includes("not authenticated") || error.includes("permission"))
  ) {
    return (
      <div className="space-y-8 max-w-4xl mx-auto">
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">
              {error.includes("permission")
                ? "Authentication issue detected. Please refresh the page or sign in again."
                : "Please sign in to view your music profile"}
            </p>
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.reload()}
              >
                Refresh Page
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Force re-fetch by updating the key
                  window.location.reload();
                }}
              >
                Retry
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 max-w-4xl mx-auto px-4 sm:px-4 md:px-6 lg:px-0">
      {/* Top row - 3 sections in grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6 lg:gap-8 max-w-4xl mx-auto">
        {/* current obsession - card */}
        <div className="flex flex-col">
          <div className="flex items-center justify-center md:justify-start mb-2">
            <p className="text-xs sm:text-sm font-medium text-muted-foreground">
              current obsession
            </p>
          </div>
          <div className="flex flex-col items-start flex-1">
            {safeMusicProfile.currentObsession ? (
              <>
                <div className="relative group">
                  <div className="w-full aspect-square max-w-[200px] mx-auto bg-muted rounded-md overflow-hidden">
                    <Image
                      src={
                        getImageUrl(safeMusicProfile.currentObsession.image) ||
                        PLACEHOLDER.currentObsession.cover
                      }
                      alt={
                        getTextContent(
                          safeMusicProfile.currentObsession?.name
                        ) || PLACEHOLDER.currentObsession.title
                      }
                      width={256}
                      height={256}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = PLACEHOLDER.currentObsession.cover;
                      }}
                    />
                  </div>
                  {!readOnly && isOwnProfile && (
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-md flex items-center justify-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 bg-white/20 hover:bg-white/30 text-white"
                        onClick={() => openSearchDialog("currentObsession")}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
                <div className="mt-3 sm:mt-4 text-center sm:text-right w-full px-2">
                  <p className="text-base sm:text-sm md:text-lg font-semibold leading-tight line-clamp-2 min-h-[2rem] sm:min-h-[1.5rem]">
                    {getTextContent(safeMusicProfile.currentObsession.name) ||
                      "Unknown Song"}
                  </p>
                  <p className="text-sm sm:text-xs md:text-sm text-muted-foreground leading-tight mt-1 sm:mt-1.5 line-clamp-1">
                    {getTextContent(
                      safeMusicProfile.currentObsession.primaryArtists ||
                        safeMusicProfile.currentObsession.artists?.primary
                          ?.map((artist: any) => artist.name)
                          .join(", ") ||
                        "Unknown Artist"
                    )}
                  </p>
                </div>
              </>
            ) : (
              <>
                <div
                  className={`w-full aspect-square max-w-[200px] mx-auto bg-black/20 rounded-md border border-border/30 flex items-center justify-center transition-all duration-200 group ${
                    isOwnProfile && !readOnly
                      ? "cursor-pointer hover:bg-black/30 hover:border-border/60 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background animate-pulse"
                      : "opacity-60"
                  }`}
                  onClick={
                    isOwnProfile && !readOnly
                      ? () => openSearchDialog("currentObsession")
                      : undefined
                  }
                  tabIndex={isOwnProfile && !readOnly ? 0 : -1}
                  onKeyDown={
                    isOwnProfile && !readOnly
                      ? (e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            openSearchDialog("currentObsession");
                          }
                        }
                      : undefined
                  }
                >
                  <div className="text-center">
                    <Plus className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50 group-hover:text-muted-foreground/70 group-hover:scale-110 transition-all duration-200" />
                    <p className="text-sm text-muted-foreground/50 group-hover:text-muted-foreground/70 transition-colors">
                      Add Current Obsession
                    </p>
                    {isOwnProfile && !readOnly && (
                      <p className="text-xs text-muted-foreground/40 group-hover:text-muted-foreground/60 transition-colors">
                        Click to search
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-3 sm:mt-4 text-center sm:text-right w-full px-2">
                  <p className="text-base sm:text-sm md:text-lg font-semibold leading-tight text-muted-foreground/50 line-clamp-2 min-h-[2rem] sm:min-h-[1.5rem]">
                    Song Name
                  </p>
                  <p className="text-sm sm:text-xs md:text-sm text-muted-foreground/50 leading-tight mt-1 sm:mt-1.5 line-clamp-1">
                    Artist Name
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* favorite artist - circle */}
        <div className="flex flex-col">
          <div className="flex items-center justify-center md:justify-start mb-2">
            <p className="text-xs sm:text-sm font-medium text-muted-foreground">
              favorite artist
            </p>
          </div>
          <div className="flex flex-col items-start flex-1">
            {safeMusicProfile.favoriteArtist ? (
              <>
                <div className="relative group">
                  <div className="w-full aspect-square max-w-[200px] mx-auto rounded-full overflow-hidden border-2 border-border/30 shadow-sm">
                    <Image
                      src={
                        getImageUrl(safeMusicProfile.favoriteArtist.image) ||
                        PLACEHOLDER.favoriteArtist.avatar
                      }
                      alt={
                        getTextContent(safeMusicProfile.favoriteArtist?.name) ||
                        PLACEHOLDER.favoriteArtist.name
                      }
                      width={256}
                      height={256}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = PLACEHOLDER.favoriteArtist.avatar;
                      }}
                    />
                  </div>
                  {!readOnly && isOwnProfile && (
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-full flex items-center justify-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 bg-white/20 hover:bg-white/30 text-white"
                        onClick={() => openSearchDialog("favoriteArtist")}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
                <div className="mt-3 sm:mt-4 text-center sm:text-right w-full px-2">
                  <p className="text-base sm:text-sm md:text-lg font-semibold leading-tight line-clamp-2 min-h-[2rem] sm:min-h-[1.5rem]">
                    {getTextContent(safeMusicProfile.favoriteArtist?.name) ||
                      PLACEHOLDER.favoriteArtist.name}
                  </p>
                </div>
              </>
            ) : (
              <>
                <div
                  className={`w-full aspect-square max-w-[200px] mx-auto rounded-full bg-black/20 border-2 border-border/30 shadow-sm flex items-center justify-center transition-all duration-200 group ${
                    isOwnProfile && !readOnly
                      ? "cursor-pointer hover:bg-black/30 hover:border-border/60 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background animate-pulse"
                      : "opacity-60"
                  }`}
                  onClick={
                    isOwnProfile && !readOnly
                      ? () => openSearchDialog("favoriteArtist")
                      : undefined
                  }
                  tabIndex={isOwnProfile && !readOnly ? 0 : -1}
                  onKeyDown={
                    isOwnProfile && !readOnly
                      ? (e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            openSearchDialog("favoriteArtist");
                          }
                        }
                      : undefined
                  }
                >
                  <div className="text-center">
                    <Plus className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50 group-hover:text-muted-foreground/70 group-hover:scale-110 transition-all duration-200" />
                    <p className="text-sm text-muted-foreground/50 group-hover:text-muted-foreground/70 transition-colors">
                      Add Favorite Artist
                    </p>
                    {isOwnProfile && !readOnly && (
                      <p className="text-xs text-muted-foreground/40 group-hover:text-muted-foreground/60 transition-colors">
                        Click to search
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-3 sm:mt-4 text-center sm:text-right w-full px-2">
                  <p className="text-base sm:text-sm md:text-lg font-medium leading-tight text-muted-foreground/50 line-clamp-2 min-h-[2rem] sm:min-h-[1.5rem]">
                    Artist Name
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* favorite song */}
        <div className="flex flex-col">
          <div className="flex items-center justify-center md:justify-start mb-2">
            <p className="text-xs sm:text-sm font-medium text-muted-foreground">
              favorite song
            </p>
          </div>
          <div className="flex flex-col items-start flex-1">
            {safeMusicProfile.favoriteSong ? (
              <>
                <div className="relative group">
                  <div className="w-full aspect-square max-w-[200px] mx-auto bg-muted rounded-md overflow-hidden">
                    <Image
                      src={
                        getImageUrl(safeMusicProfile.favoriteSong.image) ||
                        PLACEHOLDER.favoriteSong.cover
                      }
                      alt={
                        getTextContent(safeMusicProfile.favoriteSong?.name) ||
                        PLACEHOLDER.favoriteSong.title
                      }
                      width={256}
                      height={256}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = PLACEHOLDER.favoriteSong.cover;
                      }}
                    />
                  </div>
                  {!readOnly && isOwnProfile && (
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-md flex items-center justify-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 bg-white/20 hover:bg-white/30 text-white"
                        onClick={() => openSearchDialog("favoriteSong")}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
                <div className="mt-3 sm:mt-4 text-center sm:text-right w-full px-2">
                  <p className="text-base sm:text-sm md:text-lg font-semibold leading-tight line-clamp-2 min-h-[2rem] sm:min-h-[1.5rem]">
                    {getTextContent(safeMusicProfile.favoriteSong.name) ||
                      "Unknown Song"}
                  </p>
                  <p className="text-sm sm:text-xs md:text-sm text-muted-foreground leading-tight mt-1 sm:mt-1.5 line-clamp-1">
                    {getTextContent(
                      safeMusicProfile.favoriteSong.primaryArtists ||
                        safeMusicProfile.favoriteSong.artists?.primary
                          ?.map((artist: any) => artist.name)
                          .join(", ") ||
                        "Unknown Artist"
                    )}
                  </p>
                </div>
              </>
            ) : (
              <>
                <div
                  className={`w-full aspect-square max-w-[200px] mx-auto bg-black/20 rounded-md border border-border/30 flex items-center justify-center transition-all duration-200 group ${
                    isOwnProfile && !readOnly
                      ? "cursor-pointer hover:bg-black/30 hover:border-border/60 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background animate-pulse"
                      : "opacity-60"
                  }`}
                  onClick={
                    isOwnProfile && !readOnly
                      ? () => openSearchDialog("favoriteSong")
                      : undefined
                  }
                  tabIndex={isOwnProfile && !readOnly ? 0 : -1}
                  onKeyDown={
                    isOwnProfile && !readOnly
                      ? (e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            openSearchDialog("favoriteSong");
                          }
                        }
                      : undefined
                  }
                >
                  <div className="text-center">
                    <Plus className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50 group-hover:text-muted-foreground/70 group-hover:scale-110 transition-all duration-200" />
                    <p className="text-sm text-muted-foreground/50 group-hover:text-muted-foreground/70 transition-colors">
                      Add Favorite Song
                    </p>
                    {isOwnProfile && !readOnly && (
                      <p className="text-xs text-muted-foreground/40 group-hover:text-muted-foreground/60 transition-colors">
                        Click to search
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-3 sm:mt-4 text-center sm:text-left w-full px-2">
                  <p className="text-base sm:text-sm md:text-lg font-semibold leading-tight text-muted-foreground/50 line-clamp-2 min-h-[2rem] sm:min-h-[1.5rem]">
                    Song Name
                  </p>
                  <p className="text-sm sm:text-xs md:text-sm text-muted-foreground/50 leading-tight mt-1 sm:mt-1.5 line-clamp-1">
                    Artist Name
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Bottom row - favorite albums aligned with top grid */}
      <div className="max-w-4xl mx-auto">
        {/* favorite albums - takes first column */}
        <div className="w-full">
          <div className="flex items-center justify-center md:justify-start mb-4">
            <p className="text-xs sm:text-sm font-medium text-muted-foreground">
              favorite albums
            </p>
          </div>
          <div className="relative">
            <div
              ref={scrollContainerRefs.favoriteAlbums}
              className="flex justify-start gap-3 sm:gap-4 overflow-x-auto scrollbar-hide max-w-full mx-auto touch-pan-x"
            >
              {limitedFavoriteAlbums.length > 0 ? (
                <>
                  {limitedFavoriteAlbums.map((album, idx) => (
                    <div
                      key={album.id || idx}
                      className="relative group flex-shrink-0"
                    >
                      <div className="aspect-square w-24 sm:w-28 md:w-32 bg-muted rounded-md overflow-hidden">
                        <Link href={`/music/album/${album.id}`}>
                          <Image
                            src={
                              getImageUrl(album.image) ||
                              PLACEHOLDER.favoriteAlbums[0].cover
                            }
                            alt={album.name || "Album"}
                            width={192}
                            height={192}
                            className="w-full h-full object-cover cursor-pointer"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = PLACEHOLDER.favoriteAlbums[0].cover;
                            }}
                          />
                        </Link>
                        {!readOnly && isOwnProfile && (
                          <div className="absolute top-2 right-2 flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 bg-black/50 hover:bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => openSearchDialog("album", album)}
                              title="Replace album"
                            >
                              <Edit className="h-3 w-3 text-white" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 bg-red-600/80 hover:bg-red-700/90 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() =>
                                handleRemoveItem("album", album.id)
                              }
                              title="Delete album"
                            >
                              <Trash2 className="h-3 w-3 text-white" />
                            </Button>
                          </div>
                        )}
                      </div>
                      {/* Album name and artist display */}
                      <div className="mt-3 sm:mt-4 text-center sm:text-right w-full px-2">
                        <p className="text-base sm:text-sm md:text-lg font-semibold leading-tight line-clamp-2 min-h-[2rem] sm:min-h-[1.5rem]">
                          {truncateTitle(getTextContent(album.name))}
                        </p>
                        <p className="text-sm sm:text-xs md:text-sm text-muted-foreground leading-tight mt-1 sm:mt-1.5 line-clamp-1">
                          {getTextContent(
                            album.primaryArtists ||
                              album.artists?.primary
                                ?.map((artist: any) => artist.name)
                                .join(", ") ||
                              album.artist ||
                              album.featuredArtists ||
                              album.singer ||
                              "Unknown Artist"
                          )}
                        </p>
                      </div>
                    </div>
                  ))}

                  {/* Add button - only show when less than 5 items */}
                  {limitedFavoriteAlbums.length < 5 &&
                    isOwnProfile &&
                    !readOnly && (
                      <div className="flex-shrink-0">
                        <div className="aspect-square w-24 sm:w-28 md:w-32 bg-transparent rounded-md border-2 border-gray-600 flex items-center justify-center overflow-visible">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-12 w-12 p-0 bg-black/70 hover:bg-black/90 text-white rounded-full border-2 border-white/20 shadow-lg"
                            onClick={() => openSearchDialog("album")}
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
                  <div className="aspect-square w-28 sm:w-32 bg-transparent rounded-md border-2 border-gray-600 flex flex-col items-center justify-center mb-3">
                    <p className="text-sm text-gray-400 mb-1 text-center">
                      Add
                    </p>
                    <p className="text-xs text-gray-500 text-center">
                      No favorite albums
                    </p>
                  </div>
                  {!readOnly && isOwnProfile && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => openSearchDialog("album")}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add Album
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* recommendations */}
      <div className="mt-8 sm:mt-12 max-w-4xl mx-auto">
        <div className="flex items-center justify-center md:justify-start mb-4">
          <p className="text-xs sm:text-sm font-medium text-muted-foreground">
            recommendations
          </p>
        </div>
        <div className="relative">
          <div
            ref={scrollContainerRefs.recommendations}
            className="flex justify-start gap-3 sm:gap-6 overflow-x-auto scrollbar-hide px-2 sm:px-0 touch-pan-x"
          >
            {limitedRecommendations.length > 0 ? (
              <>
                {limitedRecommendations.map((song, idx) => (
                  <div
                    key={song.id || idx}
                    className="relative group flex-shrink-0"
                  >
                    <div className="aspect-square w-32 sm:w-36 md:w-40 bg-muted rounded-md overflow-hidden">
                      <Link href={`/music/song/${song.id}`}>
                        <Image
                          src={
                            getImageUrl(song.image) ||
                            PLACEHOLDER.recommendations[0].cover
                          }
                          alt={song.name || "Song"}
                          width={192}
                          height={192}
                          className="w-full h-full object-cover cursor-pointer"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = PLACEHOLDER.recommendations[0].cover;
                          }}
                        />
                      </Link>
                      {!readOnly && isOwnProfile && (
                        <div className="absolute top-2 right-2 flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 bg-black/50 hover:bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() =>
                              openSearchDialog("recommendation", song)
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
                              handleRemoveItem("recommendation", song.id)
                            }
                            title="Delete recommendation"
                          >
                            <Trash2 className="h-3 w-3 text-white" />
                          </Button>
                        </div>
                      )}
                    </div>
                    {/* Song name and artist display */}
                    <div className="mt-3 sm:mt-4 text-center sm:text-right w-full px-2">
                      <p className="text-base sm:text-sm md:text-lg font-semibold leading-tight line-clamp-2 min-h-[2rem] sm:min-h-[1.5rem]">
                        {truncateTitle(getTextContent(song.name))}
                      </p>
                      <p className="text-sm sm:text-xs md:text-sm text-muted-foreground leading-tight mt-1 sm:mt-1.5 line-clamp-1">
                        {getTextContent(
                          song.primaryArtists ||
                            song.artists?.primary
                              ?.map((artist: any) => artist.name)
                              .join(", ") ||
                            song.artist ||
                            song.featuredArtists ||
                            song.singer ||
                            "Unknown Artist"
                        )}
                      </p>
                    </div>
                  </div>
                ))}

                {/* Add button for subsequent items - always show when items exist */}
                {isOwnProfile && !readOnly && (
                  <div className="flex-shrink-0">
                    <div className="aspect-square w-32 sm:w-36 md:w-40 bg-transparent rounded-md border-2 border-gray-600 flex items-center justify-center overflow-visible">
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
                )}
              </>
            ) : (
              // Show placeholder items when empty
              <div className="flex flex-col items-center justify-center min-h-[200px]">
                <div className="aspect-square w-32 sm:w-36 md:w-40 bg-transparent rounded-md border-2 border-gray-600 flex flex-col items-center justify-center mb-3">
                  <p className="text-xs text-gray-500 text-center">
                    No recommendations
                  </p>
                </div>
                {!readOnly && isOwnProfile && (
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

      {/* rating */}
      <div className="mt-8 sm:mt-12 max-w-4xl mx-auto">
        <div className="flex items-center justify-center md:justify-start mb-4">
          <p className="text-xs sm:text-sm font-medium text-muted-foreground">
            rating
          </p>
        </div>
        <div className="relative">
          <div
            ref={scrollContainerRefs.ratings}
            className="flex justify-start gap-3 sm:gap-6 overflow-x-auto scrollbar-hide px-2 sm:px-0 touch-pan-x"
          >
            {limitedRatings.length > 0 ? (
              <>
                {limitedRatings.map((rating, idx) => (
                  <div
                    key={rating.song.id || idx}
                    className="relative group flex-shrink-0"
                  >
                    <div className="aspect-square w-32 sm:w-40 bg-muted rounded-md overflow-hidden">
                      <Link href={`/music/song/${rating.song.id}`}>
                        <Image
                          src={
                            getImageUrl(rating.song.image) ||
                            PLACEHOLDER.ratings[0].cover
                          }
                          alt={rating.song.name || "Song"}
                          width={192}
                          height={192}
                          className="w-full h-full object-cover cursor-pointer"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = PLACEHOLDER.ratings[0].cover;
                          }}
                        />
                      </Link>
                      {!readOnly && isOwnProfile && (
                        <div className="absolute top-2 right-2 flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 bg-black/50 hover:bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() =>
                              openSearchDialog("rating", rating.song)
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
                              handleRemoveItem("rating", rating.song.id)
                            }
                            title="Delete rating"
                          >
                            <Trash2 className="h-3 w-3 text-white" />
                          </Button>
                        </div>
                      )}
                    </div>
                    {/* Rating stars below image */}
                    <div className="mt-2 flex justify-center">
                      {renderInteractiveStars(rating.song.id, rating.rating)}
                    </div>
                    {/* Song and artist name display below rating */}
                    <div className="mt-2 sm:mt-3 text-center sm:text-right w-full px-2">
                      <p className="text-base sm:text-sm md:text-lg font-semibold leading-tight line-clamp-2 min-h-[2rem] sm:min-h-[1.5rem]">
                        {getTextContent(rating.song.name) || "Unknown Song"}
                      </p>
                      <p className="text-sm sm:text-xs md:text-sm text-muted-foreground leading-tight mt-1 sm:mt-1.5 line-clamp-1">
                        {getTextContent(
                          rating.song.primaryArtists ||
                            rating.song.artist ||
                            rating.song.artists?.primary
                              ?.map((artist: any) => artist.name)
                              .join(", ") ||
                            "Unknown Artist"
                        )}
                      </p>
                    </div>
                  </div>
                ))}

                {/* Add button for subsequent items - always show when items exist */}
                {isOwnProfile && !readOnly && (
                  <div className="flex-shrink-0">
                    <div className="aspect-square w-40 bg-transparent rounded-md border-2 border-gray-600 flex items-center justify-center overflow-visible">
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
                )}
              </>
            ) : (
              // Show placeholder items when empty
              <div className="flex flex-col items-center justify-center min-h-[200px]">
                <div className="aspect-square w-40 bg-transparent rounded-md border-2 border-gray-600 flex flex-col items-center justify-center mb-3">
                  <p className="text-xs text-gray-500 text-center">
                    No ratings
                  </p>
                </div>
                {!readOnly && isOwnProfile && (
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
              {editingItem ? "Replace" : "Search"}{" "}
              {activeSearchType === "favoriteArtist"
                ? "Artists"
                : activeSearchType === "album"
                ? "Albums"
                : activeSearchType === "currentObsession"
                ? "Current Obsession"
                : activeSearchType === "favoriteSong"
                ? "Favorite Song"
                : activeSearchType === "recommendation"
                ? "Albums for Recommendations"
                : activeSearchType === "rating"
                ? "Ratings"
                : "Songs"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder={`Search ${
                    activeSearchType === "favoriteArtist"
                      ? "artists"
                      : activeSearchType === "album"
                      ? "albums"
                      : activeSearchType === "currentObsession"
                      ? "songs for current obsession"
                      : activeSearchType === "favoriteSong"
                      ? "songs for favorite song"
                      : activeSearchType === "recommendation"
                      ? "albums for recommendations"
                      : activeSearchType === "rating"
                      ? "ratings"
                      : "songs"
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
                    <div className="w-12 h-12 rounded-md overflow-hidden flex-shrink-0">
                      <Image
                        src={getImageUrl(item.image) || "/placeholder.svg"}
                        alt={
                          getTextContent(item.name || item.title) ||
                          "Music item"
                        }
                        width={48}
                        height={48}
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
                        {cleanTextContent(
                          getTextContent(
                            item.primaryArtists ||
                              item.artist ||
                              item.artists?.primary
                                ?.map((artist: any) => artist.name)
                                .join(", ") ||
                              item.album
                          )
                        ) || "Unknown Artist"}
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
