"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useTheme } from "next-themes";
import {
  Heart,
  MessageCircle,
  Sun,
  Moon,
  Music,
  Film,
  BookOpen,
  Star,
  Play,
  Calendar,
  MapPin,
  LinkIcon,
  User,
  Edit,
  ExternalLink,
  Twitter,
  Instagram,
  Linkedin,
  Github,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useProfile } from "@/hooks/use-profile";
import { EditProfileDialog } from "@/components/edit-profile";
import { ImageUpload, CoverImageUpload } from "@/components/image-upload";
import { useCurrentUser } from "@/hooks/use-current-user";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import Link from "next/link";

// Mock user for demo - replace with your auth system
const mockUser = {
  uid: "Lokadithya M",
  email: "lokad1thya.m@gmail.com",
};

// Mock collections data
const mockMusic = [
  { id: "1", name: "Radiohead", type: "artist", tags: ["alternative rock"] },
  { id: "2", title: "OK Computer", artistName: "Radiohead", type: "release" },
  {
    id: "3",
    title: "Paranoid Android",
    artistName: "Radiohead",
    type: "track",
  },
];

const mockMovies = [
  {
    id: 1,
    title: "Inception",
    year: 2010,
    cover: "/placeholder.svg?height=300&width=200",
    status: "Watched",
    rating: 5,
  },
  {
    id: 2,
    title: "The Matrix",
    year: 1999,
    cover: "/placeholder.svg?height=300&width=200",
    status: "Watched",
    rating: 5,
  },
];

const mockBooks = [
  {
    id: "1",
    title: "The Midnight Library",
    author: "Matt Haig",
    cover: "/placeholder.svg?height=300&width=200",
    status: "Reading",
    progress: 65,
  },
  {
    id: "2",
    title: "Atomic Habits",
    author: "James Clear",
    cover: "/placeholder.svg?height=300&width=200",
    status: "Completed",
    progress: 100,
  },
];

export async function fetchFavorites<T>(
  userId: string,
  type: "artist" | "release" | "track"
): Promise<T[]> {
  const colRef = collection(db, "users", userId, `favorite${type}s`);
  const snapshot = await getDocs(colRef);

  // Map and cast to T[], you can do minimal validation here if you want
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    // Optional: add id from doc.id if needed, e.g. data.id = parseInt(doc.id)
    return data as T;
  });
}

type Book = {
  progress: any;
  status: string;
  id: string;
  title: string;
  author: string;
  cover: string;
  rating: number | string;
};

interface Movie {
  id: string;
  title: string;
  // director: string;
  year: number;
  cover: string;
  status?: string;
  rating?: number;
  notes?: string;
}

interface UserProfileProps {
  userId?: string;
}

// Add Series type
type Series = {
  id: string;
  title: string;
  year: number;
  cover: string;
  status?: string;
  rating?: number;
  notes?: string;
};

