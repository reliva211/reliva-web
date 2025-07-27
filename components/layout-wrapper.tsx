"use client";

import { usePathname } from "next/navigation";
import Header from "@/components/header";
import Footer from "@/components/footer";

interface LayoutWrapperProps {
  children: React.ReactNode;
}

export default function LayoutWrapper({ children }: LayoutWrapperProps) {
  const pathname = usePathname();
  const isLandingPage = pathname === "/";

  return (
    <div className="flex min-h-screen flex-col">
      <Header isLandingPage={isLandingPage} />
      <main className="flex-grow pt-16">{children}</main>
      <Footer />
    </div>
  );
}
