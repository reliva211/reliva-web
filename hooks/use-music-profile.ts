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
      }
    } catch (err) {
      console.error("Error fetching music profile:", err);
      setError("Failed to fetch music profile");
      // Set default state on error
      setMusicProfile({
        currentObsession: null,
        favoriteArtist: null,
        favoriteSong: null,
        favoriteAlbums: [],
        recommendations: [],
        ratings: [],
      });
    } finally {
      setLoading(false);
    }
  };

  // Save music profile to Firebase
  const saveMusicProfile = async (profile: Partial<MusicProfile>) => {
    if (!userId) return;

    try {
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
    } catch (err) {
      console.error("Error saving music profile:", err);
      setError("Failed to save music profile");
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
    addRecommendation,
    removeRecommendation,
    addRating,
    removeRating,
    searchMusic,
    refreshProfile: fetchMusicProfile,
  };
}
