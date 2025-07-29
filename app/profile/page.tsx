"use client";

import { useState } from "react";
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
} from "lucide-react";
import { EditProfileDialog } from "@/components/edit-profile";
import { ImageUpload } from "@/components/image-upload";
import { SearchModal } from "@/components/search-modal";
import { HorizontalList } from "@/components/horizontal-list";
import ErrorBoundary from "@/components/error-boundary";
import { DebugPanel } from "@/components/debug-panel";

interface Collection {
  id: string;
  name: string;
  description: string;
  itemCount: number;
  commentCount: number;
}

export default function ProfilePage() {
  const { user } = useCurrentUser();
  const [activeTab, setActiveTab] = useState("movies");
  const [editDialogOpen, setEditDialogOpen] = useState(false);

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
    } catch (error) {
      console.error("Error adding movie:", error);
    }
  };

  const handleAddSeries = async (series: TMDBSeries) => {
    try {
      await addSeries(series, selectedSeriesSection);
      setAddSeriesModalOpen(false);
      seriesSearch.clearSearch();
    } catch (error) {
      console.error("Error adding series:", error);
    }
  };

  const handleAddBook = async (book: GoogleBook) => {
    try {
      await addBook(book, selectedBookSection);
      setAddBookModalOpen(false);
      bookSearch.clearSearch();
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
            onValueChange={setActiveTab}
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
              {/* Top 5 Section */}
              <HorizontalList
                title="Top 5"
                icon={<Crown className="h-5 w-5" />}
                items={getMoviesBySection("top5")}
                onAddItemAction={() => {
                  setSelectedMovieSection("top5");
                  setAddMovieModalOpen(true);
                }}
                emptyMessage="No top 5 movies yet"
                emptyIcon={<Crown className="h-12 w-12 mx-auto mb-2" />}
                showSpecialIcon={true}
                specialIcon={<Crown className="h-3 w-3 text-yellow-500" />}
              />

              {/* Watched Section */}
              <HorizontalList
                title="Watched"
                icon={<Play className="h-5 w-5" />}
                items={getMoviesBySection("watched")}
                onAddItemAction={() => {
                  setSelectedMovieSection("watched");
                  setAddMovieModalOpen(true);
                }}
                emptyMessage="No watched movies yet"
                emptyIcon={<Play className="h-12 w-12 mx-auto mb-2" />}
                showRating={true}
              />

              {/* Watchlist Section */}
              <HorizontalList
                title="Watchlist"
                icon={<Clock className="h-5 w-5" />}
                items={getMoviesBySection("watchlist")}
                onAddItemAction={() => {
                  setSelectedMovieSection("watchlist");
                  setAddMovieModalOpen(true);
                }}
                emptyMessage="No movies in watchlist"
                emptyIcon={<Clock className="h-12 w-12 mx-auto mb-2" />}
              />

              {/* Recommended Section */}
              <HorizontalList
                title="Recommended"
                icon={<ThumbsUp className="h-5 w-5" />}
                items={getMoviesBySection("recommended")}
                onAddItemAction={() => {
                  setSelectedMovieSection("recommended");
                  setAddMovieModalOpen(true);
                }}
                emptyMessage="No recommended movies yet"
                emptyIcon={<ThumbsUp className="h-12 w-12 mx-auto mb-2" />}
                showSpecialIcon={true}
                specialIcon={<ThumbsUp className="h-3 w-3 text-green-500" />}
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
              {/* Top 5 Series Section */}
              <HorizontalList
                title="Top 5"
                icon={<Crown className="h-5 w-5" />}
                items={getSeriesBySection("top5")}
                onAddItemAction={() => {
                  setSelectedSeriesSection("top5");
                  setAddSeriesModalOpen(true);
                }}
                emptyMessage="No top 5 series yet"
                emptyIcon={<Crown className="h-12 w-12 mx-auto mb-2" />}
                showSpecialIcon={true}
                specialIcon={<Crown className="h-3 w-3 text-yellow-500" />}
              />

              {/* Watched Series Section */}
              <HorizontalList
                title="Watched"
                icon={<Play className="h-5 w-5" />}
                items={getSeriesBySection("watched")}
                onAddItemAction={() => {
                  setSelectedSeriesSection("watched");
                  setAddSeriesModalOpen(true);
                }}
                emptyMessage="No watched series yet"
                emptyIcon={<Play className="h-12 w-12 mx-auto mb-2" />}
                showRating={true}
              />

              {/* Watchlist Series Section */}
              <HorizontalList
                title="Watchlist"
                icon={<Clock className="h-5 w-5" />}
                items={getSeriesBySection("watchlist")}
                onAddItemAction={() => {
                  setSelectedSeriesSection("watchlist");
                  setAddSeriesModalOpen(true);
                }}
                emptyMessage="No series in watchlist"
                emptyIcon={<Clock className="h-12 w-12 mx-auto mb-2" />}
              />

              {/* Recommended Series Section */}
              <HorizontalList
                title="Recommended"
                icon={<ThumbsUp className="h-5 w-5" />}
                items={getSeriesBySection("recommended")}
                onAddItemAction={() => {
                  setSelectedSeriesSection("recommended");
                  setAddSeriesModalOpen(true);
                }}
                emptyMessage="No recommended series yet"
                emptyIcon={<ThumbsUp className="h-12 w-12 mx-auto mb-2" />}
                showSpecialIcon={true}
                specialIcon={<ThumbsUp className="h-3 w-3 text-green-500" />}
              />
            </TabsContent>

            {/* Books Tab */}
            <TabsContent value="books" className="mt-6 space-y-6">
              {/* Top 5 Books Section */}
              <HorizontalList
                title="Top 5"
                icon={<Crown className="h-5 w-5" />}
                items={getBooksBySection("top5")}
                onAddItemAction={() => {
                  setSelectedBookSection("top5");
                  setAddBookModalOpen(true);
                }}
                emptyMessage="No top 5 books yet"
                emptyIcon={<Crown className="h-12 w-12 mx-auto mb-2" />}
                showSpecialIcon={true}
                specialIcon={<Crown className="h-3 w-3 text-yellow-500" />}
              />

              {/* Read Books Section */}
              <HorizontalList
                title="Read"
                icon={<Play className="h-5 w-5" />}
                items={getBooksBySection("read")}
                onAddItemAction={() => {
                  setSelectedBookSection("read");
                  setAddBookModalOpen(true);
                }}
                emptyMessage="No read books yet"
                emptyIcon={<Play className="h-12 w-12 mx-auto mb-2" />}
                showRating={true}
              />

              {/* Reading List Section */}
              <HorizontalList
                title="Reading List"
                icon={<Clock className="h-5 w-5" />}
                items={getBooksBySection("reading")}
                onAddItemAction={() => {
                  setSelectedBookSection("reading");
                  setAddBookModalOpen(true);
                }}
                emptyMessage="No books in reading list"
                emptyIcon={<Clock className="h-12 w-12 mx-auto mb-2" />}
              />

              {/* Recommended Books Section */}
              <HorizontalList
                title="Recommended"
                icon={<ThumbsUp className="h-5 w-5" />}
                items={getBooksBySection("recommended")}
                onAddItemAction={() => {
                  setSelectedBookSection("recommended");
                  setAddBookModalOpen(true);
                }}
                emptyMessage="No recommended books yet"
                emptyIcon={<ThumbsUp className="h-12 w-12 mx-auto mb-2" />}
                showSpecialIcon={true}
                specialIcon={<ThumbsUp className="h-3 w-3 text-green-500" />}
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
