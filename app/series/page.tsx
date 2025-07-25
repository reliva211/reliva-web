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
  Tv,
  Star,
  Plus,
  Check,
  X,
  ListFilter,
  Eye,
  EyeOff,
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
import { useCurrentUser } from "@/hooks/use-current-user";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { searchSeries } from "@/lib/tmdb";
import { db } from "@/lib/firebase";
import { collection, doc, setDoc, getDocs, addDoc } from "firebase/firestore";

// Dummy data for series
interface Series {
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

const mySeries: Series[] = [
  {
    id: 1,
    title: "Breaking Bad",
    year: 2008,
    cover: "/placeholder.svg?height=300&width=200",
    status: "Watched",
    rating: 5,
    notes: "One of the greatest shows ever.",
  },
  {
    id: 2,
    title: "Game of Thrones",
    year: 2011,
    cover: "/placeholder.svg?height=300&width=200",
    status: "Watched",
    rating: 4,
    notes: "Great, until the last season.",
  },
  {
    id: 3,
    title: "The Office",
    year: 2005,
    cover: "/placeholder.svg?height=300&width=200",
    status: "Watchlist",
    rating: 0,
    notes: "",
  },
];

const recommendedSeries: Omit<Series, "status" | "notes">[] = [
  {
    id: 4,
    title: "Stranger Things",
    year: 2016,
    cover: "/placeholder.svg?height=300&width=200",
    rating: 4.5,
  },
  {
    id: 5,
    title: "The Crown",
    year: 2016,
    cover: "/placeholder.svg?height=300&width=200",
    rating: 4.3,
  },
];

const searchDummy: Omit<Series, "status" | "notes">[] = [
  {
    id: 6,
    title: "Black Mirror",
    year: 2011,
    cover: "/placeholder.svg?height=300&width=200",
    rating: 4.6,
  },
  {
    id: 7,
    title: "Fleabag",
    year: 2016,
    cover: "/placeholder.svg?height=300&width=200",
    rating: 4.8,
  },
];

export default function SeriesPage() {
  // Place all modal state together at the top of SeriesPage
  const [addToListOpen, setAddToListOpen] = useState(false);
  const [addToListSeries, setAddToListSeries] = useState<any>(null);
  const [selectedListId, setSelectedListId] = useState<string>("");
  const [newListName, setNewListName] = useState("");

  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [trendingSeries, setTrendingSeries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savedSeries, setSavedSeries] = useState<Series[]>(mySeries);
  const [savedIds, setSavedIds] = useState(mySeries.map((series) => series.id));
  const [selectedSeries, setSelectedSeries] = useState<any>(null);
  const [isAddingNotes, setIsAddingNotes] = useState(false);
  const [seriesNotes, setSeriesNotes] = useState("");
  const [seriesRating, setSeriesRating] = useState(0);
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedListSidebar, setSelectedListSidebar] = useState<string>("all");
  const [listSeriesCounts, setListSeriesCounts] = useState<{
    [listId: string]: number;
  }>({});
  const [allSeriesFromLists, setAllSeriesFromLists] = useState<any[]>([]);
  const [userLists, setUserLists] = useState<{ id: string; name: string }[]>(
    []
  );
  const [isSavingToList, setIsSavingToList] = useState(false);
  const [isCreateCollectionOpen, setCreateCollectionOpen] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [selectedCollection, setSelectedCollection] = useState("all");
  const [collections, setCollections] = useState<Collection[]>([]);
  // Add state for the overview modal
  const [overviewOpen, setOverviewOpen] = useState(false);
  const [selectedSeriesOverview, setSelectedSeriesOverview] =
    useState<any>(null);
  const [tmdbDetails, setTmdbDetails] = useState<any>(null);
  const [tmdbLoading, setTmdbLoading] = useState(false);
  const [tmdbError, setTmdbError] = useState<string | null>(null);

  const user = useCurrentUser();

