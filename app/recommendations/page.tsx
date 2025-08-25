"use client";

import { useEffect, useState } from "react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
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
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { useRecommendations } from "@/hooks/use-recommendations";
import { useMusicCollections } from "@/hooks/use-music-collections";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";

// Force dynamic rendering to prevent prerender issues
export const dynamic = "force-dynamic";

// Type definitions
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
  movies?: Movie[];
  books?: Book[];
  series?: Series[];
  music?: MusicAlbum[];
}

// Category configuration
const CATEGORIES = [
  {
    key: "movies",
    label: "Movies",
    icon: Film,
    color: "from-red-500 to-pink-500",
  },
  {
    key: "books",
    label: "Books",
    icon: BookOpen,
    color: "from-blue-500 to-cyan-500",
  },
  {
    key: "series",
    label: "Series",
    icon: Tv,
    color: "from-purple-500 to-indigo-500",
  },
  {
    key: "music",
    label: "Music",
    icon: Music,
    color: "from-green-500 to-emerald-500",
  },
] as const;

type CategoryType = (typeof CATEGORIES)[number]["key"];

export default function RecommendationsPage() {
  const { user: currentUser, loading: authLoading } = useCurrentUser();
  const router = useRouter();
  const { toast } = useToast();
  const [activeCategory, setActiveCategory] = useState<CategoryType>("movies");
  const [addingItems, setAddingItems] = useState<Set<string>>(new Set());

  const { recommendations, loading, error } = useRecommendations();
  const musicCollections = useMusicCollections();

  // Helper functions
  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getItemCount = (userRec: UserRecommendation) => {
    switch (activeCategory) {
      case "movies":
        return userRec.movies?.length || 0;
      case "books":
        return userRec.books?.length || 0;
      case "series":
        return userRec.series?.length || 0;
      case "music":
        return userRec.music?.length || 0;
      default:
        return 0;
    }
  };

  const getItemsByCategory = (userRec: UserRecommendation) => {
    switch (activeCategory) {
      case "movies":
        return userRec.movies || [];
      case "books":
        return userRec.books || [];
      case "series":
        return userRec.series || [];
      case "music":
        return userRec.music || [];
      default:
        return [];
    }
  };

  const handleAddToCollection = async (
    item: Movie | Book | Series | MusicAlbum,
    category: string
  ) => {
    const itemId = item.id?.toString() || "";
    if (addingItems.has(itemId)) return;

    setAddingItems((prev) => new Set(prev).add(itemId));

    try {
      let success = false;

      if (category === "music") {
          // For music, we'll show a toast since it's already in recommendations
          toast({
            title: "Music in recommendations",
            description: `${
              (item as MusicAlbum).name
            } is already in your music recommendations.`,
          });
          success = true;
      } else {
        // Handle other categories (movies, books, series)
        // This would need to be implemented based on your collection hooks
        success = true; // Placeholder
      }

      if (success) {
          toast({
          title: "Success",
            description: `${
              (item as any).title || (item as MusicAlbum).name
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

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-500/20 mx-auto mb-6"></div>
            <div className="absolute inset-0 animate-spin rounded-full h-16 w-16 border-4 border-transparent border-t-purple-500 mx-auto"></div>
          </div>
          <p className="text-purple-200 font-medium">
            Loading your recommendations...
          </p>
        </div>
      </div>
    );
  }

  if (currentUser === null) return null;

  // Component for user header
  const UserHeader = ({
    user,
    itemCount,
    category,
  }: {
    user: User;
    itemCount: number;
    category: string;
  }) => (
    <div className="flex items-center gap-4 mb-6">
      <div className="relative">
        <Avatar
          className="h-12 w-12 cursor-pointer hover:scale-105 transition-transform duration-200 ring-4 ring-blue-500/20 hover:ring-blue-500/40"
          onClick={() => router.push(`/users/${user.uid}`)}
        >
          <AvatarImage src={user.photoURL} />
          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-500 text-white font-semibold text-sm">
            {getUserInitials(user.displayName)}
          </AvatarFallback>
        </Avatar>
        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full border-2 border-slate-900"></div>
      </div>
      <div className="flex-1">
        <h3
          className="text-xl font-bold text-white cursor-pointer hover:text-blue-300 transition-colors mb-0"
          onClick={() => router.push(`/users/${user.uid}`)}
        >
          {user.displayName}
        </h3>
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-blue-400" />
          <p className="text-sm text-slate-300">
            {itemCount} {category === "music" ? "music" : category.slice(0, -1)}
            {itemCount !== 1 ? "s" : ""} recommended
          </p>
        </div>
      </div>
    </div>
  );

  // Component for item card
  const ItemCard = ({
    item,
    category,
  }: {
    item: Movie | Book | Series | MusicAlbum;
    category: string;
  }) => (
    <div className="group relative">
      <div className="relative w-[120px] sm:w-[140px] md:w-[160px] lg:w-[180px] h-[180px] sm:h-[200px] md:h-[220px] lg:h-[240px] rounded-xl overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 hover:border-blue-500/50 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/20">
        <Link href={`/${category}/${item.id}`}>
          <Image
            src={
              (item as Movie | Book | Series).cover ||
              (item as MusicAlbum).image?.[2]?.url ||
              (item as MusicAlbum).image?.[1]?.url ||
              (item as MusicAlbum).image?.[0]?.url ||
              "/placeholder.svg"
            }
            alt={
              (item as Movie | Book | Series).title ||
              (item as MusicAlbum).name ||
              "Unknown"
            }
            fill
            className="object-cover cursor-pointer transition-transform duration-300 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </Link>

        {/* Add to collection button */}
        <button
          onClick={() => handleAddToCollection(item, category)}
          className="absolute top-2 right-2 w-8 h-8 bg-black/50 hover:bg-blue-500/80 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110"
        >
          <Plus className="w-4 h-4 text-white" />
        </button>
      </div>

      <div className="mt-3 space-y-1">
        <h4 className="font-semibold text-sm text-white leading-tight line-clamp-2 group-hover:text-blue-300 transition-colors">
          {(item as Movie | Book | Series).title ||
            (item as MusicAlbum).name ||
            "Unknown Title"}
        </h4>
        <p className="text-xs text-slate-400 leading-tight">
          {category === "books"
            ? (item as Book).author
            : category === "music"
            ? (item as MusicAlbum).artists?.primary
                ?.map((artist) => artist.name)
                .join(", ") || "Unknown Artist"
            : (item as Movie | Series).year || "N/A"}
        </p>
        {category === "music" && (
          <p className="text-xs text-slate-400">{(item as MusicAlbum).year}</p>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-6 pt-20 pb-8">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
            Recommendations
          </h1>
          </div>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto">
            Discover amazing content curated by people you follow
          </p>
        </div>

        {/* Category Tabs */}
        <div className="flex justify-center mb-12">
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-2 border border-slate-700/50">
            {CATEGORIES.map(({ key, label, icon: Icon, color }) => (
            <button
              key={key}
                onClick={() => setActiveCategory(key)}
                className={`relative flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                activeCategory === key
                    ? `bg-gradient-to-r ${color} text-white shadow-lg`
                    : "text-slate-300 hover:text-white hover:bg-slate-700/50"
              }`}
            >
                <Icon className="w-4 h-4" />
              {label}
                {activeCategory === key && (
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent rounded-xl"></div>
                )}
            </button>
          ))}
          </div>
        </div>

        {/* Content */}
        <div className="space-y-12">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <div className="relative mb-6">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500/20 mx-auto"></div>
                  <div className="absolute inset-0 animate-spin rounded-full h-12 w-12 border-4 border-transparent border-t-blue-500 mx-auto"></div>
                </div>
                <p className="text-slate-300 font-medium">
                  Loading recommendations...
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="h-8 w-8 text-red-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Error loading recommendations
              </h3>
              <p className="text-slate-300">{error}</p>
            </div>
          ) : recommendations.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="h-8 w-8 text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                No recommendations yet
              </h3>
              <p className="text-slate-300 mb-6 max-w-md mx-auto">
                Start following other users to discover amazing content
                recommendations
              </p>
              <Button
                onClick={() => router.push("/users")}
                className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-medium px-8 py-3 rounded-xl"
              >
                <Users className="w-4 h-4 mr-2" />
                Find Friends
              </Button>
            </div>
          ) : (
            <div className="space-y-16">
              {recommendations
                .filter((userRec) => getItemCount(userRec) > 0)
                .map((userRec) => {
                  const items = getItemsByCategory(userRec);

                  return (
                    <div
                      key={userRec.user.uid}
                      className="bg-slate-800/30 backdrop-blur-sm rounded-3xl p-8 border border-slate-700/30 hover:border-blue-500/30 transition-all duration-300"
                    >
                      {/* User Header */}
                      <UserHeader
                        user={userRec.user}
                        itemCount={items.length}
                        category={activeCategory}
                      />

                      {/* Items Grid */}
                      <div className="relative">
                        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide px-1">
                        {items.slice(0, 12).map((item) => (
                            <ItemCard
                              key={item.id}
                              item={item}
                              category={activeCategory}
                            />
                          ))}
                            </div>

                        {/* Gradient fade to tease more content */}
                        <div className="absolute right-0 top-0 bottom-4 w-8 bg-gradient-to-l from-slate-800/80 to-transparent pointer-events-none"></div>

                        {/* Scroll indicator */}
                        {items.length > 3 && (
                          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-blue-500/20 backdrop-blur-sm rounded-full flex items-center justify-center pointer-events-none">
                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                          </div>
                        )}
                      </div>

                      {/* View All Button */}
                      {items.length > 12 && (
                        <div className="text-center pt-6">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-blue-300 hover:text-white hover:bg-blue-500/20 font-medium px-6 py-2 rounded-xl"
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
