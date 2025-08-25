"use client";

import { useCurrentUser } from "@/hooks/use-current-user";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { use } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Star,
  Play,
  Plus,
  Heart,
  UserPlus,
  UserMinus,
  Music,
  Disc,
  Users,
  Calendar,
  MapPin,
  Globe,
  ExternalLink,
} from "lucide-react";
import { useMusicCollections } from "@/hooks/use-music-collections";
import { useToast } from "@/hooks/use-toast";
import { useYouTubePlayer } from "@/hooks/use-youtube-player";

// Utility functions
const getImageUrl = (images: Array<{ quality: string; url: string }>) => {
  if (!images || images.length === 0) return "/placeholder-album.jpg";
  return images.find((img) => img.quality === "500x500")?.url || images[0].url;
};

const formatDuration = (seconds: number | null) => {
  if (!seconds) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
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

interface Artist {
  id: string;
  name: string;
  url: string;
  type: string;
  image: Array<{
    quality: string;
    url: string;
  }>;
  followerCount: number | null;
  fanCount: string | null;
  isVerified: boolean | null;
  dominantLanguage: string | null;
  dominantType: string | null;
  bio: Array<{
    text: string | null;
    title: string | null;
    sequence: number | null;
  }> | null;
  dob: string | null;
  fb: string | null;
  twitter: string | null;
  wiki: string | null;
  availableLanguages: string[];
  isRadioPresent: boolean | null;
  topSongs: Song[] | null;
  topAlbums: Album[] | null;
  singles: Song[] | null;
  similarArtists: Array<{
    id: string;
    name: string;
    url: string;
    image: Array<{
      quality: string;
      url: string;
    }>;
    languages: object | null;
    wiki: string;
    dob: string;
    fb: string;
    twitter: string;
    isRadioPresent: boolean;
    type: string;
    dominantType: string;
    aka: string;
    bio: string | null;
    similarArtists: Array<{
      id: string;
      name: string;
    }> | null;
  }> | null;
}

export default function ArtistDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const { user, loading: authLoading } = useCurrentUser();
  const router = useRouter();
  const [artist, setArtist] = useState<Artist | null>(null);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [songs, setSongs] = useState<Song[]>([]);
  const [similarArtists, setSimilarArtists] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  const { isArtistFollowed, followArtist, unfollowArtist } =
    useMusicCollections();
  const { toast } = useToast();
  const { showPlayer } = useYouTubePlayer();

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
    const fetchArtistDetails = async () => {
      if (!resolvedParams.id) return;

      setLoading(true);
      try {
        // Fetch artist details first
        console.log(`Attempting to fetch artist with ID: ${resolvedParams.id}`);
        const artistResponse = await fetch(
          `/api/saavn/artist?id=${resolvedParams.id}`
        );
        const artistData = await artistResponse.json();

        console.log("Artist API response:", artistData);

        if (artistData.data) {
          setArtist(artistData.data);

          // Set songs from artist data
          const topSongs = artistData.data.topSongs || [];
          setSongs(topSongs);
          console.log(`Fetched ${topSongs.length} top songs`);

          // Fetch similar artists
          try {
            console.log(
              `Fetching similar artists for artist ID: ${resolvedParams.id}`
            );
            const similarResponse = await fetch(
              `/api/saavn/artist/similar?id=${resolvedParams.id}`
            );
            const similarData = await similarResponse.json();

            console.log("Similar artists API response:", similarData);

            if (similarData.data && Array.isArray(similarData.data)) {
              setSimilarArtists(similarData.data);
              console.log(`Fetched ${similarData.data.length} similar artists`);
            } else {
              console.log("No similar artists data found in response");
              setSimilarArtists([]);
            }
          } catch (similarError) {
            console.error("Error fetching similar artists:", similarError);
            setSimilarArtists([]);
          }

          // Try to fetch albums from dedicated endpoint
          try {
            const albumsResponse = await fetch(
              `/api/saavn/artist/albums?id=${resolvedParams.id}`
            );
            const albumsData = await albumsResponse.json();

            if (
              albumsData.data &&
              albumsData.data.albums &&
              albumsData.data.albums.length > 0
            ) {
              console.log(
                `Fetched ${albumsData.data.albums.length} albums from albums endpoint`
              );
              // Remove duplicate albums based on ID
              const uniqueAlbums = albumsData.data.albums.filter(
                (album: any, index: number, self: any[]) =>
                  index === self.findIndex((a) => a.id === album.id)
              );
              console.log(
                `After deduplication: ${uniqueAlbums.length} unique albums`
              );
              setAlbums(uniqueAlbums);
            } else {
              // Fallback to topAlbums from artist data
              const topAlbums = artistData.data.topAlbums || [];
              console.log(
                `Using fallback topAlbums: ${topAlbums.length} albums`
              );
              // Remove duplicate albums based on ID
              const uniqueTopAlbums = topAlbums.filter(
                (album: any, index: number, self: any[]) =>
                  index === self.findIndex((a) => a.id === album.id)
              );
              console.log(
                `After deduplication: ${uniqueTopAlbums.length} unique top albums`
              );
              setAlbums(uniqueTopAlbums);
            }
          } catch (albumError) {
            console.error("Error fetching albums:", albumError);
            // Fallback to topAlbums from artist data
            const topAlbums = artistData.data.topAlbums || [];
            console.log(
              `Using fallback topAlbums after error: ${topAlbums.length} albums`
            );
            // Remove duplicate albums based on ID
            const uniqueTopAlbums = topAlbums.filter(
              (album: any, index: number, self: any[]) =>
                index === self.findIndex((a) => a.id === album.id)
            );
            console.log(
              `After deduplication: ${uniqueTopAlbums.length} unique top albums`
            );
            setAlbums(uniqueTopAlbums);
          }
        } else {
          setError("Artist not found");
        }
      } catch (err) {
        console.error("Error fetching artist details:", err);
        setError("Failed to load artist details");
      } finally {
        setLoading(false);
      }
    };

    fetchArtistDetails();
  }, [resolvedParams.id]);

  const handleFollowArtist = async () => {
    if (!artist) return;

    try {
      if (isArtistFollowed(artist.id)) {
        await unfollowArtist(artist.id);
        toast({
          title: "Artist unfollowed",
          description: `You have unfollowed ${artist.name}.`,
        });
      } else {
        const musicArtist = {
          id: artist.id,
          name: artist.name || "Unknown Artist",
          image: artist.image || [],
          type: artist.type || "Artist",
          language: artist.dominantLanguage || "Unknown",
          description: artist.bio?.[0]?.text || "",
        };
        await followArtist(musicArtist);
        toast({
          title: "Artist followed",
          description: `You are now following ${artist.name}.`,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update followed artists. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <div className="flex items-center justify-center py-16">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
            <p className="text-muted-foreground text-lg">
              Loading artist details...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !artist) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <div className="text-center py-16">
          <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Artist Not Found
          </h1>
          <p className="text-muted-foreground mb-4">
            {error || "The artist you're looking for doesn't exist."}
          </p>
          <Button
            onClick={() => router.push("/music")}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Back to Music
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4 sm:mb-8 rounded-xl hover:bg-muted/50 transition-all duration-200 group"
        >
          ← Back
        </Button>

        {/* Artist Header */}
        <div className="flex flex-col lg:flex-row gap-6 sm:gap-8 mb-8 sm:mb-12">
          {/* Profile Image */}
          <div className="w-full lg:w-1/4">
            <div className="relative group max-w-xs mx-auto lg:mx-0">
              <div className="aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-muted to-muted/50 shadow-2xl group-hover:shadow-3xl transition-all duration-300">
                <img
                  src={getImageUrl(artist.image)}
                  alt={artist.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              {/* Subtle overlay gradient */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-black/10 via-transparent to-transparent pointer-events-none"></div>
            </div>
          </div>

          {/* Artist Info */}
          <div className="flex-1 space-y-4 sm:space-y-6">
            <div className="space-y-3 sm:space-y-4">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent leading-tight">
                {artist.name}
              </h1>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 text-muted-foreground">
                {artist.dominantLanguage && (
                  <div className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-muted/50 backdrop-blur-sm border border-border/30">
                    <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                    <span className="text-xs sm:text-sm font-medium">
                      {artist.dominantLanguage}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {artist.bio && artist.bio[0] && (
              <div className="space-y-3 sm:space-y-4">
                <h2 className="text-xl sm:text-2xl font-semibold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                  Biography
                </h2>
                <div className="p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-card/50 backdrop-blur-sm border border-border/30 shadow-lg">
                  <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
                    {artist.bio[0].text && artist.bio[0].text.length > 500
                      ? `${artist.bio[0].text.substring(0, 500)}...`
                      : artist.bio[0].text || "No biography available"}
                  </p>
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <Badge
                variant="secondary"
                className="rounded-lg sm:rounded-xl px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium bg-primary/10 text-primary border-primary/20"
              >
                {artist.type || "Artist"}
              </Badge>
              {artist.wiki && (
                <Badge
                  variant="outline"
                  className="rounded-lg sm:rounded-xl px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium hover:bg-muted/50 transition-colors group"
                >
                  <a
                    href={artist.wiki}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 sm:gap-2 hover:underline"
                  >
                    Wiki
                    <ExternalLink className="h-3 w-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </a>
                </Badge>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-2 sm:gap-3">
                <Button
                  size="sm"
                  className="rounded-lg sm:rounded-xl hover:scale-105 transition-all duration-200 bg-green-600 hover:bg-green-700 text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2"
                >
                  <Star className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  Rate
                </Button>
                <Button
                  size="sm"
                  onClick={handleFollowArtist}
                  className={`rounded-lg sm:rounded-xl hover:scale-105 transition-all duration-200 text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2 ${
                    isArtistFollowed(artist.id)
                      ? "bg-black hover:bg-gray-800 text-white"
                      : "bg-green-600 hover:bg-green-700"
                  }`}
                >
                  {isArtistFollowed(artist.id) ? (
                    <>
                      <UserMinus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                      Unfollow
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                      Follow
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Credits Tabs */}
        <div className="space-y-6 sm:space-y-8">
          <Tabs defaultValue="overview" className="space-y-4 sm:space-y-6">
            <TabsList className="inline-flex h-10 sm:h-12 items-center justify-center rounded-lg sm:rounded-xl bg-muted/30 backdrop-blur-sm border border-border/20 p-1 gap-1">
              <TabsTrigger
                value="overview"
                className="inline-flex items-center justify-center whitespace-nowrap rounded-lg px-3 sm:px-6 py-1.5 sm:py-2 text-xs sm:text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm hover:bg-muted/50"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="albums"
                className="inline-flex items-center justify-center whitespace-nowrap rounded-lg px-3 sm:px-6 py-1.5 sm:py-2 text-xs sm:text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm hover:bg-muted/50"
              >
                Albums ({albums.length})
              </TabsTrigger>
              <TabsTrigger
                value="popular-songs"
                className="inline-flex items-center justify-center whitespace-nowrap rounded-lg px-3 sm:px-6 py-1.5 sm:py-2 text-xs sm:text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm hover:bg-muted/50"
              >
                Popular Songs ({songs.length})
              </TabsTrigger>
              <TabsTrigger
                value="similar-artists"
                className="inline-flex items-center justify-center whitespace-nowrap rounded-lg px-3 sm:px-6 py-1.5 sm:py-2 text-xs sm:text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm hover:bg-muted/50"
              >
                Similar Artists ({similarArtists.length})
              </TabsTrigger>
              <TabsTrigger
                value="reviews"
                className="inline-flex items-center justify-center whitespace-nowrap rounded-lg px-3 sm:px-6 py-1.5 sm:py-2 text-xs sm:text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm hover:bg-muted/50"
              >
                Reviews
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6 sm:space-y-8">
              {/* Top Songs Section */}
              <div className="space-y-3 sm:space-y-4">
                <h3 className="text-lg sm:text-xl font-semibold text-foreground px-2 sm:px-4">
                  Top Songs
                </h3>
                <div className="space-y-2 px-2 sm:px-4">
                  {songs.slice(0, 5).map((song, index) => (
                    <div
                      key={song.id}
                      className="flex items-center gap-3 sm:gap-4 p-2.5 sm:p-3 bg-muted/30 backdrop-blur-sm rounded-lg sm:rounded-xl hover:bg-muted/50 transition-all duration-200 group border border-border/20"
                    >
                      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-muted rounded-full flex items-center justify-center text-xs sm:text-sm font-bold text-foreground">
                        {index + 1}
                      </div>
                      <img
                        src={getImageUrl(song.image)}
                        alt={song.name}
                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-foreground truncate text-sm sm:text-base">
                          {song.name}
                        </h4>
                        <p className="text-xs sm:text-sm text-muted-foreground truncate">
                          {song.album?.name}
                        </p>
                      </div>
                      <div className="text-xs sm:text-sm text-muted-foreground">
                        {formatDuration(song.duration)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Albums Section */}
              <div className="space-y-3 sm:space-y-4">
                <h3 className="text-lg sm:text-xl font-semibold text-foreground px-2 sm:px-4">
                  Top Albums
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3 px-2 sm:px-4">
                  {albums.slice(0, 6).map((album) => (
                    <div
                      key={album.id}
                      className="overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-300 rounded-xl group bg-muted/30 backdrop-blur-sm hover:bg-muted/50 hover:scale-105 border border-border/20"
                      onClick={() => router.push(`/music/album/${album.id}`)}
                    >
                      <div className="aspect-square relative overflow-hidden">
                        <img
                          src={getImageUrl(album.image)}
                          alt={album.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      </div>
                      <div className="p-2">
                        <h3 className="font-medium text-xs truncate mb-1 group-hover:text-primary transition-colors">
                          {album.name}
                        </h3>
                        <p className="text-xs text-muted-foreground truncate">
                          {album.year}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Artist Stats Section */}
              <div className="space-y-3 sm:space-y-4">
                <h3 className="text-lg sm:text-xl font-semibold text-foreground px-2 sm:px-4">
                  Artist Stats
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 px-2 sm:px-4">
                  <div className="p-3 sm:p-4 bg-muted/30 backdrop-blur-sm rounded-lg sm:rounded-xl border border-border/20">
                    <div className="text-xl sm:text-2xl font-bold text-foreground">
                      {albums.length}
                    </div>
                    <div className="text-xs sm:text-sm text-muted-foreground">
                      Total Albums
                    </div>
                  </div>
                  <div className="p-4 bg-muted/30 backdrop-blur-sm rounded-xl border border-border/20">
                    <div className="text-2xl font-bold text-foreground">
                      {songs.length}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Total Songs
                    </div>
                  </div>
                </div>
              </div>

              {/* Similar Artists Section */}
              {similarArtists.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-foreground px-4">
                    Similar Artists
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 px-4">
                    {similarArtists.slice(0, 6).map((similarArtist) => (
                      <div
                        key={similarArtist.id}
                        className="cursor-pointer group"
                        onClick={() =>
                          router.push(`/music/artist/${similarArtist.id}`)
                        }
                      >
                        <div className="relative">
                          <img
                            src={getImageUrl(similarArtist.image)}
                            alt={similarArtist.name}
                            className="w-full aspect-square rounded-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                        <div className="mt-3 text-center">
                          <h4 className="font-semibold text-foreground truncate text-sm">
                            {similarArtist.name}
                          </h4>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {similarArtist.type || "Artist"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Albums Tab */}
            <TabsContent value="albums" className="space-y-6">
              {albums.length === 0 ? (
                <div className="text-center py-12">
                  <Disc className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    No albums found for this artist
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 px-4">
                  {albums.map((album) => (
                    <div
                      key={album.id}
                      className="overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-300 rounded-xl group bg-muted/30 backdrop-blur-sm hover:bg-muted/50 hover:scale-105 border border-border/20"
                      onClick={() => router.push(`/music/album/${album.id}`)}
                    >
                      <div className="aspect-square relative overflow-hidden">
                        <img
                          src={getImageUrl(album.image)}
                          alt={album.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      </div>
                      <div className="p-2">
                        <h3 className="font-medium text-xs truncate mb-1 group-hover:text-primary transition-colors">
                          {album.name}
                        </h3>
                        <p className="text-xs text-muted-foreground truncate">
                          {album.year}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Popular Songs Tab */}
            <TabsContent value="popular-songs" className="space-y-6">
              {songs.length === 0 ? (
                <div className="text-center py-12">
                  <Music className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    No popular songs found for this artist
                  </p>
                </div>
              ) : (
                <div className="space-y-3 px-4">
                  {songs.map((song, index) => (
                    <div
                      key={song.id}
                      className="flex items-center gap-4 p-4 bg-muted/30 backdrop-blur-sm rounded-xl hover:bg-muted/50 transition-all duration-200 group border border-border/20"
                    >
                      <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center text-sm font-bold text-foreground">
                        {index + 1}
                      </div>
                      <img
                        src={getImageUrl(song.image)}
                        alt={song.name}
                        className="w-16 h-16 rounded-xl object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-foreground truncate">
                          {song.name}
                        </h4>
                        <p className="text-sm text-muted-foreground truncate">
                          {song.album?.name}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-sm text-muted-foreground">
                          {formatDuration(song.duration)}
                        </div>
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            // Create song object for YouTube player
                            const songForPlayer = {
                              id: song.id,
                              title: song.name,
                              artist:
                                song.artists?.primary
                                  ?.map((artist) => artist.name)
                                  .join(", ") || "Unknown Artist",
                            };

                            // Create queue from all artist songs
                            const queue = songs.map((s) => ({
                              id: s.id,
                              title: s.name,
                              artist:
                                s.artists?.primary
                                  ?.map((artist) => artist.name)
                                  .join(", ") || "Unknown Artist",
                            }));

                            // Find the current song index
                            const songIndex = songs.findIndex(
                              (s) => s.id === song.id
                            );

                            console.log(
                              "🎵 Artist Page Song Play Button - Queue created:",
                              {
                                queueLength: queue.length,
                                clickedSong: queue[songIndex],
                                songIndex,
                                allSongs: queue.map((s) => s.title),
                              }
                            );

                            // Start with the clicked song
                            await showPlayer(
                              queue[songIndex],
                              queue,
                              songIndex
                            );
                          }}
                          className="w-8 h-8 bg-green-500/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-green-600/80 transition-all duration-200 hover:scale-110 opacity-0 group-hover:opacity-100"
                          title="Play Song"
                        >
                          <Play className="w-3 h-3 text-white fill-white" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Similar Artists Tab */}
            <TabsContent value="similar-artists" className="space-y-6">
              {similarArtists.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    No similar artists found
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 px-4">
                  {similarArtists.map((similarArtist) => (
                    <div
                      key={similarArtist.id}
                      className="cursor-pointer group"
                      onClick={() =>
                        router.push(`/music/artist/${similarArtist.id}`)
                      }
                    >
                      <div className="relative">
                        <img
                          src={getImageUrl(similarArtist.image)}
                          alt={similarArtist.name}
                          className="w-full aspect-square rounded-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <div className="mt-3 text-center">
                        <h4 className="font-semibold text-foreground truncate text-sm">
                          {similarArtist.name}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {similarArtist.type || "Artist"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Reviews Tab */}
            <TabsContent value="reviews" className="space-y-6">
              <div className="text-center py-12">
                <Star className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Reviews coming soon...</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
