"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useProfile } from "@/hooks/use-profile";
import { useCurrentUser } from "@/hooks/use-current-user";
import { getUsernameFromAuthorId } from "@/lib/username-utils";
import Link from "next/link";

interface UserAvatarProps {
  userId?: string;
  username?: string;
  displayName?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  showRing?: boolean;
  clickable?: boolean;
}

export function UserAvatar({
  userId,
  username,
  displayName,
  size = "md",
  className = "",
  showRing = true,
  clickable = true,
}: UserAvatarProps) {
  const { user: currentUser } = useCurrentUser();
  const { profile } = useProfile(userId || currentUser?.uid);

  // Determine if this is the current user
  const isCurrentUser = !userId || userId === currentUser?.uid;

  // Get the appropriate profile picture
  const avatarUrl = isCurrentUser
    ? profile?.avatarUrl || currentUser?.photoURL || ""
    : ""; // For other users, we'll need to pass the avatarUrl as a prop

  // Debug logging
  if (isCurrentUser && process.env.NODE_ENV === "development") {
    console.log("UserAvatar Debug:", {
      userId,
      isCurrentUser,
      profileAvatarUrl: profile?.avatarUrl,
      currentUserPhotoURL: currentUser?.photoURL,
      finalAvatarUrl: avatarUrl,
    });
  }

  // Size classes
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-10 h-10",
    lg: "w-16 h-16",
  };

  // Ring classes
  const ringClasses = showRing ? "ring-1 ring-green-500/20" : "";

  // Get initials for fallback
  const getInitials = () => {
    if (displayName) return displayName.charAt(0).toUpperCase();
    if (username) return username.charAt(0).toUpperCase();
    if (currentUser?.displayName)
      return currentUser.displayName.charAt(0).toUpperCase();
    if (currentUser?.email) return currentUser.email.charAt(0).toUpperCase();
    return "U";
  };

  const avatarElement = (
    <Avatar className={`${sizeClasses[size]} ${ringClasses} ${className}`}>
      <AvatarImage src={avatarUrl} alt={displayName || username || "User"} />
      <AvatarFallback className="bg-gradient-to-br from-green-500 to-emerald-600 text-white font-semibold">
        {getInitials()}
      </AvatarFallback>
    </Avatar>
  );

  // If clickable and we have a userId, wrap in Link
  if (clickable && userId && userId !== currentUser?.uid) {
    return (
      <Link
        href={`/user/${username || userId}`}
        className="hover:opacity-80 transition-opacity"
      >
        {avatarElement}
      </Link>
    );
  }

  return avatarElement;
}

// Component for displaying other users' avatars with their profile data
interface OtherUserAvatarProps {
  authorId?: string;
  username?: string;
  displayName?: string;
  avatarUrl?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  showRing?: boolean;
  clickable?: boolean;
}

export function OtherUserAvatar({
  authorId,
  username,
  displayName,
  avatarUrl,
  size = "md",
  className = "",
  showRing = true,
  clickable = true,
}: OtherUserAvatarProps) {
  const router = useRouter();
  const [profileUrl, setProfileUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfileUrl = async () => {
      setLoading(true);
      
      try {
        let foundUsername: string | null = null;

        // If we already have a username, use it directly
        if (username) {
          foundUsername = username;
        } else if (authorId) {
          // Try to get username from authorId
          foundUsername = await getUsernameFromAuthorId(authorId);
        }

        if (foundUsername) {
          setProfileUrl(`/user/${foundUsername}`);
        } else {
          // No fallback - only use new username format
          setProfileUrl(null);
        }
      } catch (error) {
        console.error("Error fetching profile URL:", error);
        // No fallback - only use new username format
        setProfileUrl(null);
      } finally {
        setLoading(false);
      }
    };

    if (clickable && (authorId || username)) {
      fetchProfileUrl();
    } else {
      setLoading(false);
    }
  }, [authorId, username, clickable]);

  // Size classes
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-10 h-10",
    lg: "w-16 h-16",
  };

  // Ring classes
  const ringClasses = showRing ? "ring-1 ring-green-500/20" : "";

  // Get initials for fallback
  const getInitials = () => {
    if (displayName) return displayName.charAt(0).toUpperCase();
    if (username) return username.charAt(0).toUpperCase();
    return "U";
  };

  const handleClick = () => {
    if (profileUrl && !loading) {
      router.push(profileUrl);
    } else if (!loading && !profileUrl) {
      // If no username found, show a message or do nothing
      console.log("No username found for this user");
    }
  };

  const avatarElement = (
    <Avatar className={`${sizeClasses[size]} ${ringClasses} ${className}`}>
      <AvatarImage
        src={avatarUrl || ""}
        alt={displayName || username || "User"}
      />
      <AvatarFallback className="bg-gradient-to-br from-green-500 to-emerald-600 text-white font-semibold">
        {getInitials()}
      </AvatarFallback>
    </Avatar>
  );

  // If clickable and we have a profile URL, make it clickable
  if (clickable && profileUrl && !loading) {
    return (
      <div
        onClick={handleClick}
        className="cursor-pointer hover:opacity-80 transition-opacity"
      >
        {avatarElement}
      </div>
    );
  }

  return avatarElement;
}
