"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MessageCircle, Heart } from "lucide-react";
import { useCurrentUser } from "@/hooks/use-current-user";
import Link from "next/link";
import { toast } from "@/hooks/use-toast";

interface Reply {
  _id: string;
  postId: string;
  parentCommentId?: string | null;
  authorId: { _id: string; username: string };
  content: string;
  comments: Reply[];
  timestamp: string;
  likeCount: number;
  isLiked: boolean;
}

interface Post {
  _id: string;
  content: string;
  authorId: { _id: string; username: string };
  mediaId: string;
  mediaTitle: string;
  mediaType: string;
  mediaYear: string;
  comments: Reply[];
  timestamp: string;
}

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080/api";

export default function ThreadPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useCurrentUser();

  const reviewId = params.id as string;
  const commentId = params.commentId as string;

  const [post, setPost] = useState<Post | null>(null);
  const [parentComment, setParentComment] = useState<Reply | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replyInput, setReplyInput] = useState("");
  const [isReplying, setIsReplying] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);

  // WebSocket reference for real-time communication
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const fetchPostAndComment = async () => {
      if (!reviewId || !commentId) return;

      try {
        setLoading(true);
        setError(null);

        // Define API base URL
        const API_BASE =
          process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080/api";

        // First, try to get data from sessionStorage for better performance
        let realPost = null;
        const storedPosts = sessionStorage.getItem("reliva_posts");

        if (storedPosts) {
          try {
            const posts = JSON.parse(storedPosts);
            realPost = posts.find((post: any) => post._id === reviewId);
            console.log("Found post in sessionStorage:", realPost);
          } catch (e) {
            console.log("Could not parse stored posts");
          }
        }

        // If no stored data, fetch from API
        if (!realPost) {
          console.log("No stored data, fetching from API...");
          try {
            const res = await fetch(
              `${API_BASE}/posts?userId=${user?.authorId || "demo"}`
            );
            if (res.ok) {
              const data = await res.json();
              if (data.success && data.posts) {
                realPost = data.posts.find(
                  (post: any) => post._id === reviewId
                );
                // Store in sessionStorage for future use
                sessionStorage.setItem(
                  "reliva_posts",
                  JSON.stringify(data.posts)
                );
              }
            }
          } catch (e) {
            console.log("Could not fetch from API:", e);
            throw new Error("Failed to fetch post data");
          }
        }

        if (!realPost) {
          throw new Error("Post not found");
        }

        // Find the specific comment we're looking for
        const findComment = (
          comments: Reply[],
          targetId: string
        ): Reply | null => {
          console.log(
            `Searching for comment ${targetId} in ${comments.length} comments`
          );

          for (const comment of comments) {
            console.log(
              `Checking comment: ${comment._id} - "${comment.content}"`
            );
            if (comment._id === targetId) {
              console.log(`Found target comment: ${comment._id}`);
              return comment;
            }
            if (comment.comments && comment.comments.length > 0) {
              console.log(
                `Searching in ${comment.comments.length} nested comments of ${comment._id}`
              );
              const found = findComment(comment.comments, targetId);
              if (found) return found;
            }
          }
          console.log(`Comment ${targetId} not found in this comment tree`);
          return null;
        };

        const foundComment = findComment(realPost.comments || [], commentId);
        console.log("Found comment:", foundComment);
        console.log("Looking for comment ID:", commentId);
        console.log("Available comments in post:", realPost.comments);

        // Log the complete comment tree structure for debugging
        const logCommentTree = (comments: Reply[], depth: number = 0) => {
          const indent = "  ".repeat(depth);
          comments.forEach((comment) => {
            console.log(
              `${indent}Comment: ${comment._id} - "${comment.content}"`
            );
            if (comment.comments && comment.comments.length > 0) {
              console.log(`${indent}Has ${comment.comments.length} replies:`);
              logCommentTree(comment.comments, depth + 1);
            }
          });
        };

        if (realPost.comments && realPost.comments.length > 0) {
          console.log("=== COMPLETE COMMENT TREE ===");
          logCommentTree(realPost.comments);
          console.log("=== END COMMENT TREE ===");
        } else {
          console.log("No comments found in post");
        }

        if (!foundComment) {
          // If comment not found, try to fetch it from the API
          console.log("Comment not found in post, trying to fetch from API...");
          try {
            const commentRes = await fetch(`${API_BASE}/comments/${commentId}`);
            if (commentRes.ok) {
              const commentData = await commentRes.json();
              if (commentData.success && commentData.comment) {
                console.log("Found comment from API:", commentData.comment);
                setPost(realPost);
                setParentComment(commentData.comment);

                // Find replies to this comment
                const commentReplies = (realPost.comments || []).filter(
                  (comment: Reply) => comment.parentCommentId === commentId
                );
                setReplies(commentReplies);
                return;
              }
            }
          } catch (apiError) {
            console.log("Could not fetch comment from API:", apiError);
          }

          // If still not found, create a fallback comment
          console.log("Creating fallback comment for:", commentId);
          const fallbackComment: Reply = {
            _id: commentId,
            postId: reviewId,
            parentCommentId: null,
            authorId: {
              _id: user?.authorId || "unknown",
              username:
                user?.displayName ||
                user?.email?.split("@")[0] ||
                "Unknown User",
            },
            content:
              "Comment not found - this may be a reply to a deleted comment",
            comments: [],
            timestamp: new Date().toISOString(),
            likeCount: 0,
            isLiked: false,
          };

          setPost(realPost);
          setParentComment(fallbackComment);
          setReplies([]);
          return;
        }

        // Set the post and parent comment
        setPost(realPost);
        setParentComment(foundComment);

        // Find direct replies to this comment (comments with parentCommentId = commentId)
        const directReplies = (realPost.comments || []).filter(
          (comment: Reply) => comment.parentCommentId === commentId
        );

        // For each reply, find its nested replies to get accurate counts
        const repliesWithCounts = directReplies.map((reply: Reply) => {
          const nestedReplies = (realPost.comments || []).filter(
            (comment: Reply) => comment.parentCommentId === reply._id
          );
          return {
            ...reply,
            comments: nestedReplies,
          };
        });

        // Sort replies to prioritize current user's replies (latest first)
        const sortReplies = (replies: Reply[]): Reply[] => {
          return [...replies].sort((a, b) => {
            // Check if current user is the author of either reply
            const isUserA = user?.authorId === a.authorId?._id;
            const isUserB = user?.authorId === b.authorId?._id;

            // If one is by current user and the other isn't, prioritize user's reply
            if (isUserA && !isUserB) return -1;
            if (!isUserA && isUserB) return 1;

            // If both are by the same user or both are by different users, sort by time (newest first)
            const timeA = new Date(a.timestamp).getTime();
            const timeB = new Date(b.timestamp).getTime();

            return timeB - timeA; // Reverse order for newest first
          });
        };

        // Set the replies state with sorting applied
        setReplies(sortReplies(repliesWithCounts));
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Failed to fetch data"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchPostAndComment();

    // WebSocket for real-time updates
    if (user?.authorId) {
      try {
        const WS_BASE =
          process.env.NEXT_PUBLIC_WS_BASE || "ws://localhost:8080";
        console.log("Attempting to connect to WebSocket:", WS_BASE);

        wsRef.current = new WebSocket(WS_BASE);

        // Set connection timeout
        const connectionTimeout = setTimeout(() => {
          if (wsRef.current?.readyState === WebSocket.CONNECTING) {
            wsRef.current?.close();
          }
        }, 5000); // 5 second timeout

        wsRef.current.onopen = () => {
          clearTimeout(connectionTimeout);
          setWsConnected(true);
          // Authenticate with the server
          wsRef.current?.send(
            JSON.stringify({
              type: "auth",
              userId: user.authorId,
              postId: reviewId,
              commentId: commentId,
            })
          );
        };

        wsRef.current.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);

            if (msg.type === "comment" && msg.postId === reviewId) {
              // New reply received
              const newReply = msg.comment;

              // Update replies state if it's a reply to the current comment
              if (newReply.parentCommentId === commentId) {
                // Add the new reply with empty comments array (it's a new reply, so no nested replies yet)
                const newReplyWithCounts = {
                  ...newReply,
                  comments: [],
                };

                setReplies((prev) => [...prev, newReplyWithCounts]);

                // Update parentComment comments as well
                setParentComment((prev) => {
                  if (!prev) return null;
                  return {
                    ...prev,
                    comments: [...(prev.comments || []), newReplyWithCounts],
                  };
                });

                // Update sessionStorage
                try {
                  const storedPosts = sessionStorage.getItem("reliva_posts");
                  if (storedPosts && post) {
                    const posts = JSON.parse(storedPosts);
                    const postIndex = posts.findIndex(
                      (p: any) => p._id === post._id
                    );
                    if (postIndex !== -1) {
                      posts[postIndex].comments = [
                        ...(posts[postIndex].comments || []),
                        newReplyWithCounts,
                      ];
                      sessionStorage.setItem(
                        "reliva_posts",
                        JSON.stringify(posts)
                      );
                    }
                  }
                } catch (e) {
                  // Could not update sessionStorage
                }

                toast({
                  title: "New reply!",
                  description: `${newReply.authorId.username} replied to the thread.`,
                  duration: 3000,
                });
              }
            }
          } catch (error) {
            console.error("Failed to parse WebSocket message:", error);
          }
        };

        wsRef.current.onerror = (error) => {
          clearTimeout(connectionTimeout);
          setWsConnected(false);
        };

        wsRef.current.onclose = (event) => {
          clearTimeout(connectionTimeout);
          setWsConnected(false);
        };
      } catch (error) {
        // WebSocket initialization failed, continue with local mode
      }
    }

    // Cleanup on unmount
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [reviewId, commentId, user?.authorId]);

  const handleReply = async () => {
    if (!replyInput.trim() || !post || !parentComment) return;

    setIsReplying(true);
    try {
      // Send reply via WebSocket for real-time communication
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        const replyData = {
          type: "newReply",
          postId: post._id,
          parentReplyId: parentComment._id,
          content: replyInput.trim(),
          authorId: user?.authorId || "user123",
        };

        wsRef.current.send(JSON.stringify(replyData));
        console.log("Sent reply via WebSocket:", replyData);

        // Clear input immediately for better UX
        setReplyInput("");

        // Show optimistic success message
        toast({
          title: "Reply sent!",
          description: "Your reply is being processed...",
          duration: 2000,
        });
      } else {
        // Fallback to local state update if WebSocket is not available
        console.log("WebSocket not available, using local state update");

        const newReply: Reply = {
          _id: `reply_${Date.now()}`,
          postId: post._id,
          parentCommentId: parentComment._id,
          authorId: {
            _id: user?.authorId || "user123",
            username:
              user?.displayName || user?.email?.split("@")[0] || "Anonymous",
          },
          content: replyInput.trim(),
          comments: [],
          timestamp: new Date().toISOString(),
          likeCount: 0,
          isLiked: false,
        };

        // Update both parentComment and replies state to trigger re-render
        setParentComment((prev) =>
          prev
            ? {
                ...prev,
                comments: [...(prev.comments || []), newReply],
              }
            : null
        );

        setReplies((prev) => [...prev, newReply]);
        setReplyInput("");

        toast({
          title: "Reply added!",
          description: "Your reply has been added to the thread.",
          duration: 3000,
        });
      }

      // Update the post in sessionStorage to keep it in sync
      try {
        const storedPosts = sessionStorage.getItem("reliva_posts");
        if (storedPosts) {
          const posts = JSON.parse(storedPosts);
          const postIndex = posts.findIndex((p: any) => p._id === post._id);
          if (postIndex !== -1) {
            // Find the comment and add the reply
            const updateCommentReplies = (
              comments: any[],
              targetId: string
            ): any[] => {
              return comments.map((comment) => {
                if (comment._id === targetId) {
                  return {
                    ...comment,
                    comments: [
                      ...(comment.comments || []),
                      {
                        _id: `reply_${Date.now()}`,
                        postId: post._id,
                        parentCommentId: targetId,
                        authorId: {
                          _id: user?.authorId || "user123",
                          username:
                            user?.displayName ||
                            user?.email?.split("@")[0] ||
                            "Anonymous",
                        },
                        content: replyInput.trim(),
                        comments: [],
                        timestamp: new Date().toISOString(),
                        likeCount: 0,
                        isLiked: false,
                      },
                    ],
                  };
                }
                if (comment.comments) {
                  return {
                    ...comment,
                    comments: updateCommentReplies(comment.comments, targetId),
                  };
                }
                return comment;
              });
            };

            posts[postIndex].comments = updateCommentReplies(
              posts[postIndex].comments,
              parentComment._id
            );
            sessionStorage.setItem("reliva_posts", JSON.stringify(posts));
          }
        }
      } catch (e) {
        console.log("Could not update sessionStorage");
      }

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Show success message
      toast({
        title: "Reply added!",
        description: "Your reply has been added to the thread.",
        duration: 3000,
      });
    } catch (error) {
      console.error("Failed to create reply:", error);
    } finally {
      setIsReplying(false);
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

  // Helper function to count total replies recursively
  const getTotalRepliesCount = (comment: Reply | null): number => {
    if (!comment || !comment.comments) return 0;
    let count = comment.comments.length;
    comment.comments.forEach((reply) => {
      count += getTotalRepliesCount(reply);
    });
    return count;
  };

  // Helper function to render all replies recursively with proper indentation
  const renderAllReplies = (comment: Reply | null, depth: number) => {
    console.log("renderAllReplies called with:", comment, "depth:", depth);
    if (!comment || !comment.comments || comment.comments.length === 0)
      return null;

    return comment.comments.map((reply) => (
      <div key={reply._id} className="space-y-3">
        <Card
          className={`border border-[#2a2a2a] bg-[#0f0f0f] ${
            depth > 0 ? "ml-6" : ""
          }`}
        >
          <div className="p-4">
            <div className="flex items-start gap-3">
              <Avatar className="w-8 h-8 ring-1 ring-green-500/20 flex-shrink-0">
                <AvatarFallback className="bg-gradient-to-br from-green-500 to-emerald-600 text-white font-semibold text-xs">
                  {reply.authorId?.username?.charAt(0)?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-medium text-sm text-[#f5f5f5]">
                    {reply.authorId?.username}
                  </span>
                  <span className="text-[#a0a0a0] text-xs bg-[#3a3a3a] px-2 py-0.5 rounded-full">
                    {formatTime(reply.timestamp)}
                  </span>
                </div>
                <p className="text-[#f0f0f0] text-sm leading-relaxed mb-3">
                  {reply.content}
                </p>

                <div className="flex items-center gap-4 text-[#a0a0a0]">
                  {reply.comments && reply.comments.length > 0 && (
                    <Link
                      href={`/reviews/${reviewId}/thread/${reply._id}`}
                      className="flex items-center gap-1.5 hover:text-green-400 transition-all duration-200 group"
                    >
                      <div className="p-1.5 rounded-full group-hover:bg-green-600/20 transition-colors">
                        <MessageCircle className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-medium">
                        See Replies ({reply.comments.length})
                      </span>
                    </Link>
                  )}

                  {/* Quick Reply Button */}
                  <button
                    onClick={() => {
                      const replyText = prompt(
                        `Reply to "${reply.authorId?.username}":`
                      );
                      if (replyText && replyText.trim()) {
                        addReplyToComment(reply._id, replyText.trim());
                      }
                    }}
                    className="flex items-center gap-1.5 hover:text-green-400 transition-all duration-200 group"
                  >
                    <div className="p-1.5 rounded-full group-hover:bg-green-600/20 transition-colors">
                      <MessageCircle className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-medium">Quick Reply</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Render nested replies recursively */}
        {reply.comments && reply.comments.length > 0 && (
          <div className="ml-6">{renderAllReplies(reply, depth + 1)}</div>
        )}
      </div>
    ));
  };

  // Function to add reply to any nested comment
  const addReplyToComment = async (
    targetCommentId: string,
    replyContent: string
  ) => {
    console.log(
      "Adding reply to comment:",
      targetCommentId,
      "Content:",
      replyContent
    );
    if (!parentComment || !post) return;

    // Send reply via WebSocket for real-time communication
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const replyData = {
        type: "newReply",
        postId: post._id,
        parentReplyId: targetCommentId,
        content: replyContent,
        authorId: user?.authorId || "user123",
      };

      wsRef.current.send(JSON.stringify(replyData));
      console.log("Sent nested reply via WebSocket:", replyData);

      // Show optimistic success message
      toast({
        title: "Reply sent!",
        description: "Your reply is being processed...",
        duration: 2000,
      });
    } else {
      // Fallback to local state update if WebSocket is not available
      console.log(
        "WebSocket not available, using local state update for nested reply"
      );

      const newReply: Reply = {
        _id: `reply_${Date.now()}`,
        postId: post._id,
        parentCommentId: targetCommentId,
        authorId: {
          _id: user?.authorId || "user123",
          username:
            user?.displayName || user?.email?.split("@")[0] || "Anonymous",
        },
        content: replyContent,
        comments: [],
        timestamp: new Date().toISOString(),
        likeCount: 0,
        isLiked: false,
      };

      // Recursively update the comment tree
      const updateCommentTree = (comments: Reply[]): Reply[] => {
        return comments.map((comment) => {
          if (comment._id === targetCommentId) {
            return {
              ...comment,
              comments: [...(comment.comments || []), newReply],
            };
          }
          if (comment.comments && comment.comments.length > 0) {
            return {
              ...comment,
              comments: updateCommentTree(comment.comments),
            };
          }
          return comment;
        });
      };

      // Update parentComment state
      setParentComment((prev) => {
        const updated = prev
          ? {
              ...prev,
              comments: updateCommentTree(prev.comments || []),
            }
          : null;
        return updated;
      });

      // Also update the replies state to keep them in sync
      setReplies((prev) => {
        const updatedReplies = updateCommentTree(prev);
        return updatedReplies;
      });

      // Update sessionStorage
      try {
        const storedPosts = sessionStorage.getItem("reliva_posts");
        if (storedPosts && post) {
          const posts = JSON.parse(storedPosts);
          const postIndex = posts.findIndex((p: any) => p._id === post._id);
          if (postIndex !== -1) {
            posts[postIndex].comments = updateCommentTree(
              posts[postIndex].comments
            );
            sessionStorage.setItem("reliva_posts", JSON.stringify(posts));
          }
        }
      } catch (e) {
        // Could not update sessionStorage
      }

      // Force a re-render by updating the post state as well
      setPost((prev) =>
        prev
          ? {
              ...prev,
              comments: updateCommentTree(prev.comments || []),
            }
          : null
      );

      // Show success message
      toast({
        title: "Reply added!",
        description: "Your reply has been added to the thread.",
        duration: 3000,
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a]">
        <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-8 max-w-4xl">
          {/* Top Spacing for Navigation */}
          <div className="h-16 sm:h-20"></div>

          {/* Back Button Skeleton */}
          <div className="mb-8 mt-6 sm:mt-8">
            <div className="w-24 h-10 bg-[#1a1a1a] rounded-lg animate-pulse"></div>
          </div>

          {/* Main Comment Skeleton */}
          <div className="mb-8 border-2 border-[#2a2a2a] bg-[#0f0f0f] rounded-lg">
            <div className="p-4 sm:p-6">
              <div className="flex items-start gap-4">
                {/* Avatar Skeleton */}
                <div className="w-12 h-12 bg-[#2a2a2a] rounded-full animate-pulse flex-shrink-0"></div>
                <div className="flex-1 min-w-0">
                  {/* Username and Timestamp Skeleton */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-32 h-5 bg-[#2a2a2a] rounded animate-pulse"></div>
                    <div className="w-16 h-5 bg-[#2a2a2a] rounded-full animate-pulse"></div>
                  </div>
                  {/* Content Skeleton */}
                  <div className="space-y-2">
                    <div className="w-full h-4 bg-[#2a2a2a] rounded animate-pulse"></div>
                    <div className="w-3/4 h-4 bg-[#2a2a2a] rounded animate-pulse"></div>
                    <div className="w-1/2 h-4 bg-[#2a2a2a] rounded animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Replies Section Skeleton */}
          <div className="space-y-6 mb-8">
            {/* Section Header Skeleton */}
            <div className="border-b border-[#2a2a2a] pb-3">
              <div className="w-32 h-6 bg-[#2a2a2a] rounded animate-pulse"></div>
            </div>

            {/* Reply Cards Skeleton */}
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="border border-[#2a2a2a] bg-[#0f0f0f] rounded-lg"
                >
                  <div className="p-5">
                    <div className="flex items-start gap-4">
                      {/* Reply Avatar Skeleton */}
                      <div className="w-10 h-10 bg-[#2a2a2a] rounded-full animate-pulse flex-shrink-0"></div>
                      <div className="flex-1 min-w-0">
                        {/* Reply Username and Timestamp Skeleton */}
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-28 h-4 bg-[#2a2a2a] rounded animate-pulse"></div>
                          <div className="w-14 h-4 bg-[#2a2a2a] rounded-full animate-pulse"></div>
                        </div>
                        {/* Reply Content Skeleton */}
                        <div className="space-y-2 mb-4">
                          <div className="w-full h-3 bg-[#2a2a2a] rounded animate-pulse"></div>
                          <div className="w-2/3 h-3 bg-[#2a2a2a] rounded animate-pulse"></div>
                        </div>
                        {/* See Replies Button Skeleton */}
                        <div className="w-24 h-6 bg-[#2a2a2a] rounded animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Reply Input Skeleton */}
          <div className="border border-[#2a2a2a] bg-[#0f0f0f] rounded-lg">
            <div className="p-5">
              <div className="flex gap-4">
                {/* Input Avatar Skeleton */}
                <div className="w-8 h-8 bg-[#2a2a2a] rounded-full animate-pulse flex-shrink-0"></div>
                <div className="flex-1">
                  {/* Input Field Skeleton */}
                  <div className="w-full h-20 bg-[#2a2a2a] rounded animate-pulse mb-3"></div>
                  {/* Button Skeleton */}
                  <div className="flex justify-end">
                    <div className="w-20 h-8 bg-[#2a2a2a] rounded animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !post || !parentComment) {
    return (
      <div className="min-h-screen bg-[#0a0a0a]">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="text-center">
            <h3 className="text-xl font-medium text-[#d0d0d0] mb-3">
              {error || "Comment not found"}
            </h3>
            <Button
              onClick={() => router.back()}
              className="bg-blue-600/80 hover:bg-blue-700/80 text-white"
            >
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="container mx-auto px-3 sm:px-4 md:px-6 py-2 sm:py-4 max-w-4xl">
        {/* Top Spacing for Navigation */}
        <div className="h-12 sm:h-16"></div>

        {/* Back Button */}
        <div className="mb-6 mt-2 sm:mt-4">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="text-[#808080] hover:text-[#c0c0c0] hover:bg-[#1a1a1a] px-2 sm:px-3 py-1.5 sm:py-2 text-sm"
          >
            <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
            <span className="hidden sm:inline">Back to Review</span>
            <span className="sm:hidden">Back</span>
          </Button>
        </div>

        {/* Main Comment */}
        <div className="mb-6 sm:mb-8 relative">
          <div className="flex items-start gap-3 sm:gap-4">
            <Avatar className="w-8 h-8 sm:w-10 sm:h-10 ring-2 ring-green-500/40 flex-shrink-0 shadow-md">
              <AvatarFallback className="bg-gradient-to-br from-green-500 to-emerald-600 text-white font-semibold text-xs sm:text-sm">
                {parentComment.authorId?.username?.charAt(0)?.toUpperCase() ||
                  "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mb-2">
                <span className="font-semibold text-sm sm:text-base text-[#f0f0f0] truncate">
                  {parentComment.authorId?.username}
                </span>
                <span className="text-[#808080] text-xs sm:text-sm">
                  {formatTime(parentComment.timestamp)}
                </span>
              </div>
              <p className="text-[#e0e0e0] text-sm leading-relaxed break-words">
                {parentComment.content}
              </p>
            </div>
          </div>
          {/* Subtle accent line */}
          <div className="absolute left-4 sm:left-5 top-8 sm:top-10 w-0.5 h-full bg-gradient-to-b from-green-500/30 to-transparent"></div>
        </div>

        {/* Replies Section */}
        <div className="mb-6 sm:mb-8">
          <h3 className="text-base sm:text-lg font-semibold text-[#e0e0e0] mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
            <div className="w-1 h-4 sm:h-5 bg-gradient-to-b from-green-500 to-emerald-500 rounded-full"></div>
            Replies ({replies.length})
          </h3>

          {replies.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <MessageCircle className="w-6 h-6 sm:w-8 sm:h-8 text-green-500/60" />
              </div>
              <h4 className="text-base sm:text-lg font-medium text-[#d0d0d0] mb-2">
                No replies yet
              </h4>
              <p className="text-[#808080] text-sm sm:text-base">
                Be the first to respond to this comment.
              </p>
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-6">
              {replies.map((reply, index) => (
                <div key={reply._id} className="relative pl-4 sm:pl-6">
                  {/* Reply line connector */}
                  <div className="absolute left-2 sm:left-3 top-4 sm:top-5 w-0.5 h-full bg-gradient-to-b from-green-500/20 to-transparent"></div>

                  <div className="flex items-start gap-2 sm:gap-3">
                    <Avatar className="w-6 h-6 sm:w-8 sm:h-8 ring-2 ring-green-500/30 flex-shrink-0 shadow-md">
                      <AvatarFallback className="bg-gradient-to-br from-green-500 to-emerald-600 text-white font-semibold text-xs">
                        {reply.authorId?.username?.charAt(0)?.toUpperCase() ||
                          "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mb-1">
                        <span className="font-medium text-xs sm:text-sm text-[#f0f0f0] truncate">
                          {reply.authorId?.username}
                        </span>
                        <span className="text-[#808080] text-xs">
                          {formatTime(reply.timestamp)}
                        </span>
                      </div>
                      <p className="text-[#e0e0e0] text-xs sm:text-sm leading-relaxed mb-2 sm:mb-3 break-words">
                        {reply.content}
                      </p>

                      <div className="flex items-center gap-3 sm:gap-4">
                        {/* See Replies Button */}
                        <Link
                          href={`/reviews/${reviewId}/thread/${reply._id}`}
                          className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-full transition-all duration-200 group text-xs"
                        >
                          <MessageCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                          <span className="font-medium">
                            {(() => {
                              const replyCount = reply.comments
                                ? reply.comments.length
                                : 0;
                              return replyCount > 0
                                ? `${replyCount} replies`
                                : "Reply";
                            })()}
                          </span>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Reply Input */}
        <div className="relative pl-4 sm:pl-6">
          <div className="flex items-start gap-2 sm:gap-3">
            <Avatar className="w-6 h-6 sm:w-8 sm:h-8 ring-2 ring-green-500/30 flex-shrink-0 shadow-md">
              <AvatarFallback className="bg-gradient-to-br from-green-500 to-emerald-600 text-white font-semibold text-xs">
                {user?.displayName?.charAt(0) || user?.email?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="bg-[#0f0f0f]/50 backdrop-blur-sm border border-[#2a2a2a]/50 rounded-lg sm:rounded-xl p-2 sm:p-3">
                <Textarea
                  value={replyInput}
                  onChange={(e) => setReplyInput(e.target.value)}
                  placeholder="Add to this thread..."
                  className="min-h-[50px] sm:min-h-[60px] border-none resize-none focus-visible:ring-0 bg-transparent text-[#e0e0e0] placeholder-[#808080] text-xs sm:text-sm"
                  disabled={isReplying}
                />
                <div className="flex justify-end pt-1.5 sm:pt-2">
                  <Button
                    onClick={handleReply}
                    disabled={!replyInput.trim() || isReplying}
                    className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-3 sm:px-4 py-1 sm:py-1.5 rounded-full font-medium transition-all duration-200 shadow-md hover:shadow-lg text-xs sm:text-sm"
                  >
                    {isReplying ? (
                      <div className="flex items-center gap-1 sm:gap-1.5">
                        <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Replying...</span>
                      </div>
                    ) : (
                      "Reply"
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
