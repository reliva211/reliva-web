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
import { useRouter } from "next/navigation";

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

// Helper function to truncate title to first few words (matching other sections)
const truncateTitleToWords = (title: string, maxWords: number = 2): string => {
  if (!title) return "Unknown Song";
  const cleanTitle = cleanTextContent(title);
  const words = cleanTitle.split(" ");
  if (words.length <= maxWords) return cleanTitle;
  return words.slice(0, maxWords).join(" ") + "...";
};

// Specific truncation for music ratings section - chutta.. format
const truncateForRatings = (text: string, maxLength: number = 10): string => {
  if (!text || text.trim() === "") return "Unknown";

  // Clean the text first
  let cleanText = text.toString().trim();

  // Remove HTML tags if any
  cleanText = cleanText.replace(/<[^>]*>/g, "");

  // If text is already short enough, return as is
  if (cleanText.length <= maxLength) {
    return cleanText;
  }

  // Truncate and add double dots
  return cleanText.substring(0, maxLength) + "..";
};

// Helper function to extract artist names
const getArtistNames = (song: any): string => {
  return (
    song.primaryArtists ||
    song.artists?.primary?.map((artist: any) => artist.name).join(", ") ||
    "Unknown Artist"
  );
};

export default function ProfileMusicSection({
  userId,
  readOnly = false,
}: ProfileMusicSectionProps) {
  const router = useRouter();
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
    replaceFavoriteAlbum,
    replaceRecommendation,
    replaceRating,
    searchMusic,
  } = useMusicProfile(userId, readOnly);

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

  // Debug dialog state - removed for security
  useEffect(() => {
    // Dialog state monitoring removed for production
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
            className={`h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-4 md:w-4 transition-colors ${
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
                className={`h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-4 md:w-4 fill-yellow-400 text-yellow-400 ${
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

    // Search started for security
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

      // API search completed
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

      // Results validated
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
    setActiveSearchType(searchType);
    setEditingItem(itemToReplace);
    setSearchQuery("");
    setSearchResults([]);
    setSearchError(null);
    setIsSearchDialogOpen(true);
  };

  const handleAddItem = async (item: any) => {
    try {
      let success = false;

      switch (activeSearchType) {
        case "currentObsession":
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
          if (editingItem) {
            // Replace existing album
            await replaceFavoriteAlbum(editingItem.id, item);
          } else {
            // Add new album
            await addFavoriteAlbum(item);
          }
          success = true;
          break;
        case "recommendation":
          if (editingItem) {
            // Replace existing recommendation
            await replaceRecommendation(editingItem.id, item);
          } else {
            // Add new recommendation
            await addRecommendation(item);
          }
          success = true;
          break;
        case "rating":
          if (editingItem) {
            // Replace existing rating
            await replaceRating(editingItem.id, item, 5);
          } else {
            // Add new rating
            await addRating(item, 5);
          }
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
      const actions = {
        album: () => removeFavoriteAlbum(itemId),
        recommendation: () => removeRecommendation(itemId),
        rating: () => removeRating(itemId),
      };
      (await actions[type as keyof typeof actions]?.()) ||
        console.warn("Unknown item type:", type);
    } catch (error) {
      console.error("Error removing item:", error);
    }
  };

  const handleRatingClick = async (songId: string, rating: number) => {
    try {
      const song = musicProfile?.ratings?.find(
        (r) => r.song.id === songId
      )?.song;
      if (song) await addRating(song, rating);
    } catch (error) {
      console.error("Error updating rating:", error);
    }
  };

  // Handle plus button clicks for different sections
  const handlePlusClick = (
    sectionType:
      | "favoriteArtist"
      | "favoriteSong"
      | "album"
      | "recommendation"
      | "rating",
    itemToReplace?: any
  ) => {
    setEditingItem(itemToReplace || null);
    setActiveSearchType(sectionType);
    setIsSearchDialogOpen(true);
    setSearchQuery("");
    setSearchResults([]);
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
  // Search dialog state monitoring removed for security
  useEffect(() => {
    // Component props monitoring removed for security
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
    <div className="profile-music-section w-full max-w-7xl mx-auto px-4 py-8 sm:py-12">
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/3 via-transparent to-purple-900/3 pointer-events-none"></div>

      {/* Main Content Grid - Responsive Layout */}
      <div className="relative space-y-8 sm:space-y-12">
        {/* Top Row - Current Obsession, Favorite Artist, Favorite Song */}
        <div className="flex flex-col sm:flex-row gap-8 sm:gap-12 lg:gap-16 items-start justify-start px-4 sm:px-8 lg:px-12">
          {/* Current Obsession */}
          <div className="flex flex-col w-full sm:w-auto sm:flex-1 sm:max-w-[200px] py-2">
            <h3 className="text-base sm:text-lg font-bold text-white mb-4 flex items-center gap-3 bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent whitespace-nowrap">
              <span className="bg-cyan-400 w-1 h-6 rounded-full block min-w-[4px] flex-shrink-0"></span>
              Current Obsession
              {!readOnly && isOwnProfile && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded-full transition-all duration-200"
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
                    !readOnly && isOwnProfile ? "cursor-pointer" : ""
                  }`}
                  onClick={
                    !readOnly && isOwnProfile
                      ? (e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          openSearchDialog("currentObsession");
                        }
                      : undefined
                  }
                >
                  <div className="aspect-square w-full max-w-[200px] bg-muted rounded-2xl overflow-hidden shadow-2xl shadow-emerald-500/20 border border-emerald-500/20">
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
                  </div>
                  <div className="mt-4 text-center">
                    <p className="text-lg sm:text-xl font-bold text-white leading-tight line-clamp-2">
                      {getTextContent(safeMusicProfile.currentObsession.name)}
                    </p>
                    <p className="text-sm text-white leading-tight mt-2 line-clamp-1 font-medium">
                      {getTextContent(
                        getArtistNames(safeMusicProfile.currentObsession)
                      )}
                    </p>
                  </div>
                </div>
              ) : (
                <div
                  className={`aspect-square w-full max-w-[200px] bg-gradient-to-br from-gray-900/40 to-gray-800/40 rounded-2xl border-2 border-emerald-500/30 flex items-center justify-center group backdrop-blur-sm ${
                    isOwnProfile && !readOnly ? "cursor-pointer" : "opacity-60"
                  }`}
                  onClick={
                    isOwnProfile && !readOnly
                      ? (e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          openSearchDialog("currentObsession");
                        }
                      : undefined
                  }
                >
                  <div className="text-center w-full">
                    {isOwnProfile && !readOnly ? (
                      <>
                        <div className="w-16 h-16 bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 rounded-full flex items-center justify-center mb-4 border border-emerald-500/30 mx-auto">
                          <Plus className="h-8 w-8 text-emerald-400 flex-shrink-0" />
                        </div>
                        <p className="text-sm font-medium text-emerald-300">
                          Add Current Obsession
                        </p>
                      </>
                    ) : (
                      <p className="text-sm font-medium text-gray-400">
                        No current obsession
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Favorite Artist */}
          <div className="flex flex-col w-full sm:w-auto sm:flex-1 sm:max-w-[200px] py-2">
            <h3 className="text-base sm:text-lg font-bold text-white mb-4 flex items-center gap-3 bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text text-transparent">
              <span className="bg-gradient-to-r from-emerald-500 to-green-500 w-1 h-5 rounded-full"></span>
              Favorite Artist
              {!readOnly && isOwnProfile && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded-full transition-all duration-200"
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
                    !readOnly && isOwnProfile ? "cursor-pointer" : ""
                  }`}
                  onClick={
                    !readOnly && isOwnProfile
                      ? () => {
                          openSearchDialog("favoriteArtist");
                        }
                      : undefined
                  }
                >
                  <div className="aspect-square w-full max-w-[200px] rounded-full overflow-hidden shadow-2xl shadow-purple-500/20 border-2 border-purple-500/20">
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
                  </div>
                  <div className="mt-4 text-center">
                    <p className="text-lg sm:text-xl font-bold text-white leading-tight line-clamp-2">
                      {getTextContent(safeMusicProfile.favoriteArtist?.name)}
                    </p>
                  </div>
                </div>
              ) : (
                <div
                  className={`aspect-square w-full max-w-[200px] bg-gradient-to-br from-purple-900/20 to-pink-900/20 rounded-full border-2 border-purple-500/30 flex items-center justify-center group backdrop-blur-sm ${
                    isOwnProfile && !readOnly ? "cursor-pointer" : "opacity-60"
                  }`}
                  onClick={
                    isOwnProfile && !readOnly
                      ? () => {
                          openSearchDialog("favoriteArtist");
                        }
                      : undefined
                  }
                >
                  <div className="text-center w-full">
                    {isOwnProfile && !readOnly ? (
                      <>
                        <div className="w-16 h-16 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center mb-4 border border-purple-500/30 mx-auto">
                          <Plus className="h-8 w-8 text-purple-400 flex-shrink-0" />
                        </div>
                        <p className="text-sm font-medium text-purple-300">
                          Add Favorite Artist
                        </p>
                      </>
                    ) : (
                      <p className="text-sm font-medium text-gray-400">
                        No favorite artist
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Favorite Song */}
          <div className="flex flex-col w-full sm:w-auto sm:flex-1 sm:max-w-[200px] py-2">
            <h3 className="text-base sm:text-lg font-bold text-white mb-4 flex items-center gap-3 bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
              <span className="bg-emerald-400 w-1 h-5 rounded-full"></span>
              Favorite Song
              {!readOnly && isOwnProfile && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded-full transition-all duration-200"
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
                    !readOnly && isOwnProfile ? "cursor-pointer" : ""
                  }`}
                  onClick={
                    !readOnly && isOwnProfile
                      ? () => {
                          openSearchDialog("favoriteSong");
                        }
                      : undefined
                  }
                >
                  <div className="aspect-square w-full max-w-[200px] bg-muted rounded-2xl overflow-hidden shadow-lg">
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
                  </div>
                  <div className="mt-4 text-center">
                    <p className="text-lg sm:text-xl font-bold text-white leading-tight line-clamp-2">
                      {getTextContent(safeMusicProfile.favoriteSong.name)}
                    </p>
                    <p className="text-sm text-white leading-tight mt-2 line-clamp-1 font-medium">
                      {getTextContent(
                        getArtistNames(safeMusicProfile.favoriteSong)
                      )}
                    </p>
                  </div>
                </div>
              ) : (
                <div
                  className={`aspect-square w-full max-w-[200px] bg-gradient-to-br from-orange-900/20 to-red-900/20 rounded-2xl flex items-center justify-center group backdrop-blur-sm ${
                    isOwnProfile && !readOnly ? "cursor-pointer" : undefined
                  }`}
                  onClick={
                    isOwnProfile && !readOnly
                      ? () => {
                          openSearchDialog("favoriteSong");
                        }
                      : undefined
                  }
                >
                  <div className="text-center w-full">
                    {isOwnProfile && !readOnly ? (
                      <>
                        <div className="w-16 h-16 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-full flex items-center justify-center mb-4 border border-orange-500/30 mx-auto">
                          <Plus className="h-8 w-8 text-orange-400 flex-shrink-0" />
                        </div>
                        <p className="text-sm font-medium text-orange-300">
                          Add Favorite Song
                        </p>
                      </>
                    ) : (
                      <p className="text-sm font-medium text-gray-400">
                        No favorite song
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Favorite Albums Section */}
        <div className="space-y-3">
          <h3 className="text-base sm:text-lg font-semibold text-white">
            Favorite Albums
          </h3>
          <div className="relative">
            <div
              ref={scrollContainerRefs.favoriteAlbums}
              className="flex gap-6 sm:gap-8 md:gap-10 overflow-x-auto scrollbar-hide pb-4 horizontal-scroll-container"
            >
              {limitedFavoriteAlbums.length > 0 ? (
                <>
                  {limitedFavoriteAlbums.map((album, idx) => (
                    <div
                      key={album.id || idx}
                      className="relative group flex-shrink-0"
                    >
                      <div className="aspect-square w-36 sm:w-40 md:w-44 bg-muted rounded-lg overflow-hidden shadow-lg">
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
                      <div className="mt-1 text-center w-36 sm:w-40 md:w-44">
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
                        <div className="aspect-square w-36 sm:w-40 md:w-44 bg-transparent rounded-lg border-2 border-gray-600 flex items-center justify-center">
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
                <div className="flex flex-col items-start justify-start min-h-[200px] w-full">
                  <div className="aspect-square w-36 sm:w-40 md:w-44 bg-transparent rounded-lg border-2 border-gray-600 flex flex-col items-center justify-center mb-4">
                    {isOwnProfile && !readOnly && (
                      <p className="text-sm text-gray-400 mb-1">Add</p>
                    )}
                    <p className="text-xs text-gray-500 text-center">
                      No favorite albums
                    </p>
                  </div>
                  {!readOnly && isOwnProfile && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openSearchDialog("album")}
                      className="text-xs"
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

        {/* Recommendations Section */}
        <div className="space-y-4">
          <h3 className="text-lg sm:text-xl font-semibold text-white">
            Recommendations
          </h3>
          <div className="relative">
            <div
              ref={scrollContainerRefs.recommendations}
              className="flex gap-6 sm:gap-8 overflow-x-auto scrollbar-hide pb-4 horizontal-scroll-container"
            >
              {limitedRecommendations.length > 0 ? (
                <>
                  {limitedRecommendations.map((song, idx) => (
                    <div
                      key={song.id || idx}
                      className="relative group flex-shrink-0 w-40 max-w-40"
                    >
                      <div className="aspect-square w-full bg-muted rounded-xl overflow-hidden shadow-xl">
                        <Link href={`/music/album/${song.id}`}>
                          <Image
                            src={
                              getImageUrl(song.image) ||
                              PLACEHOLDER.recommendations[0].cover
                            }
                            alt={song.name || "Song"}
                            width={200}
                            height={200}
                            className="w-full h-full object-cover cursor-pointer"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = PLACEHOLDER.recommendations[0].cover;
                            }}
                          />
                        </Link>
                        {!readOnly && isOwnProfile && (
                          <div className="absolute top-3 right-3 flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 bg-black/50 hover:bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() =>
                                handlePlusClick("recommendation", song)
                              }
                              title="Replace recommendation"
                            >
                              <Edit className="h-4 w-4 text-white" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 bg-red-600/80 hover:bg-red-700/90 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() =>
                                handleRemoveItem("recommendation", song.id)
                              }
                              title="Delete recommendation"
                            >
                              <Trash2 className="h-4 w-4 text-white" />
                            </Button>
                          </div>
                        )}
                      </div>
                      <div className="mt-2 text-center w-full px-1">
                        <p className="text-base font-semibold text-white leading-tight min-h-[1.75rem] truncate">
                          {truncateTitle(getTextContent(song.name))}
                        </p>
                        <p className="text-sm text-gray-400 leading-tight mt-1 truncate">
                          {getTextContent(getArtistNames(song))}
                        </p>
                      </div>
                    </div>
                  ))}

                  {/* Add button */}
                  {isOwnProfile && !readOnly && (
                    <div className="flex-shrink-0 w-40">
                      <div className="aspect-square w-full bg-transparent rounded-xl border-2 border-gray-600 flex items-center justify-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-14 w-14 p-0 bg-black/70 hover:bg-black/90 text-white rounded-full border-2 border-white/20 shadow-lg"
                          onClick={() => handlePlusClick("recommendation")}
                        >
                          <Plus className="h-6 w-6" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center min-h-[200px]">
                  <div className="aspect-square w-32 bg-transparent rounded-lg border-2 border-gray-600 flex flex-col items-center justify-center mb-3">
                    <p className="text-xs text-gray-500 text-center">
                      No recommendations
                    </p>
                  </div>
                  {!readOnly && isOwnProfile && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePlusClick("recommendation")}
                      className="text-xs"
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
                  onClick={() =>
                    scrollLeft(scrollContainerRefs.recommendations)
                  }
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 bg-black/80 hover:bg-black backdrop-blur-md border border-white/10 text-white rounded-full shadow-2xl hover:scale-110 transition-all duration-300 z-30"
                  onClick={() =>
                    scrollRight(scrollContainerRefs.recommendations)
                  }
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Ratings Section */}
        <div className="mt-12">
          <div className="flex items-center justify-start mb-4">
            <p className="text-base sm:text-lg font-bold text-white">Ratings</p>
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
                      key={`rating-${rating.song.id}-${idx}`}
                      className="relative group flex-shrink-0 w-32"
                    >
                      <div className="aspect-[2/3] w-32 bg-muted rounded-md overflow-hidden">
                        <Link href={`/music/song/${rating.song.id}`}>
                          <Image
                            src={
                              getImageUrl(rating.song.image) ||
                              PLACEHOLDER.ratings[0].cover
                            }
                            alt={rating.song.name || "Song"}
                            width={128}
                            height={192}
                            className="w-full h-full object-cover cursor-pointer"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = PLACEHOLDER.ratings[0].cover;
                            }}
                          />
                        </Link>
                      </div>
                      {/* Rating stars - above the song name */}
                      <div className="mt-3 flex justify-center gap-1">
                        {renderInteractiveStars(rating.song.id, rating.rating)}
                      </div>
                      {/* Song name and artist display - below the rating */}
                      <div className="mt-2 text-center w-full px-1">
                        <p className="text-sm font-semibold text-white leading-tight min-h-[1.5rem] flex items-center justify-center">
                          {truncateForRatings(
                            rating.song.name || "Unknown Song"
                          )}
                        </p>
                        <p className="text-xs text-gray-400 leading-tight mt-0.5 flex items-center justify-center">
                          {truncateForRatings(getArtistNames(rating.song))}
                        </p>
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center min-h-[200px]">
                  <div className="aspect-square w-32 bg-transparent rounded-lg border-2 border-gray-600 flex flex-col items-center justify-center mb-3">
                    <p className="text-xs text-gray-500 text-center">
                      No ratings
                    </p>
                  </div>
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
      </div>

      {/* Search Dialog */}
      <Dialog open={isSearchDialogOpen} onOpenChange={setIsSearchDialogOpen}>
        <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-md mx-auto search-modal-content">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">
              {editingItem ? "Replace Item" : "Add New Item"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-2 search-dialog-container profile-search-dialog">
              <Input
                placeholder="Search for music..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSearch(searchQuery, activeSearchType as any);
                  }
                }}
                className="flex-1 w-full search-dialog-input"
              />
              <Button
                onClick={() => {
                  handleSearch(searchQuery, activeSearchType as any);
                }}
                disabled={isSearching || !searchQuery.trim()}
                size="sm"
                className="w-full sm:w-auto search-dialog-button"
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
              <div className="space-y-2 max-h-60 overflow-y-auto px-1">
                <p className="text-sm text-gray-400 mb-2">
                  Found {searchResults.length} results
                </p>
                {searchResults.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 rounded-lg border border-gray-700 hover:bg-gray-800 cursor-pointer transition-colors search-result-item"
                    onClick={() => {
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

          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
