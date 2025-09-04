"use client";

import { useEffect, useState, useMemo } from "react";

// Force dynamic rendering to prevent prerender issues
export const dynamic = "force-dynamic";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Tv,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
import { searchSeries } from "@/lib/tmdb";
import { getTrendingSeries } from "@/lib/tmdb";
import DiscoverSection from "@/components/discover-section";

import Link from "next/link";

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
  first_air_date?: string;
  number_of_seasons: number;
  number_of_episodes: number;
}

export default function SeriesPage() {
  const { user } = useCurrentUser();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [savedSeries, setSavedSeries] = useState<Series[]>([]);
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
  const [trendingSeries, setTrendingSeries] = useState<SearchResult[]>([]);
  const [isLoadingTrending, setIsLoadingTrending] = useState(false);
  const [showDiscover, setShowDiscover] = useState(true);

  // Carousel arrows state
  const [scrollContainer, setScrollContainer] = useState<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Default collections for series
  const defaultCollections = [
    { name: "Watching", isDefault: true, color: "bg-blue-500" },
    { name: "Watched", isDefault: true, color: "bg-green-500" },
    { name: "Watchlist", isDefault: true, color: "bg-purple-500" },
    { name: "Dropped", isDefault: true, color: "bg-red-500" },
    { name: "Recommendations", isDefault: true, color: "bg-orange-500" },
  ];

  // Fetch user's series and collections
  useEffect(() => {
    if (!user?.uid) return;

    const fetchUserData = async () => {
      try {
        // Fetch series
        const seriesRef = collection(db, "users", user.uid, "series");
        const seriesSnapshot = await getDocs(seriesRef);
        const seriesData = seriesSnapshot.docs.map((doc) => ({
          id: parseInt(doc.id),
          ...doc.data(),
        })) as Series[];
        setSavedSeries(seriesData);

        // Fetch collections
        const collectionsRef = collection(
          db,
          "users",
          user.uid,
          "seriesCollections"
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
          // Refetch collections after creating defaults
          const newSnapshot = await getDocs(collectionsRef);
          const allCollections = newSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Collection[];

          // Remove duplicates by name (keep the first one)
          const uniqueCollections = allCollections.reduce((acc, current) => {
            const x = acc.find((item) => item.name === current.name);
            if (!x) {
              return acc.concat([current]);
            } else {
              return acc;
            }
          }, [] as Collection[]);

          setCollections(uniqueCollections);
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

          // Clean up duplicates in the database if we found any (but only after setting collections)
          if (uniqueCollections.length < collectionsData.length) {
            setTimeout(() => cleanupDuplicateCollections(), 1000);
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, [user]);

  // Enhanced fuzzy search
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSelectedGenre("");

    try {
      const results = await searchSeries(searchQuery);
      setSearchResults(results);
    } catch (error) {
      console.error("Error searching series:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setSelectedGenre("");
    setIsSearching(false);
    setIsGenreSearching(false);
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

  // Add series to collection
  const addSeriesToCollection = async (
    series: SearchResult,
    collectionId: string
  ) => {
    if (!user?.uid) return;

    try {
      // Check if series already exists
      const existingSeries = savedSeries.find((s) => s.id === series.id);

      if (existingSeries) {
        // Update existing series with new collection
        const updatedCollections = [
          ...(existingSeries.collections || []),
          collectionId,
        ];
        await updateDoc(
          doc(db, "users", user.uid, "series", series.id.toString()),
          {
            collections: updatedCollections,
          }
        );
        setSavedSeries((prev) =>
          prev.map((s) =>
            s.id === series.id ? { ...s, collections: updatedCollections } : s
          )
        );
      } else {
        // Create new series
        const seriesData: Series = {
          id: series.id,
          title: series.title,
          year: series.year,
          cover: series.cover,
          status: "Watchlist",
          rating: series.rating || 0,
          notes: "",
          collections: [collectionId],
          overview: series.overview || "",
          first_air_date: series.first_air_date || "",
          number_of_seasons: series.number_of_seasons || 1,
          number_of_episodes: series.number_of_episodes || 1,
        };

        await setDoc(
          doc(db, "users", user.uid, "series", series.id.toString()),
          seriesData
        );
        setSavedSeries((prev) => [...prev, seriesData]);
      }
    } catch (error) {
      console.error("Error adding series to collection:", error);
    }
  };

  // Remove series from collection
  const removeSeriesFromCollection = async (
    seriesId: number,
    collectionId: string
  ) => {
    if (!user?.uid) return;

    try {
      const series = savedSeries.find((s) => s.id === seriesId);
      if (!series) return;

      const updatedCollections =
        series.collections?.filter((id) => id !== collectionId) || [];

      if (updatedCollections.length === 0) {
        // Remove series entirely if no collections left
        await deleteDoc(
          doc(db, "users", user.uid, "series", seriesId.toString())
        );
        setSavedSeries((prev) => prev.filter((s) => s.id !== seriesId));
      } else {
        // Update series with remaining collections
        await updateDoc(
          doc(db, "users", user.uid, "series", seriesId.toString()),
          {
            collections: updatedCollections,
          }
        );
        setSavedSeries((prev) =>
          prev.map((s) =>
            s.id === seriesId ? { ...s, collections: updatedCollections } : s
          )
        );
      }
    } catch (error) {
      console.error("Error removing series from collection:", error);
    }
  };

  // Clean up duplicate collections
  const cleanupDuplicateCollections = async () => {
    if (!user?.uid) return;

    try {
      const collectionsRef = collection(
        db,
        "users",
        user.uid,
        "seriesCollections"
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
              doc(db, "users", user.uid, "seriesCollections", duplicates[i].id)
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
        "seriesCollections"
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
        collection(db, "users", user.uid, "seriesCollections"),
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

  // Filter and sort series
  const filteredAndSortedSeries = useMemo(() => {
    let filtered = savedSeries;

    // Filter by collection - show all series if "All Series" collection is selected
    if (selectedCollection && selectedCollection !== "") {
      const selectedCollectionInfo = getCollectionInfo(selectedCollection);
      if (selectedCollectionInfo?.name === "All Series") {
        // Show all series for "All Series" collection
        filtered = savedSeries;
      } else {
        // Show series from specific collection
        filtered = savedSeries.filter((series) =>
          series.collections?.includes(selectedCollection)
        );
      }
    } else {
      // If no collection is selected, show no series
      filtered = [];
    }

    // Sort series
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
  }, [savedSeries, selectedCollection, sortBy, sortOrder, collections]);

  // Carousel arrow functions
  const scrollLeft = () => {
    if (scrollContainer) {
      scrollContainer.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainer) {
      scrollContainer.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  const updateScrollButtons = () => {
    if (scrollContainer) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainer;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  // Update scroll buttons when collections change or container is set
  useEffect(() => {
    updateScrollButtons();
  }, [collections, scrollContainer]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => updateScrollButtons();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch trending series
  const fetchTrendingSeries = async () => {
    setIsLoadingTrending(true);
    try {
      const results = await getTrendingSeries();
      setTrendingSeries(results);
    } catch (error) {
      console.error("Error fetching trending series:", error);
      setTrendingSeries([]);
    } finally {
      setIsLoadingTrending(false);
    }
  };

  // Fetch trending series when discover tab is shown
  useEffect(() => {
    if (showDiscover && trendingSeries.length === 0) {
      fetchTrendingSeries();
    }
  }, [showDiscover]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black w-full overflow-x-hidden">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gradient-to-r from-gray-900/95 to-gray-800/95 backdrop-blur-sm w-full">
        <div className="container mx-auto px-1 sm:px-6 py-6 sm:py-8 max-w-full">
          <div className="flex items-center justify-between">
            <div className="ml-0 lg:ml-0">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
                Series
              </h1>
              <p className="text-gray-400 mt-1 sm:mt-2 text-sm sm:text-lg">
                Discover and organize your favorite TV shows
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-1 sm:px-6 py-6 sm:py-8 max-w-full overflow-x-hidden">
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
                    placeholder="Search series..."
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
                showDiscover && !selectedCollection
                  ? "bg-gradient-to-r from-gray-800 to-gray-700 text-white shadow-lg border border-gray-600"
                  : "hover:bg-gray-800/50 text-gray-300 hover:text-white"
              }`}
            >
              <span>Trending</span>
            </button>

            {collections.map((collection) => {
              const seriesCount = savedSeries.filter((series) =>
                series.collections?.includes(collection.id)
              ).length;

              // Special handling for "All Series" collection
              if (collection.name === "All Series") {
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
                      {savedSeries.length}
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
                    {seriesCount}
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
                    Create a new collection to organize your series.
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
              title="Trending Series"
              subtitle="Discover what's popular right now"
              items={trendingSeries.map((series) => ({
                id: series.id,
                title: series.title,
                cover: series.cover,
                year: series.year,
                overview: series.overview,
              }))}
              isLoading={isLoadingTrending}
              onRetryAction={fetchTrendingSeries}
              itemType="series"
              containerId="trending-series-container"
            />
          )}

          {isSearching ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="text-gray-400 text-lg">Searching series...</p>
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
                    Series matching your search
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
                {searchResults.slice(0, 20).map((series) => (
                  <SeriesCard
                    key={series.id}
                    series={series}
                    collections={collections}
                    isInCollections={savedSeries.some(
                      (s) => s.id === series.id
                    )}
                    onAddToCollection={addSeriesToCollection}
                    viewMode={viewMode}
                    allSeries={searchResults}
                  />
                ))}
              </div>
            </div>
          ) : filteredAndSortedSeries.length > 0 ? (
            <div>
              {getCollectionInfo(selectedCollection)?.name === "All Series" ? (
                // Display all series grouped by collection
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-3xl font-bold text-white">
                        All Series ({filteredAndSortedSeries.length})
                      </h2>
                      <p className="text-gray-400 mt-2">
                        Series from all your collections
                      </p>
                    </div>
                  </div>
                  
                  {collections.map((collection) => {
                    const collectionSeries = filteredAndSortedSeries.filter((series) =>
                      series.collections?.includes(collection.id)
                    );
                    
                    if (collectionSeries.length === 0) return null;
                    
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
                            {collectionSeries.length}
                          </Badge>
                        </div>
                        <div
                          className={
                            viewMode === "grid"
                              ? "grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2 sm:gap-3 w-full max-w-full"
                              : "space-y-4"
                          }
                        >
                          {collectionSeries.slice(0, 20).map((series) => (
                            <SavedSeriesCard
                              key={series.id}
                              series={series}
                              collections={collections}
                              onRemoveFromCollection={removeSeriesFromCollection}
                              viewMode={viewMode}
                              allSeries={filteredAndSortedSeries}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                // Display series from specific collection
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-3xl font-bold text-white">
                        {getCollectionInfo(selectedCollection)?.name || "Series"} (
                        {filteredAndSortedSeries.length})
                      </h2>
                      <p className="text-gray-400 mt-2">
                        Your{" "}
                        {getCollectionInfo(
                          selectedCollection
                        )?.name?.toLowerCase() || "series"}{" "}
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
                    {filteredAndSortedSeries.slice(0, 20).map((series) => (
                      <SavedSeriesCard
                        key={series.id}
                        series={series}
                        collections={collections}
                        onRemoveFromCollection={removeSeriesFromCollection}
                        viewMode={viewMode}
                        allSeries={filteredAndSortedSeries}
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

// Series Card Component for Search Results
function SeriesCard({
  series,
  collections,
  isInCollections,
  onAddToCollection,
  viewMode,
  allSeries,
}: {
  series: SearchResult;
  collections: Collection[];
  isInCollections: boolean;
  onAddToCollection: (series: SearchResult, collectionId: string) => void;
  viewMode: "grid" | "list";
  allSeries: SearchResult[];
}) {
  if (viewMode === "list") {
    return (
      <Card className="flex items-center space-x-4 p-6 bg-gradient-to-r from-gray-800/50 to-gray-700/50 border-gray-600 backdrop-blur-sm">
        <div className="relative w-20 h-28 flex-shrink-0">
          <Link href={`/series/${series.id}`}>
            <div className="relative aspect-[2/3] rounded-xl overflow-hidden shadow-2xl">
              <Image
                src={series.cover}
                alt={series.title}
                fill
                className="object-cover cursor-pointer"
              />
            </div>
          </Link>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-lg truncate text-white">
            {series.title}
          </h3>
          <p className="text-gray-400 font-medium">{series.year}</p>
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
                onClick={() => onAddToCollection(series, collection.id)}
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
        <Link href={`/series/${series.id}`}>
          <Image
            src={series.cover}
            alt={series.title}
            fill
            className="object-cover cursor-pointer"
          />
        </Link>
      </div>
      <div className="mt-4 space-y-2">
        <h4 className="font-bold text-sm truncate text-white">
          {series.title}
        </h4>
        <p className="text-xs text-gray-400 font-medium">{series.year}</p>
      </div>
    </div>
  );
}

// Saved Series Card Component
function SavedSeriesCard({
  series,
  collections,
  onRemoveFromCollection,
  viewMode,
  allSeries,
}: {
  series: Series;
  collections: Collection[];
  onRemoveFromCollection: (seriesId: number, collectionId: string) => void;
  viewMode: "grid" | "list";
  allSeries: Series[];
}) {
  if (viewMode === "list") {
    return (
      <Card className="flex items-center space-x-4 p-6 bg-gradient-to-r from-gray-800/50 to-gray-700/50 border-gray-600 backdrop-blur-sm">
        <div className="relative w-20 h-28 flex-shrink-0">
          <Link href={`/series/${series.id}`}>
            <div className="relative aspect-[2/3] rounded-xl overflow-hidden shadow-2xl">
              <Image
                src={series.cover}
                alt={series.title}
                fill
                className="object-cover cursor-pointer"
              />
            </div>
          </Link>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-lg truncate text-white">
            {series.title}
          </h3>
          <p className="text-gray-400 font-medium">{series.year}</p>
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
              <Link href={`/series/${series.id}`}>View Details</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-gray-600" />
            {series.collections?.map((collectionId) => {
              const collection = collections.find((c) => c.id === collectionId);
              return collection ? (
                <DropdownMenuItem
                  key={collectionId}
                  onClick={() =>
                    onRemoveFromCollection(series.id, collectionId)
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
        <Link href={`/series/${series.id}`}>
          <Image
            src={series.cover}
            alt={series.title}
            fill
            className="object-cover cursor-pointer"
          />
        </Link>
      </div>
      <div className="mt-4 space-y-2">
        <h4 className="font-bold text-sm truncate text-white">
          {series.title}
        </h4>
        <p className="text-xs text-gray-400 font-medium">{series.year}</p>
      </div>
    </div>
  );
}
