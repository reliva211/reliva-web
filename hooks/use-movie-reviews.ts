"use client";

import { useState, useEffect } from "react";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface MovieReview {
  id: string;
  userId: string;
  userDisplayName: string;
  userPhotoURL?: string;
  mediaId: string;
  mediaTitle: string;
  mediaType: string;
  rating: number;
  reviewText: string;
  timestamp: any;
  likes: string[];
}

export function useMovieReviews(movieId: string | number) {
  const [reviews, setReviews] = useState<MovieReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!movieId) {
      setLoading(false);
      return;
    }

    const fetchMovieReviews = async () => {
      try {
        setLoading(true);
        setError(null);

        // Query reviews collection for this specific movie
        const reviewsRef = collection(db, "reviews");
        
        // Try to query with timestamp ordering first, fallback to no ordering if it fails
        let q;
        try {
          q = query(
            reviewsRef,
            where("mediaId", "==", movieId.toString()),
            where("mediaType", "==", "movie"),
            orderBy("timestamp", "desc")
          );
        } catch (err) {
          // Fallback to query without ordering if timestamp field doesn't exist
          q = query(
            reviewsRef,
            where("mediaId", "==", movieId.toString()),
            where("mediaType", "==", "movie")
          );
        }

        const snapshot = await getDocs(q);
        const reviewsData: MovieReview[] = [];

        snapshot.forEach((doc) => {
          const data = doc.data();
          reviewsData.push({
            id: doc.id,
            ...data
          } as MovieReview);
        });

        setReviews(reviewsData);
      } catch (err) {
        console.error("Error fetching movie reviews:", err);
        setError("Failed to load reviews");
      } finally {
        setLoading(false);
      }
    };

    fetchMovieReviews();
  }, [movieId]);

  return { reviews, loading, error };
}


