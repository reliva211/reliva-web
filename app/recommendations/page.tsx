"use client";

import { useEffect, useState } from "react";

// Force dynamic rendering to prevent prerender issues
export const dynamic = "force-dynamic";
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
  Music,
  Disc,
} from "lucide-react";
import { useRecommendations } from "@/hooks/use-recommendations";
import { useMusicCollections } from "@/hooks/use-music-collections";
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
  year?: number;
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

interface MusicAlbum {
  id: string;
  name: string;
  artists: {
    primary: Array<{
      id: string;
      name: string;
    }>;
  };
  image: Array<{ quality: string; url: string }>;
  year: string;
  language: string;
  songCount: number;
  playCount: number;
  songs?: any[];
  addedAt: string;
  type: "album" | "song" | "artist";
}

interface UserRecommendation {
  user: User;
  movies: Movie[];
  books: Book[];
  series: Series[];
  music?: MusicAlbum[];
}

export default function RecommendationsPage() {
  const { user: currentUser, loading: authLoading } = useCurrentUser();
  const router = useRouter();
  const { toast } = useToast();
  const [activeCategory, setActiveCategory] = useState<
    "movies" | "books" | "series" | "music"
  >("movies");
  const [addingItems, setAddingItems] = useState<Set<string>>(new Set());

  const {
    recommendations,
    loading,
    error,
    addMovieToCollection,
    addBookToCollection,
    addSeriesToCollection,
  } = useRecommendations(); // Always use "all" to show all following users

  // Remove unused music collections hook since we're showing followers' recommendations
  // const { musicRecommendations, loading: musicLoading } = useMusicCollections();

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
      case "music":
        return userRec.music || [];
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
    item: Movie | Book | Series | MusicAlbum,
    category: string
  ) => {
    const itemId = `${category}-${item.id}`;
    setAddingItems((prev) => new Set(prev).add(itemId));

    try {
      let success = false;

      switch (category) {
        case "movies":
          success = (await addMovieToCollection(item as Movie)) || false;
          break;
        case "books":
          success = (await addBookToCollection(item as Book)) || false;
          break;
        case "series":
          success = (await addSeriesToCollection(item as Series)) || false;
          break;
        case "music":
          // For music, we'll show a toast since it's already in recommendations
          toast({
            title: "Music in recommendations",
            description: `${
              (item as MusicAlbum).name
            } is already in your music recommendations.`,
          });
          success = true;
          break;
      }

      if (success) {
        if (category !== "music") {
          toast({
            title: "Added to collection",
            description: `${
              (item as any).title || (item as MusicAlbum).name
            } has been added to your ${category} collection.`,
          });
        }
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
      <div className="max-w-7xl mx-auto px-4 py-8 ml-8 pl-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
            Recommendations
          </h1>
          <p className="text-base text-muted-foreground">
            Discover recommendations from people you follow
          </p>
        </div>

        {/* Category Tabs */}
        <div className="flex space-x-6 mb-4 border-b border-gray-200 dark:border-gray-700">
          {[
            { key: "movies", label: "Movies", icon: Film },
            { key: "books", label: "Books", icon: BookOpen },
            { key: "series", label: "Series", icon: Tv },
            { key: "music", label: "Music", icon: Music },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveCategory(key as any)}
              className={`flex items-center gap-1.5 pb-1.5 px-1 text-xs font-medium transition-colors ${
                activeCategory === key
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-foreground hover:text-primary"
              }`}
            >
              <Icon className="w-3 h-3" />
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-3"></div>
                <p className="text-muted-foreground text-sm">
                  Loading recommendations...
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="text-base font-semibold mb-1">
                Error loading recommendations
              </h3>
              <p className="text-muted-foreground text-sm">{error}</p>
            </div>
          ) : activeCategory === "music" ? (
            // Music recommendations section - show followers' music recommendations
            <div className="space-y-6">
              {recommendations.filter(
                (userRec) => userRec.music && userRec.music.length > 0
              ).length === 0 ? (
                <div className="text-center py-8">
                  <Music className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <h3 className="text-base font-semibold mb-1">
                    No music recommendations from people you follow
                  </h3>
                  <p className="text-muted-foreground mb-4 text-sm">
                    People you follow haven't added any music to their
                    recommendations yet
                  </p>
                  <Button
                    onClick={() => router.push("/music")}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 text-sm"
                  >
                    <Music className="w-3 h-3 mr-1.5" />
                    Explore Music
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {recommendations
                    .filter(
                      (userRec) => userRec.music && userRec.music.length > 0
                    )
                    .map((userRec) => {
                      const musicItems = userRec.music || [];

                      return (
                        <div key={userRec.user.uid} className="space-y-4">
                          {/* User Header */}
                          <div className="flex items-center gap-3">
                            <Avatar
                              className="h-9 w-9 cursor-pointer hover:opacity-80 transition-opacity ring-2 ring-primary/20"
                              onClick={() =>
                                router.push(`/users/${userRec.user.uid}`)
                              }
                            >
                              <AvatarImage src={userRec.user.photoURL} />
                              <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                                {getUserInitials(userRec.user.displayName)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h3
                                className="text-lg font-semibold text-gray-900 dark:text-white cursor-pointer hover:text-primary transition-colors"
                                onClick={() =>
                                  router.push(`/users/${userRec.user.uid}`)
                                }
                              >
                                {userRec.user.displayName}
                              </h3>
                              <p className="text-xs text-muted-foreground">
                                {musicItems.length} music album
                                {musicItems.length !== 1 ? "s" : ""} in their
                                recommendations
                              </p>
                            </div>
                          </div>

                          {/* Music Items Grid */}
                          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                            {musicItems.slice(0, 12).map((album) => (
                              <div
                                key={album.id}
                                className="group flex-shrink-0"
                              >
                                <div className="relative w-[156px] h-[231px] rounded-md overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
                                  <Link href={`/music/album/${album.id}`}>
                                    <img
                                      src={
                                        album.image?.[2]?.url ||
                                        album.image?.[1]?.url ||
                                        album.image?.[0]?.url ||
                                        "/placeholder.svg"
                                      }
                                      alt={album.name || "Unknown"}
                                      className="w-full h-full object-cover cursor-pointer transition-transform duration-300 group-hover:scale-105"
                                    />
                                  </Link>
                                </div>
                                <div className="mt-1.5 space-y-0.5 w-[156px]">
                                  <h4 className="font-medium text-xs line-clamp-2 text-gray-900 dark:text-white leading-tight overflow-hidden">
                                    {album.name || "Unknown Title"}
                                  </h4>
                                  <p className="text-xs text-muted-foreground leading-tight">
                                    {album.artists?.primary
                                      ?.map((artist) => artist.name)
                                      .join(", ") || "Unknown Artist"}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {album.year}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                          {musicItems.length > 12 && (
                            <div className="text-center pt-3">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-primary hover:text-primary/80 text-xs"
                              >
                                View all {musicItems.length} music items
                              </Button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          ) : recommendations.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="text-base font-semibold mb-1">
                No recommendations yet
              </h3>
              <p className="text-muted-foreground mb-4 text-sm">
                You need to follow other users to see their recommendations
              </p>
              <Button
                onClick={() => router.push("/users")}
                className="bg-primary text-primary-foreground hover:bg-primary/90 text-sm"
              >
                <Users className="w-3 h-3 mr-1.5" />
                Friends
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {recommendations
                .filter((userRec) => getItemCount(userRec) > 0)
                .map((userRec) => {
                  const items = getItemsByCategory(userRec);

                  return (
                    <div key={userRec.user.uid} className="space-y-4">
                      {/* User Header */}
                      <div className="flex items-center gap-3">
                        <Avatar
                          className="h-9 w-9 cursor-pointer hover:opacity-80 transition-opacity ring-2 ring-primary/20"
                          onClick={() =>
                            router.push(`/users/${userRec.user.uid}`)
                          }
                        >
                          <AvatarImage src={userRec.user.photoURL} />
                          <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                            {getUserInitials(userRec.user.displayName)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3
                            className="text-lg font-semibold text-gray-900 dark:text-white cursor-pointer hover:text-primary transition-colors"
                            onClick={() =>
                              router.push(`/users/${userRec.user.uid}`)
                            }
                          >
                            {userRec.user.displayName}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            {items.length} {activeCategory.slice(0, -1)}
                            {items.length !== 1 ? "s" : ""} in their
                            recommendations
                          </p>
                        </div>
                      </div>

                      {/* Items Grid */}
                      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                        {items.slice(0, 12).map((item) => (
                          <div key={item.id} className="group flex-shrink-0">
                            <div className="relative w-[156px] h-[231px] rounded-md overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
                              <Link href={`/${activeCategory}/${item.id}`}>
                                <Image
                                  src={
                                    (item as Movie | Book | Series).cover ||
                                    "/placeholder.svg"
                                  }
                                  alt={
                                    (item as Movie | Book | Series).title ||
                                    "Unknown"
                                  }
                                  fill
                                  className="object-cover cursor-pointer transition-transform duration-300 group-hover:scale-105"
                                />
                              </Link>
                            </div>
                            <div className="mt-1.5 space-y-0.5 w-[156px]">
                              <h4 className="font-medium text-xs line-clamp-2 text-gray-900 dark:text-white leading-tight overflow-hidden">
                                {(item as Movie | Book | Series).title ||
                                  "Unknown Title"}
                              </h4>
                              <p className="text-xs text-muted-foreground leading-tight">
                                {activeCategory === "books"
                                  ? (item as Book).author
                                  : (item as Movie | Series).year || "N/A"}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                      {items.length > 12 && (
                        <div className="text-center pt-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-primary hover:text-primary/80 text-xs"
                          >
                            View all {items.length} items
                          </Button>
                        </div>
                      )}
                    </div>
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
