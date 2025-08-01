"use client";

import { useCurrentUser } from "@/hooks/use-current-user";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Star, Calendar, Clock, Play } from "lucide-react";

export default function HomePage() {
  const { user } = useCurrentUser();
  const router = useRouter();
  const [trendingMovies, setTrendingMovies] = useState<any[]>([]);
  const [trendingSeries, setTrendingSeries] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [overviewOpen, setOverviewOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user === null) {
      router.replace("/login");
    }
  }, [user, router]);

  useEffect(() => {
    if (!user) return;
    const fetchTrending = async () => {
      const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY;
      const [moviesRes, seriesRes] = await Promise.all([
        fetch(
          `https://api.themoviedb.org/3/trending/movie/day?api_key=${apiKey}`
        ),
        fetch(`https://api.themoviedb.org/3/trending/tv/day?api_key=${apiKey}`),
      ]);
      const moviesData = await moviesRes.json();
      const seriesData = await seriesRes.json();
      setTrendingMovies(moviesData.results || []);
      setTrendingSeries(seriesData.results || []);
    };
    fetchTrending();
  }, [user]);

  const handleItemClick = async (item: any, type: "movie" | "series") => {
    setSelectedItem(item);
    setOverviewOpen(true);
    setLoading(true);

    try {
      const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY;
      const endpoint = type === "movie" ? "movie" : "tv";
      const response = await fetch(
        `https://api.themoviedb.org/3/${endpoint}/${item.id}?api_key=${apiKey}&append_to_response=videos,credits`
      );
      const data = await response.json();
      setSelectedItem(data);
    } catch (error) {
      console.error("Error fetching details:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (item: any, type: "movie" | "series") => {
    router.push(`/${type}s/${item.id}`);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-black dark:to-gray-900 text-gray-900 dark:text-white relative scroll-smooth">
      <div className="relative z-10 py-20 px-4">
        <div className="max-w-7xl mx-auto w-full space-y-16">
          {/* Trending Movies */}
          <div>
            <h4 className="text-3xl md:text-4xl font-bold mb-6 text-gray-900 dark:text-white">
              Trending Movies
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
              {trendingMovies.map((movie) => (
                <button
                  key={movie.id}
                  onClick={() => handleItemClick(movie, "movie")}
                  className="bg-card rounded-xl shadow-md overflow-hidden flex flex-col items-center p-2 hover:scale-105 transition-transform cursor-pointer border-0 text-left"
                >
                  <Image
                    src={
                      movie.poster_path
                        ? `https://image.tmdb.org/t/p/w300${movie.poster_path}`
                        : "/placeholder.svg"
                    }
                    alt={movie.title}
                    width={160}
                    height={240}
                    className="rounded-xl object-cover mb-2 w-full"
                  />
                  <div className="text-center text-sm font-medium line-clamp-2 text-gray-900 dark:text-white">
                    {movie.title}
                  </div>
                </button>
              ))}
            </div>
          </div>
          {/* Trending Series */}
          <div>
            <h4 className="text-3xl md:text-4xl font-bold mb-6 text-gray-900 dark:text-white">
              Trending Series
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
              {trendingSeries.map((series) => (
                <button
                  key={series.id}
                  onClick={() => handleItemClick(series, "series")}
                  className="bg-card rounded-xl shadow-md overflow-hidden flex flex-col items-center p-2 hover:scale-105 transition-transform cursor-pointer border-0 text-left"
                >
                  <Image
                    src={
                      series.poster_path
                        ? `https://image.tmdb.org/t/p/w300${series.poster_path}`
                        : "/placeholder.svg"
                    }
                    alt={series.name}
                    width={160}
                    height={240}
                    className="rounded-xl object-cover mb-2 w-full"
                  />
                  <div className="text-center text-sm font-medium line-clamp-2 text-gray-900 dark:text-white">
                    {series.name}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Overview Modal */}
      <Dialog open={overviewOpen} onOpenChange={setOverviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              {selectedItem?.title || selectedItem?.name}
            </DialogTitle>
          </DialogHeader>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-2">Loading details...</span>
            </div>
          ) : selectedItem ? (
            <div className="space-y-6">
              {/* Header with poster and basic info */}
              <div className="flex gap-6">
                <div className="flex-shrink-0">
                  <Image
                    src={
                      selectedItem.poster_path
                        ? `https://image.tmdb.org/t/p/w300${selectedItem.poster_path}`
                        : "/placeholder.svg"
                    }
                    alt={selectedItem.title || selectedItem.name}
                    width={200}
                    height={300}
                    className="rounded-lg object-cover"
                  />
                </div>

                <div className="flex-1 space-y-4">
                  <div>
                    <h3 className="text-xl font-semibold mb-2">
                      {selectedItem.title || selectedItem.name}
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {selectedItem.overview}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span>
                        {selectedItem.vote_average?.toFixed(1) || "N/A"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {selectedItem.release_date ||
                          selectedItem.first_air_date ||
                          "N/A"}
                      </span>
                    </div>
                    {selectedItem.runtime && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{selectedItem.runtime} min</span>
                      </div>
                    )}
                    {selectedItem.number_of_seasons && (
                      <div className="flex items-center gap-1">
                        <Play className="h-4 w-4" />
                        <span>{selectedItem.number_of_seasons} seasons</span>
                      </div>
                    )}
                  </div>

                  {selectedItem.genres && (
                    <div className="flex flex-wrap gap-2">
                      {selectedItem.genres.map((genre: any) => (
                        <span
                          key={genre.id}
                          className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs"
                        >
                          {genre.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  onClick={() =>
                    handleViewDetails(
                      selectedItem,
                      selectedItem.title ? "movie" : "series"
                    )
                  }
                  className="flex-1"
                >
                  View Full Details
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setOverviewOpen(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
