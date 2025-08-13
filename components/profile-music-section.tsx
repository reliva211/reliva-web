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
import { useState, useEffect } from "react";
import { Plus, Search, X, Star, Trash2 } from "lucide-react";
import {
  useMusicProfile,
  type SaavnSong,
  type SaavnArtist,
  type SaavnAlbum,
} from "@/hooks/use-music-profile";
import { useCurrentUser } from "@/hooks/use-current-user";

interface ProfileMusicSectionProps {
  // Optional future props for wiring real data
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

export default function ProfileMusicSection(_: ProfileMusicSectionProps) {
  const { user } = useCurrentUser();
  const {
    musicProfile,
    loading,
    error,
    updateCurrentObsession,
    updateFavoriteArtist,
    updateFavoriteSong,
    addFavoriteAlbum,
    removeFavoriteAlbum,
    addRecommendation,
    removeRecommendation,
    addRating,
    removeRating,
    searchMusic,
  } = useMusicProfile(user?.uid);

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
            className={`h-4 w-4 cursor-pointer transition-colors ${
              isFullStar ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
            }`}
            onMouseEnter={() => handleRatingHover(songId, starValue)}
            onMouseLeave={handleRatingLeave}
            onClick={() => handleRatingClick(songId, starValue)}
          />
          {/* Half star overlay */}
          {isHalfStar && (
            <div className="absolute inset-0 overflow-hidden">
              <Star
                className="h-4 w-4 fill-yellow-400 text-yellow-400 cursor-pointer"
                onMouseEnter={() => handleRatingHover(songId, halfStarValue)}
                onMouseLeave={handleRatingLeave}
                onClick={() => handleRatingClick(songId, halfStarValue)}
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
      } else if (searchType === "album") {
        apiType = "album";
      } else {
        apiType = "song";
      }

      const results = await searchMusic(query, apiType, 10);

      // Validate and sanitize search results
      const validatedResults = (results || []).map((item: any) => ({
        id: item.id || `item-${Math.random()}`,
        name: cleanTextContent(getTextContent(item.name || item.title)),
        title: cleanTextContent(getTextContent(item.title || item.name)),
        primaryArtists: cleanTextContent(
          getTextContent(
            item.primaryArtists || item.artist || item.album || item.name
          )
        ),
        artist: cleanTextContent(
          getTextContent(item.artist || item.primaryArtists || item.name)
        ),
        album: cleanTextContent(getTextContent(item.album)),
        image: item.image || [],
        type: item.type || apiType,
      }));

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
      const formattedItem = {
        id: item.id,
        name: cleanTextContent(getTextContent(item.name || item.title)),
        title: cleanTextContent(getTextContent(item.title || item.name)),
        primaryArtists: cleanTextContent(
          getTextContent(
            item.primaryArtists || item.artist || item.album || item.name
          )
        ),
        artist: cleanTextContent(
          getTextContent(item.artist || item.primaryArtists || item.name)
        ),
        album: cleanTextContent(getTextContent(item.album)),
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
          await addFavoriteAlbum(formattedItem);
          break;
        case "recommendation":
          await addRecommendation(formattedItem);
          break;
        case "rating":
          await addRating(formattedItem, 3); // Default 3-star rating
          break;
      }
      setShowSearchDialog(false);
      setSearchQuery("");
      setSearchResults([]);
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
      | "rating"
  ) => {
    setActiveSearchType(searchType);
    setShowSearchDialog(true);
    setSearchQuery("");
    setSearchResults([]);
    setSearchError(null);
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
      <div className="space-y-5 max-w-4xl mx-auto">
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
      <div className="space-y-5 max-w-4xl mx-auto">
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

  // Ensure musicProfile exists
  const safeMusicProfile = musicProfile || {
    currentObsession: null,
    favoriteArtist: null,
    favoriteSong: null,
    favoriteAlbums: [],
    recommendations: [],
    ratings: [],
  };

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {/* current obsession - card */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-muted-foreground">
              current obsession
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-muted"
              onClick={() => openSearchDialog("currentObsession")}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
          <Card className="shadow-none border border-border/40">
            <CardContent className="p-2">
              <div className="aspect-square w-full bg-muted rounded-md overflow-hidden">
                <Image
                  src={
                    safeMusicProfile.currentObsession
                      ? getImageUrl(safeMusicProfile.currentObsession.image) ||
                        PLACEHOLDER.currentObsession.cover
                      : PLACEHOLDER.currentObsession.cover
                  }
                  alt={
                    getTextContent(safeMusicProfile.currentObsession?.name) ||
                    PLACEHOLDER.currentObsession.title
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
            </CardContent>
          </Card>
        </div>

        {/* favorite artist - circle */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-muted-foreground">
              favorite artist
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-muted"
              onClick={() => openSearchDialog("favoriteArtist")}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-40 h-40 sm:w-48 sm:h-48 lg:w-56 lg:h-56 rounded-full overflow-hidden border-2 border-border/30 shadow-sm">
              <Image
                src={
                  safeMusicProfile.favoriteArtist
                    ? getImageUrl(safeMusicProfile.favoriteArtist.image) ||
                      PLACEHOLDER.favoriteArtist.avatar
                    : PLACEHOLDER.favoriteArtist.avatar
                }
                alt={
                  getTextContent(safeMusicProfile.favoriteArtist?.name) ||
                  PLACEHOLDER.favoriteArtist.name
                }
                width={224}
                height={224}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = PLACEHOLDER.favoriteArtist.avatar;
                }}
              />
            </div>
            <div className="mt-3 text-center">
              <p className="text-sm font-medium leading-tight">
                {getTextContent(safeMusicProfile.favoriteArtist?.name) ||
                  PLACEHOLDER.favoriteArtist.name}
              </p>
            </div>
          </div>
        </div>

        {/* favorite song */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-muted-foreground">
              favorite song
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-muted"
              onClick={() => openSearchDialog("favoriteSong")}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
          <Card className="shadow-none border border-border/40">
            <CardContent className="p-2">
              <div className="aspect-square w-full bg-muted rounded-md overflow-hidden">
                <Image
                  src={
                    safeMusicProfile.favoriteSong
                      ? getImageUrl(safeMusicProfile.favoriteSong.image) ||
                        PLACEHOLDER.favoriteSong.cover
                      : PLACEHOLDER.favoriteSong.cover
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
            </CardContent>
          </Card>
        </div>
      </div>

      {/* playlists note */}
      <div>
        <p className="text-sm font-medium text-muted-foreground mb-2">
          playlists
        </p>
        <p className="text-[11px] text-muted-foreground">
          share your spotify, apple music, youtube music playlists (coming
          soon).
        </p>
      </div>

      {/* favorite albums */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-muted-foreground">
            favorite albums
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 hover:bg-muted"
            onClick={() => openSearchDialog("album")}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {safeMusicProfile.favoriteAlbums &&
          safeMusicProfile.favoriteAlbums.length > 0
            ? safeMusicProfile.favoriteAlbums.map((album, idx) => (
                <div key={album.id || idx} className="relative group">
                  <div className="aspect-square w-full bg-muted rounded-md overflow-hidden">
                    <Image
                      src={
                        getImageUrl(album.image) ||
                        PLACEHOLDER.favoriteAlbums[0].cover
                      }
                      alt={album.name || "Album"}
                      width={160}
                      height={160}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = PLACEHOLDER.favoriteAlbums[0].cover;
                      }}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-1 right-1 h-6 w-6 p-0 bg-black/50 hover:bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleRemoveItem("album", album.id)}
                    >
                      <X className="h-3 w-3 text-white" />
                    </Button>
                  </div>
                  <div className="mt-2 text-center">
                    <p className="text-sm font-medium leading-tight">
                      {getTextContent(album.name) || "Unknown Album"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {getTextContent(album.primaryArtists) || "Unknown Artist"}
                    </p>
                  </div>
                </div>
              ))
            : PLACEHOLDER.favoriteAlbums.map((album, idx) => (
                <div key={album.id} className="relative">
                  <div className="aspect-square w-full bg-muted rounded-md overflow-hidden">
                    <Image
                      src={album.cover}
                      alt="album placeholder"
                      width={160}
                      height={160}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              ))}
        </div>
      </div>

      {/* recommendations */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-muted-foreground">
            recommendations
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 hover:bg-muted"
            onClick={() => openSearchDialog("recommendation")}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {safeMusicProfile.recommendations &&
          safeMusicProfile.recommendations.length > 0
            ? safeMusicProfile.recommendations.map((song, idx) => (
                <div key={song.id || idx} className="relative group">
                  <div className="aspect-square w-full bg-muted rounded-md overflow-hidden">
                    <Image
                      src={
                        getImageUrl(song.image) ||
                        PLACEHOLDER.recommendations[0].cover
                      }
                      alt={song.name || "Song"}
                      width={160}
                      height={160}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = PLACEHOLDER.recommendations[0].cover;
                      }}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-1 right-1 h-6 w-6 p-0 bg-black/50 hover:bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() =>
                        handleRemoveItem("recommendation", song.id)
                      }
                    >
                      <X className="h-3 w-3 text-white" />
                    </Button>
                  </div>
                  <div className="mt-2 text-center">
                    <p className="text-base font-semibold leading-tight">
                      {getTextContent(song.name) || "Unknown Song"}
                    </p>
                  </div>
                </div>
              ))
            : PLACEHOLDER.recommendations.map((rec) => (
                <div
                  key={rec.id}
                  className="aspect-square w-full bg-muted rounded-md"
                />
              ))}
        </div>
      </div>

      {/* rating */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-muted-foreground">rating</p>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 hover:bg-muted"
            onClick={() => openSearchDialog("rating")}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {safeMusicProfile.ratings && safeMusicProfile.ratings.length > 0
            ? safeMusicProfile.ratings.map((rating, idx) => (
                <div key={rating.song.id || idx} className="relative group">
                  <div className="aspect-square w-full bg-muted rounded-md overflow-hidden">
                    <Image
                      src={
                        getImageUrl(rating.song.image) ||
                        PLACEHOLDER.ratings[0].cover
                      }
                      alt={rating.song.name || "Song"}
                      width={160}
                      height={160}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = PLACEHOLDER.ratings[0].cover;
                      }}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-1 right-1 h-6 w-6 p-0 bg-black/50 hover:bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleRemoveItem("rating", rating.song.id)}
                    >
                      <X className="h-3 w-3 text-white" />
                    </Button>
                    <div className="absolute bottom-1 left-1 right-1 flex justify-center gap-1 p-2 bg-black/50 rounded-md">
                      {renderInteractiveStars(rating.song.id, rating.rating)}
                    </div>
                  </div>
                </div>
              ))
            : PLACEHOLDER.ratings.map((_, i) => (
                <div
                  key={`rt-${i}`}
                  className="aspect-square w-full bg-muted rounded-md relative"
                >
                  {i === 0 && (
                    <div className="absolute bottom-1 left-1 right-1 flex justify-center gap-1 p-2 bg-black/50 rounded-md">
                      <span className="text-white text-xs">★</span>
                      <span className="text-white text-xs">★</span>
                      <span className="text-white text-xs">★</span>
                      <span className="text-white text-xs">★</span>
                      <span className="text-white text-xs">★</span>
                    </div>
                  )}
                </div>
              ))}
        </div>
      </div>

      {/* Search Dialog */}
      <Dialog open={showSearchDialog} onOpenChange={setShowSearchDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              Search{" "}
              {activeSearchType === "favoriteArtist"
                ? "Artists"
                : activeSearchType === "album"
                ? "Albums"
                : activeSearchType === "currentObsession"
                ? "Current Obsession"
                : activeSearchType === "favoriteSong"
                ? "Favorite Song"
                : activeSearchType === "recommendation"
                ? "Recommendations"
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
                      ? "recommendations"
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
                            item.primaryArtists || item.artist || item.album
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
