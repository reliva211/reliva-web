"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useCurrentUser } from "@/hooks/use-current-user";

interface UserConnection {
  uid: string;
  email: string;
  username: string;
  fullName: string;
  avatarUrl?: string;
}

export function useUserConnections() {
  const { user } = useCurrentUser();
  const [followers, setFollowers] = useState<UserConnection[]>([]);
  const [following, setFollowing] = useState<UserConnection[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setFollowers([]);
      setFollowing([]);
      return;
    }

    const fetchUserConnections = async () => {
      setLoading(true);
      setError(null);

      try {
        console.log("Fetching user connections for:", user.uid);
        
        // Get current user's data
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) {
          console.log("User document does not exist");
          setFollowers([]);
          setFollowing([]);
          return;
        }

        const userData = userSnap.data();
        const followersList = userData.followers || [];
        const followingList = userData.following || [];
        
        console.log("Followers list:", followersList);
        console.log("Following list:", followingList);

        // Get all users to fetch details
        const usersRef = collection(db, "users");
        const usersSnapshot = await getDocs(usersRef);
        
        const allUsers: { [key: string]: UserConnection } = {};
        usersSnapshot.forEach((doc) => {
          const data = doc.data();
          allUsers[doc.id] = {
            uid: doc.id,
            email: data.email || "",
            username: data.username || "",
            fullName: data.fullName || "",
            avatarUrl: data.avatarUrl || ""
          };
        });

        // Filter followers and following
        const followersData = followersList
          .map((uid: string) => allUsers[uid])
          .filter(Boolean);
        
        const followingData = followingList
          .map((uid: string) => allUsers[uid])
          .filter(Boolean);

        console.log("Followers data:", followersData.length);
        console.log("Following data:", followingData.length);
        
        setFollowers(followersData);
        setFollowing(followingData);

      } catch (err) {
        console.error("Error fetching user connections:", err);
        
        if (err instanceof Error) {
          if (err.message.includes("permission")) {
            setError("Permission denied. Please check your account.");
          } else if (err.message.includes("network")) {
            setError("Network error. Please check your connection.");
          } else {
            setError(`Failed to load connections: ${err.message}`);
          }
        } else {
          setError("Failed to load user connections");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserConnections();
  }, [user]);

  return { followers, following, loading, error };
} 