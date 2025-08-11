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
  Heart,
  MessageCircle,
  ChevronRight,
  Eye,
  EyeOff,
  MessageSquare,
  MoreHorizontal,
} from "lucide-react";
import { EditProfileDialog } from "@/components/edit-profile";
import { ImageUpload } from "@/components/image-upload";
import { SearchModal } from "@/components/search-modal";
import { HorizontalList } from "@/components/horizontal-list";
import { MovieCard } from "@/components/movie-card";
import { ReviewsSection } from "@/components/reviews-section";
import { EnhancedMediaBar } from "@/components/enhanced-media-bar";
import ProfileMusicSection from "@/components/profile-music-section";
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

  // Mock movie data for demonstration
  const mockMovies = {
    watched: [
      {
        id: "603",
        title: "The Matrix",
        year: 1999,
        cover:
          "https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg",
        rating: 4.8,
        status: "watched",
        mediaType: "movie" as const,
      },
      {
        id: "27205",
        title: "Inception",
        year: 2010,
        cover:
          "https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg",
        rating: 4.5,
        status: "watched",
        mediaType: "movie" as const,
      },
      {
        id: "157336",
        title: "Interstellar",
        year: 2014,
        cover:
          "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
        rating: 4.7,
        status: "watched",
        mediaType: "movie" as const,
      },
      {
        id: "155",
        title: "The Dark Knight",
        year: 2008,
        cover:
          "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
        rating: 4.9,
        status: "watched",
        mediaType: "movie" as const,
      },
      {
        id: "680",
        title: "Pulp Fiction",
        year: 1994,
        cover:
          "https://image.tmdb.org/t/p/w500/fIE3lAGcZDV1G6XM5KmuWnNsPp1.jpg",
        rating: 4.6,
        status: "watched",
        mediaType: "movie" as const,
      },
      {
        id: "550",
        title: "Fight Club",
        year: 1999,
        cover:
          "https://image.tmdb.org/t/p/w500/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
        rating: 4.4,
        status: "watched",
        mediaType: "movie" as const,
      },
    ],
    top5: [
      {
        id: "603",
        title: "The Matrix",
        year: 1999,
        cover:
          "https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg",
        rating: 4.8,
        status: "top5",
        mediaType: "movie" as const,
      },
      {
        id: "27205",
        title: "Inception",
        year: 2010,
        cover:
          "https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg",
        rating: 4.5,
        status: "top5",
        mediaType: "movie" as const,
      },
      {
        id: "157336",
        title: "Interstellar",
        year: 2014,
        cover:
          "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
        rating: 4.7,
        status: "top5",
        mediaType: "movie" as const,
      },
      {
        id: "155",
        title: "The Dark Knight",
        year: 2008,
        cover:
          "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
        rating: 4.9,
        status: "top5",
        mediaType: "movie" as const,
      },
      {
        id: "680",
        title: "Pulp Fiction",
        year: 1994,
        cover:
          "https://image.tmdb.org/t/p/w500/fIE3lAGcZDV1G6XM5KmuWnNsPp1.jpg",
        rating: 4.6,
        status: "top5",
        mediaType: "movie" as const,
      },
    ],
    recommended: [
      {
        id: "299536",
        title: "Avengers: Infinity War",
        year: 2018,
        cover:
          "https://image.tmdb.org/t/p/w500/7WsyChQLEftFiDOVTGkv3hFpyyt.jpg",
        rating: 4.6,
        status: "recommended",
        mediaType: "movie" as const,
      },
      {
        id: "299534",
        title: "Avengers: Endgame",
        year: 2019,
        cover:
          "https://image.tmdb.org/t/p/w500/or06FN3Dka5tukK1e9sl16pB3iy.jpg",
        rating: 4.7,
        status: "recommended",
        mediaType: "movie" as const,
      },
      {
        id: "181808",
        title: "Star Wars: The Last Jedi",
        year: 2017,
        cover:
          "https://image.tmdb.org/t/p/w500/kOVEVeg59E0wsnXmF9nrh6OmWII.jpg",
        rating: 4.3,
        status: "recommended",
        mediaType: "movie" as const,
      },
      {
        id: "181809",
        title: "Star Wars: The Rise of Skywalker",
        year: 2019,
        cover:
          "https://image.tmdb.org/t/p/w500/db32LaOibw8liAmU2SMBYBg2Dtr.jpg",
        rating: 4.2,
        status: "recommended",
        mediaType: "movie" as const,
      },
      {
        id: "49524",
        title: "The Twilight Saga: Breaking Dawn - Part 2",
        year: 2012,
        cover:
          "https://image.tmdb.org/t/p/w500/3nNLhKXUeeJXQZbMfX4juoyBamP.jpg",
        rating: 4.1,
        status: "watchlist",
        mediaType: "movie" as const,
      },
      {
        id: "550988",
        title: "Free Guy",
        year: 2021,
        cover:
          "https://image.tmdb.org/t/p/w500/xmbU4JTUm8rsdtn7Y3Fcm30SXM9.jpg",
        rating: 4.0,
        status: "watchlist",
        mediaType: "movie" as const,
      },
      {
        id: "634649",
        title: "Spider-Man: No Way Home",
        year: 2021,
        cover:
          "https://image.tmdb.org/t/p/w500/1g0dhYtq4irTY1GPXvft6k4YLjm.jpg",
        rating: 4.5,
        status: "watchlist",
        mediaType: "movie" as const,
      },
    ],
    watchlist: [
      {
        id: "299536",
        title: "Avengers: Infinity War",
        year: 2018,
        cover:
          "https://image.tmdb.org/t/p/w500/7WsyChQLEftFiDOVTGkv3hFpyyt.jpg",
        rating: 4.6,
        status: "watchlist",
        mediaType: "movie" as const,
      },
      {
        id: "299534",
        title: "Avengers: Endgame",
        year: 2019,
        cover:
          "https://image.tmdb.org/t/p/w500/or06FN3Dka5tukK1e9sl16pB3iy.jpg",
        rating: 4.7,
        status: "watchlist",
        mediaType: "movie" as const,
      },
      {
        id: "181808",
        title: "Star Wars: The Last Jedi",
        year: 2017,
        cover:
          "https://image.tmdb.org/t/p/w500/kOVEVeg59E0wsnXmF9nrh6OmWII.jpg",
        rating: 4.3,
        status: "watchlist",
        mediaType: "movie" as const,
      },
      {
        id: "181809",
        title: "Star Wars: The Rise of Skywalker",
        year: 2019,
        cover:
          "https://image.tmdb.org/t/p/w500/db32LaOibw8liAmU2SMBYBg2Dtr.jpg",
        rating: 4.2,
        status: "watchlist",
        mediaType: "movie" as const,
      },
      {
        id: "49524",
        title: "The Twilight Saga: Breaking Dawn - Part 2",
        year: 2012,
        cover:
          "https://image.tmdb.org/t/p/w500/3nNLhKXUeeJXQZbMfX4juoyBamP.jpg",
        rating: 4.1,
        status: "watchlist",
        mediaType: "movie" as const,
      },
      {
        id: "550988",
        title: "Free Guy",
        year: 2021,
        cover:
          "https://image.tmdb.org/t/p/w500/xmbU4JTUm8rsdtn7Y3Fcm30SXM9.jpg",
        rating: 4.0,
        status: "watchlist",
        mediaType: "movie" as const,
      },
      {
        id: "634649",
        title: "Spider-Man: No Way Home",
        year: 2021,
        cover:
          "https://image.tmdb.org/t/p/w500/1g0dhYtq4irTY1GPXvft6k4YLjm.jpg",
        rating: 4.5,
        status: "watchlist",
        mediaType: "movie" as const,
      },
    ],
  };

  // Mock functions to replace Firebase queries
  const getMoviesBySection = (section: string) => {
    return mockMovies[section as keyof typeof mockMovies] || [];
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
      name: "Thrillers You Can Watch",
      description: "10 movies",
      itemCount: 10,
      commentCount: 300,
    },
    {
      id: "2",
      name: "Movies You Must Watch Before You Die",
      description: "25 essential films",
      itemCount: 25,
      commentCount: 150,
    },
    {
      id: "3",
      name: "Horror Movies for Brave Souls",
      description: "15 terrifying films",
      itemCount: 15,
      commentCount: 89,
    },
    {
      id: "4",
      name: "Sci-Fi Classics",
      description: "20 mind-bending films",
      itemCount: 20,
      commentCount: 234,
    },
    {
      id: "5",
      name: "Comedy Gold",
      description: "12 hilarious movies",
      itemCount: 12,
      commentCount: 67,
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
            <div className="flex-1 w-full min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold mb-1 truncate">
                {user.displayName || "guy 1"}
              </h1>
              <p className="text-sm text-muted-foreground mb-3">bio</p>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto text-xs sm:text-sm h-9"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  add picture
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditDialogOpen(true)}
                  className="w-full sm:w-auto text-xs sm:text-sm h-9"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  message
                </Button>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <Tabs
            value={activeTab}
            onValueChange={(value) => {
              setActiveTab(value);
            }}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-4 h-auto bg-transparent border-b border-border rounded-none">
              <TabsTrigger
                value="music"
                className="text-xs sm:text-sm py-2 h-10 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none"
              >
                music
              </TabsTrigger>
              <TabsTrigger
                value="movies"
                className="text-xs sm:text-sm py-2 h-10 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none"
              >
                movies
              </TabsTrigger>
              <TabsTrigger
                value="series"
                className="text-xs sm:text-sm py-2 h-10 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none"
              >
                shows
              </TabsTrigger>
              <TabsTrigger
                value="books"
                className="text-xs sm:text-sm py-2 h-10 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none"
              >
                books
              </TabsTrigger>
            </TabsList>

            {/* Movies Tab */}
            <TabsContent value="movies" className="mt-6 space-y-6">
              {/* Recently Watched Section - Clean Horizontal List */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-4">
                  recently watched
                </h3>
                <div className="flex items-center gap-4">
                  <div className="aspect-[2/3] w-32 bg-muted rounded-md overflow-hidden flex-shrink-0">
                    <Image
                      src={
                        getMoviesBySection("watched")[0]?.cover ||
                        "/placeholder.svg"
                      }
                      alt={getMoviesBySection("watched")[0]?.title || "Movie"}
                      width={128}
                      height={192}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm mb-1">
                      {getMoviesBySection("watched")[0]?.title || "Movie Title"}
                    </h4>
                    <p className="text-xs text-muted-foreground mb-2">
                      cast: abc, def, ...
                    </p>
                    <div className="flex items-center gap-3">
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <Heart className="h-3 w-3" />
                      </Button>
                      <span className="text-xs text-muted-foreground">
                        trailer
                      </span>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 flex-shrink-0"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Favorites Section */}
              <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    favorite
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      5 items
                    </span>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <Plus className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-xs"
                    >
                      View
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {getMoviesBySection("top5")
                    .slice(0, 5)
                    .map((movie) => (
                      <div key={movie.id}>
                        <div className="aspect-[2/3] w-full bg-muted rounded-md overflow-hidden">
                          <Image
                            src={movie.cover || "/placeholder.svg"}
                            alt={movie.title}
                            width={100}
                            height={150}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Watchlist Section */}
              <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    watchlist
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      8 items
                    </span>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <Plus className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-xs"
                    >
                      View
                    </Button>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex flex-col gap-2">
                    {getMoviesBySection("watchlist")
                      .slice(0, 2)
                      .map((movie) => (
                        <div
                          key={movie.id}
                          className="aspect-[2/3] w-12 bg-muted rounded-md overflow-hidden"
                        >
                          <Image
                            src={movie.cover || "/placeholder.svg"}
                            alt={movie.title}
                            width={48}
                            height={72}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                  </div>
                  <div className="flex-1 bg-muted/20 rounded-md p-3">
                    <p className="text-xs text-muted-foreground">
                      More watchlist items...
                    </p>
                  </div>
                </div>
              </div>

              {/* Collections Section */}
              <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
                <h3 className="text-sm font-medium text-muted-foreground mb-4">
                  collections
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span>thrillers you can watch</span>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span>50 movies</span>
                      <span>1000 likes</span>
                      <span>200 comments</span>
                    </div>
                  </div>
                  <div className="text-xs">
                    <span>you got to watch these movies before you die</span>
                  </div>
                  <div className="text-xs">
                    <span>horror i would watch when im alone</span>
                  </div>
                </div>
              </div>

              {/* Watched Section */}
              <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
                <h3 className="text-sm font-medium text-muted-foreground mb-4">
                  Watched
                </h3>
                <div className="grid grid-cols-6 gap-1">
                  {getMoviesBySection("watched")
                    .slice(0, 12)
                    .map((movie) => (
                      <div
                        key={movie.id}
                        className="aspect-[2/3] w-full bg-muted rounded-md overflow-hidden"
                      >
                        <Image
                          src={movie.cover || "/placeholder.svg"}
                          alt={movie.title}
                          width={50}
                          height={75}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                </div>
              </div>

              {/* Recent Reviews Section */}
              <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
                <h3 className="text-sm font-medium text-muted-foreground mb-4">
                  recent reviews
                </h3>
                <div className="h-24 bg-muted/20 rounded-md flex items-center justify-center">
                  <p className="text-xs text-muted-foreground">
                    Recent reviews will appear here
                  </p>
                </div>
              </div>
            </TabsContent>

            {/* Music Tab */}
            <TabsContent value="music" className="mt-6">
              <ProfileMusicSection />
            </TabsContent>

            {/* Series Tab */}
            <TabsContent value="series" className="mt-6 space-y-6">
              {/* Currently Watching Section - Clean Horizontal List */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-4">
                  currently watching
                </h3>
                <div className="flex items-center gap-4">
                  <div className="aspect-[2/3] w-32 bg-muted rounded-md overflow-hidden flex-shrink-0">
                    <Image
                      src="https://image.tmdb.org/t/p/w500/ggFHVNu6YYI5L9pCfOacjizRGt.jpg"
                      alt="Breaking Bad"
                      width={128}
                      height={192}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm mb-1">suits</h4>
                    <p className="text-xs text-muted-foreground mb-2">
                      description... cast etc. def...
                    </p>
                    <div className="flex items-center gap-3">
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <Heart className="h-3 w-3" />
                      </Button>
                      <span className="text-xs text-muted-foreground">
                        trailer
                      </span>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 flex-shrink-0"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Favorites Section */}
              <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    favorite
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      5 items
                    </span>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <Plus className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-xs"
                    >
                      View
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {[
                    {
                      id: "1399",
                      title: "Game of Thrones",
                      year: 2011,
                      cover:
                        "https://image.tmdb.org/t/p/w500/u3bZgnGQ9T01sWNhyveQz0wH0Hl.jpg",
                    },
                    {
                      id: "2316",
                      title: "The Office",
                      year: 2005,
                      cover:
                        "https://image.tmdb.org/t/p/w500/qWnJzyZhyy74gjpSjIXWmuk0ifX.jpg",
                    },
                    {
                      id: "1668",
                      title: "Friends",
                      year: 1994,
                      cover:
                        "https://image.tmdb.org/t/p/w500/f496cm9enuEsZkSPzCwnTESEK5s.jpg",
                    },
                    {
                      id: "1398",
                      title: "The Sopranos",
                      year: 1999,
                      cover:
                        "https://image.tmdb.org/t/p/w500/7gO7l4aHZzJbTqHd0qKqKqKqKqKq.jpg",
                    },
                    {
                      id: "1438",
                      title: "The Wire",
                      year: 2002,
                      cover:
                        "https://image.tmdb.org/t/p/w500/7gO7l4aHZzJbTqHd0qKqKqKqKqKq.jpg",
                    },
                  ].map((series) => (
                    <div key={series.id}>
                      <div className="aspect-[2/3] w-full bg-muted rounded-md overflow-hidden">
                        <Image
                          src={series.cover}
                          alt={series.title}
                          width={100}
                          height={150}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Watchlist Section */}
              <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    watchlist
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      6 items
                    </span>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <Plus className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-xs"
                    >
                      View
                    </Button>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex flex-col gap-2">
                    {[
                      {
                        id: "1",
                        title: "House of the Dragon",
                        cover:
                          "https://image.tmdb.org/t/p/w500/z2yahl2uefxDCl0nogcRBstwruJ.jpg",
                      },
                      {
                        id: "2",
                        title: "The Last of Us",
                        cover:
                          "https://image.tmdb.org/t/p/w500/uKvVjHNqB5VmOrdxqAt2F7J78ED.jpg",
                      },
                    ].map((series) => (
                      <div
                        key={series.id}
                        className="aspect-[2/3] w-12 bg-muted rounded-md overflow-hidden"
                      >
                        <Image
                          src={series.cover}
                          alt={series.title}
                          width={48}
                          height={72}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex-1 bg-muted/20 rounded-md p-3">
                    <p className="text-xs text-muted-foreground">
                      More watchlist items...
                    </p>
                  </div>
                </div>
              </div>

              {/* Collections Section */}
              <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
                <h3 className="text-sm font-medium text-muted-foreground mb-4">
                  collections
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span>crime dramas</span>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span>8 series</span>
                      <span>245 likes</span>
                      <span>89 comments</span>
                    </div>
                  </div>
                  <div className="text-xs">
                    <span>comedy classics</span>
                  </div>
                  <div className="text-xs">
                    <span>sci-fi adventures</span>
                  </div>
                </div>
              </div>

              {/* Watched Section */}
              <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
                <h3 className="text-sm font-medium text-muted-foreground mb-4">
                  Watched
                </h3>
                <div className="grid grid-cols-6 gap-1">
                  {[
                    "https://image.tmdb.org/t/p/w500/ggFHVNu6YYI5L9pCfOacjizRGt.jpg",
                    "https://image.tmdb.org/t/p/w500/49WJfeN0moxb9IPfGn8AIqMGskD.jpg",
                    "https://image.tmdb.org/t/p/w500/7k9sxGzJbqjKqQjJZqJZqJZqJZqJ.jpg",
                    "https://image.tmdb.org/t/p/w500/sWgBv7LV2PRoQgkxwlibdGXKq1q.jpg",
                    "https://image.tmdb.org/t/p/w500/7vjaCdMw15FEbXyLQTVa04URsPm.jpg",
                    "https://image.tmdb.org/t/p/w500/9PFonBhy4cQy7Jz20NpMygczOkv.jpg",
                    "https://image.tmdb.org/t/p/w500/u3bZgnGQ9T01sWNhyveQz0wH0Hl.jpg",
                    "https://image.tmdb.org/t/p/w500/qWnJzyZhyy74gjpSjIXWmuk0ifX.jpg",
                    "https://image.tmdb.org/t/p/w500/f496cm9enuEsZkSPzCwnTESEK5s.jpg",
                    "https://image.tmdb.org/t/p/w500/z2yahl2uefxDCl0nogcRBstwruJ.jpg",
                  ].map((cover, index) => (
                    <div
                      key={index}
                      className="aspect-[2/3] w-full bg-muted rounded-md overflow-hidden"
                    >
                      <Image
                        src={cover}
                        alt="Series"
                        width={50}
                        height={75}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Reviews Section */}
              <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
                <h3 className="text-sm font-medium text-muted-foreground mb-4">
                  recent reviews
                </h3>
                <div className="h-24 bg-muted/20 rounded-md flex items-center justify-center">
                  <p className="text-xs text-muted-foreground">
                    Recent reviews will appear here
                  </p>
                </div>
              </div>
            </TabsContent>

            {/* Books Tab */}
            <TabsContent value="books" className="mt-6 space-y-6">
              {/* Currently Reading Section - Clean Horizontal List */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-4">
                  currently listening
                </h3>
                <div className="flex items-center gap-4">
                  <div className="aspect-[2/3] w-32 bg-muted rounded-md overflow-hidden flex-shrink-0">
                    <Image
                      src="https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1674739970i/32620332.jpg"
                      alt="The Seven Husbands of Evelyn Hugo"
                      width={128}
                      height={192}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm mb-1">
                      The Seven Husbands of Evelyn Hugo
                    </h4>
                    <p className="text-xs text-muted-foreground mb-2">
                      description... cast etc. def...
                    </p>
                    <div className="flex items-center gap-3">
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <Heart className="h-3 w-3" />
                      </Button>
                      <span className="text-xs text-muted-foreground">
                        trailer
                      </span>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 flex-shrink-0"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Favorites Section */}
              <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    favorite
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      5 items
                    </span>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <Plus className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-xs"
                    >
                      View
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {[
                    {
                      id: "1",
                      title: "The Great Gatsby",
                      year: 1925,
                      cover:
                        "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1490528560i/4671.jpg",
                    },
                    {
                      id: "2",
                      title: "1984",
                      year: 1949,
                      cover:
                        "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1532714506i/40961427.jpg",
                    },
                    {
                      id: "3",
                      title: "To Kill a Mockingbird",
                      year: 1960,
                      cover:
                        "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1553383690i/2657.jpg",
                    },
                    {
                      id: "4",
                      title: "Pride and Prejudice",
                      year: 1813,
                      cover:
                        "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1320399351i/1885.jpg",
                    },
                    {
                      id: "5",
                      title: "The Hobbit",
                      year: 1937,
                      cover:
                        "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1546071216i/5907.jpg",
                    },
                  ].map((book) => (
                    <div key={book.id}>
                      <div className="aspect-[2/3] w-full bg-muted rounded-md overflow-hidden">
                        <Image
                          src={book.cover}
                          alt={book.title}
                          width={100}
                          height={150}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reading List Section */}
              <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    reading list
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      8 items
                    </span>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <Plus className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-xs"
                    >
                      View
                    </Button>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex flex-col gap-2">
                    {[
                      {
                        id: "1",
                        title: "The Lincoln Highway",
                        cover:
                          "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1634158558i/58819501.jpg",
                      },
                      {
                        id: "2",
                        title: "Cloud Cuckoo Land",
                        cover:
                          "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1634158558i/56707975.jpg",
                      },
                    ].map((book) => (
                      <div
                        key={book.id}
                        className="aspect-[2/3] w-12 bg-muted rounded-md overflow-hidden"
                      >
                        <Image
                          src={book.cover}
                          alt={book.title}
                          width={48}
                          height={72}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex-1 bg-muted/20 rounded-md p-3">
                    <p className="text-xs text-muted-foreground">
                      More reading list items...
                    </p>
                  </div>
                </div>
              </div>

              {/* Collections Section */}
              <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
                <h3 className="text-sm font-medium text-muted-foreground mb-4">
                  collections
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span>classic literature</span>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span>15 books</span>
                      <span>342 likes</span>
                      <span>156 comments</span>
                    </div>
                  </div>
                  <div className="text-xs">
                    <span>science fiction</span>
                  </div>
                  <div className="text-xs">
                    <span>mystery & thriller</span>
                  </div>
                </div>
              </div>

              {/* Read Section */}
              <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
                <h3 className="text-sm font-medium text-muted-foreground mb-4">
                  Read
                </h3>
                <div className="grid grid-cols-6 gap-1">
                  {getBooksBySection("read")
                    .slice(0, 10)
                    .map((book) => (
                      <div
                        key={book.id}
                        className="aspect-[2/3] w-full bg-muted rounded-md overflow-hidden"
                      >
                        <Image
                          src={book.cover || "/placeholder.svg"}
                          alt={book.title}
                          width={50}
                          height={75}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                </div>
              </div>

              {/* Recent Reviews Section */}
              <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
                <h3 className="text-sm font-medium text-muted-foreground mb-4">
                  recent reviews
                </h3>
                <div className="h-24 bg-muted/20 rounded-md flex items-center justify-center">
                  <p className="text-xs text-muted-foreground">
                    Recent reviews will appear here
                  </p>
                </div>
              </div>
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
              movies: "N/A (removed)",
              series: "N/A (removed)",
              books: "N/A (removed)",
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