export default function UserProfile({ userId: propUserId }: UserProfileProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const { user, loading: authLoading } = useCurrentUser();
  const userId = propUserId || user?.uid;
  const [savedBooks, setSavedBooks] = useState<Book[]>([]);
  const [savedMovies, setSavedMovies] = useState<Movie[]>([]);
  const [savedSeries, setSavedSeries] = useState<Series[]>([]);
  const [profileError, setProfileError] = useState<string | null>(null);

  const { profile, loading, saving, updateProfile, uploadImage } =
    useProfile(userId);

  // Fetch user data from Firestore
  useEffect(() => {
    if (!userId) return;
    const fetchSavedBooks = async () => {
      try {
        const booksCollection = collection(db, "users", userId, "books");
        const snapshot = await getDocs(booksCollection);
        const booksData: Book[] = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as Book)
        );
        setSavedBooks(booksData);
      } catch (err) {
        console.error("Failed to fetch saved books:", err);
      }
    };
    const fetchSavedMovies = async () => {
      try {
        const moviesCollection = collection(db, "users", userId, "movies");
        const snapshot = await getDocs(moviesCollection);
        const moviesData: Movie[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            title: data.title || "",
            year: data.year || 0,
            cover: data.cover || "",
            status: data.status || "Unknown",
            rating: data.rating || 0,
            notes: data.notes || "",
          } as Movie;
        });
        setSavedMovies(moviesData);
      } catch (err) {
        console.error("Failed to fetch saved movies:", err);
      }
    };
    const fetchSavedSeries = async () => {
      try {
        const seriesCollection = collection(db, "users", userId, "series");
        const snapshot = await getDocs(seriesCollection);
        const seriesData: Series[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            title: data.title || "",
            year: data.year || 0,
            cover: data.cover || "",
            status: data.status || "Unknown",
            rating: data.rating || 0,
            notes: data.notes || "",
          } as Series;
        });
        setSavedSeries(seriesData);
      } catch (err) {
        console.error("Failed to fetch saved series:", err);
      }
    };
    fetchSavedBooks();
    fetchSavedMovies();
    fetchSavedSeries();
  }, [userId]);

  const stats = {
    movies: savedMovies.length,
    books: savedBooks.length,
    series: savedSeries.length,
    watchedMovies: savedMovies.filter((m) => m.status === "Watched").length,
    readBooks: savedBooks.filter((b) => b.status === "Completed").length,
    currentlyReading: savedBooks.filter((b) => b.status === "Reading").length,
    watchedSeries: savedSeries.filter((s) => s.status === "Watched").length,
  };

  const handleCoverUpload = async (file: File) => {
    const url = await uploadImage(file, "cover");
    await updateProfile({ coverImageUrl: url });
  };

  const getSocialIcon = (platform: string) => {
    switch (platform) {
      case "twitter":
        return <Twitter className="h-4 w-4" />;
      case "instagram":
        return <Instagram className="h-4 w-4" />;
      case "linkedin":
        return <Linkedin className="h-4 w-4" />;
      case "github":
        return <Github className="h-4 w-4" />;
      default:
        return <ExternalLink className="h-4 w-4" />;
    }
  };

  if (!userId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-muted-foreground">
            Please log in to view your profile.
          </p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">
            {user?.displayName || "Your Name"}
          </h1>
          <p className="text-muted-foreground text-lg">
            {user?.email || "your@email.com"}
          </p>
          <p className="text-muted-foreground text-lg">@username</p>

          <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-muted-foreground justify-center">
            <div className="flex items-center gap-1 opacity-60">
              <LinkIcon className="h-4 w-4" />
              No website set
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Joined recently
            </div>
          </div>
          <div className="mt-3 text-muted-foreground opacity-60 text-sm">
            No social links added yet
          </div>
          {profileError && (
            <div className="mt-4 text-red-500">{profileError}</div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header with Cover Image */}
      <div className="relative h-48 md:h-64 bg-gradient-to-r from-primary/20 to-secondary/20">
        <CoverImageUpload onUpload={handleCoverUpload}>
          {profile.coverImageUrl ? (
            <Image
              src={profile.coverImageUrl || "/placeholder.svg"}
              alt="Cover"
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-primary/20 to-secondary/20" />
          )}
        </CoverImageUpload>

        <div className="absolute top-4 right-4 flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="bg-background/80 backdrop-blur-sm"
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setEditDialogOpen(true)}
            className="bg-background/80 backdrop-blur-sm"
          >
            <Edit className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Profile Info */}
      <div className="max-w-6xl mx-auto px-4 -mt-16 relative z-10 pt-4 sm:pt-0">
        <div className="flex flex-col md:flex-row gap-6 mb-8">
          <ImageUpload onUpload={handleCoverUpload} className="w-32 h-32">
            <Avatar className="w-32 h-32 border-4 border-background shadow-lg">
              <AvatarImage
                src={profile.avatarUrl || "/placeholder.svg"}
                alt={profile.displayName}
              />
              <AvatarFallback className="text-2xl">
                <User className="h-12 w-12" />
              </AvatarFallback>
            </Avatar>
          </ImageUpload>

          <div className="flex-1 md:mt-16">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold">
                  {profile.displayName || user?.displayName || "Your Name"}
                </h1>
                <p className="text-muted-foreground text-lg">
                  {user?.email || "your@email.com"}
                </p>
                <p className="text-muted-foreground text-lg">
                  @{profile.username || "username"}
                </p>

                {profile.bio && (
                  <p className="mt-2 max-w-md">
                    {profile.bio}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-muted-foreground">
                  {profile.website ? (
                    <div className="flex items-center gap-1">
                      <LinkIcon className="h-4 w-4" />
                      <a
                        href={
                          profile.website.startsWith("http")
                            ? profile.website
                            : `https://${profile.website}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-primary transition-colors"
                      >
                        {profile.website}
                      </a>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 opacity-60">
                      <LinkIcon className="h-4 w-4" />
                      No website set
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Joined{" "}
                    {profile.joinDate
                      ? new Date(profile.joinDate).toLocaleDateString("en-US", {
                          month: "long",
                          year: "numeric",
                        })
                      : "recently"}
                  </div>
                </div>

                {/* Social Links */}
                {Object.keys(profile.socialLinks).length > 0 ? (
                  <div className="flex gap-2 mt-3">
                    {Object.entries(profile.socialLinks).map(
                      ([platform, url]) => (
                        <Button
                          key={platform}
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          asChild
                        >
                          <a
                            href={
                              url.startsWith("http") ? url : `https://${url}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {getSocialIcon(platform)}
                          </a>
                        </Button>
                      )
                    )}
                  </div>
                ) : (
                  <div className="mt-3 text-muted-foreground opacity-60 text-sm">
                    No social links added yet
                  </div>
                )}

                <div className="flex gap-6 mt-4">
                  <div className="text-center">
                    <div className="font-bold text-lg">1.2K</div>
                    <div className="text-sm text-muted-foreground">
                      Followers
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-lg">567</div>
                    <div className="text-sm text-muted-foreground">
                      Following
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-lg">89</div>
                    <div className="text-sm text-muted-foreground">Posts</div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button>
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Message
                </Button>
                <Button variant="outline">
                  <Heart className="h-4 w-4 mr-2" />
                  Follow
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 text-center">
              <Film className="h-6 w-6 mx-auto mb-2 text-primary" />
              <div className="font-bold text-lg">{stats.movies}</div>
              <div className="text-sm text-muted-foreground">Movies</div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 text-center">
              <BookOpen className="h-6 w-6 mx-auto mb-2 text-primary" />
              <div className="font-bold text-lg">{stats.books}</div>
              <div className="text-sm text-muted-foreground">Books</div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 text-center">
              <Film className="h-6 w-6 mx-auto mb-2 text-primary" />
              <div className="font-bold text-lg">{stats.series}</div>
              <div className="text-sm text-muted-foreground">Series</div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 text-center">
              <Star className="h-6 w-6 mx-auto mb-2 text-yellow-500" />
              <div className="font-bold text-lg">{stats.watchedMovies}</div>
              <div className="text-sm text-muted-foreground">
                Watched Movies
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 text-center">
              <BookOpen className="h-6 w-6 mx-auto mb-2 text-green-500" />
              <div className="font-bold text-lg">{stats.readBooks}</div>
              <div className="text-sm text-muted-foreground">Read Books</div>
            </CardContent>
          </Card>
        </div>

        {/* Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="music">Music</TabsTrigger>
            <TabsTrigger value="movies">Movies</TabsTrigger>
            <TabsTrigger value="books">Books</TabsTrigger>
            <TabsTrigger value="series">Series</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Music Dashboard Link */}
              <Link href="/music" className="block">
                <Card className="hover:shadow-lg hover:ring-2 hover:ring-primary transition-all cursor-pointer h-full flex flex-col items-center justify-center py-12">
                  <CardHeader className="flex flex-col items-center">
                    <Music className="h-10 w-10 mb-2 text-primary" />
                    <CardTitle className="text-2xl">Music Dashboard</CardTitle>
                  </CardHeader>
                </Card>
              </Link>
              {/* Movies Dashboard Link */}
              <Link href="/movies" className="block">
                <Card className="hover:shadow-lg hover:ring-2 hover:ring-primary transition-all cursor-pointer h-full flex flex-col items-center justify-center py-12">
                  <CardHeader className="flex flex-col items-center">
                    <Film className="h-10 w-10 mb-2 text-primary" />
                    <CardTitle className="text-2xl">Movies Dashboard</CardTitle>
                  </CardHeader>
                </Card>
              </Link>
              {/* Books Dashboard Link */}
              <Link href="/books" className="block">
                <Card className="hover:shadow-lg hover:ring-2 hover:ring-primary transition-all cursor-pointer h-full flex flex-col items-center justify-center py-12">
                  <CardHeader className="flex flex-col items-center">
                    <BookOpen className="h-10 w-10 mb-2 text-primary" />
                    <CardTitle className="text-2xl">Books Dashboard</CardTitle>
                  </CardHeader>
                </Card>
              </Link>
              {/* Series Dashboard Link */}
              <Link href="/series" className="block">
                <Card className="hover:shadow-lg hover:ring-2 hover:ring-primary transition-all cursor-pointer h-full flex flex-col items-center justify-center py-12">
                  <CardHeader className="flex flex-col items-center">
                    <Film className="h-10 w-10 mb-2 text-primary" />
                    <CardTitle className="text-2xl">Series Dashboard</CardTitle>
                  </CardHeader>
                </Card>
              </Link>
            </div>
          </TabsContent>

          {/* Other tabs remain the same as before */}
          <TabsContent value="music" className="mt-6">
            <div className="text-center py-12">
              <Music className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Music Collection</h3>
              <p className="text-muted-foreground">
                Your music collection will appear here
              </p>
            </div>
          </TabsContent>

          <TabsContent value="movies" className="mt-6">
            {mockMovies.length === 0 ? (
              <div className="text-center py-12">
                <Film className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Movie Collection</h3>
                <p className="text-muted-foreground">
                  Your movie collection will appear here
                </p>
              </div>
            ) : (
              <>
                {/* Recent Movies */}
                <Card className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Film className="h-5 w-5" />
                      Movies Collection
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {mockMovies.slice(0, 5).map((movie) => (
                      <div
                        key={movie.id}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="w-10 h-10 relative rounded overflow-hidden">
                          <Image
                            src={
                              movie.cover ||
                              "/placeholder.svg?height=40&width=40"
                            }
                            alt={movie.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium leading-tight line-clamp-2 min-h-[2.5rem] flex items-start">
                            {movie.title}
                          </p>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">
                              {movie.status}
                            </Badge>
                            {movie.rating && movie.rating > 0 && (
                              <div className="flex items-center gap-1">
                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                <span className="text-xs">{movie.rating}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          <TabsContent value="books" className="mt-6">
            {mockBooks.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Book Collection</h3>
                <p className="text-muted-foreground">
                  Your book collection will appear here
                </p>
              </div>
            ) : (
              <>
                {/* Recent Books */}
                <Card className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5" />
                      Books Collection
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {mockBooks.slice(0, 5).map((book) => (
                      <div
                        key={book.id}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="w-10 h-10 relative rounded overflow-hidden">
                          <Image
                            src={
                              book.cover ||
                              "/placeholder.svg?height=40&width=40"
                            }
                            alt={book.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium leading-tight line-clamp-2 min-h-[2.5rem] flex items-start">
                            {book.title}
                          </p>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">
                              {book.status}
                            </Badge>
                            {book.progress &&
                              book.progress > 0 &&
                              book.status === "Reading" && (
                                <span className="text-xs text-muted-foreground">
                                  {book.progress}%
                                </span>
                              )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          <TabsContent value="series" className="mt-6">
            {savedSeries.length === 0 ? (
              <div className="text-center py-12">
                <Film className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Series Collection</h3>
                <p className="text-muted-foreground">
                  Your series collection will appear here
                </p>
              </div>
            ) : (
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Film className="h-5 w-5" />
                    Series Collection
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {savedSeries.slice(0, 10).map((series) => (
                    <div
                      key={series.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="w-10 h-10 relative rounded overflow-hidden">
                        <Image
                          src={
                            series.cover ||
                            "/placeholder.svg?height=40&width=40"
                          }
                          alt={series.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium leading-tight line-clamp-2 min-h-[2.5rem] flex items-start">
                          {series.title}
                        </p>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {series.status}
                          </Badge>
                          {series.rating && series.rating > 0 && (
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              <span className="text-xs">{series.rating}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Profile Dialog */}
      {profile && (
        <EditProfileDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          profile={profile}
          onSave={updateProfile}
          saving={saving}
        />
      )}
    </div>
  );
}
