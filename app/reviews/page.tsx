"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Heart,
  MessageCircle,
  Repeat2,
  Share,
  Bot,
  User,
  Sparkles,
} from "lucide-react";
import { useRef } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Gamepad2, Book, Play } from "lucide-react";

interface Reply {
  _id: string;
  postId: string;
  parentCommentId?: string | null;
  authorId: Author;
  content: string;
  comments: Reply[];
  timestamp: string;
  likeCount: number;
  isLiked: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Author {
  _id: string;
  username: string;
}
interface Post {
  _id: string;
  content: string;
  authorId: Author;
  authorType: string;

  mediaId: string;
  mediaTitle: string;
  mediaCover: string;
  mediaType: string;
  mediaYear: string;
  mediaAuthor: string | null;
  mediaArtist: string | null;
  mediaSubType: string | null;

  rating: number;

  createdAt: string;
  updatedAt: string;
  timestamp: string;
  likeCount: number;
  isLiked: boolean;
  replyCount: number;
  comments: Reply[];
  __v: number;
}

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080/api";
// Force dynamic rendering to prevent prerender issues
export const dynamic = "force-dynamic";

import {
  Star,
  Search,
  Film,
  Tv,
  BookOpen,
  CheckCircle,
  XCircle,
  Music,
} from "lucide-react";
import Image from "next/image";
import { searchService } from "@/lib/search-service";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { toast } from "@/components/ui/use-toast";

// Component that uses useSearchParams (needs to be wrapped in Suspense)
function ReviewsPageContent() {
  const { user } = useCurrentUser();
  const searchParams = useSearchParams();

  // Define the media type interface
  interface MediaItem {
    id: string;
    title: string;
    cover: string;
    year: number | null;
    type: string;
    author?: string | null;
    artist?: string | null;
    album?: string | null;
    mediaSubType?: string;
    data: any;
  }

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<MediaItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchType, setSearchType] = useState("movie"); // movie, series, book, music
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [replyInputs, setReplyInputs] = useState<{ [key: string]: string }>({});
  const [showReplyInput, setShowReplyInput] = useState<{
    [key: string]: boolean;
  }>({});
  const [isReplying, setIsReplying] = useState<{ [key: string]: boolean }>({});
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [likedReplies, setLikedReplies] = useState<Set<string>>(new Set());
  const wsRef = useRef<WebSocket | null>(null);

  // Handle URL parameters for pre-selected media
  useEffect(() => {
    const type = searchParams.get("type");
    const id = searchParams.get("id");
    const title = searchParams.get("title");
    const author = searchParams.get("author");
    const cover = searchParams.get("cover");
    const artist = searchParams.get("artist");
    const POSTS_PER_PAGE = 50;

    console.log("URL Parameters:", { type, id, title, author, cover, artist });

    if (type && id && title) {
      setSearchType(type);
      const decodedTitle = decodeURIComponent(title);
      const decodedAuthor = author ? decodeURIComponent(author) : null;
      const decodedCover = cover
        ? decodeURIComponent(cover)
        : "/placeholder.svg";
      const decodedArtist = artist ? decodeURIComponent(artist) : null;

      // Create media object directly from URL parameters (no search needed)
      const mediaFromUrl: MediaItem = {
        id: id,
        title: decodedTitle,
        cover: decodedCover,
        year: null,
        type: type,
        author: decodedAuthor,
        artist: decodedArtist,
        data: {},
      };

      // Set the media directly without searching
      setSelectedMedia(mediaFromUrl);
      console.log("Directly set media from URL:", mediaFromUrl);

      // Clear search results since we don't need them
      setSearchResults([]);
      setSearchQuery("");
    }

    const fetchPosts = async () => {
      try {
        if (!user?.authorId) {
          return;
        }
        const res = await fetch(`${API_BASE}/posts?userId=${user.authorId}`);
        const data = await res.json();
        if (data.success) {
          console.log(data.posts);
          setPosts(data.posts);
        }
      } catch (error) {
        console.error("Failed to fetch posts:", error);
      }
    };
    fetchPosts();

    // WebSocket for real-time updates
    if (user?.authorId) {
      const WS_BASE = process.env.NEXT_PUBLIC_WS_BASE || "ws://localhost:8080";
      wsRef.current = new WebSocket(WS_BASE);
      wsRef.current.onopen = () => {
        console.log("author id", user.authorId);
        wsRef.current?.send(
          JSON.stringify({
            type: "auth",
            userId: user.authorId,
            page: 0,
            limit: POSTS_PER_PAGE,
          })
        );
      };
    }
    if (wsRef.current) {
      wsRef.current.onmessage = (event) => {
        const msg = JSON.parse(event.data);

        if (msg.type === "init") {
          console.log(msg.posts);
          setPosts(msg.posts);
          //setHasMorePosts(msg.posts.length === POSTS_PER_PAGE);
          //setCurrentPage(0);
        } else if (msg.type === "comment") {
          setPosts((prev) =>
            prev.map((post) =>
              post._id === msg.postId
                ? { ...post, comments: [...(post.comments || []), msg.comment] }
                : post
            )
          );
        } else if (msg.type === "post") {
          setPosts((prev) => [msg.post, ...prev]);
        } else if (msg.type === "initLikes") {
          setLikedPosts(new Set(msg.likedPosts));
          setLikedReplies(new Set(msg.likedReplies));
        } else if (msg.type === "likeUpdate") {
          setPosts((prev) =>
            prev.map((post) =>
              post._id === msg.targetId
                ? { ...post, likeCount: msg.likeCount }
                : post
            )
          );
        }
      };
    }

    return () => wsRef.current?.close();
  }, [searchParams, user?.authorId]);

