"use client";

import { useCurrentUser } from "@/hooks/use-current-user";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { use } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Play, Plus, Heart, Edit } from "lucide-react";
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
  const [activeTab, setActiveTab] = useState("all");
  const [trailerOpen, setTrailerOpen] = useState(false);
  const [selectedTrailer, setSelectedTrailer] = useState<Video | null>(null);

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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-black dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (user === null) return null;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-black dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading movie details...</p>
        </div>
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-black dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">{error || "Movie not found"}</p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-black dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Top Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Poster */}
          <div className="lg:col-span-1">
            <div className="relative">
              <Image
                src={
                  movie.poster_path
                    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                    : "/placeholder.svg"
                }
                alt={movie.title}
                width={400}
                height={600}
                className="rounded-lg shadow-lg w-full"
              />
            </div>
          </div>

          {/* Details */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                {movie.title}
              </h1>
              {movie.tagline && (
                <p className="text-lg text-muted-foreground italic mb-4">
                  "{movie.tagline}"
                </p>
              )}
            </div>

            <div className="space-y-4">
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {movie.overview}
              </p>

              <div className="flex items-center gap-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleTrailerClick}
                  disabled={!getBestTrailer()}
                >
                  <Play className="w-4 h-4 mr-2" />
                  {getBestTrailer() ? "Watch Trailer" : "No Trailer"}
                </Button>
                <Button
                  size="sm"
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
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Write Review
                </Button>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-medium">
                    {movie.vote_average.toFixed(1)}
                  </span>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-8">
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Heart className="w-4 h-4 mr-2" />
                  Watchlist
                </Button>
                <Dialog open={addToListOpen} onOpenChange={setAddToListOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Add to List
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
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
                              className="flex items-center gap-2 cursor-pointer"
                            >
                              <input
                                type="radio"
                                name="movie-list"
                                value={list.id}
                                checked={selectedListId === list.id}
                                onChange={() => setSelectedListId(list.id)}
                              />
                              <span>{list.name}</span>
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

        {/* Bottom Section */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
          {/* Navigation Tabs */}
          <div className="flex space-x-8 mb-6 border-b border-gray-200 dark:border-gray-700">
            {["all", "reviews", "cast/crew", "thread", "posts", "similar"].map(
              (tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-2 px-1 text-sm font-medium transition-colors ${
                    activeTab === tab
                      ? "text-primary border-b-2 border-primary"
                      : "text-muted-foreground hover:text-primary"
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              )
            )}
          </div>

          {/* Content Area */}
          <div className="min-h-[400px] bg-card rounded-lg p-6">
            {activeTab === "all" && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Movie Information</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Release Date:</span>
                    <p>{new Date(movie.release_date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Runtime:</span>
                    <p>{movie.runtime} minutes</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Status:</span>
                    <p>{movie.status}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Rating:</span>
                    <p>{movie.vote_average}/10</p>
                  </div>
                </div>
                {movie.genres && (
                  <div>
                    <span className="text-muted-foreground">Genres:</span>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {movie.genres.map((genre) => (
                        <Badge key={genre.id} variant="secondary">
                          {genre.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            {activeTab === "reviews" && (
              <div className="text-center text-muted-foreground py-8">
                <p>Reviews coming soon...</p>
              </div>
            )}
            {activeTab === "cast/crew" && (
              <div className="space-y-6">
                {movie.credits?.cast && movie.credits.cast.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Cast</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {movie.credits.cast.slice(0, 12).map((actor, index) => (
                        <div
                          key={`cast-${actor.id}-${index}`}
                          className="flex items-center space-x-3 p-3 bg-card rounded-lg cursor-pointer hover:bg-accent transition-colors"
                          onClick={() => router.push(`/person/${actor.id}`)}
                        >
                          {actor.profile_path ? (
                            <Image
                              src={`https://image.tmdb.org/t/p/w92${actor.profile_path}`}
                              alt={actor.name}
                              width={48}
                              height={48}
                              className="rounded-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = "/placeholder-user.jpg";
                              }}
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                              <span className="text-sm font-medium text-muted-foreground">
                                {actor.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">
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
                    <h3 className="text-lg font-semibold mb-4">Crew</h3>
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
                        .slice(0, 8)
                        .map((person, index) => (
                          <div
                            key={`crew-${person.id}-${index}`}
                            className="flex items-center space-x-3 p-3 bg-card rounded-lg cursor-pointer hover:bg-accent transition-colors"
                            onClick={() => router.push(`/person/${person.id}`)}
                          >
                            {person.profile_path ? (
                              <Image
                                src={`https://image.tmdb.org/t/p/w92${person.profile_path}`}
                                alt={person.name}
                                width={48}
                                height={48}
                                className="rounded-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = "/placeholder-user.jpg";
                                }}
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                                <span className="text-sm font-medium text-muted-foreground">
                                  {person.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">
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
                    <div className="text-center text-muted-foreground py-8">
                      <p>Cast and crew information not available.</p>
                    </div>
                  )}
              </div>
            )}
            {activeTab === "thread" && (
              <div className="text-center text-muted-foreground py-8">
                <p>Discussion threads coming soon...</p>
              </div>
            )}
            {activeTab === "posts" && (
              <div className="text-center text-muted-foreground py-8">
                <p>Community posts coming soon...</p>
              </div>
            )}
            {activeTab === "similar" && (
              <div className="text-center text-muted-foreground py-8">
                <p>Similar movies coming soon...</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Trailer Modal */}
      <Dialog open={trailerOpen} onOpenChange={setTrailerOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
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
                className="absolute top-0 left-0 w-full h-full rounded-lg"
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
