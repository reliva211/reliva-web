"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Star,
  Heart,
  ArrowLeft,
  Share2,
  Calendar,
  User,
  Clock,
  MessageCircle,
  Send,
} from "lucide-react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { ProfileLink } from "@/components/profile-link";
import {
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  deleteDoc,
  addDoc,
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

// Utility function to decode HTML entities
const decodeHtmlEntities = (text: string): string => {
  const textarea = document.createElement("textarea");
  textarea.innerHTML = text;
  return textarea.value;
};

interface Review {
  id: string;
  userId: string;
  userDisplayName: string;
  userEmail: string;
  userPhotoURL?: string;
  mediaId: string;
  mediaTitle: string;
  mediaCover: string;
  mediaType: "movie" | "series" | "book" | "music";
  mediaSubType?: string;
  mediaYear?: number;
  mediaAuthor?: string;
  mediaDirector?: string;
  mediaGenre?: string;
  mediaDuration?: string;
  mediaPublisher?: string;
  mediaPages?: number;
  mediaArtist?: string;
  mediaAlbum?: string;
  rating: number;
  reviewText: string;
  timestamp: any;
  likes: string[];
  comments: any[];
  tags?: string[];
  spoilerWarning?: boolean;
}

interface Comment {
  id: string;
  reviewId: string;
  userId: string;
  userDisplayName: string;
  userPhotoURL?: string;
  content: string;
  createdAt: any;
}

export default function ReviewDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useCurrentUser();
  const [review, setReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [localLikes, setLocalLikes] = useState<string[]>([]);
  const [isLiking, setIsLiking] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const reviewId = params.id as string;

  useEffect(() => {
    const fetchReview = async () => {
      if (!reviewId) return;

      try {
        setLoading(true);
        const reviewRef = doc(db, "reviews", reviewId);
        const reviewSnap = await getDoc(reviewRef);

        if (!reviewSnap.exists()) {
          setError("Review not found");
          return;
        }

        const reviewData = reviewSnap.data() as Review;
        setReview({ ...reviewData, id: reviewSnap.id });
        setLocalLikes(reviewData.likes || []);
      } catch (err) {
        console.error("Error fetching review:", err);
        setError("Failed to load review");
      } finally {
        setLoading(false);
      }
    };

    fetchReview();
  }, [reviewId]);

  // Fetch comments for this review
  useEffect(() => {
    if (!reviewId) return;

    const q = query(
      collection(db, "comments"),
      where("reviewId", "==", reviewId),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const commentsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Comment[];
      setComments(commentsData);
    });

    return () => unsubscribe();
  }, [reviewId]);

  // Create notification for comment
  const createCommentNotification = async (comment: string) => {
    if (!user || !review || isOwnReview) return; // Don't notify if commenting on own review

    try {
      const notificationData = {
        type: "comment",
        message: `commented on your review of "${decodeHtmlEntities(
          review.mediaTitle
        )}": "${comment.substring(0, 50)}${comment.length > 50 ? "..." : ""}"`,
        fromUserId: user.uid,
        toUserId: review.userId,
        fromUserName:
          user.displayName || user.email?.split("@")[0] || "Anonymous",
        fromUserAvatar: user.photoURL || "",
        actionUrl: `/reviews/${review.id}`,
        isRead: false,
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(
        collection(db, "notifications"),
        notificationData
      );
    } catch (error) {
      console.error("Error creating comment notification:", error);
    }
  };

  // Submit comment
  const handleSubmitComment = async () => {
    if (!user || !review || !newComment.trim() || isSubmittingComment) return;

    setIsSubmittingComment(true);
    try {
      const commentData = {
        reviewId: review.id,
        userId: user.uid,
        userDisplayName:
          user.displayName || user.email?.split("@")[0] || "Anonymous",
        userPhotoURL: user.photoURL || "",
        content: newComment.trim(),
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, "comments"), commentData);

      // Create notification
      await createCommentNotification(newComment.trim());

      setNewComment("");
    } catch (error) {
      console.error("Error adding comment:", error);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const isLiked = user ? localLikes.includes(user.uid) : false;
  const likeCount = localLikes.length;
  const isOwnReview = user && review?.userId === user.uid;

  // Create notification for review like
  const createLikeNotification = async () => {
    if (!user || !review || isOwnReview) return; // Don't notify if liking own review

    try {
      const notificationData = {
        type: "like",
        message: `liked your review of "${decodeHtmlEntities(
          review.mediaTitle
        )}"`,
        fromUserId: user.uid,
        toUserId: review.userId,
        fromUserName:
          user.displayName || user.email?.split("@")[0] || "Anonymous",
        fromUserAvatar: user.photoURL || "",
        actionUrl: `/reviews/${review.id}`,
        isRead: false,
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(
        collection(db, "notifications"),
        notificationData
      );
    } catch (error) {
      console.error("Error creating like notification:", error);
    }
  };

  const handleLike = async () => {
    if (!user || !review || isLiking) return;

    setIsLiking(true);

    // Optimistic update
    const newLikes = isLiked
      ? localLikes.filter((id) => id !== user.uid)
      : [...localLikes, user.uid];

    setLocalLikes(newLikes);

    try {
      const reviewRef = doc(db, "reviews", review.id);
      await updateDoc(reviewRef, {
        likes: isLiked ? arrayRemove(user.uid) : arrayUnion(user.uid),
      });

      // Create notification only when liking (not unliking)
      if (!isLiked) {
        await createLikeNotification();
      }

      // Update local review state
      setReview((prev) => (prev ? { ...prev, likes: newLikes } : null));
    } catch (error) {
      console.error("Error toggling like:", error);
      setLocalLikes(review.likes || []);
    } finally {
      setIsLiking(false);
    }
  };

  const handleDelete = async () => {
    if (!user || !review || !isOwnReview) return;

    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, "reviews", review.id));
      router.push("/reviews");
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
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return date.toLocaleDateString();
  };

  const getMediaTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "movie":
        return "🎬";
      case "series":
        return "📺";
      case "book":
        return "📚";
      case "music":
        return "🎵";
      default:
        return "📖";
    }
  };

  const getMediaTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "movie":
        return "from-blue-500 to-blue-600";
      case "series":
        return "from-purple-500 to-purple-600";
      case "book":
        return "from-emerald-500 to-emerald-600";
      case "music":
        return "from-pink-500 to-pink-600";
      default:
        return "from-gray-500 to-gray-600";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-black dark:to-gray-900">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500 dark:border-emerald-400"></div>
        </div>
      </div>
    );
  }

  if (error || !review) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-black dark:to-gray-900">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              {error || "Review Not Found"}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              The review you're looking for doesn't exist or has been removed.
            </p>
            <Link href="/reviews">
              <Button className="bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 text-white">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-black dark:to-gray-900">
      {/* Header */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/reviews">
              <Button
                variant="ghost"
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>

            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>

              {isOwnReview && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  Delete
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 overflow-hidden">
        <div className="grid lg:grid-cols-3 gap-8 min-w-0">
          {/* Left Column - Media Info */}
          <div className="lg:col-span-1 min-w-0">
            <div className="sticky top-24 overflow-hidden">
              {/* Media Cover */}
              <div className="relative w-full aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl mb-6">
                <Image
                  src={review.mediaCover || "/placeholder.svg"}
                  alt={decodeHtmlEntities(review.mediaTitle)}
                  fill
                  className="object-cover"
                />
                <div className="absolute top-4 right-4">
                  <div
                    className={`px-3 py-1 rounded-full text-white text-sm font-semibold bg-gradient-to-r ${getMediaTypeColor(
                      review.mediaType
                    )}`}
                  >
                    {getMediaTypeIcon(review.mediaType)}{" "}
                    {review.mediaType.toUpperCase()}
                  </div>
                </div>
              </div>

              {/* Media Details */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 line-clamp-3 break-words">
                  {decodeHtmlEntities(review.mediaTitle)}
                </h2>

                {/* Rating */}
                <div className="flex items-center space-x-2 mb-4">
                  <div className="flex items-center space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-5 w-5 ${
                          i < review.rating
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300 dark:text-gray-600"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                    {review.rating}/5
                  </span>
                </div>

                {/* Media Metadata */}
                <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                  {review.mediaYear && (
                    <div className="flex items-start space-x-2 min-w-0">
                      <Calendar className="h-4 w-4 flex-shrink-0 mt-0.5" />
                      <span className="break-words min-w-0">
                        {review.mediaYear}
                      </span>
                    </div>
                  )}

                  {review.mediaAuthor && (
                    <div className="flex items-start space-x-2 min-w-0">
                      <User className="h-4 w-4 flex-shrink-0 mt-0.5" />
                      <span className="break-words min-w-0">
                        {review.mediaAuthor}
                      </span>
                    </div>
                  )}

                  {review.mediaDirector && (
                    <div className="flex items-start space-x-2 min-w-0">
                      <User className="h-4 w-4 flex-shrink-0 mt-0.5" />
                      <span className="break-words min-w-0">
                        Director: {review.mediaDirector}
                      </span>
                    </div>
                  )}

                  {review.mediaArtist && (
                    <div className="flex items-start space-x-2 min-w-0">
                      <User className="h-4 w-4 flex-shrink-0 mt-0.5" />
                      <span className="break-words min-w-0">
                        Artist: {review.mediaArtist}
                      </span>
                    </div>
                  )}

                  {review.mediaAlbum && (
                    <div className="flex items-start space-x-2 min-w-0">
                      <span className="text-lg flex-shrink-0">💿</span>
                      <span className="break-words min-w-0">
                        {review.mediaAlbum}
                      </span>
                    </div>
                  )}

                  {review.mediaGenre && (
                    <div className="flex items-start space-x-2 min-w-0">
                      <span className="text-lg flex-shrink-0">🏷️</span>
                      <span className="break-words min-w-0">
                        {review.mediaGenre}
                      </span>
                    </div>
                  )}

                  {review.mediaDuration && (
                    <div className="flex items-start space-x-2 min-w-0">
                      <Clock className="h-4 w-4 flex-shrink-0 mt-0.5" />
                      <span className="break-words min-w-0">
                        {review.mediaDuration}
                      </span>
                    </div>
                  )}

                  {review.mediaPages && (
                    <div className="flex items-start space-x-2 min-w-0">
                      <span className="text-lg flex-shrink-0">📄</span>
                      <span className="break-words min-w-0">
                        {review.mediaPages} pages
                      </span>
                    </div>
                  )}

                  {review.mediaPublisher && (
                    <div className="flex items-start space-x-2 min-w-0">
                      <span className="text-lg flex-shrink-0">🏢</span>
                      <span className="break-words min-w-0">
                        {review.mediaPublisher}
                      </span>
                    </div>
                  )}
                </div>

                {/* Tags */}
                {review.tags && review.tags.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Tags
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {review.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm rounded-full"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Review Content */}
          <div className="lg:col-span-2 min-w-0 overflow-hidden">
            {/* Author Info */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 mb-6 overflow-hidden">
              <div className="flex items-center space-x-4 min-w-0">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center text-white font-bold text-xl">
                  {review.userDisplayName?.charAt(0) || "U"}
                </div>
                <div className="flex-1 min-w-0">
                  <ProfileLink
                    firebaseUID={review.userId}
                    displayName={review.userDisplayName || "Anonymous"}
                    className="text-xl font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors break-words"
                  >
                    {review.userDisplayName || "Anonymous"}
                  </ProfileLink>
                  <p className="text-gray-600 dark:text-gray-400 break-words">
                    {formatTimestamp(review.timestamp)}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={handleLike}
                    disabled={isLiking}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                      isLiked
                        ? "text-red-500 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                    } ${isLiking ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <Heart
                      className={`h-5 w-5 ${isLiked ? "fill-current" : ""}`}
                    />
                    <span className="font-medium">{likeCount}</span>
                    {isLiking && (
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Review Content */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 mb-6 overflow-hidden">
              {review.spoilerWarning && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">⚠️</span>
                    <span className="text-yellow-800 dark:text-yellow-200 font-semibold">
                      Spoiler Warning
                    </span>
                  </div>
                  <p className="text-yellow-700 dark:text-yellow-300 text-sm mt-2">
                    This review contains spoilers for{" "}
                    {decodeHtmlEntities(review.mediaTitle)}.
                  </p>
                </div>
              )}

              <div className="prose prose-lg dark:prose-invert max-w-none overflow-hidden">
                <p className="text-gray-800 dark:text-gray-200 leading-relaxed text-lg whitespace-pre-wrap break-words">
                  {review.reviewText}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Comments Section */}
      <div className="container mx-auto px-4 pb-8 max-w-7xl overflow-hidden">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="flex items-center gap-2 mb-6">
            <MessageCircle className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Comments ({comments.length})
            </h3>
          </div>

          {/* Add Comment Form */}
          {user && (
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Share your thoughts about this review..."
                className="mb-3 resize-none"
                rows={3}
              />
              <div className="flex justify-end">
                <Button
                  onClick={handleSubmitComment}
                  disabled={!newComment.trim() || isSubmittingComment}
                  className="flex items-center gap-2"
                >
                  <Send className="h-4 w-4" />
                  {isSubmittingComment ? "Posting..." : "Post Comment"}
                </Button>
              </div>
            </div>
          )}

          {/* Comments List */}
          <div className="space-y-4">
            {comments.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No comments yet. Be the first to share your thoughts!</p>
              </div>
            ) : (
              comments.map((comment) => (
                <div
                  key={comment.id}
                  className="flex gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                    {comment.userDisplayName?.charAt(0) || "U"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 mb-1">
                      <span
                        className="font-medium text-gray-900 dark:text-white cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        onClick={() => router.push(`/users/${comment.userId}`)}
                      >
                        {comment.userDisplayName}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {formatTimestamp(comment.createdAt)}
                      </span>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                      {comment.content}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Delete Review
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Are you sure you want to delete your review for "
              {decodeHtmlEntities(review.mediaTitle)}"? This action cannot be
              undone.
            </p>
            <div className="flex gap-3">
              <Button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-800 text-white"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
              <Button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
