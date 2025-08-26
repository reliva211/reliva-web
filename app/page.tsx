"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/hooks/use-current-user";

export default function LandingPage() {
  const { user, loading } = useCurrentUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        // User is authenticated, redirect to reviews page
        router.push("/reviews");
      } else {
        // User is not authenticated, redirect to login page
        router.push("/login");
      }
    }
  }, [user, loading, router]);

  // Show spinner while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500 dark:border-emerald-400"></div>
    </div>
  );
}
