"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Music, Trash2, RefreshCw } from "lucide-react"
import { useMusicAPI } from "@/hooks/use-music-api"
import { AudioPlayer } from "@/components/audio-player"

interface SpotifyPlaylistsProps {
  userId: string
}

interface Playlist {
  id: string
  name: string
  images: { url: string }[]
  tracks: { total: number }
}

interface PlaylistTrack {
  id: string
  name: string
  artists: { name: string }[]
  album: { name: string }
  duration_ms: number
  preview_url: string | null
}

export function SpotifyPlaylists({ userId }: SpotifyPlaylistsProps) {
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [selectedPlaylist, setSelectedPlaylist] = useState<string | null>(null)
  const [playlistTracks, setPlaylistTracks] = useState<PlaylistTrack[]>([])
  const [currentTrack, setCurrentTrack] = useState<PlaylistTrack | null>(null)
  const { isLoading, error, getUserPlaylists, getPlaylistTracks, addToPlaylist, removeFromPlaylist } = useMusicAPI()

  // Load user playlists
  useEffect(() => {
    if (userId) {
      loadPlaylists()
    }
  }, [userId])

  // Load playlist tracks when a playlist is selected
  useEffect(() => {
    if (selectedPlaylist && userId) {
      loadPlaylistTracks()
    }
  }, [selectedPlaylist])

  // Load playlists
  const loadPlaylists = async () => {
    try {
      const data = await getUserPlaylists(userId)
      if (data && data.items) {
        setPlaylists(data.items)
        // Select first playlist by default if none selected
        if (!selectedPlaylist && data.items.length > 0) {
          setSelectedPlaylist(data.items[0].id)
        }
      }
    } catch (err) {
      console.error("Error loading playlists:", err)
    }
  }

  // Load tracks for selected playlist
  const loadPlaylistTracks = async () => {
    if (!selectedPlaylist) return

    try {
      const data = await getPlaylistTracks(userId, selectedPlaylist)
      if (data && data.items) {
        // Extract track data from playlist items
        const tracks = data.items.map((item: any) => item.track).filter(Boolean)
        setPlaylistTracks(tracks)
      }
    } catch (err) {
      console.error("Error loading playlist tracks:", err)
    }
  }

  // Add track to playlist
  const handleAddToPlaylist = async (trackId: string) => {
    if (!selectedPlaylist) return

    try {
      await addToPlaylist(userId, selectedPlaylist, trackId)
      // Refresh playlist tracks
      loadPlaylistTracks()
    } catch (err) {
      console.error("Error adding track to playlist:", err)
    }
  }

  // Remove track from playlist
  const handleRemoveFromPlaylist = async (trackId: string) => {
    if (!selectedPlaylist) return

    try {
      await removeFromPlaylist(userId, selectedPlaylist, trackId)
      // Refresh playlist tracks
      loadPlaylistTracks()
      // If current track is removed, clear it
      if (currentTrack && currentTrack.id === trackId) {
        setCurrentTrack(null)
      }
    } catch (err) {
      console.error("Error removing track from playlist:", err)
    }
  }

  // Format duration (ms to MM:SS)
  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  // Play track preview
  const playTrack = (track: PlaylistTrack) => {
    setCurrentTrack(track)
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Your Spotify Playlists</CardTitle>
          <Button variant="outline" size="sm" onClick={loadPlaylists}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error && <div className="p-4 mb-4 text-sm text-red-500 bg-red-50 rounded-md">Error: {error}</div>}

        <Tabs defaultValue="playlists">
          <TabsList className="mb-4">
            <TabsTrigger value="playlists">Playlists</TabsTrigger>
            <TabsTrigger value="player">Player</TabsTrigger>
          </TabsList>

          <TabsContent value="playlists" className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Playlist Sidebar */}
                <div className="border rounded-md overflow-hidden">
                  <div className="p-3 font-medium bg-muted">Your Playlists</div>
                  <ScrollArea className="h-[400px]">
                    {playlists.length === 0 ? (
                      <div className="p-4 text-center text-muted-foreground">No playlists found</div>
                    ) : (
                      <div className="p-2">
                        {playlists.map((playlist) => (
                          <div
                            key={playlist.id}
                            className={`p-2 rounded-md cursor-pointer ${selectedPlaylist === playlist.id ? "bg-accent" : "hover:bg-accent/50"}`}
                            onClick={() => setSelectedPlaylist(playlist.id)}
                          >
                            <div className="font-medium truncate">{playlist.name}</div>
                            <div className="text-xs text-muted-foreground">{playlist.tracks.total} tracks</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </div>

                {/* Playlist Tracks */}
                <div className="md:col-span-2 border rounded-md overflow-hidden">
                  <div className="p-3 font-medium bg-muted">
                    {selectedPlaylist
                      ? playlists.find((p) => p.id === selectedPlaylist)?.name || "Tracks"
                      : "Select a playlist"}
                  </div>
                  <ScrollArea className="h-[400px]">
                    {!selectedPlaylist ? (
                      <div className="p-4 text-center text-muted-foreground">Select a playlist to view tracks</div>
                    ) : playlistTracks.length === 0 ? (
                      <div className="p-4 text-center text-muted-foreground">No tracks in this playlist</div>
                    ) : (
                      <div>
                        {playlistTracks.map((track) => (
                          <div key={track.id}>
                            <div className="flex items-center justify-between p-3 hover:bg-accent/50">
                              <div className="flex-1 min-w-0 mr-2">
                                <div className="font-medium truncate">{track.name}</div>
                                <div className="text-xs text-muted-foreground truncate">
                                  {track.artists.map((a) => a.name).join(", ")} • {track.album.name}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="text-xs text-muted-foreground w-12 text-right">
                                  {formatDuration(track.duration_ms)}
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  disabled={!track.preview_url}
                                  onClick={() => playTrack(track)}
                                >
                                  <Music className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive"
                                  onClick={() => handleRemoveFromPlaylist(track.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            <Separator />
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="player">
            {currentTrack && currentTrack.preview_url ? (
              <AudioPlayer
                previewUrl={currentTrack.preview_url}
                trackName={currentTrack.name}
                artistName={currentTrack.artists.map((a) => a.name).join(", ")}
              />
            ) : (
              <div className="p-8 text-center">
                <Music className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No track selected</h3>
                <p className="text-muted-foreground mb-4">Select a track from your playlist to play a preview</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
