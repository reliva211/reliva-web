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
  getDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface TMDBMovie {
  id: string;
  title: string;
  year: number;
  cover: string;
  rating?: number;
  overview?: string;
  release_date?: string;
  vote_average?: number;
  vote_count?: number;
  genre_ids?: number[];
  genres?: string[];
  director?: string;
  cast?: string[];
  collections?: string[];
}

export interface MovieProfile {
  recentlyWatched: TMDBMovie[] | null;
  favoriteMovie: TMDBMovie | null;
  favoriteDirector: { id: string; name: string; image: string } | null;
  favoriteMovies: TMDBMovie[];
  watchlist: TMDBMovie[];
  recommendations: TMDBMovie[];
  ratings: Array<{ movie: TMDBMovie; rating: number }>;
}

export function useMovieProfile(userId: string | undefined) {
  const [movieProfile, setMovieProfile] = useState<MovieProfile>({
    recentlyWatched: [],
    favoriteMovie: null,
    favoriteDirector: null,
    favoriteMovies: [],
    watchlist: [],
    recommendations: [],
    ratings: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Ensure required collections exist
  const ensureCollectionsExist = async () => {
    if (!userId) return;

    try {
      const collectionsRef = collection(
        db,
        "users",
        userId,
        "movieCollections"
      );
      const collectionsSnapshot = await getDocs(collectionsRef);
      const existingCollections = collectionsSnapshot.docs.map(
        (doc) => doc.data().name
      );

      const requiredCollections = [
        { name: "Watched", description: "Movies you have watched" },
        { name: "Watching", description: "Movies you are currently watching" },
        { name: "Watchlist", description: "Movies you want to watch" },
        { name: "Recommendations", description: "Recommended movies" },
        { name: "Favorites", description: "Your favorite movies" },
      ];

      for (const collection of requiredCollections) {
        if (!existingCollections.includes(collection.name)) {
          await addDoc(collectionsRef, {
            name: collection.name,
            description: collection.description,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          console.log(`Created movie collection: ${collection.name}`);
        }
      }
    } catch (err) {
      console.error("Error ensuring movie collections exist:", err);
    }
  };

  // Fetch movie profile from Firebase using collection-based structure
  const fetchMovieProfile = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch movies from the same source as the movies page
      const moviesRef = collection(db, "users", userId, "movies");
      const moviesSnapshot = await getDocs(moviesRef);
      const moviesData = moviesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as any[];

      // Fetch collections to understand the structure
      const collectionsRef = collection(
        db,
        "users",
        userId,
        "movieCollections"
      );
      const collectionsSnapshot = await getDocs(collectionsRef);
      const collectionsData = collectionsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as any[];

      // Organize movies by collection names
      const watchedMovies = moviesData.filter((movie) =>
        movie.collections?.some((collectionId: string) => {
          const collection = collectionsData.find(
            (col) => col.id === collectionId
          );
          return collection?.name === "Watched";
        })
      );

      const watchingMovies = moviesData.filter((movie) =>
        movie.collections?.some((collectionId: string) => {
          const collection = collectionsData.find(
            (col) => col.id === collectionId
          );
          return collection?.name === "Watching";
        })
      );

      // Sort by date added (most recent first) and get only the latest item
      const sortedWatchedMovies = watchedMovies.sort((a, b) => {
        const dateA = new Date(a.dateAdded || a.createdAt || 0);
        const dateB = new Date(b.dateAdded || b.createdAt || 0);
        return dateB.getTime() - dateA.getTime();
      });

      const sortedWatchingMovies = watchingMovies.sort((a, b) => {
        const dateA = new Date(a.dateAdded || a.createdAt || 0);
        const dateB = new Date(b.dateAdded || b.createdAt || 0);
        return dateB.getTime() - dateA.getTime();
      });

      const watchlistMovies = moviesData.filter((movie) =>
        movie.collections?.some((collectionId: string) => {
          const collection = collectionsData.find(
            (col) => col.id === collectionId
          );
          return collection?.name === "Watchlist";
        })
      );

      const recommendationsMovies = moviesData.filter((movie) =>
        movie.collections?.some((collectionId: string) => {
          const collection = collectionsData.find(
            (col) => col.id === collectionId
          );
          return collection?.name === "Recommendations";
        })
      );

      const favoritesMovies = moviesData.filter((movie) =>
        movie.collections?.some((collectionId: string) => {
          const collection = collectionsData.find(
            (col) => col.id === collectionId
          );
          return collection?.name === "Favorites";
        })
      );

      const ratingsMovies = moviesData.filter((movie) =>
        movie.collections?.some((collectionId: string) => {
          const collection = collectionsData.find(
            (col) => col.id === collectionId
          );
          return collection?.name === "Ratings";
        })
      );

      // Convert movie data to TMDBMovie format
      const convertToTMDBMovie = (movie: any): TMDBMovie => ({
        id: String(movie.id || ""),
        title: movie.title || "",
        year: movie.year || 0,
        cover: movie.cover || "",
        rating: movie.rating || 0,
        overview: movie.overview || "",
        release_date: movie.release_date || "",
        vote_average: movie.vote_average || 0,
        vote_count: movie.vote_count || 0,
        genre_ids: Array.isArray(movie.genre_ids) ? movie.genre_ids : [],
        genres: Array.isArray(movie.genres) ? movie.genres : [],
        director: movie.director || "",
        cast: Array.isArray(movie.cast) ? movie.cast : [],
        collections: movie.collections || [],
      });

      // Create movie profile from the fetched data
      const profile: MovieProfile = {
        recentlyWatched:
          sortedWatchedMovies.length > 0
            ? sortedWatchedMovies.map(convertToTMDBMovie)
            : [], // All watched movies
        favoriteMovie:
          favoritesMovies.length > 0
            ? convertToTMDBMovie(favoritesMovies[0])
            : null,
        favoriteDirector: null, // This would need separate logic
        favoriteMovies: favoritesMovies.map(convertToTMDBMovie),
        watchlist: watchlistMovies.map(convertToTMDBMovie),
        recommendations: recommendationsMovies.map(convertToTMDBMovie),
        ratings: ratingsMovies.map((movie) => ({
          movie: convertToTMDBMovie(movie),
          rating: movie.rating || 0,
        })),
      };

      // Also fetch movie reviews to get ratings
      try {
        const reviewsRef = collection(db, "reviews");
        const reviewsSnapshot = await getDocs(
          query(
            reviewsRef,
            where("userId", "==", userId),
            where("mediaType", "==", "movie")
          )
        );

        const movieReviews = reviewsSnapshot.docs.map((reviewDoc) => {
          const reviewData = reviewDoc.data() as any;
          return {
            movie: {
              id: reviewData.mediaId || reviewDoc.id,
              title: reviewData.mediaTitle || "",
              year: reviewData.mediaYear || 0,
              cover: reviewData.mediaCover || "",
              rating: reviewData.rating || 0,
              overview: reviewData.reviewText || "",
              release_date: "",
              vote_average: 0,
              vote_count: 0,
              genre_ids: [],
              genres: [],
              director: "",
              cast: [],
            },
            rating: reviewData.rating || 0,
          };
        });

        // Merge with existing ratings and deduplicate by movie ID
        const allRatings = [...profile.ratings, ...movieReviews];
        const seenMovieIds = new Set();
        profile.ratings = allRatings.filter((rating) => {
          if (seenMovieIds.has(rating.movie.id)) {
            return false;
          }
          seenMovieIds.add(rating.movie.id);
          return true;
        });
      } catch (reviewError) {
        console.log("Could not fetch movie reviews:", reviewError);
      }

      setMovieProfile(profile);
    } catch (err) {
      console.error("Error fetching movie profile:", err);
      setError("Failed to fetch movie profile");
    } finally {
      setLoading(false);
    }
  };

  // Update recently watched movies
  const updateRecentlyWatched = async (movie: TMDBMovie) => {
    if (!userId) return;

    // Ensure movie.id is a valid string
    if (!movie.id || typeof movie.id !== "string") {
      console.error("Invalid movie ID:", movie.id);
      throw new Error("Invalid movie ID provided");
    }

    try {
      // Find the "Watched" collection (for recently watched)
      const collectionsRef = collection(
        db,
        "users",
        userId,
        "movieCollections"
      );
      const collectionsSnapshot = await getDocs(collectionsRef);
      const watchedCollection = collectionsSnapshot.docs.find(
        (doc) => doc.data().name === "Watched"
      );

      if (!watchedCollection) {
        throw new Error("Watched collection not found");
      }

      // Check if movie already exists
      const movieRef = doc(db, "users", userId, "movies", movie.id);
      const movieDoc = await getDoc(movieRef);

      if (movieDoc.exists()) {
        // Update existing movie with Watched collection
        const existingData = movieDoc.data();
        const updatedCollections = existingData.collections?.includes(
          watchedCollection.id
        )
          ? existingData.collections
          : [...(existingData.collections || []), watchedCollection.id];

        await updateDoc(movieRef, {
          collections: updatedCollections,
        });
      } else {
        // Create new movie with Watched collection
        const movieData = {
          id: movie.id,
          title: movie.title,
          year: movie.year,
          cover: movie.cover,
          status: "Watched",
          rating: 0, // Don't set rating for recently watched movies
          notes: "",
          collections: [watchedCollection.id],
          overview: movie.overview,
          release_date: movie.release_date,
          vote_average: movie.vote_average,
          vote_count: movie.vote_count,
          genre_ids: movie.genre_ids,
          genres: movie.genres,
          director: movie.director,
          cast: movie.cast,
        };

        await setDoc(movieRef, movieData);
      }

      // Refresh the profile data
      await fetchMovieProfile();
    } catch (err) {
      console.error("Error updating recently watched:", err);
      throw err;
    }
  };

  // Remove from recently watched movies
  const removeRecentlyWatched = async (movieId: string) => {
    if (!userId) return;

    try {
      // Find the "Watched" collection
      const collectionsRef = collection(
        db,
        "users",
        userId,
        "movieCollections"
      );
      const collectionsSnapshot = await getDocs(collectionsRef);
      const watchedCollection = collectionsSnapshot.docs.find(
        (doc) => doc.data().name === "Watched"
      );

      if (!watchedCollection) {
        throw new Error("Watched collection not found");
      }

      // Remove movie from Watched collection
      const movieRef = doc(db, "users", userId, "movies", movieId);
      const movieDoc = await getDoc(movieRef);

      if (movieDoc.exists()) {
        const existingData = movieDoc.data();
        const updatedCollections =
          existingData.collections?.filter(
            (id: string) => id !== watchedCollection.id
          ) || [];

        if (updatedCollections.length === 0) {
          // Remove movie entirely if no collections left
          await deleteDoc(movieRef);
        } else {
          // Update movie with remaining collections
          await updateDoc(movieRef, {
            collections: updatedCollections,
          });
        }
      }

      // Refresh the profile data
      await fetchMovieProfile();
    } catch (err) {
      console.error("Error removing from recently watched:", err);
      throw err;
    }
  };

  // Update favorite movie
  const updateFavoriteMovie = async (movie: TMDBMovie) => {
    if (!userId) return;

    // Ensure movie.id is a valid string
    if (!movie.id || typeof movie.id !== "string") {
      console.error("Invalid movie ID:", movie.id);
      throw new Error("Invalid movie ID provided");
    }

    try {
      // Find the "Favorites" collection
      const collectionsRef = collection(
        db,
        "users",
        userId,
        "movieCollections"
      );
      const collectionsSnapshot = await getDocs(collectionsRef);
      const favoritesCollection = collectionsSnapshot.docs.find(
        (doc) => doc.data().name === "Favorites"
      );

      if (!favoritesCollection) {
        throw new Error("Favorites collection not found");
      }

      // Check if movie already exists
      const movieRef = doc(db, "users", userId, "movies", movie.id);
      const movieDoc = await getDoc(movieRef);

      if (movieDoc.exists()) {
        // Update existing movie with Favorites collection
        const existingData = movieDoc.data();
        const updatedCollections = existingData.collections?.includes(
          favoritesCollection.id
        )
          ? existingData.collections
          : [...(existingData.collections || []), favoritesCollection.id];

        await updateDoc(movieRef, {
          collections: updatedCollections,
        });
      } else {
        // Create new movie with Favorites collection
        const movieData = {
          id: movie.id,
          title: movie.title,
          year: movie.year,
          cover: movie.cover,
          status: "Favorites",
          rating: movie.rating || 0,
          notes: "",
          collections: [favoritesCollection.id],
          overview: movie.overview,
          release_date: movie.release_date,
          vote_average: movie.vote_average,
          vote_count: movie.vote_count,
          genre_ids: movie.genre_ids,
          genres: movie.genres,
          director: movie.director,
          cast: movie.cast,
        };

        await setDoc(movieRef, movieData);
      }

      // Refresh the profile data
      await fetchMovieProfile();
    } catch (err) {
      console.error("Error updating favorite movie:", err);
      throw err;
    }
  };

  // Update favorite director
  const updateFavoriteDirector = async (director: {
    id: string;
    name: string;
    image: string;
  }) => {
    if (!userId) return;

    try {
      await updateDoc(doc(db, "movieProfiles", userId), {
        favoriteDirector: director,
      });

      setMovieProfile((prev) => ({ ...prev, favoriteDirector: director }));
    } catch (err) {
      console.error("Error updating favorite director:", err);
      throw err;
    }
  };

  // Add to favorite movies (Favorites collection)
  const addFavoriteMovie = async (movie: TMDBMovie) => {
    if (!userId) return;

    // Ensure movie.id is a valid string
    const movieIdStr = String(movie.id || "");
    if (!movieIdStr || movieIdStr.trim() === "") {
      console.error("Invalid movie ID:", movie.id);
      throw new Error("Invalid movie ID provided");
    }

    try {
      // First, find the "Favorites" collection
      const collectionsRef = collection(
        db,
        "users",
        userId,
        "movieCollections"
      );
      const collectionsSnapshot = await getDocs(collectionsRef);
      const favoritesCollection = collectionsSnapshot.docs.find(
        (doc) => doc.data().name === "Favorites"
      );

      if (!favoritesCollection) {
        throw new Error("Favorites collection not found");
      }

      // Check if movie already exists
      const movieRef = doc(db, "users", userId, "movies", movieIdStr);
      const movieDoc = await getDoc(movieRef);

      if (movieDoc.exists()) {
        // Update existing movie with Favorites collection
        const existingData = movieDoc.data();
        const updatedCollections = [
          ...(existingData.collections || []),
          favoritesCollection.id,
        ];
        await updateDoc(movieRef, {
          collections: updatedCollections,
        });
      } else {
        // Create new movie with Favorites collection
        const movieData = {
          id: movieIdStr,
          title: movie.title,
          year: movie.year,
          cover: movie.cover,
          status: "Favorites",
          rating: movie.rating || 0,
          notes: "",
          collections: [favoritesCollection.id],
          overview: movie.overview,
          release_date: movie.release_date,
          vote_average: movie.vote_average,
          vote_count: movie.vote_count,
          genre_ids: movie.genre_ids,
          genres: movie.genres,
          director: movie.director,
          cast: movie.cast,
        };

        await setDoc(movieRef, movieData);
      }

      // Refresh the profile data
      await fetchMovieProfile();
    } catch (err) {
      console.error("Error adding favorite movie:", err);
      throw err;
    }
  };

  // Remove from favorite movies (Favorites collection)
  const removeFavoriteMovie = async (movieId: string | number) => {
    if (!userId) return;

    // Ensure movieId is a string for Firebase document reference
    const movieIdStr = String(movieId);

    if (!movieIdStr || movieIdStr.trim() === "") {
      console.error("Invalid movie ID for removal:", movieId);
      return;
    }

    try {
      // Find the "Favorites" collection
      const collectionsRef = collection(
        db,
        "users",
        userId,
        "movieCollections"
      );
      const collectionsSnapshot = await getDocs(collectionsRef);
      const favoritesCollection = collectionsSnapshot.docs.find(
        (doc) => doc.data().name === "Favorites"
      );

      if (!favoritesCollection) {
        throw new Error("Favorites collection not found");
      }

      // Remove movie from Favorites collection
      const movieRef = doc(db, "users", userId, "movies", movieIdStr);
      const movieDoc = await getDoc(movieRef);

      if (movieDoc.exists()) {
        const existingData = movieDoc.data();
        const updatedCollections =
          existingData.collections?.filter(
            (id: string) => id !== favoritesCollection.id
          ) || [];

        if (updatedCollections.length === 0) {
          // Remove movie entirely if no collections left
          await deleteDoc(movieRef);
        } else {
          // Update movie with remaining collections
          await updateDoc(movieRef, {
            collections: updatedCollections,
          });
        }
      } else {
        console.warn(`Movie with ID ${movieIdStr} not found in database`);
      }

      // Refresh the profile data
      await fetchMovieProfile();
    } catch (err) {
      console.error("Error removing favorite movie:", err);
      throw err;
    }
  };

  // Add to watchlist (Watchlist collection)
  const addToWatchlist = async (movie: TMDBMovie) => {
    if (!userId) return;

    try {
      // Find the "Watchlist" collection
      const collectionsRef = collection(
        db,
        "users",
        userId,
        "movieCollections"
      );
      const collectionsSnapshot = await getDocs(collectionsRef);
      const watchlistCollection = collectionsSnapshot.docs.find(
        (doc) => doc.data().name === "Watchlist"
      );

      if (!watchlistCollection) {
        throw new Error("Watchlist collection not found");
      }

      // Check if movie already exists
      const movieRef = doc(db, "users", userId, "movies", movie.id);
      const movieDoc = await getDoc(movieRef);

      if (movieDoc.exists()) {
        // Update existing movie with Watchlist collection
        const existingData = movieDoc.data();
        const updatedCollections = [
          ...(existingData.collections || []),
          watchlistCollection.id,
        ];
        await updateDoc(movieRef, {
          collections: updatedCollections,
        });
      } else {
        // Create new movie with Watchlist collection
        const movieData = {
          id: movie.id,
          title: movie.title,
          year: movie.year,
          cover: movie.cover,
          status: "Watchlist",
          rating: movie.rating || 0,
          notes: "",
          collections: [watchlistCollection.id],
          overview: movie.overview,
          release_date: movie.release_date,
          vote_average: movie.vote_average,
          vote_count: movie.vote_count,
          genre_ids: movie.genre_ids,
          genres: movie.genres,
          director: movie.director,
          cast: movie.cast,
        };

        await setDoc(movieRef, movieData);
      }

      // Refresh the profile data
      await fetchMovieProfile();
    } catch (err) {
      console.error("Error adding to watchlist:", err);
      throw err;
    }
  };

  // Remove from watchlist (Watchlist collection)
  const removeFromWatchlist = async (movieId: string) => {
    if (!userId) return;

    try {
      // Find the "Watchlist" collection
      const collectionsRef = collection(
        db,
        "users",
        userId,
        "movieCollections"
      );
      const collectionsSnapshot = await getDocs(collectionsRef);
      const watchlistCollection = collectionsSnapshot.docs.find(
        (doc) => doc.data().name === "Watchlist"
      );

      if (!watchlistCollection) {
        throw new Error("Watchlist collection not found");
      }

      // Remove movie from Watchlist collection
      const movieRef = doc(db, "users", userId, "movies", movieId);
      const movieDoc = await getDoc(movieRef);

      if (movieDoc.exists()) {
        const existingData = movieDoc.data();
        const updatedCollections =
          existingData.collections?.filter(
            (id: string) => id !== watchlistCollection.id
          ) || [];

        if (updatedCollections.length === 0) {
          // Remove movie entirely if no collections left
          await deleteDoc(movieRef);
        } else {
          // Update movie with remaining collections
          await updateDoc(movieRef, {
            collections: updatedCollections,
          });
        }
      }

      // Refresh the profile data
      await fetchMovieProfile();
    } catch (err) {
      console.error("Error removing from watchlist:", err);
      throw err;
    }
  };

  // Add recommendation (Recommendations collection)
  const addRecommendation = async (movie: TMDBMovie) => {
    if (!userId) return;

    try {
      // Find the "Recommendations" collection
      const collectionsRef = collection(
        db,
        "users",
        userId,
        "movieCollections"
      );
      const collectionsSnapshot = await getDocs(collectionsRef);
      const recommendationsCollection = collectionsSnapshot.docs.find(
        (doc) => doc.data().name === "Recommendations"
      );

      if (!recommendationsCollection) {
        throw new Error("Recommendations collection not found");
      }

      // Check if movie already exists
      const movieRef = doc(db, "users", userId, "movies", movie.id);
      const movieDoc = await getDoc(movieRef);

      if (movieDoc.exists()) {
        // Update existing movie with Recommendations collection
        const existingData = movieDoc.data();
        const updatedCollections = [
          ...(existingData.collections || []),
          recommendationsCollection.id,
        ];
        await updateDoc(movieRef, {
          collections: updatedCollections,
        });
      } else {
        // Create new movie with Recommendations collection
        const movieData = {
          id: movie.id,
          title: movie.title,
          year: movie.year,
          cover: movie.cover,
          status: "Recommendations",
          rating: movie.rating || 0,
          notes: "",
          collections: [recommendationsCollection.id],
          overview: movie.overview,
          release_date: movie.release_date,
          vote_average: movie.vote_average,
          vote_count: movie.vote_count,
          genre_ids: movie.genre_ids,
          genres: movie.genres,
          director: movie.director,
          cast: movie.cast,
        };

        await setDoc(movieRef, movieData);
      }

      // Also add to the public movieRecommendations subcollection for other users to see
      try {
        const movieRecommendationsRef = collection(
          db,
          "users",
          userId,
          "movieRecommendations"
        );
        await setDoc(doc(movieRecommendationsRef, String(movie.id)), {
          id: movie.id,
          title: movie.title,
          year: movie.year,
          cover: movie.cover,
          overview: movie.overview,
          release_date: movie.release_date,
          vote_average: movie.vote_average,
          vote_count: movie.vote_count,
          genre_ids: movie.genre_ids,
          genres: movie.genres,
          director: movie.director,
          cast: movie.cast,
          addedAt: new Date(),
          isPublic: true,
        });
      } catch (subcollectionError) {
        console.error(
          "Error adding to movieRecommendations subcollection:",
          subcollectionError
        );
        // Don't throw here, as the main recommendation was added successfully
      }

      // Refresh the profile data
      await fetchMovieProfile();
    } catch (err) {
      console.error("Error adding recommendation:", err);
      throw err;
    }
  };

  // Remove recommendation (Recommendations collection)
  const removeRecommendation = async (movieId: string) => {
    if (!userId) return;

    try {
      // Find the "Recommendations" collection
      const collectionsRef = collection(
        db,
        "users",
        userId,
        "movieCollections"
      );
      const collectionsSnapshot = await getDocs(collectionsRef);
      const recommendationsCollection = collectionsSnapshot.docs.find(
        (doc) => doc.data().name === "Recommendations"
      );

      if (!recommendationsCollection) {
        throw new Error("Recommendations collection not found");
      }

      // Remove movie from Recommendations collection
      const movieRef = doc(db, "users", userId, "movies", movieId);
      const movieDoc = await getDoc(movieRef);

      if (movieDoc.exists()) {
        const existingData = movieDoc.data();
        const updatedCollections =
          existingData.collections?.filter(
            (id: string) => id !== recommendationsCollection.id
          ) || [];

        if (updatedCollections.length === 0) {
          // Remove movie entirely if no collections left
          await deleteDoc(movieRef);
        } else {
          // Update movie with remaining collections
          await updateDoc(movieRef, {
            collections: updatedCollections,
          });
        }
      }

      // Also remove from the public movieRecommendations subcollection
      try {
        const movieRecommendationsRef = collection(
          db,
          "users",
          userId,
          "movieRecommendations"
        );
        await deleteDoc(doc(movieRecommendationsRef, String(movieId)));
      } catch (subcollectionError) {
        console.error(
          "Error removing from movieRecommendations subcollection:",
          subcollectionError
        );
        // Don't throw here, as the main recommendation was removed successfully
      }

      // Refresh the profile data
      await fetchMovieProfile();
    } catch (err) {
      console.error("Error removing recommendation:", err);
      throw err;
    }
  };

  // Add rating (Ratings collection)
  const addRating = async (movie: TMDBMovie, rating: number) => {
    if (!userId) return;

    try {
      // Find the "Ratings" collection
      const collectionsRef = collection(
        db,
        "users",
        userId,
        "movieCollections"
      );
      const collectionsSnapshot = await getDocs(collectionsRef);
      const ratingsCollection = collectionsSnapshot.docs.find(
        (doc) => doc.data().name === "Ratings"
      );

      if (!ratingsCollection) {
        throw new Error("Ratings collection not found");
      }

      // Check if movie already exists
      const movieRef = doc(db, "users", userId, "movies", movie.id);
      const movieDoc = await getDoc(movieRef);

      if (movieDoc.exists()) {
        // Update existing movie with Ratings collection and rating
        const existingData = movieDoc.data();
        const updatedCollections = existingData.collections?.includes(
          ratingsCollection.id
        )
          ? existingData.collections
          : [...(existingData.collections || []), ratingsCollection.id];

        await updateDoc(movieRef, {
          collections: updatedCollections,
          rating: rating,
        });
      } else {
        // Create new movie with Ratings collection
        const movieData = {
          id: movie.id,
          title: movie.title,
          year: movie.year,
          cover: movie.cover,
          status: "Ratings",
          rating: rating,
          notes: "",
          collections: [ratingsCollection.id],
          overview: movie.overview,
          release_date: movie.release_date,
          vote_average: movie.vote_average,
          vote_count: movie.vote_count,
          genre_ids: movie.genre_ids,
          genres: movie.genres,
          director: movie.director,
          cast: movie.cast,
        };

        await setDoc(movieRef, movieData);
      }

      // Refresh the profile data
      await fetchMovieProfile();
    } catch (err) {
      console.error("Error adding rating:", err);
      throw err;
    }
  };

  // Remove rating (Ratings collection)
  const removeRating = async (movieId: string) => {
    if (!userId) return;

    try {
      // Find the "Ratings" collection
      const collectionsRef = collection(
        db,
        "users",
        userId,
        "movieCollections"
      );
      const collectionsSnapshot = await getDocs(collectionsRef);
      const ratingsCollection = collectionsSnapshot.docs.find(
        (doc) => doc.data().name === "Ratings"
      );

      if (!ratingsCollection) {
        throw new Error("Ratings collection not found");
      }

      // Remove movie from Ratings collection
      const movieRef = doc(db, "users", userId, "movies", movieId);
      const movieDoc = await getDoc(movieRef);

      if (movieDoc.exists()) {
        const existingData = movieDoc.data();
        const updatedCollections =
          existingData.collections?.filter(
            (id: string) => id !== ratingsCollection.id
          ) || [];

        if (updatedCollections.length === 0) {
          // Remove movie entirely if no collections left
          await deleteDoc(movieRef);
        } else {
          // Update movie with remaining collections
          await updateDoc(movieRef, {
            collections: updatedCollections,
          });
        }
      }

      // Refresh the profile data
      await fetchMovieProfile();
    } catch (err) {
      console.error("Error removing rating:", err);
      throw err;
    }
  };

  // Replace functions for editing items
  const replaceFavoriteMovie = async (
    oldId: string | number,
    newMovie: TMDBMovie
  ) => {
    if (!oldId || !newMovie?.id) {
      console.warn("Invalid parameters for replaceFavoriteMovie:", {
        oldId,
        newMovie,
      });
      return;
    }

    try {
      // Remove old movie from Favorites collection
      await removeFavoriteMovie(oldId);

      // Add new movie to Favorites collection
      await addFavoriteMovie(newMovie);
    } catch (err) {
      console.error("Error replacing favorite movie:", err);
      throw err;
    }
  };

  const replaceWatchlistMovie = async (oldId: string, newMovie: TMDBMovie) => {
    if (!oldId || !newMovie?.id) {
      console.warn("Invalid parameters for replaceWatchlistMovie:", {
        oldId,
        newMovie,
      });
      return;
    }

    try {
      // Remove old movie from Watchlist collection
      await removeFromWatchlist(oldId);

      // Add new movie to Watchlist collection
      await addToWatchlist(newMovie);
    } catch (err) {
      console.error("Error replacing watchlist movie:", err);
      throw err;
    }
  };

  const replaceRecommendation = async (oldId: string, newMovie: TMDBMovie) => {
    if (!oldId || !newMovie?.id) {
      console.warn("Invalid parameters for replaceRecommendation:", {
        oldId,
        newMovie,
      });
      return;
    }

    try {
      // Remove old movie from Recommendations collection
      await removeRecommendation(oldId);

      // Add new movie to Recommendations collection
      await addRecommendation(newMovie);
    } catch (err) {
      console.error("Error replacing recommendation:", err);
      throw err;
    }
  };

  const replaceRating = async (
    oldId: string,
    newMovie: TMDBMovie,
    rating: number
  ) => {
    if (!oldId || !newMovie?.id) {
      console.warn("Invalid parameters for replaceRating:", {
        oldId,
        newMovie,
      });
      return;
    }

    try {
      // Remove old movie from Ratings collection
      await removeRating(oldId);

      // Add new movie to Ratings collection with rating
      await addRating(newMovie, rating);
    } catch (err) {
      console.error("Error replacing rating:", err);
      throw err;
    }
  };

  // Search functionality using TMDB API
  const searchMovie = async (query: string, limit: number = 10) => {
    try {
      console.log("Searching for movie:", query);
      const response = await fetch(
        `/api/tmdb/search?q=${encodeURIComponent(query)}&type=movie`
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("TMDB API response error:", response.status, errorText);
        // Return empty array instead of throwing error
        return [];
      }

      const data = await response.json();
      console.log("TMDB search results:", data);

      // If there's an error but we have fallback data, use it
      if (data.error && !data.fallback) {
        console.warn("Search error with no fallback:", data.error);
        return [];
      }

      // Return results or empty array if no results
      return (data.results || []).slice(0, limit);
    } catch (err) {
      console.error("Search error:", err);
      // Return empty array instead of throwing error to prevent UI crashes
      return [];
    }
  };

  // Search for directors/people
  const searchDirector = async (query: string, limit: number = 10) => {
    try {
      console.log("Searching for director:", query);
      const response = await fetch(
        `/api/tmdb/search?q=${encodeURIComponent(query)}&type=person`
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("TMDB API response error:", response.status, errorText);
        // Return empty array instead of throwing error
        return [];
      }

      const data = await response.json();
      console.log("TMDB director search results:", data);

      // If there's an error but we have fallback data, use it
      if (data.error && !data.fallback) {
        console.warn("Search error with no fallback:", data.error);
        return [];
      }

      // Return results or empty array if no results
      return (data.results || []).slice(0, limit);
    } catch (err) {
      console.error("Search error:", err);
      // Return empty array instead of throwing error to prevent UI crashes
      return [];
    }
  };

  // Initialize on mount
  useEffect(() => {
    const initializeProfile = async () => {
      await ensureCollectionsExist();
      await fetchMovieProfile();
    };
    initializeProfile();
  }, [userId]);

  return {
    movieProfile,
    loading,
    error,
    updateRecentlyWatched,
    removeRecentlyWatched,
    updateFavoriteMovie,
    updateFavoriteDirector,
    addFavoriteMovie,
    removeFavoriteMovie,
    replaceFavoriteMovie,
    addToWatchlist,
    removeFromWatchlist,
    replaceWatchlistMovie,
    addRecommendation,
    removeRecommendation,
    replaceRecommendation,
    addRating,
    removeRating,
    replaceRating,
    searchMovie,
    searchDirector,
    refreshProfile: fetchMovieProfile,
  };
}
