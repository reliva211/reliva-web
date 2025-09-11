"use client";

import { useEffect, useState, useRef } from "react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { OtherUserAvatar } from "@/components/user-avatar";
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
import { useUserConnections } from "@/hooks/use-user-connections";
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

interface UserProfile {
  _id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  email: string | null;
  bio: string | null;
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
  const [userProfiles, setUserProfiles] = useState<Map<string, UserProfile>>(new Map());

  const { recommendations, loading, error } = useRecommendations();
  const { following, loading: connectionsLoading } = useUserConnections();
  const musicCollections = useMusicCollections();

  // Function to fetch user profile for a given Firebase UID directly
  const fetchUserProfile = async (firebaseUID: string) => {
    if (userProfiles.has(firebaseUID)) return userProfiles.get(firebaseUID);

    try {
      // Import Firebase functions dynamically to avoid SSR issues
      const { doc, getDoc } = await import("firebase/firestore");
      const { db } = await import("@/lib/firebase");

      // Fetch the user profile using Firebase UID directly
      const userProfileRef = doc(db, "userProfiles", firebaseUID);
      const userProfileSnap = await getDoc(userProfileRef);

      if (userProfileSnap.exists()) {
        const userData = userProfileSnap.data();
        const userProfile = {
          _id: firebaseUID,
          username:
            userData.username || userData.displayName || "Unknown User",
          displayName:
            userData.displayName || userData.username || "Unknown User",
          avatarUrl: userData.avatarUrl || null,
          email: userData.email || null,
          bio: userData.bio || null,
        };
        setUserProfiles((prev) => new Map(prev.set(firebaseUID, userProfile)));
        return userProfile;
      }
    } catch (error) {
      console.error("Error fetching user profile from Firebase:", error);
    }
    return null;
  };

