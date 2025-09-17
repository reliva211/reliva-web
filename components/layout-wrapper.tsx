"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/header";
import Footer from "@/components/footer";

import { useCurrentUser } from "@/hooks/use-current-user";
import { useSyncFriends } from "@/hooks/use-sync-friends";
import { Toaster } from "@/components/ui/toaster";
import YouTubePlayer from "@/components/youtube-player";
import VideoPlayer from "@/components/video-player";

interface LayoutWrapperProps {
  children: React.ReactNode;
}

export default function LayoutWrapper({ children }: LayoutWrapperProps) {
  const pathname = usePathname();
  const isLandingPage = pathname === "/";
  const isLoginPage = pathname === "/login";
  const isSignupPage = pathname === "/signup";
  const isOnboardingPage = pathname === "/onboarding";
  const { user } = useCurrentUser();

  // Automatically sync friends when user's following list changes
  useSyncFriends();

  // Don't show footer for authenticated users, login, or signup pages
  const shouldShowFooter = !user && !isLoginPage && !isSignupPage;

  // For onboarding page, render full-screen without sidebar
  if (isOnboardingPage) {
    return (
      <div className="min-h-screen w-full">
        <main className="w-full h-full">{children}</main>
        <Toaster />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full overflow-x-hidden">
      <Sidebar isLandingPage={isLandingPage} />
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        <main className="flex-1 w-full max-w-full overflow-x-hidden main-content pt-24 lg:pt-0">
          {children}
        </main>
        {shouldShowFooter && <Footer />}
      </div>

      <Toaster />

      {/* YouTube Player - Persistent across all pages */}
      <YouTubePlayer />

      {/* Video Player - Persistent across all pages */}
      <VideoPlayer />
    </div>
  );
}
