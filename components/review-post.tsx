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
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center text-white font-semibold text-sm sm:text-base flex-shrink-0 shadow-lg">
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
          <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors flex-shrink-0">
            <MoreHorizontal className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>
      </div>

      {/* Media Info */}
      <div className="p-4 sm:p-5 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-start space-x-3 sm:space-x-4">
          <div className="relative w-16 h-24 sm:w-20 sm:h-28 rounded-xl overflow-hidden flex-shrink-0 shadow-md">
            <Image
              src={review.mediaCover || "/placeholder.svg"}
              alt={review.mediaTitle}
              fill
              className="object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-gray-900 dark:text-white text-sm sm:text-base line-clamp-2 mb-2">
              {review.mediaTitle}
            </h4>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3">
              <span className="inline-block px-2 py-1 text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full border border-emerald-200 dark:border-emerald-800">
                {review.mediaType.toUpperCase()}
              </span>
              <div className="flex items-center space-x-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-3 w-3 sm:h-4 sm:w-4 ${
                      i < review.rating
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300 dark:text-gray-600"
                    }`}
                  />
                ))}
                <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 ml-1 font-medium">
                  {review.rating}/5
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Review Text */}
      <div className="p-4 sm:p-5">
        <p className="text-gray-800 dark:text-gray-200 leading-relaxed text-sm sm:text-base line-clamp-4">
          {review.reviewText}
        </p>
      </div>

      {/* Actions */}
      <div className="px-4 sm:px-5 py-3 sm:py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <button
              onClick={handleLike}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 text-sm font-medium ${
                isLiked
                  ? "text-red-500 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
            >
              <Heart className={`h-4 w-4 sm:h-5 sm:w-5 ${isLiked ? "fill-current" : ""}`} />
              <span className="font-medium">{likeCount}</span>
            </button>
            
            <button className="flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-200 transition-all duration-200 text-sm font-medium">
              <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="font-medium">0</span>
            </button>
          </div>
          
          <button className="flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-200 transition-all duration-200 text-sm font-medium">
            <Share2 className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="font-medium hidden sm:inline">Share</span>
          </button>
        </div>
      </div>
    </div>
  );
} 