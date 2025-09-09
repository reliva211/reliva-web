"use client";

import { useCurrentUser } from "@/hooks/use-current-user";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Zap } from "lucide-react";
import { MarqueeDemo } from "@/components/marquee-demo-vertical";
import { CometCard } from "@/components/ui/comet-card";

export default function LandingPage() {
  const { user, loading } = useCurrentUser();

  // Show spinner while auth state is loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500 dark:border-emerald-400"></div>
      </div>
    );
  }

  if (user) {
    // Redirect authenticated users directly to reviews page
    window.location.href = "/reviews";
    return null;
  }

  // Show landing page for non-authenticated users
  return (
    <>
      {/* Animated Background Elements */}
      <div className="absolute inset-0 opacity-15 dark:opacity-20">
        <div className="absolute top-20 left-20 w-72 h-72 bg-emerald-500 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-500 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Hero Section */}
      <section className="relative z-10 min-h-screen flex items-center px-4 pt-4 pb-8 landing-hero">
        <div className="max-w-7xl mx-auto w-full">
          <div className="grid lg:grid-cols-2 gap-12 sm:gap-16 lg:gap-12 items-center">
            {/* Left Side - Title */}
            <div className="text-center lg:text-left order-2 lg:order-1">
              <h1 className="text-9xl sm:text-9xl md:text-9xl lg:text-7xl xl:text-8xl font-light tracking-tight leading-tight mb-4 sm:mb-6 text-gray-900 dark:text-white">
                What's
                <br />
                <span className="bg-gradient-to-r from-emerald-600 via-blue-600 to-purple-600 dark:from-emerald-400 dark:via-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                  Your
                </span>
                <br />
                Reliva?
              </h1>
              <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-600 dark:text-gray-300 max-w-lg leading-relaxed mb-4 sm:mb-6">
                The ultimate platform for sharing what you love. No gatekeeping.
              </p>
              <div className="flex flex-row gap-2 sm:gap-3 justify-center lg:justify-start">
                <Link href="/signup">
                  <Button
                    size="lg"
                    className="flex-1 bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 dark:from-emerald-500 dark:to-blue-500 dark:hover:from-emerald-600 dark:hover:to-blue-600 text-white text-sm sm:text-base px-4 sm:px-6 py-2.5 sm:py-3 shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105"
                  >
                    Sign up
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </Button>
                </Link>
                <Link href="login">
                  <Button
                    variant="outline"
                    size="lg"
                    className="flex-1 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 text-sm sm:text-base px-4 sm:px-6 py-2.5 sm:py-3 transition-all duration-300 ease-in-out transform hover:scale-105"
                  >
                    <Play className="mr-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                    Login
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right Side - Preview */}
            <div className="relative mt-4 sm:mt-8 lg:mt-0 flex justify-center lg:justify-end order-1 lg:order-2">
              <img
                src="/login-left.png"
                alt="Reliva Preview"
                className="w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-lg xl:max-w-xl h-auto rounded-lg shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* What is Reliva Section */}
      <section className="relative z-10 py-8 sm:py-12 px-8 sm:px-12 landing-section">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6 sm:gap-8">
            {/* Left Side - Visual Design */}
            <div className="flex-1 flex justify-center lg:justify-start order-2 lg:order-1 w-full">
              <div className="relative w-full max-w-sm comet-card">
                <CometCard>
                  <div className="relative overflow-hidden rounded-3xl bg-white/5 dark:bg-black/15 border border-white/15 dark:border-white/8 p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
                    {/* Main content */}
                    <div className="text-center mb-6 sm:mb-8">
                      <h3 className="text-lg sm:text-xl font-bold text-white/90 mb-3">
                        Share what you love
                      </h3>
                      <p className="text-sm sm:text-base text-white/70">
                        discover what your friends love
                      </p>
                    </div>

                    {/* Feature sections */}
                    <div className="space-y-4 sm:space-y-5">
                      <div className="flex items-start space-x-3 sm:space-x-4">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex-shrink-0 flex items-center justify-center shadow-lg">
                          <svg
                            className="w-4 h-4 sm:w-5 sm:h-5 text-white"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm sm:text-base font-semibold text-white/80 mb-1">
                            Rate
                          </h4>
                          <p className="text-xs sm:text-sm text-white/60">
                            rate from 1-5 stars
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3 sm:space-x-4">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex-shrink-0 flex items-center justify-center shadow-lg">
                          <svg
                            className="w-4 h-4 sm:w-5 sm:h-5 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm sm:text-base font-semibold text-white/80 mb-1">
                            Review
                          </h4>
                          <p className="text-xs sm:text-sm text-white/60">
                            write what you feel
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3 sm:space-x-4">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-red-400 to-pink-500 rounded-2xl flex-shrink-0 flex items-center justify-center shadow-lg">
                          <svg
                            className="w-4 h-4 sm:w-5 sm:h-5 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                            />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm sm:text-base font-semibold text-white/80 mb-1">
                            Recommend
                          </h4>
                          <p className="text-xs sm:text-sm text-white/60">
                            recommend movies, tvshows, music and books to your
                            friends
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3 sm:space-x-4">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl flex-shrink-0 flex items-center justify-center shadow-lg">
                          <svg
                            className="w-4 h-4 sm:w-5 sm:h-5 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                            />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm sm:text-base font-semibold text-white/80 mb-1">
                            Get recommendations
                          </h4>
                          <p className="text-xs sm:text-sm text-white/60">
                            get recommendations from your friends
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CometCard>
              </div>
            </div>

            {/* Right Side - Text Content */}
            <div className="max-w-md lg:max-w-lg text-center lg:text-left order-1 lg:order-2 w-full">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-light mb-4 sm:mb-6 text-gray-900 dark:text-white">
                What is <span className="bg-gradient-to-r from-emerald-600 to-blue-600 dark:from-emerald-400 dark:to-blue-400 bg-clip-text text-transparent">Reliva?</span>
              </h2>
              <div className="space-y-3 sm:space-y-4 text-sm sm:text-base md:text-lg leading-relaxed text-gray-600 dark:text-gray-300 mb-4 sm:mb-6">
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
                <p>
                  Recommend what you like with your friends and get their
                  recommendations
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* User Reviews Section */}
      <section className="relative z-10 py-8 sm:py-12 px-4 bg-gray-50 dark:bg-black/20 landing-section">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-light mb-3 sm:mb-4 text-gray-900 dark:text-white">
              What our users are
              <br />
              <span className="bg-gradient-to-r from-emerald-600 to-blue-600 dark:from-emerald-400 dark:to-blue-400 bg-clip-text text-transparent">
                saying
              </span>
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Join thousands of users who are already sharing their favorite
              media and discovering new ones
            </p>
          </div>

          <div className="relative">
            <MarqueeDemo />
          </div>
        </div>
      </section>

      {/* Key Differentiators Section */}
      <section className="relative z-10 py-8 sm:py-12 px-8 sm:px-12 bg-gray-50 dark:bg-black/20 landing-section">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6 sm:gap-8">
            {/* Left Side - Text Content */}
            <div className="max-w-md lg:max-w-lg order-1 lg:order-1 w-full">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-light mb-4 sm:mb-6 text-center lg:text-left">
                <span className="bg-gradient-to-r from-emerald-600 to-blue-600 dark:from-emerald-400 dark:to-blue-400 bg-clip-text text-transparent">
                  Why us?
                </span>
              </h2>
              <div className="space-y-3 sm:space-y-4 text-sm sm:text-base md:text-lg leading-relaxed text-gray-600 dark:text-gray-300 text-center lg:text-left">
                <p>
                  Share all your media in one place. You dont have to go to
                  multiple apps to rate and review.
                </p>
                <p>All the recommendations from your friends in one place.</p>
                <p>Shareable profile for adding to your social media bio.</p>
              </div>
            </div>

            {/* Right Side - Visual Design */}
            <div className="flex-1 flex justify-center lg:justify-end order-2 lg:order-2 w-full">
              <div className="relative w-full max-w-sm comet-card">
                <CometCard>
                  <div className="relative overflow-hidden rounded-3xl bg-white/5 dark:bg-black/15 border border-white/15 dark:border-white/8 p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
                    {/* Main content */}
                    <div className="text-center mb-6 sm:mb-8">
                      <h3 className="text-lg sm:text-xl font-bold text-white/90 mb-3">
                        We got you covered
                      </h3>
                      <p className="text-sm sm:text-base text-white/70">
                        music, movies, TV shows, books
                      </p>
                    </div>

                    {/* Media categories */}
                    <div className="space-y-4 sm:space-y-5">
                      <div className="flex items-start space-x-3 sm:space-x-4">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl flex-shrink-0 flex items-center justify-center shadow-lg">
                          <svg
                            className="w-4 h-4 sm:w-5 sm:h-5 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                            />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm sm:text-base font-semibold text-white/80 mb-1">
                            Music
                          </h4>
                          <p className="text-xs sm:text-sm text-white/60">
                            20million+ songs, millions of albums, artists
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3 sm:space-x-4">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-red-400 to-red-600 rounded-2xl flex-shrink-0 flex items-center justify-center shadow-lg">
                          <svg
                            className="w-4 h-4 sm:w-5 sm:h-5 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm sm:text-base font-semibold text-white/80 mb-1">
                            Movies
                          </h4>
                          <p className="text-xs sm:text-sm text-white/60">
                            500k+ movies
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3 sm:space-x-4">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-2xl flex-shrink-0 flex items-center justify-center shadow-lg">
                          <svg
                            className="w-4 h-4 sm:w-5 sm:h-5 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm sm:text-base font-semibold text-white/80 mb-1">
                            TV shows/ Anime
                          </h4>
                          <p className="text-xs sm:text-sm text-white/60">
                            300k+ TV shows, 100k+ anime
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3 sm:space-x-4">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex-shrink-0 flex items-center justify-center shadow-lg">
                          <svg
                            className="w-4 h-4 sm:w-5 sm:h-5 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                            />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm sm:text-base font-semibold text-white/80 mb-1">
                            Books
                          </h4>
                          <p className="text-xs sm:text-sm text-white/60">
                            5 million+ books
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CometCard>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Coming Soon On Section */}
      <section className="relative z-10 py-8 sm:py-12 px-4 bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-black dark:to-gray-900 landing-section">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-light mb-4 sm:mb-6 text-gray-900 dark:text-white">
            Coming Soon On
          </h2>
          <div className="flex flex-row items-center justify-center gap-6 sm:gap-8">
            {/* Google Play Store */}
            <div className="flex items-center gap-3 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-800/50">
              <div className="w-10 h-10 bg-gray-700 dark:bg-gray-300 rounded-lg flex items-center justify-center border border-gray-400 dark:border-gray-500">
                <svg
                  className="w-6 h-6"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* Google Play Store Official Icon */}
                  <path
                    d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5Z"
                    fill="#000000"
                  />
                  <path
                    d="M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12Z"
                    fill="#000000"
                  />
                  <path
                    d="M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81Z"
                    fill="#000000"
                  />
                  <path
                    d="M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"
                    fill="#000000"
                  />
                </svg>
              </div>
              <div className="text-left">
                <div className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                  Play Store
                </div>
              </div>
            </div>

            {/* Apple App Store */}
            <div className="flex items-center gap-3 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-800/50">
              <div className="w-10 h-10 bg-gray-700 dark:bg-gray-300 rounded-lg flex items-center justify-center border border-gray-400 dark:border-gray-500">
                <svg
                  className="w-6 h-6 text-white dark:text-gray-800"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* Apple Logo */}
                  <path
                    d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.1 22C7.79 22.05 6.8 20.68 5.96 19.47C4.25 17 2.94 12.45 4.7 9.39C5.57 7.87 7.13 6.91 8.82 6.88C10.1 6.86 11.32 7.75 12.11 7.75C12.89 7.75 14.37 6.68 15.92 6.84C16.57 6.87 18.39 7.1 19.56 8.82C19.47 8.88 17.39 10.1 17.41 12.63C17.44 15.65 20.06 16.66 20.09 16.67C20.06 16.74 19.67 18.11 18.71 19.5ZM13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.07 6.7 11.95 6.61C11.8 5.46 12.36 4.26 13 3.5Z"
                    fill="currentColor"
                  />
                </svg>
              </div>
              <div className="text-left">
                <div className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                  App Store
                </div>
              </div>
            </div>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mt-4 sm:mt-6 text-xs sm:text-sm">
            Mobile apps coming soon for iOS and Android
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-6 sm:py-8 px-4 border-t border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto text-center">
          <div className="text-lg sm:text-xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 dark:from-emerald-400 dark:to-blue-400 bg-clip-text text-transparent mb-3 sm:mb-4">
            What is your Reliva?
          </div>
          <div className="flex flex-row items-center justify-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <Link href="/signup">
              <Button
                size="lg"
                className="flex-1 bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 dark:from-emerald-500 dark:to-blue-500 dark:hover:from-emerald-600 dark:hover:to-blue-600 text-white px-4 sm:px-6 py-2.5 sm:py-3 shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105 text-sm sm:text-base"
              >
                Sign up
                <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link href="/login">
              <Button
                variant="outline"
                size="lg"
                className="flex-1 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 px-4 sm:px-6 py-2.5 sm:py-3 transition-all duration-300 ease-in-out transform hover:scale-105 text-sm sm:text-base"
              >
                <Play className="mr-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                Login
              </Button>
            </Link>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            Join the community and start sharing what you love
          </p>
        </div>
      </footer>
    </>
  );
}
