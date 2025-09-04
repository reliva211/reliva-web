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
  query,
  where,
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

// Helper function to get full TMDB image URL
const getFullImageUrl = (posterPath: string): string => {
  if (!posterPath) return "";
  if (posterPath.startsWith("http")) return posterPath;
  return `https://image.tmdb.org/t/p/w500${posterPath}`;
};

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
      // Fetch series from the same source as the series page
      const seriesRef = collection(db, "users", userId, "series");
      const seriesSnapshot = await getDocs(seriesRef);
      const seriesData = seriesSnapshot.docs.map((doc) => ({
        id: parseInt(doc.id),
        ...doc.data(),
      })) as any[];

      // Fetch collections to understand the structure
      const collectionsRef = collection(
        db,
        "users",
        userId,
        "seriesCollections"
      );
      const collectionsSnapshot = await getDocs(collectionsRef);
      const collectionsData = collectionsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as any[];

      // Organize series by collection names
      const watchedSeries = seriesData.filter((series) =>
        series.collections?.some((collectionId: string) => {
          const collection = collectionsData.find(
            (col) => col.id === collectionId
          );
          return collection?.name === "Watched";
        })
      );

      const watchingSeries = seriesData.filter((series) =>
        series.collections?.some((collectionId: string) => {
          const collection = collectionsData.find(
            (col) => col.id === collectionId
          );
          return collection?.name === "Watching";
        })
      );

      const watchlistSeries = seriesData.filter((series) =>
        series.collections?.some((collectionId: string) => {
          const collection = collectionsData.find(
            (col) => col.id === collectionId
          );
          return collection?.name === "Watchlist";
        })
      );

      const recommendationsSeries = seriesData.filter((series) =>
        series.collections?.some((collectionId: string) => {
          const collection = collectionsData.find(
            (col) => col.id === collectionId
          );
          return collection?.name === "Recommendations";
        })
      );

      // Convert series data to TMDBSeries format
      const convertToTMDBSeries = (series: any): TMDBSeries => ({
        id: series.id,
        name: series.title,
        overview: series.overview || "",
        first_air_date: series.first_air_date || "",
        poster_path: series.cover || "",
        vote_average: series.rating || 0,
        vote_count: 0,
        genre_ids: [],
        number_of_seasons: series.number_of_seasons || 1,
        number_of_episodes: series.number_of_episodes || 1,
        status: series.status || "",
        type: "Scripted",
      });

      // Create series profile from the fetched data
      const profile: SeriesProfile = {
        recentlyWatched: watchingSeries.slice(0, 10).map(convertToTMDBSeries), // Use watching for currently watching
        favoriteSeries:
          watchedSeries.length > 0
            ? convertToTMDBSeries(watchedSeries[0])
            : null,
        favoriteCreator: null, // This would need separate logic
        favoriteSeriesList: watchedSeries.slice(0, 5).map(convertToTMDBSeries),
        watchlist: watchlistSeries.map(convertToTMDBSeries),
        recommendations: recommendationsSeries.map(convertToTMDBSeries),
        ratings: watchedSeries
          .filter((series) => series.rating && series.rating > 0)
          .map((series) => ({
            series: convertToTMDBSeries(series),
            rating: series.rating,
          })),
      };

      // Also fetch series reviews to get ratings
      try {
        const reviewsRef = collection(db, "reviews");
        const reviewsSnapshot = await getDocs(
          query(
            reviewsRef,
            where("userId", "==", userId),
            where("mediaType", "==", "series")
          )
        );

        const seriesReviews = reviewsSnapshot.docs.map((reviewDoc) => {
          const reviewData = reviewDoc.data() as any;
          return {
            series: {
              id: reviewData.mediaId || reviewDoc.id,
              name: reviewData.mediaTitle || "",
              overview: reviewData.reviewText || "",
              first_air_date: reviewData.mediaYear
                ? reviewData.mediaYear.toString()
                : "",
              poster_path: reviewData.mediaCover || "",
              vote_average: reviewData.rating || 0,
              vote_count: 0,
              genre_ids: [],
              number_of_seasons: 1,
              number_of_episodes: 1,
              status: "",
              type: "Scripted",
            },
            rating: reviewData.rating || 0,
          };
        });

        // Merge with existing ratings and deduplicate by series ID
        const allRatings = [...profile.ratings, ...seriesReviews];
        const seenSeriesIds = new Set();
        profile.ratings = allRatings.filter((rating) => {
          if (seenSeriesIds.has(rating.series.id)) {
            return false;
          }
          seenSeriesIds.add(rating.series.id);
          return true;
        });
      } catch (reviewError) {
        console.log("Could not fetch series reviews:", reviewError);
      }

      setSeriesProfile(profile);
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
      // Find the "Watching" collection (for currently watching)
      const collectionsRef = collection(
        db,
        "users",
        userId,
        "seriesCollections"
      );
      const collectionsSnapshot = await getDocs(collectionsRef);
      const watchingCollection = collectionsSnapshot.docs.find(
        (doc) => doc.data().name === "Watching"
      );

      if (!watchingCollection) {
        throw new Error("Watching collection not found");
      }

      // Check if series already exists
      const seriesRef = doc(
        db,
        "users",
        userId,
        "series",
        series.id.toString()
      );
      const seriesDoc = await getDoc(seriesRef);

      if (seriesDoc.exists()) {
        // Update existing series with Watching collection
        const existingData = seriesDoc.data();
        const updatedCollections = existingData.collections?.includes(
          watchingCollection.id
        )
          ? existingData.collections
          : [...(existingData.collections || []), watchingCollection.id];

        await updateDoc(seriesRef, {
          collections: updatedCollections,
        });
      } else {
        // Create new series with Watching collection
        const seriesData = {
          id: series.id,
          title: series.name,
          year: new Date(series.first_air_date).getFullYear(),
          cover: getFullImageUrl(series.poster_path),
          status: "Watching",
          rating: 0, // Don't set rating when adding to collections
          notes: "",
          collections: [watchingCollection.id],
          overview: series.overview,
          first_air_date: series.first_air_date,
          number_of_seasons: series.number_of_seasons,
          number_of_episodes: series.number_of_episodes,
        };

        await setDoc(seriesRef, seriesData);
      }

      // Refresh the profile data
      await fetchSeriesProfile();
    } catch (err) {
      console.error("Error updating recently watched:", err);
      throw err;
    }
  };

  // Remove from recently watched series
  const removeRecentlyWatched = async (seriesId: string) => {
    if (!userId) return;

    try {
      // Find the "Watching" collection
      const collectionsRef = collection(
        db,
        "users",
        userId,
        "seriesCollections"
      );
      const collectionsSnapshot = await getDocs(collectionsRef);
      const watchingCollection = collectionsSnapshot.docs.find(
        (doc) => doc.data().name === "Watching"
      );

      if (!watchingCollection) {
        throw new Error("Watching collection not found");
      }

      // Remove series from Watching collection
      const seriesRef = doc(db, "users", userId, "series", seriesId);
      const seriesDoc = await getDoc(seriesRef);

      if (seriesDoc.exists()) {
        const existingData = seriesDoc.data();
        const updatedCollections =
          existingData.collections?.filter(
            (id: string) => id !== watchingCollection.id
          ) || [];

        if (updatedCollections.length === 0) {
          // Remove series entirely if no collections left
          await deleteDoc(seriesRef);
        } else {
          // Update series with remaining collections
          await updateDoc(seriesRef, {
            collections: updatedCollections,
          });
        }
      }

      // Refresh the profile data
      await fetchSeriesProfile();
    } catch (err) {
      console.error("Error removing from recently watched:", err);
      throw err;
    }
  };

  // Update favorite series
  const updateFavoriteSeries = async (series: TMDBSeries) => {
    if (!userId) return;

    try {
      // Find the "Watched" collection
      const collectionsRef = collection(
        db,
        "users",
        userId,
        "seriesCollections"
      );
      const collectionsSnapshot = await getDocs(collectionsRef);
      const watchedCollection = collectionsSnapshot.docs.find(
        (doc) => doc.data().name === "Watched"
      );

      if (!watchedCollection) {
        throw new Error("Watched collection not found");
      }

      // Check if series already exists
      const seriesRef = doc(
        db,
        "users",
        userId,
        "series",
        series.id.toString()
      );
      const seriesDoc = await getDoc(seriesRef);

      if (seriesDoc.exists()) {
        // Update existing series with Watched collection
        const existingData = seriesDoc.data();
        const updatedCollections = existingData.collections?.includes(
          watchedCollection.id
        )
          ? existingData.collections
          : [...(existingData.collections || []), watchedCollection.id];

        await updateDoc(seriesRef, {
          collections: updatedCollections,
        });
      } else {
        // Create new series with Watched collection
        const seriesData = {
          id: series.id,
          title: series.name,
          year: new Date(series.first_air_date).getFullYear(),
          cover: getFullImageUrl(series.poster_path),
          status: "Watched",
          rating: 0, // Don't set rating when adding to favorites
          notes: "",
          collections: [watchedCollection.id],
          overview: series.overview,
          first_air_date: series.first_air_date,
          number_of_seasons: series.number_of_seasons,
          number_of_episodes: series.number_of_episodes,
        };

        await setDoc(seriesRef, seriesData);
      }

      // Refresh the profile data
      await fetchSeriesProfile();
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

  // Add to favorite series (Watched collection)
  const addFavoriteSeries = async (series: TMDBSeries) => {
    if (!userId) return;

    try {
      // First, find the "Watched" collection
      const collectionsRef = collection(
        db,
        "users",
        userId,
        "seriesCollections"
      );
      const collectionsSnapshot = await getDocs(collectionsRef);
      const watchedCollection = collectionsSnapshot.docs.find(
        (doc) => doc.data().name === "Watched"
      );

      if (!watchedCollection) {
        throw new Error("Watched collection not found");
      }

      // Check if series already exists
      const seriesRef = doc(
        db,
        "users",
        userId,
        "series",
        series.id.toString()
      );
      const seriesDoc = await getDoc(seriesRef);

      if (seriesDoc.exists()) {
        // Update existing series with Watched collection
        const existingData = seriesDoc.data();
        const updatedCollections = [
          ...(existingData.collections || []),
          watchedCollection.id,
        ];
        await updateDoc(seriesRef, {
          collections: updatedCollections,
        });
      } else {
        // Create new series with Watched collection
        const seriesData = {
          id: series.id,
          title: series.name,
          year: new Date(series.first_air_date).getFullYear(),
          cover: getFullImageUrl(series.poster_path),
          status: "Watched",
          rating: 0, // Don't set rating when adding to favorites
          notes: "",
          collections: [watchedCollection.id],
          overview: series.overview,
          first_air_date: series.first_air_date,
          number_of_seasons: series.number_of_seasons,
          number_of_episodes: series.number_of_episodes,
        };

        await setDoc(seriesRef, seriesData);
      }

      // Refresh the profile data
      await fetchSeriesProfile();
    } catch (err) {
      console.error("Error adding favorite series:", err);
      throw err;
    }
  };

  // Remove from favorite series (Watched collection)
  const removeFavoriteSeries = async (seriesId: string | number) => {
    if (!userId) return;

    // Ensure seriesId is a string for Firebase document reference
    const seriesIdStr = String(seriesId);
    
    if (!seriesIdStr || seriesIdStr.trim() === "") {
      console.error("Invalid series ID for removal:", seriesId);
      return;
    }

    try {
      // Find the "Watched" collection
      const collectionsRef = collection(
        db,
        "users",
        userId,
        "seriesCollections"
      );
      const collectionsSnapshot = await getDocs(collectionsRef);
      const watchedCollection = collectionsSnapshot.docs.find(
        (doc) => doc.data().name === "Watched"
      );

      if (!watchedCollection) {
        throw new Error("Watched collection not found");
      }

      // Remove series from Watched collection
      const seriesRef = doc(db, "users", userId, "series", seriesIdStr);
      const seriesDoc = await getDoc(seriesRef);

      if (seriesDoc.exists()) {
        const existingData = seriesDoc.data();
        const updatedCollections =
          existingData.collections?.filter(
            (id: string) => id !== watchedCollection.id
          ) || [];

        if (updatedCollections.length === 0) {
          // Remove series entirely if no collections left
          await deleteDoc(seriesRef);
        } else {
          // Update series with remaining collections
          await updateDoc(seriesRef, {
            collections: updatedCollections,
          });
        }
      } else {
        console.warn(`Series with ID ${seriesIdStr} not found in database`);
      }

      // Refresh the profile data
      await fetchSeriesProfile();
    } catch (err) {
      console.error("Error removing favorite series:", err);
      throw err;
    }
  };

  // Add to watchlist
  const addToWatchlist = async (series: TMDBSeries) => {
    if (!userId) return;

    try {
      // First, find the "Watchlist" collection
      const collectionsRef = collection(
        db,
        "users",
        userId,
        "seriesCollections"
      );
      const collectionsSnapshot = await getDocs(collectionsRef);
      const watchlistCollection = collectionsSnapshot.docs.find(
        (doc) => doc.data().name === "Watchlist"
      );

      if (!watchlistCollection) {
        throw new Error("Watchlist collection not found");
      }

      // Check if series already exists
      const seriesRef = doc(
        db,
        "users",
        userId,
        "series",
        series.id.toString()
      );
      const seriesDoc = await getDoc(seriesRef);

      if (seriesDoc.exists()) {
        // Update existing series with Watchlist collection
        const existingData = seriesDoc.data();
        const updatedCollections = [
          ...(existingData.collections || []),
          watchlistCollection.id,
        ];
        await updateDoc(seriesRef, {
          collections: updatedCollections,
        });
      } else {
        // Create new series with Watchlist collection
        const seriesData = {
          id: series.id,
          title: series.name,
          year: new Date(series.first_air_date).getFullYear(),
          cover: getFullImageUrl(series.poster_path),
          status: "Watchlist",
          rating: 0, // Don't set rating when adding to collections
          notes: "",
          collections: [watchlistCollection.id],
          overview: series.overview,
          first_air_date: series.first_air_date,
          number_of_seasons: series.number_of_seasons,
          number_of_episodes: series.number_of_episodes,
        };

        await setDoc(seriesRef, seriesData);
      }

      // Refresh the profile data
      await fetchSeriesProfile();
    } catch (err) {
      console.error("Error adding to watchlist:", err);
      throw err;
    }
  };

  // Remove from watchlist
  const removeFromWatchlist = async (seriesId: string) => {
    if (!userId) return;

    try {
      // Find the "Watchlist" collection
      const collectionsRef = collection(
        db,
        "users",
        userId,
        "seriesCollections"
      );
      const collectionsSnapshot = await getDocs(collectionsRef);
      const watchlistCollection = collectionsSnapshot.docs.find(
        (doc) => doc.data().name === "Watchlist"
      );

      if (!watchlistCollection) {
        throw new Error("Watchlist collection not found");
      }

      // Remove series from Watchlist collection
      const seriesRef = doc(db, "users", userId, "series", seriesId);
      const seriesDoc = await getDoc(seriesRef);

      if (seriesDoc.exists()) {
        const existingData = seriesDoc.data();
        const updatedCollections =
          existingData.collections?.filter(
            (id: string) => id !== watchlistCollection.id
          ) || [];

        if (updatedCollections.length === 0) {
          // Remove series entirely if no collections left
          await deleteDoc(seriesRef);
        } else {
          // Update series with remaining collections
          await updateDoc(seriesRef, {
            collections: updatedCollections,
          });
        }
      }

      // Refresh the profile data
      await fetchSeriesProfile();
    } catch (err) {
      console.error("Error removing from watchlist:", err);
      throw err;
    }
  };

  // Add recommendation
  const addRecommendation = async (series: TMDBSeries) => {
    if (!userId) return;

    try {
      // First, find the "Recommendations" collection
      const collectionsRef = collection(
        db,
        "users",
        userId,
        "seriesCollections"
      );
      const collectionsSnapshot = await getDocs(collectionsRef);
      const recommendationsCollection = collectionsSnapshot.docs.find(
        (doc) => doc.data().name === "Recommendations"
      );

      if (!recommendationsCollection) {
        throw new Error("Recommendations collection not found");
      }

      // Check if series already exists
      const seriesRef = doc(
        db,
        "users",
        userId,
        "series",
        series.id.toString()
      );
      const seriesDoc = await getDoc(seriesRef);

      if (seriesDoc.exists()) {
        // Update existing series with Recommendations collection
        const existingData = seriesDoc.data();
        const updatedCollections = [
          ...(existingData.collections || []),
          recommendationsCollection.id,
        ];
        await updateDoc(seriesRef, {
          collections: updatedCollections,
        });
      } else {
        // Create new series with Recommendations collection
        const seriesData = {
          id: series.id,
          title: series.name,
          year: new Date(series.first_air_date).getFullYear(),
          cover: getFullImageUrl(series.poster_path),
          status: "Recommendations",
          rating: 0, // Don't set rating when adding to collections
          notes: "",
          collections: [recommendationsCollection.id],
          overview: series.overview,
          first_air_date: series.first_air_date,
          number_of_seasons: series.number_of_seasons,
          number_of_episodes: series.number_of_episodes,
        };

        await setDoc(seriesRef, seriesData);
      }

      // Also add to the public seriesRecommendations subcollection for other users to see
      try {
        const seriesRecommendationsRef = collection(
          db,
          "users",
          userId,
          "seriesRecommendations"
        );
        await setDoc(doc(seriesRecommendationsRef, String(series.id)), {
          id: series.id,
          title: series.name,
          year: new Date(series.first_air_date).getFullYear(),
          cover: getFullImageUrl(series.poster_path),
          overview: series.overview,
          first_air_date: series.first_air_date,
          number_of_seasons: series.number_of_seasons,
          number_of_episodes: series.number_of_episodes,
          addedAt: new Date(),
          isPublic: true,
        });
      } catch (subcollectionError) {
        console.error("Error adding to seriesRecommendations subcollection:", subcollectionError);
        // Don't throw here, as the main recommendation was added successfully
      }

      // Refresh the profile data
      await fetchSeriesProfile();
    } catch (err) {
      console.error("Error adding recommendation:", err);
      throw err;
    }
  };

  // Remove recommendation
  const removeRecommendation = async (seriesId: string) => {
    if (!userId) return;

    try {
      // Find the "Recommendations" collection
      const collectionsRef = collection(
        db,
        "users",
        userId,
        "seriesCollections"
      );
      const collectionsSnapshot = await getDocs(collectionsRef);
      const recommendationsCollection = collectionsSnapshot.docs.find(
        (doc) => doc.data().name === "Recommendations"
      );

      if (!recommendationsCollection) {
        throw new Error("Recommendations collection not found");
      }

      // Remove series from Recommendations collection
      const seriesRef = doc(db, "users", userId, "series", seriesId);
      const seriesDoc = await getDoc(seriesRef);

      if (seriesDoc.exists()) {
        const existingData = seriesDoc.data();
        const updatedCollections =
          existingData.collections?.filter(
            (id: string) => id !== recommendationsCollection.id
          ) || [];

        if (updatedCollections.length === 0) {
          // Remove series entirely if no collections left
          await deleteDoc(seriesRef);
        } else {
          // Update series with remaining collections
          await updateDoc(seriesRef, {
            collections: updatedCollections,
          });
        }
      }

      // Also remove from the public seriesRecommendations subcollection
      try {
        const seriesRecommendationsRef = collection(
          db,
          "users",
          userId,
          "seriesRecommendations"
        );
        await deleteDoc(doc(seriesRecommendationsRef, String(seriesId)));
      } catch (subcollectionError) {
        console.error("Error removing from seriesRecommendations subcollection:", subcollectionError);
        // Don't throw here, as the main recommendation was removed successfully
      }

      // Refresh the profile data
      await fetchSeriesProfile();
    } catch (err) {
      console.error("Error removing recommendation:", err);
      throw err;
    }
  };

  // Add rating
  const addRating = async (series: TMDBSeries, rating: number) => {
    if (!userId) return;

    try {
      // Find the "Watched" collection (ratings are typically for watched series)
      const collectionsRef = collection(
        db,
        "users",
        userId,
        "seriesCollections"
      );
      const collectionsSnapshot = await getDocs(collectionsRef);
      const watchedCollection = collectionsSnapshot.docs.find(
        (doc) => doc.data().name === "Watched"
      );

      if (!watchedCollection) {
        throw new Error("Watched collection not found");
      }

      // Check if series already exists
      const seriesRef = doc(
        db,
        "users",
        userId,
        "series",
        series.id.toString()
      );
      const seriesDoc = await getDoc(seriesRef);

      if (seriesDoc.exists()) {
        // Update existing series with rating and ensure it's in Watched collection
        const existingData = seriesDoc.data();
        const updatedCollections = existingData.collections?.includes(
          watchedCollection.id
        )
          ? existingData.collections
          : [...(existingData.collections || []), watchedCollection.id];

        await updateDoc(seriesRef, {
          rating: rating,
          collections: updatedCollections,
        });
      } else {
        // Create new series with rating and Watched collection
        const seriesData = {
          id: series.id,
          title: series.name,
          year: new Date(series.first_air_date).getFullYear(),
          cover: getFullImageUrl(series.poster_path),
          status: "Watched",
          rating: rating,
          notes: "",
          collections: [watchedCollection.id],
          overview: series.overview,
          first_air_date: series.first_air_date,
          number_of_seasons: series.number_of_seasons,
          number_of_episodes: series.number_of_episodes,
        };

        await setDoc(seriesRef, seriesData);
      }

      // Refresh the profile data
      await fetchSeriesProfile();
    } catch (err) {
      console.error("Error adding rating:", err);
      throw err;
    }
  };

  // Remove rating
  const removeRating = async (seriesId: string) => {
    if (!userId) return;

    try {
      // Remove rating from series
      const seriesRef = doc(db, "users", userId, "series", seriesId);
      const seriesDoc = await getDoc(seriesRef);

      if (seriesDoc.exists()) {
        await updateDoc(seriesRef, {
          rating: 0, // Set rating to 0 to indicate no rating
        });
      }

      // Refresh the profile data
      await fetchSeriesProfile();
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
          },
        ];
      }

      const response = await fetch(
        `/api/tmdb/proxy/search/tv?query=${encodeURIComponent(
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
          },
          {
            id: 2,
            name: "D.B. Weiss",
            profile_path: "/placeholder.jpg",
            known_for_department: "Writing",
          },
        ];
      }

      const response = await fetch(
        `/api/tmdb/proxy/search/person?query=${encodeURIComponent(
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
    oldId: string | number,
    newSeries: TMDBSeries
  ) => {
    if (!userId) return;

    try {
      // Find the "Watched" collection
      const collectionsRef = collection(
        db,
        "users",
        userId,
        "seriesCollections"
      );
      const collectionsSnapshot = await getDocs(collectionsRef);
      const watchedCollection = collectionsSnapshot.docs.find(
        (doc) => doc.data().name === "Watched"
      );

      if (!watchedCollection) {
        throw new Error("Watched collection not found");
      }

      // Delete the old series
      const oldSeriesRef = doc(db, "users", userId, "series", oldId);
      await deleteDoc(oldSeriesRef);

      // Create the new series with the same collections
      const newSeriesRef = doc(
        db,
        "users",
        userId,
        "series",
        newSeries.id.toString()
      );
      const seriesData = {
        id: newSeries.id,
        title: newSeries.name,
        year: new Date(newSeries.first_air_date).getFullYear(),
        cover: newSeries.poster_path,
        status: "Watched",
        rating: 0, // Don't set rating when replacing in collections
        notes: "",
        collections: [watchedCollection.id],
        overview: newSeries.overview,
        first_air_date: newSeries.first_air_date,
        number_of_seasons: newSeries.number_of_seasons,
        number_of_episodes: newSeries.number_of_episodes,
      };

      await setDoc(newSeriesRef, seriesData);

      // Refresh the profile data
      await fetchSeriesProfile();
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
      // Find the "Watchlist" collection
      const collectionsRef = collection(
        db,
        "users",
        userId,
        "seriesCollections"
      );
      const collectionsSnapshot = await getDocs(collectionsRef);
      const watchlistCollection = collectionsSnapshot.docs.find(
        (doc) => doc.data().name === "Watchlist"
      );

      if (!watchlistCollection) {
        throw new Error("Watchlist collection not found");
      }

      // Delete the old series
      const oldSeriesRef = doc(db, "users", userId, "series", oldId);
      await deleteDoc(oldSeriesRef);

      // Create the new series with the same collections
      const newSeriesRef = doc(
        db,
        "users",
        userId,
        "series",
        newSeries.id.toString()
      );
      const seriesData = {
        id: newSeries.id,
        title: newSeries.name,
        year: new Date(newSeries.first_air_date).getFullYear(),
        cover: newSeries.poster_path,
        status: "Watchlist",
        rating: 0, // Don't set rating when replacing in collections
        notes: "",
        collections: [watchlistCollection.id],
        overview: newSeries.overview,
        first_air_date: newSeries.first_air_date,
        number_of_seasons: newSeries.number_of_seasons,
        number_of_episodes: newSeries.number_of_episodes,
      };

      await setDoc(newSeriesRef, seriesData);

      // Refresh the profile data
      await fetchSeriesProfile();
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
      // Find the "Recommendations" collection
      const collectionsRef = collection(
        db,
        "users",
        userId,
        "seriesCollections"
      );
      const collectionsSnapshot = await getDocs(collectionsRef);
      const recommendationsCollection = collectionsSnapshot.docs.find(
        (doc) => doc.data().name === "Recommendations"
      );

      if (!recommendationsCollection) {
        throw new Error("Recommendations collection not found");
      }

      // Delete the old series
      const oldSeriesRef = doc(db, "users", userId, "series", oldId);
      await deleteDoc(oldSeriesRef);

      // Create the new series with the same collections
      const newSeriesRef = doc(
        db,
        "users",
        userId,
        "series",
        newSeries.id.toString()
      );
      const seriesData = {
        id: newSeries.id,
        title: newSeries.name,
        year: new Date(newSeries.first_air_date).getFullYear(),
        cover: newSeries.poster_path,
        status: "Recommendations",
        rating: 0, // Don't set rating when replacing in collections
        notes: "",
        collections: [recommendationsCollection.id],
        overview: newSeries.overview,
        first_air_date: newSeries.first_air_date,
        number_of_seasons: newSeries.number_of_seasons,
        number_of_episodes: newSeries.number_of_episodes,
      };

      await setDoc(newSeriesRef, seriesData);

      // Refresh the profile data
      await fetchSeriesProfile();
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
      // Find the "Watched" collection
      const collectionsRef = collection(
        db,
        "users",
        userId,
        "seriesCollections"
      );
      const collectionsSnapshot = await getDocs(collectionsRef);
      const watchedCollection = collectionsSnapshot.docs.find(
        (doc) => doc.data().name === "Watched"
      );

      if (!watchedCollection) {
        throw new Error("Watched collection not found");
      }

      // Delete the old series
      const oldSeriesRef = doc(db, "users", userId, "series", oldId);
      await deleteDoc(oldSeriesRef);

      // Create the new series with rating and Watched collection
      const newSeriesRef = doc(
        db,
        "users",
        userId,
        "series",
        newSeries.id.toString()
      );
      const seriesData = {
        id: newSeries.id,
        title: newSeries.name,
        year: new Date(newSeries.first_air_date).getFullYear(),
        cover: newSeries.poster_path,
        status: "Watched",
        rating: newRating,
        notes: "",
        collections: [watchedCollection.id],
        overview: newSeries.overview,
        first_air_date: newSeries.first_air_date,
        number_of_seasons: newSeries.number_of_seasons,
        number_of_episodes: newSeries.number_of_episodes,
      };

      await setDoc(newSeriesRef, seriesData);

      // Refresh the profile data
      await fetchSeriesProfile();
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
    removeRecentlyWatched,
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
