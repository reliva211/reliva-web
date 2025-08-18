"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { use } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Disc, Music, Clock, Play, Heart, Star, Plus, Check } from "lucide-react";
import { useMusicCollections } from "@/hooks/use-music-collections";
import { useToast } from "@/hooks/use-toast";

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
  const [similarAlbums, setSimilarAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("songs");

  const { isAlbumInRecommendations, addAlbumToRecommendations, removeAlbumFromRecommendations } = useMusicCollections();
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
        // Fetch album details and similar albums in parallel
        const [albumResponse, similarResponse] = await Promise.all([
          fetch(`/api/saavn/album?id=${resolvedParams.id}`),
          fetch(`/api/saavn/album/similar?id=${resolvedParams.id}`),
        ]);

        const albumData = await albumResponse.json();
        const similarData = await similarResponse.json();

        if (albumData.data) {
          setAlbum(albumData.data);
        } else {
          setError("Album not found");
        }

        if (similarData.data && similarData.data.albums) {
          setSimilarAlbums(similarData.data.albums);
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

  const handleAddToRecommendations = async () => {
    if (!album) return;

    try {
      if (isAlbumInRecommendations(album.id)) {
        await removeAlbumFromRecommendations(album.id);
        toast({
          title: "Removed from recommendations",
          description: `${album.name} has been removed from your recommendations.`,
        });
      } else {
        // Convert Album to MusicAlbum format
        const musicAlbum = {
          id: album.id,
          name: album.name || "Unknown Album",
          artists: album.artists || { primary: [] },
          image: album.image || [],
          year: album.year?.toString() || "Unknown",
          language: album.language || "Unknown",
          songCount: album.songCount || 0,
          playCount: album.playCount || 0,
          songs: album.songs?.map((song) => ({
            ...song,
            addedAt: new Date().toISOString(),
          })) || [],
        };
        
        await addAlbumToRecommendations(musicAlbum);
        toast({
          title: "Added to recommendations",
          description: `${album.name} has been added to your recommendations.`,
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
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-8 rounded-xl hover:bg-muted/50 transition-all duration-200 group"
        >
          ← Back
        </Button>

        {/* Album Header */}
        <div className="flex flex-col lg:flex-row gap-8 mb-12">
          {/* Album Image */}
          <div className="w-full lg:w-1/4">
            <div className="relative group max-w-xs mx-auto lg:mx-0">
              <div className="aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-muted to-muted/50 shadow-2xl group-hover:shadow-3xl transition-all duration-300">
                <img
                  src={getImageUrl(album.image)}
                  alt={album.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              {/* Subtle overlay gradient */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-black/10 via-transparent to-transparent pointer-events-none"></div>
            </div>
          </div>

          {/* Album Info */}
          <div className="flex-1 space-y-6">
            <div className="space-y-6">
              <h1 className="text-5xl lg:text-6xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent leading-tight">
                {album.name}
              </h1>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted/50 backdrop-blur-sm border border-border/30 shadow-lg">
                  <Music className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">
                    {album.artists?.primary
                      ?.map((artist) => artist.name)
                      .join(", ") || "Unknown Artist"}
                  </span>
                </div>
                {album.year && (
                  <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted/50 backdrop-blur-sm border border-border/30 shadow-lg">
                    <Clock className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">
                      {album.year}
                    </span>
                  </div>
                )}
                {album.language && (
                  <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted/50 backdrop-blur-sm border border-border/30 shadow-lg">
                    <span className="text-sm font-medium text-foreground capitalize">
                      {album.language}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-4">
              <Button
                size="lg"
                className="rounded-xl hover:scale-105 transition-all duration-200 bg-green-600 hover:bg-green-700 shadow-lg"
              >
                <Play className="w-5 h-5 mr-2" />
                Play Album
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="rounded-xl hover:bg-muted/50 transition-all duration-200 group bg-background/60 border-border/50 shadow-lg"
              >
                <Heart className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                Like
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={handleAddToRecommendations}
                className={`rounded-xl hover:scale-105 transition-all duration-200 group bg-background/60 border-border/50 shadow-lg ${
                  isAlbumInRecommendations(album.id) 
                    ? "bg-primary/20 text-primary border-primary/30" 
                    : ""
                }`}
              >
                {isAlbumInRecommendations(album.id) ? (
                  <>
                    <Check className="w-5 h-5 mr-2" />
                    In List
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5 mr-2" />
                    Add to List
                  </>
                )}
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => {
                  const params = new URLSearchParams({
                    type: 'music',
                    id: album.id,
                    title: album.name,
                    cover: getImageUrl(album.image),
                    artist: album.artists?.primary?.map(artist => artist.name).join(", ") || "Unknown Artist"
                  });
                  router.push(`/reviews?${params.toString()}`);
                }}
                className="rounded-xl hover:scale-105 transition-all duration-200 group bg-background/60 border-border/50 shadow-lg"
              >
                <Star className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                Write Review
              </Button>
              {album.explicitContent && (
                <Badge
                  variant="destructive"
                  className="rounded-xl px-4 py-2 text-sm font-medium shadow-lg"
                >
                  Explicit
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="space-y-8">
          <Tabs defaultValue="songs" className="space-y-6">
            <TabsList className="inline-flex h-12 items-center justify-center rounded-xl bg-muted/30 backdrop-blur-sm border border-border/20 p-1 gap-1">
              <TabsTrigger
                value="songs"
                className="inline-flex items-center justify-center whitespace-nowrap rounded-lg px-6 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm hover:bg-muted/50"
              >
                Songs ({album.songs?.length || 0})
              </TabsTrigger>
              <TabsTrigger
                value="reviews"
                className="inline-flex items-center justify-center whitespace-nowrap rounded-lg px-6 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm hover:bg-muted/50"
              >
                Reviews
              </TabsTrigger>
              <TabsTrigger
                value="similar"
                className="inline-flex items-center justify-center whitespace-nowrap rounded-lg px-6 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm hover:bg-muted/50"
              >
                Similar Albums
              </TabsTrigger>
            </TabsList>

            {/* Songs Tab */}
            <TabsContent value="songs" className="space-y-6">
              {album.songs && album.songs.length > 0 ? (
                <div className="space-y-2 px-4">
                  {album.songs.map((song, index) => (
                    <div
                      key={song.id}
                      className="flex items-center gap-4 p-4 bg-muted/30 backdrop-blur-sm rounded-xl hover:bg-muted/50 transition-all duration-200 cursor-pointer group border border-border/20"
                      onClick={() => router.push(`/music/song/${song.id}`)}
                    >
                      <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center text-xs font-bold text-foreground">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-foreground truncate">
                              {song.name}
                            </h4>
                            <p className="text-sm text-muted-foreground truncate">
                              {song.artists.primary
                                .map((artist) => artist.name)
                                .join(", ")}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-muted-foreground">
                              {formatDuration(song.duration)}
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-muted-foreground hover:text-foreground"
                            >
                              <Play className="w-4 h-4" />
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

            {/* Reviews Tab */}
            <TabsContent value="reviews" className="space-y-6">
              <div className="text-center py-12 px-4">
                <Star className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Reviews functionality coming soon...
                </p>
              </div>
            </TabsContent>

            {/* Similar Tab */}
            <TabsContent value="similar" className="space-y-6">
              {similarAlbums.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 px-4">
                  {similarAlbums.map((similarAlbum) => (
                    <div
                      key={similarAlbum.id}
                      className="overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-300 rounded-xl group bg-muted/30 backdrop-blur-sm hover:bg-muted/50 hover:scale-105 border border-border/20"
                      onClick={() =>
                        router.push(`/music/album/${similarAlbum.id}`)
                      }
                    >
                      <div className="aspect-square relative overflow-hidden">
                        <img
                          src={getImageUrl(similarAlbum.image)}
                          alt={similarAlbum.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      </div>
                      <div className="p-3">
                        <h3 className="font-medium text-sm truncate mb-1 group-hover:text-primary transition-colors">
                          {similarAlbum.name}
                        </h3>
                        <p className="text-xs text-muted-foreground truncate">
                          {similarAlbum.artists?.primary
                            ?.map((artist) => artist.name)
                            .join(", ")}
                        </p>
                        {similarAlbum.year && (
                          <p className="text-xs text-muted-foreground">
                            {similarAlbum.year}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 px-4">
                  <Disc className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    No similar albums found.
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
