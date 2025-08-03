import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useCurrentUser } from "./use-current-user";

export function useNotifications() {
  const { user } = useCurrentUser();
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      setLoading(false);
      setError(null);
      return;
    }

    try {
      const notificationsRef = collection(db, "notifications");
      const q = query(
        notificationsRef,
        where("toUserId", "==", user.uid),
        where("isRead", "==", false)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        try {
          setUnreadCount(snapshot.docs.length);
          setError(null);
        } catch (err) {
          console.error("Error processing notification count:", err);
          setError("Error processing notifications");
        } finally {
          setLoading(false);
        }
      }, (error) => {
        console.error("Error listening to notifications:", error);
        setError("Error loading notifications");
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (err) {
      console.error("Error setting up notifications listener:", err);
      setError("Error setting up notifications");
      setLoading(false);
    }
  }, [user]);

  return { unreadCount, loading, error };
} 