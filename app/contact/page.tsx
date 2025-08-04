"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Mail,
  Instagram,
  Twitter,
  Linkedin,
  Github,
  ExternalLink,
  Star,
  MessageSquare,
  Users,
  Heart,
} from "lucide-react";

export default function ContactPage() {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [review, setReview] = useState("");

  const handleRatingClick = (value: number) => {
    setRating(value);
  };

  const handleRatingHover = (value: number) => {
    setHoveredRating(value);
  };

  const handleRatingLeave = () => {
    setHoveredRating(0);
  };

  const teamMembers = [
    {
      name: "Srikanth Jeeguru",
      role: "Project Lead",
      linkedin: "https://www.linkedin.com/in/srikanth-jiguru-43276527b",
      gmail: "srikanthirl211@gmail.com",
      avatar: "/placeholder-user.jpg",
    },
    {
      name: "Sushanth Kotamarti",
      role: "Developer",
      linkedin: "https://www.linkedin.com/in/sushanth2805",
      gmail: "sushanth@reliva.com",
      avatar: "/placeholder-user.jpg",
    },
    {
      name: "Karthik Sriramoju",
      role: "Developer",
      linkedin: "https://www.linkedin.com/in/karthik-sriramoju-",
      gmail: "karthik@reliva.com",
      avatar: "/placeholder-user.jpg",
    },
    {
      name: "Lokadhitya Matti",
      role: "Developer",
      linkedin: "https://www.linkedin.com/in/lokadithya-matti-8b84a926b",
      gmail: "lokadhitya@reliva.com",
      avatar: "/placeholder-user.jpg",
    },
  ];

  const socialLinks = [
    {
      name: "Instagram",
      url: "https://www.instagram.com/relivaofficial",
      icon: Instagram,
      color: "text-pink-500",
    },
    {
      name: "X (Twitter)",
      url: "https://x.com/relivaofficial",
      icon: Twitter,
      color: "text-blue-400",
    },
    {
      name: "Reddit",
      url: "https://www.reddit.com/r/relivaofficial",
      icon: ExternalLink,
      color: "text-orange-500",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-black dark:to-gray-900">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 dark:from-emerald-400 dark:to-blue-400 bg-clip-text text-transparent mb-4">
              Get in Touch
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              We'd love to hear from you. Share your thoughts, suggestions, or
              just say hello!
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Side - About Us */}
            <div className="lg:col-span-1">
              <Card className="h-full bg-white/80 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                    About Us
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    We're a team of passionate music enthusiasts, cinephiles and bookworms dedicated to
                    bringing you the best in music, books, movies, and TV shows.
                    Our platform is designed to help you share your favorites, discover your friend's
                    favorites, recommend new finds and connect with others who share your interests.  
                  </p>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    Our mission is to create a space where you can discover,
                    track, and share your favorite music, books, movies, and TV
                    shows with people who care for you.
                  </p>
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                    <Heart className="h-5 w-5" />
                    <span className="font-medium">
                      Built with love for media lovers
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Side - Main Content */}
            <div className="lg:col-span-2">
              <div className="grid md:grid-cols-2 gap-8">
                {/* Left Column - Contact Form */}
                <div className="space-y-6">
                  {/* Contact Us Section */}
                  <Card className="bg-white/80 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200 dark:border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">
                        Contact Us
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Socials */}
                      <div>
                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                          Socials
                        </h3>
                        <div className="space-y-2">
                          {socialLinks.map((social) => (
                            <a
                              key={social.name}
                              href={social.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                              <social.icon
                                className={`h-4 w-4 ${social.color}`}
                              />
                              <span className="text-sm text-gray-600 dark:text-gray-300">
                                {social.name}
                              </span>
                            </a>
                          ))}
                          <div className="flex items-center gap-3 p-2">
                            <Mail className="h-4 w-4 text-red-500" />
                            <span className="text-sm text-gray-600 dark:text-gray-300">
                              reliva211@gmail.com
                            </span>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* Rate Us Section */}
                      <div>
                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                          Rate Us
                        </h3>
                        <div className="flex items-center gap-1 mb-3">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              onClick={() => handleRatingClick(star)}
                              onMouseEnter={() => handleRatingHover(star)}
                              onMouseLeave={handleRatingLeave}
                              className="transition-colors"
                            >
                              <Star
                                className={`h-5 w-5 ${
                                  star <= (hoveredRating || rating)
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-gray-300 dark:text-gray-600"
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {rating > 0
                            ? `You rated us ${rating} star${
                                rating > 1 ? "s" : ""
                              }`
                            : "Click to rate us"}
                        </p>
                      </div>

                      <Separator />

                      {/* Review Suggestions */}
                      <div>
                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                          Review Suggestions
                        </h3>
                        <Textarea
                          placeholder="Share your thoughts, suggestions, or feedback..."
                          value={review}
                          onChange={(e) => setReview(e.target.value)}
                          className="min-h-[100px] resize-none"
                        />
                        <Button
                          className="mt-3 w-full bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 dark:from-emerald-500 dark:to-blue-500 dark:hover:from-emerald-600 dark:hover:to-blue-600"
                          disabled={!review.trim()}
                        >
                          <MessageSquare className="mr-2 h-4 w-4" />
                          Submit Review
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Right Column - Team */}
                <div>
                  <Card className="bg-white/80 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200 dark:border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Team
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {teamMembers.map((member, index) => (
                        <div key={index} className="space-y-3">
                          <div className="flex items-start gap-3">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-emerald-500 to-blue-500 flex items-center justify-center text-white font-semibold text-lg">
                              {member.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900 dark:text-white">
                                {member.name}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                                {member.role}
                              </p>
                              <div className="space-y-1">
                                <a
                                  href={member.linkedin}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                                >
                                  <Linkedin className="h-3 w-3" />
                                  <span>LinkedIn</span>
                                </a>
                                <a
                                  href={`mailto:${member.gmail}`}
                                  className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 hover:underline"
                                >
                                  <Mail className="h-3 w-3" />
                                  <span>Gmail</span>
                                </a>
                              </div>
                            </div>
                          </div>

                          {index < teamMembers.length - 1 && (
                            <Separator className="my-4" />
                          )}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>

          {/* Footer CTA */}
          <div className="text-center mt-12">
            <Card className="bg-gradient-to-r from-emerald-50 to-blue-50 dark:from-emerald-950/20 dark:to-blue-950/20 border border-emerald-200 dark:border-emerald-800">
              <CardContent className="py-8">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Join Our Community
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-2xl mx-auto">
                  Be part of a growing community of media enthusiasts. Share
                  your discoveries, get recommendations, and connect with people
                  who love what you love.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/signup">
                    <Button
                      size="lg"
                      className="bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 dark:from-emerald-500 dark:to-blue-500 dark:hover:from-emerald-600 dark:hover:to-blue-600"
                    >
                      Get Started
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-gray-300 dark:border-gray-600"
                  >
                    Learn More
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
