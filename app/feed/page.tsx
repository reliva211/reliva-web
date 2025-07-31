"use client";

import React, { useState, useEffect } from "react";
import { Loader2, Users, Heart } from "lucide-react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useCurrentUser } from "@/hooks/use-current-user";
import FeedPost, { Post } from "@/components/feed-post";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

const FeedPage: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [followingUsers, setFollowingUsers] = useState<string[]>([]);
  const { user: currentUser } = useCurrentUser();

  useEffect(() => {
    if (currentUser) {
      loadFollowingUsers();
    }
  }, [currentUser]);

  useEffect(() => {
    if (followingUsers.length > 0) {
      const unsubscribe = setupFeedListener();
      return unsubscribe;
    } else {
      setLoading(false);
    }
  }, [followingUsers]);

  const loadFollowingUsers = async () => {
    if (!currentUser) return;

    try {
      const userDoc = await getDoc(doc(db, "users", currentUser.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const following = userData.following || [];
        setFollowingUsers(following);
      }
    } catch (error) {
      console.error("Error loading following users:", error);
      setLoading(false);
    }
  };

  const setupFeedListener = () => {
    const postsRef = collection(db, "posts");
    const feedQuery = query(
      postsRef,
      where("authorId", "in", followingUsers),
      orderBy("createdAt", "desc")
    );

    return onSnapshot(
      feedQuery,
      (snapshot) => {
        const feedPosts: Post[] = [];
        snapshot.forEach((doc) => {
          feedPosts.push({
            id: doc.id,
            ...doc.data(),
          } as Post);
        });
        setPosts(feedPosts);
        setLoading(false);
      },
      (error) => {
        console.error("Error listening to feed:", error);
        setLoading(false);
      }
    );
  };

  const handleLike = async (postId: string) => {
    // Implementation for liking posts would go here
    console.log("Like post:", postId);
  };

  const handleComment = async (postId: string) => {
    // Implementation for commenting would go here
    console.log("Comment on post:", postId);
  };

  if (!currentUser) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-muted-foreground">Please log in to view your feed.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading your feed...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Your Feed</h1>
        <p className="text-muted-foreground">
          See what people you follow are rating and reviewing
        </p>
      </div>

      {followingUsers.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No one followed yet</h3>
            <p className="text-muted-foreground mb-4">
              Start following people to see their reviews and ratings in your feed.
            </p>
            <Link
              href="/search"
              className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Find People to Follow
            </Link>
          </CardContent>
        </Card>
      ) : posts.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
            <p className="text-muted-foreground">
              The people you follow haven't posted any reviews or ratings yet.
              Check back later!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => (
            <FeedPost
              key={post.id}
              post={post}
              onLike={handleLike}
              onComment={handleComment}
              currentUserId={currentUser.uid}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default FeedPage;
