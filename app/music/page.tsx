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
import { useMusicAPI } from "@/hooks/use-music-api";
import { AudioPlayer } from "@/components/audio-player";
import { SpotifyFolder } from "@/components/spotify-folder";

// Types for MusicBrainz data
type Artist = {
  id: string;
  name: string;
  type?: string;
  country?: string;
  tags?: string[];
  image?: string;
  isFavorite?: boolean;
};

type Release = {
  id: string;
  title: string;
  artistName: string;
  artistId: string;
  date?: string;
  type?: string;
  coverArt?: string;
  tracks?: number;
  isFavorite?: boolean;
  tags?: string[];
};

type Track = {
  id: string;
  title: string;
  artistName: string;
  artistId: string;
  releaseId?: string;
  releaseName?: string;
  duration?: string;
  position?: string;
  isFavorite?: boolean;
  type: "track";
  tags?: string[];
  preview_url?: string;
  spotify_id?: string;
};

// Tags for filtering
const allTags = [
  "rock",
  "pop",
  "electronic",
  "jazz",
  "hip hop",
  "classical",
  "metal",
  "folk",
  "indie",
  "alternative",
  "r&b",
  "soul",
  "blues",
  "country",
  "reggae",
  "punk",
  "ambient",
  "experimental",
  "dance",
  "funk",
];

