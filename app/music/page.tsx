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
  UserPlus,
  UserMinus,
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
import { useMusicCollections } from "@/hooks/use-music-collections";
import { useToast } from "@/hooks/use-toast";

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

export default function MusicApp() {
  const [searchQuery, setSearchQuery] = useState("");
  const [songs, setSongs] = useState<Song[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(false);
  const [ratings, setRatings] = useState<Record<string, number>>({});
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
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

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
  } = useMusicCollections();

  const { toast } = useToast();

  // Load ratings from localStorage on component mount
  useEffect(() => {
    const savedRatings = localStorage.getItem("songRatings");

    if (savedRatings) {
      setRatings(JSON.parse(savedRatings));
    }
  }, []);

  // Click outside handler to close search dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.search-container')) {
        setShowSearchDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
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

  // Clear search results when search query changes
  const handleSearchQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setSearchQuery(newQuery);
    
    // Clear results and hide dropdown when query changes
    if (newQuery.trim() === "") {
      setSongs([]);
      setAlbums([]);
      setArtists([]);
      setShowSearchDropdown(false);
    } else {
      // Hide dropdown when typing (will show only after Enter)
      setShowSearchDropdown(false);
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

  const handleLikeSong = async (song: Song) => {
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
      toast({
        title: "Error",
        description: "Failed to update liked songs. Please try again.",
        variant: "destructive",
      });
    }
  };

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
          songs: album.songs?.map(song => ({
            ...song,
            addedAt: new Date().toISOString()
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
    if (!searchQuery.trim()) return;
    
    setCurrentPage(1);
    setAlbumPage(1);
    setArtistPage(1);

    // Search all types and show results in dropdown
      searchSongs(1, false);
      searchAlbums(1, false);
      searchArtists(1, false);
    setShowSearchDropdown(true);
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

                 {/* Search Bar with Dropdown Results */}
         <div className="max-w-2xl mx-auto mb-8 search-container">
           <div className="relative">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Search for songs, albums, or artists..."
                value={searchQuery}
                   onChange={handleSearchQueryChange}
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

             {/* Search Results Dropdown */}
             {showSearchDropdown && searchQuery.trim() && (songs.length > 0 || albums.length > 0 || artists.length > 0) && (
               <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-50 max-h-96 overflow-y-auto">
                 <div className="p-4">
                   {/* Artists Results */}
                   {artists.length > 0 && (
                     <div className="mb-4">
                       <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                         <Users className="w-4 h-4" />
                         Artists ({artists.length})
                       </h3>
                       <div className="space-y-2">
                         {artists.slice(0, 3).map((artist) => (
                           <div
                             key={artist.id}
                             className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer group"
                           >
                             <img
                               src={getImageUrl(artist.image)}
                               alt={artist.name}
                               className="w-10 h-10 rounded-lg object-cover"
                             />
                             <div className="flex-1 min-w-0">
                               <h4 className="font-medium text-gray-900 dark:text-white truncate text-sm">
                                 {artist.name}
                               </h4>
                               <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                                 {artist.type || "Artist"}
                               </p>
        </div>
                             <Button
                               size="sm"
                               className={`${
                                 isArtistFollowed(artist.id)
                                   ? "bg-red-600 hover:bg-red-700 text-white"
                                   : "bg-white text-black hover:bg-gray-100 border border-gray-300"
                               } text-xs px-2 py-1`}
                               onClick={(e) => {
                                 e.stopPropagation();
                                 handleFollowArtist(artist);
                               }}
                             >
                               {isArtistFollowed(artist.id) ? (
                                 <>
                                   <UserMinus className="w-3 h-3 mr-1" />
                                   Unfollow
                                 </>
                               ) : (
                                 <>
                                   <UserPlus className="w-3 h-3 mr-1" />
                                   Follow
                                 </>
                               )}
                             </Button>
                           </div>
                         ))}
                       </div>
                     </div>
                   )}

                   {/* Albums Results */}
                   {albums.length > 0 && (
                     <div className="mb-4">
                       <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                         <Disc className="w-4 h-4" />
                         Albums ({albums.length})
                       </h3>
                       <div className="space-y-2">
                         {albums.slice(0, 3).map((album) => (
                           <div
                             key={album.id}
                             className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer group"
                             onClick={() => fetchAlbumDetails(album.id)}
                           >
                             <img
                               src={getImageUrl(album.image)}
                               alt={album.name}
                               className="w-10 h-10 rounded-lg object-cover"
                             />
                             <div className="flex-1 min-w-0">
                               <h4 className="font-medium text-gray-900 dark:text-white truncate text-sm">
                                 {album.name}
                               </h4>
                               <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                 {album.artists?.primary
                                   ?.map((artist) => artist.name)
                                   .join(", ") || "Unknown Artist"}
                               </p>
                             </div>
                             <div className="flex gap-1">
                               <Button
                                 size="sm"
                                 className="bg-white text-black hover:bg-gray-100 border border-gray-300 text-xs px-2 py-1"
                                 onClick={(e) => {
                                   e.stopPropagation();
                                   playAlbum(album);
                                 }}
                               >
                                 <Play className="w-3 h-3" />
                               </Button>
                               <Button
                                 size="sm"
                                 className={`${
                                   isAlbumLiked(album.id)
                                     ? "bg-red-600 hover:bg-red-700 text-white"
                                     : "bg-white text-black hover:bg-gray-100 border border-gray-300"
                                 } text-xs px-2 py-1`}
                                 onClick={(e) => {
                                   e.stopPropagation();
                                   handleLikeAlbum(album);
                                 }}
                               >
                                 <Heart className={`w-3 h-3 ${
                                   isAlbumLiked(album.id) ? "fill-current" : ""
                                 }`} />
                               </Button>
                             </div>
                           </div>
                         ))}
                       </div>
                     </div>
                   )}

                   {/* Songs Results */}
                   {songs.length > 0 && (
                     <div>
                       <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                         <Music className="w-4 h-4" />
                         Songs ({songs.length})
                       </h3>
                       <div className="space-y-2">
                         {songs.slice(0, 5).map((song) => (
                           <div
                             key={song.id}
                             className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer group"
                             onClick={() => openSongDetails(song)}
                           >
                             <img
                               src={getImageUrl(song.image)}
                               alt={song.name}
                               className="w-10 h-10 rounded-lg object-cover"
                             />
                             <div className="flex-1 min-w-0">
                               <h4 className="font-medium text-gray-900 dark:text-white truncate text-sm">
                                 {song.name}
                               </h4>
                               <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                 {song.artists?.primary
                                   ?.map((artist) => artist.name)
                                   .join(", ") || "Unknown Artist"}
                               </p>
                             </div>
                             <div className="flex items-center gap-2">
                               <span className="text-xs text-gray-400">
                                 {formatDuration(song.duration)}
                               </span>
                               <Button
                                 size="sm"
                                 className="bg-white text-black hover:bg-gray-100 border border-gray-300 text-xs px-2 py-1"
                                 onClick={(e) => {
                                   e.stopPropagation();
                                   playSong(song);
                                 }}
                               >
                                 <Play className="w-3 h-3" />
                               </Button>
                               <Button
                                 size="sm"
                                 className={`${
                                   isSongLiked(song.id)
                                     ? "text-red-500 hover:text-red-600"
                                     : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                                 } text-xs px-2 py-1`}
                                 onClick={(e) => {
                                   e.stopPropagation();
                                   handleLikeSong(song);
                                 }}
                               >
                                 <Heart className={`w-3 h-3 ${
                                   isSongLiked(song.id) ? "fill-red-500 text-red-500" : ""
                                 }`} />
                               </Button>
                             </div>
                           </div>
                         ))}
                       </div>
                     </div>
                   )}
                 </div>
               </div>
             )}

             {/* No Results */}
             {showSearchDropdown && searchQuery.trim() && !loading && songs.length === 0 && albums.length === 0 && artists.length === 0 && (
               <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-50 p-4">
                 <div className="text-center py-4">
                   <Music className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                   <p className="text-sm text-gray-500 dark:text-gray-400">
                     No results found for "{searchQuery}"
                   </p>
                 </div>
               </div>
             )}

             {/* Loading State */}
             {showSearchDropdown && loading && searchQuery.trim() && (
               <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-50 p-4">
                 <div className="text-center py-4">
                   <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-2"></div>
                   <p className="text-sm text-gray-500 dark:text-gray-400">
                     Searching...
                   </p>
                 </div>
               </div>
             )}
           </div>
         </div>

         {/* Navigation Tabs - Now positioned under search bar */}
         <div className="max-w-2xl mx-auto mb-8">
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
          {/* Discover Tab - Recommendations Only */}
          {activeTab === "discover" && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Discover New Music
              </h2>
              <Recommendations
                currentSong={currentSong}
                ratings={ratings}
                myList={new Set(likedSongs.map(s => s.id))}
                onPlaySong={playSong}
                onToggleMyList={(songId) => {
                  const song = likedSongs.find(s => s.id === songId);
                  if (song) {
                    handleLikeSong(song);
                  }
                }}
                onRateSong={rateSong}
              />
            </div>
          )}

          {/* Artists Tab - Show Followed Artists */}
          {activeTab === "artists" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Followed Artists
                </h2>
                {followedArtists.length > 0 && (
                  <Badge
                    variant="outline"
                    className="text-gray-600 dark:text-gray-300"
                  >
                    {followedArtists.length} artists followed
                  </Badge>
                )}
              </div>

              {followedArtists.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    No followed artists yet
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    Start exploring and follow your favorite artists!
                  </p>
                  <Button
                    onClick={() => handleTabChange("discover")}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Discover Artists
                  </Button>
                </div>
              ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {followedArtists.map((artist) => (
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
                              className="bg-red-600 hover:bg-red-700 text-white"
                                                             onClick={(e) => {
                                 e.stopPropagation();
                                 handleFollowArtist(artist);
                               }}
                            >
                              <UserMinus className="w-4 h-4 mr-2" />
                              Unfollow
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
              )}
            </div>
          )}

          {/* Albums Tab - Show Liked Albums */}
          {activeTab === "albums" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Liked Albums
                </h2>
                {likedAlbums.length > 0 && (
                  <Badge
                    variant="outline"
                    className="text-gray-600 dark:text-gray-300"
                  >
                    {likedAlbums.length} albums liked
                  </Badge>
                )}
              </div>

              {likedAlbums.length === 0 ? (
                <div className="text-center py-12">
                  <Disc className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    No liked albums yet
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    Start exploring and like your favorite albums!
                  </p>
                  <Button
                    onClick={() => handleTabChange("discover")}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Discover Albums
                  </Button>
                </div>
              ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {likedAlbums.map((album) => (
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
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center gap-2">
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
                            <Button
                              size="sm"
                              className="bg-red-600 hover:bg-red-700 text-white"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleLikeAlbum(album);
                              }}
                            >
                              <Heart className="w-4 h-4 mr-2" />
                              Unlike
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
              )}
            </div>
          )}

          {/* Songs Tab - Show Liked Songs */}
          {activeTab === "songs" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Liked Songs
                </h2>
                {likedSongs.length > 0 && (
                  <Badge
                    variant="outline"
                    className="text-gray-600 dark:text-gray-300"
                  >
                    {likedSongs.length} songs liked
                  </Badge>
                )}
              </div>

              {likedSongs.length === 0 ? (
                <div className="text-center py-12">
                  <Music className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    No liked songs yet
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    Start exploring and like your favorite songs!
                  </p>
                  <Button
                    onClick={() => handleTabChange("discover")}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Discover Songs
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4">
                  {likedSongs.map((song) => (
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
                                handleLikeSong(song);
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
                myList={new Set(likedSongs.map(s => s.id))}
                  onPlaySong={playSong}
                onToggleMyList={(songId) => {
                  const song = likedSongs.find(s => s.id === songId);
                  if (song) {
                    handleLikeSong(song);
                  }
                }}
                  onRateSong={rateSong}
                />
              </div>
            </div>
          )}
        </div>


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
                      isSongLiked(selectedSong.id)
                        ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-300 dark:border-red-600"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    }`}
                    onClick={() => handleLikeSong(selectedSong)}
                  >
                    {isSongLiked(selectedSong.id) ? (
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
                            handleLikeSong(song);
                          }}
                        >
                          {isSongLiked(song.id) ? (
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
