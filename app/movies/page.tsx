"use client";

import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";

// Force dynamic rendering to prevent prerender issues
export const dynamic = "force-dynamic";
import Image from "next/image";
import { SafeImage } from "@/components/safe-image";
import { DebugImage } from "@/components/debug-image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Film,
  Star,
  Plus,
  X,
  SortAsc,
  SortDesc,
  Grid3X3,
  List,
  MoreHorizontal,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { searchMovies } from "@/lib/tmdb";
import { getTrendingMovies } from "@/lib/tmdb";
import { db } from "@/lib/firebase";
import {
  setDoc,
  doc,
  deleteDoc,
  updateDoc,
  collection,
  getDocs,
  addDoc,
} from "firebase/firestore";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import DiscoverSection from "@/components/discover-section";

import Link from "next/link";

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

interface Collection {
  id: string;
  name: string;
  isPublic?: boolean;
  isDefault?: boolean;
  color?: string;
}

interface SearchResult {
  id: number;
  title: string;
  year: number;
  cover: string;
  rating?: number;
  overview?: string;
  release_date?: string;
}

export default function MoviesPage() {
  const { user } = useCurrentUser();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [savedMovies, setSavedMovies] = useState<Movie[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<string>("");
  const [isCreateCollectionOpen, setCreateCollectionOpen] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [newCollectionIsPublic, setNewCollectionIsPublic] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState<string>("");
  const [isGenreSearching, setIsGenreSearching] = useState(false);
  const [sortBy, setSortBy] = useState<"title" | "year" | "rating" | "added">(
    "added"
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [trendingMovies, setTrendingMovies] = useState<SearchResult[]>([]);
  const [isLoadingTrending, setIsLoadingTrending] = useState(false);
  const [showDiscover, setShowDiscover] = useState(true);
  const [scrollContainer, setScrollContainer] = useState<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Default collections for movies
  const defaultCollections = [
    { name: "Watched", isDefault: true, color: "bg-green-500" },
    { name: "Watchlist", isDefault: true, color: "bg-purple-500" },
    { name: "Dropped", isDefault: true, color: "bg-red-500" },
    { name: "Recommendations", isDefault: true, color: "bg-blue-500" },
  ];

  // Handle URL section parameter
  useEffect(() => {
    const section = searchParams.get("section");
    if (section && collections.length > 0) {
      // Find the collection that matches the section name
      const targetCollection = collections.find(
        (col) => col.name.toLowerCase() === section.toLowerCase()
      );
      if (targetCollection) {
        setSelectedCollection(targetCollection.id);
        setShowDiscover(false); // Hide discover section when filtering by collection
      }
    }
  }, [searchParams, collections]);

  // Fetch user's movies and collections
  useEffect(() => {
    if (!user?.uid) return;

    const fetchUserData = async () => {
      try {
        // Fetch movies
        const moviesRef = collection(db, "users", user.uid, "movies");
        const moviesSnapshot = await getDocs(moviesRef);
        const moviesData = moviesSnapshot.docs.map((doc) => {
          const data = doc.data();
          // Raw movie data from DB

          const movieData = {
            id: parseInt(doc.id),
            ...data,
            // Ensure cover is never empty
            cover:
              data.cover && data.cover.trim() !== ""
                ? data.cover
                : "/placeholder.svg",
            // Ensure title is never empty
            title: data.title || "Unknown Title",
          };

          // Processed movie data
          return movieData;
        }) as Movie[];

        // Final fetched movies data
        setSavedMovies(moviesData);

        // Fetch collections
        const collectionsRef = collection(
          db,
          "users",
          user.uid,
          "movieCollections"
        );
        const collectionsSnapshot = await getDocs(collectionsRef);
        const collectionsData = collectionsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Collection[];

        // Create default collections if they don't exist
        const existingNames = collectionsData.map((col) => col.name);
        const missingDefaults = defaultCollections.filter(
          (col) => !existingNames.includes(col.name)
        );

        if (missingDefaults.length > 0) {
          for (const defaultCol of missingDefaults) {
            await addDoc(collectionsRef, defaultCol);
          }
          // Refetch collections
          const newSnapshot = await getDocs(collectionsRef);
          const allCollections = newSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Collection[];
          setCollections(allCollections);
        } else {
          // Remove duplicate collections by name (keep the first one)
          const uniqueCollections = collectionsData.reduce((acc, current) => {
            const x = acc.find((item) => item.name === current.name);
            if (!x) {
              return acc.concat([current]);
            } else {
              return acc;
            }
          }, [] as Collection[]);
          setCollections(uniqueCollections);

          // Clean up duplicates in the database if we found any
          if (uniqueCollections.length < collectionsData.length) {
            await cleanupDuplicateCollections();
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, [user]);

  // Fetch trending movies when discover tab is shown
  useEffect(() => {
    if (showDiscover && trendingMovies.length === 0) {
      fetchTrendingMovies();
    }
  }, [showDiscover]);

  // Clean up duplicate collections
  const cleanupDuplicateCollections = async () => {
    if (!user?.uid) return;

    try {
      const collectionsRef = collection(
        db,
        "users",
        user.uid,
        "movieCollections"
      );
      const collectionsSnapshot = await getDocs(collectionsRef);
      const collectionsData = collectionsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Collection[];

      // Group collections by name
      const groupedCollections = collectionsData.reduce((acc, collection) => {
        if (!acc[collection.name]) {
          acc[collection.name] = [];
        }
        acc[collection.name].push(collection);
        return acc;
      }, {} as Record<string, Collection[]>);

      // Remove duplicates (keep the first one, delete the rest)
      for (const [name, duplicates] of Object.entries(groupedCollections)) {
        if (duplicates.length > 1) {
          // Keep the first one, delete the rest
          for (let i = 1; i < duplicates.length; i++) {
            await deleteDoc(
              doc(db, "users", user.uid, "movieCollections", duplicates[i].id)
            );
          }
        }
      }
    } catch (error) {
      console.error("Error cleaning up duplicate collections:", error);
    }
  };

  // Force refresh collections (for debugging)
  const refreshCollections = async () => {
    if (!user?.uid) return;

    try {
      const collectionsRef = collection(
        db,
        "users",
        user.uid,
        "movieCollections"
      );
      const collectionsSnapshot = await getDocs(collectionsRef);
      const collectionsData = collectionsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Collection[];

      // Create default collections if they don't exist
      const existingNames = collectionsData.map((col) => col.name);
      const missingDefaults = defaultCollections.filter(
        (col) => !existingNames.includes(col.name)
      );

      if (missingDefaults.length > 0) {
        for (const defaultCol of missingDefaults) {
          await addDoc(collectionsRef, defaultCol);
        }
      }

      // Refetch all collections
      const newSnapshot = await getDocs(collectionsRef);
      const allCollections = newSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Collection[];

      // Remove duplicates by name
      const uniqueCollections = allCollections.reduce((acc, current) => {
        const x = acc.find((item) => item.name === current.name);
        if (!x) {
          return acc.concat([current]);
        } else {
          return acc;
        }
      }, [] as Collection[]);

      setCollections(uniqueCollections);
    } catch (error) {
      console.error("Error refreshing collections:", error);
    }
  };

  // Enhanced fuzzy search
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSelectedGenre("");

    try {
      const results = await searchMovies(searchQuery);
      setSearchResults(results);
    } catch (error) {
      console.error("Error searching movies:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Fetch trending movies
  const fetchTrendingMovies = async () => {
    setIsLoadingTrending(true);
    try {
      const results = await getTrendingMovies();
      setTrendingMovies(results);
    } catch (error) {
      console.error("Error fetching trending movies:", error);
      setTrendingMovies([]);
    } finally {
      setIsLoadingTrending(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setSelectedGenre("");
    setIsSearching(false);
    setIsGenreSearching(false);
  };

  // Add movie to collection
  const addMovieToCollection = async (
    movie: SearchResult,
    collectionId: string
  ) => {
    if (!user?.uid) return;

    try {
      // Check if movie already exists
      const existingMovie = savedMovies.find((m) => m.id === movie.id);

      if (existingMovie) {
        // Update existing movie with new collection
        const updatedCollections = [
          ...(existingMovie.collections || []),
          collectionId,
        ];
        await updateDoc(
          doc(db, "users", user.uid, "movies", movie.id.toString()),
          {
            collections: updatedCollections,
          }
        );
        setSavedMovies((prev) =>
          prev.map((m) =>
            m.id === movie.id ? { ...m, collections: updatedCollections } : m
          )
        );
      } else {
        // Create new movie
        const movieData: Movie = {
          id: movie.id,
          title: movie.title,
          year: movie.year,
          cover: movie.cover,
          status: "Watchlist",
          rating: movie.rating || 0,
          notes: "",
          collections: [collectionId],
          overview: movie.overview || "",
          release_date: movie.release_date || "",
        };

        await setDoc(
          doc(db, "users", user.uid, "movies", movie.id.toString()),
          movieData
        );
        setSavedMovies((prev) => [...prev, movieData]);
      }
    } catch (error) {
      console.error("Error adding movie to collection:", error);
    }
  };

  // Remove movie from collection
  const removeMovieFromCollection = async (
    movieId: number,
    collectionId: string
  ) => {
    if (!user?.uid) return;

    try {
      const movie = savedMovies.find((m) => m.id === movieId);
      if (!movie) return;

      const updatedCollections =
        movie.collections?.filter((id) => id !== collectionId) || [];

      if (updatedCollections.length === 0) {
        // Remove movie entirely if no collections left
        await deleteDoc(
          doc(db, "users", user.uid, "movies", movieId.toString())
        );
        setSavedMovies((prev) => prev.filter((m) => m.id !== movieId));
      } else {
        // Update movie with remaining collections
        await updateDoc(
          doc(db, "users", user.uid, "movies", movieId.toString()),
          {
            collections: updatedCollections,
          }
        );
        setSavedMovies((prev) =>
          prev.map((m) =>
            m.id === movieId ? { ...m, collections: updatedCollections } : m
          )
        );
      }
    } catch (error) {
      console.error("Error removing movie from collection:", error);
    }
  };

  // Handle collection selection and clear search
  const handleCollectionSelect = (collectionId: string) => {
    setSelectedCollection(collectionId);
    // Clear search when clicking on collection tabs
    setSearchQuery("");
    setSearchResults([]);
    setIsSearching(false);
    setIsGenreSearching(false);
  };

  // Create new collection
  const createCollection = async () => {
    if (!user?.uid || !newCollectionName.trim()) return;

    try {
      const collectionData = {
        name: newCollectionName.trim(),
        isPublic: newCollectionIsPublic,
        isDefault: false,
        color: `bg-${
          ["blue", "green", "yellow", "purple", "red", "pink", "indigo"][
            Math.floor(Math.random() * 7)
          ]
        }-500`,
      };

      const docRef = await addDoc(
        collection(db, "users", user.uid, "movieCollections"),
        collectionData
      );

      const newCollection = { id: docRef.id, ...collectionData };
      setCollections((prev) => [...prev, newCollection]);

      setNewCollectionName("");
      setNewCollectionIsPublic(false);
      setCreateCollectionOpen(false);
    } catch (error) {
      console.error("Error creating collection:", error);
    }
  };

  // Get collection info
  const getCollectionInfo = (collectionId: string) => {
    return collections.find((col) => col.id === collectionId);
  };

  // Carousel scroll functions
  const scrollLeft = () => {
    if (scrollContainer) {
      scrollContainer.scrollBy({
        left: -200,
        behavior: 'smooth'
      });
    }
  };

  const scrollRight = () => {
    if (scrollContainer) {
      scrollContainer.scrollBy({
        left: 200,
        behavior: 'smooth'
      });
    }
  };

  const updateScrollButtons = () => {
    if (scrollContainer) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainer;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  // Update scroll buttons when collections change
  useEffect(() => {
    updateScrollButtons();
  }, [collections, scrollContainer]);

  // Update scroll buttons on window resize
  useEffect(() => {
    const handleResize = () => {
      updateScrollButtons();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [scrollContainer]);

  // Filter and sort movies
  const filteredAndSortedMovies = useMemo(() => {
    let filtered = savedMovies;

    // Filter by collection - show movies based on selection
    if (selectedCollection && selectedCollection !== "") {
      const selectedCollectionInfo = getCollectionInfo(selectedCollection);
      
      if (selectedCollectionInfo?.name === "All Movies") {
        // Show all movies from all collections
        filtered = savedMovies;
      } else {
        // Show movies from specific collection
        filtered = savedMovies.filter((movie) =>
          movie.collections?.includes(selectedCollection)
        );
      }
    } else {
      // If no collection is selected, show no movies
      filtered = [];
    }

    // Sort movies
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case "title":
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case "year":
          aValue = a.year;
          bValue = b.year;
          break;
        case "rating":
          aValue = a.rating || 0;
          bValue = b.rating || 0;
          break;
        case "added":
        default:
          aValue = a.id;
          bValue = b.id;
          break;
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [savedMovies, selectedCollection, sortBy, sortOrder, collections]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black w-full overflow-x-hidden">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gradient-to-r from-gray-900/95 to-gray-800/95 backdrop-blur-sm w-full">
        <div className="container mx-auto px-0 sm:px-6 py-6 sm:py-8 max-w-full">
          <div className="flex items-center justify-between">
            <div className="ml-0 lg:ml-0">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
                Movies
              </h1>
              <p className="text-gray-400 mt-1 sm:mt-2 text-sm sm:text-lg">
                Discover and organize your favorite films
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-0 sm:px-6 py-6 sm:py-8 max-w-full overflow-x-hidden">
        {/* Search and Filters */}
        <div className="mb-8 sm:mb-10 w-full">
          <div className="flex flex-col gap-4 sm:gap-6 mb-6 sm:mb-8 w-full">
            {/* Search */}
            <div className="flex-1 w-full">
              <form
                onSubmit={handleSearch}
                className="flex flex-col sm:flex-row gap-3 w-full"
              >
                <div className="relative flex-1">
                  <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                  <Input
                    placeholder="Search movies..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 sm:pl-12 h-11 sm:h-12 bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-400 focus:border-gray-500 focus:ring-gray-500 rounded-xl text-sm sm:text-base w-full"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={clearSearch}
                      className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2"
                    >
                      <X className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 hover:text-white transition-colors" />
                    </button>
                  )}
                </div>
                <Button
                  type="submit"
                  disabled={isSearching}
                  className="h-11 sm:h-12 px-6 sm:px-8 bg-gradient-to-r from-gray-800 to-gray-700 hover:from-gray-700 hover:to-gray-600 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl border border-gray-600 text-sm sm:text-base"
                >
                  {isSearching ? "Searching..." : "Search"}
                </Button>
              </form>
            </div>
          </div>

          {/* Collections Tabs */}
          <div className="w-full max-w-full overflow-hidden relative">
            {/* Left Arrow */}
            {canScrollLeft && (
              <button
                onClick={scrollLeft}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-gray-800 hover:bg-gray-700 text-white rounded-full shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center"
                aria-label="Scroll left"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}

            {/* Right Arrow */}
            {canScrollRight && (
              <button
                onClick={scrollRight}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-gray-800 hover:bg-gray-700 text-white rounded-full shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center"
                aria-label="Scroll right"
              >
                <ArrowRight className="h-4 w-4" />
              </button>
            )}

            <div 
              ref={setScrollContainer}
              onScroll={updateScrollButtons}
              className="flex items-center gap-2 sm:gap-3 overflow-x-auto pb-4 scrollbar-hide horizontal-scroll-container px-10"
            >
            {/* Trending Tab */}
            <button
              onClick={() => {
                setShowDiscover(true);
                setSelectedCollection("");
              }}
              className={`flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-3 rounded-xl transition-all duration-300 whitespace-nowrap font-medium text-sm sm:text-base flex-shrink-0 ${
                showDiscover
                  ? "bg-gradient-to-r from-gray-800 to-gray-700 text-white shadow-lg border border-gray-600"
                  : "hover:bg-gray-800/50 text-gray-300 hover:text-white"
              }`}
            >
              <span>Trending</span>
            </button>


            {collections.map((collection) => {
              const movieCount = savedMovies.filter((movie) =>
                movie.collections?.includes(collection.id)
              ).length;

              // Special handling for "All Movies" collection
              if (collection.name === "All Movies") {
                return (
                  <button
                    key={collection.id}
                    onClick={() => {
                      handleCollectionSelect(collection.id);
                      setShowDiscover(false);
                    }}
                    className={`flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-3 rounded-xl transition-all duration-300 whitespace-nowrap font-medium text-sm sm:text-base flex-shrink-0 ${
                      selectedCollection === collection.id
                        ? "bg-gradient-to-r from-gray-800 to-gray-700 text-white shadow-lg border border-gray-600"
                        : "hover:bg-gray-800/50 text-gray-300 hover:text-white"
                    }`}
                  >
                    <span>{collection.name}</span>
                    <Badge
                      variant="secondary"
                      className={`ml-1 ${
                        selectedCollection === collection.id
                          ? "bg-white/20 text-white"
                          : "bg-gray-700 text-gray-300"
                      }`}
                    >
                      {savedMovies.length}
                    </Badge>
                  </button>
                );
              }

              return (
                <button
                  key={collection.id}
                  onClick={() => {
                    handleCollectionSelect(collection.id);
                    setShowDiscover(false);
                  }}
                  className={`flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-3 rounded-xl transition-all duration-300 whitespace-nowrap font-medium text-sm sm:text-base flex-shrink-0 ${
                    selectedCollection === collection.id
                      ? "bg-gradient-to-r from-gray-800 to-gray-700 text-white shadow-lg border border-gray-600"
                      : "hover:bg-gray-800/50 text-gray-300 hover:text-white"
                  }`}
                >
                  <span>{collection.name}</span>
                  <Badge
                    variant="secondary"
                    className={`ml-1 ${
                      selectedCollection === collection.id
                        ? "bg-white/20 text-white"
                        : "bg-gray-700 text-gray-300"
                    }`}
                  >
                    {movieCount}
                  </Badge>
                </button>
              );
            })}

            <Dialog
              open={isCreateCollectionOpen}
              onOpenChange={setCreateCollectionOpen}
            >
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-10 w-10 border-gray-700 hover:bg-gray-800 rounded-xl"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gray-800 border-gray-700">
                <DialogHeader>
                  <DialogTitle className="text-white">
                    Create New Collection
                  </DialogTitle>
                  <DialogDescription className="text-gray-400">
                    Create a new collection to organize your movies.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name" className="text-gray-300">
                      Collection Name
                    </Label>
                    <Input
                      id="name"
                      value={newCollectionName}
                      onChange={(e) => setNewCollectionName(e.target.value)}
                      placeholder="Enter collection name..."
                      className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="public"
                      checked={newCollectionIsPublic}
                      onCheckedChange={(checked) =>
                        setNewCollectionIsPublic(!!checked)
                      }
                    />
                    <Label htmlFor="public" className="text-gray-300">
                      Make collection public
                    </Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    onClick={createCollection}
                    disabled={!newCollectionName.trim()}
                    className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400"
                  >
                    Create Collection
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-8">
          {/* Trending Section */}
          {showDiscover && searchResults.length === 0 && (
            <DiscoverSection
              title="Trending Movies"
              subtitle="Discover what's popular right now"
              items={trendingMovies.map((movie) => ({
                id: movie.id,
                title: movie.title,
                cover: movie.cover,
                year: movie.year,
                overview: movie.overview,
              }))}
              isLoading={isLoadingTrending}
              onRetryAction={fetchTrendingMovies}
              itemType="movie"
              containerId="trending-movies-container"
            />
          )}

          {isSearching ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="text-gray-400 text-lg">Searching movies...</p>
              </div>
            </div>
          ) : searchResults.length > 0 ? (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-3xl font-bold text-white">
                    Search Results ({searchResults.length})
                  </h2>
                  <p className="text-gray-400 mt-2">
                    Movies matching your search
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={clearSearch}
                  className="border-gray-600 hover:bg-gray-800 hover:border-gray-500 transition-all duration-200"
                >
                  Clear Search
                </Button>
              </div>
              <div
                className={
                  viewMode === "grid"
                    ? "grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2 sm:gap-3 w-full max-w-full"
                    : "space-y-4"
                }
              >
                {searchResults.slice(0, 20).map((movie) => (
                  <MovieCard
                    key={movie.id}
                    movie={movie}
                    collections={collections}
                    isInCollections={savedMovies.some((m) => m.id === movie.id)}
                    onAddToCollection={addMovieToCollection}
                    viewMode={viewMode}
                    allMovies={searchResults}
                  />
                ))}
              </div>
            </div>
          ) : filteredAndSortedMovies.length > 0 ? (
            <div>
              {getCollectionInfo(selectedCollection)?.name === "All Movies" ? (
                // Display all movies grouped by collection
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-3xl font-bold text-white">
                        All Movies ({filteredAndSortedMovies.length})
                      </h2>
                      <p className="text-gray-400 mt-2">
                        Movies from all your collections
                      </p>
                    </div>
                  </div>
                  
                  {collections.map((collection) => {
                    const collectionMovies = filteredAndSortedMovies.filter((movie) =>
                      movie.collections?.includes(collection.id)
                    );
                    
                    if (collectionMovies.length === 0) return null;
                    
                    return (
                      <div key={collection.id} className="mb-8">
                        <div className="flex items-center gap-3 mb-4">
                          <button
                            onClick={() => {
                              handleCollectionSelect(collection.id);
                              setShowDiscover(false);
                            }}
                            className="text-xl font-semibold text-white hover:text-blue-400 transition-colors duration-200 cursor-pointer"
                          >
                            {collection.name}
                          </button>
                          <Badge variant="secondary" className="bg-gray-700 text-gray-300">
                            {collectionMovies.length}
                          </Badge>
                        </div>
                        <div
                          className={
                            viewMode === "grid"
                              ? "grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2 sm:gap-3 w-full max-w-full"
                              : "space-y-4"
                          }
                        >
                          {collectionMovies.slice(0, 20).map((movie) => (
                            <SavedMovieCard
                              key={movie.id}
                              movie={movie}
                              collections={collections}
                              onRemoveFromCollection={removeMovieFromCollection}
                              viewMode={viewMode}
                              allMovies={filteredAndSortedMovies}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                // Display movies from specific collection
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-3xl font-bold text-white">
                        {getCollectionInfo(selectedCollection)?.name || "Movies"} (
                        {filteredAndSortedMovies.length})
                      </h2>
                      <p className="text-gray-400 mt-2">
                        Your{" "}
                        {getCollectionInfo(
                          selectedCollection
                        )?.name?.toLowerCase() || "movies"}{" "}
                        collection
                      </p>
                    </div>
                  </div>
                  <div
                    className={
                      viewMode === "grid"
                        ? "grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2 sm:gap-3 w-full max-w-full"
                        : "space-y-4"
                    }
                  >
                    {filteredAndSortedMovies.slice(0, 20).map((movie) => (
                      <SavedMovieCard
                        key={movie.id}
                        movie={movie}
                        collections={collections}
                        onRemoveFromCollection={removeMovieFromCollection}
                        viewMode={viewMode}
                        allMovies={filteredAndSortedMovies}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// Movie Card Component for Search Results
function MovieCard({
  movie,
  collections,
  isInCollections,
  onAddToCollection,
  viewMode,
  allMovies,
}: {
  movie: SearchResult;
  collections: Collection[];
  isInCollections: boolean;
  onAddToCollection: (movie: SearchResult, collectionId: string) => void;
  viewMode: "grid" | "list";
  allMovies: SearchResult[];
}) {
  const [showDropdown, setShowDropdown] = useState(false);

  // Validate search result data
  const validatedMovie = {
    ...movie,
    cover:
      movie.cover && movie.cover.trim() !== ""
        ? movie.cover
        : "/placeholder.svg",
    title: movie.title || "Unknown Title",
  };

  if (viewMode === "list") {
    return (
      <Card className="flex items-center space-x-4 p-6 bg-gradient-to-r from-gray-800/50 to-gray-700/50 border-gray-600 backdrop-blur-sm">
        <div className="relative w-20 h-28 flex-shrink-0">
          <Link href={`/movies/${validatedMovie.id}`}>
            <div className="relative aspect-[2/3] rounded-xl overflow-hidden shadow-2xl">
              <Image
                src={validatedMovie.cover}
                alt={validatedMovie.title}
                fill
                className="object-cover cursor-pointer"
              />
            </div>
          </Link>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-lg leading-tight line-clamp-2 min-h-[3rem] flex items-start text-white">
            {validatedMovie.title}
          </h3>
          <p className="text-gray-400 font-medium mt-1">
            {validatedMovie.year}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="hover:bg-gray-700/50 rounded-xl"
            >
              <Plus className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="bg-gray-800 border-gray-700"
          >
            {collections.map((collection) => (
              <DropdownMenuItem
                key={collection.id}
                onClick={() => onAddToCollection(movie, collection.id)}
                className="hover:bg-gray-700"
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      collection.color || "bg-gray-500"
                    }`}
                  />
                  <span>{collection.name}</span>
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </Card>
    );
  }

  return (
    <div>
      <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900 shadow-2xl">
        <Link href={`/movies/${validatedMovie.id}`}>
          <Image
            src={validatedMovie.cover}
            alt={validatedMovie.title}
            fill
            className="object-cover cursor-pointer"
          />
        </Link>
      </div>
      <div className="mt-4 space-y-2">
        <h4 className="font-bold text-sm leading-tight line-clamp-2 min-h-[2.5rem] flex items-start text-white">
          {validatedMovie.title}
        </h4>
        <p className="text-xs text-gray-400 font-medium">
          {validatedMovie.year}
        </p>
      </div>
    </div>
  );
}

// Helper function to validate and fix movie data
const validateMovieData = (movie: Movie): Movie => {
  // Ensure cover is never empty or invalid
  let cover = "/placeholder.svg";
  if (
    movie.cover &&
    typeof movie.cover === "string" &&
    movie.cover.trim() !== ""
  ) {
    cover = movie.cover;
  }

  return {
    ...movie,
    cover,
    title: movie.title || "Unknown Title",
  };
};

// Saved Movie Card Component
function SavedMovieCard({
  movie,
  collections,
  onRemoveFromCollection,
  viewMode,
  allMovies,
}: {
  movie: Movie;
  collections: Collection[];
  onRemoveFromCollection: (movieId: number, collectionId: string) => void;
  viewMode: "grid" | "list";
  allMovies: Movie[];
}) {
  const [showDropdown, setShowDropdown] = useState(false);

  // Validate movie data to ensure cover is never empty
  const validatedMovie = validateMovieData(movie);

  if (viewMode === "list") {
    return (
      <Card className="flex items-center space-x-4 p-6 bg-gradient-to-r from-gray-800/50 to-gray-700/50 border-gray-600 backdrop-blur-sm">
        <div className="relative w-20 h-28 flex-shrink-0">
          <Link href={`/movies/${validatedMovie.id}`}>
            <div className="relative aspect-[2/3] rounded-xl overflow-hidden shadow-2xl">
              <Image
                src={validatedMovie.cover}
                alt={validatedMovie.title}
                fill
                className="object-cover cursor-pointer"
                onError={(e) => {
                  // Image failed to load
                  const target = e.target as HTMLImageElement;
                  target.src = "/placeholder.svg";
                }}
              />
            </div>
          </Link>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-lg truncate text-white">
            {validatedMovie.title}
          </h3>
          <p className="text-gray-400 font-medium">{validatedMovie.year}</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="hover:bg-gray-700/50 rounded-xl"
            >
              <MoreHorizontal className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="bg-gray-800 border-gray-700"
          >
            <DropdownMenuItem asChild className="hover:bg-gray-700">
              <Link href={`/movies/${validatedMovie.id}`}>View Details</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-gray-600" />
            {validatedMovie.collections?.map((collectionId) => {
              const collection = collections.find((c) => c.id === collectionId);
              return collection ? (
                <DropdownMenuItem
                  key={collectionId}
                  onClick={() =>
                    onRemoveFromCollection(validatedMovie.id, collectionId)
                  }
                  className="hover:bg-gray-700"
                >
                  Remove from {collection.name}
                </DropdownMenuItem>
              ) : null;
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </Card>
    );
  }

  return (
    <div>
      <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900 shadow-2xl">
        <Link href={`/movies/${validatedMovie.id}`}>
          <Image
            src={validatedMovie.cover}
            alt={validatedMovie.title}
            fill
            className="object-cover cursor-pointer"
            onError={(e) => {
              // Image failed to load
              const target = e.target as HTMLImageElement;
              target.src = "/placeholder.svg";
            }}
          />
        </Link>
      </div>
      <div className="mt-4 space-y-2">
        <h4 className="font-bold text-sm truncate text-white">
          {validatedMovie.title}
        </h4>
        <p className="text-xs text-gray-400 font-medium">
          {validatedMovie.year}
        </p>
      </div>
    </div>
  );
}
