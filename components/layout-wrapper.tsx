"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/header";
import Footer from "@/components/footer";
import { useCurrentUser } from "@/hooks/use-current-user";

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
    <div className="flex min-h-screen">
      <Sidebar isLandingPage={isLandingPage} />
      <div className="flex-1 flex flex-col">
        <main className="flex-1 py-4 sm:py-6 lg:py-8">{children}</main>
        {shouldShowFooter && <Footer />}
      </div>
    </div>
  );
}