  // Fetch user profiles when recommendations change
  useEffect(() => {
    if (recommendations && recommendations.length > 0) {
      recommendations.forEach((userRec) => {
        // Assuming the user object has an authorId or similar field
        // You may need to adjust this based on your actual data structure
        if (userRec.user.uid) {
          fetchUserProfile(userRec.user.uid);
        }
      });
    }
  }, [recommendations]);

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
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="relative mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-2xl animate-pulse"></div>
          </div>
          <p className="text-gray-300 font-medium text-lg">
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
   }) => {
     const userProfile = userProfiles.get(user.uid);
     const displayName = userProfile?.displayName || user.displayName;
     const avatarUrl = userProfile?.avatarUrl || user.photoURL;
     
     return (
       <div className="flex items-center gap-3 mb-4">
        <div className="relative">
          <OtherUserAvatar
            authorId={user.uid}
            username={userProfile?.username || user.displayName}
            displayName={displayName}
            avatarUrl={avatarUrl}
            size="md"
            className="cursor-pointer hover:scale-105 transition-transform duration-200"
            clickable={true}
          />
        </div>
        <div className="flex-1">
          <h3
            className="text-base font-semibold text-white cursor-pointer hover:text-gray-300 transition-colors mb-0"
            onClick={() => router.push(`/users/${user.uid}`)}
          >
            {displayName}
          </h3>
          <p className="text-xs text-gray-400">
            {itemCount} {(() => {
              if (category === "music") {
                return itemCount === 1 ? "album" : "albums";
              } else if (category === "movies") {
                return itemCount === 1 ? "movie" : "movies";
              } else if (category === "books") {
                return itemCount === 1 ? "book" : "books";
              } else if (category === "series") {
                return itemCount === 1 ? "series" : "series";
              }
              return category.slice(0, -1) + (itemCount !== 1 ? "s" : "");
            })()}
          </p>
        </div>
      </div>
    );
  };

  // Component for item card
  const ItemCard = ({
    item,
    category,
  }: {
    item: Movie | Book | Series | MusicAlbum;
    category: string;
  }) => (
    <div className="group relative w-full">
      <div className="relative w-full aspect-[3/4] rounded-lg overflow-hidden bg-gray-800 hover:bg-gray-700 transition-all duration-300 hover:scale-105">
        <Link href={category === "music" ? `/music/album/${item.id}` : `/${category}/${item.id}`}>
          <Image
            src={
              (item as Movie | Book | Series).cover ||
              (item as MusicAlbum).image?.[2]?.url ||
              (item as MusicAlbum).image?.[1]?.url ||
              (item as MusicAlbum).image?.[0]?.url ||
              "/placeholder.jpg"
            }
            alt={
              (item as Movie | Book | Series).title ||
              (item as MusicAlbum).name ||
              "Unknown"
            }
            fill
            className="object-cover cursor-pointer transition-transform duration-300 group-hover:scale-110"
          />
        </Link>
      </div>

      <div className="mt-3 space-y-1">
        <h4 className="font-medium text-sm text-white leading-tight group-hover:text-gray-300 transition-colors">
          {(() => {
            const title =
              (item as Movie | Book | Series).title ||
              (item as MusicAlbum).name ||
              "Unknown Title";

            // Truncate long titles
            if (title.length > 20) {
              return title.substring(0, 20) + "...";
            }

            return title;
          })()}
        </h4>
        <p className="text-xs text-gray-400 leading-tight">
          {category === "books"
            ? (item as Book).author
            : category === "music"
            ? (item as MusicAlbum).artists?.primary
                ?.map((artist) => artist.name)
                .join(", ") || "Unknown Artist"
            : (item as Movie | Series).year || "N/A"}
        </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black w-full overflow-x-hidden">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-16 sm:pt-20 pb-6 sm:pb-8">
        {/* Header */}
        <div className="mb-8 sm:mb-12">
          <div className="mb-4">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
              For You
            </h1>
            <p className="text-sm sm:text-base text-gray-300">
              Content recommended by people you follow
            </p>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-2 sm:gap-3 mb-8 sm:mb-12">
          {CATEGORIES.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveCategory(key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                activeCategory === key
                  ? "bg-white text-gray-900 shadow-md"
                  : "bg-gray-700/50 text-gray-300 hover:bg-gray-600/50 hover:text-white"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="space-y-8 sm:space-y-12">
          {loading ? (
            <div className="space-y-4 sm:space-y-6">
              {/* Loading Skeleton */}
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-slate-800/30 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-slate-700/30 relative overflow-hidden"
                >
                  {/* Subtle gradient overlay for loading effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse"></div>
                  {/* User Header Skeleton */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className="relative">
                      <div className="w-12 h-12 bg-gray-700 rounded-full animate-pulse"></div>
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gray-600 rounded-full animate-pulse"></div>
                    </div>
                    <div className="flex-1">
                      <div className="h-6 bg-gray-700 rounded w-32 mb-2 animate-pulse"></div>
                      <div className="h-4 bg-gray-700 rounded w-24 animate-pulse"></div>
                    </div>
                  </div>

                  {/* Items Grid Skeleton */}
                  <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-4">
                    {[1, 2, 3, 4, 5, 6].map((item) => (
                      <div key={item} className="flex-shrink-0 w-[calc(100%/3.5)] sm:w-[140px] md:w-[160px] lg:w-[180px]">
                        <div className="w-full aspect-[3/4] bg-gray-700 rounded-lg animate-pulse relative overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse"></div>
                        </div>
                        <div className="mt-3 space-y-2">
                          <div className="h-4 bg-gray-700 rounded w-full animate-pulse"></div>
                          <div className="h-3 bg-gray-700 rounded w-3/4 animate-pulse"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="h-10 w-10 text-red-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Error loading recommendations
              </h3>
              <p className="text-slate-300 mb-4">{error}</p>
              <Button
                onClick={() => window.location.reload()}
                className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-medium px-6 py-2 rounded-xl"
              >
                Try Again
              </Button>
            </div>
          ) : recommendations.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="h-10 w-10 text-blue-400" />
              </div>
              {following.length === 0 ? (
                <>
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
                </>
              ) : (
                <>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    No recommendations from your friends yet
                  </h3>
                  <p className="text-slate-300 mb-6 max-w-md mx-auto">
                    Your friends haven't shared any recommendations yet. 
                    Check back later or find more friends to discover new content.
                  </p>
                  <div className="flex flex-row gap-3 sm:gap-4 justify-center">
                    <Button
                      onClick={() => router.push("/users")}
                      className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-medium px-4 py-3 sm:px-6 sm:py-3 rounded-xl text-sm"
                    >
                      <Users className="w-4 h-4 mr-2" />
                      <span className="hidden sm:inline">Search Friends</span>
                      <span className="sm:hidden">Find Friends</span>
                    </Button>
                    <Button
                      onClick={() => router.push("/reviews")}
                      variant="outline"
                      className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white font-medium px-4 py-3 sm:px-6 sm:py-3 rounded-xl text-sm"
                    >
                      <TrendingUp className="w-4 h-4 mr-2" />
                      <span className="hidden sm:inline">Browse Feed</span>
                      <span className="sm:hidden">Browse Feed</span>
                    </Button>
                  </div>
                </>
              )}
            </div>
          ) : (() => {
            // Filter recommendations that have items for the current category
            const recommendationsWithItems = recommendations.filter((userRec) => getItemCount(userRec) > 0);
            
            // If no recommendations for current category, show category-specific empty state
            if (recommendationsWithItems.length === 0) {
              const categoryInfo = CATEGORIES.find(cat => cat.key === activeCategory);
              const Icon = categoryInfo?.icon || Film;
              
              return (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-gray-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Icon className="h-10 w-10 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    No {categoryInfo?.label} recommendations yet
                  </h3>
                  <p className="text-slate-300 mb-6 max-w-md mx-auto">
                    No recommendations from your friends yet
                  </p>
                  <div className="flex flex-row gap-3 sm:gap-4 justify-center">
                    <Button
                      onClick={() => router.push("/users")}
                      className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-medium px-4 py-3 sm:px-6 sm:py-3 rounded-xl text-sm"
                    >
                      <Users className="w-4 h-4 mr-2" />
                      <span className="hidden sm:inline">Find More Friends</span>
                      <span className="sm:hidden">Find Friends</span>
                    </Button>
                    <Button
                      onClick={() => router.push("/reviews")}
                      variant="outline"
                      className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white font-medium px-4 py-3 sm:px-6 sm:py-3 rounded-xl text-sm"
                    >
                      <TrendingUp className="w-4 h-4 mr-2" />
                      <span className="hidden sm:inline">Browse Feed</span>
                      <span className="sm:hidden">Browse Feed</span>
                    </Button>
                  </div>
                </div>
              );
            }

            // Show recommendations for current category
            return (
              <div className="space-y-4 sm:space-y-6">
                {recommendationsWithItems.map((userRec) => {
                  const items = getItemsByCategory(userRec);

                  return (
                    <div
                      key={userRec.user.uid}
                      className="space-y-3"
                    >
                      {/* User Header */}
                      <UserHeader
                        user={userRec.user}
                        itemCount={items.length}
                        category={activeCategory}
                      />

                      {/* Items Grid */}
                      <div className="relative">
                        <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-4 scrollbar-hide">
                          {items.slice(0, 12).map((item) => (
                            <div key={item.id} className="flex-shrink-0 w-[calc(100%/3.5)] sm:w-[140px] md:w-[160px] lg:w-[180px]">
                              <ItemCard
                                item={item}
                                category={activeCategory}
                              />
                            </div>
                          ))}
                        </div>
                        
                        {/* Gradient fade to tease more content */}
                        <div className="absolute right-0 top-0 bottom-4 w-8 bg-gradient-to-l from-gray-900/80 to-transparent pointer-events-none"></div>
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
            );
          })()}
        </div>
      </div>
      <Toaster />
    </div>
  );
}
