import { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  setDoc,
  query,
  where,
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

      let profile = {
        currentObsession: null,
        favoriteArtist: null,
        favoriteSong: null,
        favoriteAlbums: [],
        recommendations: [],
        ratings: [],
      } as MusicProfile;

      if (!musicSnapshot.empty) {
        const musicData = musicSnapshot.docs[0].data();

        // Validate and sanitize the data from music profile
        profile = {
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
      }

      // Fetch favorite albums from music collections (discover section)
      try {
        const albumsCollection = collection(db, "users", userId, "musicAlbums");
        const albumsSnapshot = await getDocs(albumsCollection);
        const albumsFromCollections = albumsSnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: data.id || doc.id,
            name: data.name || data.title,
            primaryArtists: data.primaryArtists || data.artist || "",
            image: data.image || data.cover || [],
            year: data.year,
            language: data.language,
            songCount: data.songCount,
            artists: data.artists,
            artist: data.artist,
            featuredArtists: data.featuredArtists,
            singer: data.singer,
          } as SaavnAlbum;
        });

        // Merge with existing favorite albums, but prioritize collections data
        const mergedAlbums = [...albumsFromCollections];
        profile.favoriteAlbums.forEach((album) => {
          if (!mergedAlbums.find((a) => a.id === album.id)) {
            mergedAlbums.push(album);
          }
        });
        profile.favoriteAlbums = mergedAlbums;
      } catch (albumsError) {
        console.log("Could not fetch music albums:", albumsError);
      }

      // Fetch recommendations from music collections (discover section)
      try {
        const recommendationsCollection = collection(db, "users", userId, "musicRecommendations");
        const recommendationsSnapshot = await getDocs(recommendationsCollection);
        const recommendationsFromCollections = recommendationsSnapshot.docs.map((doc) => {
          const data = doc.data();
          
          // Handle different types of recommendations (album, song, artist)
          if (data.type === 'album' || data.type === 'song') {
            return {
              id: data.id || doc.id,
              name: data.name || data.title,
              primaryArtists: data.primaryArtists || data.artist || "",
              image: data.image || data.cover || [],
              album: data.album,
              duration: data.duration,
              language: data.language,
              year: data.year,
              artists: data.artists,
              artist: data.artist,
              featuredArtists: data.featuredArtists,
              singer: data.singer,
            } as SaavnSong;
          }
          return null;
        }).filter(Boolean) as SaavnSong[];

        // Merge with existing recommendations
        const mergedRecommendations = [...recommendationsFromCollections];
        profile.recommendations.forEach((song) => {
          if (!mergedRecommendations.find((s) => s.id === song.id)) {
            mergedRecommendations.push(song);
          }
        });
        profile.recommendations = mergedRecommendations;
      } catch (recommendationsError) {
        console.log("Could not fetch music recommendations:", recommendationsError);
      }

      // Fetch ratings from music reviews
      try {
        const reviewsCollection = collection(db, "reviews");
        const reviewsQuery = query(
          reviewsCollection,
          where("userId", "==", userId),
          where("mediaType", "==", "music")
        );
        const reviewsSnapshot = await getDocs(reviewsQuery);

        const musicReviews = reviewsSnapshot.docs.map((reviewDoc) => {
          const reviewData = reviewDoc.data() as any;
          return {
            song: {
              id: reviewData.mediaId || reviewDoc.id,
              name: reviewData.mediaTitle || "",
              primaryArtists: reviewData.mediaArtist || "",
              image: reviewData.mediaCover || [],
              album: "",
              duration: "",
              language: "",
              year: reviewData.mediaYear || "",
              artists: undefined,
              artist: reviewData.mediaArtist || "",
              featuredArtists: "",
              singer: "",
            } as SaavnSong,
            rating: reviewData.rating || 0,
          };
        });

        // Merge with existing ratings and deduplicate by song ID
        const allRatings = [...profile.ratings, ...musicReviews];
        const seenSongIds = new Set();
        profile.ratings = allRatings.filter((rating) => {
          if (seenSongIds.has(rating.song.id)) {
            return false;
          }
          seenSongIds.add(rating.song.id);
          return true;
        });
      } catch (reviewsError) {
        console.log("Could not fetch music reviews:", reviewsError);
      }

      setMusicProfile(profile);

      // Create default music profile document if none exists
      if (musicSnapshot.empty) {
        try {
          await addDoc(musicCollection, {
            currentObsession: null,
            favoriteArtist: null,
            favoriteSong: null,
            favoriteAlbums: [],
            recommendations: [],
            ratings: [],
          });
        } catch (createErr) {
          console.warn(
            "Could not create music profile, using local state:",
            createErr
          );
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
    console.log("updateCurrentObsession called with:", song);
    try {
      const updatedProfile = { ...musicProfile, currentObsession: song };
      console.log("Saving updated profile:", updatedProfile);
      await saveMusicProfile({ currentObsession: song });
      setMusicProfile(updatedProfile);
      console.log("Current obsession updated successfully");
    } catch (error) {
      console.error("Error updating current obsession:", error);
      throw error;
    }
  };

  const updateFavoriteArtist = async (artist: SaavnArtist) => {
    try {
      const updatedProfile = { ...musicProfile, favoriteArtist: artist };
      await saveMusicProfile({ favoriteArtist: artist });
      setMusicProfile(updatedProfile);
    } catch (error) {
      console.error("Error updating favorite artist:", error);
      throw error;
    }
  };

  const updateFavoriteSong = async (song: SaavnSong) => {
    try {
      const updatedProfile = { ...musicProfile, favoriteSong: song };
      await saveMusicProfile({ favoriteSong: song });
      setMusicProfile(updatedProfile);
    } catch (error) {
      console.error("Error updating favorite song:", error);
      throw error;
    }
  };

  const updateFavoriteAlbums = async (albums: SaavnAlbum[]) => {
    await saveMusicProfile({ favoriteAlbums: albums });
  };

  const addFavoriteAlbum = async (album: SaavnAlbum) => {
    try {
      // Add to music collections (discover section integration)
      const albumsCollection = collection(db, "users", userId!, "musicAlbums");
      await setDoc(doc(albumsCollection, album.id), {
        ...album,
        addedAt: new Date(),
      });

      // Also update the music profile for backwards compatibility
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
    } catch (error) {
      console.error("Error adding favorite album:", error);
      throw error;
    }
  };

  const removeFavoriteAlbum = async (albumId: string) => {
    try {
      // Remove from music collections (discover section integration)
      const albumRef = doc(db, "users", userId!, "musicAlbums", albumId);
      await deleteDoc(albumRef);

      // Also update the music profile for backwards compatibility
      const updatedAlbums = musicProfile.favoriteAlbums.filter(
        (a) => a.id !== albumId
      );
      await saveMusicProfile({ favoriteAlbums: updatedAlbums });
    } catch (error) {
      console.error("Error removing favorite album:", error);
      throw error;
    }
  };

  const addRecommendation = async (song: SaavnSong) => {
    try {
      // Add to music recommendations collection (discover section integration)
      const recommendationsCollection = collection(db, "users", userId!, "musicRecommendations");
      await setDoc(doc(recommendationsCollection, song.id), {
        ...song,
        type: 'song',
        addedAt: new Date(),
      });

      // Also update the music profile for backwards compatibility
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
    } catch (error) {
      console.error("Error adding recommendation:", error);
      throw error;
    }
  };

  const removeRecommendation = async (songId: string) => {
    try {
      // Remove from music recommendations collection (discover section integration)
      const recommendationRef = doc(db, "users", userId!, "musicRecommendations", songId);
      await deleteDoc(recommendationRef);

      // Also update the music profile for backwards compatibility
      const updatedRecommendations = musicProfile.recommendations.filter(
        (s) => s.id !== songId
      );
      await saveMusicProfile({ recommendations: updatedRecommendations });
    } catch (error) {
      console.error("Error removing recommendation:", error);
      throw error;
    }
  };

  const addRating = async (song: SaavnSong, rating: number) => {
    try {
      // Add to reviews collection for music ratings (integrates with reviews system)
      const reviewsCollection = collection(db, "reviews");
      
      // Check if review already exists
      const existingReviewQuery = query(
        reviewsCollection,
        where("userId", "==", userId),
        where("mediaId", "==", song.id),
        where("mediaType", "==", "music")
      );
      const existingReviewSnapshot = await getDocs(existingReviewQuery);

      if (!existingReviewSnapshot.empty) {
        // Update existing review
        const reviewDoc = existingReviewSnapshot.docs[0];
        await updateDoc(reviewDoc.ref, {
          rating: rating,
          updatedAt: new Date().toISOString(),
        });
      } else {
        // Create new review with basic rating
        await addDoc(reviewsCollection, {
          userId: userId,
          userName: "User", // This should be fetched from user profile
          mediaId: song.id,
          mediaType: "music",
          mediaTitle: song.name,
          mediaCover: song.image,
          mediaArtist: song.primaryArtists || song.artist,
          title: `Rating for ${song.name}`,
          content: `Rated ${rating} stars`,
          rating: rating,
          tags: [],
          spoilerWarning: false,
          isPublic: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          likes: 0,
          likedBy: [],
          helpfulVotes: 0,
          votedHelpfulBy: [],
        });
      }

      // Also update the music profile for backwards compatibility
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
    } catch (error) {
      console.error("Error adding rating:", error);
      throw error;
    }
  };

  const removeRating = async (songId: string) => {
    try {
      // Remove from reviews collection
      const reviewsCollection = collection(db, "reviews");
      const reviewQuery = query(
        reviewsCollection,
        where("userId", "==", userId),
        where("mediaId", "==", songId),
        where("mediaType", "==", "music")
      );
      const reviewSnapshot = await getDocs(reviewQuery);

      if (!reviewSnapshot.empty) {
        const reviewDoc = reviewSnapshot.docs[0];
        await deleteDoc(reviewDoc.ref);
      }

      // Also update the music profile for backwards compatibility
      const updatedRatings = musicProfile.ratings.filter(
        (r) => r.song.id !== songId
      );
      await saveMusicProfile({ ratings: updatedRatings });
    } catch (error) {
      console.error("Error removing rating:", error);
      throw error;
    }
  };

  // Dynamic replace functions that handle various scenarios
  const replaceFavoriteAlbum = async (oldId: string, newAlbum: SaavnAlbum) => {
    if (!oldId || !newAlbum?.id) {
      console.warn("Invalid parameters for replaceFavoriteAlbum:", {
        oldId,
        newAlbum,
      });
      return;
    }

    try {
      // Remove old album first
      await removeFavoriteAlbum(oldId);
      
      // Add new album
      await addFavoriteAlbum(newAlbum);
    } catch (error) {
      console.error("Error replacing favorite album:", error);
      throw error;
    }
  };

  const replaceRecommendation = async (oldId: string, newSong: SaavnSong) => {
    if (!oldId || !newSong?.id) {
      console.warn("Invalid parameters for replaceRecommendation:", {
        oldId,
        newSong,
      });
      return;
    }

    try {
      // Remove old recommendation first
      await removeRecommendation(oldId);
      
      // Add new recommendation
      await addRecommendation(newSong);
    } catch (error) {
      console.error("Error replacing recommendation:", error);
      throw error;
    }
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

    try {
      // Remove old rating first
      await removeRating(oldId);
      
      // Add new rating
      await addRating(newSong, rating);
    } catch (error) {
      console.error("Error replacing rating:", error);
      throw error;
    }
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

      console.log("Searching with endpoint:", endpoint);
      const response = await fetch(endpoint);

      if (!response.ok) {
        throw new Error(
          `Search failed: ${response.status} - ${response.statusText}`
        );
      }

      const data = await response.json();
      console.log("Raw API response:", data);

      const results = data.data?.results || data.results || [];
      console.log("Extracted results:", results);

      return results;
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
