"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useProfile } from "@/hooks/use-profile";
import { useCollections } from "@/hooks/use-collections";
import { useSearch } from "@/hooks/use-search";
import {
  searchService,
  TMDBMovie,
  TMDBSeries,
  GoogleBook,
} from "@/lib/search-service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  User,
  Edit,
  Plus,
  Star,
  Film,
  BookOpen,
  Music,
  Tv,
  Camera,
  Bell,
  Play,
  Clock,
  ThumbsUp,
  Crown,
  Globe,
  Lock,
} from "lucide-react";
import { EditProfileDialog } from "@/components/edit-profile";
import { ImageUpload } from "@/components/image-upload";
import { SearchModal } from "@/components/search-modal";
import { HorizontalList } from "@/components/horizontal-list";
import ErrorBoundary from "@/components/error-boundary";
import { DebugPanel } from "@/components/debug-panel";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";

interface Collection {
  id: string;
  name: string;
  description: string;
  itemCount: number;
  commentCount: number;
}

interface PublicCollection {
  id: string;
  name: string;
  isPublic: boolean;
  isDefault: boolean;
  type: "movies" | "series" | "books";
  itemCount: number;
}

interface PublicCollectionItems {
  [collectionId: string]: any[];
}

export default function ProfilePage() {
  const { user } = useCurrentUser();
  const [activeTab, setActiveTab] = useState("movies");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [publicCollections, setPublicCollections] = useState<
    PublicCollection[]
  >([]);
  const [loadingPublicCollections, setLoadingPublicCollections] =
    useState(false);
  const [publicCollectionItems, setPublicCollectionItems] =
    useState<PublicCollectionItems>({});

  // Collection selection states
  const [selectedMovieCollection, setSelectedMovieCollection] =
    useState<string>("all");
  const [selectedSeriesCollection, setSelectedSeriesCollection] =
    useState<string>("all");
  const [selectedBookCollection, setSelectedBookCollection] =
    useState<string>("all");

  // Prevent vertical scrolling when hovering over scrollable containers
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      const target = e.target as HTMLElement;
      const scrollableContainer = target.closest(".scrollable-container");
      if (scrollableContainer) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    document.addEventListener("wheel", handleWheel, { passive: false });
    return () => document.removeEventListener("wheel", handleWheel);
  }, []);

  // Modal states for each section
  const [addMovieModalOpen, setAddMovieModalOpen] = useState(false);
  const [addSeriesModalOpen, setAddSeriesModalOpen] = useState(false);
  const [addBookModalOpen, setAddBookModalOpen] = useState(false);
  const [addMusicModalOpen, setAddMusicModalOpen] = useState(false);

  const [selectedMovieSection, setSelectedMovieSection] = useState<string>("");
  const [selectedSeriesSection, setSelectedSeriesSection] =
    useState<string>("");
  const [selectedBookSection, setSelectedBookSection] = useState<string>("");
  const [selectedMusicSection, setSelectedMusicSection] = useState<string>("");

  const { profile, loading, updateProfile, uploadImage } = useProfile(
    user?.uid
  );

  // Fetch public collections
  const fetchPublicCollections = async (userId: string) => {
    setLoadingPublicCollections(true);
    try {
      const collections: PublicCollection[] = [];
      const items: PublicCollectionItems = {};

      console.log("Fetching public collections for user:", userId);

      // Fetch public movie collections
      const movieListsRef = collection(db, "users", userId, "movieLists");
      const movieListsSnapshot = await getDocs(
        query(movieListsRef, where("isPublic", "==", true))
      );

      console.log(
        "Found",
        movieListsSnapshot.docs.length,
        "public movie collections"
      );

      for (const doc of movieListsSnapshot.docs) {
        const data = doc.data();
        const collectionId = doc.id;

        console.log(
          "Processing movie collection:",
          data.name,
          "with ID:",
          collectionId
        );

        // Fetch movies in this collection from the subcollection structure
        let collectionMovies: any[] = [];
        try {
          const moviesRef = collection(
            db,
            "users",
            userId,
            "movieLists",
            collectionId,
            "movies"
          );
          const moviesSnapshot = await getDocs(moviesRef);
          collectionMovies = moviesSnapshot.docs.map((movieDoc) => {
            const movieData = movieDoc.data();
            return {
              id: movieDoc.id,
              title: movieData.title,
              year: movieData.year,
              cover: movieData.cover,
              rating: movieData.rating,
              notes: movieData.notes,
            };
          });
        } catch (error) {
          console.log(
            "Error fetching movies for collection",
            collectionId,
            ":",
            error
          );
        }

        console.log(
          "Found",
          collectionMovies.length,
          "movies in collection:",
          data.name
        );

        collections.push({
          id: collectionId,
          name: data.name,
          isPublic: data.isPublic,
          isDefault: data.isDefault || false,
          type: "movies",
          itemCount: collectionMovies.length,
        });

        items[collectionId] = collectionMovies;
      }

      // Fetch public series collections
      const seriesListsRef = collection(db, "users", userId, "seriesLists");
      const seriesListsSnapshot = await getDocs(
        query(seriesListsRef, where("isPublic", "==", true))
      );

      console.log(
        "Found",
        seriesListsSnapshot.docs.length,
        "public series collections"
      );
      console.log(
        "Public series collections:",
        seriesListsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      );

      for (const doc of seriesListsSnapshot.docs) {
        const data = doc.data();
        const collectionId = doc.id;

        console.log(
          "Processing series collection:",
          data.name,
          "with ID:",
          collectionId
        );

        // Fetch series in this collection from the subcollection structure
        let collectionSeries: any[] = [];
        try {
          const seriesRef = collection(
            db,
            "users",
            userId,
            "seriesLists",
            collectionId,
            "series"
          );
          const seriesSnapshot = await getDocs(seriesRef);
          collectionSeries = seriesSnapshot.docs.map((seriesDoc) => {
            const seriesData = seriesDoc.data();
            return {
              id: seriesDoc.id,
              title: seriesData.title,
              year: seriesData.year,
              cover: seriesData.cover,
              rating: seriesData.rating,
              notes: seriesData.notes,
            };
          });
        } catch (error) {
          console.log(
            "Error fetching series for collection",
            collectionId,
            ":",
            error
          );
        }

        console.log(
          "Found",
          collectionSeries.length,
          "series in collection:",
          data.name
        );
        console.log("Series in collection:", collectionSeries);

        collections.push({
          id: collectionId,
          name: data.name,
          isPublic: data.isPublic,
          isDefault: data.isDefault || false,
          type: "series",
          itemCount: collectionSeries.length,
        });

        items[collectionId] = collectionSeries;
      }

      // Fetch public book collections
      const bookCollectionsRef = collection(db, "users", userId, "collections");
      const bookCollectionsSnapshot = await getDocs(
        query(bookCollectionsRef, where("isPublic", "==", true))
      );

      console.log(
        "Found",
        bookCollectionsSnapshot.docs.length,
        "public book collections"
      );

      for (const doc of bookCollectionsSnapshot.docs) {
        const data = doc.data();
        const collectionId = doc.id;

        console.log(
          "Processing book collection:",
          data.name,
          "with ID:",
          collectionId
        );

        // Fetch books in this collection
        const booksRef = collection(db, "users", userId, "books");
        const booksSnapshot = await getDocs(booksRef);
        const collectionBooks = booksSnapshot.docs
          .map((bookDoc) => {
            const bookData = bookDoc.data();
            if (
              bookData.collections &&
              bookData.collections.includes(collectionId)
            ) {
              return {
                id: bookDoc.id,
                title: bookData.title,
                author: bookData.author,
                year: bookData.year,
                cover: bookData.cover,
                rating: bookData.rating,
                progress: bookData.progress,
              };
            }
            return null;
          })
          .filter(Boolean);

        console.log(
          "Found",
          collectionBooks.length,
          "books in collection:",
          data.name
        );

        collections.push({
          id: collectionId,
          name: data.name,
          isPublic: data.isPublic,
          isDefault: data.isDefault || false,
          type: "books",
          itemCount: collectionBooks.length,
        });

        items[collectionId] = collectionBooks;
      }

      setPublicCollections(collections);
      setPublicCollectionItems(items);

      console.log("Public collections fetch complete:", {
        totalCollections: collections.length,
        totalItems: Object.values(items).flat().length,
        collectionsByType: {
          movies: collections.filter((c) => c.type === "movies").length,
          series: collections.filter((c) => c.type === "series").length,
          books: collections.filter((c) => c.type === "books").length,
        },
      });
    } catch (error) {
      console.error("Error fetching public collections:", error);
    } finally {
      setLoadingPublicCollections(false);
    }
  };

  // Fetch public collections when user changes
  useEffect(() => {
    if (user?.uid) {
      fetchPublicCollections(user.uid);
    }
  }, [user]);

  // Helper functions to get public collections by type
  const getPublicMovieCollections = () => {
    return publicCollections.filter((col) => col.type === "movies");
  };

  const getPublicSeriesCollections = () => {
    return publicCollections.filter((col) => col.type === "series");
  };

  const getPublicBookCollections = () => {
    return publicCollections.filter((col) => col.type === "books");
  };

  // Get items by selected collection
  const getMoviesBySelectedCollection = () => {
    if (selectedMovieCollection === "all") {
      return getMoviesBySection("top5").concat(
        getMoviesBySection("watched"),
        getMoviesBySection("watchlist"),
        getMoviesBySection("recommended")
      );
    } else if (selectedMovieCollection.startsWith("public_")) {
      const collectionId = selectedMovieCollection.replace("public_", "");
      return publicCollectionItems[collectionId] || [];
    } else {
      return getMoviesBySection(selectedMovieCollection);
    }
  };

  const getSeriesBySelectedCollection = () => {
    if (selectedSeriesCollection === "all") {
      return getSeriesBySection("top5").concat(
        getSeriesBySection("watched"),
        getSeriesBySection("watchlist"),
        getSeriesBySection("recommended")
      );
    } else if (selectedSeriesCollection.startsWith("public_")) {
      const collectionId = selectedSeriesCollection.replace("public_", "");
      return publicCollectionItems[collectionId] || [];
    } else {
      return getSeriesBySection(selectedSeriesCollection);
    }
  };

  const getBooksBySelectedCollection = () => {
    if (selectedBookCollection === "all") {
      return getBooksBySection("top5").concat(
        getBooksBySection("read"),
        getBooksBySection("reading"),
        getBooksBySection("recommended")
      );
    } else if (selectedBookCollection.startsWith("public_")) {
      const collectionId = selectedBookCollection.replace("public_", "");
      return publicCollectionItems[collectionId] || [];
    } else {
      return getBooksBySection(selectedBookCollection);
    }
  };

  const {
    movies,
    series,
    books,
    loading: collectionsLoading,
    error: collectionsError,
    addMovie,
    addSeries,
    addBook,
    getMoviesBySection,
    getSeriesBySection,
    getBooksBySection,
  } = useCollections(user?.uid);

  // Search hooks with debouncing
  const movieSearch = useSearch(
    (query: string) => searchService.searchMovies(query),
    { debounceMs: 500, minQueryLength: 2 }
  );

  const seriesSearch = useSearch(
    (query: string) => searchService.searchSeries(query),
    { debounceMs: 500, minQueryLength: 2 }
  );

  const bookSearch = useSearch(
    (query: string) => searchService.searchBooks(query),
    { debounceMs: 500, minQueryLength: 2 }
  );

  const musicSearch = useSearch(
    (query: string) => searchService.searchMusic(query),
    { debounceMs: 500, minQueryLength: 2 }
  );

  // Mock collections data
  const mockCollections: Collection[] = [
    {
      id: "1",
      name: "thrillers you can watch",
      description: "10 movies",
      itemCount: 10,
      commentCount: 300,
    },
    {
      id: "2",
      name: "you got to watch these movies before you die",
      description: "",
      itemCount: 0,
      commentCount: 0,
    },
    {
      id: "3",
      name: "horror i would watch when im alone",
      description: "",
      itemCount: 0,
      commentCount: 0,
    },
  ];

  const handleAvatarUpload = async (file: File) => {
    const url = await uploadImage(file, "avatar");
    await updateProfile({ avatarUrl: url });
  };

  const handleAddMovie = async (movie: TMDBMovie) => {
    try {
      await addMovie(movie, selectedMovieSection);
      setAddMovieModalOpen(false);
      movieSearch.clearSearch();
      // Refresh public collections if the movie was added to a public collection
      if (
        user?.uid &&
        selectedMovieSection &&
        publicCollections.some(
          (col) => col.id === selectedMovieSection && col.isPublic
        )
      ) {
        await fetchPublicCollections(user.uid);
      }
    } catch (error) {
      console.error("Error adding movie:", error);
    }
  };

  const handleAddSeries = async (series: TMDBSeries) => {
    try {
      await addSeries(series, selectedSeriesSection);
      setAddSeriesModalOpen(false);
      seriesSearch.clearSearch();
      // Refresh public collections if the series was added to a public collection
      if (
        user?.uid &&
        selectedSeriesSection &&
        publicCollections.some(
          (col) => col.id === selectedSeriesSection && col.isPublic
        )
      ) {
        await fetchPublicCollections(user.uid);
      }
    } catch (error) {
      console.error("Error adding series:", error);
    }
  };

  const handleAddBook = async (book: GoogleBook) => {
    try {
      await addBook(book, selectedBookSection);
      setAddBookModalOpen(false);
      bookSearch.clearSearch();
      // Refresh public collections if the book was added to a public collection
      if (
        user?.uid &&
        selectedBookSection &&
        publicCollections.some(
          (col) => col.id === selectedBookSection && col.isPublic
        )
      ) {
        await fetchPublicCollections(user.uid);
      }
    } catch (error) {
      console.error("Error adding book:", error);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-muted-foreground">
            Please log in to view your profile.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background">
        {/* Top Profile Section */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row items-start gap-4 mb-6">
            {/* Profile Picture */}
            <ImageUpload onUpload={handleAvatarUpload}>
              <Avatar className="w-16 h-16 sm:w-20 sm:h-20 border-2 border-border cursor-pointer">
                <AvatarImage
                  src={profile?.avatarUrl || "/placeholder-user.jpg"}
                  alt={user.displayName || "User"}
                />
                <AvatarFallback className="text-sm sm:text-lg">
                  <User className="h-6 w-6 sm:h-8 sm:w-8" />
                </AvatarFallback>
              </Avatar>
            </ImageUpload>

            {/* User Info */}
            <div className="flex-1 w-full">
              <h1 className="text-xl sm:text-2xl font-bold mb-1">
                {user.displayName || "guy 1"}
              </h1>
              <p className="text-muted-foreground mb-3">bio</p>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  add picture
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditDialogOpen(true)}
                  className="w-full sm:w-auto"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  edit page
                </Button>
              </div>
            </div>
          </div>

          {/* Global Bio Section */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Bio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {profile?.bio ||
                  "Share your thoughts about movies and your cinematic journey..."}
              </p>
            </CardContent>
          </Card>

          {/* Navigation Tabs */}
          <Tabs
            value={activeTab}
            onValueChange={(value) => {
              setActiveTab(value);
              // Reset collection selections when switching tabs
              if (value !== activeTab) {
                setSelectedMovieCollection("all");
                setSelectedSeriesCollection("all");
                setSelectedBookCollection("all");
              }
            }}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
              <TabsTrigger value="movies" className="text-xs sm:text-sm">
                movies
              </TabsTrigger>
              <TabsTrigger value="music" className="text-xs sm:text-sm">
                music
              </TabsTrigger>
              <TabsTrigger value="series" className="text-xs sm:text-sm">
                series
              </TabsTrigger>
              <TabsTrigger value="books" className="text-xs sm:text-sm">
                books
              </TabsTrigger>
            </TabsList>

            {/* Movies Tab */}
            <TabsContent value="movies" className="mt-6 space-y-6">
              {/* Collection Selection */}
              <div className="flex flex-wrap gap-2 mb-4">
                <Button
                  variant={
                    selectedMovieCollection === "all" ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => setSelectedMovieCollection("all")}
                >
                  All Movies
                </Button>
                <Button
                  variant={
                    selectedMovieCollection === "top5" ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => setSelectedMovieCollection("top5")}
                >
                  Top 5
                </Button>
                <Button
                  variant={
                    selectedMovieCollection === "watched"
                      ? "default"
                      : "outline"
                  }
                  size="sm"
                  onClick={() => setSelectedMovieCollection("watched")}
                >
                  Watched
                </Button>
                <Button
                  variant={
                    selectedMovieCollection === "watchlist"
                      ? "default"
                      : "outline"
                  }
                  size="sm"
                  onClick={() => setSelectedMovieCollection("watchlist")}
                >
                  Watchlist
                </Button>
                <Button
                  variant={
                    selectedMovieCollection === "recommended"
                      ? "default"
                      : "outline"
                  }
                  size="sm"
                  onClick={() => setSelectedMovieCollection("recommended")}
                >
                  Recommended
                </Button>
                {getPublicMovieCollections().map((collection) => (
                  <Button
                    key={collection.id}
                    variant={
                      selectedMovieCollection === `public_${collection.id}`
                        ? "default"
                        : "outline"
                    }
                    size="sm"
                    onClick={() =>
                      setSelectedMovieCollection(`public_${collection.id}`)
                    }
                    className="flex items-center gap-1"
                  >
                    <Globe className="h-3 w-3" />
                    {collection.name}
                  </Button>
                ))}
              </div>

              {/* Selected Collection Items */}
              <HorizontalList
                title={
                  selectedMovieCollection === "all"
                    ? "All Movies"
                    : selectedMovieCollection === "top5"
                    ? "Top 5"
                    : selectedMovieCollection === "watched"
                    ? "Watched"
                    : selectedMovieCollection === "watchlist"
                    ? "Watchlist"
                    : selectedMovieCollection === "recommended"
                    ? "Recommended"
                    : selectedMovieCollection.startsWith("public_")
                    ? getPublicMovieCollections().find(
                        (c) =>
                          c.id ===
                          selectedMovieCollection.replace("public_", "")
                      )?.name || "Collection"
                    : "Movies"
                }
                icon={
                  selectedMovieCollection === "all" ? (
                    <Film className="h-5 w-5" />
                  ) : selectedMovieCollection === "top5" ? (
                    <Crown className="h-5 w-5" />
                  ) : selectedMovieCollection === "watched" ? (
                    <Play className="h-5 w-5" />
                  ) : selectedMovieCollection === "watchlist" ? (
                    <Clock className="h-5 w-5" />
                  ) : selectedMovieCollection === "recommended" ? (
                    <ThumbsUp className="h-5 w-5" />
                  ) : selectedMovieCollection.startsWith("public_") ? (
                    <Globe className="h-5 w-5" />
                  ) : (
                    <Film className="h-5 w-5" />
                  )
                }
                items={getMoviesBySelectedCollection()}
                onAddItemAction={() => {
                  setSelectedMovieSection(selectedMovieCollection);
                  setAddMovieModalOpen(true);
                }}
                emptyMessage={
                  selectedMovieCollection === "all"
                    ? "No movies yet"
                    : selectedMovieCollection === "top5"
                    ? "No top 5 movies yet"
                    : selectedMovieCollection === "watched"
                    ? "No watched movies yet"
                    : selectedMovieCollection === "watchlist"
                    ? "No movies in watchlist"
                    : selectedMovieCollection === "recommended"
                    ? "No recommended movies yet"
                    : selectedMovieCollection.startsWith("public_")
                    ? `No movies in ${
                        getPublicMovieCollections().find(
                          (c) =>
                            c.id ===
                            selectedMovieCollection.replace("public_", "")
                        )?.name || "this collection"
                      } yet`
                    : "No movies yet"
                }
                emptyIcon={
                  selectedMovieCollection === "all" ? (
                    <Film className="h-12 w-12 mx-auto mb-2" />
                  ) : selectedMovieCollection === "top5" ? (
                    <Crown className="h-12 w-12 mx-auto mb-2" />
                  ) : selectedMovieCollection === "watched" ? (
                    <Play className="h-12 w-12 mx-auto mb-2" />
                  ) : selectedMovieCollection === "watchlist" ? (
                    <Clock className="h-12 w-12 mx-auto mb-2" />
                  ) : selectedMovieCollection === "recommended" ? (
                    <ThumbsUp className="h-12 w-12 mx-auto mb-2" />
                  ) : selectedMovieCollection.startsWith("public_") ? (
                    <Globe className="h-12 w-12 mx-auto mb-2" />
                  ) : (
                    <Film className="h-12 w-12 mx-auto mb-2" />
                  )
                }
                showRating={selectedMovieCollection === "watched"}
                showSpecialIcon={
                  selectedMovieCollection === "top5" ||
                  selectedMovieCollection === "recommended" ||
                  selectedMovieCollection.startsWith("public_")
                }
                specialIcon={
                  selectedMovieCollection === "top5" ? (
                    <Crown className="h-3 w-3 text-yellow-500" />
                  ) : selectedMovieCollection === "recommended" ? (
                    <ThumbsUp className="h-3 w-3 text-green-500" />
                  ) : selectedMovieCollection.startsWith("public_") ? (
                    <Globe className="h-3 w-3 text-blue-500" />
                  ) : undefined
                }
              />
            </TabsContent>

            {/* Music Tab */}
            <TabsContent value="music" className="mt-6">
              <div className="text-center py-12">
                <Music className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Music Collection</h3>
                <p className="text-muted-foreground">
                  Your music collection will appear here
                </p>
              </div>
            </TabsContent>

            {/* Series Tab */}
            <TabsContent value="series" className="mt-6 space-y-6">
              {/* Collection Selection */}
              <div className="flex flex-wrap gap-2 mb-4">
                <Button
                  variant={
                    selectedSeriesCollection === "all" ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => setSelectedSeriesCollection("all")}
                >
                  All Series
                </Button>
                <Button
                  variant={
                    selectedSeriesCollection === "top5" ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => setSelectedSeriesCollection("top5")}
                >
                  Top 5
                </Button>
                <Button
                  variant={
                    selectedSeriesCollection === "watched"
                      ? "default"
                      : "outline"
                  }
                  size="sm"
                  onClick={() => setSelectedSeriesCollection("watched")}
                >
                  Watched
                </Button>
                <Button
                  variant={
                    selectedSeriesCollection === "watchlist"
                      ? "default"
                      : "outline"
                  }
                  size="sm"
                  onClick={() => setSelectedSeriesCollection("watchlist")}
                >
                  Watchlist
                </Button>
                <Button
                  variant={
                    selectedSeriesCollection === "recommended"
                      ? "default"
                      : "outline"
                  }
                  size="sm"
                  onClick={() => setSelectedSeriesCollection("recommended")}
                >
                  Recommended
                </Button>
                {getPublicSeriesCollections().map((collection) => (
                  <Button
                    key={collection.id}
                    variant={
                      selectedSeriesCollection === `public_${collection.id}`
                        ? "default"
                        : "outline"
                    }
                    size="sm"
                    onClick={() =>
                      setSelectedSeriesCollection(`public_${collection.id}`)
                    }
                    className="flex items-center gap-1"
                  >
                    <Globe className="h-3 w-3" />
                    {collection.name}
                  </Button>
                ))}
              </div>

              {/* Selected Collection Items */}
              <HorizontalList
                title={
                  selectedSeriesCollection === "all"
                    ? "All Series"
                    : selectedSeriesCollection === "top5"
                    ? "Top 5"
                    : selectedSeriesCollection === "watched"
                    ? "Watched"
                    : selectedSeriesCollection === "watchlist"
                    ? "Watchlist"
                    : selectedSeriesCollection === "recommended"
                    ? "Recommended"
                    : selectedSeriesCollection.startsWith("public_")
                    ? getPublicSeriesCollections().find(
                        (c) =>
                          c.id ===
                          selectedSeriesCollection.replace("public_", "")
                      )?.name || "Collection"
                    : "Series"
                }
                icon={
                  selectedSeriesCollection === "all" ? (
                    <Tv className="h-5 w-5" />
                  ) : selectedSeriesCollection === "top5" ? (
                    <Crown className="h-5 w-5" />
                  ) : selectedSeriesCollection === "watched" ? (
                    <Play className="h-5 w-5" />
                  ) : selectedSeriesCollection === "watchlist" ? (
                    <Clock className="h-5 w-5" />
                  ) : selectedSeriesCollection === "recommended" ? (
                    <ThumbsUp className="h-5 w-5" />
                  ) : selectedSeriesCollection.startsWith("public_") ? (
                    <Globe className="h-5 w-5" />
                  ) : (
                    <Tv className="h-5 w-5" />
                  )
                }
                items={getSeriesBySelectedCollection()}
                onAddItemAction={() => {
                  setSelectedSeriesSection(selectedSeriesCollection);
                  setAddSeriesModalOpen(true);
                }}
                emptyMessage={
                  selectedSeriesCollection === "all"
                    ? "No series yet"
                    : selectedSeriesCollection === "top5"
                    ? "No top 5 series yet"
                    : selectedSeriesCollection === "watched"
                    ? "No watched series yet"
                    : selectedSeriesCollection === "watchlist"
                    ? "No series in watchlist"
                    : selectedSeriesCollection === "recommended"
                    ? "No recommended series yet"
                    : selectedSeriesCollection.startsWith("public_")
                    ? `No series in ${
                        getPublicSeriesCollections().find(
                          (c) =>
                            c.id ===
                            selectedSeriesCollection.replace("public_", "")
                        )?.name || "this collection"
                      } yet`
                    : "No series yet"
                }
                emptyIcon={
                  selectedSeriesCollection === "all" ? (
                    <Tv className="h-12 w-12 mx-auto mb-2" />
                  ) : selectedSeriesCollection === "top5" ? (
                    <Crown className="h-12 w-12 mx-auto mb-2" />
                  ) : selectedSeriesCollection === "watched" ? (
                    <Play className="h-12 w-12 mx-auto mb-2" />
                  ) : selectedSeriesCollection === "watchlist" ? (
                    <Clock className="h-12 w-12 mx-auto mb-2" />
                  ) : selectedSeriesCollection === "recommended" ? (
                    <ThumbsUp className="h-12 w-12 mx-auto mb-2" />
                  ) : selectedSeriesCollection.startsWith("public_") ? (
                    <Globe className="h-12 w-12 mx-auto mb-2" />
                  ) : (
                    <Tv className="h-12 w-12 mx-auto mb-2" />
                  )
                }
                showRating={selectedSeriesCollection === "watched"}
                showSpecialIcon={
                  selectedSeriesCollection === "top5" ||
                  selectedSeriesCollection === "recommended" ||
                  selectedSeriesCollection.startsWith("public_")
                }
                specialIcon={
                  selectedSeriesCollection === "top5" ? (
                    <Crown className="h-3 w-3 text-yellow-500" />
                  ) : selectedSeriesCollection === "recommended" ? (
                    <ThumbsUp className="h-3 w-3 text-green-500" />
                  ) : selectedSeriesCollection.startsWith("public_") ? (
                    <Globe className="h-3 w-3 text-blue-500" />
                  ) : undefined
                }
              />
            </TabsContent>

            {/* Books Tab */}
            <TabsContent value="books" className="mt-6 space-y-6">
              {/* Collection Selection */}
              <div className="flex flex-wrap gap-2 mb-4">
                <Button
                  variant={
                    selectedBookCollection === "all" ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => setSelectedBookCollection("all")}
                >
                  All Books
                </Button>
                <Button
                  variant={
                    selectedBookCollection === "top5" ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => setSelectedBookCollection("top5")}
                >
                  Top 5
                </Button>
                <Button
                  variant={
                    selectedBookCollection === "read" ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => setSelectedBookCollection("read")}
                >
                  Read
                </Button>
                <Button
                  variant={
                    selectedBookCollection === "reading" ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => setSelectedBookCollection("reading")}
                >
                  Reading List
                </Button>
                <Button
                  variant={
                    selectedBookCollection === "recommended"
                      ? "default"
                      : "outline"
                  }
                  size="sm"
                  onClick={() => setSelectedBookCollection("recommended")}
                >
                  Recommended
                </Button>
                {getPublicBookCollections().map((collection) => (
                  <Button
                    key={collection.id}
                    variant={
                      selectedBookCollection === `public_${collection.id}`
                        ? "default"
                        : "outline"
                    }
                    size="sm"
                    onClick={() =>
                      setSelectedBookCollection(`public_${collection.id}`)
                    }
                    className="flex items-center gap-1"
                  >
                    <Globe className="h-3 w-3" />
                    {collection.name}
                  </Button>
                ))}
              </div>

              {/* Selected Collection Items */}
              <HorizontalList
                title={
                  selectedBookCollection === "all"
                    ? "All Books"
                    : selectedBookCollection === "top5"
                    ? "Top 5"
                    : selectedBookCollection === "read"
                    ? "Read"
                    : selectedBookCollection === "reading"
                    ? "Reading List"
                    : selectedBookCollection === "recommended"
                    ? "Recommended"
                    : selectedBookCollection.startsWith("public_")
                    ? getPublicBookCollections().find(
                        (c) =>
                          c.id === selectedBookCollection.replace("public_", "")
                      )?.name || "Collection"
                    : "Books"
                }
                icon={
                  selectedBookCollection === "all" ? (
                    <BookOpen className="h-5 w-5" />
                  ) : selectedBookCollection === "top5" ? (
                    <Crown className="h-5 w-5" />
                  ) : selectedBookCollection === "read" ? (
                    <Play className="h-5 w-5" />
                  ) : selectedBookCollection === "reading" ? (
                    <Clock className="h-5 w-5" />
                  ) : selectedBookCollection === "recommended" ? (
                    <ThumbsUp className="h-5 w-5" />
                  ) : selectedBookCollection.startsWith("public_") ? (
                    <Globe className="h-5 w-5" />
                  ) : (
                    <BookOpen className="h-5 w-5" />
                  )
                }
                items={getBooksBySelectedCollection()}
                onAddItemAction={() => {
                  setSelectedBookSection(selectedBookCollection);
                  setAddBookModalOpen(true);
                }}
                emptyMessage={
                  selectedBookCollection === "all"
                    ? "No books yet"
                    : selectedBookCollection === "top5"
                    ? "No top 5 books yet"
                    : selectedBookCollection === "read"
                    ? "No read books yet"
                    : selectedBookCollection === "reading"
                    ? "No books in reading list"
                    : selectedBookCollection === "recommended"
                    ? "No recommended books yet"
                    : selectedBookCollection.startsWith("public_")
                    ? `No books in ${
                        getPublicBookCollections().find(
                          (c) =>
                            c.id ===
                            selectedBookCollection.replace("public_", "")
                        )?.name || "this collection"
                      } yet`
                    : "No books yet"
                }
                emptyIcon={
                  selectedBookCollection === "all" ? (
                    <BookOpen className="h-12 w-12 mx-auto mb-2" />
                  ) : selectedBookCollection === "top5" ? (
                    <Crown className="h-12 w-12 mx-auto mb-2" />
                  ) : selectedBookCollection === "read" ? (
                    <Play className="h-12 w-12 mx-auto mb-2" />
                  ) : selectedBookCollection === "reading" ? (
                    <Clock className="h-12 w-12 mx-auto mb-2" />
                  ) : selectedBookCollection === "recommended" ? (
                    <ThumbsUp className="h-12 w-12 mx-auto mb-2" />
                  ) : selectedBookCollection.startsWith("public_") ? (
                    <Globe className="h-12 w-12 mx-auto mb-2" />
                  ) : (
                    <BookOpen className="h-12 w-12 mx-auto mb-2" />
                  )
                }
                showRating={selectedBookCollection === "read"}
                showSpecialIcon={
                  selectedBookCollection === "top5" ||
                  selectedBookCollection === "recommended" ||
                  selectedBookCollection.startsWith("public_")
                }
                specialIcon={
                  selectedBookCollection === "top5" ? (
                    <Crown className="h-3 w-3 text-yellow-500" />
                  ) : selectedBookCollection === "recommended" ? (
                    <ThumbsUp className="h-3 w-3 text-green-500" />
                  ) : selectedBookCollection.startsWith("public_") ? (
                    <Globe className="h-3 w-3 text-blue-500" />
                  ) : undefined
                }
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Movie Search Modal */}
        <SearchModal
          isOpen={addMovieModalOpen}
          onOpenChangeAction={(open) => {
            setAddMovieModalOpen(open);
            if (!open) {
              movieSearch.clearSearch();
            }
          }}
          title={`Add Movie to ${
            selectedMovieSection.charAt(0).toUpperCase() +
            selectedMovieSection.slice(1)
          }`}
          searchQuery={movieSearch.query}
          setSearchQueryAction={movieSearch.setQuery}
          searchResults={movieSearch.results}
          isSearching={movieSearch.isSearching}
          onSearchAction={movieSearch.search}
          onItemClickAction={handleAddMovie}
          itemType="movie"
          error={movieSearch.error}
        />

        {/* Series Search Modal */}
        <SearchModal
          isOpen={addSeriesModalOpen}
          onOpenChangeAction={(open) => {
            setAddSeriesModalOpen(open);
            if (!open) {
              seriesSearch.clearSearch();
            }
          }}
          title={`Add Series to ${
            selectedSeriesSection.charAt(0).toUpperCase() +
            selectedSeriesSection.slice(1)
          }`}
          searchQuery={seriesSearch.query}
          setSearchQueryAction={seriesSearch.setQuery}
          searchResults={seriesSearch.results}
          isSearching={seriesSearch.isSearching}
          onSearchAction={seriesSearch.search}
          onItemClickAction={handleAddSeries}
          itemType="series"
          error={seriesSearch.error}
        />

        {/* Book Search Modal */}
        <SearchModal
          isOpen={addBookModalOpen}
          onOpenChangeAction={(open) => {
            setAddBookModalOpen(open);
            if (!open) {
              bookSearch.clearSearch();
            }
          }}
          title={`Add Book to ${
            selectedBookSection.charAt(0).toUpperCase() +
            selectedBookSection.slice(1)
          }`}
          searchQuery={bookSearch.query}
          setSearchQueryAction={bookSearch.setQuery}
          searchResults={bookSearch.results}
          isSearching={bookSearch.isSearching}
          onSearchAction={bookSearch.search}
          onItemClickAction={handleAddBook}
          itemType="book"
          error={bookSearch.error}
        />

        {/* Music Search Modal */}
        <SearchModal
          isOpen={addMusicModalOpen}
          onOpenChangeAction={setAddMusicModalOpen}
          title={`Add Music to ${
            selectedMusicSection.charAt(0).toUpperCase() +
            selectedMusicSection.slice(1)
          }`}
          searchQuery={musicSearch.query}
          setSearchQueryAction={musicSearch.setQuery}
          searchResults={musicSearch.results}
          isSearching={musicSearch.isSearching}
          onSearchAction={musicSearch.search}
          onItemClickAction={(music: any) => console.log("Add music:", music)}
          itemType="music"
          error={musicSearch.error}
        />

        {/* Edit Profile Dialog */}
        {profile && (
          <EditProfileDialog
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            profile={profile}
            onSave={updateProfile}
            saving={loading}
          />
        )}

        {/* Debug Panel (Development Only) */}
        <DebugPanel
          data={{
            user: user
              ? { uid: user.uid, displayName: user.displayName }
              : null,
            profile: profile
              ? { bio: profile.bio, avatarUrl: profile.avatarUrl }
              : null,
            collections: {
              movies: movies.length,
              series: series.length,
              books: books.length,
            },
            publicCollections: {
              collections: publicCollections.length,
              loading: loadingPublicCollections,
              items: Object.keys(publicCollectionItems).length,
              movieCollections: getPublicMovieCollections().length,
              seriesCollections: getPublicSeriesCollections().length,
              bookCollections: getPublicBookCollections().length,
            },
            selectedCollections: {
              movies: selectedMovieCollection,
              series: selectedSeriesCollection,
              books: selectedBookCollection,
            },
            search: {
              movieSearch: {
                query: movieSearch.query,
                results: movieSearch.results.length,
                isSearching: movieSearch.isSearching,
                error: movieSearch.error,
              },
              seriesSearch: {
                query: seriesSearch.query,
                results: seriesSearch.results.length,
                isSearching: seriesSearch.isSearching,
                error: seriesSearch.error,
              },
              bookSearch: {
                query: bookSearch.query,
                results: bookSearch.results.length,
                isSearching: bookSearch.isSearching,
                error: bookSearch.error,
              },
            },
            modals: {
              addMovieModalOpen,
              addSeriesModalOpen,
              addBookModalOpen,
              addMusicModalOpen,
            },
            sections: {
              selectedMovieSection,
              selectedSeriesSection,
              selectedBookSection,
              selectedMusicSection,
            },
          }}
          title="Profile Page Debug"
        />
      </div>
    </ErrorBoundary>
  );
}
