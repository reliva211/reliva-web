import { useState, useEffect } from "react";
import { useCurrentUser } from "./use-current-user";

export function useOnboardingStatus() {
  const { user, loading } = useCurrentUser();
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!user || loading) {
        setChecking(false);
        return;
      }

      try {
        const response = await fetch(
          `/api/onboarding/status?userId=${user.uid}`
        );
        if (response.ok) {
          const data = await response.json();
          setOnboardingCompleted(data.onboardingCompleted);
        }
      } catch (error) {
        console.error("Error checking onboarding status:", error);
      } finally {
        setChecking(false);
      }
    };

    checkOnboardingStatus();
  }, [user, loading]);

  return { onboardingCompleted, checking };
}
