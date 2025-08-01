"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Heart,
  Share2,
  Star,
  BookOpen,
  Film,
  Tv,
  Music,
  ExternalLink,
  Github,
  Instagram,
  Globe,
  Calendar,
  TrendingUp,
  Eye,
  MessageCircle,
  Copy,
  Check,
  Users,
  UserPlus,
  UserCheck,
  MoreHorizontal,
  Settings,
  Edit,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

// Mock data with static images
const mockUser = {
  username: "@mockjunkie",
  displayName: "Media Junkie",
  bio: "Reads Murakami, watches Nolan, listens to Arctic Monkeys.",
  avatar:
    "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
  coverImage:
    "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=1200&h=400&fit=crop",
  social: {
    github: "https://github.com/mockjunkie",
    instagram: "https://instagram.com/mockjunkie",
    website: "https://mockjunkie.dev",
  },
  stats: {
    booksRead: 142,
    moviesWatched: 300,
    albumsSaved: 120,
    streak: 5,
    followers: 1247,
    following: 892,
  },
  genres: ["Sci-Fi", "Psychological", "Alt Rock", "Classic Literature"],
  topPicks: {
    movies: [
      {
        title: "Interstellar",
        poster:
          "https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=200&h=300&fit=crop",
        rating: 5,
      },
      {
        title: "Parasite",
        poster:
          "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=200&h=300&fit=crop",
        rating: 5,
      },
      {
        title: "The Godfather",
        poster:
          "https://images.unsplash.com/photo-1512070679279-8988d32161be?w=200&h=300&fit=crop",
        rating: 5,
      },
    ],
    series: [
      {
        title: "Breaking Bad",
        poster:
          "https://images.unsplash.com/photo-1574267432553-4b4628081c31?w=200&h=300&fit=crop",
        status: "Completed",
      },
      {
        title: "Mr. Robot",
        poster:
          "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=200&h=300&fit=crop",
        status: "Completed",
      },
      {
        title: "The Bear",
        poster:
          "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=200&h=300&fit=crop",
        status: "Watching",
      },
    ],
    books: [
      {
        title: "1984",
        author: "George Orwell",
        cover:
          "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=200&h=300&fit=crop",
        status: "Read",
      },
      {
        title: "Sapiens",
        author: "Yuval Noah Harari",
        cover:
          "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=200&h=300&fit=crop",
        status: "Read",
      },
      {
        title: "The Alchemist",
        author: "Paulo Coelho",
        cover:
          "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=200&h=300&fit=crop",
        status: "Reading",
      },
    ],
    albums: [
      {
        title: "AM",
        artist: "Arctic Monkeys",
        cover:
          "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200&h=200&fit=crop",
        rating: 5,
      },
      {
        title: "Random Access Memories",
        artist: "Daft Punk",
        cover:
          "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200&h=200&fit=crop",
        rating: 5,
      },
      {
        title: "Red (Taylor's Version)",
        artist: "Taylor Swift",
        cover:
          "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200&h=200&fit=crop",
        rating: 4,
      },
    ],
  },
  recentReviews: [
    { text: "Dune was dry but spicy 🔥", rating: 4, category: "Movies" },
    {
      text: "Murakami's magical realism hits different ✨",
      rating: 5,
      category: "Books",
    },
    {
      text: "Breaking Bad finale - perfection 👌",
      rating: 5,
      category: "Series",
    },
  ],
  admirers: 247,
  views: 1234,
  followers: [
    {
      id: 1,
      name: "Alex Chen",
      username: "@alexchen",
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop&crop=face",
      mutual: true,
    },
    {
      id: 2,
      name: "Sarah Kim",
      username: "@sarahkim",
      avatar:
        "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=50&h=50&fit=crop&crop=face",
      mutual: false,
    },
    {
      id: 3,
      name: "Mike Johnson",
      username: "@mikejohnson",
      avatar:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop&crop=face",
      mutual: true,
    },
    {
      id: 4,
      name: "Emma Wilson",
      username: "@emmawilson",
      avatar:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=50&h=50&fit=crop&crop=face",
      mutual: false,
    },
  ],
  following: [
    {
      id: 1,
      name: "David Lee",
      username: "@davidlee",
      avatar:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=50&h=50&fit=crop&crop=face",
      mutual: true,
    },
    {
      id: 2,
      name: "Lisa Park",
      username: "@lisapark",
      avatar:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=50&h=50&fit=crop&crop=face",
      mutual: false,
    },
    {
      id: 3,
      name: "Tom Anderson",
      username: "@tomanderson",
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop&crop=face",
      mutual: true,
    },
    {
      id: 4,
      name: "Rachel Green",
      username: "@rachelgreen",
      avatar:
        "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=50&h=50&fit=crop&crop=face",
      mutual: false,
    },
  ],
};

