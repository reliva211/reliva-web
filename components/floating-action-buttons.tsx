"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Users, Edit3 } from "lucide-react";
import { createPortal } from "react-dom";
import { useCurrentUser } from "@/hooks/use-current-user";

interface FloatingActionButtonsProps {
  triggerRef?: React.RefObject<HTMLDivElement | null>;
}

export default function FloatingActionButtons({
  triggerRef,
}: FloatingActionButtonsProps) {
  const [mounted, setMounted] = useState(false);
  const [isSticky, setIsSticky] = useState(false);
  const { user } = useCurrentUser();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!triggerRef?.current || !mounted) return;

    const handleScroll = () => {
      if (!triggerRef.current) return;

      const triggerRect = triggerRef.current.getBoundingClientRect();
      const triggerBottom = triggerRect.bottom;

      // Make sticky when the welcome section is scrolled past
      setIsSticky(triggerBottom <= 0);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // Check initial position

    return () => window.removeEventListener("scroll", handleScroll);
  }, [triggerRef, mounted]);

  // Only show for authenticated users
  if (!mounted || !user) return null;

  const buttonStyle = {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "12px 16px",
    borderRadius: "12px",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.2s ease",
    backdropFilter: "blur(8px)",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
    minWidth: "140px",
    justifyContent: "center",
    border: "none",
  };

  const findFriendsStyle = {
    ...buttonStyle,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    color: "#374151",
    border: "1px solid #e5e7eb",
  };

  const writeReviewStyle = {
    ...buttonStyle,
    background: "linear-gradient(135deg, #059669 0%, #2563eb 100%)",
    color: "white",
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.transform = "scale(1.05)";
    e.currentTarget.style.boxShadow = "0 10px 15px -3px rgba(0, 0, 0, 0.1)";
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.transform = "scale(1)";
    e.currentTarget.style.boxShadow = "0 4px 6px -1px rgba(0, 0, 0, 0.1)";
  };

  if (isSticky) {
    // Render as fixed/sticky buttons when scrolled past welcome section
    return createPortal(
      <div className="global-fixed-buttons">
        <Link href="/users">
          <button
            style={findFriendsStyle}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <Users style={{ width: "16px", height: "16px" }} />
            <span>Find Friends</span>
          </button>
        </Link>

        <Link href="/reviews">
          <button
            style={writeReviewStyle}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <Edit3 style={{ width: "16px", height: "16px" }} />
            <span>Write Review</span>
          </button>
        </Link>
      </div>,
      document.body
    );
  }

  // Render as normal positioned buttons under welcome section
  return (
    <div className="flex flex-col gap-3 items-end mb-8">
      <div className="bg-white/10 dark:bg-gray-800/50 backdrop-blur-sm p-4 rounded-xl border border-white/20 dark:border-gray-700 shadow-lg">
        <div className="flex flex-col gap-3">
          <Link href="/users">
            <button
              style={findFriendsStyle}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <Users style={{ width: "16px", height: "16px" }} />
              <span>Find Friends</span>
            </button>
          </Link>

          <Link href="/reviews">
            <button
              style={writeReviewStyle}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <Edit3 style={{ width: "16px", height: "16px" }} />
              <span>Write Review</span>
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
