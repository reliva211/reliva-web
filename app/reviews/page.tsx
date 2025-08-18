"use client";

import React, { useState, useEffect } from "react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useSearchParams } from "next/navigation";

import {
  Star,
  Search,
  Film,
  Tv,
  BookOpen,
  CheckCircle,
  XCircle,
} from "lucide-react";
import Image from "next/image";
import { searchService } from "@/lib/search-service";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { toast } from "@/components/ui/use-toast";

export default function ReviewsPage() {
  const { user } = useCurrentUser();
  const searchParams = useSearchParams();

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchType, setSearchType] = useState("movie"); // movie, series, book

  // Handle URL parameters for pre-selected media
  useEffect(() => {
    const type = searchParams.get("type");
    const id = searchParams.get("id");
    const title = searchParams.get("title");
    const author = searchParams.get("author");

    if (type && id && title) {
      setSearchType(type);
      setSearchQuery(title);

      // Create a mock media object for the selected item
      const mockMedia = {
        id: id,
        title: decodeURIComponent(title),
        cover: "", // Will be filled by search
        year: null,
        type: type,
        author: author ? decodeURIComponent(author) : null,
        data: {},
      };

      // Trigger search for the title to get full details
      if (title) {
        setSearchQuery(decodeURIComponent(title));
        // The search will be triggered in the next useEffect
      }
    }
  }, [searchParams]);

  // Auto-search when search query is set from URL parameters
  useEffect(() => {
    if (searchQuery && searchQuery.trim()) {
      searchMedia();
    }
  }, [searchType]); // Trigger when search type changes from URL params

  // Review state
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const searchMedia = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      let results = [];

      if (searchType === "movie") {
        const movies = await searchService.searchMovies(searchQuery);
        results = movies.map((movie) => ({
          id: movie.id,
          title: movie.title,
          cover: movie.poster_path
            ? `https://image.tmdb.org/t/p/w300${movie.poster_path}`
            : "/placeholder.svg",
          year: movie.release_date
            ? new Date(movie.release_date).getFullYear()
            : null,
          type: "movie",
          data: movie,
        }));
      } else if (searchType === "series") {
        const series = await searchService.searchSeries(searchQuery);
        results = series.map((show) => ({
          id: show.id,
          title: show.name,
          cover: show.poster_path
            ? `https://image.tmdb.org/t/p/w300${show.poster_path}`
            : "/placeholder.svg",
          year: show.first_air_date
            ? new Date(show.first_air_date).getFullYear()
            : null,
          type: "series",
          data: show,
        }));
      } else if (searchType === "book") {
        const books = await searchService.searchBooks(searchQuery);
        results = books.map((book) => ({
          id: book.id,
          title: book.volumeInfo.title,
          cover: book.volumeInfo.imageLinks?.thumbnail || "/placeholder.svg",
          year: book.volumeInfo.publishedDate
            ? new Date(book.volumeInfo.publishedDate).getFullYear()
            : null,
          author: book.volumeInfo.authors?.join(", "),
          type: "book",
          data: book,
        }));
      }

      setSearchResults(results);

      // Auto-select the media if it was pre-selected from URL parameters
      const urlId = searchParams.get("id");
      const urlTitle = searchParams.get("title");
      if (urlId && urlTitle && results.length > 0) {
        const decodedTitle = decodeURIComponent(urlTitle);
        const matchingResult = results.find(
          (result) =>
            result.id.toString() === urlId ||
            result.title.toLowerCase().includes(decodedTitle.toLowerCase())
        );
        if (matchingResult) {
          setSelectedMedia(matchingResult);
        }
      }
    } catch (error) {
      console.error("Search error:", error);
      toast({
        title: "Search Error",
        description: "Failed to search. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const selectMedia = (media) => {
    setSelectedMedia(media);
    setSearchResults([]);
    setSearchQuery("");
  };

  const submitReview = async () => {
    if (!user || !selectedMedia || rating === 0 || !reviewText.trim()) {
      toast({
        title: "Missing Information",
        description: "Please select media, rating, and write a review.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "reviews"), {
        userId: user.uid,
        userDisplayName:
          user.displayName || user.email?.split("@")[0] || "Anonymous",
        userEmail: user.email,
        mediaId: selectedMedia.id,
        mediaTitle: selectedMedia.title,
        mediaCover: selectedMedia.cover,
        mediaType: selectedMedia.type,
        mediaYear: selectedMedia.year,
        mediaAuthor: selectedMedia.author || null,
        rating: rating,
        reviewText: reviewText.trim(),
        timestamp: serverTimestamp(),
        likes: [],
        comments: [],
      });

      // Success message with more details
      toast({
        title: "✅ Review Posted Successfully!",
        description: `Your review for "${selectedMedia.title}" has been shared with the community.`,
      });

      // Reset form
      setSelectedMedia(null);
      setRating(0);
      setReviewText("");

      // Show success state
      setShowSuccess(true);

      // Navigate to home page after 3 seconds
      setTimeout(() => {
        window.location.href = "/";
      }, 3000);
    } catch (error) {
      console.error("Error submitting review:", error);
      toast({
        title: "❌ Failed to Post Review",
        description:
          "There was an error posting your review. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-md w-full">
          <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
            Login Required
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Please log in to write reviews.
          </p>
        </div>
      </div>
    );
  }

  // Show success state
  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-black dark:to-gray-900 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Review Posted Successfully!
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Your review has been shared with the community. You'll be redirected
            to the home page in a few seconds to see it in the feed.
          </p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => (window.location.href = "/")}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Go to Home
            </button>
            <button
              onClick={() => {
                setShowSuccess(false);
                setSelectedMedia(null);
                setRating(0);
                setReviewText("");
              }}
              className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-6 py-2 rounded-lg transition-colors"
            >
              Write Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-black dark:to-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">
          Write a Review
        </h1>

        {/* Search Section */}
        {!selectedMedia && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg mb-6">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Search Media
              </h2>
            </div>
            <div className="p-6 space-y-4">
              {/* Type Selector */}
              <div className="flex gap-2">
                {[
                  { value: "movie", label: "Movies", icon: Film },
                  { value: "series", label: "Series", icon: Tv },
                  { value: "book", label: "Books", icon: BookOpen },
                ].map((type) => (
                  <button
                    key={type.value}
                    onClick={() => setSearchType(type.value)}
                    className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      searchType === type.value
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                    }`}
                  >
                    <type.icon className="h-4 w-4" />
                    {type.label}
                  </button>
                ))}
              </div>

              {/* Search Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder={`Search for ${searchType}s...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && searchMedia()}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={searchMedia}
                  disabled={isSearching}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                >
                  <Search className="h-4 w-4" />
                </button>
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {searchResults.map((result) => (
                    <div
                      key={`${result.type}-${result.id}`}
                      className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      onClick={() => selectMedia(result)}
                    >
                      <Image
                        src={result.cover}
                        alt={result.title}
                        width={40}
                        height={60}
                        className="rounded object-cover"
                      />
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {result.title}
                        </h3>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {result.year && <span>{result.year}</span>}
                          {result.author && <span> • {result.author}</span>}
                        </div>
                        <span className="inline-block px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded mt-1">
                          {result.type.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Selected Media & Review Form */}
        {selectedMedia && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Review: {selectedMedia.title}
              </h2>
            </div>
            <div className="p-6 space-y-6">
              {/* Selected Media Display */}
              <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <Image
                  src={selectedMedia.cover}
                  alt={selectedMedia.title}
                  width={60}
                  height={90}
                  className="rounded object-cover"
                />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {selectedMedia.title}
                  </h3>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedMedia.year && <span>{selectedMedia.year}</span>}
                    {selectedMedia.author && (
                      <span> • {selectedMedia.author}</span>
                    )}
                  </div>
                  <span className="inline-block px-2 py-1 text-xs bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded mt-1">
                    {selectedMedia.type.toUpperCase()}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedMedia(null)}
                  className="ml-auto px-3 py-1 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                >
                  Change
                </button>
              </div>

              {/* Rating */}
              <div>
                <label className="text-sm font-medium text-gray-900 dark:text-white">
                  Rating (1-5 stars) *
                </label>
                <div className="flex items-center gap-1 mt-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`h-6 w-6 ${
                          star <= rating
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300 dark:text-gray-600"
                        }`}
                      />
                    </button>
                  ))}
                  {rating > 0 && (
                    <span className="ml-2 text-sm text-gray-600 dark:text-gray-300">
                      {rating}/5 stars
                    </span>
                  )}
                </div>
              </div>

              {/* Review Text */}
              <div>
                <label className="text-sm font-medium text-gray-900 dark:text-white">
                  Your Review *
                </label>
                <textarea
                  placeholder="Write your review here..."
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  rows={5}
                  className="mt-2 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Submit Button */}
              <div className="flex gap-2">
                <button
                  onClick={submitReview}
                  disabled={
                    !selectedMedia ||
                    rating === 0 ||
                    !reviewText.trim() ||
                    isSubmitting
                  }
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  {isSubmitting ? "Posting..." : "Post Review"}
                </button>
                <button
                  onClick={() => {
                    setSelectedMedia(null);
                    setRating(0);
                    setReviewText("");
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
