"use client";

import { useState, useEffect } from "react";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";

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
      setProfile({ ...profile, ...updates });
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
      "Uploading image:",
      file.name,
      "Type:",
      type,
      "Size:",
      file.size
    );

    try {
      const fileExtension = file.name.split(".").pop();
      const fileName = `${type}_${Date.now()}.${fileExtension}`;
      const storageRef = ref(storage, `profiles/${userId}/${fileName}`);

      console.log("Storage reference created:", storageRef.fullPath);

      const snapshot = await uploadBytes(storageRef, file);
      console.log("File uploaded successfully:", snapshot.ref.fullPath);

      const downloadURL = await getDownloadURL(snapshot.ref);
      console.log("Download URL obtained:", downloadURL);

      // Update profile with new image URL
      const updateField = type === "avatar" ? "avatarUrl" : "coverImageUrl";
      await updateProfile({ [updateField]: downloadURL });
      console.log("Profile updated with new image URL");

      return downloadURL;
    } catch (error) {
      console.error("Error in uploadImage:", error);
      throw error;
    }
  };

  return {
    profile,
    loading,
    saving,
    updateProfile,
    uploadImage,
  };
}
