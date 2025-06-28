"use client";

import type React from "react";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Search,
  Film,
  Star,
  Plus,
  Check,
  X,
  ListFilter,
  Calendar,
  EyeOff,
  Eye,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { searchMovies } from "@/lib/tmdb";
import { db } from "@/lib/firebase";
import {
  setDoc,
  doc,
  deleteDoc,
  updateDoc,
  collection,
  getDocs,
} from "firebase/firestore";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Movie {
  id: number;
  title: string;
  year: number;
  cover: string;
  status?: string;
  rating?: number;
  notes?: string;
  collections?: string[];
}

interface Collection {
  id: string;
  name: string;
}

const myMovies = [
  {
    id: 1,
    title: "Inception",
    year: 2010,
    cover: "/placeholder.svg?height=300&width=200",
    status: "Watched",
    rating: 5,
    notes: "Mind-bending thriller with amazing visuals.",
  },
  {
    id: 2,
    title: "The Shawshank Redemption",
    year: 1994,
    cover: "/placeholder.svg?height=300&width=200",
    status: "Watched",
    rating: 5,
    notes: "One of the best movies ever made.",
  },
  {
    id: 3,
    title: "Dune",
    year: 2021,
    cover: "/placeholder.svg?height=300&width=200",
    status: "Watchlist",
    rating: 0,
    notes: "",
  },
  {
    id: 4,
    title: "The Godfather",
    year: 1972,
    cover: "/placeholder.svg?height=300&width=200",
    status: "Watched",
    rating: 5,
    notes: "A classic masterpiece.",
  },
  {
    id: 5,
    title: "Parasite",
    year: 2019,
    cover: "/placeholder.svg?height=300&width=200",
    status: "Watched",
    rating: 4,
    notes: "Brilliant social commentary.",
  },
];

const recommendedMovies = [
  {
    id: 1,
    title: "The Dark Knight",
    director: "Christopher Nolan",
    year: 2008,
    cover: "/placeholder.svg?height=300&width=200",
    rating: 4.9,
  },
  {
    id: 2,
    title: "Pulp Fiction",
    director: "Quentin Tarantino",
    year: 1994,
    cover: "/placeholder.svg?height=300&width=200",
    rating: 4.8,
  },
  {
    id: 3,
    title: "The Lord of the Rings: The Fellowship of the Ring",
    director: "Peter Jackson",
    year: 2001,
    cover: "/placeholder.svg?height=300&width=200",
    rating: 4.8,
  },
  {
    id: 4,
    title: "Goodfellas",
    director: "Martin Scorsese",
    year: 1990,
    cover: "/placeholder.svg?height=300&width=200",
    rating: 4.7,
  },
  {
    id: 5,
    title: "Fight Club",
    director: "David Fincher",
    year: 1999,
    cover: "/placeholder.svg?height=300&width=200",
    rating: 4.7,
  },
  {
    id: 6,
    title: "Interstellar",
    director: "Christopher Nolan",
    year: 2014,
    cover: "/placeholder.svg?height=300&width=200",
    rating: 4.6,
  },
];

// Dummy search results
const searchdummy = [
  {
    id: 1,
    title: "The Matrix",
    director: "The Wachowskis",
    year: 1999,
    cover: "/placeholder.svg?height=300&width=200",
    rating: 4.7,
  },
  {
    id: 2,
    title: "Blade Runner 2049",
    director: "Denis Villeneuve",
    year: 2017,
    cover: "/placeholder.svg?height=300&width=200",
    rating: 4.5,
  },
  {
    id: 3,
    title: "Joker",
    director: "Todd Phillips",
    year: 2019,
    cover: "/placeholder.svg?height=300&width=200",
    rating: 4.4,
  },
  {
    id: 4,
    title: "The Silence of the Lambs",
    director: "Jonathan Demme",
    year: 1991,
    cover: "/placeholder.svg?height=300&width=200",
    rating: 4.6,
  },
];

