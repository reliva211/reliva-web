"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Lock, ArrowLeft } from "lucide-react";
import ProfileMusicSection from "@/components/profile-music-section";
import ProfileMovieSection from "@/components/profile-movie-section";
import ProfileSeriesSection from "@/components/profile-series-section";
import ProfileBooksSection from "@/components/profile-books-section";
import ErrorBoundary from "@/components/error-boundary";
import Link from "next/link";

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
                  className="text-xs py-1 h-6 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none w-fit"
                >
                  music
                </TabsTrigger>
              )}
              {profile.visibleSections?.movies !== false && (
                <TabsTrigger
                  value="movie-profile"
                  className="text-xs py-1 h-6 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none w-fit"
                >
                  movies
                </TabsTrigger>
              )}
              {profile.visibleSections?.series !== false && (
                <TabsTrigger
                  value="series"
                  className="text-xs py-1 h-6 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none w-fit"
                >
                  shows
                </TabsTrigger>
              )}
              {profile.visibleSections?.books !== false && (
                <TabsTrigger
                  value="books"
                  className="text-xs py-1 h-6 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none w-fit"
                >
                  books
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
