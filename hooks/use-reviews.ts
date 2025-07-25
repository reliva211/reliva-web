"use client";

import { useState, useEffect } from "react";
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  limit,
  arrayUnion,
  arrayRemove,
  increment,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useCurrentUser } from "@/hooks/use-current-user";
import type { Review, CreateReviewData, ReviewFilters } from "@/types/review";

export function useReviews(userId?: string) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const currentUser = useCurrentUser();

  // Fetch reviews for a specific user or all public reviews
  const fetchReviews = async (filters?: ReviewFilters) => {
    setLoading(true);
    try {
      let q = collection(db, "reviews");

      // Add filters
      const queryConstraints = [];

      if (userId) {
        queryConstraints.push(where("userId", "==", userId));
      } else {
        queryConstraints.push(where("isPublic", "==", true));
      }

      if (filters?.mediaType) {
        queryConstraints.push(where("mediaType", "==", filters.mediaType));
      }

      if (filters?.rating) {
        queryConstraints.push(where("rating", "==", filters.rating));
      }

      // Add sorting
      switch (filters?.sortBy) {
        case "newest":
          queryConstraints.push(orderBy("createdAt", "desc"));
          break;
        case "oldest":
          queryConstraints.push(orderBy("createdAt", "asc"));
          break;
        case "highest_rated":
          queryConstraints.push(orderBy("rating", "desc"));
          break;
        case "lowest_rated":
          queryConstraints.push(orderBy("rating", "asc"));
          break;
        case "most_helpful":
          queryConstraints.push(orderBy("helpfulVotes", "desc"));
          break;
        default:
          queryConstraints.push(orderBy("createdAt", "desc"));
      }

      q = query(q, ...queryConstraints);

      const snapshot = await getDocs(q);
      const reviewsData: Review[] = [];

      snapshot.forEach((doc) => {
        reviewsData.push({ id: doc.id, ...doc.data() } as Review);
      });

      // Filter by search query if provided
      let filteredReviews = reviewsData;
      if (filters?.searchQuery) {
        const searchLower = filters.searchQuery.toLowerCase();
        filteredReviews = reviewsData.filter(
          (review) =>
            review.title.toLowerCase().includes(searchLower) ||
            review.content.toLowerCase().includes(searchLower) ||
            review.mediaTitle.toLowerCase().includes(searchLower)
        );
      }

      setReviews(filteredReviews);
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  // Create a new review
  const createReview = async (
    reviewData: CreateReviewData
  ): Promise<string | null> => {
    if (!currentUser) return null;

    setSaving(true);
    try {
      const review: Omit<Review, "id"> = {
        ...reviewData,
        userId: currentUser.uid,
        userName: currentUser.displayName || "Anonymous",
        userAvatar: currentUser.photoURL || "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        likes: 0,
        likedBy: [],
        helpfulVotes: 0,
        votedHelpfulBy: [],
      };

      const docRef = await addDoc(collection(db, "reviews"), review);
      const newReview = { id: docRef.id, ...review };
      setReviews((prev) => [newReview, ...prev]);

      return docRef.id;
    } catch (error) {
      console.error("Error creating review:", error);
      throw error;
    } finally {
      setSaving(false);
    }
  };

  // Update an existing review
  const updateReview = async (reviewId: string, updates: Partial<Review>) => {
    if (!currentUser) return;

    setSaving(true);
    try {
      const reviewRef = doc(db, "reviews", reviewId);
      const updateData = {
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      await updateDoc(reviewRef, updateData);
      setReviews((prev) =>
        prev.map((review) =>
          review.id === reviewId ? { ...review, ...updateData } : review
        )
      );
    } catch (error) {
      console.error("Error updating review:", error);
      throw error;
    } finally {
      setSaving(false);
    }
  };

  // Delete a review
  const deleteReview = async (reviewId: string) => {
    if (!currentUser) return;

    setSaving(true);
    try {
      await deleteDoc(doc(db, "reviews", reviewId));
      setReviews((prev) => prev.filter((review) => review.id !== reviewId));
    } catch (error) {
      console.error("Error deleting review:", error);
      throw error;
    } finally {
      setSaving(false);
    }
  };

  // Toggle like on a review
  const toggleLike = async (reviewId: string) => {
    if (!currentUser) return;

    try {
      const review = reviews.find((r) => r.id === reviewId);
      if (!review) return;

      const isLiked = review.likedBy.includes(currentUser.uid);
      const reviewRef = doc(db, "reviews", reviewId);

      if (isLiked) {
        await updateDoc(reviewRef, {
          likedBy: arrayRemove(currentUser.uid),
          likes: increment(-1),
        });
      } else {
        await updateDoc(reviewRef, {
          likedBy: arrayUnion(currentUser.uid),
          likes: increment(1),
        });
      }

      setReviews((prev) =>
        prev.map((r) =>
          r.id === reviewId
            ? {
                ...r,
                likedBy: isLiked
                  ? r.likedBy.filter((uid) => uid !== currentUser.uid)
                  : [...r.likedBy, currentUser.uid],
                likes: isLiked ? r.likes - 1 : r.likes + 1,
              }
            : r
        )
      );
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  // Toggle helpful vote on a review
  const toggleHelpful = async (reviewId: string) => {
    if (!currentUser) return;

    try {
      const review = reviews.find((r) => r.id === reviewId);
      if (!review) return;

      const isVoted = review.votedHelpfulBy.includes(currentUser.uid);
      const reviewRef = doc(db, "reviews", reviewId);

      if (isVoted) {
        await updateDoc(reviewRef, {
          votedHelpfulBy: arrayRemove(currentUser.uid),
          helpfulVotes: increment(-1),
        });
      } else {
        await updateDoc(reviewRef, {
          votedHelpfulBy: arrayUnion(currentUser.uid),
          helpfulVotes: increment(1),
        });
      }

      setReviews((prev) =>
        prev.map((r) =>
          r.id === reviewId
            ? {
                ...r,
                votedHelpfulBy: isVoted
                  ? r.votedHelpfulBy.filter((uid) => uid !== currentUser.uid)
                  : [...r.votedHelpfulBy, currentUser.uid],
                helpfulVotes: isVoted ? r.helpfulVotes - 1 : r.helpfulVotes + 1,
              }
            : r
        )
      );
    } catch (error) {
      console.error("Error toggling helpful vote:", error);
    }
  };

  // Get reviews for a specific media item
  const getMediaReviews = async (
    mediaId: string | number,
    mediaType: string
  ) => {
    try {
      const q = query(
        collection(db, "reviews"),
        where("mediaId", "==", mediaId.toString()),
        where("mediaType", "==", mediaType),
        where("isPublic", "==", true),
        orderBy("helpfulVotes", "desc"),
        limit(10)
      );

      const snapshot = await getDocs(q);
      const mediaReviews: Review[] = [];

      snapshot.forEach((doc) => {
        mediaReviews.push({ id: doc.id, ...doc.data() } as Review);
      });

      return mediaReviews;
    } catch (error) {
      console.error("Error fetching media reviews:", error);
      return [];
    }
  };

  // Check if user has already reviewed a media item
  const hasUserReviewed = async (
    mediaId: string | number,
    mediaType: string
  ): Promise<Review | null> => {
    if (!currentUser) return null;

    try {
      const q = query(
        collection(db, "reviews"),
        where("userId", "==", currentUser.uid),
        where("mediaId", "==", mediaId.toString()),
        where("mediaType", "==", mediaType)
      );

      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        return { id: doc.id, ...doc.data() } as Review;
      }

      return null;
    } catch (error) {
      console.error("Error checking user review:", error);
      return null;
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [userId]);

  return {
    reviews,
    loading,
    saving,
    fetchReviews,
    createReview,
    updateReview,
    deleteReview,
    toggleLike,
    toggleHelpful,
    getMediaReviews,
    hasUserReviewed,
  };
}
