"use client";

import { useEffect, useState, useRef } from "react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
  Play,
  Bookmark,
  Calendar,
  Clock,
  Award,
  Zap,
  Eye,
  ChevronRight,
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
    featured?: Array<{
      id: string;
      name: string;
    }>;
    all?: Array<{
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
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/20",
    hoverColor: "hover:bg-red-500/20",
  },
  {
    key: "books",
    label: "Books",
    icon: BookOpen,
    color: "from-blue-500 to-cyan-500",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20",
    hoverColor: "hover:bg-blue-500/20",
  },
  {
    key: "series",
    label: "Series",
    icon: Tv,
    color: "from-purple-500 to-indigo-500",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/20",
    hoverColor: "hover:bg-purple-500/20",
  },
  {
    key: "music",
    label: "Music",
    icon: Music,
    color: "from-green-500 to-emerald-500",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/20",
    hoverColor: "hover:bg-green-500/20",
  },
] as const;

type CategoryType = (typeof CATEGORIES)[number]["key"];

export default function RecommendationsPage() {
  const { user: currentUser, loading: authLoading } = useCurrentUser();
  const router = useRouter();
  const { toast } = useToast();
  const [activeCategory, setActiveCategory] = useState<CategoryType>("movies");
  const [addingItems, setAddingItems] = useState<Set<string>>(new Set());
  const [userProfiles, setUserProfiles] = useState<Map<string, UserProfile>>(
    new Map()
  );

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
          username: userData.username || userData.displayName || "Unknown User",
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative mb-8">
            <div className="w-20 h-20 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-3xl animate-pulse shadow-2xl"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-3xl animate-ping opacity-20"></div>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Loading Recommendations
          </h2>
          <p className="text-slate-400 font-medium">
            Discovering amazing content for you...
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
    const categoryInfo = CATEGORIES.find((cat) => cat.key === category);

    return (
      <div className="bg-slate-800/30 backdrop-blur-sm hover:bg-slate-800/50 transition-all duration-300 group rounded-lg p-2 sm:p-3">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="relative group/avatar">
            <OtherUserAvatar
              authorId={user.uid}
              username={userProfile?.username || user.displayName}
              displayName={displayName}
              avatarUrl={avatarUrl}
              size="md"
              className="w-8 h-8 sm:w-12 sm:h-12 cursor-pointer hover:scale-105 transition-all duration-300"
              clickable={true}
            />
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 sm:w-5 sm:h-5 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full flex items-center justify-center">
              {categoryInfo && (
                <categoryInfo.icon className="w-2 h-2 sm:w-3 sm:h-3 text-white" />
              )}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-sm sm:text-base">
              <span
                className="font-semibold text-white cursor-pointer hover:text-slate-300 transition-colors"
                onClick={() => router.push(`/users/${user.uid}`)}
              >
                {displayName}
              </span>
              <span className="text-xs sm:text-sm font-medium text-slate-300">
                {itemCount}
              </span>
              <span className="text-xs sm:text-sm text-slate-400">
                {(() => {
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
              </span>
            </div>
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
  }) => {
    const categoryInfo = CATEGORIES.find((cat) => cat.key === category);
    const title =
      (item as Movie | Book | Series).title ||
      (item as MusicAlbum).name ||
      "Unknown Title";
    const subtitle =
      category === "books"
        ? (item as Book).author
        : category === "music"
        ? (() => {
            const musicItem = item as MusicAlbum;
            // Try primary artists first, then featured, then all
            const artists =
              musicItem.artists?.primary ||
              musicItem.artists?.featured ||
              musicItem.artists?.all ||
              [];
            return (
              artists.map((artist) => artist.name).join(", ") ||
              "Unknown Artist"
            );
          })()
        : (item as Movie | Series).year || "N/A";

    const imageUrl =
      (item as Movie | Book | Series).cover ||
      (item as MusicAlbum).image?.[2]?.url ||
      (item as MusicAlbum).image?.[1]?.url ||
      (item as MusicAlbum).image?.[0]?.url ||
      "/placeholder.jpg";

    return (
      <div className="recommendation-card relative w-full bg-slate-800/20 backdrop-blur-sm hover:bg-slate-800/40 rounded-lg overflow-hidden">
        <div className="relative aspect-[3/4] rounded-lg overflow-hidden">
          <Link
            href={
              category === "music"
                ? `/music/album/${item.id}`
                : `/${category}/${item.id}`
            }
            className="block w-full h-full"
          >
            <div className="w-full h-full rounded-lg overflow-hidden">
              <Image
                src={imageUrl}
                alt={title}
                fill
                className="object-cover cursor-pointer transition-transform duration-500 hover:scale-110"
              />
            </div>
          </Link>

          {/* Rating badge for movies/series */}
          {(item as Movie | Series).rating && (
            <div className="absolute top-2 right-2">
              <Badge className="bg-yellow-500/20 text-yellow-300 backdrop-blur-sm text-xs px-1.5 py-0.5">
                <Star className="w-2 h-2 mr-1 fill-current" />
                {(item as Movie | Series).rating}
              </Badge>
            </div>
          )}
        </div>

        <div className="p-2 sm:p-3 space-y-1">
          <h4 className="font-semibold text-white leading-tight line-clamp-2 text-xs sm:text-sm">
            {title}
          </h4>
          <p className="text-xs text-slate-400 leading-tight line-clamp-1">
            {subtitle}
          </p>

          {/* Additional info based on category */}
          <div className="flex items-center gap-1 text-xs text-slate-500">
            {category === "music" && (item as MusicAlbum).songCount && (
              <span className="flex items-center gap-1">
                <Music className="w-2 h-2" />
                {(item as MusicAlbum).songCount} songs
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 w-full overflow-x-hidden">
      <div className="relative max-w-6xl mx-auto px-3 sm:px-6 pt-20 sm:pt-16 pb-4 sm:pb-6">
         {/* Header - More compact on mobile */}
         <div className="mb-6 sm:mb-8">
           <div className="text-center mb-4 sm:mb-6">
             <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-2 sm:mb-3 bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
               For You
             </h1>
             <p className="text-sm sm:text-lg text-slate-300 max-w-xl mx-auto leading-relaxed">
               Discover amazing content curated by people you follow
             </p>
           </div>
         </div>

        {/* Category Filters - More compact on mobile */}
        <div className="flex flex-wrap justify-center gap-1.5 sm:gap-3 mb-6 sm:mb-8">
          {CATEGORIES.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveCategory(key)}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-colors duration-200 ${
                activeCategory === key
                  ? "bg-white text-slate-900 border border-white"
                  : "bg-slate-800/50 text-white hover:bg-slate-700/50 border border-slate-600/50 hover:border-slate-500/50"
              }`}
            >
              <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="space-y-3 sm:space-y-8">
          {loading ? (
            <div className="space-y-3 sm:space-y-8">
              {/* Loading Skeleton */}
              {[1, 2, 3].map((i) => (
                <Card
                  key={i}
                  className="bg-slate-800/30 backdrop-blur-sm border-slate-700/30 relative overflow-hidden"
                >
                  <CardContent className="p-4 sm:p-6">
                    {/* Subtle gradient overlay for loading effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse"></div>

                    {/* User Header Skeleton */}
                    <div className="flex items-center gap-2.5 sm:gap-4 mb-4 sm:mb-6">
                      <div className="relative">
                        <div className="w-10 h-10 sm:w-16 sm:h-16 bg-slate-700 rounded-full animate-pulse"></div>
                        <div className="absolute -bottom-0.5 -right-0.5 sm:-bottom-1 sm:-right-1 w-5 h-5 sm:w-6 sm:h-6 bg-slate-600 rounded-full animate-pulse"></div>
                      </div>
                      <div className="flex-1">
                        <div className="h-4 sm:h-6 bg-slate-700 rounded w-32 sm:w-40 mb-1 sm:mb-2 animate-pulse"></div>
                        <div className="h-3 sm:h-4 bg-slate-700 rounded w-20 sm:w-28 animate-pulse"></div>
                      </div>
                    </div>

                    {/* Items Grid Skeleton */}
                    <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-3">
                      {[1, 2, 3, 4, 5, 6].map((item) => (
                        <div
                          key={item}
                          className="flex-shrink-0 w-[calc(100%/3.5)] sm:w-[160px] md:w-[180px] lg:w-[200px]"
                        >
                          <div className="bg-slate-800/30 rounded-lg overflow-hidden">
                            <div className="w-full aspect-[3/4] bg-slate-700 animate-pulse relative overflow-hidden">
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse"></div>
                            </div>
                            <div className="p-2 sm:p-3 space-y-1">
                              <div className="h-2.5 sm:h-3 bg-slate-700 rounded w-full animate-pulse"></div>
                              <div className="h-2 bg-slate-700 rounded w-3/4 animate-pulse"></div>
                              <div className="h-2 bg-slate-700 rounded w-1/2 animate-pulse"></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : error ? (
            <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700/50">
              <CardContent className="text-center py-16">
                <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6 ring-4 ring-red-500/10">
                  <Users className="h-12 w-12 text-red-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">
                  Oops! Something went wrong
                </h3>
                <p className="text-slate-300 mb-6 max-w-md mx-auto leading-relaxed">
                  {error}
                </p>
                <Button
                  onClick={() => window.location.reload()}
                  className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-semibold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
              </CardContent>
            </Card>
          ) : recommendations.length === 0 ? (
            <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700/50">
              <CardContent className="text-center py-16">
                <div className="w-24 h-24 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6 ring-4 ring-blue-500/10">
                  <Users className="h-12 w-12 text-blue-400" />
                </div>
                {following.length === 0 ? (
                  <>
                    <h3 className="text-2xl font-bold text-white mb-3">
                      No recommendations yet
                    </h3>
                    <p className="text-slate-300 mb-8 max-w-md mx-auto leading-relaxed">
                      Start following other users to discover amazing content
                      recommendations
                    </p>
                    <Button
                      onClick={() => router.push("/users")}
                      className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-semibold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                    >
                      <Users className="w-5 h-5 mr-2" />
                      Find Friends
                    </Button>
                  </>
                ) : (
                  <>
                    <h3 className="text-2xl font-bold text-white mb-3">
                      No recommendations from your friends yet
                    </h3>
                    <p className="text-slate-300 mb-8 max-w-md mx-auto leading-relaxed">
                      Your friends haven't shared any recommendations yet. Check
                      back later or find more friends to discover new content.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <Button
                        onClick={() => router.push("/users")}
                        className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                      >
                        <Users className="w-4 h-4 mr-2" />
                        <span className="hidden sm:inline">Search Friends</span>
                        <span className="sm:hidden">Find Friends</span>
                      </Button>
                      <Button
                        onClick={() => router.push("/reviews")}
                        variant="outline"
                        className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white font-semibold px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105"
                      >
                        <TrendingUp className="w-4 h-4 mr-2" />
                        <span className="hidden sm:inline">Browse Feed</span>
                        <span className="sm:hidden">Browse Feed</span>
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ) : (
            (() => {
              // Filter recommendations that have items for the current category
              const recommendationsWithItems = recommendations.filter(
                (userRec) => getItemCount(userRec) > 0
              );

              // If no recommendations for current category, show category-specific empty state
              if (recommendationsWithItems.length === 0) {
                const categoryInfo = CATEGORIES.find(
                  (cat) => cat.key === activeCategory
                );
                const Icon = categoryInfo?.icon || Film;

                return (
                  <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700/50">
                    <CardContent className="text-center py-16">
                      <div
                        className={`w-24 h-24 ${categoryInfo?.bgColor} rounded-full flex items-center justify-center mx-auto mb-6 ring-4 ${categoryInfo?.borderColor} ring-opacity-20`}
                      >
                        <Icon className="h-12 w-12 text-slate-400" />
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-3">
                        No {categoryInfo?.label} recommendations yet
                      </h3>
                      <p className="text-slate-300 mb-8 max-w-md mx-auto leading-relaxed">
                        No {categoryInfo?.label.toLowerCase()} recommendations
                        from your friends yet. Check back later or find more
                        friends to discover new content.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button
                          onClick={() => router.push("/users")}
                          className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                        >
                          <Users className="w-4 h-4 mr-2" />
                          <span className="hidden sm:inline">
                            Find More Friends
                          </span>
                          <span className="sm:hidden">Find Friends</span>
                        </Button>
                        <Button
                          onClick={() => router.push("/reviews")}
                          variant="outline"
                          className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white font-semibold px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105"
                        >
                          <TrendingUp className="w-4 h-4 mr-2" />
                          <span className="hidden sm:inline">Browse Feed</span>
                          <span className="sm:hidden">Browse Feed</span>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              }

              // Show recommendations for current category
              return (
                <div className="space-y-3 sm:space-y-8">
                  {recommendationsWithItems.map((userRec) => {
                    const items = getItemsByCategory(userRec);

                    return (
                      <div
                        key={userRec.user.uid}
                        className="space-y-2 sm:space-y-4"
                      >
                        {/* User Header */}
                        <UserHeader
                          user={userRec.user}
                          itemCount={items.length}
                          category={activeCategory}
                        />

                         {/* Items Grid */}
                         <div className="relative">
                           <div className="recommendations-container flex gap-2 sm:gap-3 overflow-x-auto pb-3 scrollbar-hide">
                             {items.slice(0, 12).map((item) => (
                               <div
                                 key={item.id}
                                 className="flex-shrink-0 w-[calc(100%/3.5)] sm:w-[160px] md:w-[180px] lg:w-[200px]"
                               >
                                 <ItemCard
                                   item={item}
                                   category={activeCategory}
                                 />
                               </div>
                             ))}
                           </div>

                        </div>

                        {/* View All Button */}
                        {items.length > 12 && (
                          <div className="text-center pt-4 sm:pt-6">
                            <Button
                              variant="outline"
                              size="lg"
                              className="text-slate-300 hover:text-white hover:bg-slate-700/50 border-slate-600 hover:border-slate-500 font-semibold px-6 sm:px-8 py-2 sm:py-3 rounded-xl transition-all duration-300 transform hover:scale-105 text-sm sm:text-base"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View all {items.length} items
                              <ChevronRight className="w-4 h-4 ml-2" />
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()
          )}
        </div>
      </div>
      <Toaster />
    </div>
  );
}
