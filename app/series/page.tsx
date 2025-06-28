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
  const [collections, setCollections] = useState<Collection[]>([
    { id: "1", name: "Watched" },
    { id: "2", name: "Watchlist" },
  ]);
  const [selectedCollection, setSelectedCollection] = useState<string>("all");
  const [isCreateCollectionOpen, setCreateCollectionOpen] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");

  const user = useCurrentUser();

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
                selectedCollection === "all"
                  ? "bg-accent"
                  : "hover:bg-accent transition-colors"
              }`}
              onClick={() => setSelectedCollection("all")}
            >
              <span>All Series</span>
              <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                {savedSeries.length}
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
                    savedSeries.filter((s) =>
                      s.collections?.includes(collection.id)
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

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {searchResults.map((series) => (
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
                          onClick={() => saveSeries(series)}
                          disabled={savedIds.includes(series.id)}
                        >
                          {savedIds.includes(series.id) ? (
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
                  <ScrollArea className="h-[600px] w-full">
                    <div className="space-y-4">
                      {filteredSeries.map((series) => (
                        <div
                          key={series.id}
                          className="flex border rounded-lg overflow-hidden"
                        >
                          <Link
                            href={`/series/${series.id}`}
                            className="w-24 h-36 relative flex-shrink-0"
                          >
                            <Image
                              src={series.cover || "/placeholder.svg"}
                              alt={series.title}
                              fill
                              className="object-cover"
                            />
                          </Link>
                          <div className="p-4 flex flex-col justify-between flex-1">
                            <div>
                              <Link href={`/series/${series.id}`}>
                                <h3 className="font-medium hover:underline">
                                  {series.title}
                                </h3>
                              </Link>
                              <p className="text-sm text-muted-foreground">
                                {series.year}
                              </p>
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
