import { useState, useEffect } from "react";
import { collection, getDocs, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { TMDBMovie, TMDBSeries, GoogleBook } from "@/lib/search-service";

export interface Movie {
  id: string;
  title: string;
  year: number;
  cover: string;
  status?: string;
  rating?: number;
  notes?: string;
  tmdbId?: number;
}

export interface Series {
  id: string;
  title: string;
  year: number;
  cover: string;
  status?: string;
  rating?: number;
  notes?: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  cover: string;
  status?: string;
  rating?: number;
  progress?: number;
}

export function useCollections(userId: string | undefined) {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [series, setSeries] = useState<Series[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all user collections
  const fetchCollections = async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      // Fetch movies
      const moviesCollection = collection(db, "users", userId, "movies");
      const moviesSnapshot = await getDocs(moviesCollection);
      const moviesData: Movie[] = moviesSnapshot.docs.map((doc) => {
        const data = doc.data();
        const rating = data.rating;
        return {
          id: doc.id,
          title: data.title || "",
          year: data.year || 0,
          cover: data.cover || "",
          status: data.status || "Unknown",
          rating: rating && !isNaN(rating) ? rating : 0,
          notes: data.notes || "",
          tmdbId: data.tmdbId,
        } as Movie;
      });
      setMovies(moviesData);

      // Fetch series
      const seriesCollection = collection(db, "users", userId, "series");
      const seriesSnapshot = await getDocs(seriesCollection);
      const seriesData: Series[] = seriesSnapshot.docs.map((doc) => {
        const data = doc.data();
        const rating = data.rating;
        return {
          id: doc.id,
          title: data.title || "",
          year: data.year || 0,
          cover: data.cover || "",
          status: data.status || "Unknown",
          rating: rating && !isNaN(rating) ? rating : 0,
          notes: data.notes || "",
        } as Series;
      });
      setSeries(seriesData);

      // Fetch books
      const booksCollection = collection(db, "users", userId, "books");
      const booksSnapshot = await getDocs(booksCollection);
      const booksData: Book[] = booksSnapshot.docs.map((doc) => {
        const data = doc.data();
        const rating = data.rating;
        return {
          id: doc.id,
          title: data.title || "",
          author: data.author || "",
          cover: data.cover || "",
          status: data.status || "Unknown",
          rating: rating && !isNaN(rating) ? rating : 0,
          progress: data.progress || 0,
        } as Book;
      });
      setBooks(booksData);
    } catch (err) {
      console.error("Error fetching collections:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch collections"
      );
    } finally {
      setLoading(false);
    }
  };

  // Add movie to collection
  const addMovie = async (movie: TMDBMovie, section: string) => {
    if (!userId) return;

    try {
      const movieData = {
        tmdbId: movie.id,
        title: movie.title,
        year: new Date(movie.release_date).getFullYear(),
        cover: movie.poster_path
          ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
          : "/placeholder.svg",
        status: section,
        rating: movie.vote_average,
        notes: "",
        addedAt: new Date().toISOString(),
      };

      const collectionRef = collection(db, "users", userId, "movies");
      const docRef = await addDoc(collectionRef, movieData);

      const newMovie: Movie = {
        id: docRef.id,
        ...movieData,
      };

      setMovies((prev) => [...prev, newMovie]);
      return newMovie;
    } catch (err) {
      console.error("Error adding movie:", err);
      throw err;
    }
  };

  // Add series to collection
  const addSeries = async (series: TMDBSeries, section: string) => {
    if (!userId) return;

    try {
      const seriesData = {
        tmdbId: series.id,
        title: series.name,
        year: new Date(series.first_air_date).getFullYear(),
        cover: series.poster_path
          ? `https://image.tmdb.org/t/p/w500${series.poster_path}`
          : "/placeholder.svg",
        status: section,
        rating: series.vote_average,
        notes: "",
        addedAt: new Date().toISOString(),
      };

      const collectionRef = collection(db, "users", userId, "series");
      const docRef = await addDoc(collectionRef, seriesData);

      const newSeries: Series = {
        id: docRef.id,
        ...seriesData,
      };

      setSeries((prev) => [...prev, newSeries]);
      return newSeries;
    } catch (err) {
      console.error("Error adding series:", err);
      throw err;
    }
  };

  // Add book to collection
  const addBook = async (book: GoogleBook, section: string) => {
    if (!userId) return;

    try {
      const bookData = {
        googleId: book.id,
        title: book.volumeInfo.title,
        author: book.volumeInfo.authors?.join(", ") || "Unknown Author",
        year: book.volumeInfo.publishedDate
          ? new Date(book.volumeInfo.publishedDate).getFullYear()
          : 0,
        cover: book.volumeInfo.imageLinks?.thumbnail || "/placeholder.svg",
        status: section,
        rating: book.volumeInfo.averageRating || 0,
        notes: "",
        addedAt: new Date().toISOString(),
      };

      const collectionRef = collection(db, "users", userId, "books");
      const docRef = await addDoc(collectionRef, bookData);

      const newBook: Book = {
        id: docRef.id,
        ...bookData,
      };

      setBooks((prev) => [...prev, newBook]);
      return newBook;
    } catch (err) {
      console.error("Error adding book:", err);
      throw err;
    }
  };

  // Get items by section
  const getMoviesBySection = (section: string) => {
    return movies.filter((movie) => movie.status === section);
  };

  const getSeriesBySection = (section: string) => {
    return series.filter((series) => series.status === section);
  };

  const getBooksBySection = (section: string) => {
    return books.filter((book) => book.status === section);
  };

  // Fetch collections on mount
  useEffect(() => {
    fetchCollections();
  }, [userId]);

  return {
    movies,
    series,
    books,
    loading,
    error,
    addMovie,
    addSeries,
    addBook,
    getMoviesBySection,
    getSeriesBySection,
    getBooksBySection,
    refetch: fetchCollections,
  };
}