  useEffect(() => {
    // Fetch trending series on initial load
    const fetchTrending = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `https://api.themoviedb.org/3/trending/tv/week?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}`
        );
        const data = await res.json();
        setTrendingSeries(
          data.results.map((series: any) => ({
            id: series.id,
            title: series.name,
            year: parseInt(series.first_air_date?.split("-")[0] || "0000", 10),
            cover: series.poster_path
              ? `https://image.tmdb.org/t/p/w300${series.poster_path}`
              : "/placeholder.svg?height=300&width=200",
            rating: series.vote_average ?? 0,
          }))
        );
      } catch (err) {
        setError("Failed to fetch trending series.");
      } finally {
        setLoading(false);
      }
    };
    fetchTrending();
  }, []);

  // Fetch user lists from Firestore on mount and whenever user changes
  useEffect(() => {
    const fetchLists = async () => {
      if (!user?.uid) return;
      const listsRef = collection(db, "users", user.uid, "seriesLists");
      const snapshot = await getDocs(listsRef);
      setUserLists(
        snapshot.docs.map(
          (doc) =>
            ({ id: doc.id, ...doc.data() } as { id: string; name: string })
        )
      );
    };
    fetchLists();
  }, [user]);

  // Add series to selected list in Firestore
  const handleAddToList = async () => {
    if (
      !user?.uid ||
      !addToListSeries ||
      (!selectedListId && !newListName.trim())
    )
      return;
    setIsSavingToList(true);
    let listId = selectedListId;
    try {
      // Create new list if needed
      if (!listId && newListName.trim()) {
        const listsRef = collection(db, "users", user.uid, "seriesLists");
        const newListDoc = await addDoc(listsRef, { name: newListName.trim() });
        listId = newListDoc.id;
        setUserLists((prev) => [
          ...prev,
          { id: listId, name: newListName.trim() },
        ]);
        setSelectedListId(listId); // auto-select new list
      }
      // Save series under the list (correct Firestore v9+ logic)
      if (listId) {
        const listDocRef = doc(db, "users", user.uid, "seriesLists", listId);
        const seriesColRef = collection(listDocRef, "series");
        const seriesDocRef = doc(seriesColRef, String(addToListSeries.id));
        await setDoc(seriesDocRef, { ...addToListSeries, listId });
      }
      setIsSavingToList(false);
      setAddToListOpen(false);
      setAddToListSeries(null);
      setSelectedListId("");
      setNewListName("");
    } catch (err) {
      setIsSavingToList(false);
      alert("Failed to add series to list. Please try again.");
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setError(null);
    try {
      const results = await searchSeries(searchQuery);
      setSearchResults(results);
    } catch (err) {
      setError("Failed to fetch search results.");
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    setIsSearching(false);
    setSearchResults([]);
    setError(null);
  };

  const saveSeries = async (series: Series) => {
    if (!savedIds.includes(series.id)) {
      const newSeries = {
        ...series,
        status: "Watchlist",
        rating: 0,
        notes: "",
        collections: [],
      };
      setSavedSeries([...savedSeries, newSeries]);
      setSavedIds([...savedIds, series.id]);
    }
  };

  const removeSeries = async (id: number) => {
    setSavedSeries(savedSeries.filter((series) => series.id !== id));
    setSavedIds(savedIds.filter((seriesId) => seriesId !== id));
  };

  const updateSeriesStatus = async (id: number, status: string) => {
    setSavedSeries(
      savedSeries.map((series) =>
        series.id === id ? { ...series, status } : series
      )
    );
  };

  const openSeriesDetails = (series: any) => {
    setSelectedSeries(series);
    setSeriesNotes(series.notes || "");
    setSeriesRating(series.rating || 0);
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

  const addSeriesToCollection = async (
    seriesId: number,
    collectionId: string
  ) => {
    const series = savedSeries.find((s) => s.id === seriesId);
    if (!series) return;

    const updatedCollections = series.collections
      ? [...series.collections, collectionId]
      : [collectionId];

    setSavedSeries(
      savedSeries.map((s) =>
        s.id === seriesId ? { ...s, collections: updatedCollections } : s
      )
    );
  };

  const saveSeriesDetails = async () => {
    if (!selectedSeries) return;
    setSavedSeries(
      savedSeries.map((series) =>
        series.id === selectedSeries.id
          ? { ...series, notes: seriesNotes, rating: seriesRating }
          : series
      )
    );
    setIsAddingNotes(false);
    setSelectedSeries(null);
  };

  const filteredSeries =
    selectedCollection === "all"
      ? savedSeries
      : savedSeries.filter((series) =>
          series.collections?.includes(selectedCollection)
        );

  // Fetch series counts for each list and all series
  useEffect(() => {
    const fetchSeriesCounts = async () => {
      if (!user?.uid) return;
      const counts: { [listId: string]: number } = {};
      let allSeries: any[] = [];
      for (const list of userLists) {
        const seriesColRef = collection(
          db,
          "users",
          user.uid,
          "seriesLists",
          list.id,
          "series"
        );
        const snapshot = await getDocs(seriesColRef);
        counts[list.id] = snapshot.size;
        allSeries = allSeries.concat(
          snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            listId: list.id,
          }))
        );
      }
      setListSeriesCounts(counts);
      setAllSeriesFromLists(allSeries);
    };
    fetchSeriesCounts();
  }, [user, userLists]);

  let displayedSeries = allSeriesFromLists;
  if (selectedListSidebar !== "all") {
    displayedSeries = allSeriesFromLists.filter(
      (s) => s.listId === selectedListSidebar
    );
  }

  // Deduplicate allSeriesFromLists before rendering
  const uniqueAllSeries = [];
  const seenAll = new Set();
  for (const s of allSeriesFromLists) {
    const key = s.listId + "-" + s.id;
    if (!seenAll.has(key)) {
      uniqueAllSeries.push(s);
      seenAll.add(key);
    }
  }
  // Deduplicate displayedSeries before rendering
  const uniqueDisplayedSeries = [];
  const seenDisplayed = new Set();
  for (const s of displayedSeries) {
    const key = s.listId + "-" + s.id;
    if (!seenDisplayed.has(key)) {
      uniqueDisplayedSeries.push(s);
      seenDisplayed.add(key);
    }
  }

  // Fetch richer TMDB details when modal opens and a series is selected
  useEffect(() => {
    const fetchDetails = async () => {
      if (!overviewOpen || !selectedSeriesOverview?.id) {
        setTmdbDetails(null);
        setTmdbError(null);
        return;
      }
      setTmdbLoading(true);
      setTmdbError(null);
      try {
        const res = await fetch(
          `https://api.themoviedb.org/3/tv/${selectedSeriesOverview.id}?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}&language=en-US`
        );
        if (!res.ok) throw new Error("Failed to fetch details");
        const data = await res.json();
        setTmdbDetails(data);
      } catch (err: any) {
        setTmdbError("Could not load series details.");
        setTmdbDetails(null);
      } finally {
        setTmdbLoading(false);
      }
    };
    fetchDetails();
  }, [overviewOpen, selectedSeriesOverview]);

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
                placeholder="Search for series"
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
              <span>All Series</span>
              <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                {allSeriesFromLists.length}
              </span>
            </button>
            {userLists.map((list) => (
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
                  {listSeriesCounts[list.id] || 0}
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
                className="w-full mt-2"
                onClick={async () => {
                  const name = prompt("Enter a name for your new collection:");
                  if (!name || !user?.uid) return;
                  const listsRef = collection(
                    db,
                    "users",
                    user.uid,
                    "seriesLists"
                  );
                  const newListDoc = await addDoc(listsRef, {
                    name: name.trim(),
                  });
                  setUserLists((prev) => [
                    ...prev,
                    { id: newListDoc.id, name: name.trim() },
                  ]);
                  setSelectedListId(newListDoc.id); // auto-select new list
                }}
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
                    "seriesLists"
                  );
                  const newListDoc = await addDoc(listsRef, {
                    name: newCollectionName.trim(),
                  });
                  setUserLists((prev) => [
                    ...prev,
                    { id: newListDoc.id, name: newCollectionName.trim() },
                  ]);
                  setSelectedListId(newListDoc.id); // auto-select new list
                  setNewCollectionName("");
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
                </div>
                <DialogFooter>
                  <Button type="submit">Save collection</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <h3 className="font-medium">Genres</h3>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">Drama</Badge>
            <Badge variant="outline">Comedy</Badge>
            <Badge variant="outline">Sci-Fi</Badge>
            <Badge variant="outline">Crime</Badge>
            <Badge variant="outline">Fantasy</Badge>
            <Badge variant="outline">Animation</Badge>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {loading ? (
            <div className="text-center py-12">
              <Tv className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Loading series...</h3>
              <p className="text-muted-foreground mb-4">
                Fetching the latest trending series.
              </p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <Tv className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Error: {error}</h3>
              <p className="text-muted-foreground mb-4">
                Failed to load series data. Please try again later.
              </p>
              <Button onClick={() => window.location.reload()}>Retry</Button>
            </div>
          ) : selectedListSidebar === "all" &&
            searchQuery &&
            searchResults.length > 0 ? (
            // Show search results
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">
                  Search Results for "{searchQuery}"
                </h2>
                <Button variant="ghost" onClick={clearSearch}>
                  Clear Search
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {searchResults.map((series) => (
                  <Card key={series.id} className="overflow-hidden">
                    <Link href={`/series/${series.id}`} className="block">
                      <CardContent className="p-0">
                        <div className="relative aspect-[2/3] w-full">
                          <Image
                            src={series.cover || "/placeholder.svg"}
                            alt={series.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="p-4 space-y-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium line-clamp-1">
                                {series.title}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {series.year}
                              </p>
                            </div>
                            <div className="flex items-center">
                              <Star className="h-3 w-3 fill-primary text-primary" />
                              <span className="text-xs ml-1">
                                {series.rating}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Link>
                    <div className="px-4 pb-4">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => {
                          setAddToListSeries(series);
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
          ) : selectedListSidebar === "all" && !searchQuery ? (
            <>
              <h2 className="text-2xl font-bold">All My Series</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
                {uniqueAllSeries.length === 0 ? (
                  <div className="col-span-full text-center text-muted-foreground py-12">
                    No series in your collections yet.
                  </div>
                ) : (
                  uniqueAllSeries.map((series) => (
                    <Card
                      key={series.listId + "-" + series.id}
                      className="overflow-hidden"
                    >
                      <Link href={`/series/${series.id}`} className="block">
                        <div className="bg-card rounded-lg shadow-md overflow-hidden flex flex-col h-full cursor-pointer transition-transform hover:scale-[1.03]">
                          <div className="relative aspect-[2/3] w-full">
                            <Image
                              src={series.cover || "/placeholder.svg"}
                              alt={series.title}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="p-4 space-y-2">
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-medium line-clamp-1">
                                  {series.title}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                  {series.year}
                                </p>
                              </div>
                              <div className="flex items-center">
                                <Star className="h-3 w-3 fill-primary text-primary" />
                                <span className="text-xs ml-1">
                                  {series.rating}
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
                          onClick={(e) => {
                            e.stopPropagation();
                            setAddToListSeries(series);
                            setAddToListOpen(true);
                          }}
                        >
                          <Plus className="mr-1 h-4 w-4" /> Add to List
                        </Button>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </>
          ) : (
            // Show displayedSeries (filtered by collection)
            <>
              <h2 className="text-2xl font-bold">
                {selectedListSidebar === "all"
                  ? "Trending Series"
                  : userLists.find((l) => l.id === selectedListSidebar)?.name ||
                    "Series"}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
                {uniqueDisplayedSeries.map((series) => (
                  <Card
                    key={series.listId + "-" + series.id}
                    className="overflow-hidden cursor-pointer"
                    onClick={() => {
                      setSelectedSeriesOverview(series);
                      setOverviewOpen(true);
                    }}
                  >
                    <CardContent className="p-0">
                      <div className="relative aspect-[2/3] w-full">
                        <Image
                          src={series.cover || "/placeholder.svg"}
                          alt={series.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="p-4 space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium line-clamp-1">
                              {series.title}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {series.year}
                            </p>
                          </div>
                          <div className="flex items-center">
                            <Star className="h-3 w-3 fill-primary text-primary" />
                            <span className="text-xs ml-1">
                              {series.rating}
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => {
                            setAddToListSeries(series);
                            setAddToListOpen(true);
                          }}
                        >
                          <Plus className="mr-1 h-4 w-4" /> Add to List
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
      <Dialog open={addToListOpen} onOpenChange={setAddToListOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add to List</DialogTitle>
            <DialogDescription>
              Choose a list or create a new one to add{" "}
              <b>{addToListSeries?.title}</b>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <div className="font-medium mb-2">Your Lists</div>
              {userLists.length > 0 ? (
                <div className="space-y-2">
                  {userLists.map((list) => (
                    <label
                      key={list.id}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="series-list"
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
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!newListName.trim() || !user?.uid) return;
                const listsRef = collection(
                  db,
                  "users",
                  user.uid,
                  "seriesLists"
                );
                const newListDoc = await addDoc(listsRef, {
                  name: newListName.trim(),
                });
                setUserLists((prev) => [
                  ...prev,
                  { id: newListDoc.id, name: newListName.trim() },
                ]);
                setSelectedListId(newListDoc.id); // auto-select new list
                setNewListName("");
              }}
            >
              <div className="font-medium mb-1">Create New List</div>
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
            {tmdbDetails?.name ||
              selectedSeriesOverview?.title ||
              "Series Overview"}
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
                      : selectedSeriesOverview.cover || "/placeholder.svg"
                  }
                  alt={tmdbDetails.name || selectedSeriesOverview.title}
                  width={200}
                  height={300}
                  className="rounded-lg"
                />
              </div>
              <div className="flex-1 space-y-2">
                <h2 className="text-2xl font-bold">
                  {tmdbDetails.name || selectedSeriesOverview.title}
                </h2>
                <div className="flex items-center gap-4 text-muted-foreground">
                  <span>
                    {tmdbDetails.first_air_date
                      ? tmdbDetails.first_air_date.slice(0, 4)
                      : selectedSeriesOverview.year}
                  </span>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-primary text-primary" />
                    <span>
                      {tmdbDetails.vote_average?.toFixed(2) ??
                        selectedSeriesOverview.rating}
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
                  {tmdbDetails.first_air_date && (
                    <div>
                      <b>First Air Date:</b> {tmdbDetails.first_air_date}
                    </div>
                  )}
                  {tmdbDetails.status && (
                    <div>
                      <b>Status:</b> {tmdbDetails.status}
                    </div>
                  )}
                  {typeof tmdbDetails.number_of_seasons === "number" && (
                    <div>
                      <b>Seasons:</b> {tmdbDetails.number_of_seasons}
                    </div>
                  )}
                  {typeof tmdbDetails.number_of_episodes === "number" && (
                    <div>
                      <b>Episodes:</b> {tmdbDetails.number_of_episodes}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : selectedSeriesOverview ? (
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-shrink-0">
                <Image
                  src={selectedSeriesOverview.cover || "/placeholder.svg"}
                  alt={selectedSeriesOverview.title}
                  width={200}
                  height={300}
                  className="rounded-lg"
                />
              </div>
              <div className="flex-1 space-y-2">
                <h2 className="text-2xl font-bold">
                  {selectedSeriesOverview.title}
                </h2>
                <div className="flex items-center gap-4 text-muted-foreground">
                  <span>{selectedSeriesOverview.year}</span>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-primary text-primary" />
                    <span>{selectedSeriesOverview.rating}</span>
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
