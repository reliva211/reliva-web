"use client";

import { useState, useEffect } from "react";

// Force dynamic rendering to prevent prerender issues
export const dynamic = "force-dynamic";
export const revalidate = 0;
import { useCurrentUser } from "@/hooks/use-current-user";
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

export default function NotificationsPage() {
  const { user } = useCurrentUser();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
              return {
                id: doc.id,
                ...data,
                // Ensure required fields have defaults
                isRead: data.isRead ?? false,
                fromUserName: data.fromUserName || "Anonymous",
                message: data.message || "",
                type: data.type || "follow",
                createdAt: data.createdAt || new Date().toISOString(),
              } as Notification;
            });

            // Sort client-side by createdAt in descending order
            notificationsData.sort((a, b) => {
              const dateA = new Date(a.createdAt).getTime();
              const dateB = new Date(b.createdAt).getTime();
              return dateB - dateA; // Descending order
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
        return "Just now";
      }

      const now = new Date();
      const diffInHours = Math.floor(
        (now.getTime() - date.getTime()) / (1000 * 60 * 60)
      );

      if (diffInHours < 1) return "Just now";
      if (diffInHours < 24) return `${diffInHours}h ago`;
      if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
      return date.toLocaleDateString();
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
            notifications.map((notification) => (
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
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center text-white font-semibold flex-shrink-0">
                      {notification.fromUserName?.charAt(0) || "U"}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {getNotificationIcon(notification.type)}
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {notification.fromUserName || "Anonymous"}
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
            ))
          )}
        </div>
      </div>
    </div>
  );
}
