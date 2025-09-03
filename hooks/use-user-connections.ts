"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, doc, getDoc, onSnapshot } from "firebase/firestore";
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
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Set up real-time listener for user connections
    const userRef = doc(db, "users", user.uid);
    const unsubscribe = onSnapshot(
      userRef,
      async (userSnap) => {
        try {
          if (!userSnap.exists()) {
            // User document does not exist
            setFollowers([]);
            setFollowing([]);
            setLoading(false);
            return;
          }

          const userData = userSnap.data();
          const followersList = userData.followers || [];
          const followingList = userData.following || [];

          console.log("User connections updated:", { followersList, followingList });

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
              avatarUrl: data.avatarUrl || "",
            };
          });

          // Filter followers and following
          const followersData = followersList
            .map((uid: string) => allUsers[uid])
            .filter(Boolean);

          const followingData = followingList
            .map((uid: string) => allUsers[uid])
            .filter(Boolean);

          console.log("Processed connections:", { followersData, followingData });

          setFollowers(followersData);
          setFollowing(followingData);
          setError(null);
        } catch (err) {
          console.error("Error processing user connections:", err);
          setError("Failed to process user connections");
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        console.error("Error listening to user connections:", err);
        setError("Failed to load user connections");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  return { followers, following, loading, error };
}
