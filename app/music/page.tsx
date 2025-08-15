"use client";

import type React from "react";
import { useState, useEffect } from "react";
import {
  Search,
  Star,
  Play,
  Music,
  Calendar,
  Plus,
  Check,
  X,
  Clock,
  Headphones,
  Disc,
  Users,
  Heart,
  TrendingUp,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AudioPlayer } from "@/components/audio-player";
import { Recommendations } from "@/components/recommendations";
import { cn } from "@/lib/utils";

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
  type: string;
}

interface SearchResponse {
  data: {
    results: Song[] | Album[] | Artist[];
  };
}

interface AlbumDetailsResponse {
  data: Album;
}

export default function MusicApp() {
  const [searchQuery, setSearchQuery] = useState("");
  const [songs, setSongs] = useState<Song[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(false);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [myList, setMyList] = useState<Set<string>>(new Set());
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [showSongDetails, setShowSongDetails] = useState(false);
  const [showAlbumDetails, setShowAlbumDetails] = useState(false);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [albumPage, setAlbumPage] = useState(1);
  const [artistPage, setArtistPage] = useState(1);
  const [activeTab, setActiveTab] = useState("discover");
  const [hasMoreSongs, setHasMoreSongs] = useState(false);
  const [hasMoreAlbums, setHasMoreAlbums] = useState(false);
  const [hasMoreArtists, setHasMoreArtists] = useState(false);
  const [searchType, setSearchType] = useState<"song" | "album" | "artist">(
    "song"
  );

  // Load ratings and my list from localStorage on component mount
  useEffect(() => {
    const savedRatings = localStorage.getItem("songRatings");
    const savedMyList = localStorage.getItem("myList");

    if (savedRatings) {
      setRatings(JSON.parse(savedRatings));
    }

    if (savedMyList) {
      setMyList(new Set(JSON.parse(savedMyList)));
    }
  }, []);

  // Save ratings to localStorage whenever ratings change
  useEffect(() => {
    localStorage.setItem("songRatings", JSON.stringify(ratings));
  }, [ratings]);

  // Save my list to localStorage whenever myList changes
  useEffect(() => {
    localStorage.setItem("myList", JSON.stringify(Array.from(myList)));
  }, [myList]);

  const searchSongs = async (page = 1, append = false) => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(
        `/api/saavn/search?q=${encodeURIComponent(
          searchQuery
        )}&type=song&page=${page}&limit=20`
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

      if (results.length > 0) {
        const sortedSongs = results.sort((a, b) => {
          const ratingA = ratings[a.id] || 0;
          const ratingB = ratings[b.id] || 0;

          if (ratingA !== ratingB) {
            return ratingB - ratingA;
          }

          return (b.playCount || 0) - (a.playCount || 0);
        });

        if (append) {
          setSongs((prevSongs) => [...prevSongs, ...sortedSongs]);
        } else {
          setSongs(sortedSongs);
        }

        setCurrentPage(page);
        setHasMoreSongs(results.length === 20);
      } else {
        if (!append) {
          setSongs([]);
        }
        setHasMoreSongs(false);
      }
    } catch (error) {
      console.error("Error searching songs:", error);
      if (!append) {
        setSongs([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const searchAlbums = async (page = 1, append = false) => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(
        `/api/saavn/search?q=${encodeURIComponent(
          searchQuery
        )}&type=album&page=${page}&limit=20`
      );
      const data = await response.json();

      let results: Album[] = [];
      if (data.data?.results) {
        results = data.data.results;
      } else if (data.results) {
        results = data.results;
      } else if (Array.isArray(data)) {
        results = data;
      }

      if (results.length > 0) {
        if (append) {
          setAlbums((prevAlbums) => [...prevAlbums, ...results]);
        } else {
          setAlbums(results);
        }

        setAlbumPage(page);
        setHasMoreAlbums(results.length === 20);
      } else {
        if (!append) {
          setAlbums([]);
        }
        setHasMoreAlbums(false);
      }
    } catch (error) {
      console.error("Error searching albums:", error);
      if (!append) {
        setAlbums([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const searchArtists = async (page = 1, append = false) => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(
        `/api/saavn/search?q=${encodeURIComponent(
          searchQuery
        )}&type=artist&page=${page}&limit=20`
      );
      const data = await response.json();

      let results: Artist[] = [];
      if (data.data?.results) {
        results = data.data.results;
      } else if (data.results) {
        results = data.results;
      } else if (Array.isArray(data)) {
        results = data;
      }

      if (results.length > 0) {
        if (append) {
          setArtists((prevArtists) => [...prevArtists, ...results]);
        } else {
          setArtists(results);
        }

        setArtistPage(page);
        setHasMoreArtists(results.length === 20);
      } else {
        if (!append) {
          setArtists([]);
        }
        setHasMoreArtists(false);
      }
    } catch (error) {
      console.error("Error searching artists:", error);
      if (!append) {
        setArtists([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchAlbumDetails = async (albumId: string) => {
    try {
      const response = await fetch(`/api/albums/${albumId}`);
      const data: AlbumDetailsResponse = await response.json();

      if (data.data) {
        setSelectedAlbum(data.data);
        setShowAlbumDetails(true);
      }
    } catch (error) {
      console.error("Error fetching album details:", error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const rateSong = (songId: string, rating: number) => {
    setRatings((prev) => ({
      ...prev,
      [songId]: rating,
    }));

    setSongs((prevSongs) =>
      [...prevSongs].sort((a, b) => {
        const ratingA = songId === a.id ? rating : ratings[a.id] || 0;
        const ratingB = songId === b.id ? rating : ratings[b.id] || 0;

        if (ratingA !== ratingB) {
          return ratingB - ratingA;
        }

        return (b.playCount || 0) - (a.playCount || 0);
      })
    );
  };

  const toggleMyList = (songId: string) => {
    setMyList((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(songId)) {
        newSet.delete(songId);
      } else {
        newSet.add(songId);
      }
      return newSet;
    });
  };

  const openSongDetails = (song: Song) => {
    setSelectedSong(song);
    setShowSongDetails(true);
  };

  const playSong = (song: Song) => {
    setCurrentSong(song);
  };

  const playAlbum = (album: Album) => {
    if (album.songs && album.songs.length > 0) {
      setCurrentSong(album.songs[0]);
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
            className={`w-4 h-4 cursor-pointer transition-colors ${
              star <= currentRating
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-400 hover:text-yellow-300"
            }`}
            onClick={(e) => {
              e.stopPropagation();
              rateSong(songId, star);
            }}
          />
        ))}
        <span className="text-sm text-gray-400 ml-2">
          {currentRating > 0 ? `${currentRating}/5` : "Rate"}
        </span>
      </div>
    );
  };

  const handleSearch = () => {
    setCurrentPage(1);
    setAlbumPage(1);
    setArtistPage(1);

    if (activeTab === "songs") {
      searchSongs(1, false);
    } else if (activeTab === "albums") {
      searchAlbums(1, false);
    } else if (activeTab === "artists") {
      searchArtists(1, false);
    }
  };

  const loadMoreSongs = () => {
    if (!loading && hasMoreSongs) {
      searchSongs(currentPage + 1, true);
    }
  };

  const loadMoreAlbums = () => {
    if (!loading && hasMoreAlbums) {
      searchAlbums(albumPage + 1, true);
    }
  };

  const loadMoreArtists = () => {
    if (!loading && hasMoreArtists) {
      searchArtists(artistPage + 1, true);
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === "songs" && songs.length === 0 && searchQuery) {
      searchSongs(1, false);
    } else if (value === "albums" && albums.length === 0 && searchQuery) {
      searchAlbums(1, false);
    } else if (value === "artists" && artists.length === 0 && searchQuery) {
      searchArtists(1, false);
    }
  };

  const getImageUrl = (images: any[]) => {
    return (
      images?.[2]?.url ||
      images?.[1]?.url ||
      images?.[0]?.url ||
      "/placeholder.svg"
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-black dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header Section - Matching the image design */}
        <div className="mb-12">
          <div className="flex items-center mb-6">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white underline decoration-blue-500 underline-offset-4">
              music
            </h1>
          </div>
          <div className="space-y-2 text-gray-600 dark:text-gray-300">
            <p className="text-lg md:text-xl">
              search through millions of songs, albums and artists. Rate and
              review.
            </p>
            <p className="text-lg md:text-xl">Recommend</p>
          </div>
        </div>

        {/* Search Bar - Clean and centered */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Search for songs, albums, or artists..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                className="pl-12 pr-4 py-3 text-lg bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-500 focus:border-blue-500 dark:focus:border-blue-400 rounded-xl shadow-sm"
              />
            </div>
            <Button
              onClick={handleSearch}
              disabled={loading}
              className="px-8 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600 rounded-xl font-medium"
            >
              {loading ? "Searching..." : "search"}
            </Button>
          </div>
        </div>

        {/* Navigation Tabs - Matching the image */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-6 text-gray-600 dark:text-gray-300">
            <button
              onClick={() => handleTabChange("discover")}
              className={cn(
                "text-lg font-medium transition-colors hover:text-gray-900 dark:hover:text-white",
                activeTab === "discover" &&
                  "text-gray-900 dark:text-white underline decoration-gray-400 underline-offset-4"
              )}
            >
              discover
            </button>
            <button
              onClick={() => handleTabChange("artists")}
              className={cn(
                "text-lg font-medium transition-colors hover:text-gray-900 dark:hover:text-white",
                activeTab === "artists" &&
                  "text-gray-900 dark:text-white underline decoration-gray-400 underline-offset-4"
              )}
            >
              artists
            </button>
            <button
              onClick={() => handleTabChange("albums")}
              className={cn(
                "text-lg font-medium transition-colors hover:text-gray-900 dark:hover:text-white",
                activeTab === "albums" &&
                  "text-gray-900 dark:text-white underline decoration-gray-400 underline-offset-4"
              )}
            >
              albums
            </button>
            <button
              onClick={() => handleTabChange("songs")}
              className={cn(
                "text-lg font-medium transition-colors hover:text-gray-900 dark:hover:text-white",
                activeTab === "songs" &&
                  "text-gray-900 dark:text-white underline decoration-gray-400 underline-offset-4"
              )}
            >
              songs
            </button>
            <button
              onClick={() => handleTabChange("liked")}
              className={cn(
                "text-lg font-medium transition-colors hover:text-gray-900 dark:hover:text-white",
                activeTab === "liked" &&
                  "text-gray-900 dark:text-white underline decoration-gray-400 underline-offset-4"
              )}
            >
              liked
            </button>
            <button
              onClick={() => handleTabChange("recommended")}
              className={cn(
                "text-lg font-medium transition-colors hover:text-gray-900 dark:hover:text-white",
                activeTab === "recommended" &&
                  "text-gray-900 dark:text-white underline decoration-gray-400 underline-offset-4"
              )}
            >
              recommended
            </button>
          </div>
        </div>

        {/* Content Sections */}
        <div className="space-y-8">
          {/* Discover Tab - Recommendations */}
          {activeTab === "discover" && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Discover New Music
              </h2>
              <Recommendations
                currentSong={currentSong}
                ratings={ratings}
                myList={myList}
                onPlaySong={playSong}
                onToggleMyList={toggleMyList}
                onRateSong={rateSong}
              />
            </div>
          )}

          {/* Artists Tab */}
          {activeTab === "artists" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Artists
                </h2>
                {artists.length > 0 && (
                  <Badge
                    variant="outline"
                    className="text-gray-600 dark:text-gray-300"
                  >
                    {artists.length} artists found
                  </Badge>
                )}
              </div>

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {artists.map((artist) => (
                  <Card
                    key={artist.id}
                    className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all cursor-pointer group"
                  >
                    <CardHeader className="pb-3">
                      <div className="relative">
                        <img
                          src={getImageUrl(artist.image)}
                          alt={artist.name}
                          className="w-full aspect-square rounded-xl object-cover"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                          <Button
                            size="sm"
                            className="bg-white text-black hover:bg-gray-100"
                          >
                            <Users className="w-4 h-4 mr-2" />
                            View
                          </Button>
                        </div>
                      </div>
                      <div className="mt-4">
                        <h3
                          className="font-semibold text-gray-900 dark:text-white truncate"
                          title={artist.name}
                        >
                          {artist.name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                          {artist.type || "Artist"}
                        </p>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>

              {artists.length > 0 && hasMoreArtists && (
                <div className="text-center">
                  <Button
                    onClick={loadMoreArtists}
                    disabled={loading}
                    variant="outline"
                    className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    {loading ? "Loading..." : "Load More Artists"}
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Albums Tab */}
          {activeTab === "albums" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Albums
                </h2>
                {albums.length > 0 && (
                  <Badge
                    variant="outline"
                    className="text-gray-600 dark:text-gray-300"
                  >
                    {albums.length} albums found
                  </Badge>
                )}
              </div>

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {albums.map((album) => (
                  <Card
                    key={album.id}
                    className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all cursor-pointer group"
                    onClick={() => fetchAlbumDetails(album.id)}
                  >
                    <CardHeader className="pb-3">
                      <div className="relative">
                        <img
                          src={getImageUrl(album.image)}
                          alt={album.name}
                          className="w-full aspect-square rounded-xl object-cover"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                          <Button
                            size="sm"
                            className="bg-white text-black hover:bg-gray-100"
                            onClick={(e) => {
                              e.stopPropagation();
                              playAlbum(album);
                            }}
                          >
                            <Play className="w-4 h-4 mr-2" />
                            Play
                          </Button>
                        </div>
                      </div>
                      <div className="mt-4">
                        <h3
                          className="font-semibold text-gray-900 dark:text-white truncate"
                          title={album.name}
                        >
                          {album.name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          {album.artists?.primary
                            ?.map((artist) => artist.name)
                            .join(", ") || "Unknown Artist"}
                        </p>
                        <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
                          <span>{album.year}</span>
                          <span>{album.songCount} songs</span>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>

              {albums.length > 0 && hasMoreAlbums && (
                <div className="text-center">
                  <Button
                    onClick={loadMoreAlbums}
                    disabled={loading}
                    variant="outline"
                    className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    {loading ? "Loading..." : "Load More Albums"}
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Songs Tab */}
          {activeTab === "songs" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Songs
                </h2>
                {songs.length > 0 && (
                  <Badge
                    variant="outline"
                    className="text-gray-600 dark:text-gray-300"
                  >
                    {songs.length} songs found
                  </Badge>
                )}
              </div>

              <div className="grid gap-4">
                {songs.map((song) => (
                  <Card
                    key={song.id}
                    className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all cursor-pointer group"
                    onClick={() => openSongDetails(song)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <img
                            src={getImageUrl(song.image)}
                            alt={song.name}
                            className="w-16 h-16 rounded-lg object-cover"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                            <Button
                              size="sm"
                              className="bg-white text-black hover:bg-gray-100"
                              onClick={(e) => {
                                e.stopPropagation();
                                playSong(song);
                              }}
                            >
                              <Play className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3
                            className="font-semibold text-gray-900 dark:text-white truncate"
                            title={song.name}
                          >
                            {song.name}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                            {song.artists?.primary
                              ?.map((artist) => artist.name)
                              .join(", ") || "Unknown Artist"}
                          </p>
                          <p className="text-xs text-gray-400 truncate">
                            {song.album?.name}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {formatDuration(song.duration)}
                          </div>
                          <StarRating
                            songId={song.id}
                            currentRating={ratings[song.id] || 0}
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleMyList(song.id);
                            }}
                          >
                            {myList.has(song.id) ? (
                              <Heart className="w-5 h-5 fill-red-500 text-red-500" />
                            ) : (
                              <Heart className="w-5 h-5" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {songs.length > 0 && hasMoreSongs && (
                <div className="text-center">
                  <Button
                    onClick={loadMoreSongs}
                    disabled={loading}
                    variant="outline"
                    className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    {loading ? "Loading..." : "Load More Songs"}
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Liked Tab */}
          {activeTab === "liked" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Liked Songs
                </h2>
                {myList.size > 0 && (
                  <Badge
                    variant="outline"
                    className="text-gray-600 dark:text-gray-300"
                  >
                    {myList.size} songs
                  </Badge>
                )}
              </div>

              {myList.size === 0 ? (
                <div className="text-center py-12">
                  <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    No liked songs yet
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Start exploring and like your favorite songs!
                  </p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {songs
                    .filter((song) => myList.has(song.id))
                    .map((song) => (
                      <Card
                        key={song.id}
                        className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all cursor-pointer group"
                        onClick={() => openSongDetails(song)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            <div className="relative">
                              <img
                                src={getImageUrl(song.image)}
                                alt={song.name}
                                className="w-16 h-16 rounded-lg object-cover"
                              />
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                                <Button
                                  size="sm"
                                  className="bg-white text-black hover:bg-gray-100"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    playSong(song);
                                  }}
                                >
                                  <Play className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3
                                className="font-semibold text-gray-900 dark:text-white truncate"
                                title={song.name}
                              >
                                {song.name}
                              </h3>
                              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                {song.artists?.primary
                                  ?.map((artist) => artist.name)
                                  .join(", ") || "Unknown Artist"}
                              </p>
                              <p className="text-xs text-gray-400 truncate">
                                {song.album?.name}
                              </p>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {formatDuration(song.duration)}
                              </div>
                              <StarRating
                                songId={song.id}
                                currentRating={ratings[song.id] || 0}
                              />
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-red-500 hover:text-red-600"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleMyList(song.id);
                                }}
                              >
                                <Heart className="w-5 h-5 fill-red-500 text-red-500" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* Recommended Tab */}
          {activeTab === "recommended" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Recommended for You
                </h2>
                <TrendingUp className="w-6 h-6 text-blue-500" />
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
                <Recommendations
                  currentSong={currentSong}
                  ratings={ratings}
                  myList={myList}
                  onPlaySong={playSong}
                  onToggleMyList={toggleMyList}
                  onRateSong={rateSong}
                />
              </div>
            </div>
          )}
        </div>

        {/* No Results */}
        {((activeTab === "songs" && songs.length === 0) ||
          (activeTab === "albums" && albums.length === 0) ||
          (activeTab === "artists" && artists.length === 0)) &&
          !loading &&
          searchQuery &&
          !["discover", "liked", "recommended"].includes(activeTab) && (
            <div className="text-center py-12">
              <Music className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No {activeTab} found
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Try searching with different keywords
              </p>
            </div>
          )}

        {/* Loading State */}
        {loading &&
          !["discover", "liked", "recommended"].includes(activeTab) && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">
                Searching for {activeTab}...
              </p>
            </div>
          )}
      </div>

      {/* Song Details Modal */}
      <Dialog open={showSongDetails} onOpenChange={setShowSongDetails}>
        <DialogContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white max-w-2xl">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl font-bold">
                {selectedSong?.name}
              </DialogTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSongDetails(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </DialogHeader>

          {selectedSong && (
            <div className="space-y-6">
              <div className="flex gap-6">
                <img
                  src={getImageUrl(selectedSong.image)}
                  alt={selectedSong.name}
                  className="w-48 h-48 rounded-xl object-cover"
                />
                <div className="flex-1 space-y-4">
                  <div>
                    <h3 className="text-2xl font-bold mb-2">
                      {selectedSong.name}
                    </h3>
                    <p className="text-lg text-gray-600 dark:text-gray-300 mb-1">
                      {selectedSong.artists?.primary
                        ?.map((artist) => artist.name)
                        .join(", ")}
                    </p>
                    <p className="text-gray-500 dark:text-gray-400">
                      {selectedSong.album?.name}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span>
                        Duration: {formatDuration(selectedSong.duration)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span>Year: {selectedSong.year}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Headphones className="w-4 h-4 text-gray-400" />
                      <span>
                        Plays:{" "}
                        {selectedSong.playCount?.toLocaleString() || "N/A"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Music className="w-4 h-4 text-gray-400" />
                      <span>Language: {selectedSong.language}</span>
                    </div>
                  </div>
                </div>
              </div>

              <Separator className="bg-gray-200 dark:bg-gray-700" />

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                    Rate this song:
                  </p>
                  <StarRating
                    songId={selectedSong.id}
                    currentRating={ratings[selectedSong.id] || 0}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className={`border-gray-300 dark:border-gray-600 ${
                      myList.has(selectedSong.id)
                        ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-300 dark:border-red-600"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    }`}
                    onClick={() => toggleMyList(selectedSong.id)}
                  >
                    {myList.has(selectedSong.id) ? (
                      <>
                        <Heart className="w-4 h-4 mr-2 fill-red-500 text-red-500" />
                        Liked
                      </>
                    ) : (
                      <>
                        <Heart className="w-4 h-4 mr-2" />
                        Like
                      </>
                    )}
                  </Button>

                  <Button
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => {
                      playSong(selectedSong);
                      setShowSongDetails(false);
                    }}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Play
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Album Details Modal */}
      <Dialog open={showAlbumDetails} onOpenChange={setShowAlbumDetails}>
        <DialogContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl font-bold">
                {selectedAlbum?.name}
              </DialogTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAlbumDetails(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </DialogHeader>

          {selectedAlbum && (
            <div className="space-y-6">
              <div className="flex gap-6">
                <img
                  src={getImageUrl(selectedAlbum.image)}
                  alt={selectedAlbum.name}
                  className="w-64 h-64 rounded-xl object-cover"
                />
                <div className="flex-1 space-y-4">
                  <div>
                    <h3 className="text-3xl font-bold mb-2">
                      {selectedAlbum.name}
                    </h3>
                    <p className="text-xl text-gray-600 dark:text-gray-300 mb-1">
                      {selectedAlbum.artists?.primary
                        ?.map((artist) => artist.name)
                        .join(", ")}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span>Year: {selectedAlbum.year}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Music className="w-4 h-4 text-gray-400" />
                      <span>Songs: {selectedAlbum.songCount}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Headphones className="w-4 h-4 text-gray-400" />
                      <span>
                        Plays:{" "}
                        {selectedAlbum.playCount?.toLocaleString() || "N/A"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span>Language: {selectedAlbum.language}</span>
                    </div>
                  </div>

                  <Button
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => {
                      playAlbum(selectedAlbum);
                      setShowAlbumDetails(false);
                    }}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Play Album
                  </Button>
                </div>
              </div>

              <Separator className="bg-gray-200 dark:bg-gray-700" />

              {/* Album Songs */}
              {selectedAlbum.songs && selectedAlbum.songs.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold mb-4">Album Tracks</h4>
                  <div className="space-y-2">
                    {selectedAlbum.songs.map((song, index) => (
                      <div
                        key={song.id}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group cursor-pointer"
                        onClick={() => playSong(song)}
                      >
                        <span className="text-gray-400 w-6 text-center">
                          {index + 1}
                        </span>
                        <img
                          src={getImageUrl(song.image)}
                          alt={song.name}
                          className="w-10 h-10 rounded object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 dark:text-white truncate">
                            {song.name}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                            {song.artists?.primary
                              ?.map((artist) => artist.name)
                              .join(", ")}
                          </p>
                        </div>
                        <span className="text-sm text-gray-400">
                          {formatDuration(song.duration)}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleMyList(song.id);
                          }}
                        >
                          {myList.has(song.id) ? (
                            <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                          ) : (
                            <Heart className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Audio Player - Temporarily disabled as requested */}
      {/* <AudioPlayer currentSong={currentSong} playlist={songs} onSongChange={setCurrentSong} /> */}
    </div>
  );
}
