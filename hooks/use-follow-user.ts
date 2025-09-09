"use client";

import { useState } from "react";
import { useCurrentUser } from "./use-current-user";

interface FollowUserResult {
  success: boolean;
  message?: string;
  error?: string;
  following?: string[];
  followers?: string[];
}

export function useFollowUser() {
  const { user } = useCurrentUser();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const followUser = async (targetUserId: string): Promise<FollowUserResult> => {
    if (!user?.uid) {
      return { success: false, error: "User not authenticated" };
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/users/follow", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentUserId: user.uid,
          targetUserId,
          action: "follow",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to follow user");
      }

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to follow user";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const unfollowUser = async (targetUserId: string): Promise<FollowUserResult> => {
    if (!user?.uid) {
      return { success: false, error: "User not authenticated" };
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/users/follow", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentUserId: user.uid,
          targetUserId,
          action: "unfollow",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to unfollow user");
      }

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to unfollow user";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const isFollowing = (targetUserId: string, followingList: string[]): boolean => {
    return followingList.includes(targetUserId);
  };

  return {
    followUser,
    unfollowUser,
    isFollowing,
    loading,
    error,
  };
}
