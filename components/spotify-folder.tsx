"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Music,
  Play,
  Heart,
  Search,
  User,
  Disc,
  Clock,
  ExternalLink,
  Plus,
  FolderOpen,
  RefreshCw,
  Loader2,
  X,
} from "lucide-react";
import { useMusicAPI } from "@/hooks/use-music-api";
import { AudioPlayer } from "@/components/audio-player";
import { signIn, signOut } from "next-auth/react";

interface SpotifyTrack {
  id: string;
  name: string;
  artists: { name: string; id: string }[];
  album: { name: string; images: { url: string }[] };
  duration_ms: number;
  preview_url: string | null;
  external_urls: { spotify: string };
  uri: string;
}

interface SpotifyPlaylist {
  id: string;
  name: string;
  images: { url: string }[];
  tracks: { total: number };
  external_urls: { spotify: string };
  owner: { display_name: string };
}

interface SpotifyArtist {
  id: string;
  name: string;
  images: { url: string }[];
  followers: { total: number };
  genres: string[];
  external_urls: { spotify: string };
}

interface SpotifyFolderProps {
  // userId is not needed as we use NextAuth session
}

export function SpotifyFolder() {
  const { data: session, status } = useSession();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SpotifyTrack[]>([]);
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<string | null>(null);
  const [playlistTracks, setPlaylistTracks] = useState<SpotifyTrack[]>([]);
  const [currentTrack, setCurrentTrack] = useState<SpotifyTrack | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState("search");

  // New state for additional Spotify data
  const [topArtists, setTopArtists] = useState<any[]>([]);
  const [topTracks, setTopTracks] = useState<any[]>([]);
  const [savedAlbums, setSavedAlbums] = useState<any[]>([]);
  const [savedTracks, setSavedTracks] = useState<any[]>([]);
  const [recentlyPlayed, setRecentlyPlayed] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);

  const {
    isLoading,
    error,
    searchSpotify,
    getUserPlaylists,
    getPlaylistTracks,
    addToPlaylist,
    removeFromPlaylist,
    getTopArtists,
    getTopTracks,
    getSavedAlbums,
    getSavedTracks,
    getRecentlyPlayed,
    getUserProfile,
  } = useMusicAPI();

  // Load user playlists when session is available
  useEffect(() => {
    if (session?.accessToken) {
      loadPlaylists();
      loadUserData();
    }
  }, [session]);

  // Load playlist tracks when a playlist is selected
  useEffect(() => {
    if (selectedPlaylist && session?.accessToken) {
      loadPlaylistTracks();
    }
  }, [selectedPlaylist, session]);

  // Load all user data
  const loadUserData = async () => {
    if (!session?.accessToken) return;
    const token = session.accessToken;

    try {
      // Load user profile
      const profileData = await getUserProfile(token);
      if (profileData) {
        setUserProfile(profileData);
      }

      // Load top artists
      const artistsData = await getTopArtists(token);
      if (artistsData && artistsData.items) {
        setTopArtists(artistsData.items);
      }

      // Load top tracks
      const tracksData = await getTopTracks(token);
      if (tracksData && tracksData.items) {
        setTopTracks(tracksData.items);
      }

      // Load saved albums
      const albumsData = await getSavedAlbums(token);
      if (albumsData && albumsData.items) {
        setSavedAlbums(albumsData.items);
      }

      // Load saved tracks
      const savedTracksData = await getSavedTracks(token);
      if (savedTracksData && savedTracksData.items) {
        setSavedTracks(savedTracksData.items);
      }

      // Load recently played
      const recentData = await getRecentlyPlayed(token);
      if (recentData && recentData.items) {
        setRecentlyPlayed(recentData.items);
      }
    } catch (err) {
      console.error("Error loading user data:", err);
    }
  };

  // Load playlists
  const loadPlaylists = async () => {
    if (!session?.accessToken) return;

    try {
      const data = await getUserPlaylists(session.accessToken);
      if (data && data.items) {
        setPlaylists(data.items);
        // Select first playlist by default if none selected
        if (!selectedPlaylist && data.items.length > 0) {
          setSelectedPlaylist(data.items[0].id);
        }
      }
    } catch (err) {
      console.error("Error loading playlists:", err);
    }
  };

  // Load tracks for selected playlist
  const loadPlaylistTracks = async () => {
    if (!selectedPlaylist || !session?.accessToken) return;

    try {
      const data = await getPlaylistTracks(
        session.accessToken,
        selectedPlaylist
      );
      if (data && data.items) {
        // Extract track data from playlist items
        const tracks = data.items
          .map((item: any) => item.track)
          .filter(Boolean);
        setPlaylistTracks(tracks);
      }
    } catch (err) {
      console.error("Error loading playlist tracks:", err);
    }
  };

  // Search Spotify tracks
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || !session?.accessToken) return;

    setIsSearching(true);
    try {
      const results = await searchSpotify(searchQuery.trim(), "track");
      if (results && results.tracks && results.tracks.items) {
        setSearchResults(results.tracks.items);
      }
    } catch (err) {
      console.error("Error searching Spotify:", err);
    } finally {
      setIsSearching(false);
    }
  };

  // Add track to playlist
  const handleAddToPlaylist = async (trackId: string) => {
    if (!selectedPlaylist || !session?.accessToken) return;

    try {
      await addToPlaylist(session.accessToken, selectedPlaylist, trackId);
      // Refresh playlist tracks
      loadPlaylistTracks();
    } catch (err) {
      console.error("Error adding track to playlist:", err);
    }
  };

  // Remove track from playlist
  const handleRemoveFromPlaylist = async (trackId: string) => {
    if (!selectedPlaylist || !session?.accessToken) return;

    try {
      await removeFromPlaylist(session.accessToken, selectedPlaylist, trackId);
      // Refresh playlist tracks
      loadPlaylistTracks();
      // If current track is removed, clear it
      if (currentTrack && currentTrack.id === trackId) {
        setCurrentTrack(null);
      }
    } catch (err) {
      console.error("Error removing track from playlist:", err);
    }
  };

  // Play track preview
  const playTrack = (track: SpotifyTrack) => {
    if (track.preview_url) {
      setCurrentTrack(track);
    }
  };

  // Format duration (milliseconds to MM:SS)
  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return `${minutes}:${parseInt(seconds) < 10 ? "0" : ""}${seconds}`;
  };

  const handleLogin = async () => {
    await signOut({ redirect: false });
    signIn("spotify");
  };

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="text-center p-8 border rounded-lg bg-card text-card-foreground">
        <h2 className="text-xl font-semibold mb-2">Connect your Spotify</h2>
        <p className="text-muted-foreground mb-4">
          Sign in to view your playlists, top artists, and more.
        </p>
        <Button onClick={handleLogin}>Connect to Spotify</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {userProfile && (
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-4">
            <img
              src={userProfile.images?.[0]?.url || "/placeholder-user.jpg"}
              alt={userProfile.display_name}
              className="h-12 w-12 rounded-full"
            />
            <div>
              <p className="text-sm text-muted-foreground">Logged in as</p>
              <h3 className="font-semibold">{userProfile.display_name}</h3>
            </div>
          </div>
          <Button variant="destructive" size="sm" onClick={() => signOut()}>
            Disconnect
          </Button>
        </div>
      )}

      {currentTrack && currentTrack.preview_url && (
        <AudioPlayer
          key={currentTrack.id}
          previewUrl={currentTrack.preview_url}
          trackName={currentTrack.name}
          artistName={currentTrack.artists.map((a) => a.name).join(", ")}
          onEnded={() => setCurrentTrack(null)}
        />
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="search">Search</TabsTrigger>
          <TabsTrigger value="playlists">Playlists</TabsTrigger>
          <TabsTrigger value="library">Library</TabsTrigger>
          <TabsTrigger value="charts">Top Charts</TabsTrigger>
          <TabsTrigger value="recent">Recently Played</TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="mt-6">
          <Card>
            <CardHeader>
              <form onSubmit={handleSearch} className="flex gap-2">
                <Input
                  placeholder="Search for a track..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
              </form>
            </CardHeader>
            <CardContent>
              {isSearching ? (
                <div className="text-center">
                  <p>Searching...</p>
                </div>
              ) : searchResults.length > 0 ? (
                <TrackList
                  tracks={searchResults}
                  onPlay={playTrack}
                  onAddToPlaylist={
                    selectedPlaylist ? handleAddToPlaylist : undefined
                  }
                />
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Music className="h-12 w-12 mx-auto mb-4" />
                  <p>Search for tracks to add to your playlists.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="playlists" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-1">
              <h3 className="text-lg font-semibold mb-4">Your Playlists</h3>
              <ScrollArea className="h-96 pr-4">
                <div className="space-y-2">
                  {playlists.map((p) => (
                    <div
                      key={p.id}
                      className={`p-3 rounded-md cursor-pointer transition-colors ${
                        selectedPlaylist === p.id
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-accent"
                      }`}
                      onClick={() => setSelectedPlaylist(p.id)}
                    >
                      <p className="font-medium truncate">{p.name}</p>
                      <p
                        className={`text-sm truncate ${
                          selectedPlaylist === p.id
                            ? "text-primary-foreground/80"
                            : "text-muted-foreground"
                        }`}
                      >
                        {p.tracks.total} tracks
                      </p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
            <div className="md:col-span-3">
              <h3 className="text-lg font-semibold mb-4">
                {playlists.find((p) => p.id === selectedPlaylist)?.name ||
                  "Select a playlist"}
              </h3>
              {isLoading && !playlistTracks.length ? (
                <div className="text-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : playlistTracks.length > 0 ? (
                <TrackList
                  tracks={playlistTracks}
                  onPlay={playTrack}
                  onRemoveFromPlaylist={handleRemoveFromPlaylist}
                />
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <FolderOpen className="h-12 w-12 mx-auto mb-4" />
                  <p>This playlist is empty or could not be loaded.</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="library" className="mt-6">
          <div className="space-y-8">
            <div>
              <h3 className="text-xl font-semibold mb-4">Saved Albums</h3>
              {savedAlbums.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {savedAlbums.map(({ album }) => (
                    <AlbumCard key={album.id} album={album} />
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No saved albums.</p>
              )}
            </div>
            <Separator />
            <div>
              <h3 className="text-xl font-semibold mb-4">Saved Tracks</h3>
              {savedTracks.length > 0 ? (
                <TrackList
                  tracks={savedTracks.map((t: any) => t.track)}
                  onPlay={playTrack}
                />
              ) : (
                <p className="text-muted-foreground">No saved tracks.</p>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="charts" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold mb-4">Your Top Artists</h3>
              {topArtists.length > 0 ? (
                <div className="space-y-4">
                  {topArtists.map((artist) => (
                    <ArtistCard key={artist.id} artist={artist} />
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No top artists data.</p>
              )}
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-4">Your Top Tracks</h3>
              {topTracks.length > 0 ? (
                <TrackList tracks={topTracks} onPlay={playTrack} />
              ) : (
                <p className="text-muted-foreground">No top tracks data.</p>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="recent" className="mt-6">
          <h3 className="text-xl font-semibold mb-4">Recently Played Tracks</h3>
          {recentlyPlayed.length > 0 ? (
            <TrackList
              tracks={recentlyPlayed.map((item: any) => item.track)}
              onPlay={playTrack}
            />
          ) : (
            <p className="text-muted-foreground">No recently played tracks.</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Reusable TrackList component
function TrackList({
  tracks,
  onPlay,
  onAddToPlaylist,
  onRemoveFromPlaylist,
}: {
  tracks: SpotifyTrack[];
  onPlay: (track: SpotifyTrack) => void;
  onAddToPlaylist?: (trackId: string) => void;
  onRemoveFromPlaylist?: (trackId: string) => void;
}) {
  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return `${minutes}:${parseInt(seconds) < 10 ? "0" : ""}${seconds}`;
  };

  return (
    <ScrollArea className="h-96">
      <div className="space-y-1 pr-4">
        {tracks.map((track) => (
          <div
            key={track.id}
            className="flex items-center gap-4 p-2 rounded-md hover:bg-accent"
          >
            <div className="flex-1 flex items-center gap-4">
              <img
                src={track.album?.images?.[0]?.url || "/placeholder.svg"}
                alt={track.album?.name}
                className="h-10 w-10 rounded-md"
              />
              <div className="flex-1 truncate">
                <p className="font-medium truncate">{track.name}</p>
                <p className="text-sm text-muted-foreground truncate">
                  {track.artists.map((a) => a.name).join(", ")}
                </p>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              {formatDuration(track.duration_ms)}
            </div>
            <div className="flex items-center gap-1">
              {onAddToPlaylist && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onAddToPlaylist(track.uri)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              )}
              {onRemoveFromPlaylist && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onRemoveFromPlaylist(track.uri)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                disabled={!track.preview_url}
                onClick={() => onPlay(track)}
              >
                <Play className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

// Reusable ArtistCard component
function ArtistCard({ artist }: { artist: SpotifyArtist }) {
  return (
    <a
      href={artist.external_urls.spotify}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-4 p-2 rounded-md hover:bg-accent transition-colors"
    >
      <img
        src={artist.images?.[0]?.url || "/placeholder-user.jpg"}
        alt={artist.name}
        className="h-12 w-12 rounded-full"
      />
      <div className="flex-1 truncate">
        <p className="font-semibold truncate">{artist.name}</p>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{artist.followers.total.toLocaleString()} followers</span>
          {artist.genres.length > 0 && (
            <>
              <Separator orientation="vertical" className="h-4" />
              <div className="truncate">
                {artist.genres.slice(0, 2).join(", ")}
              </div>
            </>
          )}
        </div>
      </div>
      <ExternalLink className="h-4 w-4 text-muted-foreground" />
    </a>
  );
}

// Reusable AlbumCard component
function AlbumCard({ album }: { album: any }) {
  return (
    <a
      href={album.external_urls.spotify}
      target="_blank"
      rel="noopener noreferrer"
      className="space-y-2"
    >
      <div className="aspect-square relative">
        <img
          src={album.images?.[0]?.url || "/placeholder.svg"}
          alt={album.name}
          className="object-cover w-full h-full rounded-md"
        />
      </div>
      <div>
        <p className="font-semibold truncate">{album.name}</p>
        <p className="text-sm text-muted-foreground truncate">
          {album.artists.map((a: any) => a.name).join(", ")}
        </p>
      </div>
    </a>
  );
}
