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
  year?: number;
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

interface MusicAlbum {
  id: string;
  name: string;
  artists: {
    primary: Array<{
      id: string;
      name: string;
    }>;
  };
  image: Array<{ quality: string; url: string }>;
  year: string;
  language: string;
  songCount: number;
  playCount: number;
  songs?: any[];
  addedAt: string;
  type: 'album' | 'song' | 'artist';
}

interface UserRecommendation {
  user: User;
  movies: Movie[];
  books: Book[];
  series: Series[];
  music: MusicAlbum[];
}

export function useRecommendations() {
  const { user: currentUser } = useCurrentUser();
  const [recommendations, setRecommendations] = useState<UserRecommendation[]>(
    []
  );
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
        .map((doc) => ({ uid: doc.id, ...doc.data() } as User))
        // Only include followed users and explicitly exclude current user if accidentally present
        .filter((user) => followingList.includes(user.uid) && user.uid !== currentUser.uid);

      console.log(
        `Found ${followingUsers.length} following users for ${currentUser.uid}`
      );

      // Additional validation: ensure all following users are real and not test users
      const validFollowingUsers = followingUsers.filter((user) => {
        const isValid =
          !user.uid.startsWith("test_user_") &&
          user.uid !== "user1" &&
          user.uid !== "user2" &&
          user.uid !== "user3" &&
          user.uid !== "current_user_id";

        if (!isValid) {
          console.log(`Filtering out test user: ${user.uid}`);
        }
        return isValid;
      });

      console.log(
        `After filtering test users: ${validFollowingUsers.length} valid users`
      );

      const userRecommendations: UserRecommendation[] = [];

      for (const user of validFollowingUsers) {
        try {
          // Fetch user's movie recommendations (only from Recommendations collection)
          const movieRecommendationsRef = collection(db, "users", user.uid, "movieRecommendations");
          const movieRecommendationsSnapshot = await getDocs(movieRecommendationsRef);
          const movieRecommendations = movieRecommendationsSnapshot.docs.map((doc) => ({
            id: parseInt(doc.id),
            ...doc.data(),
          })) as Movie[];

          // Fetch user's book recommendations (only from Recommendations collection)
          const bookRecommendationsRef = collection(db, "users", user.uid, "bookRecommendations");
          const bookRecommendationsSnapshot = await getDocs(bookRecommendationsRef);
          const bookRecommendations = bookRecommendationsSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Book[];

          // Fetch user's series recommendations (only from Recommendations collection)
          const seriesRecommendationsRef = collection(db, "users", user.uid, "seriesRecommendations");
          const seriesRecommendationsSnapshot = await getDocs(seriesRecommendationsRef);
          const seriesRecommendations = seriesRecommendationsSnapshot.docs.map((doc) => ({
            id: parseInt(doc.id),
            ...doc.data(),
          })) as Series[];

          // Fetch user's music recommendations (only from musicRecommendations collection)
          const musicRecommendationsRef = collection(db, "users", user.uid, "musicRecommendations");
          const musicRecommendationsSnapshot = await getDocs(musicRecommendationsRef);
          const musicRecommendations = musicRecommendationsSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as MusicAlbum[];

          // Only add users who have recommendations in their Recommendations collections
          if (movieRecommendations.length > 0 || bookRecommendations.length > 0 || seriesRecommendations.length > 0 || musicRecommendations.length > 0) {
            // Try to get user name from various possible fields
            let displayName =
              user.displayName ||
              user.name ||
              user.username ||
              user.email?.split("@")[0] ||
              `User ${user.uid.slice(0, 8)}`;

            userRecommendations.push({
              user: {
                ...user,
                displayName: displayName,
                photoURL: user.photoURL || user.avatar || user.profilePicture,
              },
              movies: movieRecommendations,
              books: bookRecommendations,
              series: seriesRecommendations,
              music: musicRecommendations,
            });
          }
        } catch (error) {
          console.error(`Error fetching recommendations for user ${user.uid}:`, error);
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

  const addMovieToCollection = async (
    movie: Movie,
    collectionId: string = "Watchlist"
  ) => {
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

      await setDoc(
        doc(db, "users", currentUser.uid, "movies", movie.id.toString()),
        movieData
      );
      return true;
    } catch (error) {
      console.error("Error adding movie to collection:", error);
      return false;
    }
  };

  const addBookToCollection = async (
    book: Book,
    collectionId: string = "To Read"
  ) => {
    if (!currentUser?.uid) return;

    try {
      const bookData = {
        id: book.id,
        title: book.title,
        author: book.author,
        year: book.year || 0,
        cover: book.cover,
        status: collectionId,
        notes: "",
        collections: [collectionId],
        overview: book.overview || "",
        publishedDate: book.publishedDate || "",
        pageCount: book.pageCount || 0,
      };

      await setDoc(
        doc(db, "users", currentUser.uid, "books", book.id),
        bookData
      );
      return true;
    } catch (error) {
      console.error("Error adding book to collection:", error);
      return false;
    }
  };

  const addSeriesToCollection = async (
    series: Series,
    collectionId: string = "Watchlist"
  ) => {
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

      await setDoc(
        doc(db, "users", currentUser.uid, "series", series.id.toString()),
        seriesData
      );
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