  // Auto-search when search query is set manually (not from URL parameters)
  useEffect(() => {
    if (searchQuery && searchQuery.trim() && !searchParams.get("id")) {
      searchMedia();
    }
  }, [searchType, searchQuery, searchParams]); // Only trigger for manual searches

  // Review state
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const searchMedia = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      let results: MediaItem[] = [];

      if (searchType === "movie") {
        const movies = await searchService.searchMovies(searchQuery);
        results = movies.map((movie) => ({
          id: movie.id.toString(),
          title: movie.title,
          cover: movie.poster_path
            ? `https://image.tmdb.org/t/p/w300${movie.poster_path}`
            : "/placeholder.svg",
          year: movie.release_date
            ? new Date(movie.release_date).getFullYear()
            : null,
          type: "movie",
          data: movie,
        }));
      } else if (searchType === "series") {
        const series = await searchService.searchSeries(searchQuery);
        results = series.map((show) => ({
          id: show.id.toString(),
          title: show.name,
          cover: show.poster_path
            ? `https://image.tmdb.org/t/p/w300${show.poster_path}`
            : "/placeholder.svg",
          year: show.first_air_date
            ? new Date(show.first_air_date).getFullYear()
            : null,
          type: "series",
          data: show,
        }));
      } else if (searchType === "book") {
        const books = await searchService.searchBooks(searchQuery);
        results = books.map((book) => ({
          id: book.id,
          title: book.volumeInfo.title,
          cover: book.volumeInfo.imageLinks?.thumbnail || "/placeholder.svg",
          year: book.volumeInfo.publishedDate
            ? new Date(book.volumeInfo.publishedDate).getFullYear()
            : null,
          author: book.volumeInfo.authors?.join(", "),
          type: "book",
          data: book,
        }));
      } else if (searchType === "music") {
        // Search for music using Saavn API - always show both songs and albums
        try {
          // Search for both songs and albums in parallel
          const [songResponse, albumResponse] = await Promise.all([
            fetch(
              `/api/saavn/search?q=${encodeURIComponent(
                searchQuery
              )}&type=song&limit=5`
            ),
            fetch(
              `/api/saavn/search?q=${encodeURIComponent(
                searchQuery
              )}&type=album&limit=5`
            ),
          ]);

          const songData = await songResponse.json();
          const albumData = await albumResponse.json();

          // Add songs
          if (songData.data?.results) {
            const songs = songData.data.results.map((track: any) => ({
              id: `song_${track.id}`,
              title: track.name,
              cover:
                track.image?.[2]?.url ||
                track.image?.[1]?.url ||
                track.image?.[0]?.url ||
                "/placeholder.svg",
              year: track.year || null,
              type: "music",
              mediaSubType: "song",
              artist:
                track.artists?.primary
                  ?.map((artist: any) => artist.name)
                  .join(", ") ||
                track.primaryArtists ||
                "Unknown Artist",
              album: track.album?.name || "Unknown Album",
              data: track,
            }));
            results.push(...songs);
          }

          // Add albums
          if (albumData.data?.results) {
            const albums = albumData.data.results.map((album: any) => ({
              id: `album_${album.id}`,
              title: album.name || album.title,
              cover:
                album.image?.[2]?.url ||
                album.image?.[1]?.url ||
                album.image?.[0]?.url ||
                "/placeholder.svg",
              year: album.year || null,
              type: "music",
              mediaSubType: "album",
              artist:
                album.artists?.primary
                  ?.map((artist: any) => artist.name)
                  .join(", ") ||
                album.primaryArtists ||
                "Unknown Artist",
              data: album,
            }));
            results.push(...albums);
          }
        } catch (error) {
          console.error("Music search error:", error);
        }
      }

