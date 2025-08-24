"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  Edit,
  Folder,
} from "lucide-react";
import {
  useBooksProfile,
  type GoogleBookItem,
} from "@/hooks/use-books-profile";
import { useCurrentUser } from "@/hooks/use-current-user";

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

interface ProfileBooksSectionProps {
  userId?: string;
  readOnly?: boolean;
  publicCollections?: PublicCollection[];
  publicCollectionItems?: PublicCollectionItems;
  loadingPublicCollections?: boolean;
}

// Placeholder content for empty states - inspired by movie section design
const PLACEHOLDER = {
  currentlyReading: {
    title: "Add your current read",
    subtitle: "Search for a book you're reading",
    cover:
      "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=256&h=384&fit=crop&crop=center",
  },
  favoriteBooks: new Array(4).fill(0).map((_, i) => ({
    id: `fav-${i}`,
    cover:
      "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=160&h=240&fit=crop&crop=center",
  })),
  readingList: new Array(4).fill(0).map((_, i) => ({
    id: `read-${i}`,
    cover:
      "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=160&h=240&fit=crop&crop=center",
  })),
  recommendations: new Array(4).fill(0).map((_, i) => ({
    id: `rec-${i}`,
    cover:
      "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=160&h=240&fit=crop&crop=center",
  })),
  ratings: new Array(4).fill(0).map((_, i) => ({
    id: `rt-${i}`,
    cover:
      "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=160&h=240&fit=crop&crop=center",
  })),
};

// Helper function to clean up text content
const cleanTextContent = (text: string): string => {
  if (!text) return text;
  return text
    .replace(/\([^)]*\)/g, "") // Remove parentheses and their content
    .replace(/\[[^\]]*\]/g, "") // Remove square brackets and their content
    .replace(/\s+/g, " ") // Replace multiple spaces with single space
    .trim(); // Remove leading/trailing spaces
};

// Helper function to strip HTML tags and decode HTML entities
const stripHtmlTags = (html: string): string => {
  if (!html) return html;
  return html
    .replace(/<[^>]*>/g, "") // Remove HTML tags
    .replace(/&amp;/g, "&") // Decode HTML entities
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ") // Replace non-breaking spaces
    .replace(/\s+/g, " ") // Normalize whitespace
    .trim();
};

