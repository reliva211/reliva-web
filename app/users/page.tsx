"use client";

import { useState, useEffect } from "react";
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
import {
  Search,
  User,
  Users,
  Loader2,
  UserPlus,
  UserCheck,
  ArrowRight,
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
}

export default function UsersPage() {
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
      setFollowingStates(followingStatesMap);
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
      const targetUser = searchResults.find(
        (user) => user.uid === targetUserId
      );

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
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">People</h1>
        <p className="text-muted-foreground">
          Discover, connect, and manage your network on Reliva
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="discover">Discover People</TabsTrigger>
          <TabsTrigger value="following">
            Following ({following.length})
          </TabsTrigger>
          <TabsTrigger value="followers">
            Followers ({followers.length})
          </TabsTrigger>
        </TabsList>

        {/* Discover Tab */}
        <TabsContent value="discover" className="space-y-6">
          {/* Search Input */}
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="text"
                placeholder="Search by name or username (min 2 characters)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
              {searching && (
                <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 animate-spin h-4 w-4 text-muted-foreground" />
              )}
            </div>
            {searchQuery.length > 0 && searchQuery.length < 2 && (
              <p className="text-sm text-muted-foreground mt-2">
                Enter at least 2 characters to search
              </p>
            )}
          </div>

          {/* Search Results */}
          {!hasSearched ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Start Searching</h3>
              <p className="text-muted-foreground">
                Enter a name or username to find users
              </p>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="text-center py-12">
              <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {searching ? "Searching..." : "No users found"}
              </h3>
              <p className="text-muted-foreground">
                {searching
                  ? "Looking for users..."
                  : "Try adjusting your search terms"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {searchResults.map((user) => (
                <Card
                  key={user.uid}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center space-x-3">
                      <Avatar
                        className="h-12 w-12 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => router.push(`/users/${user.uid}`)}
                      >
                        <AvatarImage
                          src=""
                          alt={user.fullName || user.username}
                        />
                        <AvatarFallback>
                          <User className="h-6 w-6" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3
                          className="font-semibold text-sm truncate cursor-pointer hover:underline"
                          onClick={() => router.push(`/users/${user.uid}`)}
                        >
                          {user.fullName || "No name"}
                        </h3>
                        <p className="text-xs text-muted-foreground truncate">
                          @{user.username}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {/* Following/Followers Count */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-xs text-muted-foreground">
                        <span className="font-medium">
                          {(user.followers || []).length}
                        </span>{" "}
                        followers
                      </div>
                      <div className="text-xs text-muted-foreground">
                        <span className="font-medium">
                          {(user.following || []).length}
                        </span>{" "}
                        following
                      </div>
                    </div>

                    {/* Follow Button */}
                    <Button
                      variant={
                        followingStates[user.uid] ? "outline" : "default"
                      }
                      size="sm"
                      onClick={() => handleFollowToggle(user.uid)}
                      disabled={!currentUser}
                      className="w-full"
                    >
                      {followingStates[user.uid] ? "Following" : "Follow"}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Following Tab */}
        <TabsContent value="following" className="space-y-6">
          {connectionsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading following...</p>
              </div>
            </div>
          ) : following.length === 0 ? (
            <div className="text-center py-12">
              <UserPlus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Not following anyone yet
              </h3>
              <p className="text-muted-foreground mb-4">
                Start following people to see their reviews in your feed
              </p>
              <Button onClick={() => setActiveTab("discover")}>
                Discover People
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {following.map((user) => (
                <Card
                  key={user.uid}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center space-x-3">
                      <Avatar
                        className="h-12 w-12 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => router.push(`/users/${user.uid}`)}
                      >
                        <AvatarImage
                          src={user.avatarUrl || ""}
                          alt={user.fullName || user.username}
                        />
                        <AvatarFallback>
                          <User className="h-6 w-6" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm truncate">
                          {user.fullName || "No name"}
                        </h3>
                        <p className="text-xs text-muted-foreground truncate">
                          @{user.username}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        asChild
                      >
                        <Link href={`/users/${user.uid}`}>
                          <UserCheck className="h-4 w-4 mr-2" />
                          View Profile
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Followers Tab */}
        <TabsContent value="followers" className="space-y-6">
          {connectionsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading followers...</p>
              </div>
            </div>
          ) : followers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No followers yet</h3>
              <p className="text-muted-foreground mb-4">
                Start sharing reviews to attract followers
              </p>
              <Button asChild>
                <Link href="/reviews">
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Write a Review
                </Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {followers.map((user) => (
                <Card
                  key={user.uid}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage
                          src={user.avatarUrl || ""}
                          alt={user.fullName || user.username}
                        />
                        <AvatarFallback>
                          <User className="h-6 w-6" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm truncate">
                          {user.fullName || "No name"}
                        </h3>
                        <p className="text-xs text-muted-foreground truncate">
                          @{user.username}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        asChild
                      >
                        <Link href={`/users/${user.uid}`}>
                          <UserCheck className="h-4 w-4 mr-2" />
                          View Profile
                        </Link>
                      </Button>
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
