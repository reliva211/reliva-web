"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  MessageCircle,
  Star,
  ThumbsUp,
  Heart,
  Edit,
  Trash2,
  Plus,
  User,
} from "lucide-react";
import { useCurrentUser } from "@/hooks/use-current-user";

interface ReviewsSectionProps {
  userId?: string;
  mediaType?: "movie" | "series" | "book" | "music";
  className?: string;
}

// Mock reviews data for static display
const mockReviews = [
  {
    id: "1",
    userId: "user1",
    userName: "Movie Enthusiast",
    userAvatar: "/placeholder-user.jpg",
    mediaId: "123",
    mediaType: "movie" as const,
    mediaTitle: "The Matrix",
    mediaCover: "/placeholder.svg",
    mediaYear: 1999,
    title: "A Mind-Bending Masterpiece",
    content:
      "This film completely redefined what was possible in cinema. The visual effects, storytelling, and philosophical depth make it a true classic that stands the test of time.",
    rating: 5,
    tags: ["Sci-Fi", "Action", "Philosophy"],
    spoilerWarning: false,
    isPublic: true,
    createdAt: "2024-01-15T10:30:00Z",
    updatedAt: "2024-01-15T10:30:00Z",
    likes: 42,
    likedBy: [],
    helpfulVotes: 15,
    votedHelpfulBy: [],
  },
  {
    id: "2",
    userId: "user2",
    userName: "Cinema Lover",
    userAvatar: "/placeholder-user.jpg",
    mediaId: "456",
    mediaType: "movie" as const,
    mediaTitle: "Inception",
    mediaCover: "/placeholder.svg",
    mediaYear: 2010,
    title: "Dreams Within Dreams",
    content:
      "Christopher Nolan's masterpiece takes you on a journey through multiple layers of consciousness. The practical effects and intricate plot make this a must-watch.",
    rating: 4,
    tags: ["Thriller", "Sci-Fi", "Mind-bending"],
    spoilerWarning: true,
    isPublic: true,
    createdAt: "2024-01-10T14:20:00Z",
    updatedAt: "2024-01-10T14:20:00Z",
    likes: 28,
    likedBy: [],
    helpfulVotes: 12,
    votedHelpfulBy: [],
  },
  {
    id: "3",
    userId: "user3",
    userName: "Film Critic",
    userAvatar: "/placeholder-user.jpg",
    mediaId: "789",
    mediaType: "movie" as const,
    mediaTitle: "Interstellar",
    mediaCover: "/placeholder.svg",
    mediaYear: 2014,
    title: "A Beautiful Space Odyssey",
    content:
      "Nolan's exploration of love, time, and space is both visually stunning and emotionally powerful. The scientific accuracy combined with human drama creates an unforgettable experience.",
    rating: 5,
    tags: ["Space", "Drama", "Sci-Fi"],
    spoilerWarning: false,
    isPublic: true,
    createdAt: "2024-01-05T09:15:00Z",
    updatedAt: "2024-01-05T09:15:00Z",
    likes: 35,
    likedBy: [],
    helpfulVotes: 18,
    votedHelpfulBy: [],
  },
];

export function ReviewsSection({
  userId,
  mediaType = "movie",
  className = "",
}: ReviewsSectionProps) {
  const { user } = useCurrentUser();
  const [showAllReviews, setShowAllReviews] = useState(false);

  const recentReviews = showAllReviews ? mockReviews : mockReviews.slice(0, 3);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-3 w-3 ${
          i < rating
            ? "fill-yellow-400 text-yellow-400"
            : "text-gray-300 dark:text-gray-600"
        }`}
      />
    ));
  };

  if (mockReviews.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center">
            <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h4 className="text-lg font-medium mb-2">No reviews yet</h4>
            <p className="text-muted-foreground mb-4">
              {userId === user?.uid
                ? "Your reviews will appear here"
                : "No reviews available"}
            </p>
            {userId === user?.uid && (
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Write Your First Review
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {recentReviews.map((review) => (
        <Card key={review.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              {/* User Avatar */}
              <Avatar className="h-10 w-10 flex-shrink-0">
                <AvatarImage src={review.userAvatar} alt={review.userName} />
                <AvatarFallback>
                  <User className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>

              {/* Review Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-medium text-sm">{review.userName}</h4>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(review.createdAt)}
                  </span>
                  {review.spoilerWarning && (
                    <Badge variant="destructive" className="text-xs">
                      Spoiler
                    </Badge>
                  )}
                </div>

                {/* Rating */}
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex items-center gap-1">
                    {getRatingStars(review.rating)}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {review.rating}/5
                  </span>
                </div>

                {/* Review Title */}
                {review.title && (
                  <h5 className="font-medium text-sm mb-1">{review.title}</h5>
                )}

                {/* Review Content */}
                <p className="text-sm text-muted-foreground mb-3 line-clamp-3">
                  {review.content}
                </p>

                {/* Tags */}
                {review.tags && review.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {review.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <button className="flex items-center gap-1 hover:text-primary transition-colors">
                    <ThumbsUp className="h-3 w-3" />
                    <span>{review.helpfulVotes} helpful</span>
                  </button>
                  <button className="flex items-center gap-1 hover:text-primary transition-colors">
                    <Heart className="h-3 w-3" />
                    <span>{review.likes} likes</span>
                  </button>
                  {review.userId === user?.uid && (
                    <>
                      <button className="flex items-center gap-1 hover:text-primary transition-colors">
                        <Edit className="h-3 w-3" />
                        <span>Edit</span>
                      </button>
                      <button className="flex items-center gap-1 hover:text-destructive transition-colors">
                        <Trash2 className="h-3 w-3" />
                        <span>Delete</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Show More/Less Button */}
      {mockReviews.length > 3 && (
        <div className="text-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAllReviews(!showAllReviews)}
          >
            {showAllReviews
              ? "Show Less"
              : `Show All ${mockReviews.length} Reviews`}
          </Button>
        </div>
      )}
    </div>
  );
}

export default ReviewsSection;
