"use client";

import { useEffect, useState } from "react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Film,
  BookOpen,
  Tv,
  Star,
  Plus,
  Heart,
  Users,
  Check,
} from "lucide-react";
import { useRecommendations } from "@/hooks/use-recommendations";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";

interface User {
  uid: string;
  displayName: string;
  photoURL?: string;
  email: string;
}

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

interface UserRecommendation {
  user: User;
  movies: Movie[];
  books: Book[];
  series: Series[];
}

export default function RecommendationsPage() {
  const { user: currentUser, loading: authLoading } = useCurrentUser();
  const router = useRouter();
  const { toast } = useToast();
  const [activeCategory, setActiveCategory] = useState<
    "movies" | "books" | "series"
  >("movies");
  const [selectedSource, setSelectedSource] = useState<"friends" | "all">(
    "all"
  );
  const [addingItems, setAddingItems] = useState<Set<string>>(new Set());

  const {
    recommendations,
    loading,
    error,
    addMovieToCollection,
    addBookToCollection,
    addSeriesToCollection,
  } = useRecommendations(selectedSource);

  useEffect(() => {
    if (!authLoading && currentUser === null) {
      router.replace("/login");
      return;
    }
  }, [currentUser, authLoading, router]);

  const getItemsByCategory = (userRec: UserRecommendation) => {
    switch (activeCategory) {
      case "movies":
        return userRec.movies;
      case "books":
        return userRec.books;
      case "series":
        return userRec.series;
      default:
        return [];
    }
  };

  const getItemCount = (userRec: UserRecommendation) => {
    return getItemsByCategory(userRec).length;
  };

  const getUserInitials = (displayName: string) => {
    return displayName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const handleAddToCollection = async (
    item: Movie | Book | Series,
    category: string
  ) => {
    const itemId = `${category}-${item.id}`;
    setAddingItems((prev) => new Set(prev).add(itemId));

    try {
      let success = false;

      switch (category) {
        case "movies":
          success = await addMovieToCollection(item as Movie);
          break;
        case "books":
          success = await addBookToCollection(item as Book);
          break;
        case "series":
          success = await addSeriesToCollection(item as Series);
          break;
      }

      if (success) {
        toast({
          title: "Added to collection",
          description: `${
            (item as any).title
          } has been added to your ${category} collection.`,
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to add item to collection. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add item to collection. Please try again.",
        variant: "destructive",
      });
    } finally {
      setAddingItems((prev) => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-black dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (currentUser === null) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-black dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Recommendations
          </h1>
          <p className="text-lg text-muted-foreground">
            Discover content from other users' collections
          </p>
        </div>

        {/* Category Tabs */}
        <div className="flex space-x-8 mb-6 border-b border-gray-200 dark:border-gray-700">
          {[
            { key: "movies", label: "Movies", icon: Film },
            { key: "books", label: "Books", icon: BookOpen },
            { key: "series", label: "Series", icon: Tv },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveCategory(key as any)}
              className={`flex items-center gap-2 pb-2 px-1 text-sm font-medium transition-colors ${
                activeCategory === key
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-foreground hover:text-primary"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Source Filter */}
        <div className="mb-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <input
                type="radio"
                id="friends"
                name="source"
                value="friends"
                checked={selectedSource === "friends"}
                onChange={() => setSelectedSource("friends")}
                className="w-4 h-4 text-primary"
              />
              <label
                htmlFor="friends"
                className="text-sm font-medium cursor-pointer"
              >
                From Friends
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="radio"
                id="all"
                name="source"
                value="all"
                checked={selectedSource === "all"}
                onChange={() => setSelectedSource("all")}
                className="w-4 h-4 text-primary"
              />
              <label
                htmlFor="all"
                className="text-sm font-medium cursor-pointer"
              >
                From All Users
              </label>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">
                  Loading recommendations...
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Error loading recommendations
              </h3>
              <p className="text-muted-foreground">{error}</p>
            </div>
          ) : recommendations.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                No recommendations yet
              </h3>
              <p className="text-muted-foreground">
                Start following other users to see their recommendations
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {recommendations
                .filter((userRec) => getItemCount(userRec) > 0)
                .map((userRec) => {
                  const items = getItemsByCategory(userRec);

                  return (
                    <Card key={userRec.user.uid} className="overflow-hidden">
                      <CardContent className="p-0">
                        {/* User Header */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={userRec.user.photoURL} />
                              <AvatarFallback>
                                {getUserInitials(userRec.user.displayName)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="font-semibold text-gray-900 dark:text-white">
                                {userRec.user.displayName}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {items.length} {activeCategory.slice(0, -1)}
                                {items.length !== 1 ? "s" : ""} in their
                                collection
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Items Grid */}
                        <div className="p-4">
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                            {items.slice(0, 12).map((item) => (
                              <div key={item.id} className="group relative">
                                <div className="relative aspect-[2/3] rounded-lg overflow-hidden">
                                  <Image
                                    src={item.cover || "/placeholder.svg"}
                                    alt={item.title || "Unknown"}
                                    fill
                                    className="object-cover transition-transform group-hover:scale-105"
                                  />
                                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <div className="flex flex-col gap-2">
                                      <Button
                                        size="sm"
                                        variant="secondary"
                                        onClick={() =>
                                          handleAddToCollection(
                                            item,
                                            activeCategory
                                          )
                                        }
                                        disabled={addingItems.has(
                                          `${activeCategory}-${item.id}`
                                        )}
                                      >
                                        {addingItems.has(
                                          `${activeCategory}-${item.id}`
                                        ) ? (
                                          <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1"></div>
                                            Adding...
                                          </>
                                        ) : (
                                          <>
                                            <Plus className="h-4 w-4 mr-1" />
                                            Add to List
                                          </>
                                        )}
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="secondary"
                                        asChild
                                      >
                                        <Link
                                          href={`/${activeCategory}/${item.id}`}
                                        >
                                          View Details
                                        </Link>
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                                <div className="mt-2">
                                  <h4 className="font-semibold text-sm truncate">
                                    {item.title || "Unknown Title"}
                                  </h4>
                                  <p className="text-xs text-muted-foreground">
                                    {activeCategory === "books"
                                      ? (item as Book).author
                                      : (item as Movie | Series).year || "N/A"}
                                  </p>
                                  {(item as Movie | Series).rating && (
                                    <div className="flex items-center gap-1 mt-1">
                                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                      <span className="text-xs">
                                        {(
                                          item as Movie | Series
                                        ).rating?.toFixed(1)}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                          {items.length > 12 && (
                            <div className="text-center mt-4">
                              <Button variant="outline" size="sm">
                                View all {items.length} items
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
            </div>
          )}
        </div>
      </div>
      <Toaster />
    </div>
  );
}
