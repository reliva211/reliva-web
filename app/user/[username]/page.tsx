"use client";

import { useState, useEffect } from "react";

// Force dynamic rendering to prevent prerendering issues
export const dynamic = 'force-dynamic';
import { useParams } from "next/navigation";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Lock, ArrowLeft, UserPlus, UserMinus } from "lucide-react";
import ProfileMusicSection from "@/components/profile-music-section";
import ProfileMovieSection from "@/components/profile-movie-section";
import ProfileSeriesSection from "@/components/profile-series-section";
import ProfileBooksSection from "@/components/profile-books-section";
import ErrorBoundary from "@/components/error-boundary";
import Link from "next/link";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useUserConnections } from "@/hooks/use-user-connections";
import { useFollowUser } from "@/hooks/use-follow-user";
import { useToast } from "@/hooks/use-toast";

interface UserProfile {
  uid: string;
  displayName: string;
  username: string;
  bio: string;
  website: string;
  avatarUrl: string;
  coverImageUrl: string;
  joinDate: string;
  isPublic?: boolean;
  followers?: string[];
  following?: string[];
  socialLinks: {
    twitter?: string;
    instagram?: string;
    linkedin?: string;
    github?: string;
  };
  visibleSections: {
    music: boolean;
    movies: boolean;
    series: boolean;
    books: boolean;
  };
}

