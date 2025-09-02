"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Home, Compass, TrendingUp, User } from "lucide-react";

export default function MobileBottomNav() {
  const pathname = usePathname();

  const navItems = [
    {
      href: "/reviews",
      label: "home",
      icon: Home,
      isActive: pathname === "/reviews" || pathname === "/",
    },
    {
      href: "/music",
      label: "discover",
      icon: Compass,
      isActive:
        pathname.startsWith("/music") ||
        pathname.startsWith("/movies") ||
        pathname.startsWith("/books") ||
        pathname.startsWith("/series"),
    },
    {
      href: "/recommendations",
      label: "recommendation",
      icon: TrendingUp,
      isActive: pathname === "/recommendations",
    },
    {
      href: "/profile",
      label: "profile",
      icon: User,
      isActive: pathname === "/profile",
    },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
      <div className="flex items-center justify-evenly py-3 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all duration-200 min-w-0 flex-1",
                item.isActive
                  ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              )}
            >
              <Icon className="h-6 w-6 mb-1.5" />
              <span className="text-xs font-medium truncate leading-tight">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
