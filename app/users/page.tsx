"use client";

import { useState, useEffect, Suspense } from "react";

// Force dynamic rendering to prevent prerendering issues
export const dynamic = 'force-dynamic';
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { User, Search, UserPlus, UserMinus, Users, UserCheck, X } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useUserConnections } from "@/hooks/use-user-connections";
import { useFollowUser } from "@/hooks/use-follow-user";
import { useToast } from "@/hooks/use-toast";

interface UserProfile {
  uid: string;
  displayName: string;
  username?: string;
  bio?: string;
  avatarUrl?: string;
  joinDate?: string;
  isPublic?: boolean;
  followers?: string[];
  following?: string[];
}

function UsersPageContent() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFollowing, setShowFollowing] = useState(true);
  const [showFollowers, setShowFollowers] = useState(false);
  
  const { user: currentUser } = useCurrentUser();
  const { followers, following } = useUserConnections();
  const { followUser, unfollowUser, isFollowing, loading: followLoading } = useFollowUser();
  const { toast } = useToast();
  const searchParams = useSearchParams();

  // Handle URL parameters for opening specific sections
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'following') {
      setShowFollowing(true);
      setShowFollowers(false);
    } else if (tab === 'followers') {
      setShowFollowing(false);
      setShowFollowers(true);
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchUsers = async () => {
      if (!searchQuery.trim()) {
        setUsers([]);
        return;
      }

      setLoading(true);
      try {
        // Fetch user profiles
        const profilesRef = collection(db, "userProfiles");
        const q = query(
          profilesRef,
          orderBy("joinDate", "desc"),
          limit(50)
        );
        const querySnapshot = await getDocs(q);
        
        // Also fetch users collection for follower/following data
        const usersRef = collection(db, "users");
        const usersSnapshot = await getDocs(usersRef);
        const usersData: { [key: string]: any } = {};
        usersSnapshot.forEach((doc) => {
          usersData[doc.id] = doc.data();
        });
        
        const usersList: UserProfile[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.isPublic !== false) { // Only show public profiles
            const userData = usersData[doc.id] || {};
            usersList.push({
              uid: doc.id,
              displayName: data.displayName,
              username: data.username,
              bio: data.bio,
              avatarUrl: data.avatarUrl,
              joinDate: data.joinDate,
              isPublic: data.isPublic,
              followers: userData.followers || [],
              following: userData.following || [],
            });
          }
        });
        
        setUsers(usersList);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [searchQuery]);

  const filteredUsers = users.filter(user =>
    user.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.username && user.username.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleFollowToggle = async (targetUser: UserProfile) => {
    if (!currentUser) {
      toast({
        title: "Authentication Required",
        description: "Please log in to follow users.",
        variant: "destructive",
      });
      return;
    }

    if (targetUser.uid === currentUser.uid) {
      toast({
        title: "Cannot Follow Yourself",
        description: "You cannot follow yourself.",
        variant: "destructive",
      });
      return;
    }

    const currentlyFollowing = isFollowing(targetUser.uid, following.map(f => f.uid));
    
    try {
      let result;
      if (currentlyFollowing) {
        result = await unfollowUser(targetUser.uid);
        if (result.success) {
          toast({
            title: "Unfollowed",
            description: `You have unfollowed ${targetUser.displayName}.`,
          });
        }
      } else {
        result = await followUser(targetUser.uid);
        if (result.success) {
          toast({
            title: "Following",
            description: `You are now following ${targetUser.displayName}.`,
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
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-20 pb-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-4">Discover Users</h1>
            <p className="text-gray-400 mb-6">Find and connect with other reviewers</p>
          </div>
          
          <div className="max-w-md mx-auto mb-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
              />
            </div>
          </div>
          
          <div className="flex items-center justify-center py-12">
        <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto mb-4"></div>
              <p className="text-gray-400">Searching users...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-20 pb-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-4">Discover Users</h1>
          <p className="text-gray-400 mb-6">Find and connect with other reviewers</p>
          
          {/* Following/Followers Stats */}
          {currentUser && (
            <div className="flex justify-center gap-8 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{following.length}</div>
                <div className="text-sm text-gray-400">Following</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{followers.length}</div>
                <div className="text-sm text-gray-400">Followers</div>
              </div>
            </div>
          )}
        </div>

        {/* Search Bar */}
        <div className="max-w-md mx-auto mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (e.target.value.trim()) {
                  setShowFollowing(false);
                  setShowFollowers(false);
                } else {
                  setShowFollowing(true);
                  setShowFollowers(false);
                }
              }}
              className="pl-10 bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setShowFollowing(true);
                  setShowFollowers(false);
                }}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Following/Followers Toggle */}
        {currentUser && (
          <div className="flex justify-center gap-4 mb-8">
            <button
              onClick={() => {
                setShowFollowing(!showFollowing);
                setShowFollowers(false);
              }}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl transition-all duration-300 font-medium text-sm flex-shrink-0 ${
                showFollowing
                  ? "bg-gradient-to-r from-gray-800 to-gray-700 text-white shadow-lg border border-gray-600"
                  : "hover:bg-gray-800/50 text-gray-300 hover:text-white"
              }`}
            >
              <Users className="h-4 w-4" />
              Following ({following.length})
            </button>
            <button
              onClick={() => {
                setShowFollowers(!showFollowers);
                setShowFollowing(false);
              }}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl transition-all duration-300 font-medium text-sm flex-shrink-0 ${
                showFollowers
                  ? "bg-gradient-to-r from-gray-800 to-gray-700 text-white shadow-lg border border-gray-600"
                  : "hover:bg-gray-800/50 text-gray-300 hover:text-white"
              }`}
            >
              <UserCheck className="h-4 w-4" />
              Followers ({followers.length})
            </button>
          </div>
        )}

        {/* Following List */}
        {showFollowing && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4 text-center">People You Follow</h2>
            {following.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {following.map((user) => (
                  <Card key={user.uid} className="bg-gray-800 border-gray-700 hover:border-gray-600 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3 mb-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage 
                            src={user.avatarUrl || ''} 
                            alt={user.fullName || 'User'} 
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                            }}
                          />
                          <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-blue-500 text-white">
                            <User className="h-5 w-5" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-white truncate">
                            {user.fullName || 'Unknown User'}
                          </h3>
                          {user.username && (
                            <p className="text-xs text-gray-400">@{user.username}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleFollowToggle({ uid: user.uid, displayName: user.fullName || 'User' })}
                          disabled={followLoading}
                          size="sm"
                          className="flex-1 bg-gray-600/20 hover:bg-gray-600/30 border border-gray-500/50 text-gray-300 hover:text-gray-200 transition-all duration-200 rounded-lg font-medium h-8"
                        >
                          {followLoading ? (
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-300"></div>
                          ) : (
                            <>
                              <UserMinus className="h-3 w-3 mr-1.5" />
                              Unfollow
                            </>
                          )}
                        </Button>
                        
                        <Link href={user.username ? `/user/${user.username}` : `/users/${user.uid}`}>
                          <Button 
                            size="sm"
                            className="flex-1 bg-gray-600/20 hover:bg-gray-600/30 border border-gray-500/50 text-gray-300 hover:text-gray-200 transition-all duration-200 rounded-lg font-medium h-8"
                          >
                            <UserCheck className="h-3 w-3 mr-1.5" />
                            View
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">You're not following anyone yet.</p>
                <p className="text-sm text-gray-500 mt-2">Use the search bar to find people to follow!</p>
              </div>
            )}
          </div>
        )}

        {/* Followers List */}
        {showFollowers && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4 text-center">Your Followers</h2>
            {followers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {followers.map((user) => {
                  const isCurrentlyFollowing = isFollowing(user.uid, following.map(f => f.uid));
                  
                  return (
                    <Card key={user.uid} className="bg-gray-800 border-gray-700 hover:border-gray-600 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3 mb-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage 
                              src={user.avatarUrl || ''} 
                              alt={user.fullName || 'User'} 
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                              }}
                            />
                            <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-blue-500 text-white">
                              <User className="h-5 w-5" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-semibold text-white truncate">
                              {user.fullName || 'Unknown User'}
                            </h3>
                            {user.username && (
                              <p className="text-xs text-gray-400">@{user.username}</p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleFollowToggle({ uid: user.uid, displayName: user.fullName || 'User' })}
                            disabled={followLoading}
                            size="sm"
                            className="flex-1 bg-gray-600/20 hover:bg-gray-600/30 border border-gray-500/50 text-gray-300 hover:text-gray-200 transition-all duration-200 rounded-lg font-medium h-8"
                          >
                            {followLoading ? (
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-300"></div>
                            ) : isCurrentlyFollowing ? (
                              <>
                                <UserMinus className="h-3 w-3 mr-1.5" />
                                Unfollow
                              </>
                            ) : (
                              <>
                                <UserPlus className="h-3 w-3 mr-1.5" />
                                Follow
                              </>
                            )}
                          </Button>
                          
                          <Link href={user.username ? `/user/${user.username}` : `/users/${user.uid}`}>
                            <Button 
                              size="sm"
                              className="flex-1 bg-gray-600/20 hover:bg-gray-600/30 border border-gray-500/50 text-gray-300 hover:text-gray-200 transition-all duration-200 rounded-lg font-medium h-8"
                            >
                              <UserCheck className="h-3 w-3 mr-1.5" />
                              View
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <UserCheck className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No followers yet.</p>
                <p className="text-sm text-gray-500 mt-2">Start sharing reviews to get followers!</p>
              </div>
            )}
          </div>
        )}

        {/* Search Results */}
        {searchQuery && !showFollowing && !showFollowers && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4 text-center">
              Search Results for "{searchQuery}"
            </h2>
            {filteredUsers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredUsers.map((user) => {
                  const isCurrentlyFollowing = currentUser ? isFollowing(user.uid, following.map(f => f.uid)) : false;
                  const isOwnProfile = currentUser && user.uid === currentUser.uid;
                  
                  return (
            <Card key={user.uid} className="bg-gray-800 border-gray-700 hover:border-gray-600 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-12 w-12">
                            <AvatarImage 
                              src={user.avatarUrl || ''} 
                              alt={user.displayName || 'User'} 
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                              }}
                            />
                    <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-blue-500 text-white">
                      <User className="h-6 w-6" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-white truncate">
                              {user.displayName || 'Unknown User'}
                    </h3>
                    {user.username && (
                      <p className="text-sm text-gray-400">@{user.username}</p>
                    )}
                  </div>
                </div>
                        
                        {/* Follower Count */}
                        <div className="mt-3 text-center">
                          <div className="text-sm text-gray-400">
                            {user.followers?.length || 0} followers
                          </div>
                        </div>
                        
                        <div className="mt-4 space-y-4">
                          {/* Follow/Unfollow Button */}
                          {!isOwnProfile && currentUser && (
                            <Button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleFollowToggle(user);
                              }}
                              disabled={followLoading}
                              className="w-full bg-gray-600/20 hover:bg-gray-600/30 border border-gray-500/50 text-gray-300 hover:text-gray-200 transition-all duration-200 rounded-lg font-medium"
                            >
                              {followLoading ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-300"></div>
                              ) : isCurrentlyFollowing ? (
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
                          )}
                          
                          {/* View Profile Button */}
                          <Link href={user.username ? `/user/${user.username}` : `/users/${user.uid}`}>
                            <Button 
                              className="w-full bg-gray-600/20 hover:bg-gray-600/30 border border-gray-500/50 text-gray-300 hover:text-gray-200 transition-all duration-200 rounded-lg font-medium"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <UserCheck className="h-4 w-4 mr-2" />
                        View Profile
                            </Button>
                    </Link>
                </div>
              </CardContent>
            </Card>
                  );
                })}
        </div>
            ) : (
          <div className="text-center py-12">
            <p className="text-gray-400">No users found matching your search.</p>
          </div>
        )}
          </div>
        )}

      </div>
    </div>
  );
}

export default function UsersPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-20 pb-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-4">Discover Users</h1>
            <p className="text-gray-400 mb-6">Find and connect with other reviewers</p>
          </div>
          
          <div className="max-w-md mx-auto mb-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search users..."
                className="pl-10 bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
                disabled
              />
            </div>
          </div>
          
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto mb-4"></div>
              <p className="text-gray-400">Loading...</p>
            </div>
          </div>
        </div>
      </div>
    }>
      <UsersPageContent />
    </Suspense>
  );
}
