"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useCurrentUser } from "@/hooks/use-current-user";

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

export function useFollowedReviews() {
  const { user } = useCurrentUser();
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
    if (!user) {
      setReviews([]);
      return;
    }

    const fetchFollowedReviews = async () => {
      setLoading(true);
      setError(null);

      try {
        console.log("Fetching followed reviews for user:", user.uid);
        
        // First, get the current user's following list
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) {
          console.log("User document does not exist");
          setReviews([]);
          return;
        }

        const userData = userSnap.data();
        const following = userData.following || [];
        
        // Include current user in the list of users to fetch reviews from
        const usersToFetch = [...following, user.uid];
        
        console.log("Users to fetch reviews from (including self):", usersToFetch);

        if (usersToFetch.length === 0) {
          console.log("No users to fetch reviews from");
          setReviews([]);
          return;
        }

        // Get all reviews and filter client-side (simpler approach)
        console.log("Fetching all reviews...");
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

        // Filter reviews to include those from followed users + current user AND exclude anonymous reviews
        const followedReviews = allReviews.filter(review => {
          // Must be from a user you follow OR from yourself
          const isFromFollowedUser = usersToFetch.includes(review.userId);
          
          // Must not be anonymous (check for valid user display name)
          const isNotAnonymous = review.userDisplayName && 
            review.userDisplayName !== "Anonymous" && 
            review.userDisplayName.trim() !== "" &&
            review.userDisplayName !== "Unknown";
          
          return isFromFollowedUser && isNotAnonymous;
        });
        
        console.log("Reviews from followed users + self (excluding anonymous):", followedReviews.length);

        // Sort by timestamp (most recent first)
        followedReviews.sort((a, b) => {
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
        const finalReviews = followedReviews.slice(0, 20);
        console.log("Final reviews count:", finalReviews.length);
        
        setReviews(finalReviews);

      } catch (err) {
        console.error("Error fetching followed reviews:", err);
        
        if (err instanceof Error) {
          if (err.message.includes("permission")) {
            setError("Permission denied. Please check your account.");
          } else if (err.message.includes("network")) {
            setError("Network error. Please check your connection.");
          } else {
            setError(`Failed to load reviews: ${err.message}`);
          }
        } else {
          setError("Failed to load reviews from followed users");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchFollowedReviews();
  }, [user]);

  // Function to manually retry
  const retry = () => {
    if (user) {
      setError(null);
      const fetchFollowedReviews = async () => {
        setLoading(true);
        setError(null);

        try {
          console.log("Fetching followed reviews for user:", user.uid);
          
          // First, get the current user's following list
          const userRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userRef);
          
          if (!userSnap.exists()) {
            console.log("User document does not exist");
            setReviews([]);
            return;
          }

          const userData = userSnap.data();
          const following = userData.following || [];
          
          // Include current user in the list of users to fetch reviews from
          const usersToFetch = [...following, user.uid];
          
          console.log("Users to fetch reviews from (including self):", usersToFetch);

          if (usersToFetch.length === 0) {
            console.log("No users to fetch reviews from");
            setReviews([]);
            return;
          }

          // Get all reviews and filter client-side (simpler approach)
          console.log("Fetching all reviews...");
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

          // Filter reviews to include those from followed users + current user AND exclude anonymous reviews
          const followedReviews = allReviews.filter(review => {
            // Must be from a user you follow OR from yourself
            const isFromFollowedUser = usersToFetch.includes(review.userId);
            
            // Must not be anonymous (check for valid user display name)
            const isNotAnonymous = review.userDisplayName && 
              review.userDisplayName !== "Anonymous" && 
              review.userDisplayName.trim() !== "" &&
              review.userDisplayName !== "Unknown";
            
            return isFromFollowedUser && isNotAnonymous;
          });
          
          console.log("Reviews from followed users + self (excluding anonymous):", followedReviews.length);

          // Sort by timestamp (most recent first)
          followedReviews.sort((a, b) => {
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
          const finalReviews = followedReviews.slice(0, 20);
          console.log("Final reviews count:", finalReviews.length);
          
          setReviews(finalReviews);

        } catch (err) {
          console.error("Error fetching followed reviews:", err);
          
          if (err instanceof Error) {
            if (err.message.includes("permission")) {
              setError("Permission denied. Please check your account.");
            } else if (err.message.includes("network")) {
              setError("Network error. Please check your connection.");
            } else {
              setError(`Failed to load reviews: ${err.message}`);
            }
          } else {
            setError("Failed to load reviews from followed users");
          }
        } finally {
          setLoading(false);
        }
      };
      
      fetchFollowedReviews();
    }
  };

  return { reviews, loading, error, retry, updateReview };
} 