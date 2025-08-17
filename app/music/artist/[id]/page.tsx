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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  const { isArtistFollowed, followArtist, unfollowArtist } =
    useMusicCollections();
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
    const fetchArtistDetails = async () => {
      if (!resolvedParams.id) return;

      setLoading(true);
      try {
        // Fetch artist details using the artist ID directly
        const artistResponse = await fetch(
          `/api/saavn/artist?id=${resolvedParams.id}`
        );
        const artistData = await artistResponse.json();

        if (artistData.data) {
          setArtist(artistData.data);

          // Use the data from the artist response directly
          setAlbums(artistData.data.topAlbums || []);
          setSongs(artistData.data.topSongs || []);
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
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-16">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
              <p className="text-gray-400 text-lg">Loading artist details...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !artist) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-16">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">
              Artist Not Found
            </h1>
            <p className="text-gray-400 mb-4">
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
        {/* Artist Header */}
        <div className="relative mb-12">
          {/* Background gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gray-900/50 to-gray-900 rounded-3xl"></div>

          <div className="relative flex flex-col md:flex-row gap-8 p-8 bg-gradient-to-r from-gray-800/30 to-gray-700/30 rounded-3xl border border-gray-700/50 backdrop-blur-sm">
            <div className="flex-shrink-0">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-xl group-hover:blur-2xl transition-all duration-300"></div>
                <img
                  src={getImageUrl(artist.image)}
                  alt={artist.name}
                  className="relative w-48 h-48 md:w-64 md:h-64 rounded-full object-cover shadow-2xl ring-4 ring-gray-700/50 group-hover:ring-gray-600/50 transition-all duration-300"
                />
                <div className="absolute inset-0 rounded-full bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
            </div>

            <div className="flex-1 flex flex-col justify-center">
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent mb-3">
                    {artist.name}
                  </h1>
                  <div className="flex items-center gap-4 text-gray-300 mb-4">
                    <Badge
                      variant="secondary"
                      className="bg-blue-500/20 text-blue-300 border-blue-500/30"
                    >
                      <span className="capitalize">
                        {artist.type || "Artist"}
                      </span>
                    </Badge>
                    {artist.dominantLanguage && (
                      <Badge
                        variant="secondary"
                        className="bg-purple-500/20 text-purple-300 border-purple-500/30"
                      >
                        {artist.dominantLanguage}
                      </Badge>
                    )}
                  </div>
                </div>

                <Button
                  onClick={handleFollowArtist}
                  size="lg"
                  className={`${
                    isArtistFollowed(artist.id)
                      ? "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg"
                      : "bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 text-white border border-gray-600 shadow-lg"
                  } transition-all duration-200 transform hover:scale-105`}
                >
                  {isArtistFollowed(artist.id) ? (
                    <>
                      <UserMinus className="w-5 h-5 mr-2" />
                      Unfollow
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-5 h-5 mr-2" />
                      Follow
                    </>
                  )}
                </Button>
              </div>

              {artist.bio && artist.bio.length > 0 && (
                <div className="mb-6">
                  <p className="text-gray-300 text-lg leading-relaxed italic">
                    "{artist.bio[0]?.text || ""}"
                  </p>
                </div>
              )}

              <div className="flex items-center gap-8">
                <div className="flex items-center gap-3 bg-gray-800/50 px-4 py-2 rounded-full border border-gray-700/50">
                  <Disc className="w-5 h-5 text-blue-400" />
                  <span className="text-white font-medium">
                    {albums.length} albums
                  </span>
                </div>
                <div className="flex items-center gap-3 bg-gray-800/50 px-4 py-2 rounded-full border border-gray-700/50">
                  <Music className="w-5 h-5 text-purple-400" />
                  <span className="text-white font-medium">
                    {songs.length} songs
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-gray-800/30 border border-gray-700/50 rounded-xl p-1 backdrop-blur-sm">
            <TabsTrigger
              value="overview"
              className="text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600/20 data-[state=active]:to-purple-600/20 data-[state=active]:border data-[state=active]:border-blue-500/30 rounded-lg transition-all duration-200"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="albums"
              className="text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600/20 data-[state=active]:to-purple-600/20 data-[state=active]:border data-[state=active]:border-blue-500/30 rounded-lg transition-all duration-200"
            >
              Albums
            </TabsTrigger>
            <TabsTrigger
              value="songs"
              className="text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600/20 data-[state=active]:to-purple-600/20 data-[state=active]:border data-[state=active]:border-blue-500/30 rounded-lg transition-all duration-200"
            >
              Songs
            </TabsTrigger>
            <TabsTrigger
              value="related"
              className="text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600/20 data-[state=active]:to-purple-600/20 data-[state=active]:border data-[state=active]:border-blue-500/30 rounded-lg transition-all duration-200"
            >
              Related Artists
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-8">
            <div className="grid gap-8 md:grid-cols-2">
              {/* Popular Songs Section */}
              <div className="bg-gray-800/20 rounded-2xl p-6 border border-gray-700/50 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                    <Music className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">
                    Popular Songs
                  </h3>
                </div>
                {songs.length > 0 ? (
                  <div className="space-y-3">
                    {songs.slice(0, 5).map((song, index) => (
                      <div
                        key={song.id}
                        className="flex items-center gap-4 p-4 bg-gray-800/30 rounded-xl hover:bg-gray-700/40 transition-all duration-200 group border border-gray-700/30 hover:border-gray-600/50"
                      >
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
                            {song.album?.name}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-sm text-gray-400 bg-gray-800/50 px-2 py-1 rounded-full">
                            {formatDuration(song.duration)}
                          </div>
                          <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-xs font-bold text-white">
                            {index + 1}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Music className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400 text-lg">No songs found</p>
                  </div>
                )}
              </div>

              {/* Recent Albums Section */}
              <div className="bg-gray-800/20 rounded-2xl p-6 border border-gray-700/50 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                    <Disc className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">
                    Recent Albums
                  </h3>
                </div>
                {albums.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    {albums.slice(0, 4).map((album) => (
                      <div
                        key={album.id}
                        className="cursor-pointer group"
                        onClick={() => router.push(`/music/album/${album.id}`)}
                      >
                        <div className="relative">
                          <img
                            src={getImageUrl(album.image)}
                            alt={album.name}
                            className="w-full aspect-square rounded-xl object-cover group-hover:scale-105 transition-transform duration-200 shadow-lg"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                          <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <p className="text-white text-sm font-medium truncate">
                              {album.name}
                            </p>
                          </div>
                        </div>
                        <div className="mt-3">
                          <h4 className="font-semibold text-white truncate group-hover:text-purple-300 transition-colors">
                            {album.name}
                          </h4>
                          <p className="text-sm text-gray-400">{album.year}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Disc className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400 text-lg">No albums found</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Albums Tab */}
          <TabsContent value="albums" className="mt-8">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {albums.map((album) => (
                <div key={album.id} className="cursor-pointer group">
                  <div className="relative">
                    <img
                      src={getImageUrl(album.image)}
                      alt={album.name}
                      className="w-full aspect-square rounded-lg object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <div className="mt-3">
                    <h4 className="font-semibold text-white truncate">
                      {album.name}
                    </h4>
                    <p className="text-sm text-gray-400">{album.year}</p>
                    <p className="text-xs text-gray-500">
                      {album.songCount} songs
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Songs Tab */}
          <TabsContent value="songs" className="mt-8">
            <div className="space-y-3">
              {songs.map((song) => (
                <div
                  key={song.id}
                  className="flex items-center gap-4 p-4 bg-gray-800/50 rounded-lg"
                >
                  <img
                    src={getImageUrl(song.image)}
                    alt={song.name}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-white truncate">
                      {song.name}
                    </h4>
                    <p className="text-sm text-gray-400 truncate">
                      {song.album?.name}
                    </p>
                  </div>
                  <div className="text-sm text-gray-400">
                    {formatDuration(song.duration)}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Related Artists Tab */}
          <TabsContent value="related" className="mt-8">
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                Related Artists
              </h3>
              <p className="text-gray-400">Coming soon...</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
