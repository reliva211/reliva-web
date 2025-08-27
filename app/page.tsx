"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  BookOpen,
  Music,
  Film,
  Tv,
  Star,
  Users,
  MessageCircle,
  TrendingUp,
  ArrowRight,
  Play,
} from "lucide-react";

export default function LandingPage() {
  const { user, loading } = useCurrentUser();
  const router = useRouter();

  // If user is authenticated, redirect to reviews (dashboard)
  useEffect(() => {
    if (!loading && user) {
      router.push("/reviews");
    }
  }, [user, loading, router]);

  const features = [
    {
      icon: BookOpen,
      title: "Books & Literature",
      description:
        "Review your favorite books, discover new authors, and join literary discussions.",
      color: "text-blue-500",
    },
    {
      icon: Music,
      title: "Music & Audio",
      description:
        "Share your music taste, rate albums and songs, discover new artists.",
      color: "text-green-500",
    },
    {
      icon: Film,
      title: "Movies",
      description:
        "Rate and review movies, create watchlists, and discuss cinema with others.",
      color: "text-red-500",
    },
    {
      icon: Tv,
      title: "TV Series",
      description:
        "Track your favorite shows, review episodes, and follow trending series.",
      color: "text-purple-500",
    },
  ];

  const stats = [
    { icon: Users, label: "Active Users", value: "10K+" },
    { icon: Star, label: "Reviews Posted", value: "50K+" },
    { icon: MessageCircle, label: "Comments", value: "100K+" },
    { icon: TrendingUp, label: "Media Rated", value: "25K+" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  // If user is authenticated, show loading while redirecting
  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  // Only show landing page for non-authenticated users
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="border-b border-[#1a1a1a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-lg flex items-center justify-center">
                <Play className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
                Reliva
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => router.push("/login")}
                className="text-gray-300 hover:text-white"
              >
                Sign In
              </Button>
              <Button
                onClick={() => router.push("/signup")}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl sm:text-6xl font-bold mb-6 bg-gradient-to-r from-emerald-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
            Your Entertainment Universe
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
            Rate, review, and discover books, music, movies, and TV shows. Join
            a community of entertainment enthusiasts and share your taste with
            the world.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => router.push("/signup")}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 text-lg"
            >
              Start Your Journey
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => router.push("/login")}
              className="border-gray-600 text-gray-300 hover:bg-gray-800 px-8 py-3 text-lg"
            >
              Sign In
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#0f0f0f]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">
              Everything Entertainment in One Place
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              From bestselling novels to chart-topping albums, blockbuster
              movies to binge-worthy series - track and review all your
              entertainment in one beautiful platform.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="bg-[#1a1a1a] border-[#2a2a2a] hover:border-[#3a3a3a] transition-colors"
              >
                <CardContent className="p-6 text-center">
                  <div
                    className={`w-12 h-12 mx-auto mb-4 rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center`}
                  >
                    <feature.icon className={`w-6 h-6 ${feature.color}`} />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400 text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((stat, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-center">
                  <stat.icon className="w-8 h-8 text-emerald-500" />
                </div>
                <div className="text-2xl font-bold text-white">
                  {stat.value}
                </div>
                <div className="text-gray-400 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-emerald-900/20 to-blue-900/20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Start Reviewing?
          </h2>
          <p className="text-gray-300 text-lg mb-8">
            Join thousands of users sharing their entertainment experiences.
            Create your account and start building your personal media library
            today.
          </p>
          <Button
            size="lg"
            onClick={() => router.push("/signup")}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 text-lg"
          >
            Create Your Account
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#1a1a1a] py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center text-gray-400">
          <p>&copy; 2024 Reliva. Your entertainment companion.</p>
        </div>
      </footer>
    </div>
  );
}
