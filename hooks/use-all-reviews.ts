"use client";

import { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Review {
  id: string;
  userId: string;
  userDisplayName: string;
  userEmail: string;
  mediaId: string;
  mediaTitle: string;
  mediaCover: string;
  mediaType: "movie" | "series" | "book" | "music";
  mediaYear?: number;
  mediaAuthor?: string;
  rating: number;
  reviewText: string;
  timestamp: any;
  likes: string[];
  comments: any[];
}

export function useAllReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Function to update a specific review in the local state
  const updateReview = (reviewId: string, updates: Partial<Review>) => {
    setReviews(prevReviews => 
      prevReviews.map(review => 
        review.id === reviewId 
          ? { ...review, ...updates }
          : review
      )
    );
  };

  useEffect(() => {
    const fetchAllReviews = async () => {
      setLoading(true);
      setError(null);

      try {
        console.log("Fetching all reviews...");
        
        // Get all reviews from the reviews collection
        const reviewsRef = collection(db, "reviews");
        const reviewsSnapshot = await getDocs(reviewsRef);
        
        console.log("Total reviews in collection:", reviewsSnapshot.size);
        
        const allReviews: Review[] = [];
        reviewsSnapshot.forEach((doc) => {
          const data = doc.data();
          allReviews.push({
            id: doc.id,
            ...data
          } as Review);
        });

        // Filter out anonymous reviews
        const validReviews = allReviews.filter(review => {
          return review.userDisplayName && 
            review.userDisplayName !== "Anonymous" && 
            review.userDisplayName.trim() !== "" &&
            review.userDisplayName !== "Unknown";
        });
        
        console.log("Valid reviews (excluding anonymous):", validReviews.length);

        // Sort by timestamp (most recent first)
        validReviews.sort((a, b) => {
          try {
            let aTime, bTime;
            
            if (a.timestamp?.toDate) {
              aTime = a.timestamp.toDate();
            } else if (a.timestamp?.seconds) {
              aTime = new Date(a.timestamp.seconds * 1000);
            } else if (a.timestamp) {
              aTime = new Date(a.timestamp);
            } else {
              aTime = new Date(0);
            }
            
            if (b.timestamp?.toDate) {
              bTime = b.timestamp.toDate();
            } else if (b.timestamp?.seconds) {
              bTime = new Date(b.timestamp.seconds * 1000);
            } else if (b.timestamp) {
              bTime = new Date(b.timestamp);
            } else {
              bTime = new Date(0);
            }
            
            return bTime.getTime() - aTime.getTime();
          } catch (sortError) {
            console.error("Error sorting reviews:", sortError);
            return 0;
          }
        });

        // Limit to 20 most recent reviews
        const finalReviews = validReviews.slice(0, 20);
        console.log("Final reviews count:", finalReviews.length);
        
        setReviews(finalReviews);

      } catch (err) {
        console.error("Error fetching all reviews:", err);
        
        if (err instanceof Error) {
          if (err.message.includes("permission")) {
            setError("Permission denied. Please check your account.");
          } else if (err.message.includes("network")) {
            setError("Network error. Please check your connection.");
          } else {
            setError(`Failed to load reviews: ${err.message}`);
          }
        } else {
          setError("Failed to load reviews");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAllReviews();
  }, []);

  // Function to manually retry
  const retry = () => {
    setError(null);
    const fetchAllReviews = async () => {
      setLoading(true);
      setError(null);

      try {
        console.log("Fetching all reviews...");
        
        // Get all reviews from the reviews collection
        const reviewsRef = collection(db, "reviews");
        const reviewsSnapshot = await getDocs(reviewsRef);
        
        console.log("Total reviews in collection:", reviewsSnapshot.size);
        
        const allReviews: Review[] = [];
        reviewsSnapshot.forEach((doc) => {
          const data = doc.data();
          allReviews.push({
            id: doc.id,
            ...data
          } as Review);
        });

        // Filter out anonymous reviews
        const validReviews = allReviews.filter(review => {
          return review.userDisplayName && 
            review.userDisplayName !== "Anonymous" && 
            review.userDisplayName.trim() !== "" &&
            review.userDisplayName !== "Unknown";
        });
        
        console.log("Valid reviews (excluding anonymous):", validReviews.length);

        // Sort by timestamp (most recent first)
        validReviews.sort((a, b) => {
          try {
            let aTime, bTime;
            
            if (a.timestamp?.toDate) {
              aTime = a.timestamp.toDate();
            } else if (a.timestamp?.seconds) {
              aTime = new Date(a.timestamp.seconds * 1000);
            } else if (a.timestamp) {
              aTime = new Date(a.timestamp);
            } else {
              aTime = new Date(0);
            }
            
            if (b.timestamp?.toDate) {
              bTime = b.timestamp.toDate();
            } else if (b.timestamp?.seconds) {
              bTime = new Date(b.timestamp.seconds * 1000);
            } else if (b.timestamp) {
              bTime = new Date(b.timestamp);
            } else {
              bTime = new Date(0);
            }
            
            return bTime.getTime() - aTime.getTime();
          } catch (sortError) {
            console.error("Error sorting reviews:", sortError);
            return 0;
          }
        });

        // Limit to 20 most recent reviews
        const finalReviews = validReviews.slice(0, 20);
        console.log("Final reviews count:", finalReviews.length);
        
        setReviews(finalReviews);

      } catch (err) {
        console.error("Error fetching all reviews:", err);
        
        if (err instanceof Error) {
          if (err.message.includes("permission")) {
            setError("Permission denied. Please check your account.");
          } else if (err.message.includes("network")) {
            setError("Network error. Please check your connection.");
          } else {
            setError(`Failed to load reviews: ${err.message}`);
          }
        } else {
          setError("Failed to load reviews");
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchAllReviews();
  };

  return { reviews, loading, error, retry, updateReview };
}
