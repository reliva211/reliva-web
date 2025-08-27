"use client";

import { useCurrentUser } from "@/hooks/use-current-user";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Zap } from "lucide-react";

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