// Helper function to truncate title to first few words
const truncateTitleToWords = (title: string, maxWords: number = 1): string => {
  if (!title) return "Unknown Book";
  const cleanTitle = cleanTextContent(title);
  const words = cleanTitle.split(" ");
  if (words.length <= maxWords) return cleanTitle;
  return words.slice(0, maxWords).join(" ") + "...";
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

// Helper function to truncate book titles
const truncateTitle = (title: string, maxLength: number = 10): string => {
  if (!title) return "Unknown Book";
  const cleanTitle = cleanTextContent(title);
  return cleanTitle.length > maxLength
    ? cleanTitle.substring(0, maxLength) + "..."
    : cleanTitle;
};

export default function ProfileBooksSection({
  userId,
  readOnly = false,
  publicCollections = [],
  publicCollectionItems = {},
  loadingPublicCollections = false,
}: ProfileBooksSectionProps) {
  const { user } = useCurrentUser();
  const router = useRouter();
  const targetUserId = userId || user?.uid;
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
    replaceFavoriteBook,
    replaceReadingListBook,
    replaceRecommendation,
    replaceRating,
    searchBooks,
    searchBooksByTitleAndAuthor,
    getBookById,
  } = useBooksProfile(targetUserId || "");

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
  const [editingItem, setEditingItem] = useState<any>(null);

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
    ratings: [],
    favoriteAuthors: [],
  };

  // Recently read list
  const recentlyReadList = safeBooksProfile.recentlyRead || [];

  // Limited lists for display
  const limitedRatings = safeBooksProfile.ratings || [];

  // Scroll functions
  const scrollLeft = (ref: React.RefObject<HTMLDivElement | null>) => {
    if (ref.current) {
      const scrollDistance = Math.min(200, ref.current.clientWidth * 0.8);
      ref.current.scrollBy({
        left: -scrollDistance,
        behavior: "smooth",
      });
    }
  };

  const scrollRight = (ref: React.RefObject<HTMLDivElement | null>) => {
    if (ref.current) {
      const scrollDistance = Math.min(200, ref.current.clientWidth * 0.8);
      ref.current.scrollBy({
        left: scrollDistance,
        behavior: "smooth",
      });
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

  const renderInteractiveStars = (bookId: string, currentRating: number) => {
    const displayRating =
      hoveredRating?.bookId === bookId ? hoveredRating.rating : currentRating;

    return Array.from({ length: 5 }, (_, i) => {
      const starValue = i + 1;
      const isFullStar = displayRating >= starValue;

      return (
        <Star
          key={i}
          className={`h-4 w-4 transition-colors ${
            isFullStar ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
          } ${!readOnly ? "cursor-pointer" : ""}`}
          onMouseEnter={
            !readOnly ? () => handleRatingHover(bookId, starValue) : undefined
          }
          onMouseLeave={!readOnly ? handleRatingLeave : undefined}
          onClick={
            !readOnly ? () => handleRatingClick(bookId, starValue) : undefined
          }
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
      // Check if we're replacing an existing item
      if (editingItem) {
        switch (activeSearchType) {
          case "recentlyRead":
            // For recently read, we just update since it's a single item
            await updateRecentlyRead(formattedItem);
            break;
          case "favoriteBooks":
            await replaceFavoriteBook(editingItem.id, formattedItem);
            break;
          case "readingList":
            await replaceReadingListBook(editingItem.id, formattedItem);
            break;
          case "recommendations":
            await replaceRecommendation(editingItem.id, formattedItem);
            break;
          case "ratings":
            // Get the current rating for the item being replaced
            const currentRating =
              safeBooksProfile.ratings.find((r) => r.book.id === editingItem.id)
                ?.rating || 3;
            await replaceRating(editingItem.id, formattedItem);
            break;
        }
      } else {
        // Adding new items
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
      }

      setShowSearchDialog(false);
      setSearchQuery("");
      setSearchResults([]);
      setActiveSearchType(null);
      setEditingItem(null); // Clear the editing item
    } catch (error) {
      console.error("Error adding/replacing item:", error);
      alert("Failed to add/replace item. Please try again.");
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

  // Function to handle plus button clicks
  const handlePlusClick = (sectionType: string, itemToReplace?: any) => {
    // For favorite sections, open search dialog
    if (sectionType === "favoriteBooks") {
      openSearchDialog(sectionType, itemToReplace);
    } else {
      // For all other sections, redirect to discover page with specific section
      let section = "";
      switch (sectionType) {
        case "recentlyRead":
          section = "currently-reading";
          break;
        case "readingList":
          section = "reading-list";
          break;
        case "recommendations":
          section = "recommendations";
          break;
        case "ratings":
          section = "ratings";
          break;
        default:
          section = "";
      }
      const url = section ? `/books?section=${section}` : `/books`;
      router.push(url);
    }
  };

  const openSearchDialog = (searchType: any, itemToReplace?: any) => {
    setActiveSearchType(searchType);
    setShowSearchDialog(true);
    setSearchQuery("");
    setSearchResults([]);
    setSearchError(null);

    // Store the item to replace if provided
    if (itemToReplace) {
      setEditingItem(itemToReplace);
    } else {
      setEditingItem(null);
    }
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

  // Limit items to specified limits per section
  const limitedFavoriteBooks =
    safeBooksProfile.favoriteBooks?.slice(0, 5) || [];
  const limitedReadingList = safeBooksProfile.readingList || [];
  const limitedRecommendations =
    safeBooksProfile.recommendations?.slice(0, 20) || [];

  // Show loading state
  if (loading) {
    return (
      <div className="space-y-5 max-w-5xl mx-auto">
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
      <div className="space-y-5 max-w-5xl mx-auto">
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
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Public Collections Section */}
      {publicCollections.length > 0 && (
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-start mb-4">
            <p className="text-sm font-medium text-muted-foreground">
              public collections
            </p>
          </div>
          {loadingPublicCollections ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-muted rounded mb-2"></div>
                  <div className="h-32 bg-muted rounded"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {publicCollections.map((collection) => {
                const items = publicCollectionItems[collection.id] || [];
                return (
                  <Card key={collection.id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Folder className="h-4 w-4 text-muted-foreground" />
                        <h3 className="font-semibold text-sm truncate">
                          {collection.name}
                        </h3>
                      </div>
                      <div className="flex gap-2 overflow-x-auto pb-2">
                        {items.slice(0, 4).map((item, idx) => (
                          <div
                            key={item.id || idx}
                            className="flex-shrink-0 w-16 h-24 bg-muted rounded-md overflow-hidden"
                          >
                            <Image
                              src={
                                item.cover ||
                                item.imageLinks?.thumbnail ||
                                "/placeholder.svg"
                              }
                              alt={item.title || item.name || "Book"}
                              width={64}
                              height={96}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = "/placeholder.svg";
                              }}
                            />
                          </div>
                        ))}
                        {items.length === 0 && (
                          <div className="flex-shrink-0 w-16 h-24 bg-muted rounded-md flex items-center justify-center">
                            <Book className="h-6 w-6 text-muted-foreground/50" />
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{collection.itemCount} books</span>
                        {items.length > 4 && (
                          <span>+{items.length - 4} more</span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Recently read section - horizontal layout */}
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-start mb-4">
          <p className="text-sm font-medium text-muted-foreground">
            currently reading
          </p>
        </div>

        <div className="relative">
          {currentRecentlyRead ? (
            <div className="flex gap-4 items-start">
              {/* Book cover */}
              <div className="relative group flex-shrink-0">
                <div className="w-48 h-72 bg-muted rounded-md overflow-hidden">
                  <Link href={`/books/${currentRecentlyRead.id}`}>
                    <Image
                      src={
                        currentRecentlyRead.cover ||
                        PLACEHOLDER.currentlyReading.cover
                      }
                      alt={getTextContent(currentRecentlyRead.title) || "Book"}
                      width={192}
                      height={288}
                      className="w-full h-full object-cover cursor-pointer"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = PLACEHOLDER.currentlyReading.cover;
                      }}
                    />
                  </Link>
                  {!readOnly && (
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-md flex items-center justify-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 bg-white/20 hover:bg-white/30 text-white"
                        onClick={() => handlePlusClick("recentlyRead")}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Content section */}
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-foreground mb-1">
                  {getTextContent(currentRecentlyRead.title) || "Unknown Book"}
                </h3>

                {/* Author information */}
                <p className="text-sm text-muted-foreground mb-2">
                  by{" "}
                  {currentRecentlyRead.authors?.join(", ") || "Unknown Author"}
                </p>

                {/* Publication year if available */}
                {currentRecentlyRead.publishedDate && (
                  <p className="text-xs text-muted-foreground/70 mb-3">
                    {currentRecentlyRead.publishedDate.split("-")[0]}
                  </p>
                )}

                {/* Description */}
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {currentRecentlyRead.description
                    ? stripHtmlTags(currentRecentlyRead.description)
                    : "No description available"}
                </p>

                {/* Action buttons and navigation */}
                <div className="flex items-center gap-4">
                  {/* Navigation dots */}
                  {recentlyReadList.length > 1 && (
                    <div className="flex gap-1">
                      {recentlyReadList.map((_, index) => (
                        <div
                          key={index}
                          className={`w-2 h-2 rounded-full transition-colors ${
                            index === currentRecentlyReadIndex
                              ? "bg-primary"
                              : "bg-muted-foreground/30"
                          }`}
                        />
                      ))}
                    </div>
                  )}

                  {/* Read button */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-4"
                    disabled
                  >
                    <BookOpen className="h-3 w-3 mr-1" />
                    read
                  </Button>
                </div>
              </div>

              {/* Navigation arrow */}
              {recentlyReadList.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-10 w-10 p-0 bg-black/80 hover:bg-black backdrop-blur-md border border-white/10 rounded-full flex-shrink-0 shadow-2xl hover:scale-110 transition-all duration-300 z-30"
                  onClick={navigateRecentlyReadRight}
                >
                  <ChevronRight className="h-5 w-5 text-white" />
                </Button>
              )}
            </div>
          ) : (
            <div className="flex gap-4 items-start">
              {/* Empty state cover */}
              <div className="w-48 h-72 bg-muted rounded-md border border-border/30 flex items-center justify-center flex-shrink-0">
                <div className="text-center">
                  <BookOpen className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                  <p className="text-xs text-muted-foreground/50">
                    Add Current Read
                  </p>
                </div>
              </div>

              {/* Empty state content */}
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-muted-foreground/50 mb-1">
                  Book Title
                </h3>
                <p className="text-sm text-muted-foreground/50 mb-2">
                  by Author Name
                </p>
                <p className="text-xs text-muted-foreground/30 mb-3">2024</p>
                <p className="text-sm text-muted-foreground/50 mb-4">
                  Book description
                </p>

                <div className="flex items-center gap-4">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-muted-foreground/30 rounded-full"></div>
                    <div className="w-2 h-2 bg-muted-foreground/30 rounded-full"></div>
                    <div className="w-2 h-2 bg-muted-foreground/30 rounded-full"></div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-4"
                    disabled
                  >
                    <BookOpen className="h-3 w-3 mr-1" />
                    read
                  </Button>
                </div>
              </div>

              {/* Navigation arrow */}
              <Button
                variant="ghost"
                size="sm"
                className="h-10 w-10 p-0 bg-black/80 hover:bg-black backdrop-blur-md border border-white/10 rounded-full flex-shrink-0 shadow-2xl hover:scale-110 transition-all duration-300 z-30"
                disabled
              >
                <ChevronRight className="h-5 w-5 text-white/50" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Bottom row - favorite books aligned with top grid */}
      <div className="grid grid-cols-3 gap-4 sm:gap-6 lg:gap-8 max-w-3xl mx-auto">
        {/* favorite books - takes first column */}
        <div className="col-span-3">
          <div className="flex items-center justify-start mb-4">
            <p className="text-sm font-medium text-muted-foreground">
              favorite books
            </p>
          </div>
          <div className="relative">
            <div
              ref={scrollContainerRefs.favoriteBooks}
              className="flex justify-start gap-6 overflow-hidden"
            >
              {limitedFavoriteBooks.length > 0 ? (
                <>
                  {limitedFavoriteBooks.map((book, idx) => (
                    <div
                      key={book.id || idx}
                      className="relative group flex-shrink-0"
                    >
                      <div className="aspect-[2/3] w-32 bg-muted rounded-md overflow-hidden">
                        <Link href={`/books/${book.id}`}>
                          <Image
                            src={
                              book.cover || PLACEHOLDER.favoriteBooks[0].cover
                            }
                            alt={book.title || "Book"}
                            width={128}
                            height={192}
                            className="w-full h-full object-cover cursor-pointer"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = PLACEHOLDER.favoriteBooks[0].cover;
                            }}
                          />
                        </Link>
                        {!readOnly && (
                          <div className="absolute top-2 right-2 flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 bg-black/50 hover:bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() =>
                                handlePlusClick("favoriteBooks", book)
                              }
                              title="Replace book"
                            >
                              <Edit className="h-3 w-3 text-white" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 bg-red-600/80 hover:bg-red-700/90 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() =>
                                handleRemoveItem("favoriteBooks", book.id)
                              }
                              title="Delete book"
                            >
                              <Trash2 className="h-3 w-3 text-white" />
                            </Button>
                          </div>
                        )}
                      </div>
                      {/* Book name and author display */}
                      <div className="mt-3 text-center w-full">
                        <p className="text-sm font-semibold leading-tight px-2 min-h-[1.25rem] truncate">
                          {truncateTitleToWords(book.title)}
                        </p>
                        <p className="text-xs text-muted-foreground leading-tight mt-0.5 px-2 truncate">
                          {book.authors?.join(", ") || "Unknown Author"}
                        </p>
                      </div>
                    </div>
                  ))}

                  {/* Add button - only show when less than 5 items */}
                  {limitedFavoriteBooks.length < 5 && (
                    <div className="flex-shrink-0">
                      <div className="aspect-[2/3] w-32 bg-transparent rounded-md border-2 border-gray-600 flex items-center justify-center overflow-visible">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-12 w-12 p-0 bg-black/70 hover:bg-black/90 text-white rounded-full border-2 border-white/20 shadow-lg"
                          onClick={() => handlePlusClick("favoriteBooks")}
                        >
                          <Plus className="h-6 w-6" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                // Show single Add screen when empty
                <div className="flex flex-col items-center justify-center min-h-[200px]">
                  <div className="aspect-[2/3] w-32 bg-transparent rounded-md border-2 border-gray-600 flex flex-col items-center justify-center mb-3">
                    <p className="text-sm text-gray-400 mb-1 text-center">
                      Add
                    </p>
                    <p className="text-xs text-gray-500 text-center">
                      No favorite books
                    </p>
                  </div>
                  {!readOnly && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => handlePlusClick("favoriteBooks")}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add Book
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* reading list */}
      <div className="mt-12 max-w-3xl mx-auto">
        <div className="flex items-center justify-start mb-4">
          <p className="text-sm font-medium text-muted-foreground">
            reading list
          </p>
        </div>
        <div className="relative">
          <div
            ref={scrollContainerRefs.readingList}
            className="flex justify-start gap-6 overflow-hidden"
          >
            {limitedReadingList.length > 0 ? (
              <>
                {limitedReadingList.map((book, idx) => (
                  <div
                    key={book.id || idx}
                    className="relative group flex-shrink-0"
                  >
                    <div className="aspect-[2/3] w-32 bg-muted rounded-md overflow-hidden">
                      <Link href={`/books/${book.id}`}>
                        <Image
                          src={book.cover || PLACEHOLDER.readingList[0].cover}
                          alt={book.title || "Book"}
                          width={128}
                          height={192}
                          className="w-full h-full object-cover cursor-pointer"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = PLACEHOLDER.readingList[0].cover;
                          }}
                        />
                      </Link>
                      {!readOnly && (
                        <div className="absolute top-2 right-2 flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 bg-black/50 hover:bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handlePlusClick("readingList", book)}
                            title="Replace book"
                          >
                            <Edit className="h-3 w-3 text-white" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 bg-red-600/80 hover:bg-red-700/90 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() =>
                              handleRemoveItem("readingList", book.id)
                            }
                            title="Delete book"
                          >
                            <Trash2 className="h-3 w-3 text-white" />
                          </Button>
                        </div>
                      )}
                    </div>
                    {/* Book name and author display */}
                    <div className="mt-3 text-center w-full">
                      <p className="text-sm font-semibold leading-tight px-2 min-h-[1.25rem] truncate">
                        {truncateTitleToWords(book.title)}
                      </p>
                      <p className="text-xs text-muted-foreground leading-tight mt-0.5 px-2 truncate">
                        {book.authors?.join(", ") || "Unknown Author"}
                      </p>
                    </div>
                  </div>
                ))}

                {/* Add button for subsequent items - only show when not read-only */}
                {!readOnly && (
                  <div className="flex-shrink-0">
                    <div className="aspect-[2/3] w-32 bg-transparent rounded-md border-2 border-gray-600 flex items-center justify-center overflow-visible">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-12 w-12 p-0 bg-black/70 hover:bg-black/90 text-white rounded-full border-2 border-white/20 shadow-lg"
                        onClick={() => handlePlusClick("readingList")}
                      >
                        <Plus className="h-6 w-6" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              // Show single Add screen when empty
              <div className="flex flex-col items-center justify-center min-h-[200px]">
                <div className="aspect-[2/3] w-32 bg-transparent rounded-md border-2 border-gray-600 flex flex-col items-center justify-center mb-3">
                  <p className="text-xs text-gray-500 text-center">
                    No reading list books
                  </p>
                </div>
                {!readOnly && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => handlePlusClick("readingList")}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Book
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Navigation arrows for reading list */}
          {limitedReadingList.length > 0 && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="absolute left-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 bg-black/80 hover:bg-black backdrop-blur-md border border-white/10 text-white rounded-full shadow-2xl hover:scale-110 transition-all duration-300 z-30"
                onClick={() => scrollLeft(scrollContainerRefs.readingList)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 bg-black/80 hover:bg-black backdrop-blur-md border border-white/10 text-white rounded-full shadow-2xl hover:scale-110 transition-all duration-300 z-30"
                onClick={() => scrollRight(scrollContainerRefs.readingList)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* recommendations */}
      <div className="mt-12 max-w-3xl mx-auto">
        <div className="flex items-center justify-start mb-4">
          <p className="text-sm font-medium text-muted-foreground">
            recommendations
          </p>
        </div>
        <div className="relative">
          <div
            ref={scrollContainerRefs.recommendations}
            className="flex justify-start gap-6 overflow-hidden"
          >
            {limitedRecommendations.length > 0 ? (
              <>
                {limitedRecommendations.map((book, idx) => (
                  <div
                    key={book.id || idx}
                    className="relative group flex-shrink-0"
                  >
                    <div className="aspect-[2/3] w-32 bg-muted rounded-md overflow-hidden">
                      <Link href={`/books/${book.id}`}>
                        <Image
                          src={
                            book.cover || PLACEHOLDER.recommendations[0].cover
                          }
                          alt={book.title || "Book"}
                          width={128}
                          height={192}
                          className="w-full h-full object-cover cursor-pointer"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = PLACEHOLDER.recommendations[0].cover;
                          }}
                        />
                      </Link>
                      {!readOnly && (
                        <div className="absolute top-2 right-2 flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 bg-black/50 hover:bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() =>
                              handlePlusClick("recommendations", book)
                            }
                            title="Replace recommendation"
                          >
                            <Edit className="h-3 w-3 text-white" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 bg-red-600/80 hover:bg-red-700/90 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() =>
                              handleRemoveItem("recommendations", book.id)
                            }
                            title="Delete recommendation"
                          >
                            <Trash2 className="h-3 w-3 text-white" />
                          </Button>
                        </div>
                      )}
                    </div>
                    {/* Book name and author display */}
                    <div className="mt-3 text-center w-full">
                      <p className="text-sm font-semibold leading-tight px-2 min-h-[1.25rem] truncate">
                        {truncateTitleToWords(book.title)}
                      </p>
                      <p className="text-xs text-muted-foreground leading-tight mt-0.5 px-2 truncate">
                        {book.authors?.join(", ") || "Unknown Author"}
                      </p>
                    </div>
                  </div>
                ))}

                {/* Add button for subsequent items - only show when not read-only */}
                {!readOnly && (
                  <div className="flex-shrink-0">
                    <div className="aspect-[2/3] w-32 bg-transparent rounded-md border-2 border-gray-600 flex items-center justify-center overflow-visible">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-12 w-12 p-0 bg-black/70 hover:bg-black/90 text-white rounded-full border-2 border-white/20 shadow-lg"
                        onClick={() => handlePlusClick("recommendations")}
                      >
                        <Plus className="h-6 w-6" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              // Show single Add screen when empty
              <div className="flex flex-col items-start justify-start min-h-[200px]">
                <div className="aspect-[2/3] w-32 bg-transparent rounded-md border-2 border-gray-600 flex flex-col items-center justify-center mb-3">
                  <p className="text-xs text-gray-500 text-center">
                    No recommendations
                  </p>
                </div>
                {!readOnly && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => handlePlusClick("recommendations")}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Recommendation
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Navigation arrows for recommendations */}
          {limitedRecommendations.length > 0 && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="absolute left-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 bg-black/80 hover:bg-black backdrop-blur-md border border-white/10 text-white rounded-full shadow-2xl hover:scale-110 transition-all duration-300 z-30"
                onClick={() => scrollLeft(scrollContainerRefs.recommendations)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 bg-black/80 hover:bg-black backdrop-blur-md border border-white/10 text-white rounded-full shadow-2xl hover:scale-110 transition-all duration-300 z-30"
                onClick={() => scrollRight(scrollContainerRefs.recommendations)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* ratings */}
      <div className="mt-12 max-w-3xl mx-auto">
        <div className="flex items-center justify-start mb-4">
          <p className="text-sm font-medium text-muted-foreground">ratings</p>
        </div>
        <div className="relative">
          <div
            ref={scrollContainerRefs.ratings}
            className="flex justify-start gap-6 overflow-hidden"
          >
            {limitedRatings.length > 0 ? (
              <>
                {limitedRatings.map((rating, idx) => (
                  <div
                    key={`rating-${rating.book.id}-${idx}`}
                    className="relative group flex-shrink-0"
                  >
                    <div className="aspect-[2/3] w-32 bg-muted rounded-md overflow-hidden">
                      <Link href={`/books/${rating.book.id}`}>
                        <Image
                          src={
                            rating.book.cover || PLACEHOLDER.ratings[0].cover
                          }
                          alt={rating.book.title || "Book"}
                          width={128}
                          height={192}
                          className="w-full h-full object-cover cursor-pointer"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = PLACEHOLDER.ratings[0].cover;
                          }}
                        />
                      </Link>
                      {!readOnly && (
                        <div className="absolute top-2 right-2 flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 bg-black/50 hover:bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() =>
                              handlePlusClick("rating", rating.book)
                            }
                            title="Replace rating"
                          >
                            <Edit className="h-3 w-3 text-white" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 bg-red-600/80 hover:bg-red-700/90 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() =>
                              handleRemoveItem("rating", rating.book.id)
                            }
                            title="Delete rating"
                          >
                            <Trash2 className="h-3 w-3 text-white" />
                          </Button>
                        </div>
                      )}
                    </div>
                    {/* Rating stars - above the book name */}
                    <div className="mt-3 flex justify-center gap-1">
                      {renderInteractiveStars(rating.book.id, rating.rating)}
                    </div>
                    {/* Book name and author display - below the rating */}
                    <div className="mt-2 text-center w-full">
                      <p className="text-sm font-semibold leading-tight px-2 min-h-[1.5rem] truncate">
                        {truncateTitleToWords(rating.book.title)}
                      </p>
                      <p className="text-xs text-muted-foreground leading-tight mt-0.5 px-2 truncate">
                        {rating.book.authors?.join(", ") || "Unknown Author"}
                      </p>
                    </div>
                  </div>
                ))}

                {/* Add button for subsequent items - only show when not read-only */}
                {!readOnly && (
                  <div className="flex-shrink-0">
                    <div className="aspect-[2/3] w-32 bg-transparent rounded-md border-2 border-gray-600 flex items-center justify-center overflow-visible">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-12 w-12 p-0 bg-black/70 hover:bg-black/90 text-white rounded-full border-2 border-white/20 shadow-lg"
                        onClick={() => handlePlusClick("ratings")}
                      >
                        <Plus className="h-6 w-6" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              // Show single Add screen when empty
              <div className="flex flex-col items-center justify-center min-h-[200px]">
                <div className="aspect-[2/3] w-32 bg-transparent rounded-md border-2 border-gray-600 flex flex-col items-center justify-center mb-3">
                  <p className="text-xs text-gray-500 text-center">
                    No rated books
                  </p>
                </div>
                {!readOnly && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => handlePlusClick("ratings")}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Rating
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Navigation arrows for ratings */}
          {limitedRatings.length > 0 && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="absolute left-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 bg-black/80 hover:bg-black backdrop-blur-md border border-white/10 text-white rounded-full shadow-2xl hover:scale-110 transition-all duration-300 z-30"
                onClick={() => scrollLeft(scrollContainerRefs.ratings)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 bg-black/80 hover:bg-black backdrop-blur-md border border-white/10 text-white rounded-full shadow-2xl hover:scale-110 transition-all duration-300 z-30"
                onClick={() => scrollRight(scrollContainerRefs.ratings)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Search Dialog */}
      <Dialog open={showSearchDialog} onOpenChange={setShowSearchDialog}>
        <DialogContent className="sm:max-w-[600px] lg:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Replace" : "Search"}{" "}
              {activeSearchType === "recentlyRead"
                ? "Recently Read"
                : activeSearchType === "favoriteBooks"
                ? "Favorite Books"
                : activeSearchType === "readingList"
                ? "Reading List"
                : activeSearchType === "recommendations"
                ? "Recommendations"
                : activeSearchType === "ratings"
                ? "Ratings"
                : "Books"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder={`${
                    editingItem ? "Search for replacement" : "Search"
                  } ${
                    activeSearchType === "recentlyRead"
                      ? "books for currently reading"
                      : activeSearchType === "favoriteBooks"
                      ? "books for favorites"
                      : activeSearchType === "readingList"
                      ? "books for reading list"
                      : activeSearchType === "recommendations"
                      ? "books for recommendations"
                      : activeSearchType === "ratings"
                      ? "books for ratings"
                      : "books"
                  }...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      handleSearch(searchQuery, activeSearchType!);
                    }
                  }}
                  className="pl-10 text-sm"
                />
              </div>
              <Button
                onClick={() => handleSearch(searchQuery, activeSearchType!)}
                disabled={isSearching || !searchQuery.trim()}
                className="flex-shrink-0"
              >
                {isSearching
                  ? "Searching..."
                  : editingItem
                  ? "Search for Replacement"
                  : "Search"}
              </Button>
            </div>

            {searchError && (
              <div className="text-red-500 text-sm text-center">
                {searchError}
              </div>
            )}

            {searchResults.length > 0 && (
              <div className="max-h-60 overflow-y-auto space-y-2">
                {searchResults.map((item, index) => (
                  <div
                    key={item.id || index}
                    className="flex items-center gap-3 p-2 rounded-md hover:bg-muted cursor-pointer"
                    onClick={() => handleSelectItem(item)}
                  >
                    <div className="w-12 h-16 rounded-md overflow-hidden flex-shrink-0">
                      <Image
                        src={item.cover || "/placeholder.svg"}
                        alt={getTextContent(item.title || item.name) || "Book"}
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
                      <p className="text-sm font-semibold truncate leading-tight">
                        {cleanTextContent(
                          getTextContent(item.title || item.name)
                        ) || "Unknown"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate leading-tight mt-0.5">
                        {item.authors?.join(", ") || "Unknown Author"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
