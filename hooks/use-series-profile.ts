"use client";

import { useState, useEffect } from "react";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
  addDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface TMDBSeries {
  id: number;
  name: string;
  overview: string;
  first_air_date: string;
  poster_path: string;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
  genres?: Array<{ id: number; name: string }>;
  number_of_seasons: number;
  number_of_episodes: number;
  status: string;
  type: string;
}

export interface SeriesProfile {
  recentlyWatched: TMDBSeries[];
  favoriteSeries: TMDBSeries | null;
  favoriteCreator: { id: string; name: string; image: string } | null;
  favoriteSeriesList: TMDBSeries[];
  watchlist: TMDBSeries[];
  recommendations: TMDBSeries[];
  ratings: Array<{ series: TMDBSeries; rating: number }>;
}

export function useSeriesProfile(userId: string | undefined) {
  const [seriesProfile, setSeriesProfile] = useState<SeriesProfile>({
    recentlyWatched: [],
    favoriteSeries: null,
    favoriteCreator: null,
    favoriteSeriesList: [],
    watchlist: [],
    recommendations: [],
    ratings: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch series profile from Firebase
  const fetchSeriesProfile = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const docRef = doc(db, "seriesProfiles", userId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setSeriesProfile(docSnap.data() as SeriesProfile);
      } else {
        // Create default profile
        const defaultProfile: SeriesProfile = {
          recentlyWatched: [],
          favoriteSeries: null,
          favoriteCreator: null,
          favoriteSeriesList: [],
          watchlist: [],
          recommendations: [],
          ratings: [],
        };
        await setDoc(docRef, defaultProfile);
        setSeriesProfile(defaultProfile);
      }
    } catch (err) {
      console.error("Error fetching series profile:", err);
      setError("Failed to load series profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSeriesProfile();
  }, [userId]);

  // Update recently watched series
  const updateRecentlyWatched = async (series: TMDBSeries) => {
    if (!userId) return;

    try {
      const updatedProfile = { ...seriesProfile };
      // Remove if already exists
      updatedProfile.recentlyWatched = updatedProfile.recentlyWatched.filter(
        (s) => s.id !== series.id
      );
      // Add to beginning
      updatedProfile.recentlyWatched.unshift(series);
      // Keep only first 10
      updatedProfile.recentlyWatched = updatedProfile.recentlyWatched.slice(
        0,
        10
      );

      await updateDoc(doc(db, "seriesProfiles", userId), {
        recentlyWatched: updatedProfile.recentlyWatched,
      });

      setSeriesProfile(updatedProfile);
    } catch (err) {
      console.error("Error updating recently watched:", err);
      throw err;
    }
  };

  // Update favorite series
  const updateFavoriteSeries = async (series: TMDBSeries) => {
    if (!userId) return;

    try {
      await updateDoc(doc(db, "seriesProfiles", userId), {
        favoriteSeries: series,
      });

      setSeriesProfile((prev) => ({ ...prev, favoriteSeries: series }));
    } catch (err) {
      console.error("Error updating favorite series:", err);
      throw err;
    }
  };

  // Update favorite creator
  const updateFavoriteCreator = async (creator: {
    id: string;
    name: string;
    image: string;
  }) => {
    if (!userId) return;

    try {
      await updateDoc(doc(db, "seriesProfiles", userId), {
        favoriteCreator: creator,
      });

      setSeriesProfile((prev) => ({ ...prev, favoriteCreator: creator }));
    } catch (err) {
      console.error("Error updating favorite creator:", err);
      throw err;
    }
  };

  // Add to favorite series
  const addFavoriteSeries = async (series: TMDBSeries) => {
    if (!userId) return;

    try {
      const updatedProfile = { ...seriesProfile };
      if (!updatedProfile.favoriteSeriesList.find((s) => s.id === series.id)) {
        updatedProfile.favoriteSeriesList.push(series);
      }

      await updateDoc(doc(db, "seriesProfiles", userId), {
        favoriteSeriesList: updatedProfile.favoriteSeriesList,
      });

      setSeriesProfile(updatedProfile);
    } catch (err) {
      console.error("Error adding favorite series:", err);
      throw err;
    }
  };

  // Remove from favorite series
  const removeFavoriteSeries = async (seriesId: string) => {
    if (!userId) return;

    try {
      const updatedProfile = { ...seriesProfile };
      updatedProfile.favoriteSeriesList =
        updatedProfile.favoriteSeriesList.filter(
          (s) => s.id.toString() !== seriesId
        );

      await updateDoc(doc(db, "seriesProfiles", userId), {
        favoriteSeriesList: updatedProfile.favoriteSeriesList,
      });

      setSeriesProfile(updatedProfile);
    } catch (err) {
      console.error("Error removing favorite series:", err);
      throw err;
    }
  };

  // Add to watchlist
  const addToWatchlist = async (series: TMDBSeries) => {
    if (!userId) return;

    try {
      const updatedProfile = { ...seriesProfile };
      if (!updatedProfile.watchlist.find((s) => s.id === series.id)) {
        updatedProfile.watchlist.push(series);
      }

      await updateDoc(doc(db, "seriesProfiles", userId), {
        watchlist: updatedProfile.watchlist,
      });

      setSeriesProfile(updatedProfile);
    } catch (err) {
      console.error("Error adding to watchlist:", err);
      throw err;
    }
  };

  // Remove from watchlist
  const removeFromWatchlist = async (seriesId: string) => {
    if (!userId) return;

    try {
      const updatedProfile = { ...seriesProfile };
      updatedProfile.watchlist = updatedProfile.watchlist.filter(
        (s) => s.id.toString() !== seriesId
      );

      await updateDoc(doc(db, "seriesProfiles", userId), {
        watchlist: updatedProfile.watchlist,
      });

      setSeriesProfile(updatedProfile);
    } catch (err) {
      console.error("Error removing from watchlist:", err);
      throw err;
    }
  };

  // Add recommendation
  const addRecommendation = async (series: TMDBSeries) => {
    if (!userId) return;

    try {
      const updatedProfile = { ...seriesProfile };
      if (!updatedProfile.recommendations.find((s) => s.id === series.id)) {
        updatedProfile.recommendations.push(series);
      }

      await updateDoc(doc(db, "seriesProfiles", userId), {
        recommendations: updatedProfile.recommendations,
      });

      setSeriesProfile(updatedProfile);
    } catch (err) {
      console.error("Error adding recommendation:", err);
      throw err;
    }
  };

  // Remove recommendation
  const removeRecommendation = async (seriesId: string) => {
    if (!userId) return;

    try {
      const updatedProfile = { ...seriesProfile };
      updatedProfile.recommendations = updatedProfile.recommendations.filter(
        (s) => s.id.toString() !== seriesId
      );

      await updateDoc(doc(db, "seriesProfiles", userId), {
        recommendations: updatedProfile.recommendations,
      });

      setSeriesProfile(updatedProfile);
    } catch (err) {
      console.error("Error removing recommendation:", err);
      throw err;
    }
  };

  // Add rating
  const addRating = async (series: TMDBSeries, rating: number) => {
    if (!userId) return;

    try {
      const updatedProfile = { ...seriesProfile };
      // Remove existing rating for this series
      updatedProfile.ratings = updatedProfile.ratings.filter(
        (r) => r.series.id !== series.id
      );
      // Add new rating
      updatedProfile.ratings.push({ series, rating });

      await updateDoc(doc(db, "seriesProfiles", userId), {
        ratings: updatedProfile.ratings,
      });

      setSeriesProfile(updatedProfile);
    } catch (err) {
      console.error("Error adding rating:", err);
      throw err;
    }
  };

  // Remove rating
  const removeRating = async (seriesId: string) => {
    if (!userId) return;

    try {
      const updatedProfile = { ...seriesProfile };
      updatedProfile.ratings = updatedProfile.ratings.filter(
        (r) => r.series.id.toString() !== seriesId
      );

      await updateDoc(doc(db, "seriesProfiles", userId), {
        ratings: updatedProfile.ratings,
      });

      setSeriesProfile(updatedProfile);
    } catch (err) {
      console.error("Error removing rating:", err);
      throw err;
    }
  };

  // Search series using TMDB API
  const searchSeries = async (
    query: string,
    limit: number = 10
  ): Promise<TMDBSeries[]> => {
    try {
      const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY;
      if (!apiKey) {
        // Return fallback data if no API key
        return [
          {
            id: 1399,
            name: "Game of Thrones",
            overview:
              "Seven noble families fight for control of the mythical land of Westeros.",
            first_air_date: "2011-04-17",
            poster_path: "/u3bZgnGQ9T01sWNhyveQz0wH0Hl.jpg",
            vote_average: 9.3,
            vote_count: 21000,
            genre_ids: [10765, 10759, 18],
            number_of_seasons: 8,
            number_of_episodes: 73,
            status: "Ended",
            type: "Scripted",
            fallback: true,
          },
          {
            id: 2316,
            name: "The Office",
            overview: "A mockumentary on a group of typical office workers.",
            first_air_date: "2005-03-24",
            poster_path: "/qWnJzyZhyy74gjpSjIXWmuk0ifX.jpg",
            vote_average: 8.9,
            vote_count: 18000,
            genre_ids: [35],
            number_of_seasons: 9,
            number_of_episodes: 201,
            status: "Ended",
            type: "Scripted",
            fallback: true,
          },
        ];
      }

      const response = await fetch(
        `https://api.themoviedb.org/3/search/tv?api_key=${apiKey}&query=${encodeURIComponent(
          query
        )}&language=en-US&page=1&include_adult=false`
      );

      if (!response.ok) {
        throw new Error("Failed to search series");
      }

      const data = await response.json();
      return data.results.slice(0, limit).map((series: any) => ({
        id: series.id,
        name: series.name,
        overview: series.overview,
        first_air_date: series.first_air_date,
        poster_path: series.poster_path,
        vote_average: series.vote_average,
        vote_count: series.vote_count,
        genre_ids: series.genre_ids,
        number_of_seasons: series.number_of_seasons || 0,
        number_of_episodes: series.number_of_episodes || 0,
        status: series.status,
        type: series.type,
      }));
    } catch (err) {
      console.error("Error searching series:", err);
      return [];
    }
  };

  // Search creators (using person search)
  const searchCreator = async (
    query: string,
    limit: number = 10
  ): Promise<any[]> => {
    try {
      const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY;
      if (!apiKey) {
        // Return fallback data if no API key
        return [
          {
            id: 1,
            name: "David Benioff",
            profile_path: "/placeholder.jpg",
            known_for_department: "Writing",
            fallback: true,
          },
          {
            id: 2,
            name: "D.B. Weiss",
            profile_path: "/placeholder.jpg",
            known_for_department: "Writing",
            fallback: true,
          },
        ];
      }

      const response = await fetch(
        `https://api.themoviedb.org/3/search/person?api_key=${apiKey}&query=${encodeURIComponent(
          query
        )}&language=en-US&page=1&include_adult=false`
      );

      if (!response.ok) {
        throw new Error("Failed to search creators");
      }

      const data = await response.json();
      return data.results
        .filter(
          (person: any) =>
            person.known_for_department === "Writing" ||
            person.known_for_department === "Production"
        )
        .slice(0, limit)
        .map((person: any) => ({
          id: person.id,
          name: person.name,
          profile_path: person.profile_path,
          known_for_department: person.known_for_department,
        }));
    } catch (err) {
      console.error("Error searching creators:", err);
      return [];
    }
  };

  // Replace functions
  const replaceFavoriteSeries = async (
    oldId: string,
    newSeries: TMDBSeries
  ) => {
    if (!userId) return;

    try {
      const docRef = doc(db, "seriesProfiles", userId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const currentData = docSnap.data() as SeriesProfile;
        const updatedFavoriteSeriesList = currentData.favoriteSeriesList.map(
          (series) => (series.id.toString() === oldId ? newSeries : series)
        );

        await updateDoc(docRef, {
          favoriteSeriesList: updatedFavoriteSeriesList,
        });

        setSeriesProfile((prev) => ({
          ...prev,
          favoriteSeriesList: updatedFavoriteSeriesList,
        }));
      }
    } catch (err) {
      console.error("Error replacing favorite series:", err);
      throw new Error("Failed to replace favorite series");
    }
  };

  const replaceWatchlistSeries = async (
    oldId: string,
    newSeries: TMDBSeries
  ) => {
    if (!userId) return;

    try {
      const docRef = doc(db, "seriesProfiles", userId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const currentData = docSnap.data() as SeriesProfile;
        const updatedWatchlist = currentData.watchlist.map((series) =>
          series.id.toString() === oldId ? newSeries : series
        );

        await updateDoc(docRef, {
          watchlist: updatedWatchlist,
        });

        setSeriesProfile((prev) => ({
          ...prev,
          watchlist: updatedWatchlist,
        }));
      }
    } catch (err) {
      console.error("Error replacing watchlist series:", err);
      throw new Error("Failed to replace watchlist series");
    }
  };

  const replaceRecommendation = async (
    oldId: string,
    newSeries: TMDBSeries
  ) => {
    if (!userId) return;

    try {
      const docRef = doc(db, "seriesProfiles", userId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const currentData = docSnap.data() as SeriesProfile;
        const updatedRecommendations = currentData.recommendations.map(
          (series) => (series.id.toString() === oldId ? newSeries : series)
        );

        await updateDoc(docRef, {
          recommendations: updatedRecommendations,
        });

        setSeriesProfile((prev) => ({
          ...prev,
          recommendations: updatedRecommendations,
        }));
      }
    } catch (err) {
      console.error("Error replacing recommendation:", err);
      throw new Error("Failed to replace recommendation");
    }
  };

  const replaceRating = async (
    oldId: string,
    newSeries: TMDBSeries,
    newRating: number
  ) => {
    if (!userId) return;

    try {
      const docRef = doc(db, "seriesProfiles", userId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const currentData = docSnap.data() as SeriesProfile;
        const updatedRatings = currentData.ratings.map((rating) =>
          rating.series.id.toString() === oldId
            ? { series: newSeries, rating: newRating }
            : rating
        );

        await updateDoc(docRef, {
          ratings: updatedRatings,
        });

        setSeriesProfile((prev) => ({
          ...prev,
          ratings: updatedRatings,
        }));
      }
    } catch (err) {
      console.error("Error replacing rating:", err);
      throw new Error("Failed to replace rating");
    }
  };

  return {
    seriesProfile,
    loading,
    error,
    updateRecentlyWatched,
    updateFavoriteSeries,
    updateFavoriteCreator,
    addFavoriteSeries,
    removeFavoriteSeries,
    addToWatchlist,
    removeFromWatchlist,
    addRecommendation,
    removeRecommendation,
    addRating,
    removeRating,
    searchSeries,
    searchCreator,
    replaceFavoriteSeries,
    replaceWatchlistSeries,
    replaceRecommendation,
    replaceRating,
  };
}