      setSearchResults(results);
    } catch (error) {
      console.error("Search error:", error);
      toast({
        title: "Search Error",
        description: "Failed to search. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const selectMedia = (media: MediaItem) => {
    setSelectedMedia(media);
    setSearchResults([]);
    setSearchQuery("");
  };

  const submitReview = async () => {
    if (!user || !selectedMedia || rating === 0 || !reviewText.trim()) {
      toast({
        title: "Missing Information",
        description: "Please select media, rating, and write a review.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      console.log("entering post in firebase");

      console.log(user);
      console.log(selectedMedia);
      wsRef.current?.send(
        JSON.stringify({
          type: "newPost",
          mediaId: selectedMedia.id,
          mediaTitle: selectedMedia.title,
          mediaCover: selectedMedia.cover,
          mediaType: selectedMedia.type,
          mediaYear: selectedMedia.year,
          mediaAuthor: selectedMedia.author || null,
          mediaArtist: selectedMedia.artist || null,
          mediaSubType: selectedMedia.mediaSubType || null,
          rating: rating,
          authorId: user.authorId,
          content: reviewText.trim(),
          authorType: "User",
        })
      );

      await addDoc(collection(db, "reviews"), {
        userId: user.uid,
        userDisplayName:
          user.displayName || user.email?.split("@")[0] || "Anonymous",
        userEmail: user.email,
        mediaId: selectedMedia.id,
        mediaTitle: selectedMedia.title,
        mediaCover: selectedMedia.cover,
        mediaType: selectedMedia.type,
        mediaYear: selectedMedia.year,
        mediaAuthor: selectedMedia.author || null,
        mediaArtist: selectedMedia.artist || null,
        mediaSubType: selectedMedia.mediaSubType || null,
        rating: rating,
        reviewText: reviewText.trim(),
        timestamp: serverTimestamp(),
        likes: [],
        comments: [],
      });

      // Success message with more details
      toast({
        title: "✅ Review Posted Successfully!",
        description: `Your review for "${selectedMedia.title}" has been shared with the community.`,
      });

      // Reset form
      setSelectedMedia(null);
      setRating(0);
      setReviewText("");

      // Show success state
      setShowSuccess(true);
    } catch (error) {
      console.error("Error submitting review:", error);
      toast({
        title: "❌ Failed to Post Review",
        description:
          "There was an error posting your review. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePost = async () => {
    if (!newPost.trim()) return;

    setIsPosting(true);
    try {
      console.log("entering post");

      wsRef.current?.send(
        JSON.stringify({
          type: "newPost",
          authorId: user?.authorId,
          content: newPost,
          authorType: "User",
        })
      );
      setNewPost("");
    } catch (error) {
      console.error("Failed to create post:", error);
    } finally {
      setIsPosting(false);
    }
  };

  const toggleLike = async (postId: string) => {
    const isLiked = likedPosts.has(postId);

    try {
      if (isLiked) {
        console.log("unCliking the post");
        wsRef.current?.send(
          JSON.stringify({
            type: "unlikePost",
            userId: user?.authorId,
            postId,
            targetType: "Post",
          })
        );
        setLikedPosts((prev) => {
          const newSet = new Set(prev);
          newSet.delete(postId);
          return newSet;
        });
      } else {
        console.log("liking the post");
        wsRef.current?.send(
          JSON.stringify({
            type: "likePost",
            userId: user?.authorId,
            postId,
            targetType: "Post",
          })
        );
        setLikedPosts((prev) => new Set([...prev, postId]));
      }

      setPosts((prev) =>
        prev.map((post) =>
          post._id === postId
            ? {
                ...post,
                likeCount: isLiked ? post.likeCount - 1 : post.likeCount + 1,
              }
            : post
        )
      );
    } catch (error) {
      console.error("Failed to toggle like:", error);
    }
  };

  const toggleReplyLike = async (postId: string, replyId: string) => {
    const isLiked = likedReplies.has(replyId);

    try {
      if (isLiked) {
        wsRef.current?.send(
          JSON.stringify({
            type: "unlikeReply",
            userId: user?.authorId,
            postId,
            replyId,
            targetType: "Comment",
          })
        );
        setLikedReplies((prev) => {
          const newSet = new Set(prev);
          newSet.delete(replyId);
          return newSet;
        });
      } else {
        wsRef.current?.send(
          JSON.stringify({
            type: "likeReply",
            userId: user?.authorId,
            replyId,
            targetType: "Comment",
          })
        );
        setLikedReplies((prev) => new Set([...prev, replyId]));
      }

      // Update reply like count locally
      setPosts((prev) =>
        prev.map((post) => {
          if (post._id === postId) {
            const updateReplyLikes = (comments: Reply[]): Reply[] => {
              return comments.map((reply) => {
                if (reply._id === replyId) {
                  return {
                    ...reply,
                    likeCount: isLiked
                      ? reply.likeCount - 1
                      : reply.likeCount + 1,
                  };
                }
                if (reply.comments) {
                  return {
                    ...reply,
                    comments: updateReplyLikes(reply.comments),
                  };
                }
                return reply;
              });
            };
            return { ...post, comments: updateReplyLikes(post.comments) };
          }
          return post;
        })
      );
    } catch (error) {
      console.error("Failed to toggle reply like:", error);
    }
  };

  const getMediaIcon = (mediaType: string) => {
    switch (mediaType) {
      case "movie":
        return <Film className="w-4 h-4" />;
      case "music":
        return <Music className="w-4 h-4" />;
      case "book":
        return <Book className="w-4 h-4" />;
      case "tv":
        return <Tv className="w-4 h-4" />;
      case "game":
        return <Gamepad2 className="w-4 h-4" />;
      default:
        return <Play className="w-4 h-4" />;
    }
  };

  const toggleReplyInput = (id: string) => {
    setShowReplyInput((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  function buildCommentTree(comments: Reply[] | undefined): Reply[] {
    if (!comments || !Array.isArray(comments)) {
      return [];
    }

    const map: Record<string, Reply & { comments: Reply[] }> = {};
    const roots: (Reply & { comments: Reply[] })[] = [];

    // Init all with empty comments[]
    comments.forEach((c) => {
      map[c._id] = { ...c, comments: [] };
    });

    // Attach children
    comments.forEach((c) => {
      if (c.parentCommentId && map[c.parentCommentId]) {
        map[c.parentCommentId].comments.push(map[c._id]);
      } else {
        roots.push(map[c._id]);
      }
    });

    return roots;
  }

  const handleReply = async (postId: string, parentReplyId?: string) => {
    const replyKey = parentReplyId ? `${postId}-${parentReplyId}` : postId;
    const content = replyInputs[replyKey]?.trim();
    if (!content) return;

    setIsReplying((prev) => ({ ...prev, [replyKey]: true }));
    console.log("commented");

    try {
      wsRef.current?.send(
        JSON.stringify({
          type: "newReply",
          postId,
          parentReplyId,
          content,
          authorId: user?.authorId,
        })
      );

      setReplyInputs((prev) => ({ ...prev, [replyKey]: "" }));
      setShowReplyInput((prev) => ({ ...prev, [replyKey]: false }));
    } catch (error) {
      console.error("Failed to create reply:", error);
    } finally {
      setIsReplying((prev) => ({ ...prev, [replyKey]: false }));
    }
  };

  const formatTime = (date: string | Date) => {
    if (!date) return "now";
    const d = typeof date === "string" ? new Date(date) : date;
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);

    if (minutes < 1) return "now";
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    return d.toLocaleDateString();
  };

  const sortReplies = (comments: Reply[] | undefined): Reply[] => {
    if (!comments || !Array.isArray(comments)) {
      return [];
    }

    return [...comments]
      .sort((a, b) => {
        const getTime = (timestamp: string | Date) => {
          if (typeof timestamp === "string") {
            const d = new Date(timestamp);
            return isNaN(d.getTime()) ? 0 : d.getTime();
          } else if (timestamp instanceof Date) {
            return timestamp.getTime();
          }
          return 0;
        };

        const timeA = getTime(a.timestamp);
        const timeB = getTime(b.timestamp);

        return timeA - timeB;
      })
      .map((reply) => ({
        ...reply,
        comments: reply.comments ? sortReplies(reply.comments) : [],
      }));
  };
  const getIndent = (depth: number) => {
    return 0;
  };

  const renderStarRating = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-3 h-3 ${
              i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
            }`}
          />
        ))}
        <span className="text-xs text-muted-foreground ml-1">{rating}/10</span>
      </div>
    );
  };
  const renderReplies = (
    comments: Reply[] | undefined,
    postId: string,
    depth = 0
  ) => {
    if (!comments || !Array.isArray(comments)) {
      return null;
    }

    const sortedReplies = sortReplies(comments);

    return sortedReplies.map((reply) => (
      <div
        key={reply._id}
        className="flex gap-2 border-l-2 border-muted"
        style={{ paddingLeft: `${getIndent(depth)}px` }}
      >
        <Avatar className="w-6 h-6">
          <AvatarFallback
            className={
              reply.authorId?.username === "gemini" ? "bg-blue-100" : ""
            }
          >
            {reply.authorId?.username === "gemini" ? (
              <Bot className="w-3 h-3 text-blue-600" />
            ) : (
              <User className="w-3 h-3" />
            )}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm">
              {reply.authorId?.username}
            </span>
            <span className="text-muted-foreground text-xs">
              {formatTime(reply.timestamp)}
            </span>
          </div>
          <p className="text-sm text-foreground whitespace-pre-wrap mb-2">
            {reply.content}
          </p>

          <div className="flex items-center gap-4 text-muted-foreground mb-2">
            <button
              onClick={() => toggleReplyInput(`${postId}-${reply._id}`)}
              className="flex items-center gap-1 hover:text-blue-500 transition-colors"
            >
              <MessageCircle className="w-3 h-3" />
              <span className="text-xs">{reply.comments?.length || 0}</span>
            </button>

            <button className="flex items-center gap-1 hover:text-green-500 transition-colors">
              <Repeat2 className="w-3 h-3" />
            </button>

            <button
              onClick={() => toggleReplyLike(postId, reply._id)}
              className={`flex items-center gap-1 transition-colors ${
                reply.isLiked ? "text-red-500" : "hover:text-red-500"
              }`}
            >
              <Heart
                className={`w-3 h-3 ${reply.isLiked ? "fill-current" : ""}`}
              />
              <span className="text-xs">{reply.likeCount}</span>
            </button>

            <button className="flex items-center gap-1 hover:text-blue-500 transition-colors">
              <Share className="w-3 h-3" />
            </button>
          </div>

          {showReplyInput[`${postId}-${reply._id}`] && (
            <div className="mt-2 flex gap-2">
              <Avatar className="w-5 h-5">
                <AvatarFallback>
                  <User className="w-2 h-2" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Textarea
                  value={replyInputs[`${postId}-${reply._id}`] || ""}
                  onChange={(e) =>
                    setReplyInputs((prev) => ({
                      ...prev,
                      [`${postId}-${reply._id}`]: e.target.value,
                    }))
                  }
                  placeholder="Write a reply... (Use @gemini for AI response)"
                  className="min-h-[50px] text-xs border-none resize-none focus-visible:ring-0"
                  disabled={isReplying[`${postId}-${reply._id}`]}
                />
                <div className="flex justify-end gap-2 mt-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleReplyInput(`${postId}-${reply._id}`)}
                    disabled={isReplying[`${postId}-${reply._id}`]}
                    className="h-6 px-2 text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleReply(postId, reply._id)}
                    disabled={
                      !replyInputs[`${postId}-${reply._id}`]?.trim() ||
                      isReplying[`${postId}-${reply._id}`]
                    }
                    className="rounded-full px-3 h-6 text-xs"
                  >
                    {isReplying[`${postId}-${reply._id}`]
                      ? "Replying..."
                      : "Reply"}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {reply.comments && reply.comments.length > 0 && (
            <div className="mt-3 space-y-3">
              {renderReplies(reply.comments, postId, depth + 1)}
            </div>
          )}
        </div>
      </div>
    ));
  };

  // if (!user) {
  //   return (
  //     <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center p-4">
  //       <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-md w-full">
  //         <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
  //           Login Required
  //         </h2>
  //         <p className="text-gray-600 dark:text-gray-300">
  //           Please log in to write reviews.
  //         </p>
  //       </div>
  //     </div>
  //   );
  // }

  // // Show success state
  // if (showSuccess) {
  //   return (
  //     <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-black dark:to-gray-900 flex items-center justify-center">
  //       <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 max-w-md w-full text-center">
  //         <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
  //           <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
  //         </div>
  //         <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
  //           Review Posted Successfully!
  //         </h2>
  //         <p className="text-gray-600 dark:text-gray-300 mb-6">
  //           Your review has been shared with the community. You'll be redirected
  //           to the home page in a few seconds to see it in the feed.
  //         </p>
  //         <div className="flex justify-center space-x-4">
  //           <button
  //             onClick={() => (window.location.href = "/")}
  //             className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg transition-colors"
  //           >
  //             Go to Home
  //           </button>
  //           <button
  //             onClick={() => {
  //               setShowSuccess(false);
  //               setSelectedMedia(null);
  //               setRating(0);
  //               setReviewText("");
  //             }}
  //             className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-6 py-2 rounded-lg transition-colors"
  //           >
  //             Write Another
  //           </button>
  //         </div>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-black dark:to-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">
          Write a Review
        </h1> */}

        {/* Search Section */}
        {!selectedMedia && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg mb-6">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Search Media
              </h2>
            </div>
            <div className="p-6 space-y-4">
              {/* Type Selector */}
              <div className="flex gap-2 mb-4">
                {[
                  { value: "movie", label: "Movies", icon: Film },
                  { value: "series", label: "Series", icon: Tv },
                  { value: "book", label: "Books", icon: BookOpen },
                  { value: "music", label: "Music", icon: Music },
                ].map((type) => (
                  <button
                    key={type.value}
                    onClick={() => setSearchType(type.value)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      searchType === type.value
                        ? "bg-blue-600 text-white shadow-md"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 hover:shadow-sm"
                    }`}
                  >
                    <type.icon className="h-4 w-4" />
                    {type.label}
                  </button>
                ))}
              </div>

              {/* Search Input */}
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder={`Search for ${
                    searchType === "music" ? "songs and albums" : searchType
                  }s...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && searchMedia()}
                  className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
                <button
                  onClick={searchMedia}
                  disabled={isSearching}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-all duration-200 hover:shadow-md disabled:hover:shadow-none"
                >
                  <Search className="h-4 w-4" />
                </button>
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {searchResults.map((result) => (
                    <div
                      key={`${result.type}-${result.id}`}
                      className="flex items-center gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 hover:shadow-md"
                      onClick={() => selectMedia(result)}
                    >
                      {/* Image */}
                      <div className="flex-shrink-0">
                        <Image
                          src={result.cover}
                          alt={result.title}
                          width={60}
                          height={90}
                          className="rounded-lg object-cover shadow-sm"
                        />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        {/* Title */}
                        <h3 className="font-semibold text-base sm:text-sm md:text-lg text-gray-900 dark:text-white line-clamp-2 min-h-[2rem] sm:min-h-[1.5rem] leading-tight mb-2">
                          {result.title}
                        </h3>

                        {/* Metadata */}
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          {result.year && (
                            <span className="text-sm sm:text-xs md:text-sm text-gray-600 dark:text-gray-400 font-medium">
                              {result.year}
                            </span>
                          )}
                          {result.author && (
                            <span className="text-sm sm:text-xs md:text-sm text-gray-600 dark:text-gray-400">
                              • {result.author}
                            </span>
                          )}
                          {result.artist && (
                            <span className="text-sm sm:text-xs md:text-sm text-gray-600 dark:text-gray-400">
                              • {result.artist}
                            </span>
                          )}
                          {result.album && (
                            <span className="text-sm sm:text-xs md:text-sm text-gray-600 dark:text-gray-400">
                              • {result.album}
                            </span>
                          )}
                        </div>

                        {/* Type Badge */}
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center px-3 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full">
                            {result.type.toUpperCase()}
                          </span>
                          {result.mediaSubType && (
                            <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full">
                              {result.mediaSubType.toUpperCase()}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Selection Indicator */}
                      <div className="flex-shrink-0">
                        <div className="w-6 h-6 rounded-full border-2 border-gray-300 dark:border-gray-600 flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Selected Media & Review Form */}
        {selectedMedia && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Review: {selectedMedia.title}
              </h2>
            </div>
            <div className="p-6 space-y-6">
              {/* Selected Media Display */}
              <div className="flex items-center gap-6 p-6 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600">
                {/* Image */}
                <div className="flex-shrink-0">
                  <Image
                    src={selectedMedia.cover}
                    alt={selectedMedia.title}
                    width={80}
                    height={120}
                    className="rounded-lg object-cover shadow-md"
                  />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg sm:text-base md:text-xl text-gray-900 dark:text-white line-clamp-2 min-h-[2.5rem] sm:min-h-[2rem] leading-tight mb-3">
                    {selectedMedia.title}
                  </h3>

                  {/* Metadata */}
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    {selectedMedia.year && (
                      <span className="text-base sm:text-sm md:text-base text-gray-600 dark:text-gray-400 font-medium">
                        {selectedMedia.year}
                      </span>
                    )}
                    {selectedMedia.author && (
                      <span className="text-base sm:text-sm md:text-base text-gray-600 dark:text-gray-400">
                        • {selectedMedia.author}
                      </span>
                    )}
                    {selectedMedia.artist && (
                      <span className="text-base sm:text-sm md:text-base text-gray-600 dark:text-gray-400">
                        • {selectedMedia.artist}
                      </span>
                    )}
                    {selectedMedia.album && (
                      <span className="text-base sm:text-sm md:text-base text-gray-600 dark:text-gray-400">
                        • {selectedMedia.album}
                      </span>
                    )}
                  </div>

                  {/* Type Badges */}
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center px-4 py-2 text-sm font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full">
                      {selectedMedia.type.toUpperCase()}
                    </span>
                    {selectedMedia.mediaSubType && (
                      <span className="inline-flex items-center px-3 py-2 text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full">
                        {selectedMedia.mediaSubType.toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Change Button */}
                <button
                  onClick={() => setSelectedMedia(null)}
                  className="flex-shrink-0 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 hover:shadow-sm"
                >
                  Change
                </button>
              </div>

              {/* Rating */}
              <div>
                <label className="text-sm font-medium text-gray-900 dark:text-white">
                  Rating (1-5 stars) *
                </label>
                <div className="flex items-center gap-1 mt-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`h-6 w-6 ${
                          star <= rating
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300 dark:text-gray-600"
                        }`}
                      />
                    </button>
                  ))}
                  {rating > 0 && (
                    <span className="ml-2 text-sm text-gray-600 dark:text-gray-300">
                      {rating}/5 stars
                    </span>
                  )}
                </div>
              </div>

              {/* Review Text */}
              <div>
                <label className="text-sm font-medium text-gray-900 dark:text-white">
                  Your Review *
                </label>
                <textarea
                  placeholder="Write your review here..."
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  rows={5}
                  className="mt-2 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Submit Button */}
              <div className="flex gap-2">
                <button
                  onClick={submitReview}
                  disabled={
                    !selectedMedia ||
                    rating === 0 ||
                    !reviewText.trim() ||
                    isSubmitting
                  }
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  {isSubmitting ? "Posting..." : "Post Review"}
                </button>
                <button
                  onClick={() => {
                    setSelectedMedia(null);
                    setRating(0);
                    setReviewText("");
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="min-h-screen bg-background">
          <div className="max-w-2xl mx-auto border-x border-border min-h-screen">
            {/* Header */}
            <div className="sticky top-0 bg-background/80 backdrop-blur border-b border-border p-4">
              <h1 className="text-xl font-bold">Home</h1>
            </div>

            {/* Post Creation */}
            <div className="border-b border-border p-4">
              <div className="flex gap-3">
                <Avatar>
                  <AvatarFallback>
                    <User className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <Textarea
                    value={newPost}
                    onChange={(e) => setNewPost(e.target.value)}
                    placeholder="What's happening? (Use @gemini to get AI responses)"
                    className="min-h-[100px] border-none resize-none text-lg placeholder:text-muted-foreground focus-visible:ring-0"
                    disabled={isPosting}
                  />
                  <div className="flex justify-between items-center mt-3">
                    <p className="text-sm text-muted-foreground">
                      Tip: Use @gemini, #ai, or #help to get AI responses
                    </p>
                    <Button
                      onClick={handlePost}
                      disabled={!newPost.trim() || isPosting}
                      className="rounded-full px-6"
                    >
                      {isPosting ? "Posting..." : "Post"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Feed */}
            <ScrollArea className="flex-1">
              {(!posts || posts.length === 0) && (
                <div className="text-center py-12 text-muted-foreground">
                  <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Your feed is empty. Create your first post!</p>
                </div>
              )}

              {posts &&
                posts.length > 0 &&
                posts.map((post) => (
                  <div
                    key={post._id}
                    className="border-b border-border p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex gap-3">
                      <Avatar>
                        <AvatarFallback className="bg-gray-100">
                          <User className="w-4 h-4" />
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold">
                            {post.authorId?.username}
                          </span>
                          {post.authorId?.username === "gemini" && (
                            <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                              <Bot className="w-2 h-2 text-white" />
                            </div>
                          )}
                          <span className="text-muted-foreground text-sm">
                            {formatTime(post.timestamp)}
                          </span>
                        </div>

                        <p className="text-foreground mb-3 whitespace-pre-wrap leading-relaxed">
                          {post.content}
                        </p>

                        {/* Media Display Section */}
                        {post.mediaId && (
                          <Card className="mb-3 overflow-hidden">
                            <div className="flex gap-4 p-4">
                              {/* Image */}
                              <div className="flex-shrink-0">
                                <img
                                  src={post.mediaCover || "/placeholder.svg"}
                                  alt={post.mediaTitle}
                                  className="w-20 h-28 rounded-lg object-cover shadow-sm"
                                />
                              </div>

                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start gap-3 mb-3">
                                  {getMediaIcon(post.mediaType)}
                                  <div className="flex-1">
                                    <h3 className="font-semibold text-base sm:text-sm md:text-lg line-clamp-2 min-h-[2rem] sm:min-h-[1.5rem] leading-tight mb-2">
                                      {post.mediaTitle}
                                    </h3>
                                    <div className="flex items-center gap-2">
                                      <Badge
                                        variant="secondary"
                                        className="text-sm sm:text-xs md:text-sm"
                                      >
                                        {post.mediaType}
                                      </Badge>
                                      {post.mediaSubType && (
                                        <Badge
                                          variant="outline"
                                          className="text-sm sm:text-xs md:text-sm"
                                        >
                                          {post.mediaSubType}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Metadata */}
                                <div className="flex flex-wrap items-center gap-3 mb-3">
                                  {post.mediaYear && (
                                    <span className="text-sm sm:text-xs md:text-sm text-muted-foreground font-medium">
                                      {post.mediaYear}
                                    </span>
                                  )}
                                  {post.mediaAuthor && (
                                    <span className="text-sm sm:text-xs md:text-sm text-muted-foreground">
                                      • {post.mediaAuthor}
                                    </span>
                                  )}
                                  {post.mediaArtist && (
                                    <span className="text-sm sm:text-xs md:text-sm text-muted-foreground">
                                      • {post.mediaArtist}
                                    </span>
                                  )}
                                </div>

                                {/* Rating */}
                                <div className="flex items-center gap-2">
                                  {renderStarRating(post.rating)}
                                </div>
                              </div>
                            </div>
                          </Card>
                        )}

                        {/* Post Actions */}
                        <div className="flex items-center gap-6 text-muted-foreground">
                          <button
                            onClick={() => toggleReplyInput(post._id)}
                            className="flex items-center gap-2 hover:text-blue-500 transition-colors"
                          >
                            <MessageCircle className="w-4 h-4" />
                            <span className="text-sm">
                              {post.comments?.length || 0}
                            </span>
                          </button>

                          <button className="flex items-center gap-2 hover:text-green-500 transition-colors">
                            <Repeat2 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => toggleLike(post._id)}
                            className={`flex items-center gap-2 transition-colors ${
                              post.isLiked
                                ? "text-red-500"
                                : "hover:text-red-500"
                            }`}
                          >
                            <Heart
                              className={`w-4 h-4 ${
                                post.isLiked ? "fill-current" : ""
                              }`}
                            />
                            <span className="text-sm">{post.likeCount}</span>
                          </button>

                          <button className="flex items-center gap-2 hover:text-blue-500 transition-colors">
                            <Share className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Reply Input Section */}
                        {showReplyInput[post._id] && (
                          <div className="mt-4 flex gap-3">
                            <Avatar className="w-6 h-6">
                              <AvatarFallback>
                                <User className="w-3 h-3" />
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <Textarea
                                value={replyInputs[post._id] || ""}
                                onChange={(e) =>
                                  setReplyInputs((prev) => ({
                                    ...prev,
                                    [post._id]: e.target.value,
                                  }))
                                }
                                placeholder="Write a reply... (Use @gemini for AI response)"
                                className="min-h-[60px] text-sm border-none resize-none focus-visible:ring-0"
                                disabled={isReplying[post._id]}
                              />
                              <div className="flex justify-end gap-2 mt-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleReplyInput(post._id)}
                                  disabled={isReplying[post._id]}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleReply(post._id)}
                                  disabled={
                                    !replyInputs[post._id]?.trim() ||
                                    isReplying[post._id]
                                  }
                                  className="rounded-full px-4"
                                >
                                  {isReplying[post._id]
                                    ? "Replying..."
                                    : "Reply"}
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}

                        {post.comments && post.comments.length > 0 && (
                          <div className="mt-4 space-y-3">
                            {renderReplies(
                              buildCommentTree(post.comments),
                              post._id
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </ScrollArea>
          </div>
        </div>
      </div>
    </div>
  );
}

// Loading component for Suspense fallback
function ReviewsPageLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-black dark:to-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Loading review form...
          </p>
        </div>
      </div>
    </div>
  );
}

// Main component with Suspense wrapper
export default function ReviewsPage() {
  return (
    <Suspense fallback={<ReviewsPageLoading />}>
      <ReviewsPageContent />
    </Suspense>
  );
}
