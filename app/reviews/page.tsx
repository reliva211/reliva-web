"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useProfile } from "@/hooks/use-profile";
import { ProfileLink } from "@/components/profile-link";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserAvatar, OtherUserAvatar } from "@/components/user-avatar";
import {
  Heart,
  MessageCircle,
  Repeat2,
  Share,
  User,
  CheckCircle,
  Trash2,
  Loader2,
} from "lucide-react";
import { useRef } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Gamepad2, Book, Play } from "lucide-react";
import Link from "next/link";

// Utility function to decode HTML entities
const decodeHtmlEntities = (text: string): string => {
  const textarea = document.createElement("textarea");
  textarea.innerHTML = text;
  return textarea.value;
};

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
  XCircle,
  Music,
  ChevronRight,
} from "lucide-react";
import Image from "next/image";
import { searchService } from "@/lib/search-service";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { toast } from "@/hooks/use-toast";
import { useUserData } from "@/hooks/use-userdata";

// Component that uses useSearchParams (needs to be wrapped in Suspense)
function ReviewsPageContent() {
  const { user } = useCurrentUser();
  const { profile } = useProfile(user?.uid);
  const searchParams = useSearchParams();
  const router = useRouter();

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
  const [showSearchResults, setShowSearchResults] = useState(false);
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
  const [userProfiles, setUserProfiles] = useState<Map<string, any>>(new Map());
  const [expandedComments, setExpandedComments] = useState<Set<string>>(
    new Set()
  );

  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const fetchPosts = async (cursor?: string) => {
    setIsLoadingMore(true);

    // Only fetch posts if user has authorId
    if (!user?.authorId) {
      console.log("No authorId available, skipping posts fetch");
      setIsLoadingMore(false);
      return;
    }

    const params = new URLSearchParams({
      limit: "50",
      userId: user.authorId,
      ...(cursor ? { cursor } : {}),
    });

    const res = await fetch(`${API_BASE}/posts?${params}`);
    const data = await res.json();
    console.log(data);

    if (data.success && Array.isArray(data.posts)) {
      setPosts((prev) => [...prev, ...data.posts]);
      setNextCursor(data.nextCursor);
      setHasMorePosts(!!data.nextCursor);
    } else {
      console.error("Failed to fetch posts:", data.error || data);
    }

    setIsLoadingMore(false);
  };

  // Function to fetch user profile for a given authorId from Firebase directly
  const fetchUserProfile = async (authorId: string) => {
    if (userProfiles.has(authorId)) return userProfiles.get(authorId);

    try {
      // Import Firebase functions dynamically to avoid SSR issues
      const { doc, getDoc, collection, query, where, getDocs } = await import(
        "firebase/firestore"
      );
      const { db } = await import("@/lib/firebase");

      // First, map authorId to Firebase UID
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("authorId", "==", authorId));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        const firebaseUID = userDoc.id; // The document ID is the Firebase UID

        // Now fetch the user profile using Firebase UID
        const userProfileRef = doc(db, "userProfiles", firebaseUID);
        const userProfileSnap = await getDoc(userProfileRef);

        if (userProfileSnap.exists()) {
          const userData = userProfileSnap.data();
          const userProfile = {
            _id: authorId,
            username:
              userData.username || userData.displayName || "Unknown User",
            displayName:
              userData.displayName || userData.username || "Unknown User",
            avatarUrl: userData.avatarUrl || null,
            email: userData.email || null,
            bio: userData.bio || null,
          };
          setUserProfiles((prev) => new Map(prev.set(authorId, userProfile)));
          return userProfile;
        }
      }
    } catch (error) {
      console.error("Error fetching user profile from Firebase:", error);
    }
    return null;
  };

  // Handle URL parameters for pre-selected media
  useEffect(() => {
    const type = searchParams.get("type");
    const id = searchParams.get("id");
    const title = searchParams.get("title");
    const author = searchParams.get("author");
    const cover = searchParams.get("cover");
    const artist = searchParams.get("artist");
    const POSTS_PER_PAGE = 50;

    fetchPosts();

    // URL Parameters processed

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
      // Directly set media from URL

      // Clear search results since we don't need them
      setSearchResults([]);
      setSearchQuery("");
    }

    // const fetchPosts = async () => {
    //   try {
    //     if (!user?.authorId) {
    //       return;
    //     }
    //     const res = await fetch(`${API_BASE}/posts?userId=${user.authorId}`);
    //     const data = await res.json();
    //     if (data.success) {
    //       // Posts data received
    //       setPosts(data.posts);
    //       // Store posts in sessionStorage for thread navigation
    //       try {
    //         sessionStorage.setItem("reliva_posts", JSON.stringify(data.posts));
    //       } catch (e) {
    //         // Could not store posts in sessionStorage
    //       }
    //     }
    //   } catch (error) {
    //     console.error("Failed to fetch posts:", error);
    //   }
    // };
    // fetchPosts();

    // WebSocket for real-time updates
    if (user?.authorId) {
      const WS_BASE = process.env.NEXT_PUBLIC_WS_BASE || "ws://localhost:8080";
      wsRef.current = new WebSocket(WS_BASE);
      wsRef.current.onopen = () => {
        // Author ID retrieved
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
          // Posts message received
          setPosts(msg.posts);
          setHasMorePosts(!!msg.nextCursor);
          setNextCursor(msg.nextCursor);
          // Store posts in sessionStorage for thread navigation
          try {
            sessionStorage.setItem("reliva_posts", JSON.stringify(msg.posts));
          } catch (e) {
            // Could not store posts in sessionStorage
          }
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

  // Fetch user profiles for posts when posts change
  useEffect(() => {
    if (posts && posts.length > 0) {
      const uniqueAuthorIds = new Set<string>();

      // Collect all unique author IDs from posts and comments
      posts.forEach((post) => {
        if (post.authorId?._id) {
          uniqueAuthorIds.add(post.authorId._id);
        }
        if (post.comments) {
          post.comments.forEach((comment) => {
            if (comment.authorId?._id) {
              uniqueAuthorIds.add(comment.authorId._id);
            }
          });
        }
      });

      // Fetch profiles for all unique authors
      uniqueAuthorIds.forEach((authorId) => {
        if (!userProfiles.has(authorId)) {
          fetchUserProfile(authorId);
        }
      });
    }
  }, [posts, userProfiles]);

  const handleShare = async (postId: string) => {
    const shareUrl = `${window.location.origin}${window.location.pathname}#post-${postId}`;

    try {
      // Auto copy to clipboard
      await navigator.clipboard.writeText(shareUrl);

      // Show toast notification
      toast({
        title: "Link copied!",
        description: "Share this link with others.",
      });
    } catch (err) {
      console.error("Share failed:", err);
      toast({
        title: "Share failed",
        description: "Could not copy link to clipboard.",
        variant: "destructive",
      });
    }
  };

  const loaderRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!loaderRef.current || !nextCursor) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !isLoadingMore) {
        fetchPosts(nextCursor);
      }
    });
    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [nextCursor, isLoadingMore]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash) {
        const postId = hash.split("-")[1];
        if (postId) {
          toggleReplyInput(postId);
          document.querySelector(hash)?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }

        setTimeout(() => {
          window.history.replaceState(
            null,
            "",
            window.location.pathname + window.location.search
          );
        }, 500);
      }
    };

    handleHashChange();

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, [posts]);

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
    setShowSearchResults(true);
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
    setShowSearchResults(false);
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
      // Entering post in firebase
      wsRef.current?.send(
        JSON.stringify({
          type: "newPost",
          mediaId: selectedMedia.id,
          mediaTitle: decodeHtmlEntities(selectedMedia.title),
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
        mediaTitle: decodeHtmlEntities(selectedMedia.title),
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
      // Entering post

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
        // Unclicking the post
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
        // Liking the post
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

  const toggleCommentsExpansion = (postId: string) => {
    setExpandedComments((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
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
    // Comment added

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
        // Check if current user is the author of either comment
        const isUserA = user?.authorId === a.authorId?._id;
        const isUserB = user?.authorId === b.authorId?._id;

        // If one is by current user and the other isn't, prioritize user's comment
        if (isUserA && !isUserB) return -1;
        if (!isUserA && isUserB) return 1;

        // If both are by the same user or both are by different users, sort by time (newest first)
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

        return timeB - timeA; // Reverse order for newest first
      })
      .map((reply) => ({
        ...reply,
        comments: reply.comments ? sortReplies(reply.comments) : [],
      }));
  };

  const renderStarRating = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-3 h-3 ${
              i < rating ? "fill-yellow-400 text-yellow-400" : "text-[#606060]"
            }`}
          />
        ))}
        <span className="text-xs text-[#808080] ml-1">{rating}/5</span>
      </div>
    );
  };
  const renderTopLevelComments = (
    comments: Reply[] | undefined,
    postId: string,
    limit?: number
  ) => {
    if (!comments || !Array.isArray(comments)) {
      return null;
    }

    // Get only top-level comments (no parentCommentId or parentCommentId is null)
    const topLevelComments = comments.filter(
      (comment) => !comment.parentCommentId
    );
    const sortedComments = sortReplies(topLevelComments);

    // Apply limit if specified
    const commentsToShow = limit
      ? sortedComments.slice(0, limit)
      : sortedComments;
    const hasMoreComments = limit && sortedComments.length > limit;
    const shouldShowToggleButton = sortedComments.length > 3; // Always show button if more than 3 comments

    return (
      <>
        {commentsToShow.map((comment) => (
          <div
            key={comment._id}
            className="flex gap-3 border-l border-[#2a2a2a] ml-2 p-3 bg-[#0a0a0a] rounded-r-lg w-full min-w-0 overflow-hidden"
          >
            <OtherUserAvatar
              authorId={comment.authorId?._id}
              username={comment.authorId?.username}
              displayName={userProfiles.get(comment.authorId?._id)?.displayName}
              avatarUrl={userProfiles.get(comment.authorId?._id)?.avatarUrl}
              size="sm"
              className="flex-shrink-0"
            />

            <div className="flex-1 min-w-0 max-w-full overflow-hidden">
              <div className="flex items-start gap-2 mb-2">
                <ProfileLink
                  authorId={comment.authorId?._id}
                  displayName={userProfiles.get(comment.authorId?._id)?.displayName || comment.authorId?.username}
                  username={comment.authorId?.username}
                  className="font-medium text-sm text-[#f5f5f5]"
                >
                  {userProfiles.get(comment.authorId?._id)?.displayName ||
                    comment.authorId?.username}
                </ProfileLink>
                <span className="text-[#a0a0a0] text-xs">
                  {formatTime(comment.timestamp)}
                </span>
                {user?.uid === comment.authorId?._id && (
                  <button
                    className="ml-auto p-1 hover:bg-red-500/20 rounded-full transition-colors group"
                    title="Delete comment"
                  >
                    <Trash2 className="w-3 h-3 text-[#808080] group-hover:text-red-400" />
                  </button>
                )}
              </div>
              <p
                className="text-sm text-[#f0f0f0] whitespace-pre-wrap mb-3 leading-relaxed break-all word-break-break-all overflow-wrap-anywhere hyphens-auto"
                style={{
                  wordWrap: "break-word",
                  overflowWrap: "anywhere",
                  wordBreak: "break-all",
                  maxWidth: "100%",
                  width: "100%",
                }}
              >
                {comment.content}
              </p>

              <div className="flex items-center gap-2 sm:gap-4 text-[#a0a0a0] overflow-hidden">
                <button
                  onClick={() => toggleReplyInput(`${postId}-${comment._id}`)}
                  className="flex items-center gap-1.5 hover:text-blue-400 transition-all duration-200 group"
                >
                  <div className="p-1.5 rounded-full group-hover:bg-blue-600/20 transition-colors">
                    <MessageCircle className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-medium">Reply</span>
                </button>

                <button
                  onClick={() => toggleReplyLike(postId, comment._id)}
                  className="flex items-center gap-1.5 hover:text-rose-400 transition-all duration-200 group"
                >
                  <div className="p-1.5 rounded-full group-hover:bg-rose-600/20 transition-colors">
                    <Heart
                      className={`w-4 h-4 ${
                        comment.isLiked ? "fill-current text-rose-400" : ""
                      }`}
                    />
                  </div>
                  <span className="text-xs font-medium">
                    {comment.likeCount}
                  </span>
                </button>

                {/* <button onClick={() => handleShare(post._id)} className="flex items-center gap-2 hover:text-blue-500 transition-colors">
                      <Share className="w-4 h-4" />
                    </button> */}

                {/* Thread Navigation - Show "See Replies" for comments with responses */}
                {comment.comments && comment.comments.length > 0 && (
                  <Link
                    href={`/reviews/${postId}/thread/${comment._id}`}
                    className="flex items-center gap-1.5 hover:text-green-400 transition-all duration-200 group"
                  >
                    <span className="text-xs font-medium">See Replies</span>
                    <span className="text-xs text-[#808080]">
                      {comment.comments.length}
                    </span>
                  </Link>
                )}
              </div>

              {/* Reply Input for top-level comments */}
              {showReplyInput[`${postId}-${comment._id}`] && (
                <div className="mt-3 bg-[#0f0f0f] rounded-lg border border-[#2a2a2a] shadow-sm overflow-hidden">
                  <div className="p-3">
                    <div className="flex gap-2 mb-3 min-w-0">
                      <UserAvatar
                        userId={user?.uid}
                        size="sm"
                        className="flex-shrink-0"
                        displayName={user?.displayName || undefined}
                        username={user?.email?.split("@")[0] || undefined}
                        clickable={false}
                      />
                      <div className="flex-1 min-w-0">
                        <Textarea
                          value={replyInputs[`${postId}-${comment._id}`] || ""}
                          onChange={(e) =>
                            setReplyInputs((prev) => ({
                              ...prev,
                              [`${postId}-${comment._id}`]: e.target.value,
                            }))
                          }
                          placeholder="Write a reply..."
                          className="min-h-[35px] max-h-[80px] text-sm border-none resize-none focus-visible:ring-0 bg-black px-2 py-1 rounded-lg text-white placeholder-[#606060] selection:bg-transparent selection:text-white"
                          disabled={isReplying[`${postId}-${comment._id}`]}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2 border-t border-[#2a2a2a]">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          toggleReplyInput(`${postId}-${comment._id}`)
                        }
                        disabled={isReplying[`${postId}-${comment._id}`]}
                        className="text-[#808080] hover:text-[#a0a0a0] text-xs px-1.5 py-0.5 h-5 bg-[#1a1a1a] border border-[#2a2a2a]"
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleReply(postId, comment._id)}
                        disabled={
                          !replyInputs[`${postId}-${comment._id}`]?.trim() ||
                          isReplying[`${postId}-${comment._id}`]
                        }
                        className="bg-blue-600/80 hover:bg-blue-700/80 text-white font-medium rounded-md px-1.5 py-0.5 text-xs shadow-sm hover:shadow-md transition-all duration-200 h-5"
                      >
                        {isReplying[`${postId}-${comment._id}`] ? (
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
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
            </div>
          </div>
        ))}
        {shouldShowToggleButton && (
          <div className="flex justify-center mt-2">
            <button
              onClick={() => toggleCommentsExpansion(postId)}
              className="view-more-comments-btn flex items-center gap-1.5 px-2 py-1 text-xs text-[#a0a0a0] hover:text-[#d0d0d0] hover:bg-[#1a1a1a] rounded-md transition-all duration-200 group"
            >
              <span className="font-medium">
                {expandedComments.has(postId) ? "View Less" : "View More"}{" "}
                Replies
              </span>
              <div
                className={`w-3 h-3 transition-transform duration-200 ${
                  expandedComments.has(postId) ? "rotate-180" : ""
                }`}
              >
                <svg
                  className="w-full h-full"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </button>
          </div>
        )}
      </>
    );
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
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="container mx-auto px-1 sm:px-4 py-8 max-w-7xl">
        {/* Search Section */}
        {!selectedMedia && (
          <div className="bg-[#0f0f0f] rounded-lg shadow-lg mb-6 border border-[#1a1a1a]">
            <div className="p-1 sm:p-3 border-b border-[#1a1a1a]">
              <h2 className="text-lg font-medium text-[#d0d0d0]">Quick log</h2>
            </div>
            <div className="p-2 sm:p-4 space-y-4">
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
                        ? "bg-blue-600/80 text-white"
                        : "bg-[#1a1a1a] text-[#a0a0a0] hover:bg-[#2a2a2a] hover:text-[#c0c0c0]"
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
                  placeholder={`Rate and review ${
                    searchType === "music"
                      ? "songs and albums"
                      : searchType === "movie"
                      ? "movies"
                      : searchType === "tv"
                      ? "TV shows"
                      : searchType === "book"
                      ? "books"
                      : searchType
                  }...`}
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (e.target.value.trim()) {
                      setShowSearchResults(true);
                    } else {
                      setShowSearchResults(false);
                    }
                  }}
                  onKeyDown={(e) => e.key === "Enter" && searchMedia()}
                  onBlur={() => {
                    // Hide results after a short delay to allow clicking on results
                    setTimeout(() => setShowSearchResults(false), 200);
                  }}
                  onFocus={() => {
                    if (searchResults.length > 0) {
                      setShowSearchResults(true);
                    }
                  }}
                  className="flex-1 px-3 py-2 border border-[#2a2a2a] rounded-lg bg-[#0a0a0a] text-[#c0c0c0] placeholder-[#606060] focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-[#3a3a3a]"
                />
                <button
                  onClick={searchMedia}
                  disabled={isSearching}
                  className="px-4 py-2 bg-blue-600/80 hover:bg-blue-700/80 disabled:bg-[#2a2a2a] text-white rounded-lg transition-colors"
                >
                  <Search className="h-4 w-4" />
                </button>
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && showSearchResults && (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {searchResults.map((result) => (
                    <div
                      key={`${result.type}-${result.id}`}
                      className="flex items-center gap-3 p-3 border border-[#1a1a1a] rounded-lg cursor-pointer hover:bg-[#0a0a0a] transition-colors"
                      onClick={() => selectMedia(result)}
                      onMouseDown={(e) => e.preventDefault()}
                    >
                      <Image
                        src={result.cover}
                        alt={result.title}
                        width={80}
                        height={120}
                        className="rounded object-cover"
                      />
                      <div className="flex-1">
                        <h3 className="font-medium text-[#d0d0d0]">
                          {result.title}
                        </h3>
                        <div className="text-sm text-[#808080]">
                          {result.year && <span>{result.year}</span>}
                          {result.author && <span> • {result.author}</span>}
                          {result.artist && <span> • {result.artist}</span>}
                          {result.mediaSubType && (
                            <span> • {result.mediaSubType.toUpperCase()}</span>
                          )}
                        </div>
                        <span className="inline-block px-2 py-1 text-xs bg-[#1a1a1a] text-[#808080] rounded mt-1">
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
          <div className="bg-[#0f0f0f] rounded-lg shadow-lg border border-[#1a1a1a]">
            <div className="p-1 sm:p-3 border-b border-[#1a1a1a]">
              <h2 className="text-lg font-medium text-[#d0d0d0]">
                Review: {selectedMedia.title}
              </h2>
            </div>
            <div className="p-2 sm:p-6 space-y-6">
              {/* Selected Media Display */}
              <div className="flex items-center gap-4 p-4 bg-[#0a0a0a] rounded-lg border border-[#1a1a1a]">
                <div className="relative">
                  <Image
                    src={selectedMedia.cover}
                    alt={selectedMedia.title}
                    width={140}
                    height={210}
                    className="rounded-xl object-cover shadow-lg"
                  />
                </div>
                <div>
                  <h3 className="font-medium text-[#d0d0d0]">
                    {selectedMedia.title}
                  </h3>
                  <div className="text-sm text-[#808080]">
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
                  <span className="inline-block px-3 py-1.5 text-xs font-semibold bg-gradient-to-r from-[#2a2a2a] to-[#1a1a1a] text-[#d0d0d0] rounded-full mt-2 border border-[#3a3a3a] shadow-sm">
                    {selectedMedia.type.toUpperCase()}
                    {selectedMedia.mediaSubType
                      ? ` - ${selectedMedia.mediaSubType.toUpperCase()}`
                      : ""}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedMedia(null)}
                  className="ml-auto px-3 py-1 text-sm text-[#808080] hover:text-[#c0c0c0] hover:bg-[#1a1a1a] rounded transition-colors"
                >
                  Change
                </button>
              </div>

              {/* Rating */}
              <div>
                <label className="text-sm font-medium text-[#d0d0d0]">
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
                            : "text-[#606060]"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Review Text */}
              <div>
                <label className="text-sm font-medium text-[#d0d0d0]">
                  Your Review *
                </label>
                <textarea
                  placeholder="Write your review here..."
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  rows={5}
                  className="mt-2 w-full px-3 py-2 border border-[#2a2a2a] rounded-lg bg-[#0a0a0a] text-[#c0c0c0] placeholder-[#606060] focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-[#3a3a3a] resize-none"
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
                  className="flex-1 bg-blue-600/80 hover:bg-blue-700/80 disabled:bg-[#2a2a2a] text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  {isSubmitting ? "Posting..." : "Post Review"}
                </button>
                <button
                  onClick={() => {
                    setSelectedMedia(null);
                    setRating(0);
                    setReviewText("");
                  }}
                  className="px-4 py-2 border border-[#2a2a2a] text-[#808080] hover:bg-[#1a1a1a] rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="min-h-screen bg-[#0a0a0a]">
          <div className="max-w-7xl mx-auto border border-[#2a2a2a] min-h-screen rounded-lg">
            {/* Enhanced Header */}
            <div className="sticky top-0 bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-[#1a1a1a] z-10">
              <div className="px-1 sm:px-4 py-3">
                <h1 className="text-xl font-medium text-[#e0e0e0]">Home</h1>
              </div>
            </div>

            {/* Enhanced Post Creation */}
            <div className="border-b border-[#1a1a1a] bg-[#0f0f0f]/50">
              <div className="px-1 sm:px-4 py-4">
                <div className="flex gap-4 w-full">
                  <UserAvatar
                    userId={user?.uid}
                    size="md"
                    className="ring-2 ring-green-500/20"
                    displayName={user?.displayName || undefined}
                    username={user?.email?.split("@")[0] || undefined}
                    clickable={false}
                  />
                  <div className="flex-1">
                    <div className="bg-[#0a0a0a] rounded-2xl border border-[#1a1a1a] shadow-sm">
                      <Textarea
                        value={newPost}
                        onChange={(e) => setNewPost(e.target.value)}
                        placeholder="What's happening?"
                        className="min-h-[120px] border-none resize-none text-lg placeholder:text-[#606060] focus-visible:ring-0 bg-transparent p-4 rounded-2xl text-[#c0c0c0]"
                        disabled={isPosting}
                      />
                    </div>

                    {/* Enhanced Action Bar */}
                    <div className="flex justify-end items-center mt-4">
                      <Button
                        onClick={handlePost}
                        disabled={!newPost.trim() || isPosting}
                        className="bg-blue-600/80 hover:bg-blue-700/80 text-white font-medium rounded-full px-8 py-2.5 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
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
            <ScrollArea className="flex-1 w-full">
              {(!posts || posts.length === 0) && (
                <div className="text-center py-16 px-1 sm:px-4">
                  <div className="w-20 h-20 bg-gradient-to-br from-green-900/20 to-emerald-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-10 h-10 text-green-400" />
                  </div>
                  <h3 className="text-xl font-medium text-[#d0d0d0] mb-3">
                    Your feed is empty
                  </h3>
                  <p className="text-[#808080] mb-6 max-w-md mx-auto">
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
                    id={`post-${post._id}`}
                    className="border-b border-[#1a1a1a] px-1 sm:px-4 py-4 bg-[#0f0f0f] overflow-hidden"
                  >
                    <div className="flex gap-3 w-full min-w-0">
                      <OtherUserAvatar
                        authorId={post.authorId?._id}
                        username={post.authorId?.username}
                        displayName={
                          userProfiles.get(post.authorId?._id)?.displayName
                        }
                        avatarUrl={
                          userProfiles.get(post.authorId?._id)?.avatarUrl
                        }
                        size="md"
                        className="flex-shrink-0"
                      />

                      <div className="flex-1 min-w-0 max-w-full overflow-hidden">
                        <div className="flex items-start gap-2 mb-2">
                          <ProfileLink
                            authorId={post.authorId?._id}
                            displayName={
                              userProfiles.get(post.authorId?._id)
                                ?.displayName || post.authorId?.username
                            }
                            username={post.authorId?.username}
                            className="font-medium text-sm text-[#f5f5f0]"
                          >
                            {userProfiles.get(post.authorId?._id)
                              ?.displayName || post.authorId?.username}
                          </ProfileLink>
                          <span className="text-[#a0a0a0] text-xs">
                            {formatTime(post.timestamp)}
                          </span>
                          {user?.uid === post.authorId?._id && (
                            <button
                              className="ml-auto p-1 hover:bg-red-500/20 rounded-full transition-colors group"
                              title="Delete post"
                            >
                              <Trash2 className="w-3 h-3 text-[#808080] group-hover:text-red-400" />
                            </button>
                          )}
                        </div>

                        <p
                          className="text-[#f0f0f0] mb-3 whitespace-pre-wrap leading-relaxed text-sm break-all word-break-break-all overflow-wrap-anywhere hyphens-auto"
                          style={{
                            wordWrap: "break-word",
                            overflowWrap: "anywhere",
                            wordBreak: "break-all",
                            maxWidth: "100%",
                            width: "100%",
                          }}
                        >
                          {post.content}
                        </p>

                        {/* Compact Media Display Section */}
                        {post.mediaId && (
                          <Card className="mb-4 overflow-hidden border border-[#2a2a2a] bg-[#0f0f0f]">
                            <div className="flex min-w-0">
                              <div className="w-32 sm:w-40 h-40 sm:h-48 flex-shrink-0 relative p-2 sm:p-3">
                                {post.mediaType === "music" && post.mediaSubType === "song" ? (
                                  <button
                                    onClick={() => {
                                      toast({
                                        title: "Songs overview is currently unavailable",
                                        description: "We're working on bringing you detailed song information soon!",
                                        variant: "default",
                                      });
                                    }}
                                    className="block relative w-full h-full rounded-xl overflow-hidden shadow-lg cursor-pointer"
                                  >
                                    <img
                                      src={post.mediaCover || "/placeholder.svg"}
                                      alt={decodeHtmlEntities(post.mediaTitle)}
                                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                                    />
                                  </button>
                                ) : (
                                  <Link
                                    href={`/${
                                      post.mediaType === "series"
                                        ? "series"
                                        : post.mediaType === "artist"
                                        ? "music/artist"
                                        : post.mediaType === "music"
                                        ? "music/album"
                                        : post.mediaType + "s"
                                    }/${
                                      post.mediaType === "music"
                                        ? post.mediaId.replace("album_", "")
                                        : post.mediaId
                                    }`}
                                    className="block relative w-full h-full rounded-xl overflow-hidden shadow-lg cursor-pointer"
                                  >
                                    <img
                                      src={post.mediaCover || "/placeholder.svg"}
                                      alt={decodeHtmlEntities(post.mediaTitle)}
                                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                                    />
                                  </Link>
                                )}
                              </div>
                              <div className="flex-1 p-2 sm:p-4 min-w-0 overflow-hidden">
                                <div className="flex items-start gap-2 mb-2">
                                  <div className="flex-1">
                                    <h3 className="font-semibold text-sm sm:text-base text-[#f0f0f0] line-clamp-2 mb-2 leading-tight break-words">
                                      {decodeHtmlEntities(post.mediaTitle)}
                                    </h3>
                                    <div className="flex items-center gap-2 mb-3">
                                      <Badge
                                        variant="secondary"
                                        className="px-3 py-1 text-xs font-semibold bg-blue-600/30 text-blue-100 border-0 rounded-full shadow-sm"
                                      >
                                        {post.mediaType}
                                      </Badge>
                                      {post.mediaSubType && (
                                        <Badge
                                          variant="outline"
                                          className="px-3 py-1 text-xs font-semibold border-[#4a4a4a] text-[#a0a0a0] rounded-full bg-[#2a2a2a]/50"
                                        >
                                          {post.mediaSubType.toUpperCase()}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div className="space-y-2 text-xs sm:text-sm text-[#b0b0b0] mb-4">
                                  {post.mediaAuthor && (
                                    <div className="flex items-start gap-2 min-w-0">
                                      <span className="font-semibold text-[#d0d0d0] flex-shrink-0">
                                        Director:
                                      </span>
                                      <span className="text-[#e0e0e0] break-words min-w-0">
                                        {post.mediaAuthor}
                                      </span>
                                    </div>
                                  )}
                                  {post.mediaArtist && (
                                    <div className="flex items-start gap-2 min-w-0">
                                      <span className="font-semibold text-[#d0d0d0] flex-shrink-0">
                                        Artist:
                                      </span>
                                      <span className="text-[#e0e0e0] break-words min-w-0">
                                        {post.mediaArtist}
                                      </span>
                                    </div>
                                  )}
                                  <div className="flex items-start gap-2 min-w-0">
                                    <span className="font-semibold text-[#d0d0d0] flex-shrink-0">
                                      Year:
                                    </span>
                                    <span className="text-[#e0e0e0] break-words min-w-0">
                                      {post.mediaYear}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center">
                                  <div className="flex items-center gap-2">
                                    {renderStarRating(post.rating)}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </Card>
                        )}

                        {/* Compact Post Actions */}
                        <div className="flex items-center gap-3 sm:gap-6 text-[#a0a0a0] pt-2 w-full overflow-hidden">
                          <button
                            onClick={() => toggleReplyInput(post._id)}
                            className="flex items-center gap-1.5 hover:text-blue-400 transition-all duration-200 group"
                          >
                            <div className="p-1.5 rounded-full group-hover:bg-blue-600/20 transition-colors">
                              <MessageCircle className="w-4 h-4" />
                            </div>
                            <span className="text-xs font-medium">
                              Reply
                              {post.comments && post.comments.length > 0 && (
                                <span className="ml-1 text-[#808080]">
                                  ({post.comments.length})
                                </span>
                              )}
                            </span>
                          </button>

                          <button
                            onClick={() => toggleLike(post._id)}
                            className="flex items-center gap-1.5 hover:text-rose-400 transition-all duration-200 group"
                          >
                            <div className="p-1.5 rounded-full group-hover:bg-rose-600/20 transition-colors">
                              <Heart
                                className={`w-4 h-4 ${
                                  post.isLiked
                                    ? "fill-current text-rose-400"
                                    : ""
                                }`}
                              />
                            </div>
                            <span className="text-xs font-medium">
                              {post.likeCount}
                            </span>
                          </button>
                          <button
                            onClick={() => handleShare(post._id)}
                            className="flex items-center gap-1.5 hover:text-blue-500 transition-colors"
                          >
                            <Share className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Compact Reply Input Section */}
                        {showReplyInput[post._id] && (
                          <div className="mt-3 bg-[#0a0a0a] rounded-lg border border-[#1a1a1a] overflow-hidden">
                            <div className="p-3">
                              <div className="flex gap-2 mb-3 min-w-0">
                                <UserAvatar
                                  userId={user?.uid}
                                  size="sm"
                                  className="flex-shrink-0"
                                  displayName={user?.displayName || undefined}
                                  username={
                                    user?.email?.split("@")[0] || undefined
                                  }
                                  clickable={false}
                                />
                                <div className="flex-1 min-w-0">
                                  <Textarea
                                    value={replyInputs[post._id] || ""}
                                    onChange={(e) =>
                                      setReplyInputs((prev) => ({
                                        ...prev,
                                        [post._id]: e.target.value,
                                      }))
                                    }
                                    placeholder="Write a reply..."
                                    className="min-h-[35px] max-h-[80px] text-sm border-none resize-none focus-visible:ring-0 bg-black px-2 py-1 rounded-lg text-white placeholder-[#606060] selection:bg-transparent selection:text-white"
                                    disabled={isReplying[post._id]}
                                  />
                                </div>
                              </div>
                              <div className="flex gap-2 pt-2 border-t border-[#1a1a1a]">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleReplyInput(post._id)}
                                  disabled={isReplying[post._id]}
                                  className="text-[#808080] hover:text-[#a0a0a0] text-xs px-1.5 py-0.5 h-5 bg-[#1a1a1a] border border-[#2a2a2a]"
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
                                  className="bg-blue-600/80 hover:bg-blue-700/80 text-white font-medium rounded-md px-1.5 py-0.5 text-xs shadow-sm hover:shadow-md transition-all duration-200 h-5"
                                >
                                  {isReplying[post._id] ? (
                                    <div className="flex items-center gap-1">
                                      <div className="w-2 h-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
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
                          <div className="mt-3 space-y-2 w-full overflow-hidden">
                            {renderTopLevelComments(
                              buildCommentTree(post.comments),
                              post._id,
                              expandedComments.has(post._id) ? undefined : 3
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

              <div
                ref={loaderRef}
                className="h-10 flex justify-center items-center"
              >
                {isLoadingMore && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Loading more posts...</span>
                  </div>
                )}
              </div>

              {!hasMorePosts && posts.length > 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>You've reached the end of your feed!</p>
                </div>
              )}
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
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-[#808080]">Loading review form...</p>
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