export default function MusicPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState("all");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showTagDialog, setShowTagDialog] = useState(false);

  // State for favorites
  const [favoriteArtists, setFavoriteArtists] = useState<Artist[]>([]);
  const [favoriteReleases, setFavoriteReleases] = useState<Release[]>([]);
  const [favoriteTracks, setFavoriteTracks] = useState<Track[]>([]);

  // State for music preview
  const [currentPreview, setCurrentPreview] = useState<{
    url: string;
    trackName: string;
    artistName: string;
  } | null>(null);

  // MusicAPI hook
  const {
    isLoading: isMusicAPILoading,
    error: musicAPIError,
    searchSpotify,
    getTrackPreview,
  } = useMusicAPI();

  const user = useCurrentUser();
  const userId = user?.uid;

  useEffect(() => {
    if (!userId) return;

    async function loadFavorites() {
      if (userId) {
        setFavoriteArtists(await fetchFavorites(userId, "artist"));
        setFavoriteReleases(await fetchFavorites(userId, "release"));
        setFavoriteTracks(await fetchFavorites(userId, "track"));
      }
    }
    loadFavorites();
  }, [userId]);

  // Selected item for details view
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [detailType, setDetailType] = useState<string>("");

  // Handle search
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    const query = searchQuery.trim();

    try {
      let results: (Artist | Release | Track)[] = [];

      // Helper function to map MusicBrainz artist to your Artist type
      const mapArtist = (mbArtist: any): Artist => ({
        id: mbArtist.id,
        name: mbArtist.name,
        type: mbArtist.type || "artist",
        country: mbArtist.country,
        tags: mbArtist.tags?.map((t: any) => t.name) || [],
        isFavorite: false,
      });

      // Helper function to map MusicBrainz release to your Release type
      const mapRelease = (mbRelease: any): Release => ({
        id: mbRelease.id,
        title: mbRelease.title,
        artistName: mbRelease["artist-credit"]?.[0]?.name || "",
        artistId: mbRelease["artist-credit"]?.[0]?.artist?.id || "",
        date: mbRelease.date,
        type: mbRelease.type || "release",
        isFavorite: false,
      });

      // Helper function to map MusicBrainz recording (track) to your Track type
      const mapTrack = (mbTrack: any): Track => ({
        id: mbTrack.id,
        title: mbTrack.title,
        artistName: mbTrack["artist-credit"]?.[0]?.name || "",
        artistId: mbTrack["artist-credit"]?.[0]?.artist?.id || "",
        releaseId: mbTrack.releases?.[0]?.id,
        releaseName: mbTrack.releases?.[0]?.title,
        duration: mbTrack.length
          ? formatDuration(mbTrack.length / 1000)
          : undefined,
        position: undefined,
        isFavorite: false,
        type: "track",
      });

      // Fetch artists if requested
      if (searchType === "all" || searchType === "artist") {
        const artistResp = await fetch(
          `https://musicbrainz.org/ws/2/artist/?query=${encodeURIComponent(
            query
          )}&fmt=json&limit=10`
        );
        const artistData = await artistResp.json();
        const artistResults = artistData.artists?.map(mapArtist) || [];
        results = [...results, ...artistResults];
      }

      // Fetch releases if requested
      if (searchType === "all" || searchType === "release") {
        const releaseResp = await fetch(
          `https://musicbrainz.org/ws/2/release/?query=${encodeURIComponent(
            query
          )}&fmt=json&limit=10`
        );
        const releaseData = await releaseResp.json();
        const releaseResults = releaseData.releases?.map(mapRelease) || [];
        results = [...results, ...releaseResults];
      }

      // Fetch tracks (recordings) if requested
      if (searchType === "all" || searchType === "track") {
        const trackResp = await fetch(
          `https://musicbrainz.org/ws/2/recording/?query=${encodeURIComponent(
            query
          )}&fmt=json&limit=10`
        );
        const trackData = await trackResp.json();
        const trackResults = trackData.recordings?.map(mapTrack) || [];

        // Try to find Spotify previews for tracks
        if (trackResults.length > 0) {
          try {
            const spotifyResults = await searchSpotify(query, "track");
            if (
              spotifyResults &&
              spotifyResults.tracks &&
              spotifyResults.tracks.items
            ) {
              // Match Spotify tracks with MusicBrainz tracks by name and artist
              trackResults.forEach(
                (track: {
                  title: string;
                  artistName: string;
                  preview_url: any;
                  spotify_id: any;
                }) => {
                  const spotifyTrack = spotifyResults.tracks.items.find(
                    (st: any) =>
                      st.name.toLowerCase() === track.title.toLowerCase() &&
                      st.artists.some(
                        (a: any) =>
                          a.name.toLowerCase() ===
                          track.artistName.toLowerCase()
                      )
                  );

                  if (spotifyTrack) {
                    track.preview_url = spotifyTrack.preview_url;
                    track.spotify_id = spotifyTrack.id;
                  }
                }
              );
            }
          } catch (error) {
            console.error("Error fetching Spotify data:", error);
          }
        }

        results = [...results, ...trackResults];
      }

      // Filter by tags if selected
      if (selectedTags.length > 0) {
        results = results.filter((item) => {
          if ("tags" in item && item.tags) {
            return item.tags.some((tag) => selectedTags.includes(tag));
          }
          return true;
        });
      }

      setSearchResults(results);
    } catch (error) {
      console.error("MusicBrainz API error:", error);
      setSearchResults([]);
    }
  };

  // Format duration (seconds to MM:SS)
  const formatDuration = (seconds: number) => {
    if (isNaN(seconds)) return "0:00";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const clearSearch = () => {
    setSearchQuery("");
    setIsSearching(false);
    setSearchResults([]);
  };

  // Toggle favorite status
  const toggleFavorite = async (item: any, itemType: string) => {
    if (!userId) {
      alert("Login required");
      return;
    }

    if (!userId) return;

    const isFavorite = {
      artist: favoriteArtists.some((a) => a.id === item.id),
      release: favoriteReleases.some((r) => r.id === item.id),
      track: favoriteTracks.some((t) => t.id === item.id),
    }[itemType];

    try {
      if (isFavorite) {
        await removeFavorite(userId, itemType as any, item.id);
      } else {
        await addFavorite(userId, itemType as any, item);
      }
      // Refresh favorites from Firestore
      const updatedFavorites = await fetchFavorites(userId, itemType as any);
      if (itemType === "artist")
        setFavoriteArtists(updatedFavorites as Artist[]);
      if (itemType === "release")
        setFavoriteReleases(updatedFavorites as Release[]);
      if (itemType === "track") setFavoriteTracks(updatedFavorites as Track[]);
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
    }

    // Update searchResults if relevant
    setSearchResults((prev) =>
      prev.map((result) =>
        result.id === item.id && result.type === itemType
          ? { ...result, isFavorite: !isFavorite }
          : result
      )
    );
  };

  // Show details for an item
  const showDetails = (item: any, type: string) => {
    setSelectedItem(item);
    setDetailType(type);
  };

  // Toggle tag selection
  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  // Play track preview
  const playTrackPreview = async (track: Track) => {
    if (currentPreview?.url && currentPreview.trackName === track.title) {
      return;
    }

    // First, try to get a preview URL from Spotify via MusicAPI
    if (track.spotify_id) {
      const previewData = await getTrackPreview(track.spotify_id);
      if (previewData && previewData.preview_url) {
        setCurrentPreview({
          url: previewData.preview_url,
          trackName: track.title,
          artistName: track.artistName,
        });
        return;
      }
    }
    // Fallback or if no spotify_id, you can search
    const results = await searchSpotify(`${track.title} ${track.artistName}`);
    if (results && results.tracks?.items?.[0]?.preview_url) {
      setCurrentPreview({
        url: results.tracks.items[0].preview_url,
        trackName: track.title,
        artistName: track.artistName,
      });
    } else {
      // Handle no preview found
      alert("No preview available for this track.");
      setCurrentPreview(null);
    }
  };

  return (
    <div className="container py-6">
      <div className="flex flex-col space-y-6">
        {/* Search Section */}
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Music Database</h1>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTagDialog(true)}
            >
              <Filter className="mr-2 h-4 w-4" />
              Filter by Tags
              {selectedTags.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {selectedTags.length}
                </Badge>
              )}
            </Button>
          </div>

          <form
            onSubmit={handleSearch}
            className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2 w-full"
          >
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search for artists, albums, or tracks"
                className="pl-10 pr-4 w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2 w-full sm:flex-row sm:w-auto">
              <Select value={searchType} onValueChange={setSearchType}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Search type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="artist">Artists</SelectItem>
                  <SelectItem value="release">Albums</SelectItem>
                  <SelectItem value="track">Tracks</SelectItem>
                </SelectContent>
              </Select>
              <Button type="submit" className="w-full sm:w-auto">
                Search
              </Button>
              {isSearching && (
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

          {selectedTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedTags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="flex items-center gap-1"
                >
                  {tag}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() =>
                      setSelectedTags(selectedTags.filter((t) => t !== tag))
                    }
                  />
                </Badge>
              ))}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedTags([])}
              >
                Clear All
              </Button>
            </div>
          )}
        </div>

        {/* Tag Filter Dialog */}
        <Dialog open={showTagDialog} onOpenChange={setShowTagDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Filter by Tags</DialogTitle>
              <DialogDescription>
                Select tags to filter your search results
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-wrap gap-2 py-4">
              {allTags.map((tag) => (
                <Badge
                  key={tag}
                  variant={selectedTags.includes(tag) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                </Badge>
              ))}
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setSelectedTags([])}>
                Clear All
              </Button>
              <Button onClick={() => setShowTagDialog(false)}>
                Apply Filters
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Music Player (if a track is playing) */}
        {currentPreview && (
          <div className="mb-4">
            <AudioPlayer
              previewUrl={currentPreview.url}
              trackName={currentPreview.trackName}
              artistName={currentPreview.artistName}
              onEnded={() => setCurrentPreview(null)}
            />
          </div>
        )}

        {/* Main Content */}
        {isSearching ? (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">
              Search Results for "{searchQuery}"
            </h2>
            {searchResults.length === 0 ? (
              <div className="text-center py-12">
                <Music className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No results found</h3>
                <p className="text-muted-foreground mb-4">
                  Try a different search term or filter
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {searchResults.map((result) => (
                  <Card
                    key={`${result.type}-${result.id}`}
                    className="overflow-hidden"
                  >
                    <CardContent className="p-0">
                      <div className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium line-clamp-1">
                              {result.name || result.title}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {result.type === "artist"
                                ? result.type
                                : result.type === "release"
                                ? `${result.type} by ${result.artistName}`
                                : `Track by ${result.artistName}`}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            {result.type === "track" && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                disabled={
                                  !result.preview_url && !result.spotify_id
                                }
                                onClick={() => playTrackPreview(result)}
                              >
                                <Play className="h-5 w-5" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() =>
                                toggleFavorite(result, result.type)
                              }
                            >
                              <Heart
                                className={`h-5 w-5 ${
                                  result.isFavorite
                                    ? "fill-primary text-primary"
                                    : ""
                                }`}
                              />
                            </Button>
                          </div>
                        </div>
                        {result.type === "artist" && result.tags && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {result.tags.slice(0, 3).map((tag: string) => (
                              <Badge
                                key={tag}
                                variant="secondary"
                                className="text-xs"
                              >
                                {tag}
                              </Badge>
                            ))}
                            {result.tags.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{result.tags.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        ) : (
          <Tabs defaultValue="artists">
            <TabsList className="mb-4">
              <TabsTrigger value="artists">Favorite Artists</TabsTrigger>
              <TabsTrigger value="releases">Favorite Albums</TabsTrigger>
              <TabsTrigger value="tracks">Favorite Tracks</TabsTrigger>
              <TabsTrigger value="spotify">Spotify Library</TabsTrigger>
            </TabsList>

            <TabsContent value="artists" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Your Favorite Artists</h2>
              </div>

              {favoriteArtists.length === 0 ? (
                <div className="text-center py-12">
                  <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">
                    No favorite artists yet
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Search for artists and add them to your favorites
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {favoriteArtists.map((artist) => (
                    <Card key={artist.id} className="overflow-hidden">
                      <CardContent className="p-0">
                        <div className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium">{artist.name}</h3>
                              <p className="text-sm text-muted-foreground flex items-center gap-1">
                                <Globe className="h-3 w-3" />{" "}
                                {artist.country || "Unknown"}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => toggleFavorite(artist, "artist")}
                            >
                              <Heart className="h-5 w-5 fill-primary text-primary" />
                            </Button>
                          </div>
                          {artist.tags && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {artist.tags.map((tag) => (
                                <Badge
                                  key={tag}
                                  variant="secondary"
                                  className="text-xs"
                                >
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="releases" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Your Favorite Albums</h2>
              </div>

              {favoriteReleases.length === 0 ? (
                <div className="text-center py-12">
                  <Disc className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">
                    No favorite albums yet
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Search for albums and add them to your favorites
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {favoriteReleases.map((release) => (
                    <Card key={release.id} className="overflow-hidden">
                      <CardContent className="p-0">
                        <div className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium line-clamp-1">
                                {release.title}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {release.artistName}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => toggleFavorite(release, "release")}
                            >
                              <Heart className="h-5 w-5 fill-primary text-primary" />
                            </Button>
                          </div>
                          <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>{release.date || "Unknown date"}</span>
                            <Separator orientation="vertical" className="h-3" />
                            <Disc className="h-3 w-3" />
                            <span>{release.tracks || "?"} tracks</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="tracks" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Your Favorite Tracks</h2>
              </div>

              {favoriteTracks.length === 0 ? (
                <div className="text-center py-12">
                  <Music className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">
                    No favorite tracks yet
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Search for tracks and add them to your favorites
                  </p>
                </div>
              ) : (
                <div className="border rounded-md">
                  <div className="grid grid-cols-12 p-3 text-sm font-medium text-muted-foreground border-b">
                    <div className="col-span-5 md:col-span-5">Title</div>
                    <div className="col-span-4 md:col-span-3">Artist</div>
                    <div className="col-span-2 md:col-span-2">Album</div>
                    <div className="hidden md:block md:col-span-1">
                      <Clock className="h-4 w-4" />
                    </div>
                    <div className="col-span-1 md:col-span-1"></div>
                  </div>
                  {favoriteTracks.map((track) => (
                    <div
                      key={track.id}
                      className="grid grid-cols-12 items-center p-2 hover:bg-accent/50 rounded-md transition-colors"
                    >
                      <div className="col-span-5 md:col-span-5 flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          disabled={!track.preview_url && !track.spotify_id}
                          onClick={() => playTrackPreview(track)}
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                        <div
                          className="font-medium cursor-pointer"
                          onClick={() => showDetails(track, "track")}
                        >
                          {track.title}
                        </div>
                      </div>
                      <div className="col-span-4 md:col-span-3 text-muted-foreground truncate">
                        {track.artistName}
                      </div>
                      <div className="col-span-2 md:col-span-2 text-muted-foreground truncate">
                        {track.releaseName}
                      </div>
                      <div className="hidden md:block md:col-span-1 text-muted-foreground">
                        {track.duration}
                      </div>
                      <div className="col-span-1 md:col-span-1 flex justify-end">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => showDetails(track, "track")}
                            >
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => toggleFavorite(track, "track")}
                            >
                              Remove from Favorites
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="spotify" className="space-y-6">
              <SpotifyFolder />
            </TabsContent>
          </Tabs>
        )}

        {/* Details Dialog */}
        {selectedItem && (
          <Dialog
            open={!!selectedItem}
            onOpenChange={(open) => !open && setSelectedItem(null)}
          >
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {detailType === "artist"
                    ? selectedItem.name
                    : detailType === "release"
                    ? selectedItem.title
                    : selectedItem.title}
                </DialogTitle>
                <DialogDescription>
                  {detailType === "artist"
                    ? `Artist from ${selectedItem.country || "Unknown"}`
                    : detailType === "release"
                    ? `Album by ${selectedItem.artistName}`
                    : `Track by ${selectedItem.artistName}`}
                </DialogDescription>
              </DialogHeader>

              <div className="flex flex-col md:flex-row gap-4 py-4">
                <div className="relative w-full md:w-1/3 aspect-square">
                  <Image
                    src={
                      detailType === "artist"
                        ? selectedItem.image || "/placeholder.svg"
                        : detailType === "release"
                        ? selectedItem.coverArt || "/placeholder.svg"
                        : "/placeholder.svg?height=300&width=300"
                    }
                    alt={selectedItem.name || selectedItem.title}
                    fill
                    className="object-cover rounded-md"
                  />
                </div>
                <div className="flex-1 space-y-3">
                  {detailType === "artist" && (
                    <>
                      <div>
                        <h4 className="text-sm font-medium">Type</h4>
                        <p>{selectedItem.type || "Unknown"}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium">Country</h4>
                        <p>{selectedItem.country || "Unknown"}</p>
                      </div>
                      {selectedItem.tags && (
                        <div>
                          <h4 className="text-sm font-medium">Tags</h4>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {selectedItem.tags.map((tag: string) => (
                              <Badge key={tag} variant="secondary">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {detailType === "release" && (
                    <>
                      <div>
                        <h4 className="text-sm font-medium">Artist</h4>
                        <p>{selectedItem.artistName}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium">Release Date</h4>
                        <p>{selectedItem.date || "Unknown"}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium">Type</h4>
                        <p>{selectedItem.type || "Unknown"}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium">Tracks</h4>
                        <p>{selectedItem.tracks || "Unknown"}</p>
                      </div>
                    </>
                  )}

                  {detailType === "track" && (
                    <>
                      <div>
                        <h4 className="text-sm font-medium">Artist</h4>
                        <p>{selectedItem.artistName}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium">Album</h4>
                        <p>{selectedItem.releaseName || "Unknown"}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium">Duration</h4>
                        <p>{selectedItem.duration || "Unknown"}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium">Position</h4>
                        <p>{selectedItem.position || "Unknown"}</p>
                      </div>
                      {selectedItem.preview_url && (
                        <div>
                          <h4 className="text-sm font-medium">Preview</h4>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-1"
                            onClick={() => playTrackPreview(selectedItem)}
                          >
                            <Play className="h-4 w-4 mr-2" /> Play Preview
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div className="flex justify-between">
                <Button
                  variant={selectedItem.isFavorite ? "default" : "outline"}
                  onClick={() => toggleFavorite(selectedItem, detailType)}
                  className="flex items-center gap-2"
                >
                  {selectedItem.isFavorite ? (
                    <>
                      <Heart className="h-4 w-4 fill-primary-foreground" />{" "}
                      Remove from Favorites
                    </>
                  ) : (
                    <>
                      <Heart className="h-4 w-4" /> Add to Favorites
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={() => setSelectedItem(null)}>
                  Close
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}

async function fetchFavorites<T>(
  userId: string,
  type: "artist" | "release" | "track"
): Promise<T[]> {
  const colRef = collection(
    db,
    "users",
    userId,
    `favorite${capitalize(type)}s`
  );
  const snapshot = await getDocs(colRef);

  // Map and cast to T[], you can do minimal validation here if you want
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    // Optional: add id from doc.id if needed, e.g. data.id = parseInt(doc.id)
    return data as T;
  });
}

// Add favorite
async function addFavorite(
  userId: string,
  type: "artist" | "release" | "track",
  item: any
) {
  const docRef = doc(
    db,
    "users",
    userId,
    `favorite${capitalize(type)}s`,
    item.id.toString()
  );
  await setDoc(docRef, item);
}

// Remove favorite
async function removeFavorite(
  userId: string,
  type: "artist" | "release" | "track",
  itemId: number
) {
  const docRef = doc(
    db,
    "users",
    userId,
    `favorite${capitalize(type)}s`,
    itemId.toString()
  );
  await deleteDoc(docRef);
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