export default function MoviesPage() {
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [savedMovies, setSavedMovies] = useState<Movie[]>([]);
  const [savedIds, setSavedIds] = useState(
    savedMovies.map((movie) => movie.id)
  );
  const [selectedMovie, setSelectedMovie] = useState<any>(null);
  const [isAddingNotes, setIsAddingNotes] = useState(false);
  const [movieNotes, setMovieNotes] = useState("");
  const [movieRating, setMovieRating] = useState(0);
  const [filterStatus, setFilterStatus] = useState("all");
  const [collections, setCollections] = useState<Collection[]>([
    { id: "1", name: "Watched" },
    { id: "2", name: "Watchlist" },
  ]);
  const [selectedCollection, setSelectedCollection] = useState<string>("all");
  const [isCreateCollectionOpen, setCreateCollectionOpen] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");

  const user = useCurrentUser();

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
        collections: movie.collections || [],
      }))
    );
    setSavedIds(ids);
  };

  useEffect(() => {
    if (user?.uid) {
      fetchUserMovies(user.uid);
    }
  }, [user]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!searchQuery.trim()) return;

    setIsSearching(true);

    try {
      const results = await searchMovies(searchQuery);
      setSearchResults(results);
    } catch (error) {
      console.error("Error fetching search results:", error);
    }
  };
  const clearSearch = () => {
    setSearchQuery("");
    setIsSearching(false);
  };

  const uid = user?.uid;

  const saveMovie = async (movie: Movie) => {
    const uid = user?.uid; // Get current user ID from context or session

    if (!savedIds.includes(movie.id)) {
      const newMovie = {
        ...movie,
        status: "Watchlist",
        rating: 0,
        notes: "",
        collections: [],
      };
      setSavedMovies([...savedMovies, newMovie]);
      setSavedIds([...savedIds, movie.id]);

      // Save to Firestore
      await setDoc(doc(db, `users/${uid}/movies/${movie.id}`), newMovie);
    }
  };

  const removeMovie = async (id: number) => {
    const uid = user?.uid;

    setSavedMovies(savedMovies.filter((movie) => movie.id !== id));
    setSavedIds(savedIds.filter((movieId) => movieId !== id));

    await deleteDoc(doc(db, `users/${uid}/movies/${id}`));
  };

  const updateMovieStatus = async (id: number, status: string) => {
    const uid = user?.uid;

    setSavedMovies(
      savedMovies.map((movie) =>
        movie.id === id ? { ...movie, status } : movie
      )
    );

    await updateDoc(doc(db, `users/${uid}/movies/${id}`), { status });
  };

  const openMovieDetails = (movie: any) => {
    setSelectedMovie(movie);
    setMovieNotes(movie.notes || "");
    setMovieRating(movie.rating || 0);
  };

  const saveMovieDetails = async () => {
    const uid = user?.uid;

    setSavedMovies(
      savedMovies.map((movie) =>
        movie.id === selectedMovie.id
          ? { ...movie, notes: movieNotes, rating: movieRating }
          : movie
      )
    );
    setIsAddingNotes(false);

    await updateDoc(doc(db, `users/${uid}/movies/${selectedMovie.id}`), {
      notes: movieNotes,
      rating: movieRating,
    });
  };

  const handleCreateCollection = () => {
    if (newCollectionName.trim() === "") return;
    const newCollection = {
      id: (collections.length + 1).toString(),
      name: newCollectionName.trim(),
    };
    setCollections([...collections, newCollection]);
    setNewCollectionName("");
    setCreateCollectionOpen(false);
  };

  const addMovieToCollection = async (
    movieId: number,
    collectionId: string
  ) => {
    const movie = savedMovies.find((m) => m.id === movieId);
    if (!movie) return;

    const updatedCollections = movie.collections
      ? [...movie.collections, collectionId]
      : [collectionId];

    setSavedMovies(
      savedMovies.map((m) =>
        m.id === movieId ? { ...m, collections: updatedCollections } : m
      )
    );

    if (uid) {
      await updateDoc(doc(db, `users/${uid}/movies/${movieId}`), {
        collections: updatedCollections,
      });
    }
  };

  const filteredMovies =
    selectedCollection === "all"
      ? savedMovies
      : savedMovies.filter((movie) =>
          movie.collections?.includes(selectedCollection)
        );

  return (
    <div className="container py-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <div className="w-full md:w-64 space-y-6">
          <form
            onSubmit={handleSearch}
            className="flex flex-col gap-2 w-full sm:flex-row sm:items-center sm:gap-2"
          >
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search for movies"
                className="pl-10 pr-10 w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              )}
            </div>
          </form>

          <div className="space-y-2">
            <h3 className="font-medium">My Collections</h3>
            <div className="space-y-1">
              <button
                className={`w-full flex items-center justify-between rounded-md p-2 text-sm ${
                  selectedCollection === "all"
                    ? "bg-accent"
                    : "hover:bg-accent transition-colors"
                }`}
                onClick={() => setSelectedCollection("all")}
              >
                <span>All Movies</span>
                <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                  {savedMovies.length}
                </span>
              </button>
              {collections.map((collection) => (
                <button
                  key={collection.id}
                  className={`w-full flex items-center justify-between rounded-md p-2 text-sm ${
                    selectedCollection === collection.id
                      ? "bg-accent"
                      : "hover:bg-accent transition-colors"
                  }`}
                  onClick={() => setSelectedCollection(collection.id)}
                >
                  <span>{collection.name}</span>
                  <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
                    {
                      savedMovies.filter((m) =>
                        m.collections?.includes(collection.id)
                      ).length
                    }
                  </span>
                </button>
              ))}
            </div>
            <Dialog
              open={isCreateCollectionOpen}
              onOpenChange={setCreateCollectionOpen}
            >
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="w-full mt-2">
                  <Plus className="mr-2 h-4 w-4" /> Create Collection
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Create New Collection</DialogTitle>
                  <DialogDescription>
                    Enter a name for your new collection.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                      Name
                    </Label>
                    <Input
                      id="name"
                      value={newCollectionName}
                      onChange={(e) => setNewCollectionName(e.target.value)}
                      className="col-span-3"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" onClick={handleCreateCollection}>
                    Save collection
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-2">
            <h3 className="font-medium">Genres</h3>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">Action</Badge>
              <Badge variant="outline">Drama</Badge>
              <Badge variant="outline">Sci-Fi</Badge>
              <Badge variant="outline">Comedy</Badge>
              <Badge variant="outline">Thriller</Badge>
              <Badge variant="outline">Horror</Badge>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {isSearching ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">
                  Search Results for "{searchQuery}"
                </h2>
                <Button variant="ghost" onClick={clearSearch}>
                  Clear Search
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {searchResults.map((movie) => (
                  <Card key={movie.id} className="overflow-hidden">
                    <CardContent className="p-0">
                      <div className="relative aspect-[2/3] w-full">
                        <Image
                          src={movie.cover || "/placeholder.svg"}
                          alt={movie.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="p-4 space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium line-clamp-1">
                              {movie.title}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {movie.year}
                            </p>
                          </div>
                          <div className="flex items-center">
                            <Star className="h-3 w-3 fill-primary text-primary" />
                            <span className="text-xs ml-1">{movie.rating}</span>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => saveMovie(movie)}
                          disabled={savedIds.includes(movie.id)}
                        >
                          {savedIds.includes(movie.id) ? (
                            <>
                              <Check className="mr-1 h-4 w-4" /> Saved
                            </>
                          ) : (
                            <>
                              <Plus className="mr-1 h-4 w-4" /> Add to Watchlist
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <Tabs defaultValue="my-movies">
              <TabsList className="mb-4">
                <TabsTrigger value="my-movies">My Movies</TabsTrigger>
                <TabsTrigger value="recommendations">
                  Recommendations
                </TabsTrigger>
              </TabsList>

              <TabsContent value="my-movies" className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">My Movies</h2>
                  <div className="flex items-center gap-2">
                    <Select defaultValue="newest">
                      <SelectTrigger className="w-[180px]">
                        <ListFilter className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="newest">Newest First</SelectItem>
                        <SelectItem value="oldest">Oldest First</SelectItem>
                        <SelectItem value="rating">Highest Rated</SelectItem>
                        <SelectItem value="title">Title (A-Z)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {filteredMovies.length === 0 ? (
                  <div className="text-center py-12">
                    <Film className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">
                      Your movie collection is empty
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Search for movies to add to your collection
                    </p>
                    <Button>Explore Movies</Button>
                  </div>
                ) : (
                  <ScrollArea className="h-[calc(100vh-16rem)]">
                    <div className="space-y-4">
                      {filteredMovies.map((movie) => (
                        <div
                          key={movie.id}
                          className="flex border rounded-lg overflow-hidden"
                        >
                          <div className="w-24 h-36 relative flex-shrink-0">
                            <Image
                              src={movie.cover || "/placeholder.svg"}
                              alt={movie.title}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="flex-1 p-4 flex flex-col justify-between">
                            <div>
                              <div className="flex justify-between">
                                <div>
                                  <h3 className="font-medium">{movie.title}</h3>
                                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />{" "}
                                    {movie.year}
                                  </p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => removeMovie(movie.id)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                              {movie.status === "Watched" &&
                                (movie.rating ?? 0) > 0 && (
                                  <div className="flex items-center mt-1">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                      <Star
                                        key={i}
                                        className={`h-4 w-4 ${
                                          i < (movie.rating ?? 0)
                                            ? "fill-primary text-primary"
                                            : "text-muted"
                                        }`}
                                      />
                                    ))}
                                  </div>
                                )}
                              {movie.notes && (
                                <p className="text-sm mt-2 line-clamp-2">
                                  {movie.notes}
                                </p>
                              )}
                            </div>
                            <div className="mt-2 flex gap-2">
                              <Button
                                variant={
                                  movie.status === "Watchlist"
                                    ? "default"
                                    : "outline"
                                }
                                size="sm"
                                onClick={() =>
                                  updateMovieStatus(movie.id, "Watchlist")
                                }
                              >
                                <EyeOff className="mr-1 h-4 w-4" /> Watchlist
                              </Button>
                              <Button
                                variant={
                                  movie.status === "Watched"
                                    ? "default"
                                    : "outline"
                                }
                                size="sm"
                                onClick={() =>
                                  updateMovieStatus(movie.id, "Watched")
                                }
                              >
                                <Eye className="mr-1 h-4 w-4" /> Watched
                              </Button>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openMovieDetails(movie)}
                                  >
                                    {movie.notes ? "Edit Notes" : "Add Notes"}
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>
                                      Notes for {selectedMovie?.title}
                                    </DialogTitle>
                                    <DialogDescription>
                                      Add your rating and notes for this movie.
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                      <h4 className="text-sm font-medium">
                                        Your Rating
                                      </h4>
                                      <div className="flex gap-1">
                                        {Array.from({ length: 5 }).map(
                                          (_, i) => (
                                            <Button
                                              key={i}
                                              variant="ghost"
                                              size="icon"
                                              className="h-8 w-8"
                                              onClick={() =>
                                                setMovieRating(i + 1)
                                              }
                                            >
                                              <Star
                                                className={`h-6 w-6 ${
                                                  i < movieRating
                                                    ? "fill-primary text-primary"
                                                    : "text-muted-foreground"
                                                }`}
                                              />
                                            </Button>
                                          )
                                        )}
                                      </div>
                                    </div>
                                    <div className="space-y-2">
                                      <h4 className="text-sm font-medium">
                                        Your Notes
                                      </h4>
                                      <Textarea
                                        placeholder="Write your thoughts about this movie..."
                                        value={movieNotes}
                                        onChange={(e) =>
                                          setMovieNotes(e.target.value)
                                        }
                                        rows={4}
                                      />
                                    </div>
                                    <div className="flex justify-end gap-2">
                                      <Button
                                        variant="outline"
                                        onClick={() => setIsAddingNotes(false)}
                                      >
                                        Cancel
                                      </Button>
                                      <Button onClick={saveMovieDetails}>
                                        Save
                                      </Button>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="outline" size="sm">
                                    <Plus className="mr-2 h-4 w-4" /> Add to...
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                  {collections.map((collection) => (
                                    <DropdownMenuItem
                                      key={collection.id}
                                      onClick={() =>
                                        addMovieToCollection(
                                          movie.id,
                                          collection.id
                                        )
                                      }
                                      disabled={movie.collections?.includes(
                                        collection.id
                                      )}
                                    >
                                      {collection.name}
                                    </DropdownMenuItem>
                                  ))}
                                </DropdownMenuContent>
                              </DropdownMenu>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeMovie(movie.id)}
                              >
                                <X className="mr-1 h-4 w-4" /> Remove
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </TabsContent>

              <TabsContent value="recommendations" className="space-y-6">
                <h2 className="text-2xl font-bold">Recommended for You</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
                  {recommendedMovies.map((movie) => (
                    <Card key={movie.id} className="overflow-hidden">
                      <CardContent className="p-0">
                        <div className="relative aspect-[2/3] w-full">
                          <Image
                            src={movie.cover || "/placeholder.svg"}
                            alt={movie.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="p-4 space-y-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium line-clamp-1">
                                {movie.title}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {movie.director}, {movie.year}
                              </p>
                            </div>
                            <div className="flex items-center">
                              <Star className="h-3 w-3 fill-primary text-primary" />
                              <span className="text-xs ml-1">
                                {movie.rating}
                              </span>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() => saveMovie(movie)}
                            disabled={savedIds.includes(movie.id)}
                          >
                            {savedIds.includes(movie.id) ? (
                              <>
                                <Check className="mr-1 h-4 w-4" /> Saved
                              </>
                            ) : (
                              <>
                                <Plus className="mr-1 h-4 w-4" /> Add to
                                Watchlist
                              </>
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </div>
  );
}
