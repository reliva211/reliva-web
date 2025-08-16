"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Play,
  Star,
  Plus,
  Check,
  TrendingUp,
  Heart,
  Clock,
  RefreshCw,
  Users,
} from "lucide-react";
import { useCurrentUser } from "@/hooks/use-current-user";

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
  onPlaySong: (song: Song) => void;
  onToggleMyList: (songId: string) => void;
  onRateSong: (songId: string, rating: number) => void;
}

export function Recommendations({
  currentSong,
  ratings,
  myList,
  onPlaySong,
  onToggleMyList,
  onRateSong,
}: RecommendationsProps) {
  const { user: currentUser } = useCurrentUser();
  const [recommendations, setRecommendations] = useState<Song[]>([]);
  const [trendingSongs, setTrendingSongs] = useState<Song[]>([]);
  const [basedOnRatings, setBasedOnRatings] = useState<Song[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"trending" | "similar" | "rated">(
    "trending"
  );
  const [noFollowingMessage, setNoFollowingMessage] = useState<string | null>(
    null
  );

  // Get trending songs
  useEffect(() => {
    if (currentUser?.uid) {
      fetchTrendingSongs();
    }
  }, [currentUser]);

  // Get recommendations based on current song
  useEffect(() => {
    if (currentSong && currentUser?.uid) {
      fetchSimilarSongs(currentSong.id);
    }
  }, [currentSong, currentUser]);

  // Get recommendations based on highly rated songs
  useEffect(() => {
    if (currentUser?.uid) {
      const highlyRatedSongs = Object.entries(ratings)
        .filter(([_, rating]) => rating >= 4)
        .map(([songId]) => songId);

      if (highlyRatedSongs.length > 0) {
        fetchBasedOnRatings(highlyRatedSongs[0]); // Use the first highly rated song
      }
    }
  }, [ratings, currentUser]);

  const fetchTrendingSongs = async () => {
    if (!currentUser?.uid) return;

    setLoading(true);
    try {
      const response = await fetch(
        `/api/recommendations?userId=${currentUser.uid}&limit=12`
      );
      const data = await response.json();

      if (data.message && data.results.length === 0) {
        setNoFollowingMessage(data.message);
        setTrendingSongs([]);
        return;
      }

      let results: Song[] = [];
      if (data.data?.results) {
        results = data.data.results;
      } else if (data.results) {
        results = data.results;
      } else if (Array.isArray(data)) {
        results = data;
      }

      setTrendingSongs(results.slice(0, 12));
      setNoFollowingMessage(null);
    } catch (error) {
      console.error("Error fetching trending songs:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSimilarSongs = async (songId: string) => {
    if (!currentUser?.uid) return;

    try {
      const response = await fetch(
        `/api/recommendations?userId=${currentUser.uid}&songId=${songId}&limit=8`
      );
      const data = await response.json();

      let results: Song[] = [];
      if (data.data?.results) {
        results = data.data.results;
      } else if (data.results) {
        results = data.results;
      } else if (Array.isArray(data)) {
        results = data;
      }

      setRecommendations(results.slice(0, 8));
    } catch (error) {
      console.error("Error fetching similar songs:", error);
    }
  };

  const fetchBasedOnRatings = async (songId: string) => {
    if (!currentUser?.uid) return;

    try {
      const response = await fetch(
        `/api/recommendations?userId=${currentUser.uid}&songId=${songId}&limit=8`
      );
      const data = await response.json();

      let results: Song[] = [];
      if (data.data?.results) {
        results = data.data.results;
      } else if (data.results) {
        results = data.results;
      } else if (Array.isArray(data)) {
        results = data;
      }

      setBasedOnRatings(results.slice(0, 8));
    } catch (error) {
      console.error("Error fetching recommendations based on ratings:", error);
    }
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
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-3 h-3 cursor-pointer transition-colors ${
              star <= currentRating
                ? "fill-white text-white"
                : "text-gray-500 hover:text-gray-300"
            }`}
            onClick={(e) => {
              e.stopPropagation();
              onRateSong(songId, star);
            }}
          />
        ))}
      </div>
    );
  };

  const getCurrentRecommendations = () => {
    switch (activeTab) {
      case "trending":
        return trendingSongs;
      case "similar":
        return recommendations;
      case "rated":
        return basedOnRatings;
      default:
        return trendingSongs;
    }
  };

  const getTabTitle = () => {
    switch (activeTab) {
      case "trending":
        return "From People You Follow";
      case "similar":
        return currentSong
          ? `Similar to "${currentSong.name}"`
          : "Similar Songs";
      case "rated":
        return "Based on Your Ratings";
      default:
        return "Recommendations";
    }
  };

  const getTabIcon = () => {
    switch (activeTab) {
      case "trending":
        return <Users className="w-4 h-4" />;
      case "similar":
        return <RefreshCw className="w-4 h-4" />;
      case "rated":
        return <Heart className="w-4 h-4" />;
      default:
        return <Users className="w-4 h-4" />;
    }
  };

  // Show message when user is not following anyone
  if (noFollowingMessage && activeTab === "trending") {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4" />
          <h2 className="text-2xl font-bold text-white">
            From People You Follow
          </h2>
        </div>
        
        <div className="text-center py-12">
          <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">
            No Recommendations Yet
          </h3>
          <p className="text-gray-400 mb-6">{noFollowingMessage}</p>
          <Button 
            onClick={() => (window.location.href = "/users")}
            className="bg-white text-black hover:bg-gray-100"
          >
            <Users className="w-4 h-4 mr-2" />
            Friends
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getTabIcon()}
          <h2 className="text-2xl font-bold text-white">{getTabTitle()}</h2>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={activeTab === "trending" ? "default" : "outline"}
            onClick={() => setActiveTab("trending")}
            className={
              activeTab === "trending"
                ? "bg-white text-black"
                : "border-gray-600 text-white hover:bg-gray-800"
            }
          >
            <Users className="w-4 h-4 mr-1" />
            Following
          </Button>
          {currentSong && (
            <Button
              size="sm"
              variant={activeTab === "similar" ? "default" : "outline"}
              onClick={() => setActiveTab("similar")}
              className={
                activeTab === "similar"
                  ? "bg-white text-black"
                  : "border-gray-600 text-white hover:bg-gray-800"
              }
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              Similar
            </Button>
          )}
          {Object.keys(ratings).length > 0 && (
            <Button
              size="sm"
              variant={activeTab === "rated" ? "default" : "outline"}
              onClick={() => setActiveTab("rated")}
              className={
                activeTab === "rated"
                  ? "bg-white text-black"
                  : "border-gray-600 text-white hover:bg-gray-800"
              }
            >
              <Heart className="w-4 h-4 mr-1" />
              For You
            </Button>
          )}
        </div>
      </div>

      {/* Recommendations Grid */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-gray-400">Loading recommendations...</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {getCurrentRecommendations().map((song) => (
            <Card
              key={song.id}
              className="bg-gray-900 border-gray-700 cursor-pointer"
              onClick={() => onPlaySong(song)}
            >
              <CardHeader className="pb-2">
                <div className="relative">
                  <img
                    src={
                      song.image?.[1]?.url ||
                      song.image?.[0]?.url ||
                      "/placeholder.svg?height=150&width=150&query=music" ||
                      "/placeholder.svg"
                    }
                    alt={song.name}
                    className="w-full aspect-square rounded-lg object-cover"
                  />
                  {ratings[song.id] > 0 && (
                    <Badge className="absolute top-2 left-2 bg-white text-black text-xs">
                      {ratings[song.id]}★
                    </Badge>
                  )}
                  {myList.has(song.id) && (
                    <Badge className="absolute top-2 right-2 bg-green-600 text-white text-xs">
                      <Check className="w-3 h-3" />
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="space-y-2">
                  <h3
                    className="font-semibold text-white text-sm truncate"
                    title={song.name}
                  >
                    {song.name}
                  </h3>
                  <p className="text-xs text-gray-300 truncate">
                    {song.artists?.primary
                      ?.map((artist) => artist.name)
                      .join(", ") || "Unknown Artist"}
                  </p>

                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDuration(song.duration)}
                    </span>
                    <span>{song.year}</span>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <StarRating
                      songId={song.id}
                      currentRating={ratings[song.id] || 0}
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      className={`p-1 h-6 w-6 ${
                        myList.has(song.id)
                          ? "text-green-500"
                          : "text-gray-400 hover:text-white"
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleMyList(song.id);
                      }}
                    >
                      {myList.has(song.id) ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Plus className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {getCurrentRecommendations().length === 0 && !loading && (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">
            {activeTab === "similar" &&
              "Play a song to get similar recommendations"}
            {activeTab === "rated" &&
              "Rate some songs to get personalized recommendations"}
            {activeTab === "trending" && "No trending songs available"}
          </div>
        </div>
      )}
    </div>
  );
}
