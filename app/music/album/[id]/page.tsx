"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { use } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Disc,
  Music,
  Clock,
  Play,
  Heart,
  Star,
  Plus,
  Check,
  ChevronLeft,
} from "lucide-react";
import { useMusicCollections } from "@/hooks/use-music-collections";
import { useYouTubePlayer } from "@/hooks/use-youtube-player";
import { useToast } from "@/hooks/use-toast";
import { StructuredData } from "@/components/structured-data";

const decodeHtmlEntities = (text: string) => {
  const textarea = document.createElement("textarea");
  textarea.innerHTML = text;
  return textarea.value;
};

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
  const [activeTab, setActiveTab] = useState("songs");

  const {
    isAlbumInRecommendations,
    addAlbumToRecommendations,
    removeAlbumFromRecommendations,
    likedSongs,
    likeSong,
    unlikeSong,
    isSongLiked,
    likeAlbum,
    unlikeAlbum,
    isAlbumLiked,
  } = useMusicCollections();
  const { showPlayer } = useYouTubePlayer();
  const { toast } = useToast();

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
        // Check if this is a Last.fm album ID
        if (resolvedParams.id.startsWith("lastfm-")) {
          console.log(`🎵 Detected Last.fm album ID: ${resolvedParams.id}`);

          // Get artist and album names from URL parameters
          const urlParams = new URLSearchParams(window.location.search);
          const artistName = urlParams.get("artist");
          const albumName = urlParams.get("album");

          if (!artistName || !albumName) {
            setError("Missing artist or album information for Last.fm album");
            return;
          }

          // Fetch album details from Last.fm
          const lastfmAlbumResponse = await fetch(
            `/api/lastfm/album?id=${
              resolvedParams.id
            }&artist=${encodeURIComponent(
              artistName
            )}&album=${encodeURIComponent(albumName)}`
          );
          const lastfmAlbumData = await lastfmAlbumResponse.json();

          if (lastfmAlbumData.data) {
            setAlbum(lastfmAlbumData.data);
          } else {
            setError(
              "Last.fm album not found or no detailed information available"
            );
          }
          return;
        }

        // Fetch album details from Saavn for regular albums
        console.log(
          `🎵 Fetching Saavn album details for ID: ${resolvedParams.id}`
        );
        const albumResponse = await fetch(
          `/api/saavn/album?id=${resolvedParams.id}`
        );
        const albumData = await albumResponse.json();

        // Album Data received

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

  // Handle like/unlike song
  const handleLikeSong = async (song: any) => {
    try {
      if (isSongLiked(song.id)) {
        await unlikeSong(song.id);
        toast({
          title: "Removed from liked songs",
          description: `${decodeHtmlEntities(
            song.name
          )} has been removed from your liked songs.`,
        });
      } else {
        await likeSong(song);
        toast({
          title: "Added to liked songs",
          description: `${decodeHtmlEntities(
            song.name
          )} has been added to your liked songs.`,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update liked songs. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle like/unlike album
  const handleLikeAlbum = async (album: any) => {
    try {
      if (isAlbumLiked(album.id)) {
        await unlikeAlbum(album.id);
        toast({
          title: "Album removed from liked albums",
          description: `${decodeHtmlEntities(
            album.name
          )} has been removed from your liked albums.`,
        });
      } else {
        // Convert Album to MusicAlbum format
        const musicAlbum = {
          id: album.id,
          name: decodeHtmlEntities(album.name || "Unknown Album"),
          artists: album.artists || { primary: [] },
          image: album.image || [],
          year: album.year?.toString() || "Unknown",
          language: album.language || "Unknown",
          songCount: album.songCount || 0,
          playCount: album.playCount || 0,
          songs:
            album.songs?.map((song: any) => ({
              id: song.id,
              name: decodeHtmlEntities(song.name),
              artists: song.artists,
              image: song.image,
              duration: song.duration,
              album: song.album,
              url: song.url,
              language: song.language,
              year: song.year,
              playCount: song.playCount,
              downloadUrl: song.downloadUrl,
            })) || [],
        };
        await likeAlbum(musicAlbum);
        toast({
          title: "Album added to liked albums",
          description: `${decodeHtmlEntities(
            album.name
          )} has been added to your liked albums.`,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update liked albums. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAddToRecommendations = async () => {
    if (!album) return;

    try {
      if (isAlbumInRecommendations(album.id)) {
        await removeAlbumFromRecommendations(album.id);
        toast({
          title: "Removed from recommendations",
          description: `${decodeHtmlEntities(
            album.name
          )} has been removed from your recommendations.`,
        });
      } else {
        // Convert Album to MusicAlbum format
        const musicAlbum = {
          id: album.id,
          name: decodeHtmlEntities(album.name || "Unknown Album"),
          artists: album.artists || { primary: [] },
          image: album.image || [],
          year: album.year?.toString() || "Unknown",
          language: album.language || "Unknown",
          songCount: album.songCount || 0,
          playCount: album.playCount || 0,
          songs:
            album.songs?.map((song) => ({
              id: song.id,
              name: decodeHtmlEntities(song.name),
              artists: {
                primary: song.artists.primary.map((artist) => ({
                  id: artist.id,
                  name: decodeHtmlEntities(artist.name),
                })),
              },
              image: song.image,
              album: {
                name: song.album?.name || "Unknown Album",
              },
              duration: song.duration || 0,
              year: song.year || "Unknown",
              language: song.language || "Unknown",
              playCount: song.playCount || 0,
              downloadUrl: song.downloadUrl,
              addedAt: new Date().toISOString(),
            })) || [],
        };

        await addAlbumToRecommendations(musicAlbum);
        toast({
          title: "Added to recommendations",
          description: `${decodeHtmlEntities(
            album.name
          )} has been added to your recommendations.`,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update recommendations. Please try again.",
        variant: "destructive",
      });
    }
  };

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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Structured Data for SEO */}
      {album && (
        <StructuredData
          type="music"
          data={{
            id: album.id,
            name: album.name,
            artists: album.artists,
            image: album.image,
            year: album.year,
            songCount: album.songs?.length,
          }}
        />
      )}

      {/* Hero Section with Dynamic Background */}
      <div className="relative mb-12 overflow-hidden">
        {album && (
          <>
            <div className="absolute inset-0">
              <img
                src={getImageUrl(album.image)}
                alt={decodeHtmlEntities(album.name)}
                className="w-full h-full object-cover blur-sm scale-110"
              />
            </div>
            {/* Overlay to reduce background image opacity */}
            <div className="absolute inset-0 bg-black/60"></div>
          </>
        )}

        <div className="relative z-10 p-8 lg:p-12">
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4 sm:mb-6 rounded-xl hover:bg-white/10 transition-all duration-200 group text-white/80 hover:text-white"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </Button>

          {/* Mobile Album Header */}
          <div className="sm:hidden space-y-4 mb-6">
            {/* Album Cover and Info */}
            <div className="flex flex-row gap-4">
              {/* Album Image */}
              <div className="flex-shrink-0">
                <div className="relative group w-36 h-36">
                  <div className="aspect-square rounded-xl overflow-hidden bg-gradient-to-br from-muted to-muted/50 shadow-xl">
                    <img
                      src={getImageUrl(album.image)}
                      alt={decodeHtmlEntities(album.name)}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>

              {/* Album Info */}
              <div className="flex-1 space-y-3 text-left">
                <h1 className="text-xl font-bold text-white leading-tight line-clamp-2">
                  {decodeHtmlEntities(album.name)}
                </h1>

                {/* Tags in a horizontal row */}
                <div className="flex flex-wrap gap-1.5">
                  <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/15 backdrop-blur-sm border border-white/25">
                    <Music className="h-2.5 w-2.5 text-white" />
                    <span className="text-xs font-medium text-white truncate max-w-20">
                      {album.artists?.primary?.length > 0
                        ? album.artists.primary
                            .map((artist) => decodeHtmlEntities(artist.name))
                            .join(", ")
                        : "Unknown Artist"}
                    </span>
                  </div>
                  {album.year && (
                    <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/15 backdrop-blur-sm border border-white/25">
                      <Clock className="h-2.5 w-2.5 text-white" />
                      <span className="text-xs font-medium text-white">
                        {album.year}
                      </span>
                    </div>
                  )}
                  {album.language && (
                    <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/15 backdrop-blur-sm border border-white/25">
                      <span className="text-xs font-medium text-white capitalize">
                        {album.language}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Mobile Action Buttons - Centered Below */}
            <div className="flex gap-2 justify-center">
              <Button
                size="sm"
                variant="outline"
                className="rounded-lg hover:bg-white/20 transition-all duration-200 group bg-white/10 border-white/20 shadow-md h-7 text-xs text-white"
                onClick={async () => {
                  if (album && album.songs && album.songs.length > 0) {
                    // Create queue from all album songs
                    const queue = album.songs.map((song) => ({
                      id: song.id,
                      title: decodeHtmlEntities(song.name),
                      artist:
                        song.artists?.primary?.length > 0
                          ? song.artists.primary
                              .map((artist) => decodeHtmlEntities(artist.name))
                              .join(", ")
                          : "Unknown Artist",
                    }));

                    // Start with the first song
                    await showPlayer(queue[0], queue, 0);
                  }
                }}
              >
                <Play className="w-3 h-3 mr-1" />
                Play
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="rounded-lg hover:bg-white/20 transition-all duration-200 group bg-white/10 border-white/20 shadow-md h-7 text-xs text-white"
                onClick={() => {
                  if (album) {
                    handleLikeAlbum(album);
                  }
                }}
              >
                <Heart
                  className={`w-3 h-3 mr-1 ${
                    album && isAlbumLiked(album.id) ? "fill-red-400" : ""
                  }`}
                />
                {album && isAlbumLiked(album.id) ? "Liked" : "Like"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="rounded-lg hover:bg-white/20 transition-all duration-200 group bg-white/10 border-white/20 shadow-md h-7 text-xs text-white"
                onClick={handleAddToRecommendations}
              >
                {isAlbumInRecommendations(album.id) ? (
                  <>
                    <Check className="w-3 h-3 mr-1" />
                    Added
                  </>
                ) : (
                  <>
                    <Plus className="w-3 h-3 mr-1" />
                    Add
                  </>
                )}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="rounded-lg hover:bg-white/20 transition-all duration-200 group bg-white/10 border-white/20 shadow-md h-7 text-xs text-white"
                onClick={() => {
                  const params = new URLSearchParams({
                    type: "music",
                    id: album.id,
                    title: decodeHtmlEntities(album.name),
                    cover: getImageUrl(album.image),
                    artist:
                      album.artists?.primary?.length > 0
                        ? album.artists.primary
                            .map((artist) => decodeHtmlEntities(artist.name))
                            .join(", ")
                        : "Unknown Artist",
                  });
                  router.push(`/reviews?${params.toString()}`);
                }}
              >
                <Star className="w-3 h-3 mr-1" />
                Rate
              </Button>
            </div>
          </div>

          {/* Desktop Album Header */}
          <div className="hidden sm:flex flex-col lg:flex-row gap-4 sm:gap-6 mb-6 sm:mb-8">
            {/* Album Image */}
            <div className="w-full lg:w-1/3 flex justify-center lg:justify-start">
              <div className="relative group w-48 sm:w-56 lg:w-auto lg:max-w-xs">
                <div className="aspect-square rounded-xl overflow-hidden bg-gradient-to-br from-muted to-muted/50 shadow-xl group-hover:shadow-2xl transition-all duration-300">
                  <img
                    src={getImageUrl(album.image)}
                    alt={decodeHtmlEntities(album.name)}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                {/* Subtle overlay gradient */}
                <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-black/10 via-transparent to-transparent pointer-events-none"></div>
              </div>
            </div>

            {/* Album Info */}
            <div className="flex-1 space-y-3 sm:space-y-4 text-center lg:text-left">
              <div className="space-y-3 sm:space-y-4">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight">
                  {decodeHtmlEntities(album.name)}
                </h1>

                <div className="flex flex-col sm:flex-row items-center sm:items-center gap-2 justify-center lg:justify-start">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20">
                    <Music className="h-3 w-3 text-white" />
                    <span className="text-xs font-medium text-white">
                      {album.artists?.primary?.length > 0
                        ? album.artists.primary
                            .map((artist) => decodeHtmlEntities(artist.name))
                            .join(", ")
                        : "Unknown Artist"}
                    </span>
                  </div>
                  {album.year && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20">
                      <Clock className="h-3 w-3 text-white" />
                      <span className="text-xs font-medium text-white">
                        {album.year}
                      </span>
                    </div>
                  )}
                  {album.explicitContent && (
                    <Badge
                      variant="destructive"
                      className="rounded-lg px-3 py-1.5 text-xs font-medium shadow-md"
                    >
                      Explicit
                    </Badge>
                  )}
                  {album.language && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20">
                      <span className="text-xs font-medium text-white capitalize">
                        {album.language}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 pt-2 justify-center lg:justify-start">
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-lg hover:bg-white/20 transition-all duration-200 group bg-white/10 border-white/20 shadow-md h-8 text-xs text-white"
                  onClick={async () => {
                    if (album && album.songs && album.songs.length > 0) {
                      // Create queue from all album songs
                      const queue = album.songs.map((song) => ({
                        id: song.id,
                        title: decodeHtmlEntities(song.name),
                        artist:
                          song.artists?.primary?.length > 0
                            ? song.artists.primary
                                .map((artist) =>
                                  decodeHtmlEntities(artist.name)
                                )
                                .join(", ")
                            : "Unknown Artist",
                      }));

                      // Album Play Button - Queue created

                      // Start with the first song
                      await showPlayer(queue[0], queue, 0);
                    }
                  }}
                >
                  <Play className="w-3 h-3 mr-1" />
                  Play Album
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (album) {
                      handleLikeAlbum(album);
                    }
                  }}
                  className={`rounded-lg hover:bg-white/20 transition-all duration-200 group bg-white/10 border-white/20 shadow-md h-8 text-xs ${
                    album && isAlbumLiked(album.id)
                      ? "bg-red-500/30 text-red-300 border-red-400/50"
                      : "text-white"
                  }`}
                >
                  <Heart
                    className={`w-3 h-3 mr-1 group-hover:scale-110 transition-transform ${
                      album && isAlbumLiked(album.id) ? "fill-red-400" : ""
                    }`}
                  />
                  {album && isAlbumLiked(album.id) ? "Liked" : "Like"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleAddToRecommendations}
                  className={`rounded-lg hover:scale-105 transition-all duration-200 group bg-white/10 border-white/20 shadow-md h-8 text-xs ${
                    isAlbumInRecommendations(album.id)
                      ? "bg-blue-500/30 text-blue-300 border-blue-400/50"
                      : "text-white"
                  }`}
                >
                  {isAlbumInRecommendations(album.id) ? (
                    <>
                      <Check className="w-3 h-3 mr-1" />
                      Recommended
                    </>
                  ) : (
                    <>
                      <Plus className="w-3 h-3 mr-1" />
                      Recommend
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const params = new URLSearchParams({
                      type: "music",
                      id: album.id,
                      title: decodeHtmlEntities(album.name),
                      cover: getImageUrl(album.image),
                      artist:
                        album.artists?.primary?.length > 0
                          ? album.artists.primary
                              .map((artist) => decodeHtmlEntities(artist.name))
                              .join(", ")
                          : "Unknown Artist",
                    });
                    router.push(`/reviews?${params.toString()}`);
                  }}
                  className="rounded-lg hover:scale-105 transition-all duration-200 group bg-white/10 border-white/20 shadow-md h-8 text-xs text-white"
                >
                  <Star className="w-3 h-3 mr-1 group-hover:scale-110 transition-transform" />
                  Rate
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="container mx-auto px-4 py-4 sm:py-6">
        <div className="space-y-6">
          <Tabs defaultValue="songs" className="space-y-4">
            <TabsList className="inline-flex h-10 items-center justify-center rounded-lg bg-muted/30 backdrop-blur-sm border border-border/20 p-1 gap-1 mx-auto lg:mx-0">
              <TabsTrigger
                value="songs"
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm hover:bg-muted/50"
              >
                Songs ({album.songs?.length || 0})
              </TabsTrigger>
            </TabsList>

            {/* Songs Tab */}
            <TabsContent value="songs" className="space-y-4">
              {album.songs && album.songs.length > 0 ? (
                <div className="space-y-2 px-2 sm:px-0">
                  {album.songs.map((song, index) => (
                    <div
                      key={song.id}
                      className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-muted/30 backdrop-blur-sm rounded-lg hover:bg-muted/50 transition-all duration-200 group border border-border/20"
                    >
                      {/* Album cover instead of number */}
                      <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-md sm:rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={getImageUrl(song.image || album.image)}
                          alt={decodeHtmlEntities(song.name)}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0 pr-2 sm:pr-3">
                            <h4 className="text-sm sm:text-base font-medium text-foreground truncate">
                              {decodeHtmlEntities(song.name)}
                            </h4>
                            <p className="text-sm text-muted-foreground truncate">
                              {song.artists.primary
                                .map((artist) =>
                                  decodeHtmlEntities(artist.name)
                                )
                                .join(", ")}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 sm:gap-3 flex-shrink-0">
                            <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
                              {formatDuration(song.duration)}
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                const params = new URLSearchParams({
                                  type: "music",
                                  id: song.id,
                                  title: decodeHtmlEntities(song.name),
                                  cover: getImageUrl(song.image || album.image),
                                  artist: song.artists.primary
                                    .map((artist) =>
                                      decodeHtmlEntities(artist.name)
                                    )
                                    .join(", "),
                                });
                                router.push(`/reviews?${params.toString()}`);
                              }}
                              className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-muted-foreground hover:text-yellow-500 w-4 h-4 sm:w-8 sm:h-8 p-0 rounded-full bg-yellow-500/10 hover:bg-yellow-500/20"
                              title="Rate Song"
                            >
                              <Star className="w-3 h-3 sm:w-3 sm:h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-muted-foreground hover:text-green-500 w-4 h-4 sm:w-8 sm:h-8 p-0 rounded-full bg-green-500/10 hover:bg-green-500/20"
                              onClick={async (e) => {
                                e.stopPropagation();
                                if (album && album.songs) {
                                  // Create queue from all album songs
                                  const queue = album.songs.map((s) => ({
                                    id: s.id,
                                    title: decodeHtmlEntities(s.name),
                                    artist:
                                      s.artists?.primary?.length > 0
                                        ? s.artists.primary
                                            .map((artist) =>
                                              decodeHtmlEntities(artist.name)
                                            )
                                            .join(", ")
                                        : "Unknown Artist",
                                  }));

                                  // Find the current song index
                                  const songIndex = album.songs.findIndex(
                                    (s) => s.id === song.id
                                  );

                                  // Individual Song Play Button - Queue created

                                  // Start with the clicked song
                                  await showPlayer(
                                    queue[songIndex],
                                    queue,
                                    songIndex
                                  );
                                }
                              }}
                              title="Play Song"
                            >
                              <Play className="w-3 h-3 sm:w-3 sm:h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-muted-foreground hover:text-blue-500 w-4 h-4 sm:w-8 sm:h-8 p-0 rounded-full bg-blue-500/10 hover:bg-blue-500/20"
                              onClick={async (e) => {
                                e.stopPropagation();
                                // Convert song to MusicAlbum format for recommendations
                                const musicAlbum = {
                                  id: song.id,
                                  name: decodeHtmlEntities(song.name),
                                  artists: song.artists || { primary: [] },
                                  image: song.image || album.image || [],
                                  language:
                                    song.language ||
                                    album.language ||
                                    "Unknown",
                                  year:
                                    song.year ||
                                    album.year?.toString() ||
                                    "Unknown",
                                  playCount: song.playCount || 0,
                                  songCount: 1,
                                  songs: [
                                    {
                                      id: song.id,
                                      name: decodeHtmlEntities(song.name),
                                      artists: song.artists,
                                      image: song.image || album.image || [],
                                      duration: song.duration || 0,
                                      year: song.year || "Unknown",
                                      language: song.language,
                                      playCount: song.playCount || 0,
                                      downloadUrl: song.downloadUrl,
                                      album: {
                                        id: song.album?.id || album.id,
                                        name: song.album?.name || album.name,
                                        url: song.album?.url || album.url,
                                      },
                                      addedAt: new Date().toISOString(),
                                    },
                                  ],
                                };

                                if (isAlbumInRecommendations(song.id)) {
                                  await removeAlbumFromRecommendations(song.id);
                                  toast({
                                    title: "Removed from recommendations",
                                    description: `${decodeHtmlEntities(
                                      song.name
                                    )} has been removed from your recommendations.`,
                                  });
                                } else {
                                  await addAlbumToRecommendations(musicAlbum);
                                  toast({
                                    title: "Added to recommendations",
                                    description: `${decodeHtmlEntities(
                                      song.name
                                    )} has been added to your recommendations.`,
                                  });
                                }
                              }}
                              title={
                                isAlbumInRecommendations(song.id)
                                  ? "Remove from recommendations"
                                  : "Add to recommendations"
                              }
                            >
                              {isAlbumInRecommendations(song.id) ? (
                                <Check className="w-3 h-3 sm:w-3 sm:h-3" />
                              ) : (
                                <Plus className="w-3 h-3 sm:w-3 sm:h-3" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 px-4">
                  <Music className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-foreground mb-2">
                    No Songs Found
                  </h3>
                  <p className="text-muted-foreground">
                    This album doesn't have any songs available.
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
