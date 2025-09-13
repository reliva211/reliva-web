"use client";

import { Menu, Bell, Users, ChevronDown } from "lucide-react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useNotifications } from "@/hooks/use-notifications";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useState, useEffect, useRef } from "react";
import NotificationPanel from "@/components/notification-panel";

interface MobileHeaderProps {
  onMenuClick: () => void;
}

export default function MobileHeader({ onMenuClick }: MobileHeaderProps) {
  const { user } = useCurrentUser();
  const { unreadCount } = useNotifications();
  const pathname = usePathname();
  const router = useRouter();
  const [showDiscoverDropdown, setShowDiscoverDropdown] = useState(false);
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);
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
    <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-gray-900 dark:bg-black border-b border-gray-700 dark:border-gray-800">
      {/* Header */}
      <div className="flex items-center gap-4 px-4 py-3">
        {/* Hamburger Menu */}
        <button
          onClick={onMenuClick}
          className="p-2 rounded-lg bg-gray-900 dark:bg-black hover:bg-gray-800 dark:hover:bg-gray-900 transition-colors duration-200"
        >
          <Menu className="h-5 w-5 text-white dark:text-white" />
        </button>

        {/* App Title */}
        <h1 className="text-lg font-semibold text-white dark:text-white flex items-center gap-2">
          Reliva
          <span className="text-xs text-white dark:text-white px-2 py-0.5 rounded-full border border-white dark:border-white font-medium">
            BETA
          </span>
        </h1>

        {/* Spacer to push icons to the right */}
        <div className="flex-1"></div>

        {/* Right Icons */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <button
            onClick={() => setShowNotificationPanel(true)}
            className="relative p-2 rounded-lg bg-gray-900 dark:bg-black hover:bg-gray-800 dark:hover:bg-gray-900 transition-colors duration-200"
          >
            {/* Show badge instead of icon when there are notifications */}
            {unreadCount > 0 ? (
              <div className="h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-semibold">
                {unreadCount > 99 ? "99+" : unreadCount}
              </div>
            ) : (
              <Bell className="h-5 w-5 text-white dark:text-white" />
            )}
          </button>

          {/* User Profile */}
          <button
            onClick={() => router.push("/users")}
            className="p-2 rounded-lg bg-gray-900 dark:bg-black hover:bg-gray-800 dark:hover:bg-gray-900 transition-colors duration-200"
          >
            <Users className="h-5 w-5 text-white dark:text-white" />
          </button>
        </div>
      </div>

      {/* Navigation Bar */}
      <div
        ref={dropdownRef}
        className="flex justify-evenly bg-gray-900 dark:bg-black border-b border-gray-700 dark:border-gray-800 relative"
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
                      ? "text-white dark:text-white"
                      : "text-gray-300 dark:text-gray-400 hover:text-white dark:hover:text-white"
                  )}
                >
                  {item.label}
                  <ChevronDown className="h-3 w-3" />
                </button>

                {/* Discover Dropdown */}
                {showDiscoverDropdown && (
                  <div className="absolute top-full left-0 right-0 bg-gray-800 dark:bg-gray-900 border border-gray-700 dark:border-gray-600 rounded-lg shadow-lg z-50">
                    {discoverOptions.map((option) => (
                      <Link
                        key={option.href}
                        href={option.href}
                        onClick={() => setShowDiscoverDropdown(false)}
                        className="block py-2 px-3 text-base text-white dark:text-white hover:bg-gray-800 dark:hover:bg-gray-700 transition-colors duration-200 first:rounded-t-lg last:rounded-b-lg text-center"
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
                    ? "text-white dark:text-white"
                    : "text-gray-300 dark:text-gray-400 hover:text-white dark:hover:text-white"
                )}
              >
                {item.label}
              </Link>
            )}
          </div>
        ))}
      </div>

      {/* Notification Panel */}
      <NotificationPanel 
        isOpen={showNotificationPanel} 
        onClose={() => setShowNotificationPanel(false)} 
      />
    </div>
  );
}
