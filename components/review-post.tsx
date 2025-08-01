"use client";

import React from "react";
import Image from "next/image";
import { Star, Heart, MessageCircle, Share2, MoreHorizontal } from "lucide-react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { doc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface ReviewPostProps {
  review: {
    id: string;
    userId: string;
    userDisplayName: string;
    userPhotoURL?: string;
    mediaTitle: string;
    mediaType: string;
    mediaCover: string;
    rating: number;
    reviewText: string;
    timestamp: any;
    likes: string[];
  };
  onLikeToggle?: () => void;
}

export default function ReviewPost({ review, onLikeToggle }: ReviewPostProps) {
  const { user } = useCurrentUser();
  const isLiked = user ? review.likes?.includes(user.uid) : false;
  const likeCount = review.likes?.length || 0;

  const handleLike = async () => {
    if (!user) return;

    try {
      const reviewRef = doc(db, "reviews", review.id);
      await updateDoc(reviewRef, {
        likes: isLiked 
          ? arrayRemove(user.uid)
          : arrayUnion(user.uid)
      });
      
      if (onLikeToggle) {
        onLikeToggle();
      }
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return "Just now";
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-shadow">
      {/* Header */}
      <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center text-white font-semibold text-sm sm:text-base flex-shrink-0">
              {review.userDisplayName?.charAt(0) || "U"}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base truncate">
                {review.userDisplayName || "Anonymous"}
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                {formatTimestamp(review.timestamp)}
              </p>
            </div>
          </div>
          <button className="p-1 sm:p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors flex-shrink-0">
            <MoreHorizontal className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 dark:text-gray-400" />
          </button>
        </div>
      </div>

      {/* Media Info */}
      <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <div className="relative w-12 h-18 sm:w-16 sm:h-24 rounded-lg overflow-hidden flex-shrink-0">
            <Image
              src={review.mediaCover || "/placeholder.svg"}
              alt={review.mediaTitle}
              fill
              className="object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base line-clamp-2">
              {review.mediaTitle}
            </h4>
            <div className="flex flex-wrap items-center gap-1 sm:gap-2 mt-1">
              <span className="inline-block px-1.5 py-0.5 sm:px-2 sm:py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                {review.mediaType.toUpperCase()}
              </span>
              <div className="flex items-center space-x-0.5 sm:space-x-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-2.5 w-2.5 sm:h-3 sm:w-3 ${
                      i < review.rating
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300 dark:text-gray-600"
                    }`}
                  />
                ))}
                <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 ml-1">
                  {review.rating}/5
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Review Text */}
      <div className="p-3 sm:p-4">
        <p className="text-gray-800 dark:text-gray-200 leading-relaxed text-sm sm:text-base line-clamp-4">
          {review.reviewText}
        </p>
      </div>

      {/* Actions */}
      <div className="px-3 sm:px-4 py-2 sm:py-3 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 sm:space-x-4">
            <button
              onClick={handleLike}
              className={`flex items-center space-x-1 sm:space-x-2 px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg transition-colors text-xs sm:text-sm ${
                isLiked
                  ? "text-red-500 bg-red-50 dark:bg-red-950/20"
                  : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              <Heart className={`h-3 w-3 sm:h-4 sm:w-4 ${isLiked ? "fill-current" : ""}`} />
              <span className="font-medium">{likeCount}</span>
            </button>
            
            <button className="flex items-center space-x-1 sm:space-x-2 px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-xs sm:text-sm">
              <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="font-medium">0</span>
            </button>
          </div>
          
          <button className="flex items-center space-x-1 sm:space-x-2 px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-xs sm:text-sm">
            <Share2 className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="font-medium hidden sm:inline">Share</span>
          </button>
        </div>
      </div>
    </div>
  );
} 