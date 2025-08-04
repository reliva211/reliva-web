import { useState, useEffect } from "react";
import { useCurrentUser } from "./use-current-user";
import {
  collection,
  getDocs,
  setDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

interface User {
  uid: string;
  displayName: string;
  photoURL?: string;
  email: string;
}

interface Movie {
  id: number;
  title: string;
  year: number;
  cover: string;
  status?: string;
  rating?: number;
  notes?: string;
  collections?: string[];
  overview?: string;
  release_date?: string;
}

interface Book {
  id: string;
  title: string;
  author: string;
  year: number;
  cover: string;
  status?: string;
  notes?: string;
  collections?: string[];
  overview?: string;
  publishedDate?: string;
  pageCount?: number;
}

interface Series {
  id: number;
  title: string;
  year: number;
  cover: string;
  status?: string;
  rating?: number;
  notes?: string;
  collections?: string[];
  overview?: string;
  first_air_date?: string;
  number_of_seasons: number;
  number_of_episodes: number;
}

interface UserRecommendation {
  user: User;
  movies: Movie[];
  books: Book[];
  series: Series[];
}

export function useRecommendations(selectedSource: "friends" | "all" = "all") {
  const { user: currentUser } = useCurrentUser();
  const [recommendations, setRecommendations] = useState<UserRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecommendations = async () => {
    if (!currentUser?.uid) return;

    try {
      setLoading(true);
      setError(null);
      
      // Get all users (in a real app, you'd filter by friends)
      const usersRef = collection(db, "users");
      const usersSnapshot = await getDocs(usersRef);
      let allUsers = usersSnapshot.docs
        .map(doc => ({ uid: doc.id, ...doc.data() } as User))
        .filter(user => user.uid !== currentUser.uid); // Exclude current user
      
      // Filter by source (friends vs all users)
      if (selectedSource === "friends") {
        // TODO: Implement actual friends logic
        // For now, just show a subset of users as "friends"
        allUsers = allUsers.slice(0, Math.min(3, allUsers.length));
      }
      


      const userRecommendations: UserRecommendation[] = [];

      for (const user of allUsers) {
        try {
          // Fetch user's movies
          const moviesRef = collection(db, "users", user.uid, "movies");
          const moviesSnapshot = await getDocs(moviesRef);
          const movies = moviesSnapshot.docs.map(doc => ({
            id: parseInt(doc.id),
            ...doc.data()
          })) as Movie[];

          // Fetch user's books
          const booksRef = collection(db, "users", user.uid, "books");
          const booksSnapshot = await getDocs(booksRef);
          const books = booksSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Book[];
          


          // Fetch user's series
          const seriesRef = collection(db, "users", user.uid, "series");
          const seriesSnapshot = await getDocs(seriesRef);
          const series = seriesSnapshot.docs.map(doc => ({
            id: parseInt(doc.id),
            ...doc.data()
          })) as Series[];

          // Only add users who have items in their collections
          if (movies.length > 0 || books.length > 0 || series.length > 0) {
            // Try to get user name from various possible fields
            let displayName = user.displayName || user.name || user.username || user.email?.split('@')[0] || `User ${user.uid.slice(0, 8)}`;
            
            userRecommendations.push({
              user: {
                ...user,
                displayName: displayName,
                photoURL: user.photoURL || user.avatar || user.profilePicture,
              },
              movies,
              books,
              series
            });
          }
        } catch (error) {
          console.error(`Error fetching data for user ${user.uid}:`, error);
        }
      }

      setRecommendations(userRecommendations);
    } catch (error) {
      console.error("Error fetching recommendations:", error);
      setError("Failed to load recommendations");
    } finally {
      setLoading(false);
    }
  };

  const addMovieToCollection = async (movie: Movie, collectionId: string = "Watchlist") => {
    if (!currentUser?.uid) return;

    try {
      const movieData = {
        id: movie.id,
        title: movie.title,
        year: movie.year,
        cover: movie.cover,
        status: collectionId,
        rating: movie.rating || 0,
        notes: "",
        collections: [collectionId],
        overview: movie.overview || "",
        release_date: movie.release_date || "",
      };

      await setDoc(doc(db, "users", currentUser.uid, "movies", movie.id.toString()), movieData);
      return true;
    } catch (error) {
      console.error("Error adding movie to collection:", error);
      return false;
    }
  };

  const addBookToCollection = async (book: Book, collectionId: string = "To Read") => {
    if (!currentUser?.uid) return;

    try {
      const bookData = {
        id: book.id,
        title: book.title,
        author: book.author,
        year: book.year,
        cover: book.cover,
        status: collectionId,
        notes: "",
        collections: [collectionId],
        overview: book.overview || "",
        publishedDate: book.publishedDate || "",
        pageCount: book.pageCount || 0,
      };

      await setDoc(doc(db, "users", currentUser.uid, "books", book.id), bookData);
      return true;
    } catch (error) {
      console.error("Error adding book to collection:", error);
      return false;
    }
  };

  const addSeriesToCollection = async (series: Series, collectionId: string = "Watchlist") => {
    if (!currentUser?.uid) return;

    try {
      const seriesData = {
        id: series.id,
        title: series.title,
        year: series.year,
        cover: series.cover,
        status: collectionId,
        rating: series.rating || 0,
        notes: "",
        collections: [collectionId],
        overview: series.overview || "",
        first_air_date: series.first_air_date || "",
        number_of_seasons: series.number_of_seasons || 0,
        number_of_episodes: series.number_of_episodes || 0,
      };

      await setDoc(doc(db, "users", currentUser.uid, "series", series.id.toString()), seriesData);
      return true;
    } catch (error) {
      console.error("Error adding series to collection:", error);
      return false;
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, [currentUser, selectedSource]);

  return {
    recommendations,
    loading,
    error,
    fetchRecommendations,
    addMovieToCollection,
    addBookToCollection,
    addSeriesToCollection,
  };
} 