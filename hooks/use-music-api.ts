"use client"

import { useState, useCallback } from "react"

type MusicAPIHookReturn = {
  isLoading: boolean
  error: string | null
  searchSpotify: (query: string, type?: string) => Promise<any>
  getTrackPreview: (trackId: string) => Promise<any>
  getUserPlaylists: (userId: string) => Promise<any>
  getPlaylistTracks: (userId: string, playlistId: string) => Promise<any>
  addToPlaylist: (userId: string, playlistId: string, trackId: string) => Promise<any>
  removeFromPlaylist: (userId: string, playlistId: string, trackId: string) => Promise<any>
}

export function useMusicAPI(): MusicAPIHookReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Search for tracks on Spotify via MusicAPI
  const searchSpotify = useCallback(async (query: string, type = "track") => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/music-api?query=${encodeURIComponent(query)}&type=${type}`)

      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred")
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Get track preview URL
  const getTrackPreview = useCallback(async (trackId: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/music-preview?trackId=${trackId}`)

      if (!response.ok) {
        throw new Error(`Failed to get preview: ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred")
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Get user playlists
  const getUserPlaylists = useCallback(async (userId: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/music-api", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          action: "getUserPlaylists",
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to get playlists: ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred")
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Get playlist tracks
  const getPlaylistTracks = useCallback(async (userId: string, playlistId: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/music-api", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          action: "getPlaylistTracks",
          playlistId,
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to get playlist tracks: ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred")
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Add track to playlist
  const addToPlaylist = useCallback(async (userId: string, playlistId: string, trackId: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/music-api", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          action: "addToPlaylist",
          playlistId,
          trackId,
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to add to playlist: ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred")
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Remove track from playlist
  const removeFromPlaylist = useCallback(async (userId: string, playlistId: string, trackId: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/music-api", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          action: "removeFromPlaylist",
          playlistId,
          trackId,
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to remove from playlist: ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred")
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    isLoading,
    error,
    searchSpotify,
    getTrackPreview,
    getUserPlaylists,
    getPlaylistTracks,
    addToPlaylist,
    removeFromPlaylist,
  }
}
