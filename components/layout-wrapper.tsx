"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/header";
import Footer from "@/components/footer";

import { useCurrentUser } from "@/hooks/use-current-user";
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
  const { user } = useCurrentUser();

  // Don't show footer for authenticated users, login, or signup pages
  const shouldShowFooter = !user && !isLoginPage && !isSignupPage;

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
