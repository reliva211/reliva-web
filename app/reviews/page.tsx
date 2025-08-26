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
        className="flex gap-3 border-l border-gray-200 dark:border-gray-700 ml-4 p-3 bg-gray-50/30 dark:bg-gray-800/30 rounded-r-lg"
        style={{ paddingLeft: `${getIndent(depth)}px` }}
      >
        <Avatar className="w-8 h-8 ring-1 ring-blue-500/20 flex-shrink-0">
          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold text-sm">
            {reply.authorId?.username?.charAt(0)?.toUpperCase() || "U"}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-semibold text-sm text-gray-900 dark:text-white">
              {reply.authorId?.username}
            </span>
            <span className="text-muted-foreground text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
              {formatTime(reply.timestamp)}
            </span>
          </div>
          <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap mb-3 leading-relaxed">
            {reply.content}
          </p>

          <div className="flex items-center gap-4 text-muted-foreground">
            <button
              onClick={() => toggleReplyInput(`${postId}-${reply._id}`)}
              className="flex items-center gap-1.5 hover:text-blue-500 transition-all duration-200 group"
            >
              <div className="p-1.5 rounded-full group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 transition-colors">
                <MessageCircle className="w-4 h-4" />
              </div>
              <span className="text-xs font-medium">
                {reply.comments?.length || 0}
              </span>
            </button>

            <button className="flex items-center gap-1.5 hover:text-green-500 transition-all duration-200 group">
              <div className="p-1.5 rounded-full group-hover:bg-green-50 dark:group-hover:bg-green-900/20 transition-colors">
                <Repeat2 className="w-4 h-4" />
              </div>
            </button>

            <button
              onClick={() => toggleReplyLike(postId, reply._id)}
              className={`flex items-center gap-1.5 transition-all duration-200 group ${
                reply.isLiked ? "text-red-500" : "hover:text-red-500"
              }`}
            >
              <div
                className={`p-1.5 rounded-full transition-colors ${
                  reply.isLiked
                    ? "bg-red-50 dark:bg-red-900/20"
                    : "group-hover:bg-red-50 dark:group-hover:bg-red-900/20"
                }`}
              >
                <Heart
                  className={`w-4 h-4 ${reply.isLiked ? "fill-current" : ""}`}
                />
              </div>
              <span className="text-xs font-medium">{reply.likeCount}</span>
            </button>

            <button className="flex items-center gap-1.5 hover:text-blue-500 transition-all duration-200 group">
              <div className="p-1.5 rounded-full group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 transition-colors">
                <Share className="w-4 h-4" />
              </div>
            </button>
          </div>

          {showReplyInput[`${postId}-${reply._id}`] && (
            <div className="mt-3 flex gap-3 bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 shadow-sm">
              <Avatar className="w-6 h-6 ring-1 ring-blue-500/20 flex-shrink-0">
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold text-xs">
                  {user?.displayName?.charAt(0) ||
                    user?.email?.charAt(0) ||
                    "U"}
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
                  placeholder="Write a reply..."
                  className="min-h-[50px] text-sm border-none resize-none focus-visible:ring-0 bg-transparent"
                  disabled={isReplying[`${postId}-${reply._id}`]}
                />
                <div className="flex justify-end gap-2 mt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleReplyInput(`${postId}-${reply._id}`)}
                    disabled={isReplying[`${postId}-${reply._id}`]}
                    className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-xs"
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
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-3 py-1 text-xs font-medium shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    {isReplying[`${postId}-${reply._id}`] ? (
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Replying...</span>
                      </div>
                    ) : (
                      "Reply"
                    )}
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
                Quick log
              </h2>
            </div>
            <div className="p-6 space-y-4">
              {/* Type Selector */}
              <div className="flex gap-2">
                {[
                  { value: "movie", label: "Movies", icon: Film },
                  { value: "series", label: "Series", icon: Tv },
                  { value: "book", label: "Books", icon: BookOpen },
                  { value: "music", label: "Music", icon: Music },
                ].map((type) => (
                  <button
                    key={type.value}
                    onClick={() => setSearchType(type.value)}
                    className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      searchType === type.value
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                    }`}
                  >
                    <type.icon className="h-4 w-4" />
                    {type.label}
                  </button>
                ))}
              </div>

              {/* Search Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder={`Search for ${
                    searchType === "music" ? "songs and albums" : searchType
                  }s...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && searchMedia()}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={searchMedia}
                  disabled={isSearching}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                >
                  <Search className="h-4 w-4" />
                </button>
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {searchResults.map((result) => (
                    <div
                      key={`${result.type}-${result.id}`}
                      className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      onClick={() => selectMedia(result)}
                    >
                      <Image
                        src={result.cover}
                        alt={result.title}
                        width={40}
                        height={60}
                        className="rounded object-cover"
                      />
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {result.title}
                        </h3>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {result.year && <span>{result.year}</span>}
                          {result.author && <span> • {result.author}</span>}
                          {result.artist && <span> • {result.artist}</span>}
                          {result.mediaSubType && (
                            <span> • {result.mediaSubType.toUpperCase()}</span>
                          )}
                        </div>
                        <span className="inline-block px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded mt-1">
                          {result.type.toUpperCase()}
                          {result.mediaSubType
                            ? ` - ${result.mediaSubType.toUpperCase()}`
                            : ""}
                        </span>
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
              <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <Image
                  src={selectedMedia.cover}
                  alt={selectedMedia.title}
                  width={60}
                  height={90}
                  className="rounded object-cover"
                />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {selectedMedia.title}
                  </h3>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedMedia.year && <span>{selectedMedia.year}</span>}
                    {selectedMedia.author && (
                      <span> • {selectedMedia.author}</span>
                    )}
                    {selectedMedia.artist && (
                      <span> • {selectedMedia.artist}</span>
                    )}
                    {selectedMedia.mediaSubType && (
                      <span> • {selectedMedia.mediaSubType.toUpperCase()}</span>
                    )}
                  </div>
                  <span className="inline-block px-2 py-1 text-xs bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded mt-1">
                    {selectedMedia.type.toUpperCase()}
                    {selectedMedia.mediaSubType
                      ? ` - ${selectedMedia.mediaSubType.toUpperCase()}`
                      : ""}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedMedia(null)}
                  className="ml-auto px-3 py-1 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
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
            {/* Enhanced Header */}
            <div className="sticky top-0 bg-background/95 backdrop-blur-xl border-b border-border z-10">
              <div className="px-4 py-3">
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Home
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Latest updates from your network
                </p>
              </div>
            </div>

            {/* Enhanced Post Creation */}
            <div className="border-b border-border bg-gradient-to-r from-gray-50/50 to-gray-100/50 dark:from-gray-900/50 dark:to-gray-800/50">
              <div className="p-4">
                <div className="flex gap-4">
                  <Avatar className="w-12 h-12 ring-2 ring-blue-500/20">
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                      {user?.displayName?.charAt(0) ||
                        user?.email?.charAt(0) ||
                        "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200">
                      <Textarea
                        value={newPost}
                        onChange={(e) => setNewPost(e.target.value)}
                        placeholder="What's happening?"
                        className="min-h-[120px] border-none resize-none text-lg placeholder:text-muted-foreground focus-visible:ring-0 bg-transparent p-4 rounded-2xl"
                        disabled={isPosting}
                      />
                    </div>

                    {/* Enhanced Action Bar */}
                    <div className="flex justify-between items-center mt-4">
                      <div className="flex items-center gap-4 text-muted-foreground">
                        <div className="flex items-center gap-2 text-sm">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          <span>Ready to post</span>
                        </div>
                      </div>

                      <Button
                        onClick={handlePost}
                        disabled={!newPost.trim() || isPosting}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-full px-8 py-2.5 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                      >
                        {isPosting ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Posting...</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span>Post</span>
                            <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                          </div>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Feed */}
            <ScrollArea className="flex-1">
              {(!posts || posts.length === 0) && (
                <div className="text-center py-16 px-4">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Sparkles className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                    Your feed is empty
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                    Start sharing your thoughts and discover what others are
                    watching, reading, and listening to.
                  </p>
                  <div className="w-16 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mx-auto"></div>
                </div>
              )}

              {posts &&
                posts.length > 0 &&
                posts.map((post) => (
                  <div
                    key={post._id}
                    className="border-b border-border p-4 hover:bg-gray-50/50 dark:hover:bg-gray-900/50 transition-all duration-200 group"
                  >
                    <div className="flex gap-3">
                      <Avatar className="w-10 h-10 ring-1 ring-blue-500/20 group-hover:ring-blue-500/30 transition-all duration-200">
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold text-sm">
                          {post.authorId?.username?.charAt(0)?.toUpperCase() ||
                            "U"}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-semibold text-sm text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {post.authorId?.username}
                          </span>
                          <span className="text-muted-foreground text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                            {formatTime(post.timestamp)}
                          </span>
                        </div>

                        <p className="text-foreground mb-3 whitespace-pre-wrap leading-relaxed text-sm">
                          {post.content}
                        </p>

                        {/* Compact Media Display Section */}
                        {post.mediaId && (
                          <Card className="mb-3 overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200 bg-white dark:bg-gray-800">
                            <div className="flex">
                              <div className="w-20 h-28 flex-shrink-0 relative">
                                <img
                                  src={post.mediaCover || "/placeholder.svg"}
                                  alt={post.mediaTitle}
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute top-1 right-1">
                                  {getMediaIcon(post.mediaType)}
                                </div>
                              </div>
                              <div className="flex-1 p-3">
                                <div className="flex items-start gap-2 mb-2">
                                  <div className="flex-1">
                                    <h3 className="font-semibold text-sm text-gray-900 dark:text-white line-clamp-2 mb-1">
                                      {post.mediaTitle}
                                    </h3>
                                    <div className="flex items-center gap-2 mb-2">
                                      <Badge
                                        variant="secondary"
                                        className="px-2 py-0.5 text-xs font-medium bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-0"
                                      >
                                        {post.mediaType}
                                      </Badge>
                                      {post.mediaSubType && (
                                        <Badge
                                          variant="outline"
                                          className="px-2 py-0.5 text-xs font-medium border-gray-300 dark:border-gray-600"
                                        >
                                          {post.mediaSubType.toUpperCase()}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
                                  {post.mediaAuthor && (
                                    <div className="flex items-center gap-2">
                                      <span className="font-semibold text-gray-700 dark:text-gray-300">
                                        Director:
                                      </span>
                                      <span>{post.mediaAuthor}</span>
                                    </div>
                                  )}
                                  {post.mediaArtist && (
                                    <div className="flex items-center gap-2">
                                      <span className="font-semibold text-gray-700 dark:text-gray-300">
                                        Artist:
                                      </span>
                                      <span>{post.mediaArtist}</span>
                                    </div>
                                  )}
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-gray-700 dark:text-gray-300">
                                      Year:
                                    </span>
                                    <span>{post.mediaYear}</span>
                                  </div>
                                </div>

                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    {renderStarRating(post.rating)}
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">
                                    {post.rating}/5
                                  </div>
                                </div>
                              </div>
                            </div>
                          </Card>
                        )}

                        {/* Compact Post Actions */}
                        <div className="flex items-center gap-6 text-muted-foreground pt-2 border-t border-gray-100 dark:border-gray-800">
                          <button
                            onClick={() => toggleReplyInput(post._id)}
                            className="flex items-center gap-1.5 hover:text-blue-500 transition-all duration-200 group"
                          >
                            <div className="p-1.5 rounded-full group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 transition-colors">
                              <MessageCircle className="w-4 h-4" />
                            </div>
                            <span className="text-xs font-medium">
                              {post.comments?.length || 0}
                            </span>
                          </button>

                          <button className="flex items-center gap-1.5 hover:text-green-500 transition-all duration-200 group">
                            <div className="p-1.5 rounded-full group-hover:bg-green-50 dark:group-hover:bg-green-900/20 transition-colors">
                              <Repeat2 className="w-4 h-4" />
                            </div>
                          </button>

                          <button
                            onClick={() => toggleLike(post._id)}
                            className={`flex items-center gap-1.5 transition-all duration-200 group ${
                              post.isLiked
                                ? "text-red-500"
                                : "hover:text-red-500"
                            }`}
                          >
                            <div
                              className={`p-1.5 rounded-full transition-colors ${
                                post.isLiked
                                  ? "bg-red-50 dark:bg-red-900/20"
                                  : "group-hover:bg-red-50 dark:group-hover:bg-red-900/20"
                              }`}
                            >
                              <Heart
                                className={`w-4 h-4 ${
                                  post.isLiked ? "fill-current" : ""
                                }`}
                              />
                            </div>
                            <span className="text-xs font-medium">
                              {post.likeCount}
                            </span>
                          </button>

                          <button className="flex items-center gap-1.5 hover:text-blue-500 transition-all duration-200 group">
                            <div className="p-1.5 rounded-full group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 transition-colors">
                              <Share className="w-4 h-4" />
                            </div>
                          </button>
                        </div>

                        {/* Compact Reply Input Section */}
                        {showReplyInput[post._id] && (
                          <div className="mt-3 flex gap-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                            <Avatar className="w-8 h-8 ring-1 ring-blue-500/20">
                              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold text-sm">
                                {user?.displayName?.charAt(0) ||
                                  user?.email?.charAt(0) ||
                                  "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                                <Textarea
                                  value={replyInputs[post._id] || ""}
                                  onChange={(e) =>
                                    setReplyInputs((prev) => ({
                                      ...prev,
                                      [post._id]: e.target.value,
                                    }))
                                  }
                                  placeholder="Write a reply..."
                                  className="min-h-[50px] text-sm border-none resize-none focus-visible:ring-0 bg-transparent p-2 rounded-lg"
                                  disabled={isReplying[post._id]}
                                />
                              </div>
                              <div className="flex justify-end gap-2 mt-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleReplyInput(post._id)}
                                  disabled={isReplying[post._id]}
                                  className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-xs"
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
                                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-full px-3 py-1 text-xs shadow-sm hover:shadow-md transition-all duration-200"
                                >
                                  {isReplying[post._id] ? (
                                    <div className="flex items-center gap-1">
                                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                      <span>Replying...</span>
                                    </div>
                                  ) : (
                                    "Reply"
                                  )}
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}

                        {post.comments && post.comments.length > 0 && (
                          <div className="mt-3 space-y-2">
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
