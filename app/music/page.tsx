"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Search, Star, Play, Music, Calendar, Plus, Check, X, Clock, Headphones, Disc, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AudioPlayer } from "@/components/audio-player"
import { Recommendations } from "@/components/recommendations"

interface Song {
  id: string
  name: string
  artists: {
    primary: Array<{
      id: string
      name: string
    }>
  }
  image: Array<{
    quality: string
    url: string
  }>
  album: {
    name: string
  }
  duration: number
  year: string
  language: string
  playCount: number
  downloadUrl?: Array<{
    quality: string
    url: string
  }>
}

interface Album {
  id: string
  name: string
  artists: {
    primary: Array<{
      id: string
      name: string
    }>
  }
  image: Array<{
    quality: string
    url: string
  }>
  year: string
  language: string
  songCount: number
  playCount: number
  songs?: Song[]
}

interface SearchResponse {
  data: {
    results: Song[] | Album[]
  }
}

interface AlbumDetailsResponse {
  data: Album
}

export default function MusicApp() {
  const [searchQuery, setSearchQuery] = useState("")
  const [songs, setSongs] = useState<Song[]>([])
  const [albums, setAlbums] = useState<Album[]>([])
  const [loading, setLoading] = useState(false)
  const [ratings, setRatings] = useState<Record<string, number>>({})
  const [myList, setMyList] = useState<Set<string>>(new Set())
  const [selectedSong, setSelectedSong] = useState<Song | null>(null)
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null)
  const [showSongDetails, setShowSongDetails] = useState(false)
  const [showAlbumDetails, setShowAlbumDetails] = useState(false)
  const [currentSong, setCurrentSong] = useState<Song | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [albumPage, setAlbumPage] = useState(1)
  const [activeTab, setActiveTab] = useState("discover")
  const [hasMoreSongs, setHasMoreSongs] = useState(false)
  const [hasMoreAlbums, setHasMoreAlbums] = useState(false)

  // Load ratings and my list from localStorage on component mount
  useEffect(() => {
    const savedRatings = localStorage.getItem("songRatings")
    const savedMyList = localStorage.getItem("myList")

    if (savedRatings) {
      setRatings(JSON.parse(savedRatings))
    }

    if (savedMyList) {
      setMyList(new Set(JSON.parse(savedMyList)))
    }
  }, [])

  // Save ratings to localStorage whenever ratings change
  useEffect(() => {
    localStorage.setItem("songRatings", JSON.stringify(ratings))
  }, [ratings])

  // Save my list to localStorage whenever myList changes
  useEffect(() => {
    localStorage.setItem("myList", JSON.stringify(Array.from(myList)))
  }, [myList])

  const searchSongs = async (page = 1, append = false) => {
    if (!searchQuery.trim()) return

    setLoading(true)
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&page=${page}&limit=40`)
      const data = await response.json()

      let results: Song[] = []
      if (data.data?.results) {
        results = data.data.results
      } else if (data.results) {
        results = data.results
      } else if (Array.isArray(data)) {
        results = data
      }

      if (results.length > 0) {
        const sortedSongs = results.sort((a, b) => {
          const ratingA = ratings[a.id] || 0
          const ratingB = ratings[b.id] || 0

          if (ratingA !== ratingB) {
            return ratingB - ratingA
          }

          return (b.playCount || 0) - (a.playCount || 0)
        })

        if (append) {
          setSongs((prevSongs) => [...prevSongs, ...sortedSongs])
        } else {
          setSongs(sortedSongs)
        }

        setCurrentPage(page)
        setHasMoreSongs(results.length === 40)
      } else {
        if (!append) {
          setSongs([])
        }
        setHasMoreSongs(false)
      }
    } catch (error) {
      console.error("Error searching songs:", error)
      if (!append) {
        setSongs([])
      }
    } finally {
      setLoading(false)
    }
  }

  const searchAlbums = async (page = 1, append = false) => {
    if (!searchQuery.trim()) return

    setLoading(true)
    try {
      const response = await fetch(`/api/albums?q=${encodeURIComponent(searchQuery)}&page=${page}&limit=20`)
      const data = await response.json()

      let results: Album[] = []
      if (data.data?.results) {
        results = data.data.results
      } else if (data.results) {
        results = data.results
      } else if (Array.isArray(data)) {
        results = data
      }

      if (results.length > 0) {
        if (append) {
          setAlbums((prevAlbums) => [...prevAlbums, ...results])
        } else {
          setAlbums(results)
        }

        setAlbumPage(page)
        setHasMoreAlbums(results.length === 20)
      } else {
        if (!append) {
          setAlbums([])
        }
        setHasMoreAlbums(false)
      }
    } catch (error) {
      console.error("Error searching albums:", error)
      if (!append) {
        setAlbums([])
      }
    } finally {
      setLoading(false)
    }
  }

  const fetchAlbumDetails = async (albumId: string) => {
    try {
      const response = await fetch(`/api/albums/${albumId}`)
      const data: AlbumDetailsResponse = await response.json()

      if (data.data) {
        setSelectedAlbum(data.data)
        setShowAlbumDetails(true)
      }
    } catch (error) {
      console.error("Error fetching album details:", error)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

  const rateSong = (songId: string, rating: number) => {
    setRatings((prev) => ({
      ...prev,
      [songId]: rating,
    }))

    setSongs((prevSongs) =>
      [...prevSongs].sort((a, b) => {
        const ratingA = songId === a.id ? rating : ratings[a.id] || 0
        const ratingB = songId === b.id ? rating : ratings[b.id] || 0

        if (ratingA !== ratingB) {
          return ratingB - ratingA
        }

        return (b.playCount || 0) - (a.playCount || 0)
      }),
    )
  }

  const toggleMyList = (songId: string) => {
    setMyList((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(songId)) {
        newSet.delete(songId)
      } else {
        newSet.add(songId)
      }
      return newSet
    })
  }

  const openSongDetails = (song: Song) => {
    setSelectedSong(song)
    setShowSongDetails(true)
  }

  const playSong = (song: Song) => {
    setCurrentSong(song)
  }

  const playAlbum = (album: Album) => {
    if (album.songs && album.songs.length > 0) {
      setCurrentSong(album.songs[0])
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const StarRating = ({ songId, currentRating }: { songId: string; currentRating: number }) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 cursor-pointer transition-colors ${
              star <= currentRating ? "fill-white text-white" : "text-gray-500 hover:text-gray-300"
            }`}
            onClick={(e) => {
              e.stopPropagation()
              rateSong(songId, star)
            }}
          />
        ))}
        <span className="text-sm text-gray-400 ml-2">{currentRating > 0 ? `${currentRating}/5` : "Rate"}</span>
      </div>
    )
  }

  const handleSearch = () => {
    setCurrentPage(1)
    setAlbumPage(1)
    if (activeTab === "songs") {
      searchSongs(1, false)
    } else if (activeTab === "albums") {
      searchAlbums(1, false)
    }
  }

  const loadMoreSongs = () => {
    if (!loading && hasMoreSongs) {
      searchSongs(currentPage + 1, true)
    }
  }

  const loadMoreAlbums = () => {
    if (!loading && hasMoreAlbums) {
      searchAlbums(albumPage + 1, true)
    }
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    if (value === "songs" && songs.length === 0 && searchQuery) {
      searchSongs(1, false)
    } else if (value === "albums" && albums.length === 0 && searchQuery) {
      searchAlbums(1, false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center justify-center gap-2">
            <Music className="w-8 h-8" />
            Saavn Music Search
          </h1>
          <p className="text-gray-400">Discover songs, albums, get recommendations, and play your favorites</p>
          {myList.size > 0 && (
            <Badge variant="outline" className="mt-2 border-white text-white">
              My List: {myList.size} songs
            </Badge>
          )}
        </div>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search for songs, albums, or artists..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                className="pl-10 bg-gray-900 border-gray-700 text-white placeholder:text-gray-500 focus:border-white"
              />
            </div>
            <Button onClick={handleSearch} disabled={loading} className="bg-white text-black hover:bg-gray-200">
              {loading ? "Searching..." : "Search"}
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-gray-900 mb-8">
            <TabsTrigger value="discover" className="data-[state=active]:bg-white data-[state=active]:text-black">
              <Music className="w-4 h-4 mr-2" />
              Discover
            </TabsTrigger>
            <TabsTrigger value="songs" className="data-[state=active]:bg-white data-[state=active]:text-black">
              <Music className="w-4 h-4 mr-2" />
              Songs
            </TabsTrigger>
            <TabsTrigger value="albums" className="data-[state=active]:bg-white data-[state=active]:text-black">
              <Disc className="w-4 h-4 mr-2" />
              Albums
            </TabsTrigger>
          </TabsList>

          {/* Discover Tab - Recommendations */}
          <TabsContent value="discover">
            <Recommendations
              currentSong={currentSong}
              ratings={ratings}
              myList={myList}
              onPlaySong={playSong}
              onToggleMyList={toggleMyList}
              onRateSong={rateSong}
            />
          </TabsContent>

          {/* Songs Tab */}
          <TabsContent value="songs">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {songs.map((song) => (
                <Card
                  key={song.id}
                  className="bg-gray-900 border-gray-700 hover:bg-gray-800 transition-all cursor-pointer group"
                  onClick={() => openSongDetails(song)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex gap-3">
                      <div className="relative">
                        <img
                          src={
                            song.image?.[2]?.url ||
                            song.image?.[1]?.url ||
                            song.image?.[0]?.url ||
                            "/placeholder.svg?height=80&width=80&query=music" ||
                            "/placeholder.svg" ||
                            "/placeholder.svg"
                          }
                          alt={song.name}
                          className="w-20 h-20 rounded-lg object-cover"
                        />
                        <Button
                          size="sm"
                          className="absolute inset-0 bg-black/70 hover:bg-black/90 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation()
                            playSong(song)
                          }}
                        >
                          <Play className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-white truncate" title={song.name}>
                          {song.name}
                        </h3>
                        <p className="text-sm text-gray-300 truncate">
                          {song.artists?.primary?.map((artist) => artist.name).join(", ") || "Unknown Artist"}
                        </p>
                        <p className="text-xs text-gray-400 truncate">{song.album?.name}</p>
                        {ratings[song.id] > 0 && (
                          <Badge variant="outline" className="mt-1 text-xs border-white text-white">
                            Top Rated
                          </Badge>
                        )}
                        {currentSong?.id === song.id && (
                          <Badge variant="outline" className="mt-1 text-xs border-green-500 text-green-500">
                            Now Playing
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {song.year}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDuration(song.duration)}
                          </span>
                        </div>
                        <Badge variant="secondary" className="bg-gray-800 text-gray-300 border-gray-600">
                          {song.language}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between">
                        <StarRating songId={song.id} currentRating={ratings[song.id] || 0} />
                        <Button
                          size="sm"
                          variant="outline"
                          className={`border-gray-600 ${
                            myList.has(song.id)
                              ? "bg-white text-black hover:bg-gray-200"
                              : "text-white hover:bg-gray-800"
                          }`}
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleMyList(song.id)
                          }}
                        >
                          {myList.has(song.id) ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {songs.length > 0 && hasMoreSongs && (
              <div className="text-center mt-8">
                <Button
                  onClick={loadMoreSongs}
                  disabled={loading}
                  variant="outline"
                  className="border-white text-white hover:bg-gray-800 bg-transparent"
                >
                  {loading ? "Loading..." : "Load More Songs"}
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Albums Tab */}
          <TabsContent value="albums">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {albums.map((album) => (
                <Card
                  key={album.id}
                  className="bg-gray-900 border-gray-700 hover:bg-gray-800 transition-all cursor-pointer group"
                  onClick={() => fetchAlbumDetails(album.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="relative">
                      <img
                        src={
                          album.image?.[2]?.url ||
                          album.image?.[1]?.url ||
                          album.image?.[0]?.url ||
                          "/placeholder.svg?height=200&width=200&query=album" ||
                          "/placeholder.svg" ||
                          "/placeholder.svg"
                        }
                        alt={album.name}
                        className="w-full aspect-square rounded-lg object-cover"
                      />
                      <Button
                        size="sm"
                        className="absolute inset-0 bg-black/70 hover:bg-black/90 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation()
                          playAlbum(album)
                        }}
                      >
                        <Play className="w-6 h-6" />
                      </Button>
                    </div>
                    <div className="mt-3">
                      <h3 className="font-semibold text-white truncate" title={album.name}>
                        {album.name}
                      </h3>
                      <p className="text-sm text-gray-300 truncate">
                        {album.artists?.primary?.map((artist) => artist.name).join(", ") || "Unknown Artist"}
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
              <div className="text-center mt-8">
                <Button
                  onClick={loadMoreAlbums}
                  disabled={loading}
                  variant="outline"
                  className="border-white text-white hover:bg-gray-800 bg-transparent"
                >
                  {loading ? "Loading..." : "Load More Albums"}
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Song Details Modal */}
        <Dialog open={showSongDetails} onOpenChange={setShowSongDetails}>
          <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-2xl">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle className="text-xl font-bold">{selectedSong?.name}</DialogTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSongDetails(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </DialogHeader>

            {selectedSong && (
              <div className="space-y-6">
                <div className="flex gap-6">
                  <img
                    src={
                      selectedSong.image?.[2]?.url ||
                      selectedSong.image?.[1]?.url ||
                      selectedSong.image?.[0]?.url ||
                      "/placeholder.svg?height=200&width=200&query=music" ||
                      "/placeholder.svg" ||
                      "/placeholder.svg"
                    }
                    alt={selectedSong.name}
                    className="w-48 h-48 rounded-lg object-cover"
                  />
                  <div className="flex-1 space-y-4">
                    <div>
                      <h3 className="text-2xl font-bold mb-2">{selectedSong.name}</h3>
                      <p className="text-lg text-gray-300 mb-1">
                        {selectedSong.artists?.primary?.map((artist) => artist.name).join(", ")}
                      </p>
                      <p className="text-gray-400">{selectedSong.album?.name}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span>Duration: {formatDuration(selectedSong.duration)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span>Year: {selectedSong.year}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Headphones className="w-4 h-4 text-gray-400" />
                        <span>Plays: {selectedSong.playCount?.toLocaleString() || "N/A"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Music className="w-4 h-4 text-gray-400" />
                        <span>Language: {selectedSong.language}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator className="bg-gray-700" />

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400 mb-2">Rate this song:</p>
                    <StarRating songId={selectedSong.id} currentRating={ratings[selectedSong.id] || 0} />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className={`border-gray-600 ${
                        myList.has(selectedSong.id)
                          ? "bg-white text-black hover:bg-gray-200"
                          : "text-white hover:bg-gray-800"
                      }`}
                      onClick={() => toggleMyList(selectedSong.id)}
                    >
                      {myList.has(selectedSong.id) ? (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          In My List
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" />
                          Add to My List
                        </>
                      )}
                    </Button>

                    <Button
                      className="bg-white text-black hover:bg-gray-200"
                      onClick={() => {
                        playSong(selectedSong)
                        setShowSongDetails(false)
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
          <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle className="text-xl font-bold">{selectedAlbum?.name}</DialogTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAlbumDetails(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </DialogHeader>

            {selectedAlbum && (
              <div className="space-y-6">
                <div className="flex gap-6">
                  <img
                    src={
                      selectedAlbum.image?.[2]?.url ||
                      selectedAlbum.image?.[1]?.url ||
                      selectedAlbum.image?.[0]?.url ||
                      "/placeholder.svg?height=300&width=300&query=album" ||
                      "/placeholder.svg" ||
                      "/placeholder.svg"
                    }
                    alt={selectedAlbum.name}
                    className="w-64 h-64 rounded-lg object-cover"
                  />
                  <div className="flex-1 space-y-4">
                    <div>
                      <h3 className="text-3xl font-bold mb-2">{selectedAlbum.name}</h3>
                      <p className="text-xl text-gray-300 mb-1">
                        {selectedAlbum.artists?.primary?.map((artist) => artist.name).join(", ")}
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
                        <span>Plays: {selectedAlbum.playCount?.toLocaleString() || "N/A"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span>Language: {selectedAlbum.language}</span>
                      </div>
                    </div>

                    <Button
                      className="bg-white text-black hover:bg-gray-200"
                      onClick={() => {
                        playAlbum(selectedAlbum)
                        setShowAlbumDetails(false)
                      }}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Play Album
                    </Button>
                  </div>
                </div>

                <Separator className="bg-gray-700" />

                {/* Album Songs */}
                {selectedAlbum.songs && selectedAlbum.songs.length > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold mb-4">Album Tracks</h4>
                    <div className="space-y-2">
                      {selectedAlbum.songs.map((song, index) => (
                        <div
                          key={song.id}
                          className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors group cursor-pointer"
                          onClick={() => playSong(song)}
                        >
                          <span className="text-gray-400 w-6 text-center">{index + 1}</span>
                          <img
                            src={song.image?.[0]?.url || "/placeholder.svg?height=40&width=40&query=music"}
                            alt={song.name}
                            className="w-10 h-10 rounded object-cover"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-white truncate">{song.name}</p>
                            <p className="text-sm text-gray-400 truncate">
                              {song.artists?.primary?.map((artist) => artist.name).join(", ")}
                            </p>
                          </div>
                          <span className="text-sm text-gray-400">{formatDuration(song.duration)}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleMyList(song.id)
                            }}
                          >
                            {myList.has(song.id) ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
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

        {/* No Results */}
        {((activeTab === "songs" && songs.length === 0) || (activeTab === "albums" && albums.length === 0)) &&
          !loading &&
          searchQuery &&
          activeTab !== "discover" && (
            <div className="text-center py-12">
              <Music className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                No {activeTab === "songs" ? "songs" : "albums"} found
              </h3>
              <p className="text-gray-400">Try searching with different keywords</p>
            </div>
          )}

        {/* Loading State */}
        {loading && activeTab !== "discover" && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-white">Searching for {activeTab}...</p>
          </div>
        )}
      </div>

      {/* Audio Player */}
      <AudioPlayer currentSong={currentSong} playlist={songs} onSongChange={setCurrentSong} />
    </div>
  )
}
