"use client";

import { useState, useCallback } from "react";

type MusicAPIHookReturn = {
  isLoading: boolean;
  error: string | null;
  searchSpotify: (query: string, type?: string) => Promise<any>;
  getTrackPreview: (trackId: string) => Promise<any>;
  getUserPlaylists: (accessToken: string) => Promise<any>;
  getPlaylistTracks: (accessToken: string, playlistId: string) => Promise<any>;
  addToPlaylist: (
    accessToken: string,
    playlistId: string,
    trackId: string
  ) => Promise<any>;
  removeFromPlaylist: (
    accessToken: string,
    playlistId: string,
    trackId: string
  ) => Promise<any>;
  getTopArtists: (accessToken: string, timeRange?: string) => Promise<any>;
  getTopTracks: (accessToken: string, timeRange?: string) => Promise<any>;
  getSavedAlbums: (accessToken: string) => Promise<any>;
  getSavedTracks: (accessToken: string) => Promise<any>;
  getRecentlyPlayed: (accessToken: string) => Promise<any>;
  getUserProfile: (accessToken: string) => Promise<any>;
};

export function useMusicAPI(): MusicAPIHookReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search for tracks on Spotify via MusicAPI
  const searchSpotify = useCallback(async (query: string, type = "track") => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/music-api?query=${encodeURIComponent(query)}&type=${type}`
      );

      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get track preview URL
  const getTrackPreview = useCallback(async (trackId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/music-preview?trackId=${trackId}`);

      if (!response.ok) {
        throw new Error(`Failed to get preview: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get user playlists
  const getUserPlaylists = useCallback(async (accessToken: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/spotify?action=playlists", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get playlists: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get playlist tracks
  const getPlaylistTracks = useCallback(
    async (accessToken: string, playlistId: string) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/spotify?action=playlist-tracks&playlistId=${playlistId}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to get playlist tracks: ${response.status}`);
        }

        const data = await response.json();
        return data;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Add track to playlist
  const addToPlaylist = useCallback(
    async (accessToken: string, playlistId: string, trackId: string) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/spotify", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            action: "add",
            playlistId,
            trackId,
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to add to playlist: ${response.status}`);
        }

        const data = await response.json();
        return data;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Remove track from playlist
  const removeFromPlaylist = useCallback(
    async (accessToken: string, playlistId: string, trackId: string) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/spotify", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            action: "remove",
            playlistId,
            trackId,
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to remove from playlist: ${response.status}`);
        }

        const data = await response.json();
        return data;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Get top artists
  const getTopArtists = useCallback(
    async (accessToken: string, timeRange = "medium_term") => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/spotify?action=top-artists&time_range=${timeRange}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to get top artists: ${response.status}`);
        }

        const data = await response.json();
        return data;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Get top tracks
  const getTopTracks = useCallback(
    async (accessToken: string, timeRange = "medium_term") => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/spotify?action=top-tracks&time_range=${timeRange}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to get top tracks: ${response.status}`);
        }

        const data = await response.json();
        return data;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Get saved albums
  const getSavedAlbums = useCallback(async (accessToken: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/spotify?action=saved-albums", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to get saved albums");
      }
      return await response.json();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get saved tracks
  const getSavedTracks = useCallback(async (accessToken: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/spotify?action=saved-tracks", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to get saved tracks");
      }
      return await response.json();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get recently played
  const getRecentlyPlayed = useCallback(async (accessToken: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/spotify?action=recently-played", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to get recently played");
      }
      return await response.json();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get user profile
  const getUserProfile = useCallback(async (accessToken: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/spotify?action=profile", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to get user profile");
      }
      return await response.json();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    error,
    searchSpotify,
    getTrackPreview,
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
  };
}