export default function UserProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("music");
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  
  const { user: currentUser } = useCurrentUser();
  const { following } = useUserConnections();
  const { followUser, unfollowUser, isFollowing, loading: followLoading } = useFollowUser();
  const { toast } = useToast();

  useEffect(() => {
    const fetchProfileByUsername = async () => {
      if (!username) {
        setError("No username provided");
        setLoading(false);
        return;
      }

      try {
        console.log("Searching for username:", username);
        const profilesRef = collection(db, "userProfiles");
        const q = query(profilesRef, where("username", "==", username));
        const querySnapshot = await getDocs(q);
        
        console.log("Query result:", querySnapshot.empty ? "empty" : `found ${querySnapshot.docs.length} profiles`);
        
        if (querySnapshot.empty) {
          console.log("No profile found with username:", username);
          setError("Profile not found");
          setLoading(false);
          return;
        }
        
        const profileData = querySnapshot.docs[0].data() as UserProfile;

        // Check if profile is public (default to true if not specified)
        if (profileData.isPublic === false) {
          setError("This profile is private");
          setLoading(false);
          return;
        }

        setProfile(profileData);
        
        // Fetch followers and following counts from users collection
        try {
          const usersRef = collection(db, "users");
          const userQuery = query(usersRef, where("uid", "==", profileData.uid));
          const userSnapshot = await getDocs(userQuery);
          
          if (!userSnapshot.empty) {
            const userData = userSnapshot.docs[0].data();
            setFollowersCount(userData.followers?.length || 0);
            setFollowingCount(userData.following?.length || 0);
          } else {
            // Fallback to profile data if user not found in users collection
            setFollowersCount(profileData.followers?.length || 0);
            setFollowingCount(profileData.following?.length || 0);
          }
        } catch (error) {
          console.error("Error fetching user connections:", error);
          // Fallback to profile data
          setFollowersCount(profileData.followers?.length || 0);
          setFollowingCount(profileData.following?.length || 0);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        setError("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    fetchProfileByUsername();
  }, [username]);

  // Auto-select first available tab when sections are hidden
  useEffect(() => {
    if (profile?.visibleSections) {
      const availableTabs = [];
      if (profile.visibleSections.music !== false) availableTabs.push("music");
      if (profile.visibleSections.movies !== false)
        availableTabs.push("movie-profile");
      if (profile.visibleSections.series !== false)
        availableTabs.push("series");
      if (profile.visibleSections.books !== false) availableTabs.push("books");

      // If current tab is not available, switch to first available tab
      if (availableTabs.length > 0 && !availableTabs.includes(activeTab)) {
        setActiveTab(availableTabs[0]);
      }
    }
  }, [profile?.visibleSections, activeTab]);

  const handleFollowToggle = async () => {
    if (!currentUser || !profile) {
      toast({
        title: "Authentication Required",
        description: "Please log in to follow users.",
        variant: "destructive",
      });
      return;
    }

    if (profile.uid === currentUser.uid) {
      toast({
        title: "Cannot Follow Yourself",
        description: "You cannot follow yourself.",
        variant: "destructive",
      });
      return;
    }

    const currentlyFollowing = isFollowing(profile.uid, following.map(f => f.uid));
    
    try {
      let result;
      if (currentlyFollowing) {
        result = await unfollowUser(profile.uid);
        if (result.success) {
          toast({
            title: "Unfollowed",
            description: `You have unfollowed ${profile.displayName}.`,
          });
        }
      } else {
        result = await followUser(profile.uid);
        if (result.success) {
          toast({
            title: "Following",
            description: `You are now following ${profile.displayName}.`,
          });
        }
      }

      if (!result.success) {
        toast({
          title: "Error",
          description: result.error || "Failed to update follow status.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
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

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="mb-4">
            <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-xl font-semibold mb-2">Profile Unavailable</h1>
            <p className="text-muted-foreground mb-6">{error}</p>
          </div>
          <Link href="/reviews">
            <Button variant="outline" className="w-full">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-muted-foreground">Profile not found.</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        {/* Top Profile Section */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-20 sm:pt-20 pb-6 sm:pb-8">
          <div className="flex flex-col items-center text-center gap-6 mb-8">
            {/* Profile Picture */}
            <Avatar className="w-20 h-20 sm:w-24 sm:h-24 ring-4 ring-emerald-500/20 hover:ring-emerald-500/40 transition-all duration-300 group-hover:scale-105">
              <AvatarImage
                src={profile.avatarUrl || "/placeholder.svg"}
                alt={profile.displayName}
              />
              <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-blue-500 text-white text-lg sm:text-xl font-semibold">
                <User className="h-8 w-8 sm:h-10 sm:w-10" />
              </AvatarFallback>
            </Avatar>

            {/* User Info */}
            <div className="w-full max-w-md">
              <h1 className="text-2xl sm:text-3xl font-bold mb-2 bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent">
                {profile.displayName}
              </h1>
              <p className="text-sm text-gray-400 mb-2">@{profile.username}</p>
              {profile.bio && (
                <p className="text-sm text-gray-300 mb-4">
                  {profile.bio}
                </p>
              )}
              
              {/* Followers/Following Stats - Display only */}
              <div className="flex justify-center gap-6 mb-4">
                <div className="flex flex-col items-center gap-1">
                  <div className="text-xl font-bold text-white">{followingCount}</div>
                  <div className="text-xs text-gray-400">Following</div>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className="text-xl font-bold text-white">{followersCount}</div>
                  <div className="text-xs text-gray-400">Followers</div>
                </div>
              </div>
              
              {/* Follow Button - Only show if not viewing own profile */}
              {currentUser && profile.uid !== currentUser.uid && (
                <div className="mt-4">
                  <Button
                    onClick={handleFollowToggle}
                    disabled={followLoading}
                    className="bg-gray-600/20 hover:bg-gray-600/30 border border-gray-500/50 text-gray-300 hover:text-gray-200 transition-all duration-200 rounded-lg font-medium px-6 py-2"
                  >
                    {followLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-300"></div>
                    ) : isFollowing(profile.uid, following.map(f => f.uid)) ? (
                      <>
                        <UserMinus className="h-4 w-4 mr-2" />
                        Unfollow
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Follow
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Navigation Tabs */}
          <Tabs
            value={activeTab}
            onValueChange={(value) => {
              setActiveTab(value);
            }}
            className="w-full"
          >
            <TabsList className="flex w-auto mx-auto justify-center gap-8 h-8 bg-transparent border-b border-border rounded-none mb-4">
              {profile.visibleSections?.music !== false && (
                <TabsTrigger
                  value="music"
                  className="text-sm py-2 h-8 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-emerald-500 data-[state=active]:text-emerald-400 rounded-none w-fit font-medium"
                >
                  Music
                </TabsTrigger>
              )}
              {profile.visibleSections?.movies !== false && (
                <TabsTrigger
                  value="movie-profile"
                  className="text-sm py-2 h-8 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-emerald-500 data-[state=active]:text-emerald-400 rounded-none w-fit font-medium"
                >
                  Movies
                </TabsTrigger>
              )}
              {profile.visibleSections?.series !== false && (
                <TabsTrigger
                  value="series"
                  className="text-sm py-2 h-8 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-emerald-500 data-[state=active]:text-emerald-400 rounded-none w-fit font-medium"
                >
                  TV Shows
                </TabsTrigger>
              )}
              {profile.visibleSections?.books !== false && (
                <TabsTrigger
                  value="books"
                  className="text-sm py-2 h-8 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-emerald-500 data-[state=active]:text-emerald-400 rounded-none w-fit font-medium"
                >
                  Books
                </TabsTrigger>
              )}
            </TabsList>

            {/* Music Tab */}
            {profile.visibleSections?.music !== false && (
              <TabsContent value="music" className="mt-6">
                <ProfileMusicSection userId={profile.uid} readOnly={true} />
              </TabsContent>
            )}

            {/* Movies Tab */}
            {profile.visibleSections?.movies !== false && (
              <TabsContent value="movie-profile" className="mt-6">
                <ProfileMovieSection userId={profile.uid} readOnly={true} />
              </TabsContent>
            )}

            {/* Series Tab */}
            {profile.visibleSections?.series !== false && (
              <TabsContent value="series" className="mt-6">
                <ProfileSeriesSection userId={profile.uid} readOnly={true} />
              </TabsContent>
            )}

            {/* Books Tab */}
            {profile.visibleSections?.books !== false && (
              <TabsContent value="books" className="mt-6">
                <ProfileBooksSection userId={profile.uid} readOnly={true} />
              </TabsContent>
            )}
          </Tabs>
        </div>
      </div>
    </ErrorBoundary>
  );
}
