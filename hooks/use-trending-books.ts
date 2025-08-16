import { useState, useEffect, useCallback } from "react";

interface SearchResult {
  id: string;
  title: string;
  author: string;
  year: number;
  cover: string;
  overview?: string;
  publishedDate?: string;
  pageCount?: number;
}

// Cache trending books in localStorage with expiration
const CACHE_KEY = "trending_books_cache";
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

const getCachedTrendingBooks = (): SearchResult[] | null => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const { data, timestamp } = JSON.parse(cached);
    const now = Date.now();

    if (now - timestamp < CACHE_DURATION) {
      return data;
    }

    // Cache expired, remove it
    localStorage.removeItem(CACHE_KEY);
    return null;
  } catch (error) {
    console.error("Error reading cache:", error);
    return null;
  }
};

const setCachedTrendingBooks = (books: SearchResult[]) => {
  try {
    const cacheData = {
      data: books,
      timestamp: Date.now(),
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
  } catch (error) {
    console.error("Error setting cache:", error);
  }
};

// Get Trending Books with caching and fallback
const getTrendingBooks = async (): Promise<SearchResult[]> => {
  // First, try to get from cache
  const cachedBooks = getCachedTrendingBooks();
  if (cachedBooks && cachedBooks.length > 0) {
    return cachedBooks;
  }

  try {
    // Use AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch("/api/nytimes/books?published_date=current", {
      signal: controller.signal,
      headers: {
        "Cache-Control": "max-age=1800", // 30 minutes
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error("Failed to fetch trending books");
    }

    const data = await response.json();

    if (data.error) {
      console.error("NYTimes API error:", data.error);
      return [];
    }

    // Extract books from all lists and flatten them
    const allBooks =
      data.results?.lists?.flatMap(
        (list: any) =>
          list.books?.map((book: any) => ({
            id: book.id,
            title: book.title || "Unknown Title",
            author: book.author || "Unknown Author",
            year: book.year || 2024,
            cover: book.cover || "/placeholder.svg",
            overview: book.overview || "",
            publishedDate: book.publishedDate || "",
            pageCount: book.pageCount || 0,
            listName: book.listName || "Best Seller",
          })) || []
      ) || [];

    // Remove duplicates based on ID and return first 20 books
    const uniqueBooks = allBooks
      .filter(
        (book: any, index: number, self: any[]) =>
          index === self.findIndex((b: any) => b.id === book.id)
      )
      .slice(0, 20);

    // Cache the results
    setCachedTrendingBooks(uniqueBooks);

    return uniqueBooks;
  } catch (error) {
    console.error("Error fetching trending books:", error);

    // If fetch fails, try to return cached data even if expired
    const expiredCache = getCachedTrendingBooks();
    if (expiredCache && expiredCache.length > 0) {
      console.log("Using expired cache as fallback");
      return expiredCache;
    }

    return [];
  }
};

interface UseTrendingBooksReturn {
  books: SearchResult[];
  loading: boolean;
  error: string | null;
  fetchBooks: (forceRefresh?: boolean) => Promise<void>;
  clearError: () => void;
}

export function useTrendingBooks(): UseTrendingBooksReturn {
  const [books, setBooks] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const fetchBooks = useCallback(
    async (forceRefresh = false) => {
      if (!forceRefresh && books.length > 0) {
        return; // Already have data, don't refetch
      }

      setLoading(true);
      setError(null);

      try {
        // If not forcing refresh, try cache first
        if (!forceRefresh) {
          const cachedBooks = getCachedTrendingBooks();
          if (cachedBooks && cachedBooks.length > 0) {
            setBooks(cachedBooks);
            setLoading(false);
            return;
          }
        }

        const results = await getTrendingBooks();
        setBooks(results);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to fetch trending books";
        setError(errorMessage);
        console.error("Error fetching trending books:", err);
      } finally {
        setLoading(false);
      }
    },
    [books.length]
  );

  // Preload trending books when hook mounts
  useEffect(() => {
    // Start loading immediately if we have cached data
    const cachedBooks = getCachedTrendingBooks();
    if (cachedBooks && cachedBooks.length > 0) {
      setBooks(cachedBooks);
    }

    // Always fetch fresh data in background
    fetchBooks();
  }, [fetchBooks]);

  return {
    books,
    loading,
    error,
    fetchBooks,
    clearError,
  };
}

