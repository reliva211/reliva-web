"use client";

import type React from "react";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
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
  UserPlus,
  UserMinus,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
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
import YouTubePlayer from "@/components/youtube-player";
import { cn } from "@/lib/utils";
import { useMusicCollections } from "@/hooks/use-music-collections";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useYouTubePlayer } from "@/hooks/use-youtube-player";

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

interface SearchResponse {
  data: {
    results: Song[] | Album[] | Artist[];
  };
}

interface AlbumDetailsResponse {
  data: Album;
}

// Utility function to decode HTML entities
const decodeHtmlEntities = (text: string): string => {
  const textarea = document.createElement("textarea");
  textarea.innerHTML = text;
  return textarea.value;
};

export default function MusicApp() {
  const router = useRouter();

  // Scroll refs for search results
  const artistsScrollRef = useRef<HTMLDivElement>(null);
  const albumsScrollRef = useRef<HTMLDivElement>(null);
  const songsScrollRef = useRef<HTMLDivElement>(null);

  const scrollArtistsLeft = () => {
    if (artistsScrollRef.current) {
      artistsScrollRef.current.scrollBy({ left: -300, behavior: "smooth" });
    }
  };

  const scrollArtistsRight = () => {
    if (artistsScrollRef.current) {
      artistsScrollRef.current.scrollBy({ left: 300, behavior: "smooth" });
    }
  };

  const scrollAlbumsLeft = () => {
    if (albumsScrollRef.current) {
      albumsScrollRef.current.scrollBy({ left: -300, behavior: "smooth" });
    }
  };

  const scrollAlbumsRight = () => {
    if (albumsScrollRef.current) {
      albumsScrollRef.current.scrollBy({ left: 300, behavior: "smooth" });
    }
  };

  const scrollSongsLeft = () => {
    if (songsScrollRef.current) {
      songsScrollRef.current.scrollBy({ left: -300, behavior: "smooth" });
    }
  };

  const scrollSongsRight = () => {
    if (songsScrollRef.current) {
      songsScrollRef.current.scrollBy({ left: 300, behavior: "smooth" });
    }
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [songs, setSongs] = useState<Song[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(false);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [showAlbumDetails, setShowAlbumDetails] = useState(false);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [albumPage, setAlbumPage] = useState(1);
  const [artistPage, setArtistPage] = useState(1);
  const [activeTab, setActiveTab] = useState("explore");
  const [hasMoreSongs, setHasMoreSongs] = useState(false);
  const [hasMoreAlbums, setHasMoreAlbums] = useState(false);
  const [hasMoreArtists, setHasMoreArtists] = useState(false);
  const [searchType, setSearchType] = useState<
    "all" | "song" | "album" | "artist"
  >("all");
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [showSearchTypeDropdown, setShowSearchTypeDropdown] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Music collections hook
  const {
    followedArtists,
    likedSongs,
    likedAlbums,
    loading: collectionsLoading,
    followArtist,
    unfollowArtist,
    likeSong,
    unlikeSong,
    likeAlbum,
    unlikeAlbum,
    isArtistFollowed,
    isSongLiked,
    isAlbumLiked,
    isAlbumInRecommendations,
    addAlbumToRecommendations,
    removeAlbumFromRecommendations,
    musicRecommendations,
  } = useMusicCollections();

  const { toast } = useToast();
  const { showPlayer } = useYouTubePlayer();

  // Load ratings from localStorage on component mount
  useEffect(() => {
    const savedRatings = localStorage.getItem("songRatings");

    if (savedRatings) {
      setRatings(JSON.parse(savedRatings));
    }
  }, []);

  // Handle URL parameters for search
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const searchParam = urlParams.get("search");
    const typeParam = urlParams.get("type") as
      | "all"
      | "song"
      | "album"
      | "artist"
      | null;

    if (searchParam) {
      setSearchQuery(searchParam);
      if (typeParam && ["all", "song", "album", "artist"].includes(typeParam)) {
        setSearchType(typeParam);
      }
      // Trigger search automatically
      setTimeout(() => {
        handleSearch();
      }, 100);
    }
  }, []);

  // Click outside handler to close search dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".search-container")) {
        setShowSearchDropdown(false);
      }
      if (!target.closest(".search-type-dropdown")) {
        setShowSearchTypeDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Save ratings to localStorage whenever ratings change
  useEffect(() => {
    localStorage.setItem("songRatings", JSON.stringify(ratings));
  }, [ratings]);

  const searchSongs = async (page = 1, append = false) => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(
        `/api/saavn/search?q=${encodeURIComponent(
          searchQuery
        )}&type=song&page=${page}&limit=10`
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
        setHasMoreSongs(results.length === 10);
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
        )}&type=album&page=${page}&limit=10`
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
        setHasMoreAlbums(results.length === 10);
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
        )}&type=artist&page=${page}&limit=5`
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
        setHasMoreArtists(results.length === 5);
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

  // Update search query without triggering any search
  const handleSearchQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setSearchQuery(newQuery);
    // No active rendering while typing - only on Enter or button click
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSongs([]);
    setAlbums([]);
    setArtists([]);
    setShowSearchDropdown(false);
    setShowSearchResults(false);
  };

  const rateSong = useCallback(
    (songId: string, rating: number) => {
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
    },
    [ratings]
  );

  const handleLikeSong = useCallback(
    async (song: Song) => {
      try {
        if (isSongLiked(song.id)) {
          await unlikeSong(song.id);
          toast({
            title: "Song removed from liked songs",
            description: `${song.name} has been removed from your liked songs.`,
          });
        } else {
          // Ensure all fields have proper values
          const musicSong = {
            id: song.id,
            name: song.name || "Unknown Song",
            artists: song.artists || { primary: [] },
            image: song.image || [],
            album: song.album || { name: "Unknown Album" },
            duration: song.duration || 0,
            year: song.year || "Unknown",
            language: song.language || "Unknown",
            playCount: song.playCount || 0,
            downloadUrl: song.downloadUrl || [],
          };
          await likeSong(musicSong);
          toast({
            title: "Song added to liked songs",
            description: `${song.name} has been added to your liked songs.`,
          });
        }
      } catch (error) {
        console.error("Error in handleLikeSong:", error);
        toast({
          title: "Error",
          description: "Failed to update liked songs. Please try again.",
          variant: "destructive",
        });
      }
    },
    [isSongLiked, unlikeSong, likeSong, toast]
  );

  const handleFollowArtist = async (artist: Artist) => {
    try {
      if (isArtistFollowed(artist.id)) {
        await unfollowArtist(artist.id);
        toast({
          title: "Artist unfollowed",
          description: `You have unfollowed ${artist.name}.`,
        });
      } else {
        // Ensure all fields have proper values
        const musicArtist = {
          id: artist.id,
          name: artist.name || "Unknown Artist",
          image: artist.image || [],
          type: artist.type || "Artist",
          language: "Unknown",
          description: "",
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

  const handleLikeAlbum = async (album: Album) => {
    try {
      if (isAlbumLiked(album.id)) {
        await unlikeAlbum(album.id);
        toast({
          title: "Album removed from liked albums",
          description: `${album.name} has been removed from your liked albums.`,
        });
      } else {
        // Convert Album to MusicAlbum format with proper fallbacks
        const musicAlbum = {
          id: album.id,
          name: album.name || "Unknown Album",
          artists: album.artists || { primary: [] },
          image: album.image || [],
          year: album.year || "Unknown",
          language: album.language || "Unknown",
          songCount: album.songCount || 0,
          playCount: album.playCount || 0,
          songs:
            album.songs?.map((song) => ({
              ...song,
              addedAt: new Date().toISOString(),
            })) || [],
        };
        await likeAlbum(musicAlbum);
        toast({
          title: "Album added to liked albums",
          description: `${album.name} has been added to your liked albums.`,
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
      <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4 cursor-pointer transition-colors ${
              star <= currentRating
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300 hover:text-yellow-300"
            }`}
            onClick={(e) => {
              e.stopPropagation();
              rateSong(songId, star);
            }}
          />
        ))}
        <span className="text-xs text-gray-400 ml-1 whitespace-nowrap">
          {currentRating > 0 ? `${currentRating}/5` : "Rate"}
        </span>
      </div>
    );
  };

  // Memoize the myList Set to prevent recreation on every render
  const myList = useMemo(
    () => new Set(likedSongs.map((s) => s.id)),
    [likedSongs]
  );

  // Memoize the onToggleMyList callback for recommendations
  const onToggleMyList = useCallback(
    (song: Song) => {
      // Check if the song is already in liked songs
      const existingSong = likedSongs.find((s) => s.id === song.id);
      if (existingSong) {
        // If it exists, remove it (unlike)
        handleLikeSong(existingSong);
      } else {
        // If it doesn't exist, add it to liked songs
        handleLikeSong(song);
      }
    },
    [handleLikeSong]
  );

  // Memoize Recommendations props to prevent unnecessary re-renders
  const recommendationsProps = useMemo(
    () => ({
      currentSong,
      ratings,
      myList,
      onPlaySongAction: () => {},
      onToggleMyListAction: onToggleMyList,
      onRateSongAction: rateSong,
    }),
    [currentSong, ratings, onToggleMyList, rateSong]
  );

  const handleSearch = (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    if (!searchQuery.trim()) return;

    setCurrentPage(1);
    setAlbumPage(1);
    setArtistPage(1);
    setSongs([]);
    setAlbums([]);
    setArtists([]);
    setShowSearchResults(true); // Show full search results

    // Search based on selected type
    if (searchType === "all" || searchType === "song") {
      searchSongs(1, false);
    }
    if (searchType === "all" || searchType === "album") {
      searchAlbums(1, false);
    }
    if (searchType === "all" || searchType === "artist") {
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
    setShowSearchResults(false);
  };

  const handleSongChange = (song: Song) => {
    setCurrentSong(song);
  };

  const getImageUrl = (images: any[]) => {
    return (
      images?.[2]?.url ||
      images?.[1]?.url ||
      images?.[0]?.url ||
      "/placeholder.svg"
    );
  };

  const getSearchTypeIcon = () => {
    switch (searchType) {
      case "song":
        return <Music className="w-4 h-4" />;
      case "album":
        return <Disc className="w-4 h-4" />;
      case "artist":
        return <Users className="w-4 h-4" />;
      default:
        return <Filter className="w-4 h-4" />;
    }
  };

  const getSearchTypeLabel = () => {
    switch (searchType) {
      case "song":
        return "Songs";
      case "album":
        return "Albums";
      case "artist":
        return "Artists";
      default:
        return "All";
    }
  };

  const handleAddAlbumToRecommendations = async (
    album: Album,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();

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
          year: album.year || "Unknown",
          language: album.language || "Unknown",
          songCount: album.songCount || 0,
          playCount: album.playCount || 0,
          songs:
            album.songs?.map((song) => ({
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black w-full overflow-x-hidden">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gradient-to-r from-gray-900/95 to-gray-800/95 backdrop-blur-sm w-full">
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-full">
          <div className="flex items-center justify-between">
            <div className="ml-16 lg:ml-0">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
                Music
              </h1>
              <p className="text-gray-400 mt-1 sm:mt-2 text-sm sm:text-lg">
                Discover and organize your favorite music
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-full overflow-x-hidden">
        {/* Search and Filters */}
        <div className="mb-8 sm:mb-10 w-full">
          <div className="flex flex-col gap-3 sm:gap-4 mb-6 sm:mb-8 w-full">
            {/* Search */}
            <div className="flex-1 w-full search-container">
              <form
                onSubmit={handleSearch}
                className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full"
              >
                <div className="flex items-center gap-2 max-w-md">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Search for songs, albums, or artists..."
                      value={searchQuery}
                      onChange={handleSearchQueryChange}
                      onKeyPress={handleKeyPress}
                      className="pl-10 sm:pl-12 h-11 sm:h-12 bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-400 focus:border-gray-500 focus:ring-gray-500 rounded-xl text-sm sm:text-base w-full"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={clearSearch}
                        className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2"
                      >
                        <X className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 hover:text-white transition-colors" />
                      </button>
                    )}
                  </div>

                  <Button
                    onClick={handleSearch}
                    disabled={loading}
                    className="h-11 sm:h-12 w-11 sm:w-12 bg-gradient-to-r from-gray-800 to-gray-700 hover:from-gray-700 hover:to-gray-600 text-white rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl border border-gray-600 flex-shrink-0 flex items-center justify-center"
                  >
                    {loading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                  </Button>
                </div>

                {/* Search Type Dropdown - Now inline with search bar on mobile */}
                <div className="relative search-type-dropdown flex-shrink-0">
                  <button
                    type="button"
                    onClick={() =>
                      setShowSearchTypeDropdown(!showSearchTypeDropdown)
                    }
                    className="flex items-center gap-2 px-3 sm:px-4 py-3 bg-gray-800/50 border border-gray-700 text-white rounded-xl hover:bg-gray-700/50 transition-colors h-11 sm:h-12"
                  >
                    {getSearchTypeIcon()}
                    <span className="text-sm font-medium hidden sm:block">
                      {getSearchTypeLabel()}
                    </span>
                    <ChevronDown className="w-4 h-4" />
                  </button>

                  {showSearchTypeDropdown && (
                    <div className="absolute top-full left-0 mt-2 bg-gray-800 border border-gray-700 rounded-xl shadow-lg z-50 min-w-32">
                      <div className="py-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSearchType("all");
                            setShowSearchTypeDropdown(false);
                          }}
                          className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-700 transition-colors flex items-center gap-2 ${
                            searchType === "all"
                              ? "text-blue-400"
                              : "text-white"
                          }`}
                        >
                          <Search className="w-4 h-4" />
                          All
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSearchType("song");
                            setShowSearchTypeDropdown(false);
                          }}
                          className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-700 transition-colors flex items-center gap-2 ${
                            searchType === "song"
                              ? "text-blue-400"
                              : "text-white"
                          }`}
                        >
                          <Music className="w-4 h-4" />
                          Songs
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSearchType("album");
                            setShowSearchTypeDropdown(false);
                          }}
                          className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-700 transition-colors flex items-center gap-2 ${
                            searchType === "album"
                              ? "text-blue-400"
                              : "text-white"
                          }`}
                        >
                          <Disc className="w-4 h-4" />
                          Albums
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSearchType("artist");
                            setShowSearchTypeDropdown(false);
                          }}
                          className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-700 transition-colors flex items-center gap-2 ${
                            searchType === "artist"
                              ? "text-blue-400"
                              : "text-white"
                          }`}
                        >
                          <Users className="w-4 h-4" />
                          Artists
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </form>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-3 sm:gap-4 overflow-x-auto pb-4 scrollbar-hide w-full horizontal-scroll-container px-0">
            <button
              onClick={() => handleTabChange("explore")}
              className={cn(
                "flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 sm:py-3 rounded-xl transition-all duration-300 whitespace-nowrap font-medium text-sm sm:text-base flex-shrink-0",
                activeTab === "explore"
                  ? "bg-gradient-to-r from-gray-800 to-gray-700 text-white shadow-lg border border-gray-600"
                  : "hover:bg-gray-800/50 text-gray-300 hover:text-white"
              )}
            >
              <span>Explore</span>
            </button>
            <button
              onClick={() => handleTabChange("artists")}
              className={cn(
                "flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 sm:py-3 rounded-xl transition-all duration-300 whitespace-nowrap font-medium text-sm sm:text-base flex-shrink-0",
                activeTab === "artists"
                  ? "bg-gradient-to-r from-gray-800 to-gray-700 text-white shadow-lg border border-gray-600"
                  : "hover:bg-gray-800/50 text-gray-300 hover:text-white"
              )}
            >
              <span>Artists</span>
              {followedArtists.length > 0 && (
                <Badge
                  variant="secondary"
                  className={`ml-1 ${
                    activeTab === "artists"
                      ? "bg-white/20 text-white"
                      : "bg-gray-700 text-gray-300"
                  }`}
                >
                  {followedArtists.length}
                </Badge>
              )}
            </button>
            <button
              onClick={() => handleTabChange("albums")}
              className={cn(
                "flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 sm:py-3 rounded-xl transition-all duration-300 whitespace-nowrap font-medium text-sm sm:text-base flex-shrink-0",
                activeTab === "albums"
                  ? "bg-gradient-to-r from-gray-800 to-gray-700 text-white shadow-lg border border-gray-600"
                  : "hover:bg-gray-800/50 text-gray-300 hover:text-white"
              )}
            >
              <span>Albums</span>
              {likedAlbums.length > 0 && (
                <Badge
                  variant="secondary"
                  className={`ml-1 ${
                    activeTab === "albums"
                      ? "bg-white/20 text-white"
                      : "bg-gray-700 text-gray-300"
                  }`}
                >
                  {likedAlbums.length}
                </Badge>
              )}
            </button>
            <button
              onClick={() => handleTabChange("songs")}
              className={cn(
                "flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 sm:py-3 rounded-xl transition-all duration-300 whitespace-nowrap font-medium text-sm sm:text-base flex-shrink-0",
                activeTab === "songs"
                  ? "bg-gradient-to-r from-gray-800 to-gray-700 text-white shadow-lg border border-gray-600"
                  : "hover:bg-gray-800/50 text-gray-300 hover:text-white"
              )}
            >
              <Music className="w-4 h-4" />
              <span>Songs</span>
              {likedSongs.length > 0 && (
                <Badge
                  variant="secondary"
                  className={`ml-1 ${
                    activeTab === "songs"
                      ? "bg-white/20 text-white"
                      : "bg-gray-700 text-gray-300"
                  }`}
                >
                  {likedSongs.length}
                </Badge>
              )}
            </button>
            <button
              onClick={() => handleTabChange("recommended")}
              className={cn(
                "flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 sm:py-3 rounded-xl transition-all duration-300 whitespace-nowrap font-medium text-sm sm:text-base flex-shrink-0",
                activeTab === "recommended"
                  ? "bg-gradient-to-r from-gray-800 to-gray-700 text-white shadow-lg border border-gray-600"
                  : "hover:bg-gray-800/50 text-gray-300 hover:text-white"
              )}
            >
              <span>Recommended</span>
            </button>
          </div>
        </div>

        {/* Content Sections */}
        <div className="space-y-8 w-full">
          {/* Search Results */}
          {showSearchResults && (
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-0 mb-6">
                <div>
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">
                    Search Results
                  </h2>
                  <p className="text-gray-400 mt-1 sm:mt-2 text-sm sm:text-base">
                    Music matching your search
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={clearSearch}
                  className="border-gray-600 hover:bg-gray-800 hover:border-gray-500 transition-all duration-200 text-sm sm:text-base px-4 sm:px-6 py-2 sm:py-3"
                >
                  Clear Search
                </Button>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="text-center space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
                    <p className="text-gray-400 text-lg">Searching music...</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Artists Results */}
                  {artists.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        Artists
                      </h3>
                      <div className="relative">
                        {/* Left Arrow */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={scrollArtistsLeft}
                          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-gray-800/80 hover:bg-gray-700/80 text-white border border-gray-600 rounded-full w-10 h-10 p-0 shadow-lg"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </Button>

                        {/* Right Arrow */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={scrollArtistsRight}
                          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-gray-800/80 hover:bg-gray-700/80 text-white border border-gray-600 rounded-full w-10 h-10 p-0 shadow-lg"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </Button>

                        <div
                          ref={artistsScrollRef}
                          className="flex gap-2 overflow-x-auto scrollbar-hide pb-4 px-12 horizontal-scroll-container"
                        >
                          {artists.map((artist) => (
                            <div
                              key={artist.id}
                              className="flex-shrink-0 w-[200px] sm:w-[220px] md:w-[240px] text-center"
                            >
                              <div
                                className="cursor-pointer group"
                                onClick={() =>
                                  router.push(`/music/artist/${artist.id}`)
                                }
                              >
                                <div className="relative mb-2">
                                  <img
                                    src={getImageUrl(artist.image)}
                                    alt={artist.name}
                                    className="w-full aspect-square rounded-full object-cover mx-auto"
                                  />
                                  {/* Hover overlay with action buttons */}
                                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full flex items-center justify-center gap-4">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleFollowArtist(artist);
                                      }}
                                      className={`w-12 h-12 backdrop-blur-sm rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 ${
                                        isArtistFollowed(artist.id)
                                          ? "bg-red-500/80 hover:bg-red-600/80"
                                          : "bg-white/20 hover:bg-white/30"
                                      }`}
                                      title={
                                        isArtistFollowed(artist.id)
                                          ? "Unfollow artist"
                                          : "Follow artist"
                                      }
                                    >
                                      <Heart
                                        className={`w-5 h-5 text-white ${
                                          isArtistFollowed(artist.id)
                                            ? "fill-red-400"
                                            : "fill-white"
                                        }`}
                                      />
                                    </button>
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <h4
                                    className="font-semibold text-white truncate"
                                    title={artist.name}
                                  >
                                    {artist.name}
                                  </h4>
                                  <p className="text-sm text-gray-400 capitalize">
                                    {artist.type || "Artist"}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Albums Results */}
                  {albums.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Disc className="w-5 h-5" />
                        Albums
                      </h3>
                      <div className="relative">
                        {/* Left Arrow */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={scrollAlbumsLeft}
                          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-gray-800/80 hover:bg-gray-700/80 text-white border border-gray-600 rounded-full w-10 h-10 p-0 shadow-lg"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </Button>

                        {/* Right Arrow */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={scrollAlbumsRight}
                          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-gray-800/80 hover:bg-gray-700/80 text-white border border-gray-600 rounded-full w-10 h-10 p-0 shadow-lg"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </Button>

                        <div
                          ref={albumsScrollRef}
                          className="flex gap-2 overflow-x-auto scrollbar-hide pb-4 px-12 horizontal-scroll-container"
                        >
                          {albums.map((album) => (
                            <div
                              key={album.id}
                              className="flex-shrink-0 w-[200px] sm:w-[220px] md:w-[240px]"
                            >
                              <div
                                className="cursor-pointer group"
                                onClick={() =>
                                  router.push(`/music/album/${album.id}`)
                                }
                              >
                                <div className="relative mb-2">
                                  <img
                                    src={getImageUrl(album.image)}
                                    alt={album.name}
                                    className="w-full aspect-square rounded-lg object-cover"
                                  />
                                  {/* Hover overlay with action buttons */}
                                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg flex items-center justify-center gap-2 sm:gap-4">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleLikeAlbum(album);
                                      }}
                                      className={`w-8 h-8 sm:w-10 sm:h-10 backdrop-blur-sm rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 ${
                                        isAlbumLiked(album.id)
                                          ? "bg-red-500/80 hover:bg-red-600/80"
                                          : "bg-white/20 hover:bg-white/30"
                                      }`}
                                      title={
                                        isAlbumLiked(album.id)
                                          ? "Remove from liked albums"
                                          : "Add to liked albums"
                                      }
                                    >
                                      <Heart
                                        className={`w-3 h-3 sm:w-4 sm:h-4 text-white ${
                                          isAlbumLiked(album.id)
                                            ? "fill-red-400"
                                            : "fill-white"
                                        }`}
                                      />
                                    </button>
                                    <button
                                      onClick={(e) =>
                                        handleAddAlbumToRecommendations(
                                          album,
                                          e
                                        )
                                      }
                                      className={`w-8 h-8 sm:w-10 sm:h-10 backdrop-blur-sm rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 ${
                                        isAlbumInRecommendations(album.id)
                                          ? "bg-green-500/80 hover:bg-green-600/80"
                                          : "bg-white/20 hover:bg-white/30"
                                      }`}
                                      title={
                                        isAlbumInRecommendations(album.id)
                                          ? "Remove from list"
                                          : "Add to list"
                                      }
                                    >
                                      {isAlbumInRecommendations(album.id) ? (
                                        <Check className="w-3 h-3 sm:w-4 sm:h-4 text-white fill-white" />
                                      ) : (
                                        <Plus className="w-3 h-3 sm:w-4 sm:h-4 text-white fill-white" />
                                      )}
                                    </button>
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <h4
                                    className="font-semibold text-white truncate"
                                    title={album.name}
                                  >
                                    {album.name}
                                  </h4>
                                  <p className="text-sm text-gray-400 truncate">
                                    {album.artists?.primary
                                      ?.map((artist) => artist.name)
                                      .join(", ") || "Unknown Artist"}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {album.year}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Songs Results */}
                  {songs.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Music className="w-5 h-5" />
                        Songs
                      </h3>
                      <div className="relative">
                        {/* Left Arrow */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={scrollSongsLeft}
                          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-gray-800/80 hover:bg-gray-700/80 text-white border border-gray-600 rounded-full w-10 h-10 p-0 shadow-lg"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </Button>

                        {/* Right Arrow */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={scrollSongsRight}
                          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-gray-800/80 hover:bg-gray-700/80 text-white border border-gray-600 rounded-full w-10 h-10 p-0 shadow-lg"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </Button>

                        <div
                          ref={songsScrollRef}
                          className="flex gap-2 overflow-x-auto scrollbar-hide pb-4 px-12 horizontal-scroll-container"
                        >
                          {songs.map((song) => (
                            <div
                              key={song.id}
                              className="flex-shrink-0 w-[200px] sm:w-[220px] md:w-[240px]"
                            >
                              <div className="group">
                                <div className="relative mb-2">
                                  <img
                                    src={getImageUrl(song.image)}
                                    alt={song.name}
                                    className="w-full aspect-square rounded-lg object-cover"
                                  />
                                  {/* Hover overlay with action buttons */}
                                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg flex items-center justify-center gap-2 sm:gap-4">
                                    <button
                                      onClick={async (e) => {
                                        e.stopPropagation();
                                        // Create song object for YouTube player
                                        const songForPlayer = {
                                          id: song.id,
                                          title: decodeHtmlEntities(song.name),
                                          artist:
                                            song.artists?.primary
                                              ?.map((artist) => artist.name)
                                              .join(", ") || "Unknown Artist",
                                        };

                                        // Create queue from all songs in search results
                                        const queue = songs.map((s) => ({
                                          id: s.id,
                                          title: decodeHtmlEntities(s.name),
                                          artist:
                                            s.artists?.primary
                                              ?.map((artist) => artist.name)
                                              .join(", ") || "Unknown Artist",
                                        }));

                                        // Find the current song index
                                        const songIndex = songs.findIndex(
                                          (s) => s.id === song.id
                                        );

                                        // Search Results Song Play Button - Queue created

                                        // Start with the clicked song
                                        await showPlayer(
                                          queue[songIndex],
                                          queue,
                                          songIndex
                                        );
                                      }}
                                      className="w-8 h-8 sm:w-10 sm:h-10 bg-green-500/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-green-600/80 transition-all duration-200 hover:scale-110"
                                      title="Play Song"
                                    >
                                      <Play className="w-3 h-3 sm:w-4 sm:h-4 text-white fill-white" />
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const params = new URLSearchParams({
                                          type: "music",
                                          id: song.id,
                                          title: decodeHtmlEntities(song.name),
                                          cover: getImageUrl(song.image),
                                          artist:
                                            song.artists?.primary
                                              ?.map((artist) => artist.name)
                                              .join(", ") || "Unknown Artist",
                                        });
                                        router.push(
                                          `/reviews?${params.toString()}`
                                        );
                                      }}
                                      className="w-8 h-8 sm:w-10 sm:h-10 bg-yellow-500/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-yellow-600/80 transition-all duration-200 hover:scale-110"
                                      title="Write Review"
                                    >
                                      <Star className="w-3 h-3 sm:w-4 sm:h-4 text-white fill-white" />
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleLikeSong(song);
                                      }}
                                      className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
                                      title={
                                        isSongLiked(song.id)
                                          ? "Remove from liked songs"
                                          : "Add to liked songs"
                                      }
                                    >
                                      <Heart
                                        className={`w-3 h-3 sm:w-4 sm:h-4 ${
                                          isSongLiked(song.id)
                                            ? "fill-red-400 text-red-400"
                                            : "fill-white text-white"
                                        }`}
                                      />
                                    </button>
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <h4
                                    className="font-semibold text-white truncate"
                                    title={song.name}
                                  >
                                    {song.name}
                                  </h4>
                                  <p className="text-sm text-gray-400 truncate">
                                    {song.artists?.primary
                                      ?.map((artist) => artist.name)
                                      .join(", ") || "Unknown Artist"}
                                  </p>
                                  {song.album?.name && (
                                    <p className="text-xs text-gray-500 truncate">
                                      {song.album.name}
                                    </p>
                                  )}

                                  <div className="flex items-center justify-between">
                                    <span className="text-xs text-gray-400">
                                      {formatDuration(song.duration)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* No Results */}
                  {!loading &&
                    songs.length === 0 &&
                    albums.length === 0 &&
                    artists.length === 0 && (
                      <div className="text-center py-12">
                        <Music className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-white mb-2">
                          No results found
                        </h3>
                        <p className="text-gray-400 mb-4">
                          Try searching with different keywords
                        </p>
                      </div>
                    )}
                </div>
              )}
            </div>
          )}

          {/* Explore Tab - Recommendations */}
          {activeTab === "explore" && !showSearchResults && (
            <div className="space-y-8 w-full">
              {/* Recommendations section */}
              <div className="w-full">
                <h2 className="text-2xl font-bold text-white mb-6">
                  Explore New Music
                </h2>
                <Recommendations {...recommendationsProps} />
              </div>
            </div>
          )}

          {/* Artists Tab - Show Followed Artists */}
          {activeTab === "artists" && !showSearchResults && (
            <div className="space-y-6 w-full">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    Followed Artists
                  </h2>
                  <p className="text-gray-400 mt-1 text-sm sm:text-base">
                    Stay updated with your favorite musicians
                  </p>
                </div>
                {followedArtists.length > 0 && (
                  <Badge
                    variant="outline"
                    className="text-gray-300 border-gray-600"
                  >
                    {followedArtists.length} artists followed
                  </Badge>
                )}
              </div>

              {followedArtists.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">
                    No followed artists yet
                  </h3>
                  <p className="text-gray-400 mb-4">
                    Start exploring and follow your favorite artists!
                  </p>
                  <Button
                    onClick={() => handleTabChange("explore")}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Explore Artists
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4 sm:gap-6 grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {followedArtists.map((artist) => (
                    <div
                      key={artist.id}
                      className="cursor-pointer"
                      onClick={() => router.push(`/music/artist/${artist.id}`)}
                    >
                      <div className="relative">
                        <img
                          src={getImageUrl(artist.image)}
                          alt={artist.name}
                          className="w-[70%] aspect-square rounded-full object-cover mx-auto"
                        />
                      </div>
                      <div className="mt-3 text-center">
                        <h3
                          className="font-semibold text-white truncate text-sm sm:text-base"
                          title={artist.name}
                        >
                          {artist.name}
                        </h3>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {artist.type || "Artist"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Albums Tab - Show Liked Albums */}
          {activeTab === "albums" && !showSearchResults && (
            <div className="space-y-6 w-full">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    Liked Albums
                  </h2>
                  <p className="text-gray-400 mt-1 text-sm sm:text-base">
                    Your curated collection of favorite albums
                  </p>
                </div>
                {likedAlbums.length > 0 && (
                  <Badge
                    variant="outline"
                    className="text-gray-300 border-gray-600"
                  >
                    {likedAlbums.length} albums liked
                  </Badge>
                )}
              </div>

              {likedAlbums.length === 0 ? (
                <div className="text-center py-12">
                  <Disc className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">
                    No liked albums yet
                  </h3>
                  <p className="text-gray-400 mb-4">
                    Start exploring and like your favorite albums!
                  </p>
                  <Button
                    onClick={() => handleTabChange("explore")}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Explore Albums
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4 sm:gap-6 grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {likedAlbums.map((album) => (
                    <div key={album.id} className="cursor-pointer group">
                      <div className="relative">
                        <img
                          src={getImageUrl(album.image)}
                          alt={album.name}
                          className="w-full aspect-square rounded-lg object-cover"
                        />
                        {/* Hover overlay with action buttons */}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg flex items-center justify-center gap-4">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              // Placeholder for play functionality
                              // Play album
                            }}
                            className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-all duration-200 hover:scale-110"
                          >
                            <Play className="w-5 h-5 text-white fill-white" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleLikeAlbum(album);
                            }}
                            className={`w-12 h-12 backdrop-blur-sm rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 ${
                              isAlbumLiked(album.id)
                                ? "bg-red-500/80 hover:bg-red-600/80"
                                : "bg-white/20 hover:bg-white/30"
                            }`}
                            title={
                              isAlbumLiked(album.id)
                                ? "Remove from liked albums"
                                : "Add to liked albums"
                            }
                          >
                            <Heart
                              className={`w-5 h-5 text-white ${
                                isAlbumLiked(album.id)
                                  ? "fill-red-400"
                                  : "fill-white"
                              }`}
                            />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddAlbumToRecommendations(album, e);
                            }}
                            className={`w-12 h-12 backdrop-blur-sm rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 ${
                              isAlbumInRecommendations(album.id)
                                ? "bg-green-500/80 hover:bg-green-600/80"
                                : "bg-white/20 hover:bg-white/30"
                            }`}
                            title={
                              isAlbumInRecommendations(album.id)
                                ? "Remove from list"
                                : "Add to list"
                            }
                          >
                            {isAlbumInRecommendations(album.id) ? (
                              <Check className="w-5 h-5 text-white fill-white" />
                            ) : (
                              <Plus className="w-5 h-5 text-white fill-white" />
                            )}
                          </button>
                        </div>
                      </div>
                      <div className="mt-3">
                        <h3
                          className="font-semibold text-white truncate text-sm sm:text-base"
                          title={album.name}
                        >
                          {album.name}
                        </h3>
                        <p className="text-xs text-gray-400 truncate mt-1">
                          {album.artists?.primary
                            ?.map((artist) => artist.name)
                            .join(", ") || "Unknown Artist"}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {album.year}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Songs Tab - Show Liked Songs */}
          {activeTab === "songs" && !showSearchResults && (
            <div className="space-y-6 w-full">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">Liked Songs</h2>
                  <p className="text-gray-400 mt-1 text-sm sm:text-base">
                    Your personal collection of favorite tracks
                  </p>
                </div>
                {likedSongs.length > 0 && (
                  <Badge
                    variant="outline"
                    className="text-gray-300 border-gray-600"
                  >
                    {likedSongs.length} songs liked
                  </Badge>
                )}
              </div>

              {likedSongs.length === 0 ? (
                <div className="text-center py-12">
                  <Music className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">
                    No liked songs yet
                  </h3>
                  <p className="text-gray-400 mb-4">
                    Start exploring and like your favorite songs!
                  </p>
                  <Button
                    onClick={() => handleTabChange("explore")}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Explore Songs
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4">
                  {likedSongs.map((song) => (
                    <Card
                      key={song.id}
                      className="bg-gray-800/50 border border-gray-700 hover:shadow-md transition-all group"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <img
                              src={getImageUrl(song.image)}
                              alt={song.name}
                              className="w-16 h-16 rounded-lg object-cover"
                            />
                            {/* Hover overlay with action buttons */}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg flex items-center justify-center gap-2">
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  // Create song object for YouTube player
                                  const songForPlayer = {
                                    id: song.id,
                                    title: decodeHtmlEntities(song.name),
                                    artist:
                                      song.artists?.primary
                                        ?.map((artist) => artist.name)
                                        .join(", ") || "Unknown Artist",
                                  };

                                  // Create queue from all liked songs
                                  const queue = likedSongs.map((s) => ({
                                    id: s.id,
                                    title: decodeHtmlEntities(s.name),
                                    artist:
                                      s.artists?.primary
                                        ?.map((artist) => artist.name)
                                        .join(", ") || "Unknown Artist",
                                  }));

                                  // Find the current song index
                                  const songIndex = likedSongs.findIndex(
                                    (s) => s.id === song.id
                                  );

                                  // Liked Songs Play Button - Queue created

                                  // Start with the clicked song
                                  await showPlayer(
                                    queue[songIndex],
                                    queue,
                                    songIndex
                                  );
                                }}
                                className="w-8 h-8 bg-green-500/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-green-600/80 transition-all duration-200 hover:scale-110"
                                title="Play Song"
                              >
                                <Play className="w-3 h-3 text-white fill-white" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleLikeSong(song);
                                }}
                                className={`w-8 h-8 backdrop-blur-sm rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 ${
                                  isSongLiked(song.id)
                                    ? "bg-red-500/80 hover:bg-red-600/80"
                                    : "bg-white/20 hover:bg-white/30"
                                }`}
                                title={
                                  isSongLiked(song.id)
                                    ? "Remove from liked songs"
                                    : "Add to liked songs"
                                }
                              >
                                <Heart
                                  className={`w-3 h-3 text-white ${
                                    isSongLiked(song.id)
                                      ? "fill-red-400"
                                      : "fill-white"
                                  }`}
                                />
                              </button>
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-white truncate">
                              {decodeHtmlEntities(song.name)}
                            </h4>
                            <p className="text-sm text-gray-400 truncate">
                              {song.artists?.primary
                                ?.map((artist) => artist.name)
                                .join(", ") || "Unknown Artist"}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {song.album?.name}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                            <div className="text-sm text-gray-400 whitespace-nowrap">
                              {formatDuration(song.duration)}
                            </div>
                            {/* Rating button */}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-yellow-400 hover:text-yellow-300 flex-shrink-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                const params = new URLSearchParams({
                                  type: "music",
                                  id: song.id,
                                  title: decodeHtmlEntities(song.name),
                                  cover: getImageUrl(song.image),
                                  artist:
                                    song.artists?.primary
                                      ?.map((artist) => artist.name)
                                      .join(", ") || "Unknown Artist",
                                });
                                router.push(`/reviews?${params.toString()}`);
                              }}
                            >
                              <Star className="w-4 h-4" />
                            </Button>
                            {/* Like button */}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-400 hover:text-red-300 flex-shrink-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleLikeSong(song);
                              }}
                            >
                              <Heart
                                className={`w-5 h-5 ${
                                  isSongLiked(song.id)
                                    ? "fill-red-400 text-red-400"
                                    : ""
                                }`}
                              />
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
          {activeTab === "recommended" && !showSearchResults && (
            <div className="space-y-6 w-full">
              <div className="w-full">
                <h2 className="text-2xl font-bold text-white mb-4">
                  Your Music Recommendations
                </h2>
                {musicRecommendations.length === 0 ? (
                  <div className="text-center py-12">
                    <Music className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">
                      No Recommendations Yet
                    </h3>
                    <p className="text-gray-400 mb-4">
                      Start adding albums to your recommendations list from the
                      music section!
                    </p>
                    <Button
                      onClick={() => handleTabChange("explore")}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Explore Music
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-white">
                        Albums in Your Recommendations
                      </h3>
                      <Badge
                        variant="outline"
                        className="text-gray-300 border-gray-600"
                      >
                        {musicRecommendations.length} albums
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                      {musicRecommendations.map((album) => (
                        <div key={album.id} className="group">
                          <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
                            <div
                              className="cursor-pointer"
                              onClick={() =>
                                router.push(`/music/album/${album.id}`)
                              }
                            >
                              <img
                                src={getImageUrl(album.image)}
                                alt={album.name || "Unknown"}
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                              />
                            </div>
                            {/* Hover overlay with action buttons */}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg flex items-center justify-center gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Placeholder for play functionality
                                  // Play album
                                }}
                                className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-all duration-200 hover:scale-110"
                              >
                                <Play className="w-3 h-3 text-white fill-white" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAddAlbumToRecommendations(album, e);
                                }}
                                className="w-8 h-8 bg-red-500/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-red-600/80 transition-all duration-200 hover:scale-110"
                                title="Remove from list"
                              >
                                <X className="w-3 h-3 text-white fill-white" />
                              </button>
                            </div>
                          </div>
                          <div className="mt-2 space-y-1">
                            <h4 className="font-medium text-xs truncate text-white leading-tight">
                              {album.name || "Unknown Title"}
                            </h4>
                            <p className="text-xs text-gray-400 leading-tight">
                              {album.artists?.primary
                                ?.map((artist) => artist.name)
                                .join(", ") || "Unknown Artist"}
                            </p>
                            <p className="text-xs text-gray-500">
                              {album.year}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Album Details Dialog */}
      <Dialog open={showAlbumDetails} onOpenChange={setShowAlbumDetails}>
        <DialogContent className="bg-gray-800 border-gray-700 max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">Album Details</DialogTitle>
          </DialogHeader>
          {selectedAlbum && (
            <div className="space-y-6">
              <div className="flex items-center gap-6">
                <img
                  src={getImageUrl(selectedAlbum.image)}
                  alt={selectedAlbum.name}
                  className="w-32 h-32 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-white mb-2">
                    {decodeHtmlEntities(selectedAlbum.name)}
                  </h3>
                  <p className="text-lg text-gray-300 mb-1">
                    {selectedAlbum.artists?.primary
                      ?.map((artist) => artist.name)
                      .join(", ") || "Unknown Artist"}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span>{selectedAlbum.year}</span>
                    <span>•</span>
                    <span>{selectedAlbum.language}</span>
                    <span>•</span>
                    <span>{selectedAlbum.songCount} songs</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    onClick={() => handleLikeAlbum(selectedAlbum)}
                    className={`${
                      isAlbumLiked(selectedAlbum.id)
                        ? "bg-red-600 hover:bg-red-700 text-white"
                        : "bg-gray-700 text-white hover:bg-gray-600 border border-gray-600"
                    }`}
                  >
                    <Heart
                      className={`w-4 h-4 mr-2 ${
                        isAlbumLiked(selectedAlbum.id) ? "fill-current" : ""
                      }`}
                    />
                    {isAlbumLiked(selectedAlbum.id) ? "Liked" : "Like"}
                  </Button>
                  <Button
                    onClick={() =>
                      handleAddAlbumToRecommendations(
                        selectedAlbum,
                        {} as React.MouseEvent
                      )
                    }
                    variant="outline"
                    className={`${
                      isAlbumInRecommendations(selectedAlbum.id)
                        ? "bg-primary/20 text-primary border-primary/30"
                        : "bg-gray-700 text-white hover:bg-gray-600 border border-gray-600"
                    }`}
                  >
                    {isAlbumInRecommendations(selectedAlbum.id) ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        In List
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Add to List
                      </>
                    )}
                  </Button>
                </div>
              </div>
              {selectedAlbum.songs && selectedAlbum.songs.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-white mb-4">
                    Tracklist
                  </h4>
                  <div className="space-y-2">
                    {selectedAlbum.songs.map((song, index) => (
                      <div
                        key={song.id}
                        className="flex items-center gap-4 p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors group"
                      >
                        <span className="text-sm text-gray-400 w-8">
                          {index + 1}
                        </span>
                        <div className="flex-1">
                          <p className="text-white font-medium">
                            {decodeHtmlEntities(song.name)}
                          </p>
                          <p className="text-sm text-gray-400">
                            {song.artists?.primary
                              ?.map((artist) => artist.name)
                              .join(", ") || "Unknown Artist"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-sm text-gray-400">
                            {formatDuration(song.duration)}
                          </div>
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              // Create song object for YouTube player
                              const songForPlayer = {
                                id: song.id,
                                title: decodeHtmlEntities(song.name),
                                artist:
                                  song.artists?.primary
                                    ?.map((artist) => artist.name)
                                    .join(", ") || "Unknown Artist",
                              };

                              // Create queue from all album songs
                              const queue = selectedAlbum.songs!.map((s) => ({
                                id: s.id,
                                title: decodeHtmlEntities(s.name),
                                artist:
                                  s.artists?.primary
                                    ?.map((artist) => artist.name)
                                    .join(", ") || "Unknown Artist",
                              }));

                              // Find the current song index
                              const songIndex = selectedAlbum.songs!.findIndex(
                                (s) => s.id === song.id
                              );

                              // Album Dialog Song Play Button - Queue created

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
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Audio Player - Temporarily disabled due to interface mismatch */}
      {/* {currentSong && (
        <div className="fixed bottom-0 left-0 right-0 z-50">
          <AudioPlayer
            currentSong={currentSong}
            playlist={likedSongs}
            onSongChange={handleSongChange}
          />
        </div>
      )} */}

      {/* YouTube Player for music playback */}
      <YouTubePlayer />
    </div>
  );
}
