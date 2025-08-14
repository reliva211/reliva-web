"use client";

import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState, useEffect, useRef } from "react";
import {
  Plus,
  Search,
  X,
  Star,
  Trash2,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Clock,
  Heart,
  ThumbsUp,
  Book,
} from "lucide-react";
import {
  useBooksProfile,
  type GoogleBookItem,
} from "@/hooks/use-books-profile";
import { useCurrentUser } from "@/hooks/use-current-user";

interface ProfileBooksSectionProps {
  // Optional future props for wiring real data
}

// Helper function to clean up text content
const cleanTextContent = (text: string): string => {
  if (!text) return text;
  return text
    .replace(/\([^)]*\)/g, "") // Remove parentheses and their content
    .replace(/\[[^\]]*\]/g, "") // Remove square brackets and their content
    .replace(/\s+/g, " ") // Replace multiple spaces with single space
    .trim(); // Remove leading/trailing spaces
};

// Helper function to safely get text content
const getTextContent = (text: any): string => {
  if (typeof text === "string") {
    return text;
  }
  if (text && typeof text === "object") {
    // If it's an object, try to extract a meaningful string
    return text.name || text.title || text.text || JSON.stringify(text);
  }
  return "";
};

export default function ProfileBooksSection(_: ProfileBooksSectionProps) {
  const { user } = useCurrentUser();
  const {
    booksProfile,
    loading,
    error,
    updateRecentlyRead,
    addFavoriteBook,
    removeFavoriteBook,
    addToReadingList,
    removeFromReadingList,
    addRecommendation,
    removeRecommendation,
    addRating,
    addRatingWithBook,
    removeRating,
    searchBooks,
    searchBooksByTitleAndAuthor,
    getBookById,
  } = useBooksProfile(user?.uid || "");

  // Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeSearchType, setActiveSearchType] = useState<
    | "recentlyRead"
    | "favoriteBooks"
    | "readingList"
    | "recommendations"
    | "rating"
    | "ratings"
    | null
  >(null);
  const [showSearchDialog, setShowSearchDialog] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hoveredRating, setHoveredRating] = useState<{
    bookId: string;
    rating: number;
  } | null>(null);

  // Recently read navigation state
  const [currentRecentlyReadIndex, setCurrentRecentlyReadIndex] = useState(0);

  // Scroll container refs
  const scrollContainerRefs = {
    favoriteBooks: useRef<HTMLDivElement>(null),
    readingList: useRef<HTMLDivElement>(null),
    recommendations: useRef<HTMLDivElement>(null),
    ratings: useRef<HTMLDivElement>(null),
  };

  // Safe access to books profile
  const safeBooksProfile = booksProfile || {
    recentlyRead: [],
    favoriteBooks: [],
    readingList: [],
    recommendations: [],
    ratings: {},
    favoriteAuthors: [],
  };

  // Force re-render when booksProfile changes
  const profileKey = JSON.stringify({
    favoriteBooks: safeBooksProfile.favoriteBooks?.length || 0,
    readingList: safeBooksProfile.readingList?.length || 0,
    recommendations: safeBooksProfile.recommendations?.length || 0,
    ratings: Object.keys(safeBooksProfile.ratings || {}).length,
    ratingsKeys: Object.keys(safeBooksProfile.ratings || {}).sort(),
  });

  // Track profile updates for debugging
  useEffect(() => {
    // This effect ensures the component re-renders when profile changes
  }, [booksProfile]);

  // Recently read list
  const recentlyReadList = safeBooksProfile.recentlyRead || [];

  // Scroll to end when new items are added
  useEffect(() => {
    const scrollToEnd = (
      containerRef: React.RefObject<HTMLDivElement | null>
    ) => {
      if (containerRef.current) {
        containerRef.current.scrollTo({
          left: containerRef.current.scrollWidth,
          behavior: "smooth",
        });
      }
    };

    // Only scroll if we have items and the component is mounted
    if (booksProfile) {
      if (booksProfile.favoriteBooks?.length > 0) {
        scrollToEnd(scrollContainerRefs.favoriteBooks);
      }
      if (booksProfile.readingList?.length > 0) {
        scrollToEnd(scrollContainerRefs.readingList);
      }
      if (booksProfile.recommendations?.length > 0) {
        scrollToEnd(scrollContainerRefs.recommendations);
      }
      if (Object.keys(booksProfile.ratings || {}).length > 0) {
        scrollToEnd(scrollContainerRefs.ratings);
      }
    }
  }, [
    booksProfile?.favoriteBooks?.length,
    booksProfile?.readingList?.length,
    booksProfile?.recommendations?.length,
    Object.keys(booksProfile?.ratings || {}).length,
  ]);

  // Scroll functions
  const scrollLeft = (ref: React.RefObject<HTMLDivElement | null>) => {
    if (ref.current) {
      ref.current.scrollBy({ left: -300, behavior: "smooth" });
    }
  };

  const scrollRight = (ref: React.RefObject<HTMLDivElement | null>) => {
    if (ref.current) {
      ref.current.scrollBy({ left: 300, behavior: "smooth" });
    }
  };

  // Rating functions
  const handleRatingHover = (bookId: string, rating: number) => {
    setHoveredRating({ bookId, rating });
  };

  const handleRatingLeave = () => {
    setHoveredRating(null);
  };

  const handleRatingClick = async (bookId: string, rating: number) => {
    try {
      if (rating === 0) {
        await removeRating(bookId);
      } else {
        await addRating(bookId, rating);
      }
    } catch (error) {
      console.error("Error updating rating:", error);
    }
  };

  const renderStars = (bookId: string) => {
    const currentRating = safeBooksProfile.ratings[bookId] || 0;
    const displayRating =
      hoveredRating?.bookId === bookId ? hoveredRating.rating : currentRating;

    return Array.from({ length: 5 }, (_, i) => {
      const starValue = i + 1;
      const isFullStar = displayRating >= starValue;

      return (
        <Star
          key={i}
          className={`h-4 w-4 cursor-pointer transition-colors ${
            isFullStar ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
          }`}
          onMouseEnter={() => handleRatingHover(bookId, starValue)}
          onMouseLeave={handleRatingLeave}
          onClick={() => handleRatingClick(bookId, starValue)}
        />
      );
    });
  };

  // Search functionality
  const handleSearch = async (
    query: string,
    searchType:
      | "recentlyRead"
      | "favoriteBooks"
      | "readingList"
      | "recommendations"
      | "rating"
      | "ratings"
  ) => {
    if (!query.trim()) return;

    setIsSearching(true);
    setSearchError(null);
    setActiveSearchType(searchType);

    try {
      // Try to extract title and author from query for better search
      const queryParts = query.split(" by ");
      let results;

      if (queryParts.length > 1) {
        // If query contains "by", try title + author search
        const title = queryParts[0].trim();
        const author = queryParts[1].trim();
        results = await searchBooksByTitleAndAuthor(title, author);
      } else {
        // Otherwise use regular search
        results = await searchBooks(query);
      }

      // Validate and sanitize search results
      const validatedResults = (results || []).map((item: any) => {
        const itemName = cleanTextContent(
          getTextContent(item.title || item.name)
        );
        const year = item.year || item.publishedDate?.split("-")[0] || "";

        return {
          id: item.id || `item-${Math.random()}`,
          title: itemName,
          name: itemName,
          year: year,
          cover: item.cover || item.image || item.imageLinks?.thumbnail,
          rating: item.rating || item.averageRating,
          description: item.description, // Keep full description
          publishedDate: item.publishedDate,
          authors: item.authors || [],
          pageCount: item.pageCount,
          categories: item.categories || [],
          language: item.language,
          publisher: item.publisher,
          isbn: item.isbn,
          type: item.type || "book",
        };
      });

      setSearchResults(validatedResults);
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
      setSearchError("Search failed. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectItem = async (item: any) => {
    if (!activeSearchType) return;

    const formattedItem: GoogleBookItem = {
      id: item.id || "",
      title: cleanTextContent(getTextContent(item.title)) || "",
      authors: item.authors || [],
      publishedDate: item.publishedDate || "",
      cover: item.cover || item.imageLinks?.thumbnail || "",
      rating: item.rating || item.averageRating || 0,
      description: item.description || "",
      pageCount: item.pageCount || 0,
      categories: item.categories || [],
      language: item.language || "",
      publisher: item.publisher || "",
      isbn: item.isbn || "",
    };

    try {
      switch (activeSearchType) {
        case "recentlyRead":
          await updateRecentlyRead(formattedItem);
          break;
        case "favoriteBooks":
          await addFavoriteBook(formattedItem);
          break;
        case "readingList":
          await addToReadingList(formattedItem);
          break;
        case "recommendations":
          await addRecommendation(formattedItem);
          break;
        case "ratings":
          // Use the new function that adds both book and rating atomically
          await addRatingWithBook(formattedItem, 3);
          break;
      }
      setShowSearchDialog(false);
      setSearchQuery("");
      setSearchResults([]);
      setActiveSearchType(null);
    } catch (error) {
      console.error("Error adding item:", error);
      alert("Failed to add item. Please try again.");
    }
  };

  const handleRemoveItem = async (
    type: "favoriteBooks" | "readingList" | "recommendations" | "rating",
    id: string
  ) => {
    if (!id) {
      console.error("Invalid ID for removal:", id);
      return;
    }

    try {
      switch (type) {
        case "favoriteBooks":
          await removeFavoriteBook(id);
          break;
        case "readingList":
          await removeFromReadingList(id);
          break;
        case "recommendations":
          await removeRecommendation(id);
          break;
        case "rating":
          await removeRating(id);
          break;
      }
    } catch (error) {
      console.error("Error removing item:", error);
      alert("Failed to remove item. Please try again.");
    }
  };

  const handleRemoveRating = async (bookId: string) => {
    if (!bookId) {
      console.error("Invalid book ID for rating removal:", bookId);
      return;
    }

    try {
      await removeRating(bookId);
    } catch (error) {
      console.error("Error removing rating:", error);
      alert("Failed to remove rating. Please try again.");
    }
  };

  const renderInteractiveStars = (bookId: string, currentRating: number) => {
    const displayRating =
      hoveredRating?.bookId === bookId ? hoveredRating.rating : currentRating;

    return Array.from({ length: 5 }, (_, i) => {
      const starValue = i + 1;
      const isFullStar = displayRating >= starValue;

      return (
        <Star
          key={i}
          className={`h-4 w-4 cursor-pointer transition-colors ${
            isFullStar ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
          }`}
          onMouseEnter={() => handleRatingHover(bookId, starValue)}
          onMouseLeave={handleRatingLeave}
          onClick={() => handleRatingClick(bookId, starValue)}
        />
      );
    });
  };

  const openSearchDialog = (searchType: any) => {
    setActiveSearchType(searchType);
    setShowSearchDialog(true);
    setSearchQuery("");
    setSearchResults([]);
    setSearchError(null);
  };

  // Navigation functions for recently read
  const navigateRecentlyReadLeft = () => {
    if (recentlyReadList.length > 1) {
      setCurrentRecentlyReadIndex((prev) =>
        prev === recentlyReadList.length - 1 ? 0 : prev + 1
      );
    }
  };

  const navigateRecentlyReadRight = () => {
    if (recentlyReadList.length > 1) {
      setCurrentRecentlyReadIndex((prev) =>
        prev === 0 ? recentlyReadList.length - 1 : prev - 1
      );
    }
  };

  // Get current recently read book
  const currentRecentlyRead =
    recentlyReadList[currentRecentlyReadIndex] || null;

  // Handle like click
  const handleLikeClick = (book: GoogleBookItem) => {
    // Add to favorites if not already there
    if (!safeBooksProfile.favoriteBooks?.find((b) => b.id === book.id)) {
      addFavoriteBook(book);
    }
  };

  // Handle add to list click
  const handleAddToListClick = (book: GoogleBookItem) => {
    // Add to reading list if not already there
    if (!safeBooksProfile.readingList?.find((b) => b.id === book.id)) {
      addToReadingList(book);
    }
  };

  // Limit items to specified limits per section
  const limitedFavoriteBooks =
    safeBooksProfile.favoriteBooks?.slice(0, 5) || [];
  const limitedReadingList = safeBooksProfile.readingList || [];
  const limitedRecommendations =
    safeBooksProfile.recommendations?.slice(0, 20) || [];

  // Show loading state
  if (loading) {
    return (
      <div className="space-y-5 max-w-4xl mx-auto">
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-muted rounded mb-2"></div>
              <div className="h-32 bg-muted rounded"></div>
            </div>
          ))}
        </div>
        <div className="space-y-4">
          <div className="h-4 bg-muted rounded w-1/3"></div>
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-square bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="space-y-5 max-w-4xl mx-auto">
        <div className="text-center p-8">
          <div className="text-red-500 mb-4">
            Error loading books profile: {error}
          </div>
          <Button onClick={() => window.location.reload()} variant="outline">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div key={profileKey} className="space-y-5 max-w-4xl mx-auto">
      <div>
        {/* currently reading - simplified format */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-muted-foreground">
              currently reading
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-muted"
              onClick={() => openSearchDialog("recentlyRead")}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
          {currentRecentlyRead ? (
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 p-0 bg-black/50 hover:bg-black/70 text-white rounded-full"
                onClick={navigateRecentlyReadLeft}
                disabled={recentlyReadList.length <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex gap-4 px-8">
                <div className="aspect-[2/3] w-32 bg-muted rounded-md overflow-hidden flex-shrink-0">
                  <Image
                    src={currentRecentlyRead.cover || "/placeholder.svg"}
                    alt={getTextContent(currentRecentlyRead.title) || "Book"}
                    width={128}
                    height={192}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "/placeholder.svg";
                    }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold leading-tight mb-2">
                    {getTextContent(currentRecentlyRead.title) ||
                      "Unknown Book"}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-tight mb-4">
                    {currentRecentlyRead.description
                      ? currentRecentlyRead.description.length > 200
                        ? currentRecentlyRead.description.substring(0, 200) +
                          "..."
                        : currentRecentlyRead.description
                      : "No description available"}
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1">
                      {recentlyReadList.map((_, index) => (
                        <div
                          key={index}
                          className={`w-2 h-2 rounded-full ${
                            index === currentRecentlyReadIndex
                              ? "bg-muted-foreground"
                              : "bg-muted-foreground/30"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 hover:bg-muted"
                      onClick={() => handleLikeClick(currentRecentlyRead)}
                    >
                      <Heart className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs px-3"
                      disabled
                    >
                      read
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs px-3"
                      onClick={() => handleAddToListClick(currentRecentlyRead)}
                    >
                      add to list
                    </Button>
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 p-0 bg-black/50 hover:bg-black/70 text-white rounded-full"
                onClick={navigateRecentlyReadRight}
                disabled={recentlyReadList.length <= 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No currently reading books</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => openSearchDialog("recentlyRead")}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Book
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* favorite books */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-muted-foreground">favorite</p>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 hover:bg-muted"
            onClick={() => openSearchDialog("favoriteBooks")}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 p-0 bg-black/50 hover:bg-black/70 text-white rounded-full"
            onClick={() => scrollLeft(scrollContainerRefs.favoriteBooks)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div
            ref={scrollContainerRefs.favoriteBooks}
            className="flex gap-2 overflow-x-auto scrollbar-hide"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {limitedFavoriteBooks.length > 0
              ? limitedFavoriteBooks.map((book, idx) => (
                  <div
                    key={book.id || idx}
                    className="relative group flex-shrink-0 w-32"
                  >
                    <div className="aspect-[2/3] w-full bg-muted rounded-md overflow-hidden">
                      <Image
                        src={book.cover || "/placeholder.svg"}
                        alt={book.title || "Book"}
                        width={128}
                        height={192}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = "/placeholder.svg";
                        }}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-1 right-1 h-6 w-6 p-0 bg-black/50 hover:bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() =>
                          handleRemoveItem("favoriteBooks", book.id)
                        }
                      >
                        <X className="h-3 w-3 text-white" />
                      </Button>
                    </div>
                    <div className="mt-2 text-center">
                      <p className="text-sm font-semibold leading-tight">
                        {getTextContent(book.title) || "Unknown Book"}
                      </p>
                      <p className="text-xs text-muted-foreground leading-tight mt-1">
                        {book.authors?.join(", ") || "Unknown Author"}
                      </p>
                    </div>
                  </div>
                ))
              : // Show placeholder items when empty
                Array.from({ length: 4 }, (_, idx) => (
                  <div
                    key={`placeholder-favorite-book-${idx}`}
                    className="flex-shrink-0 w-32"
                  >
                    <div className="aspect-[2/3] w-full bg-black/20 rounded-md border border-border/30 flex items-center justify-center">
                      <div className="text-center">
                        <Plus className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                        <p className="text-xs text-muted-foreground/50">
                          Add Book
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 text-center">
                      <p className="text-sm font-semibold leading-tight text-muted-foreground/50">
                        Book Title
                      </p>
                      <p className="text-xs text-muted-foreground/50 leading-tight mt-1">
                        Author Name
                      </p>
                    </div>
                  </div>
                ))}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 p-0 bg-black/50 hover:bg-black/70 text-white rounded-full"
            onClick={() => scrollRight(scrollContainerRefs.favoriteBooks)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* reading list */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-muted-foreground">
            reading list
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 hover:bg-muted"
            onClick={() => openSearchDialog("readingList")}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 p-0 bg-black/50 hover:bg-black/70 text-white rounded-full"
            onClick={() => scrollLeft(scrollContainerRefs.readingList)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div
            ref={scrollContainerRefs.readingList}
            className="flex gap-2 overflow-x-auto scrollbar-hide"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {limitedReadingList.length > 0
              ? limitedReadingList.map((book, idx) => (
                  <div
                    key={book.id || idx}
                    className="relative group flex-shrink-0 w-32"
                  >
                    <div className="aspect-[2/3] w-full bg-muted rounded-md overflow-hidden">
                      <Image
                        src={book.cover || "/placeholder.svg"}
                        alt={book.title || "Book"}
                        width={128}
                        height={192}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = "/placeholder.svg";
                        }}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-1 right-1 h-6 w-6 p-0 bg-black/50 hover:bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleRemoveItem("readingList", book.id)}
                      >
                        <X className="h-3 w-3 text-white" />
                      </Button>
                    </div>
                    <div className="mt-2 text-center">
                      <p className="text-sm font-semibold leading-tight">
                        {getTextContent(book.title) || "Unknown Book"}
                      </p>
                      <p className="text-xs text-muted-foreground leading-tight mt-1">
                        {book.authors?.join(", ") || "Unknown Author"}
                      </p>
                    </div>
                  </div>
                ))
              : // Show placeholder items when empty
                Array.from({ length: 4 }, (_, idx) => (
                  <div
                    key={`placeholder-reading-list-${idx}`}
                    className="flex-shrink-0 w-32"
                  >
                    <div className="aspect-[2/3] w-full bg-black/20 rounded-md border border-border/30 flex items-center justify-center">
                      <div className="text-center">
                        <Plus className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                        <p className="text-xs text-muted-foreground/50">
                          Add Book
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 text-center">
                      <p className="text-sm font-semibold leading-tight text-muted-foreground/50">
                        Book Title
                      </p>
                      <p className="text-xs text-muted-foreground/50 leading-tight mt-1">
                        Author Name
                      </p>
                    </div>
                  </div>
                ))}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 p-0 bg-black/50 hover:bg-black/70 text-white rounded-full"
            onClick={() => scrollRight(scrollContainerRefs.readingList)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* recommendations */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-muted-foreground">
            recommendations
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 hover:bg-muted"
            onClick={() => openSearchDialog("recommendations")}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 p-0 bg-black/50 hover:bg-black/70 text-white rounded-full"
            onClick={() => scrollLeft(scrollContainerRefs.recommendations)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div
            ref={scrollContainerRefs.recommendations}
            className="flex gap-2 overflow-x-auto scrollbar-hide"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {limitedRecommendations.length > 0
              ? limitedRecommendations.map((book, idx) => (
                  <div
                    key={book.id || idx}
                    className="relative group flex-shrink-0 w-32"
                  >
                    <div className="aspect-[2/3] w-full bg-muted rounded-md overflow-hidden">
                      <Image
                        src={book.cover || "/placeholder.svg"}
                        alt={book.title || "Book"}
                        width={128}
                        height={192}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = "/placeholder.svg";
                        }}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-1 right-1 h-6 w-6 p-0 bg-black/50 hover:bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() =>
                          handleRemoveItem("recommendations", book.id)
                        }
                      >
                        <X className="h-3 w-3 text-white" />
                      </Button>
                    </div>
                    <div className="mt-2 text-center">
                      <p className="text-sm font-semibold leading-tight">
                        {getTextContent(book.title) || "Unknown Book"}
                      </p>
                      <p className="text-xs text-muted-foreground leading-tight mt-1">
                        {book.authors?.join(", ") || "Unknown Author"}
                      </p>
                    </div>
                  </div>
                ))
              : // Show placeholder items when empty
                Array.from({ length: 4 }, (_, idx) => (
                  <div
                    key={`placeholder-recommendation-${idx}`}
                    className="flex-shrink-0 w-32"
                  >
                    <div className="aspect-[2/3] w-full bg-black/20 rounded-md border border-border/30 flex items-center justify-center">
                      <div className="text-center">
                        <Plus className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                        <p className="text-xs text-muted-foreground/50">
                          Add Book
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 text-center">
                      <p className="text-sm font-semibold leading-tight text-muted-foreground/50">
                        Book Title
                      </p>
                      <p className="text-xs text-muted-foreground/50 leading-tight mt-1">
                        Author Name
                      </p>
                    </div>
                  </div>
                ))}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 p-0 bg-black/50 hover:bg-black/70 text-white rounded-full"
            onClick={() => scrollRight(scrollContainerRefs.recommendations)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Ratings Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Ratings</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => openSearchDialog("ratings")}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Rating
          </Button>
        </div>
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 p-0 bg-black/50 hover:bg-black/70 text-white rounded-full"
            onClick={() => scrollLeft(scrollContainerRefs.ratings)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div
            ref={scrollContainerRefs.ratings}
            className="flex gap-2 overflow-x-auto scrollbar-hide"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {Object.keys(safeBooksProfile.ratings).length > 0
              ? Object.entries(safeBooksProfile.ratings)
                  .map(([bookId, rating]) => {
                    const book =
                      safeBooksProfile.favoriteBooks?.find(
                        (b) => b.id === bookId
                      ) ||
                      safeBooksProfile.recentlyRead?.find(
                        (b) => b.id === bookId
                      ) ||
                      safeBooksProfile.readingList?.find(
                        (b) => b.id === bookId
                      ) ||
                      safeBooksProfile.recommendations?.find(
                        (b) => b.id === bookId
                      );

                    if (!book) return null;

                    return (
                      <div
                        key={bookId}
                        className="relative group flex-shrink-0 w-32"
                      >
                        <div className="aspect-[2/3] w-full bg-muted rounded-md overflow-hidden">
                          <Image
                            src={book.cover || "/placeholder.svg"}
                            alt={book.title || "Book"}
                            width={128}
                            height={192}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = "/placeholder.svg";
                            }}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute top-1 right-1 h-6 w-6 p-0 bg-black/50 hover:bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleRemoveRating(bookId)}
                          >
                            <X className="h-3 w-3 text-white" />
                          </Button>
                          <div className="absolute bottom-1 left-1 right-1 flex justify-center gap-1 p-2 bg-black/50 rounded-md">
                            {renderInteractiveStars(bookId, rating)}
                          </div>
                        </div>
                        {/* Removed name and author display - only poster and rating shown */}
                      </div>
                    );
                  })
                  .filter(Boolean)
              : // Show placeholder items when empty
                Array.from({ length: 4 }, (_, idx) => (
                  <div
                    key={`placeholder-rating-${idx}`}
                    className="flex-shrink-0 w-32"
                  >
                    <div className="aspect-[2/3] w-full bg-black/20 rounded-md border border-border/30 flex items-center justify-center">
                      <div className="text-center">
                        <Plus className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                        <p className="text-xs text-muted-foreground/50">
                          Add Book
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 text-center">
                      <p className="text-sm font-semibold leading-tight text-muted-foreground/50">
                        Book Title
                      </p>
                      <p className="text-xs text-muted-foreground/50 leading-tight mt-1">
                        Author Name
                      </p>
                    </div>
                  </div>
                ))}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 p-0 bg-black/50 hover:bg-black/70 text-white rounded-full"
            onClick={() => scrollRight(scrollContainerRefs.ratings)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Search Dialog */}
      <Dialog open={showSearchDialog} onOpenChange={setShowSearchDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>
              Search Books - Add to{" "}
              {activeSearchType
                ? activeSearchType.replace(/([A-Z])/g, " $1").toLowerCase()
                : ""}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="flex gap-2 mb-4">
              <Input
                placeholder="Search for books..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSearch(searchQuery, activeSearchType!);
                  }
                }}
              />
              <Button
                onClick={() => handleSearch(searchQuery, activeSearchType!)}
                disabled={isSearching}
              >
                {isSearching ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>

            {searchError && (
              <div className="text-red-500 text-sm mb-4">{searchError}</div>
            )}

            <div className="flex-1 overflow-y-auto">
              {searchResults.length > 0 ? (
                <div className="space-y-2">
                  {searchResults.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer"
                      onClick={() => handleSelectItem(item)}
                    >
                      <div className="aspect-[2/3] w-12 bg-muted rounded-md overflow-hidden flex-shrink-0">
                        <Image
                          src={item.cover || "/placeholder.svg"}
                          alt={item.title || "Book"}
                          width={48}
                          height={64}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = "/placeholder.svg";
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm line-clamp-1">
                          {getTextContent(item.title)}
                        </h4>
                        {item.authors && item.authors.length > 0 && (
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {item.authors.join(", ")}
                          </p>
                        )}
                        {item.publishedDate && (
                          <p className="text-xs text-muted-foreground">
                            {item.publishedDate}
                          </p>
                        )}
                      </div>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : searchQuery && !isSearching ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Book className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No books found</p>
                </div>
              ) : null}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
