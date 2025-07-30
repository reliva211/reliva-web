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
  Calendar,
  ListFilter,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import {
  getAuth,
  onAuthStateChanged,
  User as FirebaseUser,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

// Define the User interface, extending FirebaseUser
interface User extends FirebaseUser {}

// Dummy data for series
interface Series {
  id: number;
  title: string;
  year: number;
  cover: string;
  status?: string;
  rating?: number;
  notes?: string;
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
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [savedSeries, setSavedSeries] = useState<Series[]>(mySeries);
  const [savedIds, setSavedIds] = useState(mySeries.map((series) => series.id));
  const [selectedSeries, setSelectedSeries] = useState<any>(null);
  const [isAddingNotes, setIsAddingNotes] = useState(false);
  const [seriesNotes, setSeriesNotes] = useState("");
  const [seriesRating, setSeriesRating] = useState(0);
  const [filterStatus, setFilterStatus] = useState("all");

  const { user } = useCurrentUser();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    // Simulate API call
    setTimeout(() => {
      setSearchResults(
        searchDummy.filter((s) =>
          s.title.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }, 500);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setIsSearching(false);
    setSearchResults([]);
  };

  const saveSeries = async (series: Series) => {
    if (!savedIds.includes(series.id)) {
      const newSeries = {
        ...series,
        status: "Watchlist",
        rating: 0,
        notes: "",
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
    filterStatus === "all"
      ? savedSeries
      : savedSeries.filter((series) => series.status === filterStatus);

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

          <h3 className="font-medium">My Series</h3>
          <div className="space-y-1">
            <button
              className={`w-full flex items-center justify-between rounded-md p-2 text-sm ${
                filterStatus === "all"
                  ? "bg-accent"
                  : "hover:bg-accent transition-colors"
              }`}
              onClick={() => {
                setSearchQuery("");
                setIsSearching(false);
                setFilterStatus("all");
              }}
            >
              <span>All Series</span>
              <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                {savedSeries.length}
              </span>
            </button>
            <button
              className={`w-full flex items-center justify-between rounded-md p-2 text-sm ${
                filterStatus === "Watched"
                  ? "bg-accent"
                  : "hover:bg-accent transition-colors"
              }`}
              onClick={() => {
                setSearchQuery("");
                setIsSearching(false);
                setFilterStatus("Watched");
              }}
            >
              <span>Watched</span>
              <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
                {
                  savedSeries.filter((series) => series.status === "Watched")
                    .length
                }
              </span>
            </button>
            <button
              className={`w-full flex items-center justify-between rounded-md p-2 text-sm ${
                filterStatus === "Watchlist"
                  ? "bg-accent"
                  : "hover:bg-accent transition-colors"
              }`}
              onClick={() => {
                setSearchQuery("");
                setIsSearching(false);
                setFilterStatus("Watchlist");
              }}
            >
              <span>Watchlist</span>
              <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
                {
                  savedSeries.filter((series) => series.status === "Watchlist")
                    .length
                }
              </span>
            </button>
          </div>

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

              {searchResults.length === 0 ? (
                <div className="text-center py-12">
                  <Tv className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No series found</h3>
                  <p className="text-muted-foreground mb-4">
                    Try a different search term
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-6">
                  {searchResults.map((series) => (
                    <Link
                      key={series.id}
                      href={`/series/${series.id}`}
                      className="block"
                    >
                      <div className="relative aspect-[2/3] w-full rounded-lg overflow-hidden hover:scale-105 transition-transform cursor-pointer shadow-md">
                        <Image
                          src={series.cover || "/placeholder.svg"}
                          alt={series.title}
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
            <Tabs defaultValue="my-series">
              <TabsList className="mb-4">
                <TabsTrigger value="my-series">My Series</TabsTrigger>
                <TabsTrigger value="recommendations">
                  Recommendations
                </TabsTrigger>
              </TabsList>

              <TabsContent value="my-series" className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">My Series</h2>
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

                {filteredSeries.length === 0 ? (
                  <div className="text-center py-12">
                    <Tv className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">
                      Your series collection is empty
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Search for series to add to your collection
                    </p>
                    <Button>Explore Series</Button>
                  </div>
                ) : (
                  <ScrollArea className="h-[calc(100vh-16rem)]">
                    <div className="space-y-4">
                      {filteredSeries.map((series) => (
                        <div
                          key={series.id}
                          className="flex border rounded-lg overflow-hidden"
                        >
                          <div className="w-24 h-36 relative flex-shrink-0">
                            <Image
                              src={series.cover || "/placeholder.svg"}
                              alt={series.title}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="p-4 flex flex-col justify-between flex-1">
                            <div>
                              <h3 className="font-medium">{series.title}</h3>
                              <p className="text-sm text-muted-foreground">
                                {series.year}
                              </p>
                              <div className="flex items-center mt-1">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-4 w-4 ${
                                      i < (series.rating || 0)
                                        ? "text-primary fill-primary"
                                        : "text-muted-foreground"
                                    }`}
                                  />
                                ))}
                                <span className="text-xs ml-2">
                                  {series.rating}/5
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                                {series.notes}
                              </p>
                            </div>
                            <div className="flex items-center justify-between mt-4">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openSeriesDetails(series)}
                                  >
                                    {series.notes ? "Edit Notes" : "Add Notes"}
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>
                                      Notes for {selectedSeries?.title}
                                    </DialogTitle>
                                    <DialogDescription>
                                      Add your rating and notes for this series.
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4 py-4">
                                    <div>
                                      <label className="text-sm font-medium">
                                        Rating
                                      </label>
                                      <div className="flex items-center mt-2">
                                        {[...Array(5)].map((_, i) => (
                                          <button
                                            key={i}
                                            onClick={() =>
                                              setSeriesRating(i + 1)
                                            }
                                          >
                                            <Star
                                              className={`h-6 w-6 ${
                                                (seriesRating || 0) > i
                                                  ? "text-primary fill-primary"
                                                  : "text-muted-foreground"
                                              }`}
                                            />
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">
                                        Notes
                                      </label>
                                      <Textarea
                                        value={seriesNotes}
                                        onChange={(e) =>
                                          setSeriesNotes(e.target.value)
                                        }
                                        placeholder="Your thoughts on the series..."
                                        className="mt-2"
                                      />
                                    </div>
                                  </div>
                                  <Button onClick={saveSeriesDetails}>
                                    Save
                                  </Button>
                                </DialogContent>
                              </Dialog>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeSeries(series.id)}
                              >
                                <X className="mr-1 h-4 w-4" /> Remove
                              </Button>
                            </div>
                          </div>
                          <div className="p-4 border-l flex flex-col justify-center items-center gap-2 bg-muted/40">
                            <div className="flex gap-2">
                              <Button
                                variant={
                                  series.status === "Watchlist"
                                    ? "default"
                                    : "outline"
                                }
                                size="sm"
                                onClick={() =>
                                  updateSeriesStatus(series.id, "Watchlist")
                                }
                              >
                                <EyeOff className="mr-1 h-4 w-4" /> Watchlist
                              </Button>
                              <Button
                                variant={
                                  series.status === "Watched"
                                    ? "default"
                                    : "outline"
                                }
                                size="sm"
                                onClick={() =>
                                  updateSeriesStatus(series.id, "Watched")
                                }
                              >
                                <Eye className="mr-1 h-4 w-4" /> Watched
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
                  {recommendedSeries.map((series) => (
                    <Card key={series.id} className="overflow-hidden">
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
                            onClick={() => saveSeries(series as Series)}
                            disabled={savedIds.includes(series.id)}
                          >
                            {savedIds.includes(series.id) ? (
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

// Custom hook to get the current Firebase user
export const useCurrentUser = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser as User);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { user, loading };
};
