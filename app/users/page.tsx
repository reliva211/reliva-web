"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { User, Search } from "lucide-react";
import Link from "next/link";

interface UserProfile {
  uid: string;
  displayName: string;
  username?: string;
  bio?: string;
  avatarUrl?: string;
  joinDate?: string;
  isPublic?: boolean;
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const profilesRef = collection(db, "userProfiles");
        const q = query(
          profilesRef,
          orderBy("joinDate", "desc"),
          limit(50)
        );
        const querySnapshot = await getDocs(q);
        
        const usersList: UserProfile[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.isPublic !== false) { // Only show public profiles
            usersList.push({
              uid: doc.id,
              displayName: data.displayName,
              username: data.username,
              bio: data.bio,
              avatarUrl: data.avatarUrl,
              joinDate: data.joinDate,
              isPublic: data.isPublic,
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
  }, []);

  const filteredUsers = users.filter(user =>
    user.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.username && user.username.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-20 pb-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-4">Discover Users</h1>
          <p className="text-gray-400">Find and connect with other reviewers</p>
        </div>

        {/* Search Bar */}
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

        {/* Users Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.map((user) => (
            <Card key={user.uid} className="bg-gray-800 border-gray-700 hover:border-gray-600 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={user.avatarUrl} alt={user.displayName} />
                    <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-blue-500 text-white">
                      <User className="h-6 w-6" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-white truncate">
                      {user.displayName}
                    </h3>
                    {user.username && (
                      <p className="text-sm text-gray-400">@{user.username}</p>
                    )}
                    {user.bio && (
                      <p className="text-sm text-gray-300 mt-1 line-clamp-2">
                        {user.bio}
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-4">
                  {user.username ? (
                    <Link href={`/user/${user.username}`}>
                      <button className="w-full bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 text-white py-2 px-4 rounded-lg transition-colors">
                        View Profile
                      </button>
                    </Link>
                  ) : (
                    <Link href={`/users/${user.uid}`}>
                      <button className="w-full bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 text-white py-2 px-4 rounded-lg transition-colors">
                        View Profile
                      </button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400">No users found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  );
}