export default function BioPage() {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("movies");
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);

  const copyProfileLink = async () => {
    try {
      await navigator.clipboard.writeText("mediaflex.io/@mockjunkie");
      setCopied(true);
      toast({
        title: "Link copied!",
        description: "Profile link copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const renderTopPicks = (items: any[], type: string) => (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {items.map((item, index) => (
        <Card
          key={index}
          className="group hover:scale-105 transition-all duration-300 cursor-pointer overflow-hidden"
        >
          <CardContent className="p-0">
            <div className="relative">
              <div className="aspect-[2/3] relative overflow-hidden">
                <img
                  src={item.poster || item.cover}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute top-2 left-2">
                  <Badge variant="secondary" className="bg-black/50 text-white">
                    #{index + 1}
                  </Badge>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-sm truncate">{item.title}</h3>
                {item.artist && (
                  <p className="text-xs text-gray-500 truncate">
                    {item.artist}
                  </p>
                )}
                {item.author && (
                  <p className="text-xs text-gray-500 truncate">
                    {item.author}
                  </p>
                )}
                {item.rating && (
                  <div className="flex items-center gap-1 mt-2">
                    {[...Array(item.rating)].map((_, i) => (
                      <Star
                        key={i}
                        className="w-3 h-3 fill-yellow-400 text-yellow-400"
                      />
                    ))}
                  </div>
                )}
                {item.status && (
                  <Badge variant="secondary" className="mt-2 text-xs">
                    {item.status}
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderUserList = (users: any[], title: string) => (
    <div className="space-y-3">
      {users.map((user) => (
        <div
          key={user.id}
          className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-500 text-white">
                {user.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-white text-sm">{user.name}</p>
              <p className="text-gray-400 text-xs">{user.username}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {user.mutual && (
              <Badge
                variant="outline"
                className="text-xs bg-green-500/20 text-green-300 border-green-500/30"
              >
                Mutual
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white"
            >
              <UserPlus className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Cover Image */}
      <div className="relative h-64 md:h-80 overflow-hidden">
        <img
          src={mockUser.coverImage}
          alt="Cover"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex items-end gap-4">
            <Avatar className="w-20 h-20 md:w-24 md:h-24 border-4 border-white/20">
              <AvatarImage src={mockUser.avatar} alt={mockUser.displayName} />
              <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-500 text-white text-xl">
                {mockUser.displayName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold text-white">
                {mockUser.displayName}
              </h1>
              <Badge
                variant="outline"
                className="bg-purple-500/20 text-purple-300 border-purple-500/30 mt-1"
              >
                {mockUser.username}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20"
              >
                <Settings className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20"
              >
                <Edit className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Bio and Stats */}
        <Card className="mb-8 bg-black/40 backdrop-blur-xl border-gray-800">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <div className="flex-1">
                <p className="text-gray-300 mb-6 max-w-2xl">{mockUser.bio}</p>

                {/* Social Links */}
                <div className="flex items-center gap-3 mb-6">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 hover:text-white"
                  >
                    <Github className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 hover:text-white"
                  >
                    <Instagram className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 hover:text-white"
                  >
                    <Globe className="w-4 h-4" />
                  </Button>
                </div>

                {/* Stats Row */}
                <div className="flex items-center gap-6 text-sm text-gray-400 mb-6">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    <span>{mockUser.stats.booksRead} books</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Film className="w-4 h-4" />
                    <span>{mockUser.stats.moviesWatched} movies</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Music className="w-4 h-4" />
                    <span>{mockUser.stats.albumsSaved} albums</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    <span>{mockUser.stats.streak}-day streak</span>
                  </div>
                </div>

                {/* Followers/Following Stats */}
                <div className="flex items-center gap-6">
                  <button
                    onClick={() => setShowFollowers(true)}
                    className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
                  >
                    <Users className="w-4 h-4" />
                    <span className="font-semibold">
                      {mockUser.stats.followers}
                    </span>
                    <span className="text-gray-400">followers</span>
                  </button>
                  <button
                    onClick={() => setShowFollowing(true)}
                    className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span className="font-semibold">
                      {mockUser.stats.following}
                    </span>
                    <span className="text-gray-400">following</span>
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyProfileLink}
                  className="border-purple-500/30 text-purple-300 hover:bg-purple-500/20"
                >
                  {copied ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                  {copied ? "Copied!" : "Share"}
                </Button>
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                >
                  <Heart className="w-4 h-4 mr-2" />
                  Admire
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Genre Tags */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">
            Favorite Genres
          </h2>
          <div className="flex flex-wrap gap-2">
            {mockUser.genres.map((genre, index) => (
              <Badge
                key={genre}
                variant="outline"
                className={cn(
                  "bg-gradient-to-r text-white border-0",
                  index % 4 === 0 && "from-purple-500 to-purple-600",
                  index % 4 === 1 && "from-blue-500 to-blue-600",
                  index % 4 === 2 && "from-cyan-500 to-cyan-600",
                  index % 4 === 3 && "from-pink-500 to-pink-600"
                )}
              >
                {genre}
              </Badge>
            ))}
          </div>
        </div>

        {/* Top Picks Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-6">Top Picks</h2>
          <ScrollArea className="w-full">
            <div className="flex gap-6 pb-4">
              <div className="min-w-[300px]">
                <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                  🎬 Movies
                </h3>
                {renderTopPicks(mockUser.topPicks.movies, "movies")}
              </div>
              <div className="min-w-[300px]">
                <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                  📺 Series
                </h3>
                {renderTopPicks(mockUser.topPicks.series, "series")}
              </div>
              <div className="min-w-[300px]">
                <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                  📚 Books
                </h3>
                {renderTopPicks(mockUser.topPicks.books, "books")}
              </div>
              <div className="min-w-[300px]">
                <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                  🎵 Albums
                </h3>
                {renderTopPicks(mockUser.topPicks.albums, "albums")}
              </div>
            </div>
          </ScrollArea>
        </div>

        {/* Recent Reviews */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">
            Recent Reviews
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {mockUser.recentReviews.map((review, index) => (
              <Card
                key={index}
                className="bg-black/40 backdrop-blur-xl border-gray-800"
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <Badge variant="outline" className="text-xs">
                      {review.category}
                    </Badge>
                    <div className="flex items-center gap-1">
                      {[...Array(review.rating)].map((_, i) => (
                        <Star
                          key={i}
                          className="w-3 h-3 fill-yellow-400 text-yellow-400"
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-gray-300 text-sm">{review.text}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Detailed Tabs */}
        <Card className="bg-black/40 backdrop-blur-xl border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Collection Details</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-4 bg-gray-800/50">
                <TabsTrigger
                  value="movies"
                  className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300"
                >
                  🎬 Movies
                </TabsTrigger>
                <TabsTrigger
                  value="series"
                  className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-300"
                >
                  📺 Series
                </TabsTrigger>
                <TabsTrigger
                  value="books"
                  className="data-[state=active]:bg-yellow-500/20 data-[state=active]:text-yellow-300"
                >
                  📚 Books
                </TabsTrigger>
                <TabsTrigger
                  value="music"
                  className="data-[state=active]:bg-green-500/20 data-[state=active]:text-green-300"
                >
                  🎵 Music
                </TabsTrigger>
              </TabsList>

              <TabsContent value="movies" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {mockUser.topPicks.movies.map((movie, index) => (
                    <Card
                      key={index}
                      className="bg-gray-800/50 border-gray-700 overflow-hidden"
                    >
                      <div className="aspect-[2/3] relative">
                        <img
                          src={movie.poster}
                          alt={movie.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-white">
                          {movie.title}
                        </h3>
                        <div className="flex items-center gap-1 mt-1">
                          {[...Array(movie.rating)].map((_, i) => (
                            <Star
                              key={i}
                              className="w-3 h-3 fill-yellow-400 text-yellow-400"
                            />
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="series" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {mockUser.topPicks.series.map((series, index) => (
                    <Card
                      key={index}
                      className="bg-gray-800/50 border-gray-700 overflow-hidden"
                    >
                      <div className="aspect-[2/3] relative">
                        <img
                          src={series.poster}
                          alt={series.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-white">
                          {series.title}
                        </h3>
                        <Badge variant="secondary" className="mt-1 text-xs">
                          {series.status}
                        </Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="books" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {mockUser.topPicks.books.map((book, index) => (
                    <Card
                      key={index}
                      className="bg-gray-800/50 border-gray-700 overflow-hidden"
                    >
                      <div className="aspect-[2/3] relative">
                        <img
                          src={book.cover}
                          alt={book.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-white">
                          {book.title}
                        </h3>
                        <p className="text-sm text-gray-400">{book.author}</p>
                        <Badge variant="secondary" className="mt-1 text-xs">
                          {book.status}
                        </Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="music" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {mockUser.topPicks.albums.map((album, index) => (
                    <Card
                      key={index}
                      className="bg-gray-800/50 border-gray-700 overflow-hidden"
                    >
                      <div className="aspect-square relative">
                        <img
                          src={album.cover}
                          alt={album.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-white">
                          {album.title}
                        </h3>
                        <p className="text-sm text-gray-400">{album.artist}</p>
                        <div className="flex items-center gap-1 mt-1">
                          {[...Array(album.rating)].map((_, i) => (
                            <Star
                              key={i}
                              className="w-3 h-3 fill-yellow-400 text-yellow-400"
                            />
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Stats Footer */}
        <div className="mt-8 flex items-center justify-between text-sm text-gray-400">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4" />
              <span>{mockUser.admirers} admirers</span>
            </div>
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              <span>{mockUser.views} views</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4" />
            <span>Share your flex profile</span>
          </div>
        </div>

        {/* CTA for Public View */}
        <div className="mt-8 text-center">
          <Card className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 border-purple-500/30">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-white mb-4">
                Create Your Own Flex Profile
              </h2>
              <p className="text-gray-300 mb-6 max-w-md mx-auto">
                Show off your taste in movies, books, series, and music. Build
                your digital identity around what you love.
              </p>
              <Button
                size="lg"
                className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
              >
                Get Started
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Followers Modal */}
      {showFollowers && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-gray-900 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white">Followers</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFollowers(false)}
                className="text-gray-400 hover:text-white"
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent>
              {renderUserList(mockUser.followers, "Followers")}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Following Modal */}
      {showFollowing && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-gray-900 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white">Following</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFollowing(false)}
                className="text-gray-400 hover:text-white"
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent>
              {renderUserList(mockUser.following, "Following")}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
