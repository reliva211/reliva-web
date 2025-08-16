import { useState, useEffect, useCallback } from "react";

interface NYTimesBook {
  id: string;
  title: string;
  author: string;
  year: number;
  cover: string;
  overview?: string;
  publishedDate?: string;
  pageCount?: number;
  listName?: string;
  rank?: number;
  isbn13?: string;
  isbn10?: string;
  weeks_on_list?: number;
  description?: string;
  book_image?: string;
  created_date?: string;
}

interface NYTimesList {
  list_id: number;
  list_name: string;
  list_name_encoded: string;
  display_name: string;
  updated: string;
  list_image?: string;
  list_image_width?: number;
  list_image_height?: number;
  books: NYTimesBook[];
}

interface NYTimesResponse {
  status: string;
  copyright: string;
  num_results: number;
  last_modified: string;
  results: {
    lists: NYTimesList[];
  };
}

interface UseNYTimesBooksReturn {
  books: NYTimesBook[];
  lists: NYTimesList[];
  loading: boolean;
  error: string | null;
  fetchOverview: (publishedDate?: string) => Promise<void>;
  fetchList: (listName: string, publishedDate?: string) => Promise<void>;
  clearError: () => void;
}

export function useNYTimesBooks(): UseNYTimesBooksReturn {
  const [books, setBooks] = useState<NYTimesBook[]>([]);
  const [lists, setLists] = useState<NYTimesList[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const fetchOverview = useCallback(
    async (publishedDate: string = "current") => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/nytimes/books?published_date=${publishedDate}`
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: NYTimesResponse = await response.json();

        if (data.error) {
          throw new Error(data.error);
        }

        // Extract and flatten all books from all lists
        const allBooks =
          data.results?.lists?.flatMap(
            (list) =>
              list.books?.map((book) => ({
                ...book,
                listName: list.list_name,
              })) || []
          ) || [];

        // Remove duplicates based on ID
        const uniqueBooks = allBooks.filter(
          (book, index, self) =>
            index === self.findIndex((b) => b.id === book.id)
        );

        setBooks(uniqueBooks);
        setLists(data.results?.lists || []);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to fetch books data";
        setError(errorMessage);
        console.error("Error fetching NYTimes books overview:", err);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const fetchList = useCallback(
    async (listName: string, publishedDate: string = "current") => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/nytimes/books/lists?list=${encodeURIComponent(
            listName
          )}&published_date=${publishedDate}`
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.error) {
          throw new Error(data.error);
        }

        const listBooks = data.results?.books || [];
        setBooks(listBooks);
        setLists([data.results] || []);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to fetch list data";
        setError(errorMessage);
        console.error("Error fetching NYTimes list:", err);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    books,
    lists,
    loading,
    error,
    fetchOverview,
    fetchList,
    clearError,
  };
}

