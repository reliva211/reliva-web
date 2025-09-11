"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

import {
  Music,
  Film,
  Menu,
  X,
  User,
  LogOut,
  MessageCircle,
  Tv,
  ChevronDown,
  Search as SearchIcon,
  Home,
  Settings,
  Heart,
  Library,
  TrendingUp,
  Bell,
  Info,
  HelpCircle,
  Users,
  Compass,
  Edit,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { Input } from "@/components/ui/input";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useNotifications } from "@/hooks/use-notifications";
import MobileHeader from "@/components/mobile-header";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SidebarProps {
  isLandingPage?: boolean;
}

export default function Sidebar({ isLandingPage = false }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDiscoverOptions, setShowDiscoverOptions] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const { user } = useCurrentUser();
  const { unreadCount, error: notificationError } = useNotifications();

  // Set discover options to be expanded by default when sidebar is open
  useEffect(() => {
    if (!isCollapsed) {
      setShowDiscoverOptions(true);
    } else {
      setShowDiscoverOptions(false);
    }
  }, [isCollapsed]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      // Redirect to landing page after logout
      router.push("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const handleDiscoverClick = () => {
    setShowDiscoverOptions(!showDiscoverOptions);
  };

  // Helper function to determine if a navigation item should be active
  const isNavigationActive = (href: string) => {
    if (href === "/reviews") {
      return pathname === "/reviews" || pathname === "/";
    }
    if (href === "/music") {
      return pathname.startsWith("/music");
    }
    if (href === "/books") {
      return pathname.startsWith("/books");
    }
    if (href === "/movies") {
      return pathname.startsWith("/movies");
    }
    if (href === "/series") {
      return pathname.startsWith("/series");
    }
    if (href === "/profile") {
      return pathname.startsWith("/profile") || pathname.startsWith("/user/");
    }
    if (href === "/notifications") {
      return pathname.startsWith("/notifications");
    }
    if (href === "/recommendations") {
      return pathname.startsWith("/recommendations");
    }
    if (href === "/users") {
      return pathname.startsWith("/users") || pathname.startsWith("/friends");
    }
    if (href === "/contact") {
      return pathname.startsWith("/contact") || pathname.startsWith("/about");
    }
    return pathname === href;
  };

  const discoverItems = [
    { href: "/music", label: "Music", icon: Music },
    { href: "/books", label: "Books", icon: Library },
    { href: "/movies", label: "Movies", icon: Film },
    { href: "/series", label: "Series", icon: Tv },
  ];

  const navigationItems = [
    { href: "/reviews", label: "Home", icon: Home },
    { href: "/recommendations", label: "Recommendations", icon: TrendingUp },
    { href: "/users", label: "Friends", icon: Users },
    {
      href: "/notifications",
      label: "Notifications",
      icon: Bell,
    },
    { href: "/profile", label: "Profile", icon: User },
    { href: "/contact", label: "About Us", icon: HelpCircle },
    { href: "#", label: "Logout", icon: LogOut, onClick: handleLogoutClick },
  ];

  // Get user initials for avatar fallback
  const getUserInitials = () => {
    if (!user?.displayName) return "U";
    return user.displayName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  // Don't show sidebar on auth pages or when user is not logged in
  const authPages = ["/login", "/signup", "/signin", "/auth"];
  const isAuthPage = authPages.some((page) => pathname.startsWith(page));

  // Show sidebar for authenticated users, except on auth pages
  if (!user || isAuthPage) {
    return null;
  }

  return (
    <TooltipProvider>
      <>
        {/* Mobile Header */}
        <MobileHeader onMenuClick={() => setIsMobileOpen(!isMobileOpen)} />

        {/* Mobile Sidebar Overlay */}
        {isMobileOpen && (
          <div
            className="lg:hidden fixed inset-0 bg-black/50 z-40"
            onClick={() => setIsMobileOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={cn(
            "fixed left-0 top-0 z-40 h-full bg-zinc-900/95 backdrop-blur supports-[backdrop-filter]:bg-zinc-900/90 border-r border-zinc-800 transition-all duration-300 ease-in-out",
            // Desktop: collapsible, Mobile: full width when open
            isCollapsed ? "lg:w-16 w-64" : "w-72",
            // Mobile: slide in/out, Desktop: always visible
            isMobileOpen
              ? "translate-x-0"
              : "-translate-x-full lg:translate-x-0"
          )}
        >
          <div className="flex h-full flex-col">
            {/* Header */}
            <div
              className={cn(
                "flex h-16 lg:h-20 items-center justify-between border-b transition-all duration-300",
                isCollapsed ? "px-2" : "px-4 lg:px-6"
              )}
            >
              <Link
                href="/reviews"
                className="flex items-center space-x-2 flex-1 min-w-0"
              >
                <span
                  className={cn(
                    "font-bold transition-all duration-300",
                    isCollapsed ? "text-lg mx-auto" : "text-lg lg:text-xl"
                  )}
                >
                  {isCollapsed ? (
                    "R"
                  ) : (
                    <span className="flex items-center gap-2">
                      Reliva
                      <span className="text-xs text-white px-2 py-0.5 rounded-full border border-white font-medium">
                        BETA
                      </span>
                    </span>
                  )}
                </span>
              </Link>
              {/* Desktop collapse button - always visible on desktop */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="hidden lg:flex"
              >
                <ChevronDown
                  className={cn(
                    "h-4 w-4 transition-transform duration-300",
                    isCollapsed && "rotate-180"
                  )}
                />
              </Button>
            </div>

            {/* Navigation */}
            <ScrollArea className="flex-1">
              <nav
                className={cn(
                  "py-4 lg:py-6 transition-all duration-300 flex flex-col h-full sidebar-nav",
                  isCollapsed ? "px-2" : "px-3 lg:px-4"
                )}
              >
                {/* Main Navigation */}
                <div
                  className={cn(
                    "space-y-1 transition-all duration-300 sidebar-nav-main",
                    isCollapsed ? "space-y-1" : "space-y-1 lg:space-y-1"
                  )}
                >
                  {/* Home */}
                  {(() => {
                    const item = navigationItems[0];
                    const Icon = item.icon;
                    const isActive = isNavigationActive(item.href);

                    const linkContent = (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsMobileOpen(false)}
                        className={cn(
                          "flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-accent hover:text-accent-foreground",
                          isCollapsed
                            ? "justify-center px-2 py-3"
                            : "px-4 py-3",
                          isActive
                            ? "bg-accent text-accent-foreground"
                            : "text-white"
                        )}
                      >
                        <Icon
                          className={cn(
                            "flex-shrink-0 transition-all duration-200",
                            isCollapsed ? "h-5 w-5" : "h-5 w-5"
                          )}
                        />
                        {!isCollapsed && (
                          <span className="whitespace-nowrap">
                            {item.label}
                          </span>
                        )}
                      </Link>
                    );

                    return isCollapsed ? (
                      <Tooltip key={item.href}>
                        <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                        <TooltipContent side="right">
                          {item.label}
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      linkContent
                    );
                  })()}

                  {/* Discover Section - Toggle button for expanded state */}
                  {!isCollapsed && (
                    <button
                      onClick={handleDiscoverClick}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg text-sm font-medium transition-all duration-300 ease-in-out hover:bg-accent hover:text-accent-foreground px-4 py-3 text-white active:scale-95",
                        (isNavigationActive("/music") ||
                          isNavigationActive("/books") ||
                          isNavigationActive("/movies") ||
                          isNavigationActive("/series")) &&
                          "bg-accent text-accent-foreground"
                      )}
                    >
                      <Compass className="h-5 w-5 flex-shrink-0" />
                      <span className="whitespace-nowrap">Discover</span>
                      <ChevronDown 
                        className={cn(
                          "ml-auto h-4 w-4 transition-transform duration-300 ease-in-out",
                          showDiscoverOptions && "rotate-180"
                        )} 
                      />
                    </button>
                  )}

                  {/* Discover Options - Animated expand/collapse */}
                  {!isCollapsed && (
                    <div 
                      className={cn(
                        "overflow-hidden transition-all duration-300 ease-in-out",
                        showDiscoverOptions 
                          ? "max-h-96 opacity-100" 
                          : "max-h-0 opacity-0"
                      )}
                    >
                      <div className="ml-4 space-y-1">
                        {discoverItems.map((item, index) => {
                          const Icon = item.icon;
                          const isActive = isNavigationActive(item.href);

                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              onClick={() => {
                                setIsMobileOpen(false);
                              }}
                              className={cn(
                                "flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-accent hover:text-accent-foreground px-4 py-3 text-white transform",
                                isActive && "bg-accent text-accent-foreground",
                                showDiscoverOptions 
                                  ? "translate-x-0 opacity-100" 
                                  : "translate-x-4 opacity-0"
                              )}
                              style={{
                                transitionDelay: showDiscoverOptions ? `${index * 50}ms` : '0ms'
                              }}
                            >
                              <Icon className="h-4 w-4 flex-shrink-0" />
                              <span className="whitespace-nowrap">{item.label}</span>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Discover items for collapsed state */}
                  {isCollapsed &&
                    discoverItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = isNavigationActive(item.href);

                      const linkContent = (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => {
                            setIsMobileOpen(false);
                          }}
                          className={cn(
                            "flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-accent hover:text-accent-foreground",
                            isCollapsed
                              ? "justify-center px-2 py-3"
                              : "px-4 py-3",
                            isActive
                              ? "bg-accent text-accent-foreground"
                              : "text-white"
                          )}
                        >
                          <Icon
                            className={cn(
                              "flex-shrink-0 transition-all duration-200",
                              isCollapsed ? "h-5 w-5" : "h-5 w-5"
                            )}
                          />
                          {!isCollapsed && (
                            <span className="whitespace-nowrap">
                              {item.label}
                            </span>
                          )}
                        </Link>
                      );

                      return (
                        <Tooltip key={item.href}>
                          <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                          <TooltipContent side="right">
                            {item.label}
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}

                  {/* Other navigation items */}
                  {navigationItems.slice(1, 4).map((item) => {
                    const Icon = item.icon;
                    const isActive = isNavigationActive(item.href);

                    const linkContent = (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsMobileOpen(false)}
                        className={cn(
                          "relative flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-accent hover:text-accent-foreground",
                          isCollapsed
                            ? "justify-center px-2 py-3"
                            : "px-4 py-3",
                          isActive
                            ? "bg-accent text-accent-foreground"
                            : "text-white"
                        )}
                      >
                        <Icon
                          className={cn(
                            "flex-shrink-0 transition-all duration-200",
                            isCollapsed ? "h-5 w-5" : "h-5 w-5"
                          )}
                        />
                        {!isCollapsed && (
                          <span className="truncate">{item.label}</span>
                        )}
                        {/* Notification badge */}
                        {item.href === "/notifications" && unreadCount > 0 && (
                          <span className={cn(
                            "absolute bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-semibold",
                            isCollapsed 
                              ? "-top-1 -right-1 h-4 w-4 min-w-[16px]" 
                              : "ml-auto h-5 w-5 min-w-[20px]"
                          )}>
                            {unreadCount > 99 ? "99+" : unreadCount}
                          </span>
                        )}
                      </Link>
                    );

                    return isCollapsed ? (
                      <Tooltip key={item.href}>
                        <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                        <TooltipContent side="right">
                          {item.label}
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      linkContent
                    );
                  })}
                </div>

                {/* Spacer for consistent spacing */}
                <div className="h-2" />

                {/* User & Settings */}
                <div
                  className={cn(
                    "space-y-1 transition-all duration-300",
                    isCollapsed ? "space-y-1" : "space-y-1 lg:space-y-1"
                  )}
                >
                  {navigationItems.slice(4).map((item) => {
                    const Icon = item.icon;
                    const isActive = isNavigationActive(item.href);

                    // Handle logout button (has onClick) and regular navigation items
                    if (item.onClick) {
                      const buttonContent = (
                        <button
                          key={item.href}
                          onClick={() => {
                            item.onClick();
                            setIsMobileOpen(false);
                          }}
                          className={cn(
                            "flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-accent hover:text-accent-foreground text-white",
                            isCollapsed
                              ? "justify-center px-2 py-3"
                              : "px-4 py-3"
                          )}
                        >
                          <Icon
                            className={cn(
                              "flex-shrink-0 transition-all duration-200",
                              isCollapsed ? "h-5 w-5" : "h-5 w-5"
                            )}
                          />
                          {!isCollapsed && (
                            <span className="whitespace-nowrap">
                              {item.label}
                            </span>
                          )}
                        </button>
                      );

                      return isCollapsed ? (
                        <Tooltip key={item.href}>
                          <TooltipTrigger asChild>
                            {buttonContent}
                          </TooltipTrigger>
                          <TooltipContent side="right">
                            {item.label}
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        buttonContent
                      );
                    }

                    // Use Link for navigation items
                    const linkContent = (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsMobileOpen(false)}
                        className={cn(
                          "flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-accent hover:text-accent-foreground",
                          isCollapsed
                            ? "justify-center px-2 py-3"
                            : "px-4 py-3",
                          isActive
                            ? "bg-accent text-accent-foreground"
                            : "text-white"
                        )}
                      >
                        <Icon
                          className={cn(
                            "flex-shrink-0 transition-all duration-200",
                            isCollapsed ? "h-5 w-5" : "h-5 w-5"
                          )}
                        />
                        {!isCollapsed && (
                          <span className="whitespace-nowrap">
                            {item.label}
                          </span>
                        )}
                      </Link>
                    );

                    return isCollapsed ? (
                      <Tooltip key={item.href}>
                        <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                        <TooltipContent side="right">
                          {item.label}
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      linkContent
                    );
                  })}
                </div>
              </nav>
            </ScrollArea>
          </div>
        </aside>

        {/* Main Content Wrapper */}
        <div
          className={cn(
            "transition-all duration-300 ease-in-out",
            isCollapsed ? "lg:ml-16" : "lg:ml-72"
          )}
        >
          {/* Mobile padding for content */}
          <div className="lg:hidden h-16" />
        </div>

        {/* Logout Confirmation Dialog */}
        <AlertDialog
          open={showLogoutConfirm}
          onOpenChange={setShowLogoutConfirm}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to log out? You'll need to sign in again
                to access your account.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleSignOut}>
                Logout
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    </TooltipProvider>
  );
}
