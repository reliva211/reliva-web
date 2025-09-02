"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MessageCircle, ArrowRight } from "lucide-react";

export default function TestThreadPage() {
  // Mock data for testing
  const mockReview = {
    id: "123",
    title: "Test Review - The Matrix",
    content: "This is a test review for The Matrix movie.",
  };

  const mockComments = [
    {
      id: "456",
      author: "Alice",
      content: "Great review! I loved the visual effects.",
      replies: 3,
    },
    {
      id: "789",
      author: "Bob",
      content: "The story was confusing at first but made sense later.",
      replies: 1,
    },
    {
      id: "101",
      author: "Charlie",
      content: "Keanu Reeves was perfect for the role.",
      replies: 0,
    },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#e0e0e0] mb-4">
            Thread Navigation Test
          </h1>
          <p className="text-[#808080] text-lg">
            This page tests the new thread-based navigation system.
          </p>
        </div>

        {/* Test Review */}
        <Card className="mb-8 border border-[#2a2a2a] bg-[#0f0f0f]">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-[#f0f0f0] mb-2">
              {mockReview.title}
            </h2>
            <p className="text-[#c0c0c0] mb-4">{mockReview.content}</p>
            <div className="flex items-center gap-2 text-[#808080]">
              <MessageCircle className="w-4 h-4" />
              <span className="text-sm">{mockComments.length} comments</span>
            </div>
          </div>
        </Card>

        {/* Test Comments */}
        <div className="space-y-6">
          <h3 className="text-xl font-semibold text-[#e0e0e0] border-b border-[#2a2a2a] pb-2">
            Top-Level Comments
          </h3>

          {mockComments.map((comment) => (
            <Card
              key={comment.id}
              className="border border-[#2a2a2a] bg-[#0f0f0f]"
            >
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    {comment.author.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium text-[#f5f5f5]">
                        {comment.author}
                      </span>
                      <span className="text-[#a0a0a0] text-xs bg-[#3a3a3a] px-2 py-0.5 rounded-full">
                        Test User
                      </span>
                    </div>
                    <p className="text-[#f0f0f0] text-sm mb-3">
                      {comment.content}
                    </p>

                    <div className="flex items-center gap-4 text-[#a0a0a0]">
                      <button className="flex items-center gap-1.5 hover:text-blue-400 transition-all duration-200 group">
                        <div className="p-1.5 rounded-full group-hover:bg-blue-600/20 transition-colors">
                          <MessageCircle className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-medium">Reply</span>
                      </button>

                      <button className="flex items-center gap-1.5 hover:text-rose-400 transition-all duration-200 group">
                        <div className="p-1.5 rounded-full group-hover:bg-rose-600/20 transition-colors">
                          <span className="text-xs font-medium">❤️ 0</span>
                        </div>
                      </button>

                      {/* Thread Navigation Link */}
                      {comment.replies > 0 && (
                        <Link
                          href={`/reviews/${mockReview.id}/thread/${comment.id}`}
                          className="flex items-center gap-1.5 hover:text-green-400 transition-all duration-200 group"
                        >
                          <div className="p-1.5 rounded-full group-hover:bg-green-600/20 transition-colors">
                            <MessageCircle className="w-4 h-4" />
                          </div>
                          <span className="text-xs font-medium">
                            💬 {comment.replies} replies
                          </span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Test Navigation */}
        <div className="mt-12">
          <Card className="border border-[#2a2a2a] bg-[#0f0f0f]">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-[#e0e0e0] mb-4">
                Test Thread Navigation
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-[#1a1a1a] rounded-lg">
                  <div>
                    <span className="text-[#f0f0f0] font-medium">
                      Comment 456
                    </span>
                    <span className="text-[#808080] text-sm ml-2">
                      (3 replies)
                    </span>
                  </div>
                  <Link href={`/reviews/${mockReview.id}/thread/456`}>
                    <Button className="bg-blue-600/80 hover:bg-blue-700/80 text-white">
                      View Thread
                    </Button>
                  </Link>
                </div>

                <div className="flex items-center justify-between p-3 bg-[#1a1a1a] rounded-lg">
                  <div>
                    <span className="text-[#f0f0f0] font-medium">
                      Comment 789
                    </span>
                    <span className="text-[#808080] text-sm ml-2">
                      (1 reply)
                    </span>
                  </div>
                  <Link href={`/reviews/${mockReview.id}/thread/789`}>
                    <Button className="bg-blue-600/80 hover:bg-blue-700/80 text-white">
                      View Thread
                    </Button>
                  </Link>
                </div>

                <div className="flex items-center justify-between p-3 bg-[#1a1a1a] rounded-lg">
                  <div>
                    <span className="text-[#f0f0f0] font-medium">
                      Comment 101
                    </span>
                    <span className="text-[#808080] text-sm ml-2">
                      (no replies)
                    </span>
                  </div>
                  <span className="text-[#606060] text-sm">
                    No thread to view
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Back to Main */}
        <div className="mt-8 text-center">
          <Link href="/reviews">
            <Button
              variant="outline"
              className="border-[#2a2a2a] text-[#c0c0c0] hover:bg-[#1a1a1a]"
            >
              Back to Reviews
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}


