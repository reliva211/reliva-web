"use client";

import React from "react";
import { formatDistanceToNow } from "date-fns";
import { Heart, MessageCircle, Star } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  type: "review" | "rating";
  createdAt: any;
  mediaTitle?: string;
  mediaType?: string;
  rating?: number;
  likes?: string[];
  commentsCount?: number;
}

interface FeedPostProps {
  post: Post;
  onLike?: (postId: string) => void;
  onComment?: (postId: string) => void;
  currentUserId?: string;
}

const FeedPost: React.FC<FeedPostProps> = ({
  post,
  onLike,
  onComment,
  currentUserId,
}) => {
  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return "Unknown time";
    
    let date: Date;
    if (timestamp.toDate) {
      date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else {
      date = new Date(timestamp);
    }
    
    return formatDistanceToNow(date, { addSuffix: true });
  };

  const renderRatingStars = (rating: number) => {
    return [...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating
            ? "fill-yellow-400 text-yellow-400"
            : "text-gray-300 dark:text-gray-600"
        }`}
      />
    ));
  };

  const isLiked = currentUserId && post.likes?.includes(currentUserId);
  const likesCount = post.likes?.length || 0;

  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Avatar className="h-10 w-10">
            <AvatarImage src={post.authorAvatar} alt={post.authorName} />
            <AvatarFallback>{getUserInitials(post.authorName)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h3 className="font-semibold text-sm">{post.authorName}</h3>
            <p className="text-xs text-muted-foreground">
              {formatTimestamp(post.createdAt)}
            </p>
          </div>
          <Badge variant={post.type === "review" ? "default" : "secondary"}>
            {post.type === "review" ? "Review" : "Rating"}
          </Badge>
        </div>

        {post.mediaTitle && (
          <div className="mb-3">
            <p className="text-sm font-medium text-muted-foreground">
              {post.mediaType && (
                <span className="capitalize">{post.mediaType}: </span>
              )}
              <span className="text-foreground">{post.mediaTitle}</span>
            </p>
          </div>
        )}

        {post.type === "rating" && post.rating && (
          <div className="flex items-center space-x-2 mb-3">
            <div className="flex">
              {renderRatingStars(post.rating)}
            </div>
            <span className="text-sm font-medium">
              {post.rating}/5
            </span>
          </div>
        )}

        <div className="mb-4">
          <p className="text-sm whitespace-pre-wrap">{post.content}</p>
        </div>

        <div className="flex items-center space-x-4 pt-2 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onLike?.(post.id)}
            className={`flex items-center space-x-2 ${
              isLiked ? "text-red-500" : ""
            }`}
          >
            <Heart
              className={`h-4 w-4 ${
                isLiked ? "fill-current" : ""
              }`}
            />
            <span className="text-xs">
              {likesCount > 0 ? likesCount : "Like"}
            </span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onComment?.(post.id)}
            className="flex items-center space-x-2"
          >
            <MessageCircle className="h-4 w-4" />
            <span className="text-xs">
              {post.commentsCount ? `${post.commentsCount} comments` : "Comment"}
            </span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default FeedPost;
export type { Post };
