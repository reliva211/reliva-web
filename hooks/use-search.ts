import { useState, useCallback, useRef } from "react";

interface SearchState<T> {
  query: string;
  results: T[];
  isSearching: boolean;
  error: string | null;
}

interface UseSearchOptions {
  debounceMs?: number;
  minQueryLength?: number;
}

export function useSearch<T>(
  searchFunction: (query: string) => Promise<T[]>,
  options: UseSearchOptions = {}
) {
  const { debounceMs = 500, minQueryLength = 2 } = options;
  const [state, setState] = useState<SearchState<T>>({
    query: "",
    results: [],
    isSearching: false,
    error: null,
  });

  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const search = useCallback(
    async (query: string) => {
      console.log("Search function called with query:", query);

      if (!query.trim() || query.trim().length < minQueryLength) {
        console.log("Query too short or empty, clearing results");
        setState((prev) => ({
          ...prev,
          query,
          results: [],
          isSearching: false,
          error: null,
        }));
        return;
      }

      console.log("Starting search for query:", query);
      setState((prev) => ({
        ...prev,
        query,
        isSearching: true,
        error: null,
      }));

      try {
        const results = await searchFunction(query);
        console.log("Search results:", results);
        setState((prev) => ({
          ...prev,
          results,
          isSearching: false,
        }));
      } catch (error) {
        console.error("Search error:", error);
        setState((prev) => ({
          ...prev,
          results: [],
          isSearching: false,
          error: error instanceof Error ? error.message : "Search failed",
        }));
      }
    },
    [searchFunction, minQueryLength]
  );

  const debouncedSearch = useCallback(
    (query: string) => {
      console.log("Debounced search called with query:", query);

      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set new timeout
      timeoutRef.current = setTimeout(() => {
        console.log("Executing search for query:", query);
        search(query);
      }, debounceMs);
    },
    [search, debounceMs]
  );

  const clearSearch = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setState({
      query: "",
      results: [],
      isSearching: false,
      error: null,
    });
  }, []);

  return {
    ...state,
    search: debouncedSearch,
    setQuery: (query: string) => {
      setState((prev) => ({ ...prev, query }));
    },
    clearSearch,
  };
}
