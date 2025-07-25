export interface Review {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  mediaId: string | number;
  mediaType: "movie" | "book" | "music" | "series";
  mediaTitle: string;
  mediaCover?: string;
  mediaYear?: number;
  mediaArtist?: string; // For music
  mediaAuthor?: string; // For books
  title: string;
  content: string;
  rating: number; // 1-5 stars
  tags?: string[];
  spoilerWarning?: boolean;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  likes: number;
  likedBy: string[];
  helpfulVotes: number;
  votedHelpfulBy: string[];
}

export interface CreateReviewData {
  mediaId: string | number;
  mediaType: "movie" | "book" | "music" | "series";
  mediaTitle: string;
  mediaCover?: string;
  mediaYear?: number;
  mediaArtist?: string;
  mediaAuthor?: string;
  title: string;
  content: string;
  rating: number;
  tags?: string[];
  spoilerWarning?: boolean;
  isPublic: boolean;
}

export interface ReviewFilters {
  mediaType?: "movie" | "book" | "music" | "series";
  rating?: number;
  sortBy?:
    | "newest"
    | "oldest"
    | "highest_rated"
    | "lowest_rated"
    | "most_helpful";
  searchQuery?: string;
}
