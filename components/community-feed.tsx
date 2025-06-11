"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ThemeProvider } from "@/components/theme-provider"
import { EnhancedCreatePost } from "@/components/enhanced-create-post"
import { Heart, MessageCircle, Repeat2, Share, MoreHorizontal, Book, Music, Film, Plus } from "lucide-react"

interface Post {
  id: string
  user: {
    name: string
    username: string
    avatar: string
  }
  content: string
  category: "book" | "music" | "movie"
  timestamp: string
  likes: number
  comments: number
  retweets: number
  isLiked: boolean
  isRetweeted: boolean
  images?: string[]
}

const mockPosts: Post[] = [
  {
    id: "1",
    user: {
      name: "Sarah Chen",
      username: "sarahreads",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    content:
      "Just finished 'The Seven Husbands of Evelyn Hugo' and I'm absolutely speechless! The storytelling is phenomenal and the characters feel so real. 📚✨",
    category: "book",
    timestamp: "2h",
    likes: 24,
    comments: 8,
    retweets: 5,
    isLiked: false,
    isRetweeted: false,
    images: ["/placeholder.svg?height=300&width=400"],
  },
  {
    id: "2",
    user: {
      name: "Marcus Johnson",
      username: "musicmarc",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    content:
      "Discovered this incredible indie band called 'Lunar Echoes' today. Their album 'Midnight Reverie' is pure magic - perfect blend of dreamy synths and haunting vocals. 🎵",
    category: "music",
    timestamp: "4h",
    likes: 31,
    comments: 12,
    retweets: 8,
    isLiked: true,
    isRetweeted: false,
  },
  {
    id: "3",
    user: {
      name: "Emma Rodriguez",
      username: "cinemaemma",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    content:
      "Rewatched 'Parasite' last night and noticed so many details I missed the first time. Bong Joon-ho's direction is masterful - every frame tells a story. 🎬",
    category: "movie",
    timestamp: "6h",
    likes: 45,
    comments: 15,
    retweets: 12,
    isLiked: false,
    isRetweeted: true,
    images: ["/placeholder.svg?height=200&width=300", "/placeholder.svg?height=200&width=300"],
  },
  {
    id: "4",
    user: {
      name: "Alex Thompson",
      username: "bookwormalex",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    content:
      "Currently reading 'Klara and the Sun' by Kazuo Ishiguro. The perspective of an artificial friend is both heartbreaking and beautiful. Anyone else read this? 📖",
    category: "book",
    timestamp: "8h",
    likes: 18,
    comments: 6,
    retweets: 3,
    isLiked: true,
    isRetweeted: false,
  },
  {
    id: "5",
    user: {
      name: "Jordan Kim",
      username: "jordanbeats",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    content:
      "Taylor Swift's 'folklore' still hits different on rainy days. The storytelling in 'cardigan' and 'august' creates such vivid imagery. What's your favorite track? 🌧️🎶",
    category: "music",
    timestamp: "12h",
    likes: 67,
    comments: 23,
    retweets: 15,
    isLiked: false,
    isRetweeted: false,
  },
]

const categoryIcons = {
  book: Book,
  music: Music,
  movie: Film,
}

const categoryColors = {
  book: "text-emerald-500",
  music: "text-purple-500",
  movie: "text-blue-500",
}

export default function CommunityFeed() {
  const [posts, setPosts] = useState<Post[]>(mockPosts)

  const handleLike = (postId: string) => {
    setPosts(
      posts.map((post) =>
        post.id === postId
          ? {
              ...post,
              isLiked: !post.isLiked,
              likes: post.isLiked ? post.likes - 1 : post.likes + 1,
            }
          : post,
      ),
    )
  }

  const handleRetweet = (postId: string) => {
    setPosts(
      posts.map((post) =>
        post.id === postId
          ? {
              ...post,
              isRetweeted: !post.isRetweeted,
              retweets: post.isRetweeted ? post.retweets - 1 : post.retweets + 1,
            }
          : post,
      ),
    )
  }

  const addPost = (
    newPost: Omit<Post, "id" | "timestamp" | "likes" | "comments" | "retweets" | "isLiked" | "isRetweeted">,
  ) => {
    const post: Post = {
      ...newPost,
      id: Date.now().toString(),
      timestamp: "now",
      likes: 0,
      comments: 0,
      retweets: 0,
      isLiked: false,
      isRetweeted: false,
    }
    setPosts([post, ...posts])
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center justify-between px-4 max-w-2xl mx-auto">
          <h1 className="text-xl font-bold">Community</h1>
          <ThemeProvider />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto">
        {/* Compose Tweet Section */}
        <div className="border-b p-4">
          <div className="flex space-x-3">
            <Avatar className="h-10 w-10 flex-shrink-0">
              <AvatarImage src="/placeholder.svg?height=40&width=40" alt="You" />
              <AvatarFallback>You</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <EnhancedCreatePost onAddPost={addPost}>
                <Button
                  id="create-post-trigger"
                  variant="ghost"
                  className="w-full justify-start text-muted-foreground hover:bg-muted/50 h-12 text-base px-4"
                >
                  What's your latest discovery?
                </Button>
              </EnhancedCreatePost>
            </div>
          </div>
        </div>

        {/* Feed */}
        <ScrollArea className="h-[calc(100vh-10rem)]">
          <div className="divide-y">
            {posts.map((post) => {
              const CategoryIcon = categoryIcons[post.category]
              return (
                <article key={post.id} className="p-4 hover:bg-muted/30 transition-colors">
                  <div className="flex space-x-3">
                    <Avatar className="h-10 w-10 flex-shrink-0 mt-1">
                      <AvatarImage src={post.user.avatar || "/placeholder.svg"} alt={post.user.name} />
                      <AvatarFallback>
                        {post.user.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-1">
                        <div className="flex items-center space-x-2 min-w-0 flex-1">
                          <span className="font-semibold text-sm truncate max-w-[100px] sm:max-w-[150px]">
                            {post.user.name}
                          </span>
                          <span className="text-muted-foreground text-sm truncate max-w-[80px] sm:max-w-[120px]">
                            @{post.user.username}
                          </span>
                          <span className="text-muted-foreground text-sm hidden sm:inline">·</span>
                          <span className="text-muted-foreground text-sm">{post.timestamp}</span>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Category Badge */}
                      <div className="flex items-center space-x-2 mb-3">
                        <CategoryIcon className={`w-4 h-4 ${categoryColors[post.category]}`} />
                        <span className={`text-xs font-medium ${categoryColors[post.category]}`}>
                          {post.category.toUpperCase()}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="mb-3">
                        <p className="text-sm leading-relaxed break-words">{post.content}</p>
                      </div>

                      {/* Images */}
                      {post.images && post.images.length > 0 && (
                        <div className="mb-3 rounded-2xl overflow-hidden border">
                          {post.images.length === 1 ? (
                            <img
                              src={post.images[0] || "/placeholder.svg"}
                              alt="Post image"
                              className="w-full h-auto max-h-80 object-cover"
                            />
                          ) : (
                            <div className="grid grid-cols-2 gap-1">
                              {post.images.map((image, index) => (
                                <img
                                  key={index}
                                  src={image || "/placeholder.svg"}
                                  alt={`Post image ${index + 1}`}
                                  className="w-full h-32 sm:h-40 object-cover"
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex items-center justify-between max-w-md">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950 px-3 py-2 h-9"
                        >
                          <MessageCircle className="w-4 h-4 mr-2" />
                          <span className="text-sm">{post.comments}</span>
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          className={`hover:bg-green-50 dark:hover:bg-green-950 px-3 py-2 h-9 ${
                            post.isRetweeted ? "text-green-500" : "text-muted-foreground hover:text-green-500"
                          }`}
                          onClick={() => handleRetweet(post.id)}
                        >
                          <Repeat2 className="w-4 h-4 mr-2" />
                          <span className="text-sm">{post.retweets}</span>
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          className={`hover:bg-red-50 dark:hover:bg-red-950 px-3 py-2 h-9 ${
                            post.isLiked ? "text-red-500" : "text-muted-foreground hover:text-red-500"
                          }`}
                          onClick={() => handleLike(post.id)}
                        >
                          <Heart className={`w-4 h-4 mr-2 ${post.isLiked ? "fill-current" : ""}`} />
                          <span className="text-sm">{post.likes}</span>
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950 px-3 py-2 h-9"
                        >
                          <Share className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        </ScrollArea>

        {/* Floating Action Button for Mobile */}
        <Button
          size="lg"
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all z-50 sm:hidden"
          onClick={() => document.getElementById("create-post-trigger")?.click()}
        >
          <Plus className="h-6 w-6" />
          <span className="sr-only">Create post</span>
        </Button>
      </main>
    </div>
  )
}
