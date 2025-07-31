"use client";

import React, { useState, useEffect } from "react";
import { UserPlus, UserMinus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  getDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useToast } from "@/hooks/use-toast";

interface FollowButtonProps {
  targetUserId: string;
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "default" | "lg";
  className?: string;
}

const FollowButton: React.FC<FollowButtonProps> = ({
  targetUserId,
  variant = "default",
  size = "sm",
  className = "",
}) => {
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const { user: currentUser } = useCurrentUser();
  const { toast } = useToast();

  useEffect(() => {
    if (currentUser && targetUserId !== currentUser.uid) {
      checkFollowStatus();
    } else {
      setCheckingStatus(false);
    }
  }, [currentUser, targetUserId]);

  const checkFollowStatus = async () => {
    if (!currentUser) return;

    try {
      const userDoc = await getDoc(doc(db, "users", currentUser.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const following = userData.following || [];
        setIsFollowing(following.includes(targetUserId));
      }
    } catch (error) {
      console.error("Error checking follow status:", error);
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleFollowToggle = async () => {
    if (!currentUser || targetUserId === currentUser.uid) return;

    setIsLoading(true);

    try {
      const currentUserRef = doc(db, "users", currentUser.uid);
      const targetUserRef = doc(db, "users", targetUserId);

      if (isFollowing) {
        // Unfollow
        await Promise.all([
          updateDoc(currentUserRef, {
            following: arrayRemove(targetUserId),
          }),
          updateDoc(targetUserRef, {
            followers: arrayRemove(currentUser.uid),
          }),
        ]);
        
        setIsFollowing(false);
        toast({
          title: "Unfollowed",
          description: "You are no longer following this user.",
        });
      } else {
        // Follow
        await Promise.all([
          updateDoc(currentUserRef, {
            following: arrayUnion(targetUserId),
          }),
          updateDoc(targetUserRef, {
            followers: arrayUnion(currentUser.uid),
          }),
        ]);
        
        setIsFollowing(true);
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
      setIsLoading(false);
    }
  };

  // Don't show button for own profile or when checking status
  if (!currentUser || targetUserId === currentUser.uid || checkingStatus) {
    return null;
  }

  return (
    <Button
      onClick={handleFollowToggle}
      variant={isFollowing ? "outline" : variant}
      size={size}
      disabled={isLoading}
      className={`min-w-[100px] ${className}`}
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
  );
};

export default FollowButton;
