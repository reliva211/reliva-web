"use client";

import type React from "react";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
  addDoc,
} from "firebase/firestore";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";

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
  const [userMovieLists, setUserMovieLists] = useState<
    { id: string; name: string }[]
  >([]);
  const [selectedListSidebar, setSelectedListSidebar] = useState<string>("all");
  const [listMovieCounts, setListMovieCounts] = useState<{
    [listId: string]: number;
  }>({});
  const [allMoviesFromLists, setAllMoviesFromLists] = useState<any[]>([]);
  const [addToListOpen, setAddToListOpen] = useState(false);
  const [addToListMovie, setAddToListMovie] = useState<any>(null);
  const [selectedListId, setSelectedListId] = useState<string>("");
  const [newListName, setNewListName] = useState("");
  const [isSavingToList, setIsSavingToList] = useState(false);
  const [overviewOpen, setOverviewOpen] = useState(false);
  const [selectedMovieOverview, setSelectedMovieOverview] = useState<any>(null);
  const [tmdbDetails, setTmdbDetails] = useState<any>(null);
  const [tmdbLoading, setTmdbLoading] = useState(false);
  const [tmdbError, setTmdbError] = useState<string | null>(null);

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

  // Fetch user movie lists from Firestore on mount and whenever user changes
  useEffect(() => {
    const fetchLists = async () => {
      if (!user?.uid) return;
      const listsRef = collection(db, "users", user.uid, "movieLists");
      const snapshot = await getDocs(listsRef);
      setUserMovieLists(
        snapshot.docs.map(
          (doc) =>
            ({ id: doc.id, ...doc.data() } as { id: string; name: string })
        )
      );
    };
    fetchLists();
  }, [user]);

  // Fetch movies for each list and deduplicate
  useEffect(() => {
    const fetchMovies = async () => {
      if (!user?.uid) return;
      const counts: { [listId: string]: number } = {};
      let allMovies: any[] = [];
      for (const list of userMovieLists) {
        const moviesColRef = collection(
          db,
          "users",
          user.uid,
          "movieLists",
          list.id,
          "movies"
        );
        const snapshot = await getDocs(moviesColRef);
        counts[list.id] = snapshot.size;
        allMovies = allMovies.concat(
          snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            listId: list.id,
          }))
        );
      }
      setListMovieCounts(counts);
      setAllMoviesFromLists(allMovies);
    };
    fetchMovies();
  }, [user, userMovieLists]);

  // Deduplicate allMoviesFromLists before rendering
  const uniqueAllMovies = [];
  const seenAll = new Set();
  for (const m of allMoviesFromLists) {
    const key = m.listId + "-" + m.id;
    if (!seenAll.has(key)) {
      uniqueAllMovies.push(m);
      seenAll.add(key);
    }
  }
  // Filter by selected list
  let displayedMovies = uniqueAllMovies;
  if (selectedListSidebar !== "all") {
    displayedMovies = uniqueAllMovies.filter(
      (m) => m.listId === selectedListSidebar
    );
  }
  const uniqueDisplayedMovies = [];
  const seenDisplayed = new Set();
  for (const m of displayedMovies) {
    const key = m.listId + "-" + m.id;
    if (!seenDisplayed.has(key)) {
      uniqueDisplayedMovies.push(m);
      seenDisplayed.add(key);
    }
  }

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

  // Add to List modal logic
  const handleAddToList = async () => {
    if (
      !user?.uid ||
      !addToListMovie ||
      (!selectedListId && !newListName.trim())
    )
      return;
    setIsSavingToList(true);
    let listId = selectedListId;
    try {
      // Create new list if needed
      if (!listId && newListName.trim()) {
        const listsRef = collection(db, "users", user.uid, "movieLists");
        const newListDoc = await addDoc(listsRef, { name: newListName.trim() });
        listId = newListDoc.id;
        setUserMovieLists((prev) => [
          ...prev,
          { id: listId, name: newListName.trim() },
        ]);
        setSelectedListId(listId); // auto-select new list
      }
      // Save movie under the list
      if (listId) {
        const listDocRef = doc(db, "users", user.uid, "movieLists", listId);
        const moviesColRef = collection(listDocRef, "movies");
        const movieDocRef = doc(moviesColRef, String(addToListMovie.id));
        await setDoc(movieDocRef, { ...addToListMovie, listId });
      }
      setIsSavingToList(false);
      setAddToListOpen(false);
      setAddToListMovie(null);
      setSelectedListId("");
      setNewListName("");
    } catch (err) {
      setIsSavingToList(false);
      alert("Failed to add movie to list. Please try again.");
    }
  };

  // Fetch richer TMDB details when modal opens and a movie is selected
  useEffect(() => {
    const fetchDetails = async () => {
      if (!overviewOpen || !selectedMovieOverview?.id) {
        setTmdbDetails(null);
        setTmdbError(null);
        return;
      }
      setTmdbLoading(true);
      setTmdbError(null);
      try {
        const res = await fetch(
          `https://api.themoviedb.org/3/movie/${selectedMovieOverview.id}?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}&language=en-US`
        );
        if (!res.ok) throw new Error("Failed to fetch details");
        const data = await res.json();
        setTmdbDetails(data);
      } catch (err: any) {
        setTmdbError("Could not load movie details.");
        setTmdbDetails(null);
      } finally {
        setTmdbLoading(false);
      }
    };
    fetchDetails();
  }, [overviewOpen, selectedMovieOverview]);

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
                  selectedListSidebar === "all"
                    ? "bg-accent"
                    : "hover:bg-accent transition-colors"
                }`}
                onClick={() => setSelectedListSidebar("all")}
              >
                <span>All Movies</span>
                <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                  {uniqueAllMovies.length}
                </span>
              </button>
              {userMovieLists.map((list) => (
                <button
                  key={list.id}
                  className={`w-full flex items-center justify-between rounded-md p-2 text-sm ${
                    selectedListSidebar === list.id
                      ? "bg-accent"
                      : "hover:bg-accent transition-colors"
                  }`}
                  onClick={() => setSelectedListSidebar(list.id)}
                >
                  <span>{list.name}</span>
                  <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
                    {listMovieCounts[list.id] || 0}
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
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        if (!newCollectionName.trim() || !user?.uid) return;
                        const listsRef = collection(
                          db,
                          "users",
                          user.uid,
                          "movieLists"
                        );
                        const newListDoc = await addDoc(listsRef, {
                          name: newCollectionName.trim(),
                        });
                        setUserMovieLists((prev) => [
                          ...prev,
                          { id: newListDoc.id, name: newCollectionName.trim() },
                        ]);
                        setSelectedListId(newListDoc.id); // auto-select new list
                        setNewCollectionName("");
                        setCreateCollectionOpen(false);
                      }}
                    >
                      <Input
                        id="name"
                        value={newCollectionName}
                        onChange={(e) => setNewCollectionName(e.target.value)}
                        className="col-span-3"
                      />
                    </form>
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
                    <Link href={`/movies/${movie.id}`} className="block">
                      <div className="bg-card rounded-lg shadow-md overflow-hidden flex flex-col h-full cursor-pointer transition-transform hover:scale-[1.03]">
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
                              <span className="text-xs ml-1">
                                {movie.rating}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                    <div className="px-4 pb-4">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => {
                          setAddToListMovie(movie);
                          setAddToListOpen(true);
                        }}
                      >
                        <Plus className="mr-1 h-4 w-4" /> Add to List
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
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

              {selectedListSidebar === "all" &&
              searchQuery &&
              searchResults.length > 0 ? (
                // Show search results (to be refactored in next steps)
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {searchResults.map((movie) => (
                    <Card key={movie.id} className="overflow-hidden">
                      <Link href={`/movies/${movie.id}`} className="block">
                        <div className="bg-card rounded-lg shadow-md overflow-hidden flex flex-col h-full cursor-pointer transition-transform hover:scale-[1.03]">
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
                                <span className="text-xs ml-1">
                                  {movie.rating}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                      <div className="px-4 pb-4">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => {
                            setAddToListMovie(movie);
                            setAddToListOpen(true);
                          }}
                        >
                          <Plus className="mr-1 h-4 w-4" /> Add to List
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                // Show uniqueDisplayedMovies (filtered by collection)
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
                  {uniqueDisplayedMovies.length === 0 ? (
                    <div className="col-span-full text-center text-muted-foreground py-12">
                      No movies in your collections yet.
                    </div>
                  ) : (
                    uniqueDisplayedMovies.map((movie) => (
                      <Card
                        key={movie.listId + "-" + movie.id}
                        className="overflow-hidden"
                      >
                        <Link href={`/movies/${movie.id}`} className="block">
                          <div className="bg-card rounded-lg shadow-md overflow-hidden flex flex-col h-full cursor-pointer transition-transform hover:scale-[1.03]">
                            <div className="relative aspect-[2/3] w-full">
                              <Image
                                src={movie.cover || "/placeholder.svg"}
                                alt={movie.title}
                                fill
                                className="object-cover"
                              />
                            </div>
                          </div>
                        </Link>
                      </Card>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <Dialog open={addToListOpen} onOpenChange={setAddToListOpen}>
        <DialogContent>
          <DialogTitle>Add to List</DialogTitle>
          <DialogDescription>
            Choose a list or create a new one to add{" "}
            <b>{addToListMovie?.title}</b>.
          </DialogDescription>
          <div className="space-y-4">
            <div>
              <div className="font-medium mb-2">Your Lists</div>
              {userMovieLists.length > 0 ? (
                <div className="space-y-2">
                  {userMovieLists.map((list) => (
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
                <div className="text-muted-foreground text-sm">
                  No lists yet.
                </div>
              )}
            </div>
            <div>
              <div className="font-medium mb-1">Create New List</div>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!newListName.trim() || !user?.uid) return;
                  const listsRef = collection(
                    db,
                    "users",
                    user.uid,
                    "movieLists"
                  );
                  const newListDoc = await addDoc(listsRef, {
                    name: newListName.trim(),
                  });
                  setUserMovieLists((prev) => [
                    ...prev,
                    { id: newListDoc.id, name: newListName.trim() },
                  ]);
                  setSelectedListId(newListDoc.id); // auto-select new list
                  setNewListName("");
                }}
              >
                <Input
                  placeholder="New list name"
                  value={newListName}
                  onChange={(e) => {
                    setNewListName(e.target.value);
                    setSelectedListId("");
                  }}
                />
              </form>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handleAddToList}
              disabled={
                isSavingToList || (!selectedListId && !newListName.trim())
              }
            >
              {isSavingToList ? "Saving..." : "Add to List"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={overviewOpen} onOpenChange={setOverviewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogTitle>
            {tmdbDetails?.title ||
              selectedMovieOverview?.title ||
              "Movie Overview"}
          </DialogTitle>
          {tmdbLoading ? (
            <div className="py-12 text-center text-muted-foreground">
              Loading details...
            </div>
          ) : tmdbError ? (
            <div className="py-12 text-center text-destructive">
              {tmdbError}
            </div>
          ) : tmdbDetails ? (
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-shrink-0">
                <Image
                  src={
                    tmdbDetails.poster_path
                      ? `https://image.tmdb.org/t/p/w300${tmdbDetails.poster_path}`
                      : selectedMovieOverview.cover || "/placeholder.svg"
                  }
                  alt={tmdbDetails.title || selectedMovieOverview.title}
                  width={200}
                  height={300}
                  className="rounded-lg"
                />
              </div>
              <div className="flex-1 space-y-2">
                <h2 className="text-2xl font-bold">
                  {tmdbDetails.title || selectedMovieOverview.title}
                </h2>
                <div className="flex items-center gap-4 text-muted-foreground">
                  <span>
                    {tmdbDetails.release_date
                      ? tmdbDetails.release_date.slice(0, 4)
                      : selectedMovieOverview.year}
                  </span>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-primary text-primary" />
                    <span>
                      {tmdbDetails.vote_average?.toFixed(2) ??
                        selectedMovieOverview.rating}
                    </span>
                  </div>
                </div>
                {tmdbDetails.genres && tmdbDetails.genres.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {tmdbDetails.genres.map((genre: any) => (
                      <Badge key={genre.id} variant="secondary">
                        {genre.name}
                      </Badge>
                    ))}
                  </div>
                )}
                {tmdbDetails.overview && (
                  <p className="text-base mt-2">{tmdbDetails.overview}</p>
                )}
                <div className="text-sm mt-2 space-y-1">
                  {tmdbDetails.release_date && (
                    <div>
                      <b>Release Date:</b> {tmdbDetails.release_date}
                    </div>
                  )}
                  {tmdbDetails.status && (
                    <div>
                      <b>Status:</b> {tmdbDetails.status}
                    </div>
                  )}
                  {typeof tmdbDetails.runtime === "number" && (
                    <div>
                      <b>Runtime:</b> {tmdbDetails.runtime} min
                    </div>
                  )}
                  {typeof tmdbDetails.budget === "number" &&
                    tmdbDetails.budget > 0 && (
                      <div>
                        <b>Budget:</b> ${tmdbDetails.budget.toLocaleString()}
                      </div>
                    )}
                  {typeof tmdbDetails.revenue === "number" &&
                    tmdbDetails.revenue > 0 && (
                      <div>
                        <b>Revenue:</b> ${tmdbDetails.revenue.toLocaleString()}
                      </div>
                    )}
                </div>
              </div>
            </div>
          ) : selectedMovieOverview ? (
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-shrink-0">
                <Image
                  src={selectedMovieOverview.cover || "/placeholder.svg"}
                  alt={selectedMovieOverview.title}
                  width={200}
                  height={300}
                  className="rounded-lg"
                />
              </div>
              <div className="flex-1 space-y-2">
                <h2 className="text-2xl font-bold">
                  {selectedMovieOverview.title}
                </h2>
                <div className="flex items-center gap-4 text-muted-foreground">
                  <span>{selectedMovieOverview.year}</span>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-primary text-primary" />
                    <span>{selectedMovieOverview.rating}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
