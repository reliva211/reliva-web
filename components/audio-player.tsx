"use client"

import { useState, useRef, useEffect } from "react"
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"
import Image from "next/image"

interface AudioPlayerProps {
  // New interface for Saavn integration
  src?: string
  title?: string
  artist?: string
  image?: string
  
  // Old interface for backwards compatibility
  previewUrl?: string
  trackName?: string
  artistName?: string
  
  onEnded?: () => void
  className?: string
}

export function AudioPlayer({ 
  src, 
  title, 
  artist, 
  image,
  previewUrl, 
  trackName, 
  artistName, 
  onEnded, 
  className 
}: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.7)
  const [isMuted, setIsMuted] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  // Use new interface if available, fallback to old interface
  const audioSrc = src || previewUrl || ""
  const displayTitle = title || trackName || "Unknown Track"
  const displayArtist = artist || artistName || "Unknown Artist"

  // Load audio
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume

      // Reset player state when URL changes
      setIsPlaying(false)
      setCurrentTime(0)
    }
  }, [audioSrc, volume])

  // Update time
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const updateTime = () => setCurrentTime(audio.currentTime)
    const updateDuration = () => setDuration(audio.duration)
    const handleEnded = () => {
      setIsPlaying(false)
      setCurrentTime(0)
      if (onEnded) onEnded()
    }

    audio.addEventListener("timeupdate", updateTime)
    audio.addEventListener("loadedmetadata", updateDuration)
    audio.addEventListener("ended", handleEnded)

    return () => {
      audio.removeEventListener("timeupdate", updateTime)
      audio.removeEventListener("loadedmetadata", updateDuration)
      audio.removeEventListener("ended", handleEnded)
    }
  }, [onEnded])

  // Play/pause
  const togglePlay = () => {
    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }

    setIsPlaying(!isPlaying)
  }

  // Seek
  const handleSeek = (value: number[]) => {
    if (!audioRef.current) return

    const newTime = value[0]
    audioRef.current.currentTime = newTime
    setCurrentTime(newTime)
  }

  // Volume
  const handleVolumeChange = (value: number[]) => {
    if (!audioRef.current) return

    const newVolume = value[0]
    audioRef.current.volume = newVolume
    setVolume(newVolume)

    if (newVolume === 0) {
      setIsMuted(true)
    } else if (isMuted) {
      setIsMuted(false)
    }
  }

  // Toggle mute
  const toggleMute = () => {
    if (!audioRef.current) return

    if (isMuted) {
      audioRef.current.volume = volume
    } else {
      audioRef.current.volume = 0
    }

    setIsMuted(!isMuted)
  }

  // Format time (seconds to MM:SS)
  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00"

    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  return (
    <div className={cn("p-4 rounded-md bg-background border", className)}>
      <audio ref={audioRef} src={audioSrc} preload="metadata" />

      <div className="flex items-center space-x-4 mb-2">
        {image && (
          <Image
            src={image}
            alt={displayTitle}
            width={48}
            height={48}
            className="rounded object-cover"
          />
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm truncate">{displayTitle}</h3>
          <p className="text-xs text-muted-foreground truncate">{displayArtist}</p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground w-10">{formatTime(currentTime)}</span>
          <Slider
            value={[currentTime]}
            max={duration || 30} // Default to 30s for preview
            step={0.1}
            onValueChange={handleSeek}
            className="mx-2"
          />
          <span className="text-xs text-muted-foreground w-10 text-right">{formatTime(duration || 30)}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleMute}>
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>
            <Slider
              value={[isMuted ? 0 : volume]}
              max={1}
              step={0.01}
              onValueChange={handleVolumeChange}
              className="w-20"
            />
          </div>

          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" disabled>
              <SkipBack className="h-4 w-4" />
            </Button>
            <Button variant="default" size="icon" className="h-8 w-8" onClick={togglePlay}>
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" disabled>
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
