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
  BookOpen,
  Plus,
  X,
  SortAsc,
  SortDesc,
  Grid3X3,
  List,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
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
import { useTrendingBooks } from "@/hooks/use-trending-books";
import DiscoverSection from "@/components/discover-section";
import Link from "next/link";

interface Book {
  id: string;
  title: string;
  author: string;
  year: number;
  cover: string;
  status?: string;
  notes?: string;
  collections?: string[];
  overview?: string;
  publishedDate?: string;
  pageCount?: number;
}

interface Collection {
  id: string;
  name: string;
  isPublic?: boolean;
  isDefault?: boolean;
  color?: string;
}

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

// Google Books API Search Function
const searchBooks = async (query: string): Promise<SearchResult[]> => {
  try {
    const response = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(
        query
      )}&maxResults=20`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch books");
    }

    const data = await response.json();

    if (!data.items) {
      return [];
    }

    return data.items.map((book: any) => {
      const info = book.volumeInfo;
      let year = 0;
      if (info.publishedDate) {
        const date = new Date(info.publishedDate);
        if (!isNaN(date.getTime())) {
          year = date.getFullYear();
        }
      }

      return {
        id: book.id,
        title: info.title || "Unknown Title",
        author: info.authors?.join(", ") || "Unknown Author",
        year: year,
        cover: info.imageLinks?.thumbnail || "/placeholder.svg",
        overview: info.description || "",
        publishedDate: info.publishedDate || "",
        pageCount: info.pageCount || 0,
      };
    });
  } catch (error) {
    console.error("Error searching books:", error);
    return [];
  }
};

export default function BooksPage() {
  const { user } = useCurrentUser();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [savedBooks, setSavedBooks] = useState<Book[]>([]);
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
  const [showDiscover, setShowDiscover] = useState(true);

  // Use optimized trending books hook
  const {
    books: trendingBooks,
    loading: isLoadingTrending,
    error: trendingError,
    fetchBooks: fetchTrendingBooks,
    clearCache: clearTrendingCache,
  } = useTrendingBooks();

  // Default collections for books
  const defaultCollections = [
    { name: "Reading", isDefault: true, color: "bg-green-500" },
    { name: "Completed", isDefault: true, color: "bg-yellow-500" },
    { name: "To Read", isDefault: true, color: "bg-purple-500" },
    { name: "Dropped", isDefault: true, color: "bg-red-500" },
    { name: "Recommendations", isDefault: true, color: "bg-blue-500" },
  ];

  // Fetch user's books and collections
  useEffect(() => {
    if (!user?.uid) return;

    const fetchUserData = async () => {
      try {
        // Fetch books
        const booksRef = collection(db, "users", user.uid, "books");
        const booksSnapshot = await getDocs(booksRef);
        const booksData = booksSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Book[];
        setSavedBooks(booksData);

        // Fetch collections
        const collectionsRef = collection(
          db,
          "users",
          user.uid,
          "bookCollections"
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

  // Clean up duplicate collections
  const cleanupDuplicateCollections = async () => {
    if (!user?.uid) return;

    try {
      const collectionsRef = collection(
        db,
        "users",
        user.uid,
        "bookCollections"
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
              doc(db, "users", user.uid, "bookCollections", duplicates[i].id)
            );
          }
        }
      }
    } catch (error) {
      console.error("Error cleaning up duplicate collections:", error);
    }
  };

  // Enhanced fuzzy search
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSelectedGenre("");

    try {
      const results = await searchBooks(searchQuery);
      setSearchResults(results);
    } catch (error) {
      console.error("Error searching books:", error);
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

  // Filter and sort books
  const filteredAndSortedBooks = useMemo(() => {
    let filtered = savedBooks;

    // Filter by collection - only show books if a collection is selected
    if (selectedCollection && selectedCollection !== "") {
      filtered = savedBooks.filter((book) =>
        book.collections?.includes(selectedCollection)
      );
    } else {
      // If no collection is selected, show no books
      filtered = [];
    }

    // Sort books
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
          aValue = a.year; // Using year as rating for books
          bValue = b.year;
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
  }, [savedBooks, selectedCollection, sortBy, sortOrder]);

  // Get collection info
  const getCollectionInfo = (collectionId: string) => {
    return collections.find((col) => col.id === collectionId);
  };

  // Add book to collection
  const addBookToCollection = async (
    book: SearchResult,
    collectionId: string
  ) => {
    if (!user?.uid) return;

    try {
      // Check if book already exists
      const existingBook = savedBooks.find((b) => b.id === book.id);

      if (existingBook) {
        // Update existing book with new collection
        const updatedCollections = [
          ...(existingBook.collections || []),
          collectionId,
        ];
        await updateDoc(doc(db, "users", user.uid, "books", book.id), {
          collections: updatedCollections,
        });
        setSavedBooks((prev) =>
          prev.map((b) =>
            b.id === book.id ? { ...b, collections: updatedCollections } : b
          )
        );
      } else {
        // Create new book
        const bookData: Book = {
          id: book.id,
          title: book.title,
          author: book.author,
          year: book.year,
          cover: book.cover,
          status: "To Read",
          notes: "",
          collections: [collectionId],
          overview: book.overview || "",
          publishedDate: book.publishedDate || "",
          pageCount: book.pageCount || 0,
        };

        await setDoc(doc(db, "users", user.uid, "books", book.id), bookData);
        setSavedBooks((prev) => [...prev, bookData]);
      }
    } catch (error) {
      console.error("Error adding book to collection:", error);
    }
  };

  // Remove book from collection
  const removeBookFromCollection = async (
    bookId: string,
    collectionId: string
  ) => {
    if (!user?.uid) return;

    try {
      const book = savedBooks.find((b) => b.id === bookId);
      if (!book) return;

      const updatedCollections =
        book.collections?.filter((id) => id !== collectionId) || [];

      if (updatedCollections.length === 0) {
        // Remove book entirely if no collections left
        await deleteDoc(doc(db, "users", user.uid, "books", bookId));
        setSavedBooks((prev) => prev.filter((b) => b.id !== bookId));
      } else {
        // Update book with remaining collections
        await updateDoc(doc(db, "users", user.uid, "books", bookId), {
          collections: updatedCollections,
        });
        setSavedBooks((prev) =>
          prev.map((b) =>
            b.id === bookId ? { ...b, collections: updatedCollections } : b
          )
        );
      }
    } catch (error) {
      console.error("Error removing book from collection:", error);
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
        collection(db, "users", user.uid, "bookCollections"),
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black w-full overflow-x-hidden">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gradient-to-r from-gray-900/95 to-gray-800/95 backdrop-blur-sm w-full">
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-full">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
                Books
              </h1>
              <p className="text-gray-400 mt-1 sm:mt-2 text-sm sm:text-lg">
                Discover and organize your favorite books
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-full overflow-x-hidden">
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
                    placeholder="Search books..."
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
          <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto pb-4 scrollbar-hide w-full horizontal-scroll-container">
            {/* Trending Tab */}
            <button
              onClick={() => {
                setShowDiscover(true);
                setSelectedCollection("");
              }}
              className={`flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-2 sm:py-3 rounded-xl transition-all duration-300 whitespace-nowrap font-medium text-sm sm:text-base ${
                showDiscover
                  ? "bg-gradient-to-r from-gray-800 to-gray-700 text-white shadow-lg border border-gray-600"
                  : "hover:bg-gray-800/50 text-gray-300 hover:text-white"
              }`}
            >
              <span>Trending Books</span>
            </button>

            {collections.map((collection) => {
              const bookCount = savedBooks.filter((book) =>
                book.collections?.includes(collection.id)
              ).length;

              return (
                <button
                  key={collection.id}
                  onClick={() => {
                    handleCollectionSelect(collection.id);
                    setShowDiscover(false);
                  }}
                  className={`flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-2 sm:py-3 rounded-xl transition-all duration-300 whitespace-nowrap font-medium text-sm sm:text-base ${
                    selectedCollection === collection.id
                      ? "bg-gradient-to-r from-gray-800 to-gray-700 text-white shadow-lg border border-gray-600"
                      : "hover:bg-gray-800/50 text-gray-300 hover:text-white"
                  }`}
                >
                  <span className="whitespace-nowrap">{collection.name}</span>
                  <Badge
                    variant="secondary"
                    className={`ml-1 text-xs ${
                      selectedCollection === collection.id
                        ? "bg-white/20 text-white"
                        : "bg-gray-700 text-gray-300"
                    }`}
                  >
                    {bookCount}
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
                    Create a new collection to organize your books.
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

        {/* Content */}
        <div className="space-y-8">
          {/* Discover Section */}
          {showDiscover && searchResults.length === 0 && (
            <div>
              {trendingError && (
                <div className="text-center py-8">
                  <p className="text-red-500 mb-4">Error: {trendingError}</p>
                  <Button
                    onClick={() => {
                      clearTrendingCache();
                      fetchTrendingBooks(true);
                    }}
                  >
                    Retry
                  </Button>
                </div>
              )}
              <DiscoverSection
                title="Trending Books"
                subtitle="Current NYTimes bestsellers"
                items={trendingBooks.map((book) => ({
                  id: book.id,
                  title: book.title,
                  cover: book.cover,
                  year: book.year,
                  author: book.author,
                  overview: book.overview,
                }))}
                isLoading={isLoadingTrending}
                onRetry={() => {
                  clearTrendingCache();
                  fetchTrendingBooks(true);
                }}
                itemType="book"
                containerId="trending-books-container"
              />
            </div>
          )}

          {isSearching ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
                <p className="text-gray-400 text-lg">Searching books...</p>
              </div>
            </div>
          ) : searchResults.length > 0 ? (
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-0 mb-6">
                <div>
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                    Search Results ({searchResults.length})
                  </h2>
                  <p className="text-gray-400 mt-1 sm:mt-2 text-sm sm:text-base">
                    Books matching your search
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={clearSearch}
                  className="border-gray-600 hover:bg-gray-800 hover:border-gray-500 transition-all duration-200 text-sm sm:text-base px-4 sm:px-6 py-2 sm:py-3"
                >
                  Clear Search
                </Button>
              </div>
              <div
                className={
                  viewMode === "grid"
                    ? "grid grid-cols-5 gap-4 w-full max-w-full"
                    : "space-y-3 sm:space-y-4"
                }
              >
                {searchResults.slice(0, 20).map((book) => (
                  <BookCard
                    key={book.id}
                    book={book}
                    collections={collections}
                    isInCollections={savedBooks.some((b) => b.id === book.id)}
                    onAddToCollection={addBookToCollection}
                    viewMode={viewMode}
                  />
                ))}
              </div>
            </div>
          ) : filteredAndSortedBooks.length > 0 ? (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                    {getCollectionInfo(selectedCollection)?.name || "Books"} (
                    {filteredAndSortedBooks.length})
                  </h2>
                  <p className="text-gray-400 mt-1 sm:mt-2 text-sm sm:text-base">
                    Your{" "}
                    {getCollectionInfo(
                      selectedCollection
                    )?.name?.toLowerCase() || "books"}{" "}
                    collection
                  </p>
                </div>
              </div>
              <div
                className={
                  viewMode === "grid"
                    ? "grid grid-cols-5 gap-4 w-full max-w-full"
                    : "space-y-3 sm:space-y-4"
                }
              >
                {filteredAndSortedBooks.slice(0, 20).map((book) => (
                  <SavedBookCard
                    key={book.id}
                    book={book}
                    collections={collections}
                    onRemoveFromCollection={removeBookFromCollection}
                    viewMode={viewMode}
                  />
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// Book Card Component for Search Results
function BookCard({
  book,
  collections,
  isInCollections,
  onAddToCollection,
  viewMode,
}: {
  book: SearchResult;
  collections: Collection[];
  isInCollections: boolean;
  onAddToCollection: (book: SearchResult, collectionId: string) => void;
  viewMode: "grid" | "list";
}) {
  if (viewMode === "list") {
    return (
      <Card className="flex items-center space-x-4 p-4">
        <div className="relative w-16 h-24 flex-shrink-0">
          <Link href={`/books/${book.id}`}>
            <Image
              src={book.cover}
              alt={book.title}
              fill
              className="object-cover rounded cursor-pointer"
            />
          </Link>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold truncate">{book.title}</h3>
          <p className="text-sm text-muted-foreground">{book.author}</p>
          <p className="text-sm text-muted-foreground">{book.year || "N/A"}</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <Plus className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {collections.map((collection) => (
              <DropdownMenuItem
                key={collection.id}
                onClick={() => onAddToCollection(book, collection.id)}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      collection.color || "bg-gray-500"
                    }`}
                  />
                  {collection.name}
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </Card>
    );
  }

  return (
    <Card className="relative overflow-hidden">
      <div className="relative aspect-[2/3]">
        <Link href={`/books/${book.id}`}>
          <Image
            src={book.cover}
            alt={book.title}
            fill
            className="object-cover cursor-pointer"
          />
        </Link>
      </div>
      <CardContent className="p-3">
        <h3 className="font-semibold text-sm truncate">{book.title}</h3>
        <p className="text-xs text-muted-foreground">{book.author}</p>
        <p className="text-xs text-muted-foreground">{book.year || "N/A"}</p>
      </CardContent>
    </Card>
  );
}

