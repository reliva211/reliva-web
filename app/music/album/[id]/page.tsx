"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { use } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Disc, Music, Clock, Play, Heart } from "lucide-react";

interface Song {
  id: string;
  name: string;
  type: string;
  year: string | null;
  releaseDate: string | null;
  duration: number | null;
  label: string | null;
  explicitContent: boolean;
  playCount: number | null;
  language: string;
  hasLyrics: boolean;
  lyricsId: string | null;
  url: string;
  copyright: string | null;
  album: {
    id: string | null;
    name: string | null;
    url: string | null;
  };
  artists: {
    primary: Array<{
      id: string;
      name: string;
      role: string;
      type: string;
      image: Array<{
        quality: string;
        url: string;
      }>;
      url: string;
    }>;
    featured: Array<{
      id: string;
      name: string;
      role: string;
      type: string;
      image: Array<{
        quality: string;
        url: string;
      }>;
      url: string;
    }>;
    all: Array<{
      id: string;
      name: string;
      role: string;
      type: string;
      image: Array<{
        quality: string;
        url: string;
      }>;
      url: string;
    }>;
  };
  image: Array<{
    quality: string;
    url: string;
  }>;
  downloadUrl: Array<{
    quality: string;
    url: string;
  }>;
}

interface Album {
  id: string;
  name: string;
  description: string;
  year: number | null;
  type: string;
  playCount: number | null;
  language: string;
  explicitContent: boolean;
  artists: {
    primary: Array<{
      id: string;
      name: string;
      role: string;
      type: string;
      image: Array<{
        quality: string;
        url: string;
      }>;
      url: string;
    }>;
    featured: Array<{
      id: string;
      name: string;
      role: string;
      type: string;
      image: Array<{
        quality: string;
        url: string;
      }>;
      url: string;
    }>;
    all: Array<{
      id: string;
      name: string;
      role: string;
      type: string;
      image: Array<{
        quality: string;
        url: string;
      }>;
      url: string;
    }>;
  };
  songCount: number | null;
  url: string;
  image: Array<{
    quality: string;
    url: string;
  }>;
  songs: Song[] | null;
}

