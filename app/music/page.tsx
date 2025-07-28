"use client";

import type React from "react";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Music,
  Heart,
  X,
  Disc,
  User,
  Calendar,
  Globe,
  Clock,
  MoreHorizontal,
  Filter,
  Play,
  Download,
  ExternalLink,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
} from "firebase/firestore";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useSaavnApi } from "@/hooks/use-saavn-api";
import { AudioPlayer } from "@/components/audio-player";
import { 
  SaavnSong, 
  SaavnAlbum, 
  SaavnArtist, 
  getHighQualityImage, 
  getDownloadUrl 
} from "@/lib/saavn";

// Types for unified music data
type MusicItem = SaavnSong | SaavnAlbum | SaavnArtist;

type FavoriteSong = SaavnSong & { isFavorite: boolean };
type FavoriteAlbum = SaavnAlbum & { isFavorite: boolean };
type FavoriteArtist = SaavnArtist & { isFavorite: boolean };

// Languages supported by JioSaavn
const supportedLanguages = [
  "hindi", "english", "punjabi", "tamil", "telugu", "marathi", 
  "gujarati", "bengali", "kannada", "bhojpuri", "malayalam", 
  "urdu", "haryanvi", "rajasthani", "odia", "assamese"
];

export default function MusicPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<'all' | 'songs' | 'albums' | 'artists'>("all");
  const [searchResults, setSearchResults] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("hindi");

  // State for favorites
  const [favoriteSongs, setFavoriteSongs] = useState<FavoriteSong[]>([]);
  const [favoriteAlbums, setFavoriteAlbums] = useState<FavoriteAlbum[]>([]);
  const [favoriteArtists, setFavoriteArtists] = useState<FavoriteArtist[]>([]);

  // State for music player
  const [currentTrack, setCurrentTrack] = useState<{
    url: string;
    title: string;
    artist: string;
    image: string;
    id: string;
  } | null>(null);

  // State for trending content
  const [trendingContent, setTrendingContent] = useState<any>(null);

  // Saavn API hook
  const {
    loading,
    error,
    searchMusic,
    getSong,
    getAlbum,
    getArtist,
    getLyrics,
    getTrending,
  } = useSaavnApi();

  const user = useCurrentUser();
  const userId = user?.uid;

  // Load favorites on component mount
  useEffect(() => {
    if (!userId) return;

    async function loadFavorites() {
      try {
        const [songsSnapshot, albumsSnapshot, artistsSnapshot] = await Promise.all([
          getDocs(collection(db, `users/${userId}/favorites/songs/items`)),
          getDocs(collection(db, `users/${userId}/favorites/albums/items`)),
          getDocs(collection(db, `users/${userId}/favorites/artists/items`)),
        ]);

        setFavoriteSongs(songsSnapshot.docs.map(doc => ({ ...doc.data(), isFavorite: true } as FavoriteSong)));
        setFavoriteAlbums(albumsSnapshot.docs.map(doc => ({ ...doc.data(), isFavorite: true } as FavoriteAlbum)));
        setFavoriteArtists(artistsSnapshot.docs.map(doc => ({ ...doc.data(), isFavorite: true } as FavoriteArtist)));
      } catch (error) {
        console.error("Error loading favorites:", error);
      }
    }

    loadFavorites();
  }, [userId]);

  // Load trending content on component mount
  useEffect(() => {
    async function loadTrendingContent() {
      try {
        const trending = await getTrending('songs');
        setTrendingContent(trending);
      } catch (error) {
        console.error("Error loading trending content:", error);
      }
    }

    loadTrendingContent();
  }, [getTrending]);

  // Selected item for details view
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [detailType, setDetailType] = useState<string>("");

  // Handle search
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    
    try {
      const results = await searchMusic(searchQuery.trim(), searchType);
      setSearchResults(results);
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults(null);
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    setIsSearching(false);
    setSearchResults(null);
  };

  // Toggle favorite status
  const toggleFavorite = async (item: MusicItem, itemType: 'songs' | 'albums' | 'artists') => {
    if (!userId) {
      alert("Login required");
      return;
    }

    const favoritesMap = {
      songs: favoriteSongs,
      albums: favoriteAlbums,
      artists: favoriteArtists,
    };

    const setFavoritesMap = {
      songs: setFavoriteSongs,
      albums: setFavoriteAlbums,
      artists: setFavoriteArtists,
    };

    const favorites = favoritesMap[itemType];
    const setFavorites = setFavoritesMap[itemType];
    const isFavorite = favorites.some((fav: any) => fav.id === item.id);

    try {
      const docRef = doc(db, `users/${userId}/favorites/${itemType}/items`, item.id);
      
      if (isFavorite) {
        await deleteDoc(docRef);
        setFavorites((prev: any) => prev.filter((fav: any) => fav.id !== item.id));
      } else {
        await setDoc(docRef, { ...item, isFavorite: true });
        setFavorites((prev: any) => [...prev, { ...item, isFavorite: true }]);
      }
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
    }
  };

  // Check if item is favorite
  const isFavorite = (item: MusicItem, itemType: 'songs' | 'albums' | 'artists') => {
    const favoritesMap = {
      songs: favoriteSongs,
      albums: favoriteAlbums,
      artists: favoriteArtists,
    };
    
    return favoritesMap[itemType].some((fav: any) => fav.id === item.id);
  };

  // Show details for an item
  const showDetails = (item: any, type: string) => {
    setSelectedItem(item);
    setDetailType(type);
  };

  // Play track
  const playTrack = (song: SaavnSong) => {
    const downloadUrl = getDownloadUrl(song.downloadUrl, '320kbps');
    if (downloadUrl) {
      setCurrentTrack({
        url: downloadUrl,
        title: song.name,
        artist: song.primaryArtists,
        image: getHighQualityImage(song.image),
        id: song.id,
      });
    } else {
      alert("No playable URL available for this track.");
    }
  };

  // Download track
  const downloadTrack = (song: SaavnSong) => {
    const downloadUrl = getDownloadUrl(song.downloadUrl, '320kbps');
    if (downloadUrl) {
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${song.name} - ${song.primaryArtists}.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      alert("No download URL available for this track.");
    }
  };

  // Format duration (seconds to MM:SS)
  const formatDuration = (durationStr: string) => {
    const seconds = parseInt(durationStr);
    if (isNaN(seconds)) return "0:00";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  // Render search results
  const renderSearchResults = () => {
    if (!searchResults) return null;

    const { songs, albums, artists } = searchResults;
    const hasResults = (songs?.data?.length > 0) || (albums?.data?.length > 0) || (artists?.data?.length > 0);

    if (!hasResults) {
      return (
        <div className="text-center py-8">
          <Music className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">No results found</h3>
          <p className="text-muted-foreground">Try searching with different keywords</p>
        </div>
      );
    }

    return (
      <Tabs defaultValue="songs" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="songs">
            Songs ({songs?.data?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="albums">
            Albums ({albums?.data?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="artists">
            Artists ({artists?.data?.length || 0})
          </TabsTrigger>
        </TabsList>

        {/* Songs Tab */}
        <TabsContent value="songs" className="space-y-4">
          {songs?.data?.map((song: SaavnSong) => (
            <Card key={song.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Image
                      src={getHighQualityImage(song.image) || "/placeholder-music.png"}
                      alt={song.name}
                      width={60}
                      height={60}
                      className="rounded-md object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{song.name}</h3>
                    <p className="text-sm text-muted-foreground truncate">
                      {song.primaryArtists}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {song.album?.name} • {song.year} • {formatDuration(song.duration)}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => playTrack(song)}
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => downloadTrack(song)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleFavorite(song, 'songs')}
                    >
                      <Heart
                        className={`h-4 w-4 ${
                          isFavorite(song, 'songs')
                            ? "fill-red-500 text-red-500"
                            : ""
                        }`}
                      />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => showDetails(song, 'song')}>
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <a href={song.url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Open in JioSaavn
                          </a>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Albums Tab */}
        <TabsContent value="albums" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {albums?.data?.map((album: SaavnAlbum) => (
              <Card key={album.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="relative aspect-square">
                      <Image
                        src={getHighQualityImage(album.image) || "/placeholder-music.png"}
                        alt={album.name}
                        fill
                        className="rounded-md object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="font-medium truncate">{album.name}</h3>
                      <p className="text-sm text-muted-foreground truncate">
                        {album.primaryArtists}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {album.year} • {album.songCount} songs
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleFavorite(album, 'albums')}
                      >
                        <Heart
                          className={`h-4 w-4 ${
                            isFavorite(album, 'albums')
                              ? "fill-red-500 text-red-500"
                              : ""
                          }`}
                        />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => showDetails(album, 'album')}>
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <a href={album.url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="mr-2 h-4 w-4" />
                              Open in JioSaavn
                            </a>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Artists Tab */}
        <TabsContent value="artists" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {artists?.data?.map((artist: SaavnArtist) => (
              <Card key={artist.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="relative aspect-square">
                      <Image
                        src={getHighQualityImage(artist.image) || "/placeholder-music.png"}
                        alt={artist.name}
                        fill
                        className="rounded-full object-cover"
                      />
                    </div>
                    <div className="text-center">
                      <h3 className="font-medium truncate">{artist.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {artist.followerCount} followers
                      </p>
                      {artist.isVerified && (
                        <Badge variant="secondary" className="mt-1">
                          Verified
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleFavorite(artist, 'artists')}
                      >
                        <Heart
                          className={`h-4 w-4 ${
                            isFavorite(artist, 'artists')
                              ? "fill-red-500 text-red-500"
                              : ""
                          }`}
                        />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => showDetails(artist, 'artist')}>
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <a href={artist.url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="mr-2 h-4 w-4" />
                              Open in JioSaavn
                            </a>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    );
  };

  return (
    <div className="container py-6">
      <div className="flex flex-col space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Music Streaming</h1>
            <p className="text-muted-foreground">
              Powered by JioSaavn • High-quality music streaming and downloads
            </p>
          </div>
        </div>

        {/* Search Section */}
        <div className="flex flex-col space-y-4">
          <form
            onSubmit={handleSearch}
            className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2 w-full"
          >
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search for songs, albums, or artists..."
                className="pl-10 pr-4 w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2 w-full sm:flex-row sm:w-auto">
              <Select value={searchType} onValueChange={(value: any) => setSearchType(value)}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Search type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="songs">Songs</SelectItem>
                  <SelectItem value="albums">Albums</SelectItem>
                  <SelectItem value="artists">Artists</SelectItem>
                </SelectContent>
              </Select>
              <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                {loading ? "Searching..." : "Search"}
              </Button>
              {searchResults && (
                <Button
                  variant="ghost"
                  onClick={clearSearch}
                  className="w-full sm:w-auto"
                >
                  Clear
                </Button>
              )}
            </div>
          </form>

          {error && (
            <div className="p-4 border border-red-200 rounded-md bg-red-50 text-red-700">
              <p className="text-sm">Error: {error}</p>
            </div>
          )}
        </div>

        {/* Results or Favorites */}
        {searchResults ? (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Search Results</h2>
            {renderSearchResults()}
          </div>
        ) : (
          <Tabs defaultValue="favorites" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="favorites">Favorites</TabsTrigger>
              <TabsTrigger value="trending">Trending</TabsTrigger>
              <TabsTrigger value="songs">My Songs</TabsTrigger>
              <TabsTrigger value="albums">My Albums</TabsTrigger>
            </TabsList>

            <TabsContent value="favorites" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Favorite Songs */}
                <div>
                  <h3 className="text-lg font-medium mb-3 flex items-center">
                    <Music className="mr-2 h-5 w-5" />
                    Favorite Songs ({favoriteSongs.length})
                  </h3>
                  <div className="space-y-2">
                    {favoriteSongs.slice(0, 5).map((song) => (
                      <div key={song.id} className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted">
                        <Image
                          src={getHighQualityImage(song.image) || "/placeholder-music.png"}
                          alt={song.name}
                          width={40}
                          height={40}
                          className="rounded object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{song.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{song.primaryArtists}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => playTrack(song)}
                        >
                          <Play className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Favorite Albums */}
                <div>
                  <h3 className="text-lg font-medium mb-3 flex items-center">
                    <Disc className="mr-2 h-5 w-5" />
                    Favorite Albums ({favoriteAlbums.length})
                  </h3>
                  <div className="space-y-2">
                    {favoriteAlbums.slice(0, 5).map((album) => (
                      <div key={album.id} className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted">
                        <Image
                          src={getHighQualityImage(album.image) || "/placeholder-music.png"}
                          alt={album.name}
                          width={40}
                          height={40}
                          className="rounded object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{album.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{album.primaryArtists}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Favorite Artists */}
                <div>
                  <h3 className="text-lg font-medium mb-3 flex items-center">
                    <User className="mr-2 h-5 w-5" />
                    Favorite Artists ({favoriteArtists.length})
                  </h3>
                  <div className="space-y-2">
                    {favoriteArtists.slice(0, 5).map((artist) => (
                      <div key={artist.id} className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted">
                        <Image
                          src={getHighQualityImage(artist.image) || "/placeholder-music.png"}
                          alt={artist.name}
                          width={40}
                          height={40}
                          className="rounded-full object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{artist.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {artist.followerCount} followers
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="trending" className="space-y-4">
              <h3 className="text-lg font-medium">Trending Now</h3>
              {trendingContent ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Trending content will be displayed here</p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Music className="mx-auto h-12 w-12 text-muted-foreground" />
                  <p className="text-muted-foreground mt-2">Loading trending content...</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="songs">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">My Songs ({favoriteSongs.length})</h3>
                {favoriteSongs.length > 0 ? (
                  <div className="space-y-2">
                    {favoriteSongs.map((song) => (
                      <Card key={song.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-4">
                            <Image
                              src={getHighQualityImage(song.image) || "/placeholder-music.png"}
                              alt={song.name}
                              width={60}
                              height={60}
                              className="rounded-md object-cover"
                            />
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium truncate">{song.name}</h3>
                              <p className="text-sm text-muted-foreground truncate">
                                {song.primaryArtists}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {song.album?.name} • {song.year}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => playTrack(song)}
                              >
                                <Play className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => downloadTrack(song)}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleFavorite(song, 'songs')}
                              >
                                <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Music className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-medium">No favorite songs yet</h3>
                    <p className="text-muted-foreground">Search and add songs to your favorites</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="albums">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">My Albums ({favoriteAlbums.length})</h3>
                {favoriteAlbums.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {favoriteAlbums.map((album) => (
                      <Card key={album.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            <div className="relative aspect-square">
                              <Image
                                src={getHighQualityImage(album.image) || "/placeholder-music.png"}
                                alt={album.name}
                                fill
                                className="rounded-md object-cover"
                              />
                            </div>
                            <div>
                              <h3 className="font-medium truncate">{album.name}</h3>
                              <p className="text-sm text-muted-foreground truncate">
                                {album.primaryArtists}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {album.year} • {album.songCount} songs
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleFavorite(album, 'albums')}
                              className="w-full"
                            >
                              <Heart className="h-4 w-4 fill-red-500 text-red-500 mr-2" />
                              Remove from Favorites
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Disc className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-medium">No favorite albums yet</h3>
                    <p className="text-muted-foreground">Search and add albums to your favorites</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}

        {/* Audio Player */}
        {currentTrack && (
          <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 z-50">
            <div className="container">
              <AudioPlayer
                src={currentTrack.url}
                title={currentTrack.title}
                artist={currentTrack.artist}
                image={currentTrack.image}
                onEnded={() => setCurrentTrack(null)}
              />
            </div>
          </div>
        )}

        {/* Details Dialog */}
        <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {detailType === 'song' && 'Song Details'}
                {detailType === 'album' && 'Album Details'}
                {detailType === 'artist' && 'Artist Details'}
              </DialogTitle>
            </DialogHeader>
            {selectedItem && (
              <div className="space-y-4">
                <div className="flex items-start space-x-4">
                  <Image
                    src={getHighQualityImage(selectedItem.image) || "/placeholder-music.png"}
                    alt={selectedItem.name}
                    width={120}
                    height={120}
                    className={`object-cover ${detailType === 'artist' ? 'rounded-full' : 'rounded-md'}`}
                  />
                  <div className="flex-1 space-y-2">
                    <h3 className="text-xl font-bold">{selectedItem.name}</h3>
                    {detailType === 'song' && (
                      <>
                        <p className="text-muted-foreground">by {selectedItem.primaryArtists}</p>
                        <p className="text-sm">Album: {selectedItem.album?.name}</p>
                        <p className="text-sm">Year: {selectedItem.year}</p>
                        <p className="text-sm">Duration: {formatDuration(selectedItem.duration)}</p>
                        <p className="text-sm">Language: {selectedItem.language}</p>
                        {selectedItem.hasLyrics && (
                          <Badge variant="secondary">Has Lyrics</Badge>
                        )}
                      </>
                    )}
                    {detailType === 'album' && (
                      <>
                        <p className="text-muted-foreground">by {selectedItem.primaryArtists}</p>
                        <p className="text-sm">Year: {selectedItem.year}</p>
                        <p className="text-sm">Songs: {selectedItem.songCount}</p>
                      </>
                    )}
                    {detailType === 'artist' && (
                      <>
                        <p className="text-sm">Followers: {selectedItem.followerCount}</p>
                        <p className="text-sm">Language: {selectedItem.dominantLanguage}</p>
                        {selectedItem.isVerified && (
                          <Badge variant="secondary">Verified Artist</Badge>
                        )}
                      </>
                    )}
                  </div>
                </div>
                <div className="flex space-x-2">
                  {detailType === 'song' && (
                    <>
                      <Button onClick={() => playTrack(selectedItem)}>
                        <Play className="mr-2 h-4 w-4" />
                        Play
                      </Button>
                      <Button variant="outline" onClick={() => downloadTrack(selectedItem)}>
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </Button>
                    </>
                  )}
                  <Button variant="outline" asChild>
                    <a href={selectedItem.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Open in JioSaavn
                    </a>
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

// Helper functions for Firestore operations
async function fetchFavorites(userId: string, type: string) {
  try {
    const snapshot = await getDocs(collection(db, `users/${userId}/favorites/${type}/items`));
    return snapshot.docs.map(doc => ({ ...doc.data(), isFavorite: true }));
  } catch (error) {
    console.error(`Error fetching ${type} favorites:`, error);
    return [];
  }
}

async function addFavorite(userId: string, type: string, item: any) {
  const docRef = doc(db, `users/${userId}/favorites/${type}/items`, item.id);
  await setDoc(docRef, { ...item, isFavorite: true });
}

async function removeFavorite(userId: string, type: string, itemId: string) {
  const docRef = doc(db, `users/${userId}/favorites/${type}/items`, itemId);
  await deleteDoc(docRef);
}
