"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";
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
  const pathname = usePathname();
  const router = useRouter();

  const { user } = useCurrentUser();
  const { unreadCount, error: notificationError } = useNotifications();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      // Use router.push instead of window.location.href for smoother navigation
      router.push("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const discoverItems = [
    { href: "/music", label: "Music", icon: Music },
    { href: "/books", label: "Books", icon: Library },
    { href: "/movies", label: "Movies", icon: Film },
    { href: "/series", label: "Series", icon: Tv },
  ];

  const navigationItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/recommendations", label: "Recommendations", icon: TrendingUp },
    { href: "/users", label: "Friends", icon: Users },
    { href: "/reviews", label: "Post", icon: Edit },
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
        {/* Mobile Menu Button */}
        <div className="lg:hidden fixed top-4 left-4 z-50">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="bg-background/80 backdrop-blur-sm border shadow-lg h-12 w-12"
          >
            {isMobileOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </Button>
        </div>

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
            isCollapsed ? "w-16" : "w-64",
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
              <Link href="/" className="flex items-center space-x-2">
                <span
                  className={cn(
                    "font-bold transition-all duration-300",
                    isCollapsed ? "text-lg mx-auto" : "text-lg lg:text-xl"
                  )}
                >
                  {isCollapsed ? "R" : "reliva"}
                </span>
              </Link>
              <div
                className={cn(
                  "flex items-center gap-2 transition-all duration-300",
                  isCollapsed ? "hidden" : "flex"
                )}
              >
                <ModeToggle />
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

              {/* Collapse toggle for collapsed state */}
              {isCollapsed && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsCollapsed(false)}
                  className="lg:flex mx-auto"
                >
                  <ChevronDown className="h-4 w-4 rotate-180" />
                </Button>
              )}
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
                    "space-y-2 transition-all duration-300 sidebar-nav-main",
                    isCollapsed ? "space-y-3" : "space-y-2 lg:space-y-3"
                  )}
                >
                  {/* Home */}
                  {(() => {
                    const item = navigationItems[0];
                    const Icon = item.icon;
                    const isActive = pathname === item.href;

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
                            : "text-muted-foreground"
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

                  {/* Discover Section - Dropdown for expanded state */}
                  {!isCollapsed && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          className={cn(
                            "flex w-full items-center gap-3 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-accent hover:text-accent-foreground px-4 py-3 text-muted-foreground",
                            (pathname === "/music" ||
                              pathname === "/books" ||
                              pathname === "/movies" ||
                              pathname === "/series") &&
                              "bg-accent text-accent-foreground"
                          )}
                        >
                          <Compass className="h-5 w-5 flex-shrink-0" />
                          <span className="whitespace-nowrap">Discover</span>
                          <ChevronDown className="ml-auto h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        side="right"
                        align="start"
                        className="w-48"
                      >
                        {discoverItems.map((item) => {
                          const Icon = item.icon;
                          const isActive = pathname === item.href;

                          return (
                            <DropdownMenuItem key={item.href} asChild>
                              <Link
                                href={item.href}
                                onClick={() => setIsMobileOpen(false)}
                                className={cn(
                                  "flex items-center gap-3 w-full",
                                  isActive && "bg-accent text-accent-foreground"
                                )}
                              >
                                <Icon className="h-4 w-4" />
                                <span>{item.label}</span>
                              </Link>
                            </DropdownMenuItem>
                          );
                        })}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}

                  {/* Discover items for collapsed state */}
                  {isCollapsed &&
                    discoverItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = pathname === item.href;

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
                              : "text-muted-foreground"
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
                    const isActive = pathname === item.href;

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
                            : "text-muted-foreground"
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

                {/* User & Settings */}
                <div
                  className={cn(
                    "space-y-2 transition-all duration-300",
                    isCollapsed ? "space-y-3" : "space-y-2 lg:space-y-3"
                  )}
                >
                  {navigationItems.slice(4).map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;

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
                            "flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-accent hover:text-accent-foreground text-muted-foreground",
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
                            : "text-muted-foreground"
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
            isCollapsed ? "lg:ml-16" : "lg:ml-64"
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
