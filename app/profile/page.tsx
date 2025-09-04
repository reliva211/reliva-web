"use client";

import { useState, useEffect } from "react";

// Force dynamic rendering to prevent prerender issues
export const dynamic = "force-dynamic";
import Image from "next/image";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useProfile } from "@/hooks/use-profile";
import { useCollections } from "@/hooks/use-collections";
import { useSearch } from "@/hooks/use-search";
import { useToast } from "@/hooks/use-toast";
import {
  searchService,
  TMDBMovie,
  TMDBSeries,
  GoogleBook,
} from "@/lib/search-service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserAvatar } from "@/components/user-avatar";
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
import ProfileMovieSection from "@/components/profile-movie-section";
import ProfileSeriesSection from "@/components/profile-series-section";
import ProfileBooksSection from "@/components/profile-books-section";
import ErrorBoundary from "@/components/error-boundary";
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
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("music");
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

  const { profile, loading, saving, updateProfile, uploadImage } = useProfile(
    user?.uid
  );

  // Debug logging for profile data
  useEffect(() => {
    if (process.env.NODE_ENV === "development" && profile) {
      console.log("Profile Debug:", {
        userId: user?.uid,
        profileAvatarUrl: profile.avatarUrl,
        profileDisplayName: profile.displayName,
        currentUserPhotoURL: user?.photoURL,
      });
    }
  }, [profile, user]);

  // Auto-select first available tab when sections are hidden
  useEffect(() => {
    if (profile?.visibleSections) {
      const availableTabs = [];
      if (profile.visibleSections.music !== false) availableTabs.push("music");
      if (profile.visibleSections.movies !== false)
        availableTabs.push("movie-profile");
      if (profile.visibleSections.series !== false)
        availableTabs.push("series");
      if (profile.visibleSections.books !== false) availableTabs.push("books");

      // If current tab is not available, switch to first available tab
      if (availableTabs.length > 0 && !availableTabs.includes(activeTab)) {
        setActiveTab(availableTabs[0]);
      }
    }
  }, [profile?.visibleSections, activeTab]);

  // Fetch public collections
  const fetchPublicCollections = async (userId: string) => {
    setLoadingPublicCollections(true);
    try {
      const collections: PublicCollection[] = [];
      const items: PublicCollectionItems = {};

      // Fetching public collections for user

      // Fetch public movie collections
      const movieListsRef = collection(db, "users", userId, "movieLists");
      const movieListsSnapshot = await getDocs(
        query(movieListsRef, where("isPublic", "==", true))
      );

      // Found public movie collections

      for (const doc of movieListsSnapshot.docs) {
        const data = doc.data();
        const collectionId = doc.id;

        // Processing movie collection

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
          // Error fetching movies for collection
        }

        // Found movies in collection

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

      // Found public series collections

      for (const doc of seriesListsSnapshot.docs) {
        const data = doc.data();
        const collectionId = doc.id;

        // Processing series collection

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
          // Error fetching series for collection
        }

        // Found series in collection

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

      // Found public book collections

      for (const doc of bookCollectionsSnapshot.docs) {
        const data = doc.data();
        const collectionId = doc.id;

        // Processing book collection

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

        // Found books in collection

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

      // Public collections fetch complete
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
    try {
      // Starting avatar upload
      const url = await uploadImage(file, "avatar");
      // Avatar upload successful
      // Note: uploadImage already updates the profile, so we don't need to call updateProfile again
    } catch (error) {
      console.error("Avatar upload failed:", error);
      // You could add a toast notification here
      alert("Failed to upload profile picture. Please try again.");
    }
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
          <p className="text-white">Please log in to view your profile.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-white">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        {/* Top Profile Section */}
                 <div className="max-w-4xl mx-auto px-2 sm:px-3 pt-8 pb-4 sm:pt-6 sm:pb-6">
          <div className="flex flex-col items-center text-center gap-4 mb-6">
            {/* Profile Picture */}
            <ImageUpload onUploadAction={handleAvatarUpload}>
              <UserAvatar
                userId={user?.uid}
                size="lg"
                className="w-16 h-16 sm:w-20 sm:h-20 border-2 border-border cursor-pointer"
                displayName={profile?.displayName || user?.displayName || undefined}
                username={profile?.username || user?.email?.split("@")[0] || undefined}
                clickable={false}
              />
            </ImageUpload>

            {/* User Info */}
            <div className="w-full max-w-md">
              <h1 className="text-xl sm:text-2xl font-bold mb-1">
                {profile?.displayName || user?.displayName || "Your Name"}
              </h1>
              {profile?.bio && (
                <p className="text-sm text-white mb-3">
                  {profile.bio}
                </p>
              )}
              <div className="flex justify-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditDialogOpen(true)}
                  className="text-xs sm:text-sm h-9 text-white hover:text-gray-200"
                >
                  edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const publicUrl = `${window.location.origin}/users/${user?.uid}`;
                    navigator.clipboard.writeText(publicUrl);
                    toast({
                      title: "Profile link copied!",
                      description:
                        "Your profile link has been copied to clipboard.",
                    });
                  }}
                  className="text-xs sm:text-sm h-9 text-white hover:text-gray-200"
                >
                  share
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
            <TabsList className="flex w-auto mx-auto justify-center gap-8 h-8 bg-transparent border-b border-gray-600 rounded-none mb-4">
              {profile?.visibleSections?.music !== false && (
                <TabsTrigger
                  value="music"
                  className="text-xs py-1 h-6 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-emerald-500 data-[state=active]:text-emerald-400 text-gray-400 hover:text-gray-300 transition-colors duration-200 rounded-none w-fit"
                >
                  music
                </TabsTrigger>
              )}
              {profile?.visibleSections?.movies !== false && (
                <TabsTrigger
                  value="movie-profile"
                  className="text-xs py-1 h-6 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-emerald-500 data-[state=active]:text-emerald-400 text-gray-400 hover:text-gray-300 transition-colors duration-200 rounded-none w-fit"
                >
                  movies
                </TabsTrigger>
              )}
              {profile?.visibleSections?.series !== false && (
                <TabsTrigger
                  value="series"
                  className="text-xs py-1 h-6 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-emerald-500 data-[state=active]:text-emerald-400 text-gray-400 hover:text-gray-300 transition-colors duration-200 rounded-none w-fit"
                >
                  shows
                </TabsTrigger>
              )}
              {profile?.visibleSections?.books !== false && (
                <TabsTrigger
                  value="books"
                  className="text-xs py-1 h-6 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-emerald-500 data-[state=active]:text-emerald-400 text-gray-400 hover:text-gray-300 transition-colors duration-200 rounded-none w-fit"
                >
                  books
                </TabsTrigger>
              )}
            </TabsList>

            {/* Music Tab */}
            {profile?.visibleSections?.music !== false && (
              <TabsContent value="music" className="mt-6">
                <ProfileMusicSection userId={user?.uid} readOnly={false} />
              </TabsContent>
            )}

            {/* Movies Tab */}
            {profile?.visibleSections?.movies !== false && (
              <TabsContent value="movie-profile" className="mt-6">
                <ProfileMovieSection
                  userId={user?.uid}
                  readOnly={false}
                  publicCollections={getPublicMovieCollections()}
                  publicCollectionItems={publicCollectionItems}
                  loadingPublicCollections={loadingPublicCollections}
                />
              </TabsContent>
            )}

            {/* Series Tab */}
            {profile?.visibleSections?.series !== false && (
              <TabsContent value="series" className="mt-6">
                <ProfileSeriesSection
                  userId={user?.uid}
                  readOnly={false}
                  publicCollections={getPublicSeriesCollections()}
                  publicCollectionItems={publicCollectionItems}
                  loadingPublicCollections={loadingPublicCollections}
                />
              </TabsContent>
            )}

            {/* Books Tab */}
            {profile?.visibleSections?.books !== false && (
              <TabsContent value="books" className="mt-6">
                <ProfileBooksSection
                  userId={user?.uid}
                  readOnly={false}
                  publicCollections={getPublicBookCollections()}
                  publicCollectionItems={publicCollectionItems}
                  loadingPublicCollections={loadingPublicCollections}
                />
              </TabsContent>
            )}
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
          onItemClickAction={(music: any) => {
            // Add music
          }}
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
            saving={saving}
          />
        )}
      </div>
    </ErrorBoundary>
  );
}
