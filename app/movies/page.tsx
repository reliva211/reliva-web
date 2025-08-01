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
  Globe,
  Lock,
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
import { Checkbox } from "@/components/ui/checkbox";
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
  isPublic?: boolean;
  isDefault?: boolean;
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

  const [isCreateCollectionOpen, setCreateCollectionOpen] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [newCollectionIsPublic, setNewCollectionIsPublic] = useState(false);
  const [userMovieLists, setUserMovieLists] = useState<
    { id: string; name: string; isPublic?: boolean; isDefault?: boolean }[]
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
  const [selectedGenre, setSelectedGenre] = useState<string>("");
  const [isGenreSearching, setIsGenreSearching] = useState(false);

  const { user } = useCurrentUser();

  const fetchUserMovies = async (uid: string) => {
    const querySnapshot = await getDocs(collection(db, `users/${uid}/movies`));
    const movies: Movie[] = [];
    const ids: number[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const movie: Movie = {
        id: data.id || Number(doc.id),
        title: data.title || "",
        year: data.year || 0,
        cover: data.cover || "",
        status: data.status || "Unknown",
        rating: data.rating || 0,
        notes: data.notes || "",
        collections: data.collections || [],
      };
      movies.push(movie);
      ids.push(movie.id);
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
      const fetchedLists = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as { id: string; name: string })
      );

      // Define default collections
      const defaultCollections = [
        { name: "Watched", isPublic: false, isDefault: true },
        { name: "Watching", isPublic: false, isDefault: true },
        { name: "Watchlist", isPublic: false, isDefault: true },
        { name: "Dropped", isPublic: false, isDefault: true },
      ];

      // Check which default collections are missing
      const existingNames = fetchedLists.map((list) => list.name);
      const missingDefaults = defaultCollections.filter(
        (collection) => !existingNames.includes(collection.name)
      );

      // Create missing default collections
      if (missingDefaults.length > 0) {
        try {
          for (const collection of missingDefaults) {
            await addDoc(listsRef, collection);
          }

          // Fetch all lists again (including newly created defaults)
          const newSnapshot = await getDocs(listsRef);
          const allLists = newSnapshot.docs.map(
            (doc) =>
              ({ id: doc.id, ...doc.data() } as { id: string; name: string })
          );
          setUserMovieLists(allLists);
        } catch (error) {
          console.error("Error creating default collections:", error);
          setUserMovieLists(fetchedLists);
        }
      } else {
        setUserMovieLists(fetchedLists);
      }
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
    setSelectedGenre(""); // Clear genre selection when doing text search

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
    setSelectedGenre("");
    setSearchResults([]);
    setIsGenreSearching(false);
  };

  const handleGenreSearch = async (genre: string) => {
    if (selectedGenre === genre) {
      // If clicking the same genre, deselect it
      setSelectedGenre("");
      setSearchResults([]);
      setIsGenreSearching(false);
      return;
    }

    setSelectedGenre(genre);
    setIsGenreSearching(true);
    setSearchQuery(""); // Clear text search when doing genre search

    try {
      // Get genre ID from TMDB
      const genreMap: { [key: string]: number } = {
        Action: 28,
        Drama: 18,
        "Sci-Fi": 878,
        Comedy: 35,
        Thriller: 53,
        Horror: 27,
        Romance: 10749,
        Adventure: 12,
        Fantasy: 14,
        Animation: 16,
        Crime: 80,
        Documentary: 99,
        Family: 10751,
        History: 36,
        Music: 10402,
        Mystery: 9648,
        War: 10752,
        Western: 37,
      };

      const genreId = genreMap[genre];
      if (!genreId) {
        console.error(`Genre "${genre}" not found in TMDB genre map`);
        setSearchResults([]);
        return;
      }

      // Use TMDB API to search by genre
      const apiUrl = `https://api.themoviedb.org/3/discover/movie?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}&with_genres=${genreId}&sort_by=popularity.desc&page=1`;
      console.log(`API URL for "${genre}":`, apiUrl); // Debug log

      const res = await fetch(apiUrl);
      const data = await res.json();

      console.log(`Genre search for "${genre}":`, data); // Debug log
      console.log(`Total items found:`, data.total_results || 0); // Debug log

      if (
        data.results &&
        Array.isArray(data.results) &&
        data.results.length > 0
      ) {
        const movies = data.results.map((movie: any) => ({
          id: movie.id,
          title: movie.title,
          year: new Date(movie.release_date).getFullYear(),
          cover: movie.poster_path
            ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
            : "/placeholder.svg",
          rating: movie.vote_average,
          overview: movie.overview,
          release_date: movie.release_date,
        }));

        setSearchResults(movies);
        console.log(
          `Successfully found ${movies.length} movies for "${genre}"`
        );
      } else {
        console.log(`No results found for "${genre}"`);
        setSearchResults([]);
      }
    } catch (err) {
      console.error("Genre search failed:", err);
      setSearchResults([]);
    } finally {
      setIsGenreSearching(false);
    }
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
    <div className="w-full min-h-screen">
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-8 w-full">
        {/* Sidebar */}
        <div className="w-full lg:w-64 space-y-4 lg:space-y-6 flex flex-col justify-start flex-shrink-0">
          <form onSubmit={handleSearch} className="flex flex-col gap-2 w-full">
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
            <h3 className="font-medium text-sm lg:text-base">My Collections</h3>
            <div className="space-y-1">
              <button
                className={`w-full flex items-center justify-between rounded-md p-3 text-xs lg:text-sm ${
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
                  className={`w-full flex items-center justify-between rounded-md p-3 text-xs lg:text-sm ${
                    selectedListSidebar === list.id
                      ? "bg-accent"
                      : "hover:bg-accent transition-colors"
                  }`}
                  onClick={() => setSelectedListSidebar(list.id)}
                >
                  <div className="flex items-center gap-2">
                    <span className="truncate">{list.name}</span>
                    {list.isPublic && (
                      <Globe className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                    )}
                    {!list.isPublic && !list.isDefault && (
                      <Lock className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                    )}
                  </div>
                  <span className="text-xs bg-muted px-2 py-0.5 rounded-full flex-shrink-0">
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
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-3 text-xs lg:text-sm h-10"
                >
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
                      isPublic: newCollectionIsPublic,
                      isDefault: false,
                    });
                    setUserMovieLists((prev) => [
                      ...prev,
                      {
                        id: newListDoc.id,
                        name: newCollectionName.trim(),
                        isPublic: newCollectionIsPublic,
                        isDefault: false,
                      },
                    ]);
                    setSelectedListId(newListDoc.id); // auto-select new list
                    setNewCollectionName("");
                    setNewCollectionIsPublic(false);
                    setCreateCollectionOpen(false);
                  }}
                >
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
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="isPublic" className="text-right">
                        Public Collection
                      </Label>
                      <div className="col-span-3 flex items-center space-x-2">
                        <Checkbox
                          id="isPublic"
                          checked={newCollectionIsPublic}
                          onCheckedChange={(checked) =>
                            setNewCollectionIsPublic(!!checked)
                          }
                        />
                        <Label
                          htmlFor="isPublic"
                          className="text-sm text-muted-foreground"
                        >
                          Make this collection visible on your public profile
                        </Label>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit">Save collection</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-3">
            <h3 className="font-medium text-sm lg:text-base">Genres</h3>
            <div className="flex flex-wrap gap-3">
              {[
                "Action",
                "Drama",
                "Sci-Fi",
                "Comedy",
                "Thriller",
                "Horror",
              ].map((genre) => (
                <Badge
                  key={genre}
                  variant={selectedGenre === genre ? "default" : "outline"}
                  className={`cursor-pointer transition-colors hover:bg-primary hover:text-primary-foreground text-xs px-3 py-1 ${
                    selectedGenre === genre
                      ? "bg-primary text-primary-foreground"
                      : ""
                  }`}
                  onClick={() => handleGenreSearch(genre)}
                >
                  {genre}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {isSearching || isGenreSearching || searchQuery ? (
            <div className="space-y-4 lg:space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <h2 className="text-xl lg:text-2xl font-bold">
                  {isSearching
                    ? `Search Results for "${searchQuery}"`
                    : isGenreSearching
                    ? `Movies in ${selectedGenre}`
                    : `Search Results for "${searchQuery}"`}
                </h2>
                <Button
                  variant="ghost"
                  onClick={clearSearch}
                  className="w-full sm:w-auto h-10 sm:h-9"
                >
                  Clear Search
                </Button>
              </div>

              {isGenreSearching ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">
                    Loading {selectedGenre} movies...
                  </p>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="text-center py-12">
                  <Film className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No movies found</h3>
                  <p className="text-muted-foreground mb-4">
                    Try a different search term or browse by genre
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-3 lg:gap-6">
                  {searchResults.map((movie) => (
                    <Link
                      key={movie.id}
                      href={`/movies/${movie.id}`}
                      className="block"
                    >
                      <div className="relative aspect-[2/3] w-full rounded-lg overflow-hidden hover:scale-105 transition-transform cursor-pointer shadow-md">
                        <Image
                          src={movie.cover || "/placeholder.svg"}
                          alt={movie.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4 lg:space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <h2 className="text-xl lg:text-2xl font-bold">
                  {selectedListSidebar === "all" 
                    ? "My Movies" 
                    : userMovieLists.find(list => list.id === selectedListSidebar)?.name || "My Movies"}
                </h2>
                <div className="flex items-center gap-3">
                  <Select defaultValue="newest">
                    <SelectTrigger className="w-[140px] lg:w-[180px] h-10">
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
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-3 lg:gap-4">
                  {searchResults.map((movie) => (
                    <Link
                      key={movie.id}
                      href={`/movies/${movie.id}`}
                      className="block"
                    >
                      <div className="relative aspect-[2/3] w-full rounded-lg overflow-hidden hover:scale-105 transition-transform cursor-pointer">
                        <Image
                          src={movie.cover || "/placeholder.svg"}
                          alt={movie.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                // Show uniqueDisplayedMovies (filtered by collection)
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-3 lg:gap-4">
                  {uniqueDisplayedMovies.length === 0 ? (
                    <div className="col-span-full text-center text-muted-foreground py-12">
                      <Film className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-medium mb-2">
                        No movies found
                      </h3>
                      <p className="text-sm">
                        No movies in your collections yet.
                      </p>
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
