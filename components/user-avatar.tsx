"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useProfile } from "@/hooks/use-profile";
import { useCurrentUser } from "@/hooks/use-current-user";
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
        href={`/users/${userId}`}
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

  // If clickable and we have an authorId, wrap in Link
  if (clickable && authorId) {
    return (
      <Link
        href={`/users/${authorId}`}
        className="hover:opacity-80 transition-opacity"
      >
        {avatarElement}
      </Link>
    );
  }

  return avatarElement;
}
