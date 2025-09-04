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
       <div className="flex items-center gap-4 mb-4">
        <div className="relative">
          <OtherUserAvatar
            authorId={user.uid}
            username={userProfile?.username || user.displayName}
            displayName={displayName}
            avatarUrl={avatarUrl}
            size="md"
            className="cursor-pointer hover:scale-105 transition-transform duration-200 ring-4 ring-blue-500/20 hover:ring-blue-500/40"
            clickable={true}
          />
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full border-2 border-slate-900"></div>
        </div>
        <div className="flex-1">
          <h3
            className="text-xl font-bold text-white cursor-pointer hover:text-blue-300 transition-colors mb-0"
            onClick={() => router.push(`/users/${user.uid}`)}
          >
            {displayName}
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
  };

  // Component for item card
  const ItemCard = ({
    item,
    category,
  }: {
    item: Movie | Book | Series | MusicAlbum;
    category: string;
  }) => (
    <div className="group relative">
      <div className="relative w-[100px] sm:w-[120px] md:w-[140px] lg:w-[160px] xl:w-[180px] h-[150px] sm:h-[180px] md:h-[200px] lg:h-[220px] xl:h-[240px] rounded-xl overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/50 hover:border-emerald-500/50 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-emerald-500/20">
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

        
      </div>

      <div className="mt-3 space-y-1">
        <h4 className="font-semibold text-sm text-white leading-tight group-hover:text-emerald-300 transition-colors">
          {(() => {
            const title =
              (item as Movie | Book | Series).title ||
              (item as MusicAlbum).name ||
              "Unknown Title";

            // For books, truncate long titles with ellipses
            if (category === "books" && title.length > 25) {
              return title.substring(0, 25) + "...";
            }

            // For other media types, truncate at 30 characters
            if (title.length > 30) {
              return title.substring(0, 30) + "...";
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
        {category === "music" && (
          <p className="text-xs text-gray-400">{(item as MusicAlbum).year}</p>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black w-full overflow-x-hidden">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-16 sm:pt-20 pb-6 sm:pb-8">
        {/* Header */}
        <div className="mb-8 sm:mb-12 text-center">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-2xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent">
              Recommendations
            </h1>
          </div>
          <p className="text-base sm:text-lg text-gray-300 max-w-2xl mx-auto">
            Discover amazing content curated by people you follow
          </p>
        </div>

        {/* Category Tabs */}
        <div className="flex justify-center mb-8 sm:mb-12">
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-1 sm:p-2 border border-gray-600 shadow-lg w-full max-w-lg sm:max-w-none">
            <div className="flex flex-wrap justify-center gap-1 sm:gap-0">
              {CATEGORIES.map(({ key, label, icon: Icon, color }) => (
                <button
                  key={key}
                  onClick={() => setActiveCategory(key)}
                  className={`relative flex items-center gap-0.5 sm:gap-2 px-2 sm:px-6 py-2 sm:py-3 rounded-xl text-[10px] sm:text-sm font-medium transition-all duration-300 flex-1 sm:flex-none ${
                    activeCategory === key
                      ? "bg-gradient-to-r from-emerald-600 to-blue-600 text-white shadow-lg"
                      : "text-gray-300 hover:text-white hover:bg-gray-700/50"
                  }`}
                >
                  <Icon className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="text-[10px] sm:text-sm leading-tight">
                    {label}
                  </span>
                  {activeCategory === key && (
                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent rounded-xl"></div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-8 sm:space-y-12">
          {loading ? (
            <div className="space-y-6 sm:space-y-8">
              {/* Loading Skeleton */}
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-slate-800/30 backdrop-blur-sm rounded-3xl p-4 sm:p-6 md:p-8 border border-slate-700/30 relative overflow-hidden"
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
                  <div className="flex gap-4 overflow-x-auto pb-4">
                    {[1, 2, 3, 4, 5, 6].map((item) => (
                      <div key={item} className="flex-shrink-0">
                        <div className="w-[100px] sm:w-[140px] md:w-[160px] h-[150px] sm:h-[200px] md:h-[240px] bg-gray-700 rounded-xl animate-pulse relative overflow-hidden">
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
                         <div className="space-y-6 sm:space-y-8">
               {recommendations
                 .filter((userRec) => getItemCount(userRec) > 0)
                 .map((userRec) => {
                   const items = getItemsByCategory(userRec);

                   return (
                     <div
                       key={userRec.user.uid}
                       className="space-y-4"
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
