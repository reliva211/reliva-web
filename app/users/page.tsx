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
  TrendingUp,
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
  const [suggestedUsers, setSuggestedUsers] = useState<UserData[]>([]);
  const [loadingSuggested, setLoadingSuggested] = useState(false);

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

  // Load suggested users on component mount
  useEffect(() => {
    if (!currentUserLoading && currentUser) {
      loadSuggestedUsers();
    }
  }, [currentUserLoading, currentUser]);

  // Load suggested users (users not followed by current user)
  const loadSuggestedUsers = async () => {
    setLoadingSuggested(true);
    try {
      const usersRef = collection(db, "users");
      const usersSnapshot = await getDocs(usersRef);
      const allUsers: UserData[] = [];

      usersSnapshot.forEach((doc) => {
        const userData = doc.data() as UserData;
        // Filter out current user and users already followed
        if (
          userData.uid !== currentUser?.uid &&
          currentUser?.uid &&
          !(userData.followers || []).includes(currentUser.uid)
        ) {
          allUsers.push({
            ...userData,
            followers: userData.followers || [],
            following: userData.following || [],
          });
        }
      });

      // Sort by follower count and take top 6
      const sortedUsers = allUsers
        .sort((a, b) => (b.followers?.length || 0) - (a.followers?.length || 0))
        .slice(0, 6);

      setSuggestedUsers(sortedUsers);

      // Initialize following states for suggested users
      const followingStatesMap: Record<string, boolean> = {};
      sortedUsers.forEach((user) => {
        followingStatesMap[user.uid] = false;
      });
      setFollowingStates((prev) => ({ ...prev, ...followingStatesMap }));
    } catch (error) {
      console.error("Error loading suggested users:", error);
    } finally {
      setLoadingSuggested(false);
    }
  };

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
        suggestedUsers.find((user) => user.uid === targetUserId);

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

      // Update suggested users
      setSuggestedUsers((prev) =>
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
        <TabsList className="flex justify-start w-full mb-8 bg-muted/50 p-1 rounded-xl ml-0">
          <TabsTrigger
            value="discover"
            className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg transition-all duration-200"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Discover
          </TabsTrigger>
          <TabsTrigger
            value="following"
            className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg transition-all duration-200"
          >
            <UserCheck className="h-4 w-4 mr-2" />
            Following ({following.length})
          </TabsTrigger>
          <TabsTrigger
            value="followers"
            className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg transition-all duration-200"
          >
            <Users className="h-4 w-4 mr-2" />
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

          {/* Search Results or Suggested Users */}
          {!hasSearched ? (
            <div className="space-y-6">
              {/* Suggested Users Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-6">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold">Suggested for you</h2>
                </div>

                {loadingSuggested ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => (
                      <Card
                        key={i}
                        className="border-0 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm"
                      >
                        <CardContent className="p-6">
                          <div className="flex items-start gap-4">
                            <div className="h-16 w-16 bg-muted rounded-full animate-pulse" />
                            <div className="flex-1 space-y-3">
                              <div className="h-4 bg-muted rounded animate-pulse" />
                              <div className="h-3 bg-muted rounded w-2/3 animate-pulse" />
                              <div className="h-3 bg-muted rounded w-1/2 animate-pulse" />
                              <div className="h-9 bg-muted rounded animate-pulse" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : suggestedUsers.length === 0 ? (
            <div className="text-center py-12">
                    <Users className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      No suggestions yet
                    </h3>
              <p className="text-muted-foreground">
                      Start following people to get personalized suggestions
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {suggestedUsers.map((user) => (
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
                                <span className="flex items-center gap-1 bg-muted/50 px-2 py-1 rounded-full">
                                  <Heart className="h-3 w-3 text-primary" />
                                  {(user.followers || []).length} followers
                                </span>
                                <span className="flex items-center gap-1 bg-muted/50 px-2 py-1 rounded-full">
                                  <User className="h-3 w-3 text-primary" />
                                  {(user.following || []).length} following
                                </span>
                              </div>

                              <Button
                                variant={
                                  followingStates[user.uid]
                                    ? "outline"
                                    : "default"
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
                )}
              </div>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="text-center py-16">
              <div className="relative">
                <User className="h-20 w-20 text-muted-foreground/30 mx-auto mb-6" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Search className="h-8 w-8 text-muted-foreground/50" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-3">
                {searching ? "Searching..." : "No users found"}
              </h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                {searching
                  ? "Looking for users that match your search..."
                  : "Try adjusting your search terms or browse our suggested users"}
              </p>
              {!searching && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("");
                    setHasSearched(false);
                  }}
                  className="rounded-lg"
                >
                  <ArrowRight className="h-4 w-4 mr-2 rotate-180" />
                  Back to Suggestions
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  Search Results ({searchResults.length})
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("");
                    setHasSearched(false);
                  }}
                  className="text-muted-foreground"
                >
                  <ArrowRight className="h-4 w-4 mr-2 rotate-180" />
                  Back to Suggestions
                </Button>
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
                          <Badge variant="secondary" className="text-xs">
                            Following
                          </Badge>
                    </div>

                        <div className="flex gap-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                            className="flex-1 h-9 rounded-lg"
                        asChild
                      >
                        <Link href={`/users/${user.uid}`}>
                          <UserCheck className="h-4 w-4 mr-2" />
                          View Profile
                        </Link>
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
                          <Badge variant="outline" className="text-xs">
                            Follower
                          </Badge>
                    </div>

                        <div className="flex gap-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                            className="flex-1 h-9 rounded-lg"
                        asChild
                      >
                        <Link href={`/users/${user.uid}`}>
                          <UserCheck className="h-4 w-4 mr-2" />
                          View Profile
                        </Link>
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
