"use client";

import { useState, useEffect } from "react";
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  updateDoc,
  deleteDoc,
  addDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useCurrentUser } from "@/hooks/use-current-user";

export interface UserRating {
  id: string;
  userId: string;
  mediaId: string | number;
  mediaType: "movie" | "series";
  mediaTitle: string;
  mediaCover?: string;
  rating: number; // 1-5 stars
  createdAt: string;
  updatedAt: string;
}

export function useRatings() {
  const [userRatings, setUserRatings] = useState<{ [key: string]: UserRating }>(
    {}
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { user } = useCurrentUser();

  // Check if Firebase and user are available
  const isAvailable = () => {
    return user?.uid && db;
  };

  // Fetch user's ratings
  const fetchUserRatings = async () => {
    if (!isAvailable()) {
      setLoading(false);
      return;
    }

    try {
      const q = query(
        collection(db!, "userRatings"),
        where("userId", "==", user!.uid)
      );
      const snapshot = await getDocs(q);
      const ratings: { [key: string]: UserRating } = {};

      snapshot.forEach((doc) => {
        const data = doc.data() as UserRating;
        const key = `${data.mediaType}-${data.mediaId}`;
        ratings[key] = { ...data, id: doc.id };
      });

      setUserRatings(ratings);
    } catch (error) {
      console.error("Error fetching user ratings:", error);
    } finally {
      setLoading(false);
    }
  };

  // Get rating for a specific media item
  const getUserRating = (
    mediaId: string | number,
    mediaType: "movie" | "series"
  ): number => {
    const key = `${mediaType}-${mediaId}`;
    return userRatings[key]?.rating || 0;
  };

  // Set rating for a media item
  const setRating = async (
    mediaId: string | number,
    mediaType: "movie" | "series",
    mediaTitle: string,
    rating: number,
    mediaCover?: string
  ) => {
    if (!isAvailable()) {
      console.error("Firebase or user not available");
      return;
    }

    setSaving(true);
    try {
      const key = `${mediaType}-${mediaId}`;
      const existingRating = userRatings[key];

      const ratingData: Omit<UserRating, "id"> = {
        userId: user!.uid,
        mediaId,
        mediaType,
        mediaTitle,
        mediaCover,
        rating,
        createdAt: existingRating?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (existingRating) {
        // Update existing rating
        await updateDoc(doc(db!, "userRatings", existingRating.id), {
          rating,
          updatedAt: new Date().toISOString(),
        });
        setUserRatings((prev) => ({
          ...prev,
          [key]: { ...prev[key], rating, updatedAt: new Date().toISOString() },
        }));
      } else {
        // Create new rating
        const docRef = await addDoc(collection(db!, "userRatings"), ratingData);
        setUserRatings((prev) => ({
          ...prev,
          [key]: { ...ratingData, id: docRef.id },
        }));
      }
    } catch (error) {
      console.error("Error setting rating:", error);
      throw error; // Re-throw so the component can handle it
    } finally {
      setSaving(false);
    }
  };

  // Remove rating for a media item
  const removeRating = async (
    mediaId: string | number,
    mediaType: "movie" | "series"
  ) => {
    if (!user?.uid) return;

    setSaving(true);
    try {
      const key = `${mediaType}-${mediaId}`;
      const existingRating = userRatings[key];

      if (existingRating) {
        await deleteDoc(doc(db, "userRatings", existingRating.id));
        setUserRatings((prev) => {
          const newRatings = { ...prev };
          delete newRatings[key];
          return newRatings;
        });
      }
    } catch (error) {
      console.error("Error removing rating:", error);
    } finally {
      setSaving(false);
    }
  };

  // Get average rating for a media item (from all users)
  const getAverageRating = async (
    mediaId: string | number,
    mediaType: "movie" | "series"
  ): Promise<number> => {
    try {
      const q = query(
        collection(db, "userRatings"),
        where("mediaId", "==", mediaId.toString()),
        where("mediaType", "==", mediaType)
      );
      const snapshot = await getDocs(q);

      if (snapshot.empty) return 0;

      let totalRating = 0;
      let count = 0;

      snapshot.forEach((doc) => {
        const data = doc.data() as UserRating;
        totalRating += data.rating;
        count++;
      });

      return count > 0 ? Math.round((totalRating / count) * 10) / 10 : 0;
    } catch (error) {
      console.error("Error getting average rating:", error);
      return 0;
    }
  };

  useEffect(() => {
    fetchUserRatings();
  }, [user?.uid]);

  return {
    userRatings,
    loading,
    saving,
    getUserRating,
    setRating,
    removeRating,
    getAverageRating,
    fetchUserRatings,
  };
}
