"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getUsernameFromAuthorId, getUsernameFromFirebaseUID } from "@/lib/username-utils";

interface ProfileLinkProps {
  authorId?: string;
  firebaseUID?: string;
  displayName?: string;
  username?: string;
  className?: string;
  children: React.ReactNode;
}

export function ProfileLink({ 
  authorId, 
  firebaseUID, 
  displayName, 
  username, 
  className = "",
  children 
}: ProfileLinkProps) {
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
        } else if (firebaseUID) {
          // Try to get username from Firebase UID
          foundUsername = await getUsernameFromFirebaseUID(firebaseUID);
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

    fetchProfileUrl();
  }, [authorId, firebaseUID, username]);

  const handleClick = () => {
    if (profileUrl && !loading) {
      router.push(profileUrl);
    } else if (!loading && !profileUrl) {
      // If no username found, show a message or do nothing
      console.log("No username found for this user");
    }
  };

  return (
    <span
      className={`cursor-pointer hover:text-blue-300 transition-colors ${className}`}
      onClick={handleClick}
    >
      {children}
    </span>
  );
}
