"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Star, Heart, MoreHorizontal, Trash2 } from "lucide-react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { doc, updateDoc, arrayUnion, arrayRemove, deleteDoc } from "firebase/firestore";
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
    mediaSubType?: string;
    rating: number;
    reviewText: string;
    timestamp: any;
    likes: string[];
  };
  onLikeToggle?: () => void;
  onDelete?: () => void;
}

export default function ReviewPost({ review, onLikeToggle, onDelete }: ReviewPostProps) {
  const { user } = useCurrentUser();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const isLiked = user ? review.likes?.includes(user.uid) : false;
  const likeCount = review.likes?.length || 0;
  const isOwnReview = user && review.userId === user.uid;

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

  const handleDelete = async () => {
    if (!user || !isOwnReview) return;

    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, "reviews", review.id));
      
      if (onDelete) {
        onDelete();
      }
    } catch (error) {
      console.error("Error deleting review:", error);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
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
    <div className="py-6 border-b border-gray-700">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center text-white font-semibold text-sm sm:text-base flex-shrink-0 shadow-lg">
              {review.userDisplayName?.charAt(0) || "U"}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-white text-sm sm:text-base truncate">
                {review.userDisplayName || "Anonymous"}
              </h3>
              <p className="text-xs sm:text-sm text-gray-400">
                {formatTimestamp(review.timestamp)}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {isOwnReview && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="p-2 hover:bg-red-950/20 hover:text-red-400 rounded-full transition-colors flex-shrink-0"
                title="Delete review"
              >
                <Trash2 className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 hover:text-red-400" />
              </button>
            )}
            <button className="p-2 hover:bg-gray-700 rounded-full transition-colors flex-shrink-0">
              <MoreHorizontal className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Media Info */}
      <div className="mb-4">
        <div className="flex items-start space-x-3 sm:space-x-4">
          <div className="relative w-32 h-48 sm:w-40 sm:h-56 rounded-xl overflow-hidden flex-shrink-0 shadow-md">
            <Image
              src={review.mediaCover || "/placeholder.svg"}
              alt={review.mediaTitle}
              fill
              className="object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-white text-sm sm:text-base line-clamp-2 mb-2">
              <Link 
                href={`/reviews/${review.id}`}
                className="hover:text-emerald-400 transition-colors duration-200 cursor-pointer"
              >
                {review.mediaTitle}
              </Link>
            </h4>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3">
              <span className="inline-block px-2 py-1 text-xs font-medium bg-emerald-900/30 text-emerald-400 rounded-full border border-emerald-800">
                {review.mediaType.toUpperCase()}{review.mediaSubType ? ` - ${review.mediaSubType.toUpperCase()}` : ''}
              </span>
              <div className="flex items-center space-x-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-3 w-3 sm:h-4 sm:w-4 ${
                      i < review.rating
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-600"
                    }`}
                  />
                ))}
                <span className="text-xs sm:text-sm text-gray-400 ml-1 font-medium">
                  {review.rating}/5
                </span>
              </div>
            </div>
            {/* Review Text moved here */}
            <p className="text-gray-200 leading-relaxed text-sm sm:text-base line-clamp-4 mt-3">
              {review.reviewText}
            </p>
          </div>
        </div>
      </div>



      {/* Actions */}
      <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <button
              onClick={handleLike}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 text-sm font-medium ${
                isLiked
                  ? "text-red-500 bg-red-950/20 border border-red-800"
                  : "text-gray-400 hover:bg-gray-700 hover:text-gray-200"
              }`}
            >
              <Heart className={`h-4 w-4 sm:h-5 sm:w-5 ${isLiked ? "fill-current" : ""}`} />
              <span className="font-medium">{likeCount}</span>
            </button>
            
            <button className="flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-400 hover:bg-gray-700 hover:text-gray-200 transition-all duration-200 text-sm font-medium border border-gray-600">
              <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span className="font-medium">Add to list</span>
            </button>
          </div>
          

        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-white mb-4">
              Delete Review
            </h3>
            <p className="text-gray-300 mb-6">
              Are you sure you want to delete your review for "{review.mediaTitle}"? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-800 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="flex-1 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 