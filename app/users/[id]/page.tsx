"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useUserData } from "@/hooks/use-userdata";
import { doc, getDoc, collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  User,
  Film,
  BookOpen,
  Music,
  Tv,
  Heart,
  MessageCircle,
  Users,
  UserCheck,
  ArrowLeft,
  Play,
  Clock,
  ThumbsUp,
  Crown,
  Eye,
  EyeOff,
  MessageSquare,
  MoreHorizontal,
  ChevronRight,
  Plus,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { MovieCard } from "@/components/movie-card";
import { HorizontalList } from "@/components/horizontal-list";
import ErrorBoundary from "@/components/error-boundary";

interface UserProfile {
  uid: string;
  email: string;
  username: string;
  fullName: string;
  bio?: string;
  avatarUrl?: string;
  followers?: string[];
  following?: string[];
  createdAt?: any;
}

interface Collection {
  id: string;
  name: string;
  description?: string;
  isPublic: boolean;
  type: "movies" | "series" | "books";
  itemCount: number;
}

interface CollectionItems {
  [collectionId: string]: any[];
}

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user: currentUser } = useCurrentUser();
  const [activeTab, setActiveTab] = useState("movies");
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  const userId = params.id as string;
  const { 
    userProfile, 
    publicCollections, 
    collectionItems, 
    loading, 
    error,
    getMovieCollections,
    getSeriesCollections,
    getBookCollections,
    getTop5Movies,
    getTop5Series,
    getTop5Books
  } = useUserData(userId);



  // Update followers/following counts when userProfile changes
  useEffect(() => {
    if (userProfile) {
      setFollowersCount(userProfile.followers?.length || 0);
      setFollowingCount(userProfile.following?.length || 0);

      // Check if current user is following this user
      if (currentUser) {
        setIsFollowing(userProfile.followers?.includes(currentUser.uid) || false);
      }
    }
  }, [userProfile, currentUser]);

  // Handle follow/unfollow
  const handleFollowToggle = async () => {
    if (!currentUser || !userProfile) return;

    try {
      // This would need to be implemented with proper Firebase updates
      // For now, just toggle the local state
      setIsFollowing(!isFollowing);
      setFollowersCount(prev => isFollowing ? prev - 1 : prev + 1);
    } catch (error) {
      console.error("Error toggling follow:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-muted-foreground">{error || "User not found"}</p>
          <Button 
            variant="outline" 
            onClick={() => router.back()}
            className="mt-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const isOwnProfile = currentUser?.uid === userId;



  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background">
        {/* Header with back button */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <Button 
            variant="ghost" 
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>

        {/* Top Profile Section */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row items-start gap-4 mb-6">
            {/* Profile Picture */}
            <Avatar className="w-16 h-16 sm:w-20 sm:h-20 border-2 border-border">
              <AvatarImage
                src={userProfile.avatarUrl || "/placeholder-user.jpg"}
                alt={userProfile.fullName || userProfile.username}
              />
              <AvatarFallback className="text-sm sm:text-lg">
                <User className="h-6 w-6 sm:h-8 sm:w-8" />
              </AvatarFallback>
            </Avatar>

            {/* User Info */}
            <div className="flex-1 w-full min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold mb-1 truncate">
                {userProfile.fullName || userProfile.username}
              </h1>
              <p className="text-sm text-muted-foreground mb-3">
                @{userProfile.username}
              </p>
              {userProfile.bio && (
                <p className="text-sm text-muted-foreground mb-3">{userProfile.bio}</p>
              )}
              
              <div className="flex items-center gap-6 mb-3">
                <button className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors">
                  <Users className="w-4 h-4" />
                  <span className="font-semibold">{followersCount}</span>
                  <span className="text-gray-400">followers</span>
                </button>
                <button className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors">
                  <UserCheck className="w-4 h-4" />
                  <span className="font-semibold">{followingCount}</span>
                  <span className="text-gray-400">following</span>
                </button>
              </div>

              {!isOwnProfile && currentUser && (
                <div className="flex gap-2">
                  <Button
                    variant={isFollowing ? "outline" : "default"}
                    size="sm"
                    onClick={handleFollowToggle}
                    className="text-xs sm:text-sm h-9"
                  >
                    {isFollowing ? "Following" : "Follow"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs sm:text-sm h-9"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Message
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Navigation Tabs */}
          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value)}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-4 h-auto bg-transparent border-b border-border rounded-none">
              <TabsTrigger
                value="music"
                className="text-xs sm:text-sm py-2 h-10 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none"
              >
                music
              </TabsTrigger>
              <TabsTrigger
                value="movies"
                className="text-xs sm:text-sm py-2 h-10 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none"
              >
                movies
              </TabsTrigger>
              <TabsTrigger
                value="series"
                className="text-xs sm:text-sm py-2 h-10 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none"
              >
                shows
              </TabsTrigger>
              <TabsTrigger
                value="books"
                className="text-xs sm:text-sm py-2 h-10 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none"
              >
                books
              </TabsTrigger>
            </TabsList>

            {/* Movies Tab */}
            <TabsContent value="movies" className="mt-6 space-y-6">
              {/* Top 5 Movies */}
              {getTop5Movies().length > 0 && (
                <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-muted-foreground">
                      top 5 movies
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {getTop5Movies().length} items
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    {getTop5Movies().map((movie) => (
                      <div key={movie.id}>
                        <div className="aspect-[2/3] w-full bg-muted rounded-md overflow-hidden">
                          <Image
                            src={movie.cover || "/placeholder.svg"}
                            alt={movie.title}
                            width={100}
                            height={150}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Public Collections */}
              {getMovieCollections().length > 0 && (
                <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
                  <h3 className="text-sm font-medium text-muted-foreground mb-4">
                    collections
                  </h3>
                  <div className="space-y-2">
                    {getMovieCollections().map((collection) => (
                      <div key={collection.id} className="flex items-center justify-between text-xs">
                        <span>{collection.name}</span>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <span>{collection.itemCount} movies</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {getTop5Movies().length === 0 && getMovieCollections().length === 0 && (
                <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
                  <div className="text-center py-8">
                    <Film className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No public movies yet</p>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Series Tab */}
            <TabsContent value="series" className="mt-6 space-y-6">
              {/* Top 5 Series */}
              {getTop5Series().length > 0 && (
                <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-muted-foreground">
                      top 5 series
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {getTop5Series().length} items
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    {getTop5Series().map((series) => (
                      <div key={series.id}>
                        <div className="aspect-[2/3] w-full bg-muted rounded-md overflow-hidden">
                          <Image
                            src={series.cover || "/placeholder.svg"}
                            alt={series.title}
                            width={100}
                            height={150}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Public Collections */}
              {getSeriesCollections().length > 0 && (
                <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
                  <h3 className="text-sm font-medium text-muted-foreground mb-4">
                    collections
                  </h3>
                  <div className="space-y-2">
                    {getSeriesCollections().map((collection) => (
                      <div key={collection.id} className="flex items-center justify-between text-xs">
                        <span>{collection.name}</span>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <span>{collection.itemCount} series</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {getTop5Series().length === 0 && getSeriesCollections().length === 0 && (
                <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
                  <div className="text-center py-8">
                    <Tv className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No public series yet</p>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Books Tab */}
            <TabsContent value="books" className="mt-6 space-y-6">
              {/* Top 5 Books */}
              {getTop5Books().length > 0 && (
                <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-muted-foreground">
                      top 5 books
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {getTop5Books().length} items
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    {getTop5Books().map((book) => (
                      <div key={book.id}>
                        <div className="aspect-[2/3] w-full bg-muted rounded-md overflow-hidden">
                          <Image
                            src={book.cover || "/placeholder.svg"}
                            alt={book.title}
                            width={100}
                            height={150}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Public Collections */}
              {getBookCollections().length > 0 && (
                <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
                  <h3 className="text-sm font-medium text-muted-foreground mb-4">
                    collections
                  </h3>
                  <div className="space-y-2">
                    {getBookCollections().map((collection) => (
                      <div key={collection.id} className="flex items-center justify-between text-xs">
                        <span>{collection.name}</span>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <span>{collection.itemCount} books</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {getTop5Books().length === 0 && getBookCollections().length === 0 && (
                <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
                  <div className="text-center py-8">
                    <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No public books yet</p>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Music Tab */}
            <TabsContent value="music" className="mt-6 space-y-6">
              {/* Top 5 Playlists */}
              <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    top 5 playlists
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      5 playlists
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {[
                    {
                      id: "1",
                      title: "Chill Vibes",
                      cover: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=100&h=100&fit=crop&crop=center",
                      tracks: 45
                    },
                    {
                      id: "2",
                      title: "Workout Mix",
                      cover: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100&h=100&fit=crop&crop=center",
                      tracks: 32
                    },
                    {
                      id: "3",
                      title: "Late Night",
                      cover: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=100&h=100&fit=crop&crop=center",
                      tracks: 28
                    },
                    {
                      id: "4",
                      title: "Road Trip",
                      cover: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100&h=100&fit=crop&crop=center",
                      tracks: 67
                    },
                    {
                      id: "5",
                      title: "Party Hits",
                      cover: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=100&h=100&fit=crop&crop=center",
                      tracks: 23
                    }
                  ].map((playlist) => (
                    <div key={playlist.id}>
                      <div className="aspect-square w-full bg-muted rounded-md overflow-hidden">
                        <Image
                          src={playlist.cover}
                          alt={playlist.title}
                          width={100}
                          height={100}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <p className="text-xs text-center mt-1 truncate">{playlist.title}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
                <div className="text-center py-8">
                  <Music className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">More music features coming soon</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </ErrorBoundary>
  );
} 