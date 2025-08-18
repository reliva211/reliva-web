import { useState, useCallback } from "react";

interface GoogleBook {
  id: string;
  title: string;
  authors: string[];
  author: string;
  publisher: string;
  publishedDate: string;
  description: string;
  pageCount: number;
  categories: string[];
  averageRating: number;
  ratingsCount: number;
  language: string;
  isbn10: string;
  isbn13: string;
  cover: string;
  previewLink: string;
  infoLink: string;
  buyLink: string;
  price: number;
  currency: string;
  isEbook: boolean;
  year: number;
  overview: string;
}

interface GoogleBooksResponse {
  totalItems: number;
  items: GoogleBook[];
}

interface UseGoogleBooksReturn {
  books: GoogleBook[];
  loading: boolean;
  error: string | null;
  searchBooks: (query: string) => Promise<void>;
  searchByISBN: (isbn: string) => Promise<void>;
  searchByTitleAndAuthor: (title: string, author: string) => Promise<void>;
  clearError: () => void;
}

export function useGoogleBooks(): UseGoogleBooksReturn {
  const [books, setBooks] = useState<GoogleBook[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const searchBooks = useCallback(async (query: string) => {
    if (!query.trim()) {
      setError("Search query is required");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/google-books?q=${encodeURIComponent(query)}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: GoogleBooksResponse = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setBooks(data.items || []);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to search books";
      setError(errorMessage);
      console.error("Error searching Google Books:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const searchByISBN = useCallback(async (isbn: string) => {
    if (!isbn.trim()) {
      setError("ISBN is required");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/google-books?isbn=${encodeURIComponent(isbn)}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: GoogleBooksResponse = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setBooks(data.items || []);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to search by ISBN";
      setError(errorMessage);
      console.error("Error searching Google Books by ISBN:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const searchByTitleAndAuthor = useCallback(
    async (title: string, author: string) => {
      if (!title.trim() || !author.trim()) {
        setError("Title and author are required");
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/google-books?title=${encodeURIComponent(
            title
          )}&author=${encodeURIComponent(author)}`
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: GoogleBooksResponse = await response.json();

        if (data.error) {
          throw new Error(data.error);
        }

        setBooks(data.items || []);
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to search by title and author";
        setError(errorMessage);
        console.error("Error searching Google Books by title and author:", err);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    books,
    loading,
    error,
    searchBooks,
    searchByISBN,
    searchByTitleAndAuthor,
    clearError,
  };
}
