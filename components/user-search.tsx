"use client";

import React, { useState, useEffect } from "react";
import { Search, UserPlus, UserMinus, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  getDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useToast } from "@/hooks/use-toast";

interface User {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  username?: string;
  bio?: string;
  following?: string[];
  followers?: string[];
}

interface UserCardProps {
  user: User;
  isFollowing: boolean;
  onFollowToggle: (userId: string, isFollowing: boolean) => void;
  isLoading?: boolean;
}

const UserCard: React.FC<UserCardProps> = ({
  user,
  isFollowing,
  onFollowToggle,
  isLoading = false,
}) => {
  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={user.photoURL} alt={user.displayName} />
              <AvatarFallback>{getUserInitials(user.displayName || "U")}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-lg">{user.displayName}</h3>
              {user.username && (
                <p className="text-sm text-muted-foreground">@{user.username}</p>
              )}
              {user.bio && (
                <p className="text-sm text-muted-foreground mt-1">{user.bio}</p>
              )}
              <div className="flex space-x-4 mt-2">
                <Badge variant="secondary">
                  {user.followers?.length || 0} followers
                </Badge>
                <Badge variant="outline">
                  {user.following?.length || 0} following
                </Badge>
              </div>
            </div>
          </div>
          <Button
            onClick={() => onFollowToggle(user.uid, isFollowing)}
            variant={isFollowing ? "outline" : "default"}
            size="sm"
            disabled={isLoading}
            className="min-w-[100px]"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isFollowing ? (
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
      </CardContent>
    </Card>
  );
};

const UserSearch: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [followingUsers, setFollowingUsers] = useState<string[]>([]);
  const [loadingFollows, setLoadingFollows] = useState<Set<string>>(new Set());
  const { user: currentUser } = useCurrentUser();
  const { toast } = useToast();

  useEffect(() => {
    if (currentUser) {
      loadCurrentUserFollowing();
    }
  }, [currentUser]);

  const loadCurrentUserFollowing = async () => {
    if (!currentUser) return;
    
    try {
      const userDoc = await getDoc(doc(db, "users", currentUser.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setFollowingUsers(userData.following || []);
      }
    } catch (error) {
      console.error("Error loading following users:", error);
    }
  };

  const searchUsers = async (term: string) => {
    if (!term.trim() || !currentUser) return;

    setIsSearching(true);
    try {
      const usersRef = collection(db, "users");
      
      // Search by display name (case insensitive)
      const nameQuery = query(
        usersRef,
        where("displayName", ">=", term),
        where("displayName", "<=", term + "\uf8ff")
      );
      
      // Search by username if it exists
      const usernameQuery = query(
        usersRef,
        where("username", ">=", term.toLowerCase()),
        where("username", "<=", term.toLowerCase() + "\uf8ff")
      );

      const [nameResults, usernameResults] = await Promise.all([
        getDocs(nameQuery),
        getDocs(usernameQuery),
      ]);

      const users: User[] = [];
      const userIds = new Set<string>();

      // Combine results and remove duplicates
      [...nameResults.docs, ...usernameResults.docs].forEach((doc) => {
        const userData = doc.data() as User;
        if (userData.uid !== currentUser.uid && !userIds.has(userData.uid)) {
          userIds.add(userData.uid);
          users.push({
            ...userData,
            uid: doc.id,
          });
        }
      });

      setSearchResults(users);
    } catch (error) {
      console.error("Error searching users:", error);
      toast({
        title: "Search Error",
        description: "Failed to search users. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleFollowToggle = async (userId: string, isCurrentlyFollowing: boolean) => {
    if (!currentUser) return;

    setLoadingFollows(prev => new Set(prev).add(userId));

    try {
      const currentUserRef = doc(db, "users", currentUser.uid);
      const targetUserRef = doc(db, "users", userId);

      if (isCurrentlyFollowing) {
        // Unfollow
        await Promise.all([
          updateDoc(currentUserRef, {
            following: arrayRemove(userId),
          }),
          updateDoc(targetUserRef, {
            followers: arrayRemove(currentUser.uid),
          }),
        ]);
        
        setFollowingUsers(prev => prev.filter(id => id !== userId));
        toast({
          title: "Unfollowed",
          description: "You are no longer following this user.",
        });
      } else {
        // Follow
        await Promise.all([
          updateDoc(currentUserRef, {
            following: arrayUnion(userId),
          }),
          updateDoc(targetUserRef, {
            followers: arrayUnion(currentUser.uid),
          }),
        ]);
        
        setFollowingUsers(prev => [...prev, userId]);
        toast({
          title: "Following",
          description: "You are now following this user.",
        });
      }
    } catch (error) {
      console.error("Error toggling follow:", error);
      toast({
        title: "Error",
        description: "Failed to update follow status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingFollows(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchUsers(searchTerm);
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">Search Users</h2>
        <form onSubmit={handleSearch} className="flex space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="text"
              placeholder="Search by name or username..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button type="submit" disabled={isSearching}>
            {isSearching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Search"
            )}
          </Button>
        </form>
      </div>

      <div className="space-y-4">
        {searchResults.length > 0 ? (
          searchResults.map((user) => (
            <UserCard
              key={user.uid}
              user={user}
              isFollowing={followingUsers.includes(user.uid)}
              onFollowToggle={handleFollowToggle}
              isLoading={loadingFollows.has(user.uid)}
            />
          ))
        ) : searchTerm && !isSearching ? (
          <div className="text-center py-8 text-muted-foreground">
            No users found for "{searchTerm}"
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default UserSearch;
export { UserCard };
