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
  const colRef = collection(
    db,
    "users",
    userId,
    `favorite${capitalize(type)}s`
  );
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
  id: number;
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

export default function UserProfile({ userId: propUserId }: UserProfileProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const user = useCurrentUser();
  const userId = propUserId || user?.uid;
  const [mockBooks, setSavedBooks] = useState<Book[]>([]);
  const [mockMovies, setSavedMovies] = useState<Movie[]>([]);
  const [profileError, setProfileError] = useState<string | null>(null);

  const { profile, loading, saving, updateProfile, uploadImage } =
    useProfile(userId);

  const fetchUserMovies = async (uid: string) => {
    const querySnapshot = await getDocs(collection(db, `users/${uid}/movies`));
    const movies: Movie[] = [];
    const ids: number[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      movies.push(data as Movie);
      ids.push(data.id);
    });

    setSavedMovies(
      movies.map((movie) => ({
        ...movie,
        status: movie.status || "Unknown", // Ensure status is always a string
        rating: movie.rating || 0, // Ensure rating is always a number
        notes: movie.notes || "", // Ensure notes is always a string
      }))
    );
  };

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
        if (user && user.uid) fetchUserMovies(user.uid);
      } catch (err) {
        console.error("Failed to fetch saved books:", err);
      }
    };

    fetchSavedBooks();
  }, [userId, user]);

  const stats = {
    music: mockMusic.length,
    movies: mockMovies.length,
    books: mockBooks.length,
    watchedMovies: mockMovies.filter((m) => m.status === "Watched").length,
    readBooks: mockBooks.filter((b) => b.status === "Completed").length,
    currentlyReading: mockBooks.filter((b) => b.status === "Reading").length,
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
          <p className="mt-1 text-sm font-medium text-primary">
            Add a tagline to your profile!
          </p>
          <p className="mt-2 max-w-md mx-auto">
            Add your bio to let others know more about you!
          </p>
          <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-muted-foreground justify-center">
            <div className="flex items-center gap-1 opacity-60">
              <MapPin className="h-4 w-4" />
              No location set
            </div>
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
      <div className="max-w-6xl mx-auto px-4 -mt-16 relative z-10">
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
                <p className="mt-1 text-sm font-medium text-primary">
                  {profile.tagline || "Add a tagline to your profile!"}
                </p>
                <p className="mt-2 max-w-md">
                  {profile.bio ||
                    "Add your bio to let others know more about you!"}
                </p>

                <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-muted-foreground">
                  {profile.location ? (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {profile.location}
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 opacity-60">
                      <MapPin className="h-4 w-4" />
                      No location set
                    </div>
                  )}
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
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 text-center">
              <Music className="h-6 w-6 mx-auto mb-2 text-primary" />
              <div className="font-bold text-lg">{stats.music}</div>
              <div className="text-sm text-muted-foreground">Music Items</div>
            </CardContent>
          </Card>
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
              <Star className="h-6 w-6 mx-auto mb-2 text-yellow-500" />
              <div className="font-bold text-lg">{stats.watchedMovies}</div>
              <div className="text-sm text-muted-foreground">Watched</div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 text-center">
              <BookOpen className="h-6 w-6 mx-auto mb-2 text-green-500" />
              <div className="font-bold text-lg">{stats.readBooks}</div>
              <div className="text-sm text-muted-foreground">Read</div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 text-center">
              <BookOpen className="h-6 w-6 mx-auto mb-2 text-blue-500" />
              <div className="font-bold text-lg">{stats.currentlyReading}</div>
              <div className="text-sm text-muted-foreground">Reading</div>
            </CardContent>
          </Card>
        </div>

        {/* Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="music">Music</TabsTrigger>
            <TabsTrigger value="movies">Movies</TabsTrigger>
            <TabsTrigger value="books">Books</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent Music */}
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Music className="h-5 w-5" />
                    Recent Music
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {mockMusic.slice(0, 5).map((item) => (
                    <div
                      key={`${item.type}-${item.id}`}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                        <Music className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {item.name || item.title}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {item.type === "artist"
                            ? "Artist"
                            : item.type === "release"
                            ? `Album by ${item.artistName}`
                            : `Track by ${item.artistName}`}
                        </p>
                      </div>
                      {item.type === "track" && (
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Play className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Recent Movies */}
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Film className="h-5 w-5" />
                    Recent Movies
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
                            movie.cover || "/placeholder.svg?height=40&width=40"
                          }
                          alt={movie.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{movie.title}</p>
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

              {/* Recent Books */}
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Recent Books
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
                            book.cover || "/placeholder.svg?height=40&width=40"
                          }
                          alt={book.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{book.title}</p>
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
                          <p className="font-medium truncate">{movie.title}</p>
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
                          <p className="font-medium truncate">{book.title}</p>
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
function capitalize(type: string) {
  throw new Error("Function not implemented.");
}
