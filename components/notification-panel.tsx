"use client";

import { useState, useEffect, useRef } from "react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { OtherUserAvatar } from "@/components/user-avatar";
import { Bell, Check, Heart, MessageCircle, Star, Users, X } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

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

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationPanel({ isOpen, onClose }: NotificationPanelProps) {
  const { user } = useCurrentUser();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userProfiles, setUserProfiles] = useState<Map<string, UserProfile>>(new Map());
  const panelRef = useRef<HTMLDivElement>(null);

  // Function to fetch user profile for a given Firebase UID directly
  const fetchUserProfile = async (firebaseUID: string) => {
    if (userProfiles.has(firebaseUID)) return userProfiles.get(firebaseUID);

    try {
      const { doc, getDoc } = await import("firebase/firestore");
      const { db } = await import("@/lib/firebase");

      const userProfileRef = doc(db, "userProfiles", firebaseUID);
      const userProfileSnap = await getDoc(userProfileRef);

      if (userProfileSnap.exists()) {
        const userData = userProfileSnap.data();
        const userProfile = {
          _id: firebaseUID,
          username: userData.username || userData.displayName || "Unknown User",
          displayName: userData.displayName || userData.username || "Unknown User",
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
    if (!user || !isOpen) {
      setLoading(false);
      return;
    }

    try {
      const notificationsRef = collection(db, "notifications");
      const q = query(
        notificationsRef,
        where("toUserId", "==", user.uid)
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          try {
            const notificationsData = snapshot.docs.map((doc) => {
              const data = doc.data();
              
              let bestTimestamp = data.createdAt || data.timestamp;
              
              if (!bestTimestamp) {
                bestTimestamp = new Date().toISOString();
              }
              
              return {
                id: doc.id,
                ...data,
                isRead: data.isRead ?? false,
                fromUserName: data.fromUserName || "Anonymous",
                message: data.message || "",
                type: data.type || "follow",
                createdAt: bestTimestamp,
              } as Notification;
            });

            // Sort client-side by createdAt in descending order
            notificationsData.sort((a, b) => {
              try {
                let dateA: Date, dateB: Date;
                
                if (a.createdAt?.toDate) {
                  dateA = a.createdAt.toDate();
                } else if (typeof a.createdAt === "string") {
                  dateA = new Date(a.createdAt);
                } else if (a.createdAt instanceof Date) {
                  dateA = a.createdAt;
                } else {
                  dateA = new Date(a.createdAt);
                }
                
                if (b.createdAt?.toDate) {
                  dateB = b.createdAt.toDate();
                } else if (typeof b.createdAt === "string") {
                  dateB = new Date(b.createdAt);
                } else if (b.createdAt instanceof Date) {
                  dateB = b.createdAt;
                } else {
                  dateB = new Date(b.createdAt);
                }
                
                if (isNaN(dateA.getTime())) {
                  dateA = new Date(0);
                }
                
                if (isNaN(dateB.getTime())) {
                  dateB = new Date(0);
                }
                
                const timeDiff = dateB.getTime() - dateA.getTime();
                if (timeDiff !== 0) {
                  return timeDiff;
                }
                
                const typeOrder = { follow: 0, like: 1, comment: 2, review: 3 };
                const typeA = typeOrder[a.type as keyof typeof typeOrder] ?? 4;
                const typeB = typeOrder[b.type as keyof typeof typeOrder] ?? 4;
                
                return typeA - typeB;
              } catch (error) {
                console.error("Error sorting notifications:", error);
                return 0;
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
  }, [user, isOpen]);

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
          return Promise.resolve();
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
        return <Users className="h-4 w-4 text-blue-500" />;
      case "like":
        return <Heart className="h-4 w-4 text-red-500" />;
      case "comment":
        return <MessageCircle className="h-4 w-4 text-green-500" />;
      case "review":
        return <Star className="h-4 w-4 text-yellow-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return "Just now";

    try {
      let date: Date;

      if (timestamp.toDate) {
        date = timestamp.toDate();
      } else if (typeof timestamp === "string") {
        date = new Date(timestamp);
      } else if (timestamp instanceof Date) {
        date = timestamp;
      } else {
        date = new Date(timestamp);
      }

      if (isNaN(date.getTime())) {
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
    if (!notification.isRead) {
      markAsRead(notification.id);
    }

    if (notification.actionUrl) {
      try {
        window.location.href = notification.actionUrl;
      } catch (error) {
        console.error("Error navigating to action URL:", error);
      }
    }
  };

  // Close panel when clicking outside and prevent body scroll
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      // Prevent body scroll when panel is open
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      // Restore body scroll when panel is closed
      document.body.style.overflow = 'unset';
      document.body.style.position = 'unset';
      document.body.style.width = 'unset';
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      // Cleanup: restore body scroll on unmount
      document.body.style.overflow = 'unset';
      document.body.style.position = 'unset';
      document.body.style.width = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes slideUp {
          from {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          to {
            opacity: 0;
            transform: translateY(-20px) scale(0.95);
          }
        }
      `}</style>
      <div className="fixed inset-0 z-50">
      {/* Backdrop for mobile only */}
      <div 
        className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm transition-all duration-300 ease-in-out" 
        onClick={onClose}
        style={{
          animation: 'fadeIn 0.3s ease-in-out'
        }}
      />
      
      {/* Panel */}
      <div
        ref={panelRef}
        className="fixed top-12 right-4 lg:right-auto lg:left-72 lg:top-0 h-[50vh] lg:h-full w-80 lg:w-96 bg-gray-900/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-700/50 shadow-2xl transform transition-all duration-300 ease-in-out flex flex-col rounded-xl lg:rounded-none lg:translate-x-0"
        style={{
          animation: isOpen ? 'slideDown 0.3s ease-out' : 'slideUp 0.3s ease-in'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 lg:p-4 border-b border-gray-700/50 bg-gray-800/60 backdrop-blur-sm rounded-t-xl lg:rounded-t-none">
          <h2 className="text-base lg:text-lg font-semibold text-white">
            Notifications
          </h2>
          <div className="flex items-center gap-2">
            {notifications.some((n) => !n.isRead) && (
              <Button
                onClick={markAllAsRead}
                size="sm"
                variant="ghost"
                className="text-xs bg-gray-700/60 hover:bg-gray-600/70 text-white border border-gray-600/50 backdrop-blur-sm"
              >
                <Check className="h-3 w-3 mr-1" />
                Mark all read
              </Button>
            )}
            <Button
              onClick={onClose}
              size="sm"
              variant="ghost"
              className="lg:hidden bg-gray-700/60 hover:bg-gray-600/70 text-white border border-gray-600/50 backdrop-blur-sm"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div 
          className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800 hover:scrollbar-thumb-gray-500 min-h-0 rounded-b-xl lg:rounded-b-none"
          style={{ 
            WebkitOverflowScrolling: 'touch',
            scrollBehavior: 'smooth'
          }}
        >
          <div className="p-3 lg:p-4">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto mb-4"></div>
                <p className="text-gray-400 text-sm">
                  Loading notifications...
                </p>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-red-900/40 backdrop-blur-sm border border-red-800/60 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bell className="h-6 w-6 text-red-500" />
                </div>
                <h3 className="text-sm font-semibold text-white mb-2">
                  Error Loading Notifications
                </h3>
                <p className="text-gray-400 text-xs mb-4">
                  {error}
                </p>
                <Button
                  onClick={() => window.location.reload()}
                  size="sm"
                  className="text-xs bg-gray-700/60 hover:bg-gray-600/70 text-white border border-gray-600/50 backdrop-blur-sm"
                >
                  Try Again
                </Button>
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-gray-800/60 backdrop-blur-sm border border-gray-700/60 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bell className="h-6 w-6 text-gray-400" />
                </div>
                <h3 className="text-sm font-semibold text-white mb-2">
                  No notifications yet
                </h3>
                <p className="text-gray-400 text-xs">
                  When you interact with the community, your notifications will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-2 lg:space-y-3 pb-4">
                {notifications.slice(0, 20).map((notification) => {
                  const userProfile = userProfiles.get(notification.fromUserId);
                  const displayName = userProfile?.displayName || notification.fromUserName || "Anonymous";
                  const username = userProfile?.username || notification.fromUserName || "Anonymous";
                  const avatarUrl = userProfile?.avatarUrl || notification.fromUserAvatar;
                  
                  return (
                    <div
                      key={notification.id}
                      className={`p-2 lg:p-3 rounded-lg cursor-pointer transition-all duration-200 hover:bg-gray-800/60 backdrop-blur-sm border border-transparent hover:border-gray-600/50 ${
                        !notification.isRead
                          ? "bg-emerald-900/40 border-l-2 border-emerald-500/80"
                          : ""
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start space-x-3">
                        <OtherUserAvatar
                          authorId={notification.fromUserId}
                          username={username}
                          displayName={displayName}
                          avatarUrl={avatarUrl}
                          size="sm"
                          className="flex-shrink-0"
                          clickable={false}
                        />

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {getNotificationIcon(notification.type)}
                            <span className="font-medium text-white text-sm">
                              {displayName}
                            </span>
                            {!notification.isRead && (
                              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full shadow-sm"></span>
                            )}
                          </div>

                          <p className="text-gray-300 text-xs mb-1 line-clamp-2">
                            {notification.message}
                          </p>

                          <p className="text-xs text-gray-400">
                            {formatTimestamp(notification.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
      </div>
    </>
  );
}
