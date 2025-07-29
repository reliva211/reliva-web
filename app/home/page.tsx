"use client";

import { useCurrentUser } from "@/hooks/use-current-user";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const { user } = useCurrentUser();
  const router = useRouter();
  const [trendingMovies, setTrendingMovies] = useState<any[]>([]);
  const [trendingSeries, setTrendingSeries] = useState<any[]>([]);

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

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-black dark:to-gray-900 text-gray-900 dark:text-white relative scroll-smooth">
      <div className="relative z-10 py-20 px-4">
        <div className="max-w-7xl mx-auto w-full space-y-16">
          {/* Trending Movies */}
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-gray-900 dark:text-white">
              Trending Movies
            </h2>
            <Carousel className="w-full">
              <CarouselContent>
                {trendingMovies.map((movie) => (
                  <CarouselItem
                    key={movie.id}
                    className="basis-1/2 sm:basis-1/4 md:basis-1/6"
                  >
                    <div className="bg-card rounded-xl shadow-md overflow-hidden flex flex-col items-center p-2 hover:scale-105 transition-transform">
                      <Image
                        src={
                          movie.poster_path
                            ? `https://image.tmdb.org/t/p/w300${movie.poster_path}`
                            : "/placeholder.svg"
                        }
                        alt={movie.title}
                        width={160}
                        height={240}
                        className="rounded-lg object-cover mb-2"
                      />
                      <div className="text-center text-sm font-medium line-clamp-2 text-gray-900 dark:text-white">
                        {movie.title}
                      </div>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </div>
          {/* Trending Series */}
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-gray-900 dark:text-white">
              Trending Series
            </h2>
            <Carousel className="w-full">
              <CarouselContent>
                {trendingSeries.map((series) => (
                  <CarouselItem
                    key={series.id}
                    className="basis-1/2 sm:basis-1/4 md:basis-1/6"
                  >
                    <div className="bg-card rounded-xl shadow-md overflow-hidden flex flex-col items-center p-2 hover:scale-105 transition-transform">
                      <Image
                        src={
                          series.poster_path
                            ? `https://image.tmdb.org/t/p/w300${series.poster_path}`
                            : "/placeholder.svg"
                        }
                        alt={series.name}
                        width={160}
                        height={240}
                        className="rounded-lg object-cover mb-2"
                      />
                      <div className="text-center text-sm font-medium line-clamp-2 text-gray-900 dark:text-white">
                        {series.name}
                      </div>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </div>
        </div>
      </div>
    </div>
  );
}
