"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  query,
  where,
  addDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useUserConnections } from "@/hooks/use-user-connections";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  User,
  Users,
  Loader2,
  UserPlus,
  UserCheck,
  ArrowRight,
  Sparkles,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Filter,
  MapPin,
  Calendar,
} from "lucide-react";
import Link from "next/link";

interface UserData {
  uid: string;
  email: string;
  username: string;
  fullName: string;
  followers?: string[];
  following?: string[];
  createdAt?: any;
  bio?: string;
  avatarUrl?: string;
  tagline?: string;
}

export default function UsersPage() {
  const router = useRouter();
  const { user: currentUser, loading: currentUserLoading } = useCurrentUser();
  const {
    followers,
    following,
    loading: connectionsLoading,
  } = useUserConnections();
  const [searchResults, setSearchResults] = useState<UserData[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [followingStates, setFollowingStates] = useState<
    Record<string, boolean>
  >({});
  const [hasSearched, setHasSearched] = useState(false);
  const [activeTab, setActiveTab] = useState("discover");

  // Debounced search function
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        performSearch(searchQuery.trim());
      } else if (searchQuery.trim().length === 0 && hasSearched) {
        setSearchResults([]);
        setHasSearched(false);
      }
    }, 300); // 300ms delay

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Initialize following states for followers and following
  useEffect(() => {
    if (followers.length > 0 || following.length > 0) {
      const followingStatesMap: Record<string, boolean> = {};

      // Initialize states for followers
      followers.forEach((user) => {
        followingStatesMap[user.uid] = following.some(
          (followingUser) => followingUser.uid === user.uid
        );
      });

      // Initialize states for following (these should all be true)
      following.forEach((user) => {
        followingStatesMap[user.uid] = true;
      });

      setFollowingStates((prev) => ({ ...prev, ...followingStatesMap }));
    }
  }, [followers, following]);

  // Perform fuzzy search
  const performSearch = async (query: string) => {
    if (!query.trim() || query.trim().length < 2) return;

    setSearching(true);
    setHasSearched(true);

    try {
      // Get all users and filter client-side for fuzzy search
      const usersRef = collection(db, "users");
      const usersSnapshot = await getDocs(usersRef);
      const allUsers: UserData[] = [];

      usersSnapshot.forEach((doc) => {
        const userData = doc.data() as UserData;
        // Filter out current user
        if (userData.uid !== currentUser?.uid) {
          allUsers.push({
            ...userData,
            followers: userData.followers || [],
            following: userData.following || [],
          });
        }
      });

      // Fuzzy search implementation
      const searchTerm = query.toLowerCase();
      const filteredUsers = allUsers.filter((user) => {
        const fullName = user.fullName?.toLowerCase() || "";
        const username = user.username?.toLowerCase() || "";

        // Check if search term appears in any of these fields
        return fullName.includes(searchTerm) || username.includes(searchTerm);
      });

      setSearchResults(filteredUsers);

      // Initialize following states for search results
      const followingStatesMap: Record<string, boolean> = {};
      filteredUsers.forEach((user) => {
        followingStatesMap[user.uid] = currentUser
          ? (user.followers || []).includes(currentUser.uid)
          : false;
      });
      setFollowingStates((prev) => ({ ...prev, ...followingStatesMap }));
    } catch (error) {
      console.error("Error searching users:", error);
    } finally {
      setSearching(false);
    }
  };

  // Create notification when user follows someone
  const createFollowNotification = async (targetUser: UserData) => {
    try {
      const notificationData = {
        type: "follow",
        message: "started following you",
        fromUserId: currentUser!.uid,
        toUserId: targetUser.uid,
        fromUserName:
          currentUser!.displayName ||
          currentUser!.email?.split("@")[0] ||
          "Anonymous",
        fromUserAvatar: currentUser!.photoURL || "",
        actionUrl: `/users/${currentUser!.uid}`,
        isRead: false,
        createdAt: new Date().toISOString(),
      };

      await addDoc(collection(db, "notifications"), notificationData);
    } catch (error) {
      console.error("Error creating follow notification:", error);
    }
  };

  // Handle follow/unfollow
  const handleFollowToggle = async (targetUserId: string) => {
    if (!currentUser) return;

    try {
      const isFollowing = followingStates[targetUserId];
      const targetUser =
        searchResults.find((user) => user.uid === targetUserId) ||
        followers.find((user) => user.uid === targetUserId) ||
        following.find((user) => user.uid === targetUserId);

      if (!targetUser) return;

      // Update target user's followers in users
      const targetUserRef = doc(db, "users", targetUserId);
      await updateDoc(targetUserRef, {
        followers: isFollowing
          ? arrayRemove(currentUser.uid)
          : arrayUnion(currentUser.uid),
      });

      // Update current user's following in users
      const currentUserRef = doc(db, "users", currentUser.uid);
      await updateDoc(currentUserRef, {
        following: isFollowing
          ? arrayRemove(targetUserId)
          : arrayUnion(targetUserId),
      });

      // Create notification when following (not when unfollowing)
      if (!isFollowing) {
        await createFollowNotification(targetUser);
      }

      // Update local state
      setFollowingStates((prev) => ({
        ...prev,
        [targetUserId]: !isFollowing,
      }));

      // Update search results
      setSearchResults((prev) =>
        prev.map((user) => {
          if (user.uid === targetUserId) {
            return {
              ...user,
              followers: isFollowing
                ? (user.followers || []).filter((id) => id !== currentUser.uid)
                : [...(user.followers || []), currentUser.uid],
            };
          }
          return user;
        })
      );
    } catch (error) {
      console.error("Error updating follow status:", error);
    }
  };

  if (currentUserLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Enhanced Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
              People
            </h1>
            <p className="text-muted-foreground text-sm">
              Discover, connect, and manage your network on Reliva
            </p>
          </div>
        </div>
      </div>

      {/* Enhanced Tabs - Positioned at extreme left */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="flex justify-start w-full mb-8 bg-muted/50 p-3 rounded-xl ml-0">
          <TabsTrigger
            value="discover"
            className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-xl transition-all duration-200 px-6 py-3"
          >
            <Sparkles className="h-5 w-5 mr-2" />
            Discover
          </TabsTrigger>
          <TabsTrigger
            value="following"
            className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-xl transition-all duration-200 px-6 py-3"
          >
            <UserCheck className="h-5 w-5 mr-2" />
            Following ({following.length})
          </TabsTrigger>
          <TabsTrigger
            value="followers"
            className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-xl transition-all duration-200 px-6 py-3"
          >
            <Users className="h-5 w-5 mr-2" />
            Followers ({followers.length})
          </TabsTrigger>
        </TabsList>

        {/* Enhanced Discover Tab */}
        <TabsContent value="discover" className="space-y-8">
          {/* Enhanced Search Input */}
          <div className="relative">
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="text"
                placeholder="Search people by name or username..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-12 h-12 rounded-xl border-2 focus:border-primary/50 transition-all duration-200 bg-background/50 backdrop-blur-sm shadow-sm"
              />
              {searching && (
                <Loader2 className="absolute right-4 top-1/2 transform -translate-y-1/2 animate-spin h-4 w-4 text-primary" />
              )}
            </div>
            {searchQuery.length > 0 && searchQuery.length < 2 && (
              <p className="text-sm text-muted-foreground mt-2 text-center">
                Enter at least 2 characters to search
              </p>
            )}
          </div>

          {/* Search Results */}
          {searchResults.length === 0 ? (
            <div className="text-center py-16">
              <div className="relative">
                <Search className="h-20 w-20 text-muted-foreground/30 mx-auto mb-6" />
              </div>
              <h3 className="text-xl font-semibold mb-3">
                {searching ? "Searching..." : ""}
              </h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                {searching
                  ? "Looking for users that match your search..."
                  : "Find friends to see their favorites and get their recommendations"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  Search Results ({searchResults.length})
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {searchResults.map((user) => (
                  <Card
                    key={user.uid}
                    className="border-0 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <Avatar
                          className="h-16 w-16 cursor-pointer ring-2 ring-primary/20"
                          onClick={() => router.push(`/users/${user.uid}`)}
                        >
                          <AvatarImage
                            src={user.avatarUrl || ""}
                            alt={user.fullName || user.username}
                          />
                          <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold">
                            {(user.fullName || user.username)
                              .charAt(0)
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1 min-w-0">
                              <h3
                                className="font-semibold text-base truncate cursor-pointer"
                                onClick={() =>
                                  router.push(`/users/${user.uid}`)
                                }
                              >
                                {user.fullName || "No name"}
                              </h3>
                              <p className="text-sm text-muted-foreground truncate">
                                @{user.username}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="opacity-0"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </div>

                          {user.tagline && (
                            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                              {user.tagline}
                            </p>
                          )}

                          <div className="flex items-center gap-4 mb-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Heart className="h-3 w-3" />
                              {(user.followers || []).length} followers
                            </span>
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {(user.following || []).length} following
                            </span>
                          </div>

                          <Button
                            variant={
                              followingStates[user.uid] ? "outline" : "default"
                            }
                            size="sm"
                            onClick={() => handleFollowToggle(user.uid)}
                            disabled={!currentUser}
                            className="w-full h-9 rounded-lg transition-all duration-200"
                          >
                            {followingStates[user.uid] ? (
                              <>
                                <UserCheck className="h-4 w-4 mr-2" />
                                Following
                              </>
                            ) : (
                              <>
                                <UserPlus className="h-4 w-4 mr-2" />
                                Follow
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* Enhanced Following Tab */}
        <TabsContent value="following" className="space-y-6">
          {connectionsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading following...</p>
              </div>
            </div>
          ) : following.length === 0 ? (
            <div className="text-center py-16">
              <div className="relative mb-6">
                <UserPlus className="h-20 w-20 text-muted-foreground/30 mx-auto" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Heart className="h-8 w-8 text-muted-foreground/50" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-3">
                Not following anyone yet
              </h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Start following people to see their reviews in your feed and get
                personalized recommendations
              </p>
              <Button
                onClick={() => setActiveTab("discover")}
                className="rounded-lg"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Friends
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {following.map((user) => (
                <Card
                  key={user.uid}
                  className="border-0 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <Avatar
                        className="h-16 w-16 cursor-pointer hover:opacity-80 transition-opacity ring-2 ring-primary/20 group-hover:ring-primary/40"
                        onClick={() => router.push(`/users/${user.uid}`)}
                      >
                        <AvatarImage
                          src={user.avatarUrl || ""}
                          alt={user.fullName || user.username}
                        />
                        <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold">
                          {(user.fullName || user.username)
                            .charAt(0)
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-base truncate">
                              {user.fullName || "No name"}
                            </h3>
                            <p className="text-sm text-muted-foreground truncate">
                              @{user.username}
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-2 mt-4">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 h-9 rounded-lg transition-all duration-200"
                            asChild
                          >
                            <Link href={`/users/${user.uid}`}>
                              <UserCheck className="h-4 w-4 mr-2" />
                              View Profile
                            </Link>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleFollowToggle(user.uid)}
                            disabled={!currentUser}
                            className="flex-1 h-9 rounded-lg transition-all duration-200"
                          >
                            <UserCheck className="h-4 w-4 mr-2" />
                            Following
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Enhanced Followers Tab */}
        <TabsContent value="followers" className="space-y-6">
          {connectionsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading followers...</p>
              </div>
            </div>
          ) : followers.length === 0 ? (
            <div className="text-center py-16">
              <div className="relative mb-6">
                <Users className="h-20 w-20 text-muted-foreground/30 mx-auto" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Heart className="h-8 w-8 text-muted-foreground/50" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-3">No followers yet</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Start sharing reviews and engaging with the community to attract
                followers
              </p>
              <Button asChild className="rounded-lg">
                <Link href="/reviews">
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Write a Review
                </Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {followers.map((user) => (
                <Card
                  key={user.uid}
                  className="border-0 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <Avatar
                        className="h-16 w-16 cursor-pointer hover:opacity-80 transition-opacity ring-2 ring-primary/20 group-hover:ring-primary/40"
                        onClick={() => router.push(`/users/${user.uid}`)}
                      >
                        <AvatarImage
                          src={user.avatarUrl || ""}
                          alt={user.fullName || user.username}
                        />
                        <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold">
                          {(user.fullName || user.username)
                            .charAt(0)
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-base truncate">
                              {user.fullName || "No name"}
                            </h3>
                            <p className="text-sm text-muted-foreground truncate">
                              @{user.username}
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-2 mt-4">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 h-9 rounded-lg transition-all duration-200"
                            asChild
                          >
                            <Link href={`/users/${user.uid}`}>
                              <UserCheck className="h-4 w-4 mr-2" />
                              View Profile
                            </Link>
                          </Button>
                          <Button
                            variant={
                              followingStates[user.uid] ? "outline" : "default"
                            }
                            size="sm"
                            onClick={() => handleFollowToggle(user.uid)}
                            disabled={!currentUser}
                            className="flex-1 h-9 rounded-lg transition-all duration-200"
                          >
                            {followingStates[user.uid] ? (
                              <>
                                <UserCheck className="h-4 w-4 mr-2" />
                                Following
                              </>
                            ) : (
                              <>
                                <UserPlus className="h-4 w-4 mr-2" />
                                Follow Back
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