// Saved Book Card Component
function SavedBookCard({
  book,
  collections,
  onRemoveFromCollection,
  viewMode,
}: {
  book: Book;
  collections: Collection[];
  onRemoveFromCollection: (bookId: string, collectionId: string) => void;
  viewMode: "grid" | "list";
}) {
  if (viewMode === "list") {
    return (
      <Card className="flex items-center space-x-4 p-4">
        <div className="relative w-16 h-24 flex-shrink-0">
          <Link href={`/books/${book.id}`}>
            <Image
              src={book.cover}
              alt={book.title}
              fill
              className="object-cover rounded cursor-pointer"
            />
          </Link>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold truncate">{book.title}</h3>
          <p className="text-sm text-muted-foreground">{book.author}</p>
          <p className="text-sm text-muted-foreground">{book.year || "N/A"}</p>
          <div className="flex flex-wrap gap-1 mt-2">
            {book.collections?.map((collectionId) => {
              const collection = collections.find((c) => c.id === collectionId);
              return collection ? (
                <Badge key={collectionId} variant="outline" className="text-xs">
                  {collection.name}
                </Badge>
              ) : null;
            })}
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {book.collections?.map((collectionId) => {
              const collection = collections.find((c) => c.id === collectionId);
              return collection ? (
                <DropdownMenuItem
                  key={collectionId}
                  onClick={() => onRemoveFromCollection(book.id, collectionId)}
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
    <Card className="relative overflow-hidden">
      <div className="relative aspect-[2/3]">
        <Link href={`/books/${book.id}`}>
          <Image
            src={book.cover}
            alt={book.title}
            fill
            className="object-cover cursor-pointer"
          />
        </Link>
      </div>
      <CardContent className="p-3">
        <h3 className="font-semibold text-sm truncate">{book.title}</h3>
        <p className="text-xs text-muted-foreground">{book.author}</p>
        <p className="text-xs text-muted-foreground">{book.year || "N/A"}</p>
        <div className="flex flex-wrap gap-1 mt-2">
          {book.collections?.slice(0, 2).map((collectionId) => {
            const collection = collections.find((c) => c.id === collectionId);
            return collection ? (
              <Badge key={collectionId} variant="outline" className="text-xs">
                {collection.name}
              </Badge>
            ) : null;
          })}
          {book.collections && book.collections.length > 2 && (
            <Badge variant="outline" className="text-xs">
              +{book.collections.length - 2}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
