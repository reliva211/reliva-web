"use client";

import { useState, useEffect } from "react";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useCloudinaryUpload } from "./use-cloudinary-upload";

export interface UserProfile {
  uid: string;
  displayName: string;
  username: string;
  bio: string;
  website: string;
  avatarUrl: string;
  coverImageUrl: string;
  joinDate: string;
  socialLinks: {
    twitter?: string;
    instagram?: string;
    linkedin?: string;
    github?: string;
  };
  visibleSections: {
    music: boolean;
    movies: boolean;
    series: boolean;
    books: boolean;
  };
}

export function useProfile(userId: string | undefined) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const { uploadImage: uploadToCloudinary } = useCloudinaryUpload();

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        const docRef = doc(db, "userProfiles", userId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setProfile(docSnap.data() as UserProfile);
        } else {
          // Create default profile
          const defaultProfile: UserProfile = {
            uid: userId,
            displayName: "New User",
            username: `user_${userId.slice(0, 8)}`,
            bio: "Tell us about yourself...",
            location: "",
            website: "",
            tagline: "Music • Movies • Books",
            avatarUrl: "",
            coverImageUrl: "",
            joinDate: new Date().toISOString(),
            isPublic: true,
            socialLinks: {},
            visibleSections: {
              music: true,
              movies: true,
              series: true,
              books: true,
            },
          };
          await setDoc(docRef, defaultProfile);
          setProfile(defaultProfile);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId]);

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!userId || !profile) return;

    setSaving(true);
    try {
      const docRef = doc(db, "userProfiles", userId);
      await updateDoc(docRef, updates);

      // Update local state immediately
      const updatedProfile = { ...profile, ...updates };
      setProfile(updatedProfile);

      // Force a re-render by incrementing refresh key
      setRefreshKey((prev) => prev + 1);

      console.log("Profile updated successfully:", updates);
    } catch (error) {
      console.error("Error updating profile:", error);
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const uploadImage = async (
    file: File,
    type: "avatar" | "cover"
  ): Promise<string> => {
    if (!userId) throw new Error("No user ID");

    console.log(
      "Uploading image to Cloudinary:",
      file.name,
      "Type:",
      type,
      "Size:",
      file.size
    );

    try {
      // Upload to Cloudinary with automatic optimization
      const folder = `reliva-profiles/${userId}`;
      const imageUrl = await uploadToCloudinary(file, folder);

      console.log("Image uploaded to Cloudinary:", imageUrl);

      // Update profile with new image URL
      const updateField = type === "avatar" ? "avatarUrl" : "coverImageUrl";

      // Update local state immediately before Firestore update
      console.log("Updating local state immediately with:", imageUrl);
      if (profile) {
        const updatedProfile = { ...profile, [updateField]: imageUrl };
        setProfile(updatedProfile);
        setRefreshKey((prev) => {
          const newKey = prev + 1;
          console.log("Refresh key updated to:", newKey);
          return newKey;
        });
      }

      // Dispatch custom event for immediate updates
      const event = new CustomEvent("avatarUpdated", {
        detail: {
          userId,
          imageUrl,
          type,
          timestamp: Date.now(),
        },
      });
      window.dispatchEvent(event);

      // Then update Firestore
      await updateProfile({ [updateField]: imageUrl });
      console.log("Profile updated with new image URL");

      // Force another update after Firestore
      setRefreshKey((prev) => {
        const newKey = prev + 1;
        console.log("Final refresh key update to:", newKey);
        return newKey;
      });

      return imageUrl;
    } catch (error) {
      console.error("Error uploading image to Cloudinary:", error);

      // Provide specific error messages
      if (error instanceof Error) {
        if (error.message.includes("File size must be less than 10MB")) {
          throw new Error(
            "File size must be less than 10MB for Cloudinary free tier"
          );
        } else if (error.message.includes("Please select an image file")) {
          throw new Error("Please select a valid image file");
        } else if (error.message.includes("upload_preset")) {
          throw new Error(
            "Cloudinary upload preset not configured. Please check your environment variables."
          );
        }
      }

      throw error;
    }
  };

  return {
    profile,
    loading,
    saving,
    updateProfile,
    uploadImage,
    refreshKey,
  };
}
