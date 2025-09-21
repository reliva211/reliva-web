import { useEffect } from "react";
import { useCurrentUser } from "./use-current-user";
import { useUserConnections } from "./use-user-connections";

export function useSyncFriends() {
  const { user } = useCurrentUser();
  const { following } = useUserConnections();

  useEffect(() => {
    const syncFriends = async () => {
      if (!user || following.length === 0) return;

      try {
        const response = await fetch("/api/onboarding/update-friends", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            firebaseUserId: user.uid,
          }),
        });

        if (!response.ok) {
          console.error("Failed to sync friends");
        }
      } catch (error) {
        console.error("Error syncing friends:", error);
      }
    };

    // Sync friends when following list changes
    syncFriends();
  }, [user, following.length]); // Trigger when following count changes

  return null; // This hook doesn't return anything, it just syncs data
}

