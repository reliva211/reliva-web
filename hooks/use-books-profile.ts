import { useState, useEffect } from "react";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { searchService, GoogleBook } from "@/lib/search-service";

export interface GoogleBookItem {
  id: string;
  title: string;
  authors?: string[];
  publishedDate?: string;
  cover?: string;
  rating?: number;
  description?: string;
  pageCount?: number;
  categories?: string[];
  language?: string;
  publisher?: string;
  isbn?: string;
}

export interface BooksProfile {
  recentlyRead: GoogleBookItem[];
  favoriteBooks: GoogleBookItem[];
  readingList: GoogleBookItem[];
  recommendations: GoogleBookItem[];
  ratings: { [bookId: string]: number };
  favoriteAuthors: string[];
}

export const useBooksProfile = (userId: string) => {
  const [booksProfile, setBooksProfile] = useState<BooksProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBooksProfile = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const docRef = doc(db, "users", userId, "profiles", "books");
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setBooksProfile(docSnap.data() as BooksProfile);
      } else {
        // Create default books profile
        const defaultProfile: BooksProfile = {
          recentlyRead: [],
          favoriteBooks: [],
          readingList: [],
          recommendations: [],
          ratings: {},
          favoriteAuthors: [],
        };
        await setDoc(docRef, defaultProfile);
        setBooksProfile(defaultProfile);
      }
    } catch (err) {
      setError("Failed to fetch books profile");
      console.error("Error fetching books profile:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooksProfile();
  }, [userId]);

  const updateRecentlyRead = async (book: GoogleBookItem) => {
    if (!booksProfile || !userId) return;

    const updatedList = [
      book,
      ...booksProfile.recentlyRead.filter((item) => item.id !== book.id),
    ].slice(0, 10);

    const updatedProfile = {
      ...booksProfile,
      recentlyRead: updatedList,
    };

    try {
      const docRef = doc(db, "users", userId, "profiles", "books");
      await updateDoc(docRef, { recentlyRead: updatedList });
      setBooksProfile(updatedProfile);
    } catch (err) {
      setError("Failed to update recently read");
      console.error("Error updating recently read:", err);
    }
  };

  const addFavoriteBook = async (book: GoogleBookItem) => {
    if (!booksProfile || !userId) return;

    const updatedList = [
      ...booksProfile.favoriteBooks.filter((item) => item.id !== book.id),
      book,
    ];

    const updatedProfile = {
      ...booksProfile,
      favoriteBooks: updatedList,
    };

    try {
      const docRef = doc(db, "users", userId, "profiles", "books");
      await updateDoc(docRef, { favoriteBooks: updatedList });
      setBooksProfile(updatedProfile);
    } catch (err) {
      setError("Failed to add favorite book");
      console.error("Error adding favorite book:", err);
    }
  };

  const removeFavoriteBook = async (bookId: string) => {
    if (!booksProfile || !userId) return;

    const updatedList = booksProfile.favoriteBooks.filter(
      (item) => item.id !== bookId
    );

    const updatedProfile = {
      ...booksProfile,
      favoriteBooks: updatedList,
    };

    try {
      const docRef = doc(db, "users", userId, "profiles", "books");
      await updateDoc(docRef, { favoriteBooks: updatedList });
      setBooksProfile(updatedProfile);
    } catch (err) {
      setError("Failed to remove favorite book");
      console.error("Error removing favorite book:", err);
    }
  };

  const addToReadingList = async (book: GoogleBookItem) => {
    if (!booksProfile || !userId) return;

    const updatedList = [
      ...booksProfile.readingList.filter((item) => item.id !== book.id),
      book,
    ];

    const updatedProfile = {
      ...booksProfile,
      readingList: updatedList,
    };

    try {
      const docRef = doc(db, "users", userId, "profiles", "books");
      await updateDoc(docRef, { readingList: updatedList });
      setBooksProfile(updatedProfile);
    } catch (err) {
      setError("Failed to add to reading list");
      console.error("Error adding to reading list:", err);
    }
  };

  const removeFromReadingList = async (bookId: string) => {
    if (!booksProfile || !userId) return;

    const updatedList = booksProfile.readingList.filter(
      (item) => item.id !== bookId
    );

    const updatedProfile = {
      ...booksProfile,
      readingList: updatedList,
    };

    try {
      const docRef = doc(db, "users", userId, "profiles", "books");
      await updateDoc(docRef, { readingList: updatedList });
      setBooksProfile(updatedProfile);
    } catch (err) {
      setError("Failed to remove from reading list");
      console.error("Error removing from reading list:", err);
    }
  };

  const addRecommendation = async (book: GoogleBookItem) => {
    if (!booksProfile || !userId) return;

    const updatedList = [
      ...booksProfile.recommendations.filter((item) => item.id !== book.id),
      book,
    ];

    const updatedProfile = {
      ...booksProfile,
      recommendations: updatedList,
    };

    try {
      const docRef = doc(db, "users", userId, "profiles", "books");
      await updateDoc(docRef, { recommendations: updatedList });
      setBooksProfile(updatedProfile);
    } catch (err) {
      setError("Failed to add recommendation");
      console.error("Error adding recommendation:", err);
    }
  };

  const removeRecommendation = async (bookId: string) => {
    if (!booksProfile || !userId) return;

    const updatedList = booksProfile.recommendations.filter(
      (item) => item.id !== bookId
    );

    const updatedProfile = {
      ...booksProfile,
      recommendations: updatedList,
    };

    try {
      const docRef = doc(db, "users", userId, "profiles", "books");
      await updateDoc(docRef, { recommendations: updatedList });
      setBooksProfile(updatedProfile);
    } catch (err) {
      setError("Failed to remove recommendation");
      console.error("Error removing recommendation:", err);
    }
  };

  const addRating = async (bookId: string, rating: number) => {
    if (!booksProfile || !userId) return;

    const updatedRatings = {
      ...booksProfile.ratings,
      [bookId]: rating,
    };

    const updatedProfile = {
      ...booksProfile,
      ratings: updatedRatings,
    };

    try {
      const docRef = doc(db, "users", userId, "profiles", "books");
      await updateDoc(docRef, { ratings: updatedRatings });
      setBooksProfile(updatedProfile);
    } catch (err) {
      setError("Failed to add rating");
      console.error("Error adding rating:", err);
    }
  };

  const addRatingWithBook = async (book: GoogleBookItem, rating: number) => {
    if (!booksProfile || !userId) return;

    // First ensure the book is in favoriteBooks
    const updatedFavoriteBooks = [
      ...booksProfile.favoriteBooks.filter((item) => item.id !== book.id),
      book,
    ];

    // Then add the rating
    const updatedRatings = {
      ...booksProfile.ratings,
      [book.id]: rating,
    };

    const updatedProfile = {
      ...booksProfile,
      favoriteBooks: updatedFavoriteBooks,
      ratings: updatedRatings,
    };

    try {
      const docRef = doc(db, "users", userId, "profiles", "books");
      await updateDoc(docRef, {
        favoriteBooks: updatedFavoriteBooks,
        ratings: updatedRatings,
      });
      setBooksProfile(updatedProfile);
    } catch (err) {
      setError("Failed to add rating with book");
      console.error("Error adding rating with book:", err);
    }
  };

  const removeRating = async (bookId: string) => {
    if (!booksProfile || !userId) return;

    const updatedRatings = { ...booksProfile.ratings };
    delete updatedRatings[bookId];

    const updatedProfile = {
      ...booksProfile,
      ratings: updatedRatings,
    };

    try {
      const docRef = doc(db, "users", userId, "profiles", "books");
      await updateDoc(docRef, { ratings: updatedRatings });
      setBooksProfile(updatedProfile);
    } catch (err) {
      setError("Failed to remove rating");
      console.error("Error removing rating:", err);
    }
  };

  const searchBooks = async (query: string): Promise<GoogleBookItem[]> => {
    try {
      // First try detailed search for better results
      let results = await searchService.searchBooksDetailed(query);

      // If no results or poor results, try regular search
      if (!results || results.length === 0) {
        results = await searchService.searchBooks(query);
      }

      // Transform Google Books API response to our format
      const formattedResults = results.map((book: GoogleBook) => {
        // Clean HTML from description if present - keep full text
        const cleanDescription = book.volumeInfo.description
          ? book.volumeInfo.description
              .replace(/<[^>]*>/g, "") // Remove HTML tags
              .replace(/&amp;/g, "&") // Decode HTML entities
              .replace(/&lt;/g, "<")
              .replace(/&gt;/g, ">")
              .replace(/&quot;/g, '"')
              .replace(/&#39;/g, "'")
              .replace(/&nbsp;/g, " ") // Replace non-breaking spaces
              .replace(/\s+/g, " ") // Normalize whitespace
              .trim()
          : "";

        return {
          id: book.id,
          title: book.volumeInfo.title || "",
          authors: book.volumeInfo.authors || [],
          publishedDate: book.volumeInfo.publishedDate || "",
          cover:
            book.volumeInfo.imageLinks?.thumbnail ||
            book.volumeInfo.imageLinks?.smallThumbnail ||
            "",
          rating: book.volumeInfo.averageRating || 0,
          description: cleanDescription, // Keep full description
          pageCount: book.volumeInfo.pageCount || 0,
          categories: book.volumeInfo.categories || [],
          language: book.volumeInfo.language || "",
          publisher: book.volumeInfo.publisher || "",
          isbn: book.volumeInfo.industryIdentifiers?.[0]?.identifier || "",
        };
      });

      return formattedResults;
    } catch (err) {
      console.error("Error searching books:", err);
      return [];
    }
  };

  const searchBooksByTitleAndAuthor = async (
    title: string,
    author?: string
  ): Promise<GoogleBookItem[]> => {
    try {
      const results = await searchService.searchBooksByTitleAndAuthor(
        title,
        author
      );

      // Transform Google Books API response to our format
      const formattedResults = results.map((book: GoogleBook) => {
        // Clean HTML from description if present - keep full text
        const cleanDescription = book.volumeInfo.description
          ? book.volumeInfo.description
              .replace(/<[^>]*>/g, "") // Remove HTML tags
              .replace(/&amp;/g, "&") // Decode HTML entities
              .replace(/&lt;/g, "<")
              .replace(/&gt;/g, ">")
              .replace(/&quot;/g, '"')
              .replace(/&#39;/g, "'")
              .replace(/&nbsp;/g, " ") // Replace non-breaking spaces
              .replace(/\s+/g, " ") // Normalize whitespace
              .trim()
          : "";

        return {
          id: book.id,
          title: book.volumeInfo.title || "",
          authors: book.volumeInfo.authors || [],
          publishedDate: book.volumeInfo.publishedDate || "",
          cover:
            book.volumeInfo.imageLinks?.thumbnail ||
            book.volumeInfo.imageLinks?.smallThumbnail ||
            "",
          rating: book.volumeInfo.averageRating || 0,
          description: cleanDescription, // Keep full description
          pageCount: book.volumeInfo.pageCount || 0,
          categories: book.volumeInfo.categories || [],
          language: book.volumeInfo.language || "",
          publisher: book.volumeInfo.publisher || "",
          isbn: book.volumeInfo.industryIdentifiers?.[0]?.identifier || "",
        };
      });

      return formattedResults;
    } catch (err) {
      console.error("Error searching books by title and author:", err);
      return [];
    }
  };

  const getBookById = async (
    volumeId: string
  ): Promise<GoogleBookItem | null> => {
    try {
      const book = await searchService.getBookById(volumeId);
      if (!book) return null;

      // Clean HTML from description if present - keep full text
      const cleanDescription = book.volumeInfo.description
        ? book.volumeInfo.description
            .replace(/<[^>]*>/g, "") // Remove HTML tags
            .replace(/&amp;/g, "&") // Decode HTML entities
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&nbsp;/g, " ") // Replace non-breaking spaces
            .replace(/\s+/g, " ") // Normalize whitespace
            .trim()
        : "";

      return {
        id: book.id,
        title: book.volumeInfo.title || "",
        authors: book.volumeInfo.authors || [],
        publishedDate: book.volumeInfo.publishedDate || "",
        cover:
          book.volumeInfo.imageLinks?.thumbnail ||
          book.volumeInfo.imageLinks?.smallThumbnail ||
          "",
        rating: book.volumeInfo.averageRating || 0,
        description: cleanDescription, // Keep full description
        pageCount: book.volumeInfo.pageCount || 0,
        categories: book.volumeInfo.categories || [],
        language: book.volumeInfo.language || "",
        publisher: book.volumeInfo.publisher || "",
        isbn: book.volumeInfo.industryIdentifiers?.[0]?.identifier || "",
      };
    } catch (err) {
      console.error("Error fetching book by ID:", err);
      return null;
    }
  };

  return {
    booksProfile,
    loading,
    error,
    fetchBooksProfile,
    updateRecentlyRead,
    addFavoriteBook,
    removeFavoriteBook,
    addToReadingList,
    removeFromReadingList,
    addRecommendation,
    removeRecommendation,
    addRating,
    addRatingWithBook,
    removeRating,
    searchBooks,
    searchBooksByTitleAndAuthor,
    getBookById,
  };
};
