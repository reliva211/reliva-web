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
      const lowQualityImage = image.find(
        (img) => img?.quality === "50x50" || img?.quality === "low"
      );

      return (
        highQualityImage?.url ||
        mediumQualityImage?.url ||
        lowQualityImage?.url ||
        image[0]?.url ||
        "/placeholder.svg"
      );
    }
    if (image && typeof image === "object") {
      return image.url || image.src || "/placeholder.svg";
    }
    return "/placeholder.svg";
  } catch (error) {
    console.error("Error extracting image URL:", error);
    return "/placeholder.svg";
  }
};

// Helper function to safely extract text content
const getTextContent = (text: any): string => {
  if (!text) return "";
  if (typeof text === "string") return cleanTextContent(text);
  if (typeof text === "object" && text.name) return cleanTextContent(text.name);
  if (typeof text === "object" && text.title)
    return cleanTextContent(text.title);
  return "";
};

// Helper function to truncate long titles
const truncateTitle = (title: string, maxLength: number = 25): string => {
  if (!title || title.length <= maxLength) return title;
  return title.substring(0, maxLength).trim() + "...";
};

export default function ProfileMusicSection({
  userId,
  readOnly = false,
}: ProfileMusicSectionProps) {
  const { user: currentUser, loading: userLoading } = useCurrentUser();
  const {
    musicProfile,
    loading,
    error,
    updateCurrentObsession,
    updateFavoriteArtist,
    updateFavoriteSong,
    addFavoriteAlbum,
    addRecommendation,
    addRating,
    removeFavoriteAlbum,
    removeRecommendation,
    removeRating,
    searchMusic,
  } = useMusicProfile(userId);

  // Local state
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [activeSearchType, setActiveSearchType] = useState<string>("");
  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  // Rating functionality
  const [hoveredRating, setHoveredRating] = useState<{
    songId: string;
    rating: number;
  } | null>(null);

  // Debug dialog state
  useEffect(() => {
    console.log("Dialog state changed:", {
      isSearchDialogOpen,
      activeSearchType,
      searchQuery,
    });
  }, [isSearchDialogOpen, activeSearchType, searchQuery]);

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
            } ${
              !readOnly && currentUser?.uid === userId ? "cursor-pointer" : ""
            }`}
            onMouseEnter={
              !readOnly && currentUser?.uid === userId
                ? () => setHoveredRating({ songId, rating: starValue })
                : undefined
            }
            onMouseLeave={
              !readOnly && currentUser?.uid === userId
                ? () => setHoveredRating(null)
                : undefined
            }
            onClick={
              !readOnly && currentUser?.uid === userId
                ? () => handleRatingClick(songId, starValue)
                : undefined
            }
          />
          {/* Half star overlay */}
          {isHalfStar && (
            <div className="absolute inset-0 overflow-hidden">
              <Star
                className={`h-3 w-3 sm:h-4 sm:w-4 fill-yellow-400 text-yellow-400 ${
                  !readOnly && currentUser?.uid === userId
                    ? "cursor-pointer"
                    : ""
                }`}
                onMouseEnter={
                  !readOnly && currentUser?.uid === userId
                    ? () => setHoveredRating({ songId, rating: halfStarValue })
                    : undefined
                }
                onMouseLeave={
                  !readOnly && currentUser?.uid === userId
                    ? () => setHoveredRating(null)
                    : undefined
                }
                onClick={
                  !readOnly && currentUser?.uid === userId
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

    console.log("Starting search for:", query, "Type:", searchType);
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

      console.log("Searching with API type:", apiType);
      const results = await searchMusic(query, apiType, 10);
      console.log("Search results:", results);

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

      console.log("Validated results:", validatedResults);
      setSearchResults(validatedResults);
    } catch (error) {
      console.error("Search error:", error);
      setSearchError(
        `Failed to search: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsSearching(false);
    }
  };

  const openSearchDialog = (searchType: string, itemToReplace?: any) => {
    console.log("openSearchDialog called with:", searchType, itemToReplace);
    setActiveSearchType(searchType);
    setEditingItem(itemToReplace);
    setSearchQuery("");
    setSearchResults([]);
    setSearchError(null);
    setIsSearchDialogOpen(true);
    console.log("Search dialog state set to true");
    console.log("Dialog should now be open. State:", {
      isSearchDialogOpen: true,
      activeSearchType: searchType,
    });
  };

  const handleAddItem = async (item: any) => {
    console.log("handleAddItem called with:", item, "Type:", activeSearchType);
    try {
      let success = false;

      switch (activeSearchType) {
        case "currentObsession":
          console.log("Updating current obsession with:", item);
          await updateCurrentObsession(item);
          success = true;
          break;
        case "favoriteArtist":
          await updateFavoriteArtist(item);
          success = true;
          break;
        case "favoriteSong":
          await updateFavoriteSong(item);
          success = true;
          break;
        case "album":
          await addFavoriteAlbum(item);
          success = true;
          break;
        case "recommendation":
          await addRecommendation(item);
          success = true;
          break;
        case "rating":
          await addRating(item, 5);
          success = true;
          break;
      }

      if (success) {
        setIsSearchDialogOpen(false);
        setSearchQuery("");
        setSearchResults([]);
        setEditingItem(null);
      }
    } catch (error) {
      console.error("Error adding item:", error);
    }
  };

  const handleRemoveItem = async (type: string, itemId: string) => {
    try {
      switch (type) {
        case "album":
          await removeFavoriteAlbum(itemId);
          break;
        case "recommendation":
          await removeRecommendation(itemId);
          break;
        case "rating":
          await removeRating(itemId);
          break;
        default:
          console.warn("Unknown item type:", type);
      }
    } catch (error) {
      console.error("Error removing item:", error);
    }
  };

  const handleRatingClick = async (songId: string, rating: number) => {
    try {
      const song = musicProfile?.ratings?.find(
        (r) => r.song.id === songId
      )?.song;
      if (song) {
        await addRating(song, rating);
      }
    } catch (error) {
      console.error("Error updating rating:", error);
    }
  };

  // Safe access to music profile data
  const safeMusicProfile = musicProfile || {
    currentObsession: null,
    favoriteArtist: null,
    favoriteSong: null,
    favoriteAlbums: [],
    recommendations: [],
    ratings: [],
  };

  const isOwnProfile = currentUser?.uid === userId;

  // Debug: Monitor search dialog state changes
  useEffect(() => {
    console.log("Search dialog state changed:", isSearchDialogOpen);
  }, [isSearchDialogOpen]);

  // Debug: Monitor component props and state
  useEffect(() => {
    console.log("Component props:", { userId, readOnly, isOwnProfile });
    console.log("Current search dialog state:", isSearchDialogOpen);
  }, [userId, readOnly, isOwnProfile, isSearchDialogOpen]);

  // Show loading state
  if (userLoading || loading) {
    return (
      <div className="w-full max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto"></div>
            <p className="text-gray-400 text-lg">Loading music profile...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="w-full max-w-6xl mx-auto px-4 py-8">
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Heart className="h-8 w-8 text-red-400" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">
            Error loading music profile
          </h3>
          <p className="text-gray-300 mb-6">{error}</p>
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            className="bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Limit items to specified limits per section
  const limitedFavoriteAlbums =
    safeMusicProfile.favoriteAlbums?.slice(0, 4) || [];
  const limitedRecommendations = safeMusicProfile.recommendations || [];
  const limitedRatings = safeMusicProfile.ratings || [];

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-6 sm:py-8">
      {/* Main Content Grid - Responsive Layout */}
      <div className="space-y-6 sm:space-y-8">
        {/* Top Row - Current Obsession, Favorite Artist, Favorite Song */}
        <div className="flex flex-col sm:flex-row gap-8 sm:gap-16 items-start justify-start">
          {/* Current Obsession */}
          <div className="flex flex-col w-full sm:w-auto sm:flex-1 sm:max-w-[200px]">
            <h3 className="text-base sm:text-lg font-semibold text-white mb-3 flex items-center gap-2">
              current obsession
              {!readOnly && isOwnProfile && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                  onClick={() => openSearchDialog("currentObsession")}
                  title="Edit current obsession"
                >
                  <Edit className="h-3 w-3" />
                </Button>
              )}
            </h3>
            <div className="flex-1">
              {safeMusicProfile.currentObsession ? (
                <div
                  className={`group relative ${
                    !readOnly && isOwnProfile
                      ? "cursor-pointer hover:scale-[1.02] transition-transform duration-200"
                      : ""
                  }`}
                  onClick={
                    !readOnly && isOwnProfile
                      ? (e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log("Current obsession section clicked!");
                          openSearchDialog("currentObsession");
                        }
                      : undefined
                  }
                >
                  <div className="aspect-square w-full max-w-[200px] bg-muted rounded-lg overflow-hidden shadow-lg">
                    <Image
                      src={
                        getImageUrl(safeMusicProfile.currentObsession.image) ||
                        PLACEHOLDER.currentObsession.cover
                      }
                      alt={getTextContent(
                        safeMusicProfile.currentObsession?.name
                      )}
                      width={200}
                      height={200}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = PLACEHOLDER.currentObsession.cover;
                      }}
                    />
                    {!readOnly && isOwnProfile && (
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-10 w-10 p-0 bg-white/20 hover:bg-white/30 text-white"
                          onClick={(e) => {
                            e.stopPropagation();
                            openSearchDialog("currentObsession");
                          }}
                        >
                          <Edit className="h-5 w-5" />
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className="mt-3 text-left">
                    <p className="text-base sm:text-lg font-semibold text-white leading-tight line-clamp-2 hover:text-emerald-300 transition-colors">
                      {getTextContent(safeMusicProfile.currentObsession.name)}
                    </p>
                    <p className="text-sm text-gray-400 leading-tight mt-1 line-clamp-1">
                      {getTextContent(
                        safeMusicProfile.currentObsession.primaryArtists ||
                          safeMusicProfile.currentObsession.artists?.primary
                            ?.map((artist: any) => artist.name)
                            .join(", ")
                      )}
                    </p>
                  </div>
                </div>
              ) : (
                <div
                  className={`aspect-square w-full max-w-[200px] bg-black/20 rounded-lg border-2 border-gray-600 flex items-center justify-center transition-all duration-200 group ${
                    isOwnProfile && !readOnly
                      ? "cursor-pointer hover:bg-black/30 hover:border-gray-500 hover:shadow-lg hover:scale-[1.02]"
                      : "opacity-60"
                  }`}
                  onClick={
                    isOwnProfile && !readOnly
                      ? (e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log("Current obsession placeholder clicked!");
                          console.log("Click conditions:", {
                            isOwnProfile,
                            readOnly,
                            currentUser: currentUser?.uid,
                            userId,
                          });
                          openSearchDialog("currentObsession");
                        }
                      : undefined
                  }
                >
                  <div className="text-center">
                    <Plus className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                    <p className="text-sm text-gray-400">
                      Add Current Obsession
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Favorite Artist */}
          <div className="flex flex-col w-full sm:w-auto sm:flex-1 sm:max-w-[200px]">
            <h3 className="text-base sm:text-lg font-semibold text-white mb-3 flex items-center gap-2">
              favorite artist
              {!readOnly && isOwnProfile && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                  onClick={() => openSearchDialog("favoriteArtist")}
                  title="Edit favorite artist"
                >
                  <Edit className="h-3 w-3" />
                </Button>
              )}
            </h3>
            <div className="flex-1">
              {safeMusicProfile.favoriteArtist ? (
                <div
                  className={`group relative ${
                    !readOnly && isOwnProfile
                      ? "cursor-pointer hover:scale-[1.02] transition-transform duration-200"
                      : ""
                  }`}
                  onClick={
                    !readOnly && isOwnProfile
                      ? () => {
                          console.log("Favorite artist section clicked!");
                          openSearchDialog("favoriteArtist");
                        }
                      : undefined
                  }
                >
                  <div className="aspect-square w-full max-w-[200px] rounded-full overflow-hidden border-2 border-gray-600 shadow-lg">
                    <Image
                      src={
                        getImageUrl(safeMusicProfile.favoriteArtist.image) ||
                        PLACEHOLDER.favoriteArtist.avatar
                      }
                      alt={getTextContent(
                        safeMusicProfile.favoriteArtist?.name
                      )}
                      width={200}
                      height={200}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = PLACEHOLDER.favoriteArtist.avatar;
                      }}
                    />
                    {!readOnly && isOwnProfile && (
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-full flex items-center justify-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-10 w-10 p-0 bg-white/20 hover:bg-white/30 text-white"
                          onClick={(e) => {
                            e.stopPropagation();
                            openSearchDialog("favoriteArtist");
                          }}
                        >
                          <Edit className="h-5 w-5" />
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className="mt-3 text-left">
                    <p className="text-base sm:text-lg font-semibold text-white leading-tight line-clamp-2 hover:text-emerald-300 transition-colors">
                      {getTextContent(safeMusicProfile.favoriteArtist?.name)}
                    </p>
                  </div>
                </div>
              ) : (
                <div
                  className={`aspect-square w-full max-w-[200px] bg-black/20 rounded-full border-2 border-gray-600 flex items-center justify-center transition-all duration-200 group ${
                    isOwnProfile && !readOnly
                      ? "cursor-pointer hover:bg-black/30 hover:border-gray-500 hover:shadow-lg hover:scale-[1.02]"
                      : "opacity-60"
                  }`}
                  onClick={
                    isOwnProfile && !readOnly
                      ? () => {
                          console.log("Favorite artist placeholder clicked!");
                          openSearchDialog("favoriteArtist");
                        }
                      : undefined
                  }
                >
                  <div className="text-center">
                    <Plus className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                    <p className="text-sm text-gray-400">Add Favorite Artist</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Favorite Song */}
          <div className="flex flex-col w-full sm:w-auto sm:flex-1 sm:max-w-[200px]">
            <h3 className="text-base sm:text-lg font-semibold text-white mb-3 flex items-center gap-2">
              favorite song
              {!readOnly && isOwnProfile && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                  onClick={() => openSearchDialog("favoriteSong")}
                  title="Edit favorite song"
                >
                  <Edit className="h-3 w-3" />
                </Button>
              )}
            </h3>
            <div className="flex-1">
              {safeMusicProfile.favoriteSong ? (
                <div
                  className={`group relative ${
                    !readOnly && isOwnProfile
                      ? "cursor-pointer hover:scale-[1.02] transition-transform duration-200"
                      : ""
                  }`}
                  onClick={
                    !readOnly && isOwnProfile
                      ? () => {
                          console.log("Favorite song section clicked!");
                          openSearchDialog("favoriteSong");
                        }
                      : undefined
                  }
                >
                  <div className="aspect-square w-full max-w-[200px] bg-muted rounded-lg overflow-hidden shadow-lg">
                    <Image
                      src={
                        getImageUrl(safeMusicProfile.favoriteSong.image) ||
                        PLACEHOLDER.favoriteSong.cover
                      }
                      alt={getTextContent(safeMusicProfile.favoriteSong?.name)}
                      width={200}
                      height={200}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = PLACEHOLDER.favoriteSong.cover;
                      }}
                    />
                    {!readOnly && isOwnProfile && (
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-10 w-10 p-0 bg-white/20 hover:bg-white/30 text-white"
                          onClick={(e) => {
                            e.stopPropagation();
                            openSearchDialog("favoriteSong");
                          }}
                          title="Edit favorite song"
                        >
                          <Edit className="h-5 w-5" />
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className="mt-3 text-left">
                    <p className="text-base sm:text-lg font-semibold text-white leading-tight line-clamp-2 hover:text-emerald-300 transition-colors">
                      {getTextContent(safeMusicProfile.favoriteSong.name)}
                    </p>
                    <p className="text-sm text-gray-400 leading-tight mt-1 line-clamp-1">
                      {getTextContent(
                        safeMusicProfile.favoriteSong.primaryArtists ||
                          safeMusicProfile.favoriteSong.artists?.primary
                            ?.map((artist: any) => artist.name)
                            .join(", ")
                      )}
                    </p>
                  </div>
                </div>
              ) : (
                <div
                  className={`aspect-square w-full max-w-[200px] bg-black/20 rounded-lg border border-gray-600 flex items-center justify-center transition-all duration-200 group ${
                    isOwnProfile && !readOnly
                      ? "cursor-pointer hover:bg-black/30 hover:border-gray-500 hover:shadow-lg hover:scale-[1.02]"
                      : undefined
                  }`}
                  onClick={
                    isOwnProfile && !readOnly
                      ? () => {
                          console.log("Favorite song placeholder clicked!");
                          openSearchDialog("favoriteSong");
                        }
                      : undefined
                  }
                >
                  <div className="text-center">
                    <Plus className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                    <p className="text-sm text-gray-400">Add Favorite Song</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Favorite Albums Section */}
        <div className="space-y-3">
          <h3 className="text-base sm:text-lg font-semibold text-white">
            favorite albums
          </h3>
          <div className="relative">
            <div
              ref={scrollContainerRefs.favoriteAlbums}
              className="flex gap-4 sm:gap-6 overflow-x-auto scrollbar-hide pb-4 horizontal-scroll-container"
            >
              {limitedFavoriteAlbums.length > 0 ? (
                <>
                  {limitedFavoriteAlbums.map((album, idx) => (
                    <div
                      key={album.id || idx}
                      className="relative group flex-shrink-0"
                    >
                      <div className="aspect-square w-32 sm:w-36 md:w-40 bg-muted rounded-lg overflow-hidden shadow-lg">
                        <Link href={`/music/album/${album.id}`}>
                          <Image
                            src={
                              getImageUrl(album.image) ||
                              PLACEHOLDER.favoriteAlbums[0].cover
                            }
                            alt={album.name || "Album"}
                            width={160}
                            height={160}
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
                              className="h-7 w-7 p-0 bg-black/50 hover:bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => openSearchDialog("album", album)}
                              title="Replace album"
                            >
                              <Edit className="h-3 w-3 text-white" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 bg-red-600/80 hover:bg-red-700/90 opacity-0 group-hover:opacity-100 transition-opacity"
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
                      <div className="mt-3 text-center w-32 sm:w-36 md:w-40">
                        <p className="text-sm font-semibold text-white leading-tight line-clamp-2">
                          {truncateTitle(getTextContent(album.name))}
                        </p>
                        <p className="text-xs text-gray-400 leading-tight mt-1 line-clamp-1">
                          {getTextContent(
                            album.primaryArtists ||
                              album.artists?.primary
                                ?.map((artist: any) => artist.name)
                                .join(", ") ||
                              album.artist ||
                              "Unknown Artist"
                          )}
                        </p>
                      </div>
                    </div>
                  ))}

                  {/* Add button */}
                  {limitedFavoriteAlbums.length < 4 &&
                    isOwnProfile &&
                    !readOnly && (
                      <div className="flex-shrink-0">
                        <div className="aspect-square w-32 sm:w-36 md:w-40 bg-transparent rounded-lg border-2 border-gray-600 flex items-center justify-center">
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
                <div className="flex flex-col items-center justify-center min-h-[200px] w-full">
                  <div className="aspect-square w-32 sm:w-36 md:w-40 bg-transparent rounded-lg border-2 border-gray-600 flex flex-col items-center justify-center mb-4">
                    <p className="text-sm text-gray-400 mb-1">Add</p>
                    <p className="text-xs text-gray-500 text-center">
                      No favorite albums
                    </p>
                  </div>
                  {!readOnly && isOwnProfile && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openSearchDialog("album")}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add Album
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Scroll Navigation Buttons */}
            {limitedFavoriteAlbums.length > 2 && (
              <div className="flex justify-between items-center mt-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => scrollLeft(scrollContainerRefs.favoriteAlbums)}
                  className="h-8 w-8 p-0 bg-black/20 hover:bg-black/40 text-white rounded-full"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    scrollRight(scrollContainerRefs.favoriteAlbums)
                  }
                  className="h-8 w-8 p-0 bg-black/20 hover:bg-black/40 text-white rounded-full"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Recommendations Section */}
        <div className="space-y-3">
          <h3 className="text-base sm:text-lg font-semibold text-white">
            recommendations
          </h3>
          <div className="relative">
            <div
              ref={scrollContainerRefs.recommendations}
              className="flex gap-4 sm:gap-6 overflow-x-auto scrollbar-hide pb-4 horizontal-scroll-container"
            >
              {limitedRecommendations.length > 0 ? (
                <>
                  {limitedRecommendations.map((song, idx) => (
                    <div
                      key={song.id || idx}
                      className="relative group flex-shrink-0"
                    >
                      <div className="aspect-square w-32 sm:w-36 md:w-40 bg-muted rounded-lg overflow-hidden shadow-lg">
                        <Link href={`/music/song/${song.id}`}>
                          <Image
                            src={
                              getImageUrl(song.image) ||
                              PLACEHOLDER.recommendations[0].cover
                            }
                            alt={song.name || "Song"}
                            width={160}
                            height={160}
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
                              className="h-7 w-7 p-0 bg-black/50 hover:bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity"
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
                              className="h-7 w-7 p-0 bg-red-600/80 hover:bg-red-700/90 opacity-0 group-hover:opacity-100 transition-opacity"
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
                      <div className="mt-3 text-center w-32 sm:w-36 md:w-40">
                        <p className="text-sm font-semibold text-white leading-tight line-clamp-2">
                          {truncateTitle(getTextContent(song.name))}
                        </p>
                        <p className="text-xs text-gray-400 leading-tight mt-1 line-clamp-1">
                          {getTextContent(
                            song.primaryArtists ||
                              song.artists?.primary
                                ?.map((artist: any) => artist.name)
                                .join(", ") ||
                              "Unknown Artist"
                          )}
                        </p>
                      </div>
                    </div>
                  ))}

                  {/* Add button */}
                  {isOwnProfile && !readOnly && (
                    <div className="flex-shrink-0">
                      <div className="aspect-square w-32 sm:w-36 md:w-40 bg-transparent rounded-lg border-2 border-gray-600 flex items-center justify-center">
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
                <div className="flex flex-col items-center justify-center min-h-[200px] w-full">
                  <div className="aspect-square w-32 sm:w-36 md:w-40 bg-transparent rounded-lg border-2 border-gray-600 flex flex-col items-center justify-center mb-4">
                    <p className="text-sm text-gray-400 mb-1">Add</p>
                    <p className="text-xs text-gray-500 text-center">
                      No recommendations
                    </p>
                  </div>
                  {!readOnly && isOwnProfile && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openSearchDialog("recommendation")}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add Recommendation
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Scroll Navigation Buttons */}
            {limitedRecommendations.length > 2 && (
              <div className="flex justify-between items-center mt-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    scrollLeft(scrollContainerRefs.recommendations)
                  }
                  className="h-8 w-8 p-0 bg-black/20 hover:bg-black/40 text-white rounded-full"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    scrollRight(scrollContainerRefs.recommendations)
                  }
                  className="h-8 w-8 p-0 bg-black/20 hover:bg-black/40 text-white rounded-full"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Ratings Section */}
        <div className="space-y-3">
          <h3 className="text-base sm:text-lg font-semibold text-white">
            rated songs
          </h3>
          <div className="relative">
            <div
              ref={scrollContainerRefs.ratings}
              className="flex gap-4 sm:gap-6 overflow-x-auto scrollbar-hide pb-4 horizontal-scroll-container"
            >
              {limitedRatings.length > 0 ? (
                <>
                  {limitedRatings.map((rating, idx) => (
                    <div
                      key={rating.song.id || idx}
                      className="relative group flex-shrink-0"
                    >
                      <div className="aspect-square w-32 sm:w-36 md:w-40 bg-muted rounded-lg overflow-hidden shadow-lg">
                        <Link href={`/music/song/${rating.song.id}`}>
                          <Image
                            src={
                              getImageUrl(rating.song.image) ||
                              PLACEHOLDER.ratings[0].cover
                            }
                            alt={rating.song.name || "Song"}
                            width={160}
                            height={160}
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
                              className="h-7 w-7 p-0 bg-black/50 hover:bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity"
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
                              className="h-7 w-7 p-0 bg-red-600/80 hover:bg-red-700/90 opacity-0 group-hover:opacity-100 transition-opacity"
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
                      <div className="mt-3 text-center w-32 sm:w-36 md:w-40">
                        <p className="text-sm font-semibold text-white leading-tight line-clamp-2">
                          {truncateTitle(getTextContent(rating.song.name))}
                        </p>
                        <p className="text-xs text-gray-400 leading-tight mt-1 line-clamp-1">
                          {getTextContent(
                            rating.song.primaryArtists ||
                              rating.song.artists?.primary
                                ?.map((artist: any) => artist.name)
                                .join(", ") ||
                              "Unknown Artist"
                          )}
                        </p>
                        <div className="flex justify-center mt-2">
                          {renderInteractiveStars(
                            rating.song.id,
                            rating.rating
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Add button */}
                  {isOwnProfile && !readOnly && (
                    <div className="flex-shrink-0">
                      <div className="aspect-square w-32 sm:w-36 md:w-40 bg-transparent rounded-lg border-2 border-gray-600 flex items-center justify-center">
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
                <div className="flex flex-col items-center justify-center min-h-[200px] w-full">
                  <div className="aspect-square w-32 sm:w-36 md:w-40 bg-transparent rounded-lg border-2 border-gray-600 flex flex-col items-center justify-center mb-4">
                    <p className="text-sm text-gray-400 mb-1">Add</p>
                    <p className="text-xs text-gray-500 text-center">
                      No rated songs
                    </p>
                  </div>
                  {!readOnly && isOwnProfile && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openSearchDialog("rating")}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add Rating
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Scroll Navigation Buttons */}
            {limitedRatings.length > 2 && (
              <div className="flex justify-between items-center mt-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => scrollLeft(scrollContainerRefs.ratings)}
                  className="h-8 w-8 p-0 bg-black/20 hover:bg-black/40 text-white rounded-full"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => scrollRight(scrollContainerRefs.ratings)}
                  className="h-8 w-8 p-0 bg-black/20 hover:bg-black/40 text-white rounded-full"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Search Dialog */}
      <Dialog open={isSearchDialogOpen} onOpenChange={setIsSearchDialogOpen}>
        <DialogContent className="max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Replace Item" : "Add New Item"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Search for music..."
                value={searchQuery}
                onChange={(e) => {
                  console.log("Search input changed:", e.target.value);
                  setSearchQuery(e.target.value);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    console.log(
                      "Enter key pressed, searching for:",
                      searchQuery
                    );
                    handleSearch(searchQuery, activeSearchType as any);
                  }
                }}
                className="flex-1"
              />
              <Button
                onClick={() => {
                  console.log("Search button clicked for:", searchQuery);
                  handleSearch(searchQuery, activeSearchType as any);
                }}
                disabled={isSearching || !searchQuery.trim()}
                size="sm"
              >
                {isSearching ? "Searching..." : "Search"}
              </Button>
            </div>

            {searchError && (
              <p className="text-red-500 text-sm">{searchError}</p>
            )}

            {isSearching && (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                <p className="text-gray-400 text-sm">Searching...</p>
              </div>
            )}

            {!isSearching && searchResults.length > 0 && (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                <p className="text-sm text-gray-400 mb-2">
                  Found {searchResults.length} results
                </p>
                {searchResults.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-2 rounded-lg border border-gray-700 hover:bg-gray-800 cursor-pointer"
                    onClick={() => {
                      console.log("Item selected:", item);
                      handleAddItem(item);
                    }}
                  >
                    <div className="w-12 h-12 bg-muted rounded overflow-hidden flex-shrink-0">
                      <Image
                        src={getImageUrl(item.image)}
                        alt={item.name || "Item"}
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
                      <p className="text-sm font-medium text-white truncate">
                        {item.name || item.title}
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        {item.primaryArtists || item.artist}
                        {item.album && ` • ${item.album}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!isSearching &&
              searchQuery &&
              searchResults.length === 0 &&
              !searchError && (
                <div className="text-center py-4">
                  <p className="text-gray-400 text-sm">
                    No results found for "{searchQuery}"
                  </p>
                  <p className="text-gray-500 text-xs mt-1">
                    Try a different search term
                  </p>
                </div>
              )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
