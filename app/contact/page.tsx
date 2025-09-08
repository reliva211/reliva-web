"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Mail,
  Instagram,
  Twitter,
  ExternalLink,
  Star,
  Heart,
} from "lucide-react";

export default function ContactPage() {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);

  const handleRatingClick = (value: number) => {
    setRating(value);
  };

  const handleRatingHover = (value: number) => {
    setHoveredRating(value);
  };

  const handleRatingLeave = () => {
    setHoveredRating(0);
  };

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
                    We're a team of passionate music enthusiasts, cinephiles and
                    bookworms dedicated to bringing you the best in music,
                    books, movies, and TV shows. Our platform is designed to
                    help you share your favorites, discover your friend's
                    favorites, recommend new finds and connect with others who
                    share your interests.
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
              <div className="max-w-2xl">
                {/* Contact Form */}
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

                      {/* Share your feedback */}
                      <div>
                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                          Share your feedback
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                          We absolutely care for your feedback! Please fill this
                          form so that we can serve you better.
                        </p>
                        <Button
                          onClick={() =>
                            window.open(
                              "https://docs.google.com/forms/d/1-aPFkjvwGMFmJs0m_q8JeNBaauXBggZ8O9vk9AvHf-g/edit",
                              "_blank"
                            )
                          }
                          className="w-full bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 dark:from-emerald-500 dark:to-blue-500 dark:hover:from-emerald-600 dark:hover:to-blue-600"
                        >
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Please fill this form to review Reliva
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