export default function AlbumDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [album, setAlbum] = useState<Album | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  const getImageUrl = (images: any[]) => {
    return (
      images?.[2]?.url ||
      images?.[1]?.url ||
      images?.[0]?.url ||
      "/placeholder.svg"
    );
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    const fetchAlbumDetails = async () => {
      if (!resolvedParams.id) return;

      setLoading(true);
      try {
        // Fetch album details using the album ID directly
        const albumResponse = await fetch(
          `/api/saavn/album?id=${resolvedParams.id}`
        );
        const albumData = await albumResponse.json();

        if (albumData.data) {
          setAlbum(albumData.data);
        } else {
          setError("Album not found");
        }
      } catch (err) {
        console.error("Error fetching album details:", err);
        setError("Failed to load album details");
      } finally {
        setLoading(false);
      }
    };

    fetchAlbumDetails();
  }, [resolvedParams.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-16">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
              <p className="text-gray-400 text-lg">Loading album details...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !album) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-16">
            <Disc className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">
              Album Not Found
            </h1>
            <p className="text-gray-400 mb-4">
              {error || "The album you're looking for doesn't exist."}
            </p>
            <Button
              onClick={() => router.push("/music")}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Back to Music
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gradient-to-r from-gray-900/95 to-gray-800/95 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="text-gray-400 hover:text-white"
            >
              ← Back
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Album Header */}
        <div className="relative mb-12">
          {/* Background gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gray-900/50 to-gray-900 rounded-3xl"></div>

          <div className="relative flex flex-col md:flex-row gap-8 p-8 bg-gradient-to-r from-gray-800/30 to-gray-700/30 rounded-3xl border border-gray-700/50 backdrop-blur-sm">
            <div className="flex-shrink-0">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
                <img
                  src={getImageUrl(album.image)}
                  alt={album.name}
                  className="relative w-48 h-48 md:w-64 md:h-64 rounded-xl object-cover shadow-2xl ring-4 ring-gray-700/50 group-hover:ring-gray-600/50 transition-all duration-300"
                />
                <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
            </div>

            <div className="flex-1 flex flex-col justify-center">
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent mb-3">
                    {album.name}
                  </h1>
                  <div className="flex items-center gap-4 text-gray-300 mb-4">
                    <span className="text-lg font-medium hover:text-blue-300 transition-colors cursor-pointer">
                      {album.artists?.primary
                        ?.map((artist) => artist.name)
                        .join(", ") || "Unknown Artist"}
                    </span>
                    {album.year && (
                      <Badge
                        variant="secondary"
                        className="bg-green-500/20 text-green-300 border-green-500/30"
                      >
                        {album.year}
                      </Badge>
                    )}
                    {album.language && (
                      <Badge
                        variant="secondary"
                        className="bg-orange-500/20 text-orange-300 border-orange-500/30"
                      >
                        {album.language}
                      </Badge>
                    )}
                  </div>
                </div>

                <Button
                  size="lg"
                  className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg transition-all duration-200 transform hover:scale-105"
                >
                  <Heart className="w-5 h-5 mr-2" />
                  Like
                </Button>
              </div>

              <div className="flex items-center gap-8">
                <div className="flex items-center gap-3 bg-gray-800/50 px-4 py-2 rounded-full border border-gray-700/50">
                  <Music className="w-5 h-5 text-purple-400" />
                  <span className="text-white font-medium">
                    {album.songCount} songs
                  </span>
                </div>
                {album.playCount && (
                  <div className="flex items-center gap-3 bg-gray-800/50 px-4 py-2 rounded-full border border-gray-700/50">
                    <Play className="w-5 h-5 text-green-400" />
                    <span className="text-white font-medium">
                      {album.playCount.toLocaleString()} plays
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-gray-800/30 border border-gray-700/50 rounded-xl p-1 backdrop-blur-sm">
            <TabsTrigger
              value="overview"
              className="text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600/20 data-[state=active]:to-pink-600/20 data-[state=active]:border data-[state=active]:border-purple-500/30 rounded-lg transition-all duration-200"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="songs"
              className="text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600/20 data-[state=active]:to-pink-600/20 data-[state=active]:border data-[state=active]:border-purple-500/30 rounded-lg transition-all duration-200"
            >
              Songs
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-8">
            <div className="grid gap-8 md:grid-cols-2">
              {/* Album Info Section */}
              <div className="bg-gray-800/20 rounded-2xl p-6 border border-gray-700/50 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                    <Disc className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">Album Info</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-gray-800/30 rounded-lg border border-gray-700/30">
                    <span className="text-gray-400 font-medium">Artist</span>
                    <span className="text-white font-semibold">
                      {album.artists?.primary
                        ?.map((artist) => artist.name)
                        .join(", ") || "Unknown Artist"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-800/30 rounded-lg border border-gray-700/30">
                    <span className="text-gray-400 font-medium">
                      Release Year
                    </span>
                    <span className="text-white font-semibold">
                      {album.year || "Unknown"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-800/30 rounded-lg border border-gray-700/30">
                    <span className="text-gray-400 font-medium">Language</span>
                    <span className="text-white font-semibold">
                      {album.language || "Unknown"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-800/30 rounded-lg border border-gray-700/30">
                    <span className="text-gray-400 font-medium">
                      Total Songs
                    </span>
                    <span className="text-white font-semibold">
                      {album.songCount || 0}
                    </span>
                  </div>
                  {album.playCount && (
                    <div className="flex justify-between items-center p-3 bg-gray-800/30 rounded-lg border border-gray-700/30">
                      <span className="text-gray-400 font-medium">
                        Total Plays
                      </span>
                      <span className="text-white font-semibold">
                        {album.playCount.toLocaleString()}
                      </span>
                    </div>
                  )}
                  {album.description && (
                    <div className="p-3 bg-gray-800/30 rounded-lg border border-gray-700/30">
                      <span className="text-gray-400 font-medium block mb-2">
                        Description
                      </span>
                      <span className="text-white leading-relaxed">
                        {album.description}
                      </span>
                    </div>
                  )}
                  {album.explicitContent && (
                    <div className="flex justify-between items-center p-3 bg-red-500/10 rounded-lg border border-red-500/30">
                      <span className="text-red-400 font-medium">
                        Explicit Content
                      </span>
                      <Badge
                        variant="destructive"
                        className="bg-red-500/20 text-red-300 border-red-500/30"
                      >
                        Yes
                      </Badge>
                    </div>
                  )}
                </div>
              </div>

              {/* Album Actions Section */}
              <div className="bg-gray-800/20 rounded-2xl p-6 border border-gray-700/50 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg flex items-center justify-center">
                    <Play className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">
                    Album Actions
                  </h3>
                </div>
                <div className="space-y-4">
                  <Button className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white h-12 text-lg font-semibold shadow-lg transition-all duration-200 transform hover:scale-105">
                    <Play className="w-5 h-5 mr-3" />
                    Play Album
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full border-gray-600 hover:bg-gray-700 text-white h-12 text-lg font-medium transition-all duration-200"
                    onClick={() => setActiveTab("songs")}
                  >
                    <Music className="w-5 h-5 mr-3" />
                    View All Songs
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full border-purple-600 hover:bg-purple-600/20 text-purple-300 h-12 text-lg font-medium transition-all duration-200"
                  >
                    <Heart className="w-5 h-5 mr-3" />
                    Add to Library
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Songs Tab */}
          <TabsContent value="songs" className="mt-8">
            {album.songs && album.songs.length > 0 ? (
              <div className="bg-gray-800/20 rounded-2xl p-6 border border-gray-700/50 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                    <Music className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">Album Songs</h3>
                </div>
                <div className="space-y-3">
                  {album.songs.map((song, index) => (
                    <div
                      key={song.id}
                      className="flex items-center gap-4 p-4 bg-gray-800/30 rounded-xl hover:bg-gray-700/40 transition-all duration-200 cursor-pointer group border border-gray-700/30 hover:border-gray-600/50"
                      onClick={() => router.push(`/music/song/${song.id}`)}
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-xs font-bold text-white">
                          {index + 1}
                        </div>
                        <div className="relative">
                          <img
                            src={getImageUrl(song.image)}
                            alt={song.name}
                            className="w-14 h-14 rounded-lg object-cover group-hover:scale-110 transition-transform duration-200"
                          />
                          <div className="absolute inset-0 bg-black/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-white truncate group-hover:text-blue-300 transition-colors">
                            {song.name}
                          </h4>
                          <p className="text-sm text-gray-400 truncate">
                            {song.artists.primary
                              .map((artist) => artist.name)
                              .join(", ")}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-sm text-gray-400 bg-gray-800/50 px-3 py-1 rounded-full">
                          {formatDuration(song.duration)}
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-gray-400 hover:text-white"
                        >
                          <Play className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-gray-800/20 rounded-2xl p-12 border border-gray-700/50 backdrop-blur-sm text-center">
                <Music className="w-20 h-20 text-gray-400 mx-auto mb-6" />
                <h3 className="text-2xl font-bold text-white mb-3">
                  No Songs Found
                </h3>
                <p className="text-gray-400 text-lg">
                  This album doesn't have any songs available.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
