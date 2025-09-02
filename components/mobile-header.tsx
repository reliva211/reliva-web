"use client";

import { Menu, Bell, Users, ChevronDown } from "lucide-react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useNotifications } from "@/hooks/use-notifications";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useState, useEffect, useRef } from "react";

interface MobileHeaderProps {
  onMenuClick: () => void;
}

export default function MobileHeader({ onMenuClick }: MobileHeaderProps) {
  const { user } = useCurrentUser();
  const { unreadCount } = useNotifications();
  const pathname = usePathname();
  const router = useRouter();
  const [showDiscoverDropdown, setShowDiscoverDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDiscoverDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const discoverOptions = [
    { href: "/music", label: "Music" },
    { href: "/movies", label: "Movies" },
    { href: "/series", label: "Series" },
    { href: "/books", label: "Books" },
  ];

  const navItems = [
    {
      href: "/reviews",
      label: "Home",
      isActive: pathname === "/reviews" || pathname === "/",
    },
    {
      href: "/music",
      label: "Discover",
      isActive:
        pathname.startsWith("/music") ||
        pathname.startsWith("/movies") ||
        pathname.startsWith("/books") ||
        pathname.startsWith("/series"),
      hasDropdown: true,
    },
    {
      href: "/recommendations",
      label: "Recommendations",
      isActive: pathname === "/recommendations",
    },
    { href: "/profile", label: "Profile", isActive: pathname === "/profile" },
  ];

  return (
    <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      {/* Header */}
      <div className="flex items-center gap-4 px-4 py-3">
        {/* Hamburger Menu */}
        <button
          onClick={onMenuClick}
          className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
        >
          <Menu className="h-5 w-5 text-gray-700 dark:text-gray-300" />
        </button>

        {/* App Title */}
        <h1 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          Reliva
          <span className="text-xs text-gray-900 dark:text-white px-2 py-0.5 rounded-full border border-gray-900 dark:border-white font-medium">
            BETA
          </span>
        </h1>

        {/* Spacer to push icons to the right */}
        <div className="flex-1"></div>

        {/* Right Icons */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <button
            onClick={() => router.push("/notifications")}
            className="relative p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
          >
            <Bell className="h-5 w-5 text-gray-700 dark:text-gray-300" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {/* User Profile */}
          <button
            onClick={() => router.push("/users")}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
          >
            <Users className="h-5 w-5 text-gray-700 dark:text-gray-300" />
          </button>
        </div>
      </div>

      {/* Navigation Bar */}
      <div
        ref={dropdownRef}
        className="flex justify-evenly bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 relative"
      >
        {navItems.map((item) => (
          <div key={item.href} className="relative">
            {item.hasDropdown ? (
              <>
                <button
                  onClick={() => setShowDiscoverDropdown(!showDiscoverDropdown)}
                  className={cn(
                    "py-3 px-3 text-base font-medium transition-colors duration-200 text-center flex items-center justify-center gap-1",
                    item.isActive
                      ? "text-gray-900 dark:text-white"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                  )}
                >
                  {item.label}
                  <ChevronDown className="h-3 w-3" />
                </button>

                {/* Discover Dropdown */}
                {showDiscoverDropdown && (
                  <div className="absolute top-full left-0 right-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
                    {discoverOptions.map((option) => (
                      <Link
                        key={option.href}
                        href={option.href}
                        onClick={() => setShowDiscoverDropdown(false)}
                        className="block py-2 px-3 text-base text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 first:rounded-t-lg last:rounded-b-lg text-center"
                      >
                        {option.label}
                      </Link>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <Link
                href={item.href}
                className={cn(
                  "block py-3 px-3 text-base font-medium transition-colors duration-200 text-center",
                  item.isActive
                    ? "text-gray-900 dark:text-white"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                )}
              >
                {item.label}
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
