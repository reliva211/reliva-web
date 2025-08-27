"use client";

import { useCurrentUser } from "@/hooks/use-current-user";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";
import Image from "next/image";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Play,
  Zap,
  MessageSquare,
  Users,
  UserPlus,
} from "lucide-react";
import { RatingStars } from "@/components/rating-stars";
import ReviewPost from "@/components/review-post";
import { useFollowedReviews } from "@/hooks/use-followed-reviews";

export default function LandingPage() {
  const { user, loading } = useCurrentUser();
  const {
    reviews,
    loading: loadingReviews,
    error,
    retry,
  } = useFollowedReviews();

  // Prevent vertical scrolling when hovering over scrollable containers
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      const target = e.target as HTMLElement;
      const scrollableContainer = target.closest(".scrollable-container");
      if (scrollableContainer) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    document.addEventListener("wheel", handleWheel, { passive: false });
    return () => document.removeEventListener("wheel", handleWheel);
  }, []);

  // Show spinner while auth state is loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500 dark:border-emerald-400"></div>
      </div>
    );
  }

  if (user) {
    // Show personalized feed for signed-in users
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-black dark:to-gray-900 text-gray-900 dark:text-white relative scroll-smooth">
        <div className="relative z-10 py-8 px-4">
          <div className="max-w-7xl mx-auto w-full space-y-16">
            {/* Welcome Section */}
            <div className="text-center mb-12">
              <div className="bg-gradient-to-r from-emerald-50 to-blue-50 dark:from-emerald-950/20 dark:to-blue-950/20 rounded-2xl p-8 border border-emerald-200 dark:border-emerald-800 shadow-lg">
                <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-emerald-600 to-blue-600 dark:from-emerald-400 dark:to-blue-400 bg-clip-text text-transparent">
                  Welcome back,{" "}
                  {user.displayName ||
                    user.email?.split("@")[0] ||
                    "Media Explorer"}
                  ! 🎬📚🎵
                </h1>
                <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-6 max-w-3xl mx-auto">
                  Discover what your friends are watching, reading, and
                  listening to. Stay connected with the people you follow and
                  never miss their latest reviews.
                </p>
                <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                    {reviews.length} reviews from people you follow
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    Fresh daily updates
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                    Personalized feed
                  </span>
                </div>
              </div>
            </div>

            {/* Reviews Feed from Followed Users */}
            <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-3xl p-6 md:p-8 border border-gray-200 dark:border-gray-700 shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 md:mb-8 gap-4">
                <div>
                  <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                    Your Reviews & People You Follow
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base">
                    See your reviews and what your friends are saying about
                    their favorite media
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link href="/users">
                    <Button
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <Users className="h-4 w-4" />
                      <span>Find People</span>
                    </Button>
                  </Link>
                  <Link href="/reviews">
                    <Button className="bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 text-white transition-all duration-300 px-4 py-3 md:px-6 md:py-3 rounded-xl hover:shadow-lg transform hover:scale-105 font-medium text-sm md:text-base">
                      <span>Write Review</span>
                      <ArrowRight className="h-4 w-4 md:h-5 md:w-5" />
                    </Button>
                  </Link>
                </div>
              </div>

              {loadingReviews ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 animate-pulse"
                    >
                      <div className="flex items-center space-x-4 mb-6">
                        <div className="w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                        <div className="flex-1">
                          <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded w-32 mb-3"></div>
                          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-20"></div>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
                        <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded w-4/5"></div>
                        <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded w-3/5"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div className="text-center py-12 md:py-16 px-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-orange-100 dark:from-red-900/30 dark:to-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                    <MessageSquare className="h-10 w-10 text-red-600 dark:text-red-400" />
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    Error Loading Reviews
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto text-base md:text-lg leading-relaxed">
                    {error}
                  </p>
                  <Button
                    onClick={retry}
                    className="bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 text-white text-base md:text-lg px-8 py-4 md:px-10 md:py-4 rounded-xl font-semibold shadow-lg transform hover:scale-105 transition-all duration-300"
                  >
                    Try Again
                  </Button>
                </div>
              ) : reviews.length === 0 ? (
                <div className="text-center py-12 md:py-16 px-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-emerald-100 to-blue-100 dark:from-emerald-900/30 dark:to-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                    <UserPlus className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    No reviews yet
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto text-base md:text-lg leading-relaxed">
                    Start following people to see their reviews, or write your
                    first review to share with the community!
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link href="/users">
                      <Button className="bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 text-white text-base md:text-lg px-8 py-4 md:px-10 md:py-4 rounded-xl font-semibold shadow-lg transform hover:scale-105 transition-all duration-300">
                        <Users className="h-5 w-5 mr-2" />
                        Find People to Follow
                      </Button>
                    </Link>
                    <Link href="/reviews">
                      <Button
                        variant="outline"
                        className="text-base md:text-lg px-8 py-4 md:px-10 md:py-4 rounded-xl font-semibold shadow-lg transform hover:scale-105 transition-all duration-300"
                      >
                        Write Your First Review
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                  {reviews.slice(0, 9).map((review) => (
                    <ReviewPost
                      key={review.id}
                      review={review}
                      onLikeToggle={() => {
                        // The hook will automatically refresh when user changes
                        // This is handled by the useEffect dependency on user
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show landing page for non-authenticated users
  return (
    <>
      {/* Animated Background Elements */}
      <div className="absolute inset-0 opacity-5 dark:opacity-10">
        <div className="absolute top-20 left-20 w-72 h-72 bg-emerald-500 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-500 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Hero Section */}
      <section className="relative z-10 min-h-screen flex items-center px-4">
        <div className="max-w-7xl mx-auto w-full">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left Side - Title */}
            <div className="text-left">
              <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-light tracking-tight leading-none mb-8 text-gray-900 dark:text-white">
                What's
                <br />
                <span className="bg-gradient-to-r from-emerald-600 via-blue-600 to-purple-600 dark:from-emerald-400 dark:via-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                  Your
                </span>
                <br />
                Reliva?
              </h1>
              <p className="text-lg sm:text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-lg leading-relaxed mb-8">
                The ultimate platform for sharing what you love. No gatekeeping,
                just pure media discovery.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/signup">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 dark:from-emerald-500 dark:to-blue-500 dark:hover:from-emerald-600 dark:hover:to-blue-600 text-white text-lg px-8 py-4 shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105"
                  >
                    Sign up
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                  </Button>
                </Link>
                <Link href="login">
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 text-lg px-8 py-4 transition-all duration-300 ease-in-out transform hover:scale-105"
                  >
                    <Play className="mr-2 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                    Login
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right Side - Preview */}
            <div className="relative">
              <div className="bg-white/80 dark:bg-gray-800/90 backdrop-blur-sm rounded-3xl p-4 sm:p-6 lg:p-8 border border-gray-200 dark:border-gray-700 shadow-2xl">
                <div className="space-y-6">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-emerald-500 dark:bg-emerald-400 rounded-full animate-pulse"></div>
                      <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                        Live Feed
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      reliva
                    </div>
                  </div>

                  {/* Activity Feed */}
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                      <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold text-sm">S</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          Sarah Chen
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          Just finished "The Seven Husbands of Evelyn Hugo" and
                          I'm absolutely speechless! The storytelling is
                          phenomenal ✨
                        </p>
                        <div className="flex items-center space-x-4 mt-2">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            📚 BOOK
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            2h ago
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold text-sm">M</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          Marcus Johnson
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          Discovered this incredible indie band called 'Lunar
                          Echoes' today. Their album 'Midnight Reverie' is pure
                          magic 🎵
                        </p>
                        <div className="flex items-center space-x-4 mt-2">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            🎵 MUSIC
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            4h ago
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                      <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold text-sm">E</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          Emma Rodriguez
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          Rewatched 'Parasite' last night and noticed so many
                          details I missed the first time. Bong Joon-ho's
                          direction is masterful 🎬
                        </p>
                        <div className="flex items-center space-x-4 mt-2">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            🎬 MOVIE
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            6h ago
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Elements */}
              <div className="absolute -top-4 -right-4 w-8 h-8 bg-emerald-500 rounded-full animate-bounce"></div>
              <div className="absolute -bottom-4 -left-4 w-6 h-6 bg-blue-500 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </section>

      {/* What is Reliva Section */}
      <section className="relative z-10 py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
            {/* Left Side - Visual Design */}
            <div className="flex-1 flex justify-center lg:justify-start">
              <div className="relative w-full max-w-lg lg:max-w-xl">
                <div className="relative overflow-hidden rounded-2xl shadow-2xl bg-gradient-to-br from-indigo-500 via-cyan-500 to-teal-500 p-8">
                  {/* Background pattern */}
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-4 left-4 w-32 h-32 border-2 border-white/20 rounded-full"></div>
                    <div className="absolute bottom-8 right-8 w-24 h-24 border-2 border-white/20 rounded-full"></div>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 border-2 border-white/20 rounded-full"></div>
                  </div>

                  {/* Main content */}
                  <div className="relative z-10 text-center">
                    <div className="mb-8">
                      <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                        <span className="text-4xl">💝</span>
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-2">
                        Share What You Love
                      </h3>
                      <p className="text-white/90 text-sm">
                        No gatekeeping, just pure passion
                      </p>
                    </div>

                    {/* Social icons grid */}
                    <div className="grid grid-cols-2 gap-6">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center mx-auto mb-2 shadow-lg">
                          <span className="text-2xl">👥</span>
                        </div>
                        <span className="text-white font-semibold text-sm">
                          Friends
                        </span>
                      </div>
                      <div className="text-center">
                        <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center mx-auto mb-2 shadow-lg">
                          <span className="text-2xl">❤️</span>
                        </div>
                        <span className="text-white font-semibold text-sm">
                          Lovers
                        </span>
                      </div>
                      <div className="text-center">
                        <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center mx-auto mb-2 shadow-lg">
                          <span className="text-2xl">⭐</span>
                        </div>
                        <span className="text-white font-semibold text-sm">
                          Rate
                        </span>
                      </div>
                      <div className="text-center">
                        <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center mx-auto mb-2 shadow-lg">
                          <span className="text-2xl">💬</span>
                        </div>
                        <span className="text-white font-semibold text-sm">
                          Review
                        </span>
                      </div>
                    </div>

                    {/* Bottom accent */}
                    <div className="mt-6 pt-4 border-t border-white/20">
                      <p className="text-white/80 text-xs font-medium">
                        Built for sharing
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Text Content */}
            <div className="max-w-md lg:max-w-lg text-left">
              <h2 className="text-4xl md:text-5xl font-light mb-8 text-gray-900 dark:text-white">
                But what is
                <br />
                <span className="bg-gradient-to-r from-emerald-600 to-blue-600 dark:from-emerald-400 dark:to-blue-400 bg-clip-text text-transparent">
                  Reliva?
                </span>
              </h2>
              <div className="space-y-6 text-lg md:text-xl leading-relaxed text-gray-600 dark:text-gray-300 mb-8">
                <p>
                  Reliva is sharing what you love. A platform where you can't
                  gatekeep.
                </p>
                <p>
                  Share what you listen to, read, and watch with your friends,
                  followers, and your lover (if you have one).
                </p>
                <p>
                  Rate and review to tell how much you like or how much you
                  hate.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Key Differentiators Section */}
      <section className="relative z-10 py-20 px-4 bg-gray-50 dark:bg-black/20">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
            {/* Left Side - Text Content */}
            <div className="max-w-md lg:max-w-lg">
              <h2 className="text-4xl md:text-5xl font-light mb-8 text-left text-gray-900 dark:text-white">
                What sets us apart from
                <br />
                <span className="bg-gradient-to-r from-emerald-600 to-blue-600 dark:from-emerald-400 dark:to-blue-400 bg-clip-text text-transparent">
                  competition:
                </span>
              </h2>
              <p className="text-2xl md:text-3xl font-semibold text-emerald-600 dark:text-emerald-400 mb-8 text-left">
                All your media in one place!
              </p>
              <div className="space-y-4 text-lg md:text-xl leading-relaxed text-gray-600 dark:text-gray-300 text-left">
                <p>
                  You don't have to go to Letterboxd for
                  <br />
                  movies, IMDb/Serialized for shows,
                  <br />
                  Goodreads for books, Musicboard for
                  <br />
                  music
                </p>
              </div>
              <p className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 dark:from-emerald-400 dark:to-blue-400 bg-clip-text text-transparent mt-8 text-left">
                WE GOT YOU COVERED
              </p>
            </div>

            {/* Right Side - Visual Design */}
            <div className="flex-1 flex justify-center lg:justify-end">
              <div className="relative w-full max-w-lg lg:max-w-xl">
                <div className="relative overflow-hidden rounded-2xl shadow-2xl bg-gradient-to-br from-emerald-500 via-blue-500 to-purple-600 p-8">
                  {/* Background pattern */}
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-4 left-4 w-32 h-32 border-2 border-white/20 rounded-full"></div>
                    <div className="absolute bottom-8 right-8 w-24 h-24 border-2 border-white/20 rounded-full"></div>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 border-2 border-white/20 rounded-full"></div>
                  </div>

                  {/* Main content */}
                  <div className="relative z-10 text-center">
                    <div className="mb-8">
                      <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                        <span className="text-4xl">🎯</span>
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-2">
                        Unified Platform
                      </h3>
                      <p className="text-white/90 text-sm">
                        Everything you need in one place
                      </p>
                    </div>

                    {/* Media icons grid */}
                    <div className="grid grid-cols-2 gap-6">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center mx-auto mb-2 shadow-lg">
                          <span className="text-2xl">🎬</span>
                        </div>
                        <span className="text-white font-semibold text-sm">
                          Movies
                        </span>
                      </div>
                      <div className="text-center">
                        <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center mx-auto mb-2 shadow-lg">
                          <span className="text-2xl">📚</span>
                        </div>
                        <span className="text-white font-semibold text-sm">
                          Books
                        </span>
                      </div>
                      <div className="text-center">
                        <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center mx-auto mb-2 shadow-lg">
                          <span className="text-2xl">🎵</span>
                        </div>
                        <span className="text-white font-semibold text-sm">
                          Music
                        </span>
                      </div>
                      <div className="text-center">
                        <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center mx-auto mb-2 shadow-lg">
                          <span className="text-2xl">📺</span>
                        </div>
                        <span className="text-white font-semibold text-sm">
                          TV Shows
                        </span>
                      </div>
                    </div>

                    {/* Bottom accent */}
                    <div className="mt-6 pt-4 border-t border-white/20">
                      <p className="text-white/80 text-xs font-medium">
                        Powered by Reliva
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Search Capabilities Section */}
      <section className="relative z-10 py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-light mb-8 text-gray-900 dark:text-white">
            Search through
            <br />
            <span className="bg-gradient-to-r from-emerald-600 to-blue-600 dark:from-emerald-400 dark:to-blue-400 bg-clip-text text-transparent">
              millions
            </span>
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg">
              <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mb-2">
                20M+
              </div>
              <div className="text-gray-500 dark:text-gray-400">Songs</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                Millions
              </div>
              <div className="text-gray-500 dark:text-gray-400">Movies</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg">
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                Hundreds
              </div>
              <div className="text-gray-500 dark:text-gray-400">of Shows</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                Thousands
              </div>
              <div className="text-gray-500 dark:text-gray-400">of Books</div>
            </div>
          </div>

          <div className="space-y-6">
            <p className="text-2xl md:text-3xl font-semibold text-gray-900 dark:text-white">
              Get started today
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/login">
                <Button
                  variant="outline"
                  size="lg"
                  className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300 text-lg px-8 py-4 shadow-lg transform hover:scale-105"
                >
                  Log In
                </Button>
              </Link>
              <Link href="/signup">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 dark:from-emerald-500 dark:to-blue-500 dark:hover:from-emerald-600 dark:hover:to-blue-600 text-white text-lg px-8 py-4 shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105"
                >
                  <Zap className="mr-2 h-5 w-5 transition-transform duration-300 group-hover:rotate-12" />
                  Sign Up
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-12 px-4 border-t border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto text-center">
          <div className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 dark:from-emerald-400 dark:to-blue-400 bg-clip-text text-transparent mb-4">
            Reliva
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Share what you love. Discover what others love.
          </p>
        </div>
      </footer>
    </>
  );
}
