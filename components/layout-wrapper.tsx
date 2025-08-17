"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/header";
import Footer from "@/components/footer";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Toaster } from "@/components/ui/toaster";

interface LayoutWrapperProps {
  children: React.ReactNode;
}

export default function LayoutWrapper({ children }: LayoutWrapperProps) {
  const pathname = usePathname();
  const isLandingPage = pathname === "/";
  const { user } = useCurrentUser();

  // Don't show footer for authenticated users
  const shouldShowFooter = !user;

  return (
    <div className="flex min-h-screen w-full overflow-x-hidden">
      <Sidebar isLandingPage={isLandingPage} />
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        <main className="flex-1 w-full max-w-full overflow-x-hidden main-content">
          {children}
        </main>
        {shouldShowFooter && <Footer />}
      </div>
      <Toaster />
    </div>
  );
}
