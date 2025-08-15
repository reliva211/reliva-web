import { useState, useEffect } from "react";
import { useCurrentUser } from "./use-current-user";
import {
  collection,
  getDocs,
  setDoc,
  doc,
  updateDoc,
  getDoc,
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

export function useRecommendations() {
  const { user: currentUser } = useCurrentUser();
  const [recommendations, setRecommendations] = useState<UserRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecommendations = async () => {
    if (!currentUser?.uid) return;

    try {
      setLoading(true);
      setError(null);
      
      // Get current user's following list
      const currentUserRef = doc(db, "users", currentUser.uid);
      const currentUserSnap = await getDoc(currentUserRef);
      
      if (!currentUserSnap.exists()) {
        setError("Current user not found");
        setLoading(false);
        return;
      }

      const currentUserData = currentUserSnap.data();
      const followingList = currentUserData.following || [];

      // If user is not following anyone, return empty results
      if (followingList.length === 0) {
        setRecommendations([]);
        setLoading(false);
        return;
      }

      // Get only the users that the current user follows
      const followingUsersRef = collection(db, "users");
      const followingUsersSnapshot = await getDocs(followingUsersRef);
      let followingUsers = followingUsersSnapshot.docs
        .map(doc => ({ uid: doc.id, ...doc.data() } as User))
        .filter(user => followingList.includes(user.uid)); // Only include followed users
      
      console.log(`Found ${followingUsers.length} following users for ${currentUser.uid}`);
      
      // Additional validation: ensure all following users are real and not test users
      const validFollowingUsers = followingUsers.filter(user => {
        const isValid = !user.uid.startsWith('test_user_') && 
                       user.uid !== 'user1' && 
                       user.uid !== 'user2' && 
                       user.uid !== 'user3' &&
                       user.uid !== 'current_user_id';
        
        if (!isValid) {
          console.log(`Filtering out test user: ${user.uid}`);
        }
        return isValid;
      });
      
      console.log(`After filtering test users: ${validFollowingUsers.length} valid users`);

      const userRecommendations: UserRecommendation[] = [];

      for (const user of validFollowingUsers) {
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
  }, [currentUser]);

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