"use client";

import { useState, useEffect, useRef } from "react";

// Force dynamic rendering to prevent prerender issues
export const dynamic = "force-dynamic";
import { useCurrentUser } from "@/hooks/use-current-user";
import { OtherUserAvatar } from "@/components/user-avatar";
import { Bell, Check, Heart, MessageCircle, Star, Users } from "lucide-react";
import {
  collection,
  query,
  where,
  updateDoc,
  doc,
  onSnapshot,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Notification {
  id: string;
  type: "follow" | "like" | "comment" | "review";
  message: string;
  timestamp?: any;
  isRead: boolean;
  fromUserId: string;
  toUserId: string;
  fromUserName: string;
  fromUserAvatar?: string;
  actionUrl?: string;
  createdAt: string | Timestamp;
}

interface UserProfile {
  _id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  email: string | null;
  bio: string | null;
}

export default function NotificationsPage() {
  const { user } = useCurrentUser();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userProfiles, setUserProfiles] = useState<Map<string, UserProfile>>(new Map());

  // Function to fetch user profile for a given Firebase UID directly
  const fetchUserProfile = async (firebaseUID: string) => {
    if (userProfiles.has(firebaseUID)) return userProfiles.get(firebaseUID);

    try {
      // Import Firebase functions dynamically to avoid SSR issues
      const { doc, getDoc } = await import("firebase/firestore");
      const { db } = await import("@/lib/firebase");

      // Fetch the user profile using Firebase UID directly
      const userProfileRef = doc(db, "userProfiles", firebaseUID);
      const userProfileSnap = await getDoc(userProfileRef);

      if (userProfileSnap.exists()) {
        const userData = userProfileSnap.data();
        const userProfile = {
          _id: firebaseUID,
          username:
            userData.username || userData.displayName || "Unknown User",
          displayName:
            userData.displayName || userData.username || "Unknown User",
          avatarUrl: userData.avatarUrl || null,
          email: userData.email || null,
          bio: userData.bio || null,
        };
        setUserProfiles((prev) => new Map(prev.set(firebaseUID, userProfile)));
        return userProfile;
      }
    } catch (error) {
      console.error("Error fetching user profile from Firebase:", error);
    }
    return null;
  };

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const notificationsRef = collection(db, "notifications");
      const q = query(
        notificationsRef,
        where("toUserId", "==", user.uid)
        // Removed orderBy to avoid composite index requirement
        // We'll sort client-side instead
      );

      // Real-time listener for notifications
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          try {
            const notificationsData = snapshot.docs.map((doc) => {
              const data = doc.data();
              
              // Determine the best timestamp to use
              let bestTimestamp = data.createdAt || data.timestamp;
              
              // If no timestamp exists, use document creation time as fallback
              if (!bestTimestamp) {
                bestTimestamp = new Date().toISOString();
              }
              
              return {
                id: doc.id,
                ...data,
                // Ensure required fields have defaults
                isRead: data.isRead ?? false,
                fromUserName: data.fromUserName || "Anonymous",
                message: data.message || "",
                type: data.type || "follow",
                createdAt: bestTimestamp,
              } as Notification;
            });

            // Sort client-side by createdAt in descending order (most recent first)
            notificationsData.sort((a, b) => {
              try {
                let dateA: Date, dateB: Date;
                
                // Handle different timestamp formats for dateA
                if (a.createdAt?.toDate) {
                  // Firestore Timestamp
                  dateA = a.createdAt.toDate();
                } else if (typeof a.createdAt === "string") {
                  // ISO string
                  dateA = new Date(a.createdAt);
                } else if (a.createdAt instanceof Date) {
                  // Date object
                  dateA = a.createdAt;
                } else {
                  // Try to parse as number or other format
                  dateA = new Date(a.createdAt);
                }
                
                // Handle different timestamp formats for dateB
                if (b.createdAt?.toDate) {
                  // Firestore Timestamp
                  dateB = b.createdAt.toDate();
                } else if (typeof b.createdAt === "string") {
                  // ISO string
                  dateB = new Date(b.createdAt);
                } else if (b.createdAt instanceof Date) {
                  // Date object
                  dateB = b.createdAt;
                } else {
                  // Try to parse as number or other format
                  dateB = new Date(b.createdAt);
                }
                
                // Check for invalid dates
                if (isNaN(dateA.getTime())) {
                  console.warn("Invalid date for notification A:", a.createdAt);
                  dateA = new Date(0); // Use epoch as fallback
                }
                
                if (isNaN(dateB.getTime())) {
                  console.warn("Invalid date for notification B:", b.createdAt);
                  dateB = new Date(0); // Use epoch as fallback
                }
                
                // Primary sort by timestamp (newest first)
                const timeDiff = dateB.getTime() - dateA.getTime();
                if (timeDiff !== 0) {
                  return timeDiff;
                }
                
                // Secondary sort by notification type for consistent ordering
                const typeOrder = { follow: 0, like: 1, comment: 2, review: 3 };
                const typeA = typeOrder[a.type as keyof typeof typeOrder] ?? 4;
                const typeB = typeOrder[b.type as keyof typeof typeOrder] ?? 4;
                
                return typeA - typeB;
              } catch (error) {
                console.error("Error sorting notifications:", error);
                return 0; // Keep original order if sorting fails
              }
            });

            setNotifications(notificationsData);
            setError(null);
          } catch (err) {
            console.error("Error processing notifications:", err);
            setError("Error loading notifications");
          } finally {
            setLoading(false);
          }
        },
        (error) => {
          console.error("Error fetching notifications:", error);
          setError("Error loading notifications");
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.error("Error setting up notifications listener:", err);
      setError("Error setting up notifications");
      setLoading(false);
    }
  }, [user]);

  // Mark all notifications as read when page is visited
  useEffect(() => {
    if (!user || notifications.length === 0) return;

    const markAllAsReadOnVisit = async () => {
      try {
        const unreadNotifications = notifications.filter((n) => !n.isRead);
        if (unreadNotifications.length === 0) return;

        const updatePromises = unreadNotifications.map((notif) => {
          try {
            return updateDoc(doc(db, "notifications", notif.id), {
              isRead: true,
            });
          } catch (err) {
            console.error(`Error updating notification ${notif.id}:`, err);
            return Promise.resolve(); // Continue with other updates
          }
        });

        await Promise.all(updatePromises);
      } catch (error) {
        console.error("Error marking notifications as read on visit:", error);
      }
    };

    markAllAsReadOnVisit();
  }, [user, notifications]);

  // Fetch user profiles when notifications change
  useEffect(() => {
    const fetchAllUserProfiles = async () => {
      const uniqueUserIds = Array.from(new Set(notifications.map(notif => notif.fromUserId)));
      
      for (const uid of uniqueUserIds) {
        await fetchUserProfile(uid);
      }
    };

    if (notifications.length > 0) {
      fetchAllUserProfiles();
    }
  }, [notifications]);

  const markAsRead = async (notificationId: string) => {
    try {
      const notificationRef = doc(db, "notifications", notificationId);
      await updateDoc(notificationRef, { isRead: true });
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter((n) => !n.isRead);
      if (unreadNotifications.length === 0) return;

      const updatePromises = unreadNotifications.map((notif) => {
        try {
          return updateDoc(doc(db, "notifications", notif.id), {
            isRead: true,
          });
        } catch (err) {
          console.error(`Error updating notification ${notif.id}:`, err);
          return Promise.resolve(); // Continue with other updates
        }
      });

      await Promise.all(updatePromises);
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "follow":
        return <Users className="h-5 w-5 text-blue-500" />;
      case "like":
        return <Heart className="h-5 w-5 text-red-500" />;
      case "comment":
        return <MessageCircle className="h-5 w-5 text-green-500" />;
      case "review":
        return <Star className="h-5 w-5 text-yellow-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return "Just now";

    try {
      let date: Date;

      if (timestamp.toDate) {
        // Firestore Timestamp
        date = timestamp.toDate();
      } else if (typeof timestamp === "string") {
        // ISO string
        date = new Date(timestamp);
      } else if (timestamp instanceof Date) {
        // Date object
        date = timestamp;
      } else {
        // Try to parse as number or other format
        date = new Date(timestamp);
      }

      if (isNaN(date.getTime())) {
        console.warn("Invalid timestamp for formatting:", timestamp);
        return "Just now";
      }

      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
      const diffInMinutes = Math.floor(diffInSeconds / 60);
      const diffInHours = Math.floor(diffInMinutes / 60);
      const diffInDays = Math.floor(diffInHours / 24);

      if (diffInSeconds < 60) return "Just now";
      if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
      if (diffInHours < 24) return `${diffInHours}h ago`;
      if (diffInDays < 7) return `${diffInDays}d ago`;
      if (diffInDays < 30) return `${Math.floor(diffInDays / 7)}w ago`;
      if (diffInDays < 365) return `${Math.floor(diffInDays / 30)}mo ago`;
      return `${Math.floor(diffInDays / 365)}y ago`;
    } catch (error) {
      console.error("Error formatting timestamp:", error);
      return "Just now";
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read when clicked
    if (!notification.isRead) {
      markAsRead(notification.id);
    }

    // Navigate to action URL if available
    if (notification.actionUrl) {
      try {
        window.location.href = notification.actionUrl;
      } catch (error) {
        console.error("Error navigating to action URL:", error);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-black dark:to-gray-900">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">
              Loading notifications...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-black dark:to-gray-900">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900 dark:to-red-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <Bell className="h-10 w-10 text-red-500 dark:text-red-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Error Loading Notifications
            </h3>
            <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-4">
              {error}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-black dark:to-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Notifications
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Stay updated with your community activity
            </p>
          </div>

          {notifications.some((n) => !n.isRead) && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
            >
              <Check className="h-4 w-4" />
              <span className="text-sm font-medium">Mark all as read</span>
            </button>
          )}
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {notifications.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
                <Bell className="h-10 w-10 text-gray-400 dark:text-gray-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No notifications yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                When you interact with the community, your notifications will
                appear here.
              </p>
            </div>
          ) : (
            notifications.map((notification) => {
              const userProfile = userProfiles.get(notification.fromUserId);
              const displayName = userProfile?.displayName || notification.fromUserName || "Anonymous";
              const username = userProfile?.username || notification.fromUserName || "Anonymous";
              const avatarUrl = userProfile?.avatarUrl || notification.fromUserAvatar;
              
              return (
                <div
                  key={notification.id}
                  className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 transition-all duration-300 cursor-pointer hover:shadow-xl ${
                    !notification.isRead
                      ? "ring-2 ring-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-900/10"
                      : ""
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <OtherUserAvatar
                        authorId={notification.fromUserId}
                        username={username}
                        displayName={displayName}
                        avatarUrl={avatarUrl}
                        size="md"
                        className="flex-shrink-0"
                        clickable={true}
                      />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {getNotificationIcon(notification.type)}
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {displayName}
                          </span>
                          {!notification.isRead && (
                            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                          )}
                        </div>

                        <p className="text-gray-700 dark:text-gray-300 mb-2">
                          {notification.message}
                        </p>

                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {formatTimestamp(notification.createdAt)}
                        </p>
                      </div>
                    </div>

                    {!notification.isRead && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(notification.id);
                        }}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 hover:scale-110"
                        title="Mark as read"
                      >
                        <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
