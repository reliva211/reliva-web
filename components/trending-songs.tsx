"use client";

import { useState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Heart, TrendingUp, Music } from "lucide-react";
import { useRouter } from "next/navigation";

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
  downloadUrl?: Array<{
    quality: string;
    url: string;
  }>;
}

interface Album {
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
  year: string;
  language: string;
  songCount: number;
  playCount: number;
  songs?: Song[];
}

interface Artist {
  id: string;
  name: string;
  image: Array<{
    quality: string;
    url: string;
  }>;
  type?: string;
}

interface TrendingSongsProps {
  onPlaySong: (song: Song) => void;
  onToggleLike: (song: Song) => void;
  likedSongs: Set<string>;
}

export default function TrendingSongs({
  onPlaySong,
  onToggleLike,
  likedSongs,
}: TrendingSongsProps) {
  const router = useRouter();
  const [trendingSongs, setTrendingSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getImageUrl = (
    image: Array<{ quality: string; url: string }> | string
  ) => {
    if (typeof image === "string") return image;
    if (Array.isArray(image) && image.length > 0) {
      const highQuality =
        image.find((img) => img.quality === "500x500") ||
        image[image.length - 1];
      return highQuality.url;
    }
    return "/diverse-group-making-music.png";
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    const fetchTrendingSongs = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/trending?limit=12");

        if (!response.ok) {
          throw new Error("Failed to fetch trending songs");
        }

        const data = await response.json();
        const songs = data.data?.results || [];

        setTrendingSongs(songs);
      } catch (err) {
        console.error("Error fetching trending songs:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load trending songs"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchTrendingSongs();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <TrendingUp className="w-6 h-6 text-blue-500" />
          <h3 className="text-xl font-bold text-white">Trending Now</h3>
          <Badge
            variant="secondary"
            className="bg-blue-500/20 text-blue-400 border-blue-500/30"
          >
            Hot
          </Badge>
        </div>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading trending songs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <TrendingUp className="w-6 h-6 text-blue-500" />
          <h3 className="text-xl font-bold text-white">Trending Now</h3>
        </div>
        <div className="text-center py-8">
          <Music className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-400 mb-2">Failed to load trending songs</p>
          <p className="text-sm text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  if (trendingSongs.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <TrendingUp className="w-6 h-6 text-blue-500" />
          <h3 className="text-xl font-bold text-white">Trending Now</h3>
        </div>
        <div className="text-center py-8">
          <Music className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-400">No trending songs available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <TrendingUp className="w-6 h-6 text-blue-500" />
        <h3 className="text-xl font-bold text-white">Trending Now</h3>
        <Badge
          variant="secondary"
          className="bg-blue-500/20 text-blue-400 border-blue-500/30"
        >
          Hot
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {trendingSongs.map((song, index) => (
          <div key={song.id} className="group">
            {/* Image Container - Square aspect ratio */}
            <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900 shadow-2xl transition-all duration-300 group-hover:shadow-3xl">
              <img
                src={getImageUrl(song.image) || "/placeholder.svg"}
                alt={song.name}
                className="w-full h-full object-cover cursor-pointer transition-transform duration-300 group-hover:scale-105"
              />

              {/* Hover Overlay with Controls */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center gap-2">
                <Button
                  size="sm"
                  className="bg-white text-black hover:bg-gray-100 shadow-lg"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPlaySong(song);
                  }}
                >
                  <Play className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className={`${
                    likedSongs.has(song.id)
                      ? "text-red-400 hover:text-red-300"
                      : "text-white hover:text-red-400"
                  } shadow-lg`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleLike(song);
                  }}
                >
                  <Heart
                    className={`w-4 h-4 ${
                      likedSongs.has(song.id) ? "fill-red-400" : ""
                    }`}
                  />
                </Button>
              </div>

              {/* Trending rank badge */}
              <div className="absolute top-2 left-2">
                <Badge
                  variant="secondary"
                  className="bg-blue-500 text-white text-xs"
                >
                  #{index + 1}
                </Badge>
              </div>
            </div>

            {/* Text Content - Compact and centered */}
            <div className="mt-3 space-y-1 px-2">
              {/* Title */}
              <h4
                className="font-semibold text-white text-center text-sm sm:text-xs md:text-sm truncate leading-tight line-clamp-2 min-h-[2rem] sm:min-h-[1.5rem] group-hover:text-blue-300 transition-colors duration-200"
                title={song.name}
              >
                {song.name}
              </h4>

              {/* Artist */}
              <p
                className="text-sm sm:text-xs md:text-sm text-gray-400 text-center truncate line-clamp-1 cursor-pointer hover:text-blue-400 transition-colors group-hover:text-gray-300"
                onClick={(e) => {
                  e.stopPropagation();
                  // Extract artist name and navigate to artist page
                  const artistName = song.artists?.primary?.[0]?.name;
                  if (artistName && artistName !== "Unknown Artist") {
                    // For now, we'll search for the artist since we don't have direct artist IDs
                    router.push(
                      `/music?search=${encodeURIComponent(
                        artistName
                      )}&type=artist`
                    );
                  }
                }}
              >
                {song.artists?.primary
                  ?.map((artist) => artist.name)
                  .join(", ") || "Unknown Artist"}
              </p>

              {/* Album */}
              {song.album?.name && (
                <p className="text-xs text-gray-500 text-center truncate line-clamp-1 group-hover:text-gray-400 transition-colors duration-200">
                  {song.album.name}
                </p>
              )}

              {/* Duration and Trending Icon */}
              <div className="flex items-center justify-center gap-2">
                <span className="text-xs text-gray-400 group-hover:text-gray-300 transition-colors duration-200">
                  {formatDuration(song.duration)}
                </span>
                <TrendingUp className="w-3 h-3 text-blue-400" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
