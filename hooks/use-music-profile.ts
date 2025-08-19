import { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  setDoc,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { db } from "@/lib/firebase";

export interface SaavnSong {
  id: string;
  name: string;
  primaryArtists: string;
  image: Array<{ quality: string; url: string }> | string;
  album?: string;
  duration?: string;
  language?: string;
  year?: string;
  // Additional artist structure for compatibility
  artists?: {
    primary: Array<{
      id: string;
      name: string;
    }>;
  };
  // Additional artist fields for better extraction
  artist?: string;
  featuredArtists?: string;
  singer?: string;
}

export interface SaavnAlbum {
  id: string;
  name: string;
  primaryArtists: string;
  image: Array<{ quality: string; url: string }> | string;
  year?: string;
  language?: string;
  songCount?: number;
  // Additional artist structure for compatibility
  artists?: {
    primary: Array<{
      id: string;
      name: string;
    }>;
  };
  // Additional artist fields for better extraction
  artist?: string;
  featuredArtists?: string;
  singer?: string;
}

export interface SaavnArtist {
  id: string;
  name: string;
  image: Array<{ quality: string; url: string }> | string;
  description?: string;
  language?: string;
}

export interface MusicProfile {
  currentObsession: SaavnSong | null;
  favoriteArtist: SaavnArtist | null;
  favoriteSong: SaavnSong | null;
  favoriteAlbums: SaavnAlbum[];
  recommendations: SaavnSong[];
  ratings: Array<{ song: SaavnSong; rating: number }>;
}

export function useMusicProfile(userId: string | undefined) {
  const [musicProfile, setMusicProfile] = useState<MusicProfile>({
    currentObsession: null,
    favoriteArtist: null,
    favoriteSong: null,
    favoriteAlbums: [],
    recommendations: [],
    ratings: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch music profile from Firebase
  const fetchMusicProfile = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Check if user is authenticated
      const auth = getAuth();
      if (!auth.currentUser) {
        setError("User not authenticated");
        setLoading(false);
        return;
      }

      // Try to fetch data, but handle permission errors gracefully
      const musicCollection = collection(db, "users", userId, "music");
      const musicSnapshot = await getDocs(musicCollection);

      if (!musicSnapshot.empty) {
        const musicData = musicSnapshot.docs[0].data();

        // Validate and sanitize the data
        const validatedProfile = {
          currentObsession:
            musicData.currentObsession &&
            typeof musicData.currentObsession === "object"
              ? musicData.currentObsession
              : null,
          favoriteArtist:
            musicData.favoriteArtist &&
            typeof musicData.favoriteArtist === "object"
              ? musicData.favoriteArtist
              : null,
          favoriteSong:
            musicData.favoriteSong && typeof musicData.favoriteSong === "object"
              ? musicData.favoriteSong
              : null,
          favoriteAlbums: Array.isArray(musicData.favoriteAlbums)
            ? musicData.favoriteAlbums.filter(
                (album) => album && typeof album === "object"
              )
            : [],
          recommendations: Array.isArray(musicData.recommendations)
            ? musicData.recommendations.filter(
                (song) => song && typeof song === "object"
              )
            : [],
          ratings: Array.isArray(musicData.ratings)
            ? musicData.ratings.filter(
                (rating) =>
                  rating &&
                  typeof rating === "object" &&
                  rating.song &&
                  rating.rating
              )
            : [],
        };

        setMusicProfile(validatedProfile);
      } else {
        // Create default music profile if none exists
        const defaultProfile = {
          currentObsession: null,
          favoriteArtist: null,
          favoriteSong: null,
          favoriteAlbums: [],
          recommendations: [],
          ratings: [],
        };

        try {
          await addDoc(musicCollection, defaultProfile);
          setMusicProfile(defaultProfile);
        } catch (createErr) {
          console.warn(
            "Could not create music profile, using local state:",
            createErr
          );
          setMusicProfile(defaultProfile);
        }
      }
    } catch (err: any) {
      console.error("Error fetching music profile:", err);

      // Handle specific Firebase permission errors
      if (
        err.code === "permission-denied" ||
        err.message?.includes("permission")
      ) {
        setError(
          "Missing or insufficient permissions. Please check your authentication."
        );
      } else if (err.code === "unauthenticated") {
        setError("User not authenticated. Please sign in again.");
      } else {
        setError("Failed to fetch music profile");
      }

      // Set default state on error - this allows the app to work offline
      const fallbackProfile = {
        currentObsession: null,
        favoriteArtist: null,
        favoriteSong: null,
        favoriteAlbums: [],
        recommendations: [],
        ratings: [],
      };

      setMusicProfile(fallbackProfile);

      // Try to create the profile document for future use
      try {
        const musicCollection = collection(db, "users", userId, "music");
        await addDoc(musicCollection, fallbackProfile);
      } catch (createErr) {
        console.warn("Could not create fallback profile:", createErr);
      }
    } finally {
      setLoading(false);
    }
  };

  // Save music profile to Firebase
  const saveMusicProfile = async (profile: Partial<MusicProfile>) => {
    if (!userId) return;

    try {
      // Check if user is authenticated
      const auth = getAuth();
      if (!auth.currentUser) {
        console.error("User not authenticated");
        return;
      }

      const musicCollection = collection(db, "users", userId, "music");
      const musicSnapshot = await getDocs(musicCollection);

      const updatedProfile = { ...musicProfile, ...profile };

      if (musicSnapshot.empty) {
        // Create new document
        await addDoc(musicCollection, updatedProfile);
      } else {
        // Update existing document
        const docRef = doc(
          db,
          "users",
          userId,
          "music",
          musicSnapshot.docs[0].id
        );
        await setDoc(docRef, updatedProfile, { merge: true });
      }

      setMusicProfile(updatedProfile);
    } catch (err: any) {
      console.error("Error saving music profile:", err);

      // Handle specific Firebase permission errors
      if (
        err.code === "permission-denied" ||
        err.message?.includes("permission")
      ) {
        setError(
          "Missing or insufficient permissions. Please check your authentication."
        );
      } else if (err.code === "unauthenticated") {
        setError("User not authenticated. Please sign in again.");
      } else {
        setError("Failed to save music profile");
      }

      throw err; // Re-throw to let component handle it
    }
  };

  // Update specific music items
  const updateCurrentObsession = async (song: SaavnSong) => {
    await saveMusicProfile({ currentObsession: song });
  };

  const updateFavoriteArtist = async (artist: SaavnArtist) => {
    await saveMusicProfile({ favoriteArtist: artist });
  };

  const updateFavoriteSong = async (song: SaavnSong) => {
    await saveMusicProfile({ favoriteSong: song });
  };

  const updateFavoriteAlbums = async (albums: SaavnAlbum[]) => {
    await saveMusicProfile({ favoriteAlbums: albums });
  };

  const addFavoriteAlbum = async (album: SaavnAlbum) => {
    const updatedAlbums = [...musicProfile.favoriteAlbums];
    const existingIndex = updatedAlbums.findIndex((a) => a.id === album.id);

    if (existingIndex !== -1) {
      updatedAlbums[existingIndex] = album;
    } else {
      updatedAlbums.push(album);
    }

    // Keep only 15 albums
    const finalAlbums = updatedAlbums.slice(0, 15);
    await saveMusicProfile({ favoriteAlbums: finalAlbums });
  };

  const removeFavoriteAlbum = async (albumId: string) => {
    const updatedAlbums = musicProfile.favoriteAlbums.filter(
      (a) => a.id !== albumId
    );
    await saveMusicProfile({ favoriteAlbums: updatedAlbums });
  };

  const addRecommendation = async (song: SaavnSong) => {
    const updatedRecommendations = [...musicProfile.recommendations];
    const existingIndex = updatedRecommendations.findIndex(
      (s) => s.id === song.id
    );

    if (existingIndex !== -1) {
      updatedRecommendations[existingIndex] = song;
    } else {
      updatedRecommendations.push(song);
    }

    // Keep only 15 recommendations
    const finalRecommendations = updatedRecommendations.slice(0, 15);
    await saveMusicProfile({ recommendations: finalRecommendations });
  };

  const removeRecommendation = async (songId: string) => {
    const updatedRecommendations = musicProfile.recommendations.filter(
      (s) => s.id !== songId
    );
    await saveMusicProfile({ recommendations: updatedRecommendations });
  };

  const addRating = async (song: SaavnSong, rating: number) => {
    const updatedRatings = [...musicProfile.ratings];
    const existingIndex = updatedRatings.findIndex(
      (r) => r.song.id === song.id
    );

    if (existingIndex !== -1) {
      updatedRatings[existingIndex] = { song, rating };
    } else {
      updatedRatings.push({ song, rating });
    }

    // Keep only 15 ratings
    const finalRatings = updatedRatings.slice(0, 15);
    await saveMusicProfile({ ratings: finalRatings });
  };

  const removeRating = async (songId: string) => {
    const updatedRatings = musicProfile.ratings.filter(
      (r) => r.song.id !== songId
    );
    await saveMusicProfile({ ratings: updatedRatings });
  };

  // Dynamic replace functions that handle various scenarios
  const replaceFavoriteAlbum = async (oldId: string, newAlbum: SaavnSong) => {
    if (!oldId || !newAlbum?.id) {
      console.warn("Invalid parameters for replaceFavoriteAlbum:", {
        oldId,
        newAlbum,
      });
      return;
    }

    const updatedAlbums = [...musicProfile.favoriteAlbums];

    // Find the item to replace
    const existingIndex = updatedAlbums.findIndex(
      (album) => album.id === oldId
    );

    if (existingIndex === -1) {
      console.warn("Album to replace not found:", oldId);
      return;
    }

    // Handle different scenarios dynamically
    if (oldId === newAlbum.id) {
      // Same ID - just update the content
      updatedAlbums[existingIndex] = newAlbum;
    } else {
      // Different ID - remove duplicates and replace
      const filteredAlbums = updatedAlbums.filter(
        (album) => album.id !== newAlbum.id
      );
      const newIndex = filteredAlbums.findIndex((album) => album.id === oldId);

      if (newIndex !== -1) {
        filteredAlbums[newIndex] = newAlbum;
        await saveMusicProfile({ favoriteAlbums: filteredAlbums });
        return;
      }
    }

    await saveMusicProfile({ favoriteAlbums: updatedAlbums });
  };

  const replaceRecommendation = async (oldId: string, newSong: SaavnSong) => {
    if (!oldId || !newSong?.id) {
      console.warn("Invalid parameters for replaceRecommendation:", {
        oldId,
        newSong,
      });
      return;
    }

    const updatedRecommendations = [...musicProfile.recommendations];

    // Find the item to replace
    const existingIndex = updatedRecommendations.findIndex(
      (song) => song.id === oldId
    );

    if (existingIndex === -1) {
      console.warn("Recommendation to replace not found:", oldId);
      return;
    }

    // Handle different scenarios dynamically
    if (oldId === newSong.id) {
      // Same ID - just update the content
      updatedRecommendations[existingIndex] = newSong;
    } else {
      // Different ID - remove duplicates and replace
      const filteredRecommendations = updatedRecommendations.filter(
        (song) => song.id !== newSong.id
      );
      const newIndex = filteredRecommendations.findIndex(
        (song) => song.id === oldId
      );

      if (newIndex !== -1) {
        filteredRecommendations[newIndex] = newSong;
        await saveMusicProfile({ recommendations: filteredRecommendations });
        return;
      }
    }

    await saveMusicProfile({ recommendations: updatedRecommendations });
  };

  const replaceRating = async (
    oldId: string,
    newSong: SaavnSong,
    rating: number
  ) => {
    if (!oldId || !newSong?.id || typeof rating !== "number") {
      console.warn("Invalid parameters for replaceRating:", {
        oldId,
        newSong,
        rating,
      });
      return;
    }

    // Validate rating range
    const validRating = Math.max(1, Math.min(5, Math.round(rating)));

    const updatedRatings = [...musicProfile.ratings];

    // Find the item to replace
    const existingIndex = updatedRatings.findIndex((r) => r.song.id === oldId);

    if (existingIndex === -1) {
      console.warn("Rating to replace not found:", oldId);
      return;
    }

    // Handle different scenarios dynamically
    if (oldId === newSong.id) {
      // Same ID - just update the rating
      updatedRatings[existingIndex] = { song: newSong, rating: validRating };
    } else {
      // Different ID - remove duplicates and replace
      const filteredRatings = updatedRatings.filter(
        (r) => r.song.id !== newSong.id
      );
      const newIndex = filteredRatings.findIndex((r) => r.song.id === oldId);

      if (newIndex !== -1) {
        filteredRatings[newIndex] = { song: newSong, rating: validRating };
        await saveMusicProfile({ ratings: filteredRatings });
        return;
      }
    }

    await saveMusicProfile({ ratings: updatedRatings });
  };

  // Search functionality using Saavn API
  const searchMusic = async (
    query: string,
    type: "song" | "artist" | "album",
    limit: number = 10
  ) => {
    try {
      const endpoint = `/api/saavn/search?q=${encodeURIComponent(
        query
      )}&type=${type}&limit=${limit}`;
      const response = await fetch(endpoint);

      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }

      const data = await response.json();
      return data.data?.results || [];
    } catch (err) {
      console.error("Search error:", err);
      throw err;
    }
  };

  // Initialize on mount
  useEffect(() => {
    fetchMusicProfile();
  }, [userId]);

  return {
    musicProfile,
    loading,
    error,
    updateCurrentObsession,
    updateFavoriteArtist,
    updateFavoriteSong,
    updateFavoriteAlbums,
    addFavoriteAlbum,
    removeFavoriteAlbum,
    replaceFavoriteAlbum,
    addRecommendation,
    removeRecommendation,
    replaceRecommendation,
    addRating,
    removeRating,
    replaceRating,
    searchMusic,
    refreshProfile: fetchMusicProfile,
  };
}
