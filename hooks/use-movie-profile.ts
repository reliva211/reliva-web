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
import { searchMovies } from "@/lib/tmdb";

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

  // Fetch movie profile from Firebase
  const fetchMovieProfile = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const movieCollection = collection(db, "users", userId, "movies");
      const movieSnapshot = await getDocs(movieCollection);

      if (!movieSnapshot.empty) {
        const movieData = movieSnapshot.docs[0].data();

        // Validate and sanitize the data
        const validatedProfile = {
          recentlyWatched: Array.isArray(movieData.recentlyWatched)
            ? movieData.recentlyWatched.filter(
                (movie) => movie && typeof movie === "object"
              )
            : movieData.recentlyWatched &&
              typeof movieData.recentlyWatched === "object"
            ? [movieData.recentlyWatched]
            : [],
          favoriteMovie:
            movieData.favoriteMovie &&
            typeof movieData.favoriteMovie === "object"
              ? movieData.favoriteMovie
              : null,
          favoriteDirector:
            movieData.favoriteDirector &&
            typeof movieData.favoriteDirector === "object"
              ? movieData.favoriteDirector
              : null,
          favoriteMovies: Array.isArray(movieData.favoriteMovies)
            ? movieData.favoriteMovies.filter(
                (movie) => movie && typeof movie === "object"
              )
            : [],
          watchlist: Array.isArray(movieData.watchlist)
            ? movieData.watchlist.filter(
                (movie) => movie && typeof movie === "object"
              )
            : [],
          recommendations: Array.isArray(movieData.recommendations)
            ? movieData.recommendations.filter(
                (movie) => movie && typeof movie === "object"
              )
            : [],
          ratings: Array.isArray(movieData.ratings)
            ? movieData.ratings.filter(
                (rating) =>
                  rating &&
                  typeof rating === "object" &&
                  rating.movie &&
                  rating.rating
              )
            : [],
        };

        setMovieProfile(validatedProfile);
      }
    } catch (err) {
      console.error("Error fetching movie profile:", err);
      setError("Failed to fetch movie profile");
      // Set default state on error
      setMovieProfile({
        recentlyWatched: [],
        favoriteMovie: null,
        favoriteDirector: null,
        favoriteMovies: [],
        watchlist: [],
        recommendations: [],
        ratings: [],
      });
    } finally {
      setLoading(false);
    }
  };

  // Helper function to sanitize movie data for Firebase
  const sanitizeMovieData = (movie: any): TMDBMovie => {
    return {
      id: movie.id || "",
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
    };
  };

  // Helper function to sanitize profile data for Firebase
  const sanitizeProfileData = (
    profile: Partial<MovieProfile>
  ): Partial<MovieProfile> => {
    const sanitized: any = {};

    if (profile.recentlyWatched) {
      if (Array.isArray(profile.recentlyWatched)) {
        sanitized.recentlyWatched =
          profile.recentlyWatched.map(sanitizeMovieData);
      } else {
        sanitized.recentlyWatched = [
          sanitizeMovieData(profile.recentlyWatched),
        ];
      }
    }

    if (profile.favoriteMovie) {
      sanitized.favoriteMovie = sanitizeMovieData(profile.favoriteMovie);
    }

    if (profile.favoriteDirector) {
      sanitized.favoriteDirector = {
        id: profile.favoriteDirector.id || "",
        name: profile.favoriteDirector.name || "",
        image: profile.favoriteDirector.image || "",
      };
    }

    if (Array.isArray(profile.favoriteMovies)) {
      sanitized.favoriteMovies = profile.favoriteMovies.map(sanitizeMovieData);
    }

    if (Array.isArray(profile.watchlist)) {
      sanitized.watchlist = profile.watchlist.map(sanitizeMovieData);
    }

    if (Array.isArray(profile.recommendations)) {
      sanitized.recommendations =
        profile.recommendations.map(sanitizeMovieData);
    }

    if (Array.isArray(profile.ratings)) {
      sanitized.ratings = profile.ratings.map((rating) => ({
        movie: sanitizeMovieData(rating.movie),
        rating: rating.rating || 0,
      }));
    }

    return sanitized;
  };

  // Save movie profile to Firebase
  const saveMovieProfile = async (profile: Partial<MovieProfile>) => {
    if (!userId) {
      console.error("No user ID provided for saving movie profile");
      throw new Error("User not authenticated");
    }

    try {
      console.log("Saving movie profile:", profile);
      const movieCollection = collection(db, "users", userId, "movies");
      const movieSnapshot = await getDocs(movieCollection);

      // Sanitize the profile data before saving
      const sanitizedProfile = sanitizeProfileData(profile);
      const updatedProfile = { ...movieProfile, ...sanitizedProfile };
      console.log("Sanitized profile:", updatedProfile);

      if (movieSnapshot.empty) {
        // Create new document
        console.log("Creating new movie profile document");
        await addDoc(movieCollection, updatedProfile);
      } else {
        // Update existing document
        console.log("Updating existing movie profile document");
        const docRef = doc(
          db,
          "users",
          userId,
          "movies",
          movieSnapshot.docs[0].id
        );
        await setDoc(docRef, updatedProfile, { merge: true });
      }

      setMovieProfile(updatedProfile);
      console.log("Movie profile saved successfully");
    } catch (err) {
      console.error("Error saving movie profile:", err);
      setError("Failed to save movie profile");
      throw err; // Re-throw to let component handle it
    }
  };

  // Update specific movie items
  const updateRecentlyWatched = async (movie: TMDBMovie) => {
    const currentRecentlyWatched = movieProfile.recentlyWatched || [];
    const updatedRecentlyWatched = Array.isArray(currentRecentlyWatched)
      ? [...currentRecentlyWatched]
      : [];

    const existingIndex = updatedRecentlyWatched.findIndex(
      (m) => m.id === movie.id
    );

    if (existingIndex !== -1) {
      // Move to front if already exists
      updatedRecentlyWatched.splice(existingIndex, 1);
    }

    // Add to front of the list
    updatedRecentlyWatched.unshift(movie);

    // Keep only 10 recently watched movies
    const finalRecentlyWatched = updatedRecentlyWatched.slice(0, 10);
    await saveMovieProfile({ recentlyWatched: finalRecentlyWatched });
  };

  const updateFavoriteMovie = async (movie: TMDBMovie) => {
    await saveMovieProfile({ favoriteMovie: movie });
  };

  const updateFavoriteDirector = async (director: {
    id: string;
    name: string;
    image: string;
  }) => {
    await saveMovieProfile({ favoriteDirector: director });
  };

  const addFavoriteMovie = async (movie: TMDBMovie) => {
    const updatedMovies = [...movieProfile.favoriteMovies];
    const existingIndex = updatedMovies.findIndex((m) => m.id === movie.id);

    if (existingIndex !== -1) {
      updatedMovies[existingIndex] = movie;
    } else {
      updatedMovies.push(movie);
    }

    // Keep only 15 movies
    const finalMovies = updatedMovies.slice(0, 15);
    await saveMovieProfile({ favoriteMovies: finalMovies });
  };

  const removeFavoriteMovie = async (movieId: string) => {
    const updatedMovies = movieProfile.favoriteMovies.filter(
      (m) => m.id !== movieId
    );
    await saveMovieProfile({ favoriteMovies: updatedMovies });
  };

  const addToWatchlist = async (movie: TMDBMovie) => {
    const updatedWatchlist = [...movieProfile.watchlist];
    const existingIndex = updatedWatchlist.findIndex((m) => m.id === movie.id);

    if (existingIndex !== -1) {
      updatedWatchlist[existingIndex] = movie;
    } else {
      updatedWatchlist.push(movie);
    }

    // Keep only 15 movies
    const finalWatchlist = updatedWatchlist.slice(0, 15);
    await saveMovieProfile({ watchlist: finalWatchlist });
  };

  const removeFromWatchlist = async (movieId: string) => {
    const updatedWatchlist = movieProfile.watchlist.filter(
      (m) => m.id !== movieId
    );
    await saveMovieProfile({ watchlist: updatedWatchlist });
  };

  const addRecommendation = async (movie: TMDBMovie) => {
    const updatedRecommendations = [...movieProfile.recommendations];
    const existingIndex = updatedRecommendations.findIndex(
      (m) => m.id === movie.id
    );

    if (existingIndex !== -1) {
      updatedRecommendations[existingIndex] = movie;
    } else {
      updatedRecommendations.push(movie);
    }

    // Keep only 15 recommendations
    const finalRecommendations = updatedRecommendations.slice(0, 15);
    await saveMovieProfile({ recommendations: finalRecommendations });
  };

  const removeRecommendation = async (movieId: string) => {
    const updatedRecommendations = movieProfile.recommendations.filter(
      (m) => m.id !== movieId
    );
    await saveMovieProfile({ recommendations: updatedRecommendations });
  };

  const addRating = async (movie: TMDBMovie, rating: number) => {
    const updatedRatings = [...movieProfile.ratings];
    const existingIndex = updatedRatings.findIndex(
      (r) => r.movie.id === movie.id
    );

    if (existingIndex !== -1) {
      updatedRatings[existingIndex] = { movie, rating };
    } else {
      updatedRatings.push({ movie, rating });
    }

    // Keep only 15 ratings
    const finalRatings = updatedRatings.slice(0, 15);
    await saveMovieProfile({ ratings: finalRatings });
  };

  const removeRating = async (movieId: string) => {
    const updatedRatings = movieProfile.ratings.filter(
      (r) => r.movie.id !== movieId
    );
    await saveMovieProfile({ ratings: updatedRatings });
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
        throw new Error(`Failed to search movies: ${response.status}`);
      }

      const data = await response.json();
      console.log("TMDB search results:", data);

      if (data.error) {
        throw new Error(data.error);
      }

      return data.results.slice(0, limit);
    } catch (err) {
      console.error("Search error:", err);
      throw err;
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
        throw new Error(`Failed to search directors: ${response.status}`);
      }

      const data = await response.json();
      console.log("TMDB director search results:", data);

      if (data.error) {
        throw new Error(data.error);
      }

      return data.results.slice(0, limit);
    } catch (err) {
      console.error("Search error:", err);
      throw err;
    }
  };

  // Initialize on mount
  useEffect(() => {
    fetchMovieProfile();
  }, [userId]);

  return {
    movieProfile,
    loading,
    error,
    updateRecentlyWatched,
    updateFavoriteMovie,
    updateFavoriteDirector,
    addFavoriteMovie,
    removeFavoriteMovie,
    addToWatchlist,
    removeFromWatchlist,
    addRecommendation,
    removeRecommendation,
    addRating,
    removeRating,
    searchMovie,
    searchDirector,
    refreshProfile: fetchMovieProfile,
  };
}
