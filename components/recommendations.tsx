"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useYouTubePlayer } from "@/hooks/use-youtube-player";
import {
  Play,
  Heart,
  Star,
  Music,
  Shuffle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

// Utility function to decode HTML entities
const decodeHtmlEntities = (text: string): string => {
  const textarea = document.createElement("textarea");
  textarea.innerHTML = text;
  return textarea.value;
};

interface Song {
  id: string;
  name: string;
  artists: {
    primary: Array<{
      id: string;
      name: string;
    }>;
  };
  image: Array<{
    quality: string;
    url: string;
  }>;
  album: {
    name: string;
  };
  duration: number;
  year: string;
  language: string;
  playCount: number;
}

interface RecommendationsProps {
  currentSong: Song | null;
  ratings: Record<string, number>;
  myList: Set<string>;
  onPlaySongAction: (song: Song) => void;
  onToggleMyListAction: (song: Song) => void;
  onRateSongAction: (songId: string, rating: number) => void;
}

export function Recommendations({
  currentSong,
  ratings,
  myList,
  onPlaySongAction,
  onToggleMyListAction,
  onRateSongAction,
}: RecommendationsProps) {
  const { showPlayer } = useYouTubePlayer();
  const [recommendations, setRecommendations] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialLoad, setInitialLoad] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -300, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 300, behavior: "smooth" });
    }
  };

  const getImageUrl = (images: Array<{ quality: string; url: string }>) => {
    return (
      images?.[2]?.url ||
      images?.[1]?.url ||
      images?.[0]?.url ||
      "/placeholder.svg"
    );
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const StarRating = ({
    songId,
    currentRating,
  }: {
    songId: string;
    currentRating: number;
  }) => {
    return (
      <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 cursor-pointer transition-colors ${
              star <= currentRating
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300 hover:text-yellow-300"
            }`}
            onClick={(e) => {
              e.stopPropagation();
              onRateSongAction(songId, star);
            }}
          />
        ))}
      </div>
    );
  };

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setLoading(true);
        setError(null);

        // Generate recommendations based on current song or popular tracks
        let query = "popular songs 2025";
        if (currentSong) {
          // Use current song's artist or genre for better recommendations
          const artist = currentSong.artists?.primary?.[0]?.name;
          if (artist) {
            query = artist;
          }
        }

        const response = await fetch(
          `/api/search?q=${encodeURIComponent(query)}&type=song&limit=20`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch recommendations");
        }

        const data = await response.json();
        const songs = data.data?.results || [];

        // Filter out only the current song, but keep liked songs in recommendations
        const filteredSongs = songs.filter((song: Song) => {
          return song.id !== currentSong?.id;
        });

        setRecommendations(filteredSongs.slice(0, 20));

        // Add a minimum loading time to prevent flickering
        if (initialLoad) {
          setTimeout(() => {
            setLoading(false);
            setInitialLoad(false);
          }, 600);
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error("Error fetching recommendations:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load recommendations"
        );
        setLoading(false);
        setInitialLoad(false);
      }
    };

    fetchRecommendations();
  }, [currentSong]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-5 bg-gray-700 rounded w-48 animate-pulse"></div>
        </div>

        {/* Loading Skeleton for Songs */}
        <div className="flex gap-4 overflow-x-auto pb-4">
          {[
            1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19,
            20,
          ].map((item) => (
            <div
              key={item}
              className="flex-shrink-0 w-[160px] sm:w-[180px] md:w-[200px] relative"
            >
              <div className="aspect-square w-full rounded-xl bg-gray-700 animate-pulse relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse"></div>
              </div>
              <div className="mt-3 space-y-2 px-2">
                <div className="h-4 bg-gray-700 rounded animate-pulse"></div>
                <div className="h-3 bg-gray-700 rounded w-3/4 animate-pulse"></div>
                <div className="h-3 bg-gray-700 rounded w-1/2 animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Music className="w-8 h-8 text-red-400" />
        </div>
        <p className="text-gray-300 mb-2 font-medium">
          Failed to load recommendations
        </p>
        <p className="text-sm text-gray-500">{error}</p>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Shuffle className="w-8 h-8 text-blue-400" />
        </div>
        <p className="text-gray-300 font-medium">
          No recommendations available
        </p>
        <p className="text-sm text-gray-500">
          Try playing a song to get personalized recommendations
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-gray-400">
          {currentSong
            ? `Based on "${currentSong.name}"`
            : "Popular tracks you might like"}
        </p>
        {/* Removed the "8 songs" badge for cleaner look */}
      </div>

      {/* Horizontal Scroll Container */}
      <div className="relative">
        {/* Left Arrow */}
        <Button
          variant="ghost"
          size="sm"
          onClick={scrollLeft}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-gray-800/80 hover:bg-gray-700/80 text-white border border-gray-600 rounded-full w-10 h-10 p-0 shadow-lg"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>

        {/* Right Arrow */}
        <Button
          variant="ghost"
          size="sm"
          onClick={scrollRight}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-gray-800/80 hover:bg-gray-700/80 text-white border border-gray-600 rounded-full w-10 h-10 p-0 shadow-lg"
        >
          <ChevronRight className="w-5 h-5" />
        </Button>

        <div
          ref={scrollContainerRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 px-12 horizontal-scroll-container"
        >
          {recommendations.map((song) => (
            <div
              key={song.id}
              className="flex-shrink-0 w-[160px] sm:w-[180px] md:w-[200px] group"
            >
              {/* Image Container - Square aspect ratio */}
              <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900 shadow-2xl transition-all duration-300 group-hover:shadow-3xl">
                <img
                  src={getImageUrl(song.image) || "/placeholder.svg"}
                  alt={song.name}
                  className="w-full h-full object-cover cursor-pointer transition-transform duration-300 group-hover:scale-105"
                />

                {/* Hover Overlay with Controls */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center gap-2">
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      const artistName =
                        song.artists?.primary
                          ?.map((artist) => artist.name)
                          .join(", ") || "Unknown Artist";

                      // Create song object
                      const songObj = {
                        id: song.id,
                        title: song.name,
                        artist: artistName,
                      };

                      // Create queue from all recommendations for navigation
                      const queue = recommendations.map((s) => ({
                        id: s.id,
                        title: s.name,
                        artist:
                          s.artists?.primary
                            ?.map((artist) => artist.name)
                            .join(", ") || "Unknown Artist",
                      }));

                      // Recommendations Play Button - Queue created

                      await showPlayer(songObj, queue);
                    }}
                    className="w-10 h-10 bg-green-500/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-green-600/80 transition-all duration-200 hover:scale-110"
                    title="Play Song"
                  >
                    <Play className="w-4 h-4 text-white fill-white" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleMyListAction(song);
                    }}
                    className="w-10 h-10 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
                    title={
                      myList.has(song.id)
                        ? "Remove from liked songs"
                        : "Add to liked songs"
                    }
                  >
                    <Heart
                      className={`w-4 h-4 ${
                        myList.has(song.id)
                          ? "fill-red-400 text-red-400"
                          : "fill-white text-white"
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Text Content - Compact and centered */}
              <div className="mt-3 space-y-1 px-2">
                {/* Title */}
                <h4 className="font-semibold text-white text-center text-sm sm:text-xs md:text-sm truncate leading-tight line-clamp-2 min-h-[2rem] sm:min-h-[1.5rem] group-hover:text-blue-300 transition-colors duration-200">
                  {decodeHtmlEntities(song.name)}
                </h4>

                {/* Artist */}
                <p className="text-sm sm:text-xs md:text-sm text-gray-400 text-center truncate line-clamp-1 group-hover:text-gray-300 transition-colors duration-200">
                  {song.artists?.primary
                    ?.map((artist) => artist.name)
                    .join(", ") || "Unknown Artist"}
                </p>

                {/* Album */}
                {song.album?.name && (
                  <p className="text-xs text-gray-500 text-center truncate line-clamp-1 group-hover:text-gray-400 transition-colors duration-200">
                    {decodeHtmlEntities(song.album.name)}
                  </p>
                )}

                {/* Duration */}
                <div className="text-center">
                  <span className="text-xs text-gray-400 group-hover:text-gray-300 transition-colors duration-200">
                    {formatDuration(song.duration)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
