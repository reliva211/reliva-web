"use client";

import { useCurrentUser } from "@/hooks/use-current-user";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { use } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Star,
  Play,
  Plus,
  Heart,
  Edit,
  ArrowLeft,
  Calendar,
  Clock,
  Users,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  doc,
  setDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Video {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
  official: boolean;
}

interface MovieDetail {
  id: number;
  title: string;
  overview: string;
  poster_path: string;
  backdrop_path: string;
  release_date: string;
  vote_average: number;
  vote_count: number;
  genres: Array<{ id: number; name: string }>;
  runtime: number;
  status: string;
  tagline: string;
  videos?: {
    results: Video[];
  };
  credits?: {
    cast: Array<{
      id: number;
      name: string;
      character: string;
      profile_path: string | null;
    }>;
    crew: Array<{
      id: number;
      name: string;
      job: string;
      department: string;
      profile_path: string | null;
    }>;
  };
}

interface UserList {
  id: string;
  name: string;
  isPublic?: boolean;
}

interface SimilarMovie {
  id: number;
  title: string;
  poster_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
}

export default function MovieDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const { user, loading: authLoading } = useCurrentUser();
  const router = useRouter();
  const [movie, setMovie] = useState<MovieDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userLists, setUserLists] = useState<UserList[]>([]);
  const [selectedListId, setSelectedListId] = useState("");
  const [addToListOpen, setAddToListOpen] = useState(false);
  const [isSavingToList, setIsSavingToList] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [trailerOpen, setTrailerOpen] = useState(false);
  const [selectedTrailer, setSelectedTrailer] = useState<Video | null>(null);
  const [similarMovies, setSimilarMovies] = useState<SimilarMovie[]>([]);
  const [loadingSimilar, setLoadingSimilar] = useState(false);

  // Default collections for movies
  const defaultCollections = [
    { name: "Watched", isDefault: true, color: "bg-green-500" },
    { name: "Watchlist", isDefault: true, color: "bg-purple-500" },
    { name: "Dropped", isDefault: true, color: "bg-red-500" },
    { name: "Recommendations", isDefault: true, color: "bg-blue-500" },
  ];

  useEffect(() => {
    if (!authLoading && user === null) {
      router.replace("/login");
      return;
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;

    const fetchMovieDetails = async () => {
      try {
        setLoading(true);
        const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY;
        const response = await fetch(
          `https://api.themoviedb.org/3/movie/${resolvedParams.id}?api_key=${apiKey}&append_to_response=videos,credits`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch movie details");
        }

        const data = await response.json();
        setMovie(data);
      } catch (err) {
        setError("Failed to load movie details");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    const fetchSimilarMovies = async () => {
      try {
        setLoadingSimilar(true);
        const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY;
        const response = await fetch(
          `https://api.themoviedb.org/3/movie/${resolvedParams.id}/similar?api_key=${apiKey}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch similar movies");
        }

        const data = await response.json();
        setSimilarMovies(data.results || []);
      } catch (err) {
        console.error("Error fetching similar movies:", err);
      } finally {
        setLoadingSimilar(false);
      }
    };

    const fetchUserLists = async () => {
      if (!user?.uid) return;
      try {
        const listsRef = collection(db, "users", user.uid, "movieCollections");
        const snapshot = await getDocs(listsRef);
        const listsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as UserList[];

        // Create default collections if they don't exist
        const existingNames = listsData.map((col) => col.name);
        const missingDefaults = defaultCollections.filter(
          (col) => !existingNames.includes(col.name)
        );

        if (missingDefaults.length > 0) {
          for (const defaultCol of missingDefaults) {
            await addDoc(listsRef, defaultCol);
          }
          // Refetch collections
          const newSnapshot = await getDocs(listsRef);
          const allLists = newSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as UserList[];
          setUserLists(allLists);
        } else {
          setUserLists(listsData);
        }
      } catch (err) {
        console.error("Error fetching user lists:", err);
      }
    };

    fetchMovieDetails();
    fetchSimilarMovies();
    fetchUserLists();
  }, [resolvedParams.id, user]);

  const handleAddToList = async () => {
    if (!user?.uid || !selectedListId || !movie) return;

    setIsSavingToList(true);
    try {
      // Add movie to the main movies collection
      const movieData = {
        id: movie.id,
        title: movie.title,
        year: new Date(movie.release_date).getFullYear(),
        cover: movie.poster_path
          ? `https://image.tmdb.org/t/p/w300${movie.poster_path}`
          : "/placeholder.svg",
        rating: movie.vote_average,
        notes: "",
        status: "Watchlist",
        collections: [selectedListId],
        overview: movie.overview || "",
        release_date: movie.release_date || "",
      };

      await setDoc(
        doc(db, "users", user.uid, "movies", String(movie.id)),
        movieData
      );

      // If adding to Recommendations collection, also add to the recommendations subcollection
      const selectedCollection = userLists.find(
        (list) => list.id === selectedListId
      );
      if (selectedCollection && selectedCollection.name === "Recommendations") {
        try {
          const recommendationsRef = collection(
            db,
            "users",
            user.uid,
            "movieRecommendations"
          );
          await setDoc(doc(recommendationsRef, String(movie.id)), {
            id: movie.id,
            title: movie.title,
            year: new Date(movie.release_date).getFullYear(),
            cover: movie.poster_path
              ? `https://image.tmdb.org/t/p/w300${movie.poster_path}`
              : "/placeholder.svg",
            overview: movie.overview || "",
            release_date: movie.release_date || "",
            addedAt: new Date(),
            isPublic: true,
          });
        } catch (error) {
          console.error(
            "Error adding to recommendations subcollection:",
            error
          );
        }
      }

      setAddToListOpen(false);
      setSelectedListId("");
    } catch (err) {
      console.error("Error adding movie to list:", err);
      alert("Failed to add movie to list. Please try again.");
    } finally {
      setIsSavingToList(false);
    }
  };

  const getBestTrailer = () => {
    if (!movie?.videos?.results) return null;

    const trailers = movie.videos.results.filter(
      (video) => video.site === "YouTube" && video.type === "Trailer"
    );

    if (trailers.length === 0) return null;

    // Prefer official trailers, then the first one
    const officialTrailer = trailers.find((trailer) => trailer.official);
    return officialTrailer || trailers[0];
  };

  const handleTrailerClick = () => {
    const trailer = getBestTrailer();
    if (trailer) {
      setSelectedTrailer(trailer);
      setTrailerOpen(true);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <div className="text-center p-8 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (user === null) return null;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <div className="text-center p-8 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading movie details...</p>
        </div>
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <div className="text-center p-8 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50">
          <p className="text-destructive mb-6">{error || "Movie not found"}</p>
          <Button onClick={() => router.back()} className="rounded-xl">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-8 rounded-xl hover:bg-muted/50 transition-all duration-200 group"
        >
          <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back
        </Button>

        {/* Hero Section with Backdrop */}
        <div className="relative mb-12 rounded-3xl overflow-hidden">
          {movie.backdrop_path && (
            <>
              <div className="absolute inset-0">
                <Image
                  src={`https://image.tmdb.org/t/p/original${movie.backdrop_path}`}
                  alt={movie.title}
                  fill
                  className="object-cover blur-sm"
                  priority
                />
              </div>
              {/* Overlay to reduce background image opacity */}
              <div className="absolute inset-0 bg-black/60"></div>
            </>
          )}

          <div className="relative z-10 p-8 lg:p-12">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-end">
              {/* Poster */}
              <div className="lg:col-span-1">
                <div className="relative group max-w-xs mx-auto lg:mx-0">
                  <div className="aspect-[2/3] rounded-2xl overflow-hidden bg-gradient-to-br from-muted to-muted/50 shadow-2xl group-hover:shadow-3xl transition-all duration-300">
                    <Image
                      src={
                        movie.poster_path
                          ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                          : "/placeholder.svg"
                      }
                      alt={movie.title}
                      width={400}
                      height={600}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  {/* Subtle overlay gradient */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-black/10 via-transparent to-transparent pointer-events-none"></div>
                </div>
              </div>

              {/* Details */}
              <div className="lg:col-span-2 space-y-4">
                <div className="space-y-2">
                  <h1 className="text-4xl lg:text-6xl font-bold text-white drop-shadow-2xl">
                    {movie.title}
                  </h1>
                  {movie.tagline && (
                    <p className="text-lg lg:text-xl text-white italic drop-shadow-lg">
                      "{movie.tagline}"
                    </p>
                  )}
                </div>

                {/* Quick Stats */}
                <div className="flex flex-wrap items-center gap-6">
                  <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-background/60 backdrop-blur-sm border border-border/50 shadow-lg">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">
                      {new Date(movie.release_date).getFullYear()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-background/60 backdrop-blur-sm border border-border/50 shadow-lg">
                    <Clock className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">
                      {movie.runtime} min
                    </span>
                  </div>
                </div>

                {/* Overview */}
                <div className="p-6 rounded-2xl bg-background/60 backdrop-blur-sm border border-border/50 shadow-lg">
                  <p className="text-foreground leading-relaxed text-base">
                    {movie.overview}
                  </p>
                </div>

                {/* Genres */}
                {movie.genres && (
                  <div className="flex flex-wrap gap-2">
                    {movie.genres.map((genre) => (
                      <Badge
                        key={genre.id}
                        variant="outline"
                        className="rounded-lg px-3 py-1 text-sm font-medium bg-white/20 text-white border-white/30"
                      >
                        {genre.name}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-4">
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={handleTrailerClick}
                    disabled={!getBestTrailer()}
                    className="rounded-xl hover:bg-muted/50 transition-all duration-200 group bg-background/60 border-border/50"
                  >
                    <Play className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                    {getBestTrailer() ? "Watch Trailer" : "No Trailer"}
                  </Button>
                  <Button
                    size="lg"
                    onClick={() =>
                      router.push(
                        `/reviews?type=movie&id=${
                          resolvedParams.id
                        }&title=${encodeURIComponent(
                          movie.title
                        )}&cover=${encodeURIComponent(
                          movie.poster_path
                            ? `https://image.tmdb.org/t/p/w300${movie.poster_path}`
                            : "/placeholder.svg"
                        )}`
                      )
                    }
                    className="rounded-xl hover:scale-105 transition-all duration-200"
                  >
                    <Star className="w-5 h-5 mr-2" />
                    Rate
                  </Button>
                  <Dialog open={addToListOpen} onOpenChange={setAddToListOpen}>
                    <DialogTrigger asChild>
                      <Button
                        size="lg"
                        className="rounded-xl hover:scale-105 transition-all duration-200"
                      >
                        <Plus className="w-5 h-5 mr-2" />
                        Add to List
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="rounded-2xl">
                      <DialogHeader>
                        <DialogTitle>Add to List</DialogTitle>
                        <DialogDescription>
                          Choose a list to add "{movie.title}" to.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        {userLists.length > 0 ? (
                          <div className="space-y-2">
                            {userLists.map((list) => (
                              <label
                                key={list.id}
                                className="flex items-center gap-3 cursor-pointer p-3 rounded-xl hover:bg-muted/50 transition-colors"
                              >
                                <input
                                  type="radio"
                                  name="movie-list"
                                  value={list.id}
                                  checked={selectedListId === list.id}
                                  onChange={() => setSelectedListId(list.id)}
                                  className="text-primary"
                                />
                                <span className="font-medium">{list.name}</span>
                              </label>
                            ))}
                          </div>
                        ) : (
                          <p className="text-muted-foreground text-sm">
                            No lists available. Create a list first.
                          </p>
                        )}
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button
                          onClick={handleAddToList}
                          disabled={isSavingToList || !selectedListId}
                          className="rounded-xl"
                        >
                          {isSavingToList ? "Saving..." : "Add to List"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="space-y-8">
          {/* Navigation Tabs */}
          <div className="flex justify-center">
            <div className="inline-flex h-14 items-center justify-center rounded-2xl bg-muted/30 backdrop-blur-sm border border-border/20 p-1 gap-1">
              {["overview", "cast/crew", "reviews", "similar"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`inline-flex items-center justify-center whitespace-nowrap rounded-xl px-6 py-3 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
                    activeTab === tab
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-muted/50"
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Content Area */}
          <div className="min-h-[400px] bg-card/50 backdrop-blur-sm rounded-2xl p-8 border border-border/30 shadow-lg">
            {activeTab === "overview" && (
              <div className="space-y-8">
                {/* Movie Information */}
                <div className="space-y-6">
                  <h3 className="text-2xl font-semibold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                    Movie Information
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="p-4 rounded-xl bg-muted/30 backdrop-blur-sm border border-border/20">
                      <span className="text-muted-foreground text-sm">
                        Release Date
                      </span>
                      <p className="font-medium">
                        {new Date(movie.release_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-muted/30 backdrop-blur-sm border border-border/20">
                      <span className="text-muted-foreground text-sm">
                        Runtime
                      </span>
                      <p className="font-medium">{movie.runtime} minutes</p>
                    </div>
                    <div className="p-4 rounded-xl bg-muted/30 backdrop-blur-sm border border-border/20">
                      <span className="text-muted-foreground text-sm">
                        Status
                      </span>
                      <p className="font-medium">{movie.status}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-muted/30 backdrop-blur-sm border border-border/20">
                      <span className="text-muted-foreground text-sm">
                        Rating
                      </span>
                      <p className="font-medium">{movie.vote_average}/10</p>
                    </div>
                  </div>
                </div>

                {/* Top 10 Cast */}
                {movie.credits?.cast && movie.credits.cast.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-2xl font-semibold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                        Top Cast
                      </h3>
                      <button
                        onClick={() => setActiveTab("cast/crew")}
                        className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors duration-200"
                      >
                        View More
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                      {movie.credits.cast.slice(0, 10).map((actor, index) => (
                        <div
                          key={`overview-cast-${actor.id}-${index}`}
                          className="flex items-center space-x-3 p-3 bg-muted/30 backdrop-blur-sm rounded-xl cursor-pointer hover:bg-muted/50 transition-all duration-200 group border border-border/20"
                          onClick={() => router.push(`/person/${actor.id}`)}
                        >
                          {actor.profile_path ? (
                            <Image
                              src={`https://image.tmdb.org/t/p/w92${actor.profile_path}`}
                              alt={actor.name}
                              width={40}
                              height={40}
                              className="rounded-full object-cover group-hover:scale-110 transition-transform duration-200"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = "/placeholder-user.jpg";
                              }}
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                              <span className="text-xs font-medium text-muted-foreground">
                                {actor.name.charAt(0)}
                              </span>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-foreground truncate group-hover:text-primary transition-colors duration-200">
                              {actor.name}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {actor.character}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Top 10 Crew */}
                {movie.credits?.crew && movie.credits.crew.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-2xl font-semibold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                        Top Crew
                      </h3>
                      <button
                        onClick={() => setActiveTab("cast/crew")}
                        className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors duration-200"
                      >
                        View More
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                      {movie.credits.crew.slice(0, 10).map((person, index) => (
                        <div
                          key={`overview-crew-${person.id}-${index}`}
                          className="flex items-center space-x-3 p-3 bg-muted/30 backdrop-blur-sm rounded-xl cursor-pointer hover:bg-muted/50 transition-all duration-200 group border border-border/20"
                          onClick={() => router.push(`/person/${person.id}`)}
                        >
                          {person.profile_path ? (
                            <Image
                              src={`https://image.tmdb.org/t/p/w92${person.profile_path}`}
                              alt={person.name}
                              width={40}
                              height={40}
                              className="rounded-full object-cover group-hover:scale-110 transition-transform duration-200"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = "/placeholder-user.jpg";
                              }}
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                              <span className="text-xs font-medium text-muted-foreground">
                                {person.name.charAt(0)}
                              </span>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-foreground truncate group-hover:text-primary transition-colors duration-200">
                              {person.name}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {person.job}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Reviews Section */}
                <div className="space-y-4">
                  <h3 className="text-2xl font-semibold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                    Reviews
                  </h3>
                  <div className="p-6 rounded-xl bg-muted/30 backdrop-blur-sm border border-border/20">
                    <p className="text-muted-foreground">
                      No reviews available for this movie yet. Be the first to write a review!
                    </p>
                    <Button 
                      className="mt-4"
                      onClick={() => router.push(`/reviews?type=movie&id=${movie.id}&title=${encodeURIComponent(movie.title)}&cover=${encodeURIComponent(movie.poster_path || '')}`)}
                    >
                      Write a Review
                    </Button>
                  </div>
                </div>

                {/* Top 5 Similar Movies */}
                {similarMovies.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-2xl font-semibold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                        Similar Movies
                      </h3>
                      <button
                        onClick={() => setActiveTab("similar")}
                        className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors duration-200"
                      >
                        View More
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                      {similarMovies.slice(0, 5).map((similarMovie) => (
                        <div
                          key={similarMovie.id}
                          className="group cursor-pointer transition-all duration-200 hover:scale-105"
                          onClick={() => router.push(`/movies/${similarMovie.id}`)}
                        >
                          <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-muted/30 border border-border/20">
                            {similarMovie.poster_path ? (
                              <Image
                                src={`https://image.tmdb.org/t/p/w500${similarMovie.poster_path}`}
                                alt={similarMovie.title}
                                fill
                                className="object-cover group-hover:scale-110 transition-transform duration-300"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = "/placeholder.svg";
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-muted/50">
                                <span className="text-muted-foreground text-sm">No Image</span>
                              </div>
                            )}
                            

                          </div>
                          
                          <div className="mt-3 space-y-1">
                            <h4 className="font-medium text-sm text-foreground line-clamp-2 group-hover:text-primary transition-colors duration-200">
                              {similarMovie.title}
                            </h4>
                            <p className="text-xs text-muted-foreground">
                              {similarMovie.release_date ? new Date(similarMovie.release_date).getFullYear() : 'Unknown'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "cast/crew" && (
              <div className="space-y-8">
                {movie.credits?.cast && movie.credits.cast.length > 0 && (
                  <div>
                    <h3 className="text-2xl font-semibold mb-6 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                      Cast
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {movie.credits.cast.map((actor, index) => (
                        <div
                          key={`cast-${actor.id}-${index}`}
                          className="flex items-center space-x-3 p-4 bg-muted/30 backdrop-blur-sm rounded-xl cursor-pointer hover:bg-muted/50 transition-all duration-200 group border border-border/20"
                          onClick={() => router.push(`/person/${actor.id}`)}
                        >
                          {actor.profile_path ? (
                            <Image
                              src={`https://image.tmdb.org/t/p/w92${actor.profile_path}`}
                              alt={actor.name}
                              width={48}
                              height={48}
                              className="rounded-full object-cover group-hover:scale-110 transition-transform duration-200"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = "/placeholder-user.jpg";
                              }}
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                              <span className="text-sm font-medium text-muted-foreground">
                                {actor.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                              {actor.name}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {actor.character}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {movie.credits?.crew && movie.credits.crew.length > 0 && (
                  <div>
                    <h3 className="text-2xl font-semibold mb-6 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                      Crew
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {movie.credits.crew
                        .filter((person) =>
                          [
                            "Director",
                            "Writer",
                            "Producer",
                            "Screenplay",
                          ].includes(person.job)
                        )

                        .map((person, index) => (
                          <div
                            key={`crew-${person.id}-${index}`}
                            className="flex items-center space-x-3 p-4 bg-muted/30 backdrop-blur-sm rounded-xl cursor-pointer hover:bg-muted/50 transition-all duration-200 group border border-border/20"
                            onClick={() => router.push(`/person/${person.id}`)}
                          >
                            {person.profile_path ? (
                              <Image
                                src={`https://image.tmdb.org/t/p/w92${person.profile_path}`}
                                alt={person.name}
                                width={48}
                                height={48}
                                className="rounded-full object-cover group-hover:scale-110 transition-transform duration-200"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = "/placeholder-user.jpg";
                                }}
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                                <span className="text-sm font-medium text-muted-foreground">
                                  {person.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                                {person.name}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {person.job}
                              </p>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {(!movie.credits?.cast || movie.credits.cast.length === 0) &&
                  (!movie.credits?.crew || movie.credits.crew.length === 0) && (
                    <div className="text-center text-muted-foreground py-12">
                      <p className="text-lg">
                        Cast and crew information not available.
                      </p>
                    </div>
                  )}
              </div>
            )}
            {activeTab === "reviews" && (
              <div className="text-center text-muted-foreground py-12">
                <p className="text-lg">Reviews coming soon...</p>
              </div>
            )}
            {activeTab === "similar" && (
              <div className="space-y-6">
                <h3 className="text-2xl font-semibold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                  Similar Movies
                </h3>
                
                {loadingSimilar ? (
                  <div className="text-center text-muted-foreground py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-lg">Loading similar movies...</p>
                  </div>
                ) : similarMovies.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {similarMovies.map((similarMovie) => (
                      <div
                        key={similarMovie.id}
                        className="group cursor-pointer transition-all duration-200 hover:scale-105"
                        onClick={() => router.push(`/movies/${similarMovie.id}`)}
                      >
                        <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-muted/30 border border-border/20">
                          {similarMovie.poster_path ? (
                            <Image
                              src={`https://image.tmdb.org/t/p/w500${similarMovie.poster_path}`}
                              alt={similarMovie.title}
                              fill
                              className="object-cover group-hover:scale-110 transition-transform duration-300"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = "/placeholder.svg";
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-muted/50">
                              <span className="text-muted-foreground text-sm">No Image</span>
                            </div>
                          )}
                          

                        </div>
                        
                        <div className="mt-3 space-y-1">
                          <h4 className="font-medium text-sm text-foreground line-clamp-2 group-hover:text-primary transition-colors duration-200">
                            {similarMovie.title}
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            {similarMovie.release_date ? new Date(similarMovie.release_date).getFullYear() : 'Unknown'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-12">
                    <p className="text-lg">No similar movies found.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Trailer Modal */}
      <Dialog open={trailerOpen} onOpenChange={setTrailerOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] rounded-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedTrailer?.name || "Movie Trailer"}
            </DialogTitle>
          </DialogHeader>
          {selectedTrailer && (
            <div
              className="relative w-full"
              style={{ paddingBottom: "56.25%" }}
            >
              <iframe
                src={`https://www.youtube.com/embed/${selectedTrailer.key}?autoplay=1`}
                title={selectedTrailer.name}
                className="absolute top-0 left-0 w-full h-full rounded-xl"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
