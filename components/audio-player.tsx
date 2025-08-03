"use client"

import { useState, useRef, useEffect } from "react"
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"

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
  downloadUrl?: Array<{
    quality: string
    url: string
  }>
}

interface AudioPlayerProps {
  currentSong: Song | null
  playlist: Song[]
  onSongChange: (song: Song) => void
}

export function AudioPlayer({ currentSong, playlist, onSongChange }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const audioRef = useRef<HTMLAudioElement>(null)

  // Load audio URL when current song changes
  useEffect(() => {
    if (currentSong) {
      loadSongAudio(currentSong.id)
    }
  }, [currentSong])

  const loadSongAudio = async (songId: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/song/${songId}`)
      const data = await response.json()

      if (data.data?.[0]?.downloadUrl) {
        // Get the best quality audio URL
        const audioUrls = data.data[0].downloadUrl
        const bestQuality =
          audioUrls.find((url: any) => url.quality === "320kbps") ||
          audioUrls.find((url: any) => url.quality === "160kbps") ||
          audioUrls[0]

        setAudioUrl(bestQuality.url)
      }
    } catch (error) {
      console.error("Error loading song audio:", error)
    } finally {
      setLoading(false)
    }
  }

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const updateTime = () => setCurrentTime(audio.currentTime)
    const updateDuration = () => setDuration(audio.duration)
    const handleEnded = () => {
      setIsPlaying(false)
      playNext()
    }

    audio.addEventListener("timeupdate", updateTime)
    audio.addEventListener("loadedmetadata", updateDuration)
    audio.addEventListener("ended", handleEnded)

    return () => {
      audio.removeEventListener("timeupdate", updateTime)
      audio.removeEventListener("loadedmetadata", updateDuration)
      audio.removeEventListener("ended", handleEnded)
    }
  }, [audioUrl])

  const togglePlay = async () => {
    const audio = audioRef.current
    if (!audio || !audioUrl) return

    if (isPlaying) {
      audio.pause()
      setIsPlaying(false)
    } else {
      try {
        await audio.play()
        setIsPlaying(true)
      } catch (error) {
        console.error("Error playing audio:", error)
      }
    }
  }

  const playNext = () => {
    if (!currentSong || playlist.length === 0) return

    const currentIndex = playlist.findIndex((song) => song.id === currentSong.id)
    const nextIndex = (currentIndex + 1) % playlist.length
    onSongChange(playlist[nextIndex])
  }

  const playPrevious = () => {
    if (!currentSong || playlist.length === 0) return

    const currentIndex = playlist.findIndex((song) => song.id === currentSong.id)
    const prevIndex = currentIndex === 0 ? playlist.length - 1 : currentIndex - 1
    onSongChange(playlist[prevIndex])
  }

  const handleSeek = (value: number[]) => {
    const audio = audioRef.current
    if (audio) {
      audio.currentTime = value[0]
      setCurrentTime(value[0])
    }
  }

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0]
    setVolume(newVolume)
    if (audioRef.current) {
      audioRef.current.volume = newVolume
    }
    setIsMuted(newVolume === 0)
  }

  const toggleMute = () => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.volume = volume
        setIsMuted(false)
      } else {
        audioRef.current.volume = 0
        setIsMuted(true)
      }
    }
  }

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00"
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  if (!currentSong) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-700 p-4">
      <audio ref={audioRef} src={audioUrl || undefined} crossOrigin="anonymous" preload="metadata" />

      <div className="container mx-auto flex items-center gap-4">
        {/* Song Info */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <img
            src={
              currentSong.image?.[1]?.url ||
              currentSong.image?.[0]?.url ||
              "/placeholder.svg?height=50&width=50&query=music" ||
              "/placeholder.svg"
            }
            alt={currentSong.name}
            className="w-12 h-12 rounded object-cover"
          />
          <div className="min-w-0">
            <p className="text-white font-medium truncate">{currentSong.name}</p>
            <p className="text-gray-400 text-sm truncate">
              {currentSong.artists?.primary?.map((artist) => artist.name).join(", ")}
            </p>
          </div>
        </div>

        {/* Player Controls */}
        <div className="flex flex-col items-center gap-2 flex-1 max-w-md">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={playPrevious}
              className="text-white hover:bg-gray-800"
              disabled={playlist.length <= 1}
            >
              <SkipBack className="w-4 h-4" />
            </Button>

            <Button
              size="sm"
              onClick={togglePlay}
              disabled={loading || !audioUrl}
              className="bg-white text-black hover:bg-gray-200 w-10 h-10 rounded-full"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4" />
              )}
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={playNext}
              className="text-white hover:bg-gray-800"
              disabled={playlist.length <= 1}
            >
              <SkipForward className="w-4 h-4" />
            </Button>
          </div>

          {/* Progress Bar */}
          <div className="flex items-center gap-2 w-full">
            <span className="text-xs text-gray-400 w-10">{formatTime(currentTime)}</span>
            <Slider
              value={[currentTime]}
              max={duration || 100}
              step={1}
              onValueChange={handleSeek}
              className="flex-1"
            />
            <span className="text-xs text-gray-400 w-10">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Volume Control */}
        <div className="flex items-center gap-2 flex-1 justify-end">
          <Button size="sm" variant="ghost" onClick={toggleMute} className="text-white hover:bg-gray-800">
            {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </Button>
          <Slider
            value={[isMuted ? 0 : volume]}
            max={1}
            step={0.1}
            onValueChange={handleVolumeChange}
            className="w-20"
          />
        </div>
      </div>
    </div>
  )
}
