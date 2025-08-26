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
  ArrowLeft,
  Calendar,
  MapPin,
  ExternalLink,
} from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";

interface PersonDetail {
  id: number;
  name: string;
  biography: string;
  profile_path: string | null;
  birthday: string;
  deathday: string | null;
  place_of_birth: string;
  known_for_department: string;
  popularity: number;
  imdb_id: string;
  homepage: string;
  combined_credits?: {
    cast: Array<{
      id: number;
      title?: string;
      name?: string;
      character: string;
      poster_path: string | null;
      media_type: string;
      release_date?: string;
      first_air_date?: string;
      vote_average: number;
    }>;
    crew: Array<{
      id: number;
      title?: string;
      name?: string;
      job: string;
      department: string;
      poster_path: string | null;
      media_type: string;
      release_date?: string;
      first_air_date?: string;
      vote_average: number;
    }>;
  };
}

export default function PersonDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { user, loading: authLoading } = useCurrentUser();
  const router = useRouter();
  const [person, setPerson] = useState<PersonDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const resolvedParams = use(params);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;

    const fetchPersonDetails = async () => {
      try {
        setLoading(true);
        const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY;
        const response = await fetch(
          `https://api.themoviedb.org/3/person/${resolvedParams.id}?api_key=${apiKey}&append_to_response=combined_credits`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch person details");
        }

        const data = await response.json();
        setPerson(data);
      } catch (err) {
        setError("Failed to load person details");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPersonDetails();
  }, [resolvedParams.id, user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded-xl w-1/4 mb-8"></div>
            <div className="flex flex-col lg:flex-row gap-8">
              <div className="w-full lg:w-1/3">
                <div className="aspect-[2/3] bg-muted rounded-2xl shadow-lg"></div>
              </div>
              <div className="flex-1 space-y-6">
                <div className="h-8 bg-muted rounded-xl w-3/4"></div>
                <div className="h-4 bg-muted rounded-lg w-1/2"></div>
                <div className="space-y-3">
                  <div className="h-4 bg-muted rounded-lg"></div>
                  <div className="h-4 bg-muted rounded-lg w-5/6"></div>
                  <div className="h-4 bg-muted rounded-lg w-4/6"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !person) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <div className="text-center p-8 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50">
          <h1 className="text-2xl font-bold mb-4">Error</h1>
          <p className="text-muted-foreground mb-6">
            {error || "Failed to load person details"}
          </p>
          <Button onClick={() => router.back()} className="rounded-xl">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getAge = (birthday: string, deathday?: string | null) => {
    const birth = new Date(birthday);
    const death = deathday ? new Date(deathday) : new Date();
    return death.getFullYear() - birth.getFullYear();
  };

  const castCredits = person.combined_credits?.cast || [];
  const crewCredits = person.combined_credits?.crew || [];
  const allCredits = [...castCredits, ...crewCredits].sort((a, b) => {
    const dateA = a.release_date || a.first_air_date || "";
    const dateB = b.release_date || b.first_air_date || "";
    return new Date(dateB).getTime() - new Date(dateA).getTime();
  });

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

        {/* Person Header */}
        <div className="flex flex-col lg:flex-row gap-8 mb-12">
          {/* Profile Image */}
          <div className="w-full lg:w-1/4">
            <div className="relative group max-w-xs mx-auto lg:mx-0">
              <div className="aspect-[2/3] rounded-2xl overflow-hidden bg-gradient-to-br from-muted to-muted/50 shadow-2xl group-hover:shadow-3xl transition-all duration-300">
                {person.profile_path ? (
                  <Image
                    src={`https://image.tmdb.org/t/p/w300${person.profile_path}`}
                    alt={person.name}
                    width={300}
                    height={450}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                    <span className="text-4xl font-bold text-muted-foreground/50">
                      {person.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              {/* Subtle overlay gradient */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-black/10 via-transparent to-transparent pointer-events-none"></div>
            </div>
          </div>

          {/* Person Info */}
          <div className="flex-1 space-y-8">
            <div className="space-y-4">
              <h1 className="text-5xl lg:text-6xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                {person.name}
              </h1>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 text-muted-foreground">
                {person.birthday && (
                  <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted/50 backdrop-blur-sm border border-border/30">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">
                      {formatDate(person.birthday)}
                      {person.deathday
                        ? ` - ${formatDate(person.deathday)}`
                        : ""}
                      {!person.deathday &&
                        ` (${getAge(person.birthday)} years old)`}
                    </span>
                  </div>
                )}
                {person.place_of_birth && (
                  <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted/50 backdrop-blur-sm border border-border/30">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">
                      {person.place_of_birth}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {person.biography && (
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                  Biography
                </h2>
                <div className="p-6 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/30 shadow-lg">
                  <p className="text-muted-foreground leading-relaxed text-base">
                    {person.biography.length > 500
                      ? `${person.biography.substring(0, 500)}...`
                      : person.biography}
                  </p>
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <Badge
                variant="secondary"
                className="rounded-xl px-4 py-2 text-sm font-medium bg-primary/10 text-primary border-primary/20"
              >
                {person.known_for_department}
              </Badge>
              {person.imdb_id && (
                <Badge
                  variant="outline"
                  className="rounded-xl px-4 py-2 text-sm font-medium hover:bg-muted/50 transition-colors group"
                >
                  <a
                    href={`https://www.imdb.com/name/${person.imdb_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 hover:underline"
                  >
                    IMDB
                    <ExternalLink className="h-3 w-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </a>
                </Badge>
              )}
              {person.homepage && (
                <Badge
                  variant="outline"
                  className="rounded-xl px-4 py-2 text-sm font-medium hover:bg-muted/50 transition-colors group"
                >
                  <a
                    href={person.homepage}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 hover:underline"
                  >
                    Website
                    <ExternalLink className="h-3 w-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </a>
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Credits Tabs */}
        <div className="space-y-8">
          <Tabs defaultValue="all" className="space-y-6">
            <TabsList className="inline-flex h-12 items-center justify-center rounded-xl bg-muted/30 backdrop-blur-sm border border-border/20 p-1 gap-1">
              <TabsTrigger
                value="all"
                className="inline-flex items-center justify-center whitespace-nowrap rounded-lg px-6 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm hover:bg-muted/50"
              >
                All Credits ({allCredits.length})
              </TabsTrigger>
              <TabsTrigger
                value="acting"
                className="inline-flex items-center justify-center whitespace-nowrap rounded-lg px-6 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm hover:bg-muted/50"
              >
                Acting ({castCredits.length})
              </TabsTrigger>
              <TabsTrigger
                value="crew"
                className="inline-flex items-center justify-center whitespace-nowrap rounded-lg px-6 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm hover:bg-muted/50"
              >
                Crew ({crewCredits.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 px-4">
                {allCredits.map((credit, index) => (
                  <div
                    key={`${credit.id}-${index}`}
                    className="overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-300 rounded-xl group bg-muted/30 backdrop-blur-sm hover:bg-muted/50 hover:scale-105 border border-border/20"
                    onClick={() => {
                      const mediaType =
                        credit.media_type === "tv" ? "series" : "movie";
                      router.push(
                        `/${mediaType === "series" ? "series" : "movies"}/${
                          credit.id
                        }`
                      );
                    }}
                  >
                    <div className="aspect-[2/3] relative overflow-hidden">
                      {credit.poster_path ? (
                        <Image
                          src={`https://image.tmdb.org/t/p/w200${credit.poster_path}`}
                          alt={credit.title || credit.name || "Unknown"}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                          <span className="text-muted-foreground/50 text-xs">
                            No Image
                          </span>
                        </div>
                      )}
                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>
                    <div className="p-2 sm:p-3">
                      <h3 className="font-medium text-sm sm:text-xs md:text-sm truncate mb-1 sm:mb-1.5 group-hover:text-primary transition-colors line-clamp-2 min-h-[2rem] sm:min-h-[1.5rem] leading-tight">
                        {credit.title || credit.name}
                      </h3>
                      <p className="text-sm sm:text-xs md:text-sm text-muted-foreground truncate line-clamp-1">
                        {"character" in credit ? credit.character : credit.job}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="acting" className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 px-4">
                {castCredits.map((credit, index) => (
                  <div
                    key={`cast-${credit.id}-${index}`}
                    className="overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-300 rounded-xl group bg-muted/30 backdrop-blur-sm hover:bg-muted/50 hover:scale-105 border border-border/20"
                    onClick={() => {
                      const mediaType =
                        credit.media_type === "tv" ? "series" : "movie";
                      router.push(
                        `/${mediaType === "series" ? "series" : "movies"}/${
                          credit.id
                        }`
                      );
                    }}
                  >
                    <div className="aspect-[2/3] relative overflow-hidden">
                      {credit.poster_path ? (
                        <Image
                          src={`https://image.tmdb.org/t/p/w200${credit.poster_path}`}
                          alt={credit.title || credit.name || "Unknown"}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                          <span className="text-muted-foreground/50 text-xs">
                            No Image
                          </span>
                        </div>
                      )}
                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>
                    <div className="p-2 sm:p-3">
                      <h3 className="font-medium text-sm sm:text-xs md:text-sm truncate mb-1 sm:mb-1.5 group-hover:text-primary transition-colors line-clamp-2 min-h-[2rem] sm:min-h-[1.5rem] leading-tight">
                        {credit.title || credit.name}
                      </h3>
                      <p className="text-sm sm:text-xs md:text-sm text-muted-foreground truncate line-clamp-1">
                        as {credit.character}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="crew" className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 px-4">
                {crewCredits.map((credit, index) => (
                  <div
                    key={`crew-${credit.id}-${index}`}
                    className="overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-300 rounded-xl group bg-muted/30 backdrop-blur-sm hover:bg-muted/50 hover:scale-105 border border-border/20"
                    onClick={() => {
                      const mediaType =
                        credit.media_type === "tv" ? "series" : "movie";
                      router.push(
                        `/${mediaType === "series" ? "series" : "movies"}/${
                          credit.id
                        }`
                      );
                    }}
                  >
                    <div className="aspect-[2/3] relative overflow-hidden">
                      {credit.poster_path ? (
                        <Image
                          src={`https://image.tmdb.org/t/p/w200${credit.poster_path}`}
                          alt={credit.title || credit.name || "Unknown"}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                          <span className="text-muted-foreground/50 text-xs">
                            No Image
                          </span>
                        </div>
                      )}
                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>
                    <div className="p-2 sm:p-3">
                      <h3 className="font-medium text-sm sm:text-xs md:text-sm truncate mb-1 sm:mb-1.5 group-hover:text-primary transition-colors line-clamp-2 min-h-[2rem] sm:min-h-[1.5rem] leading-tight">
                        {credit.title || credit.name}
                      </h3>
                      <p className="text-sm sm:text-xs md:text-sm text-muted-foreground truncate line-clamp-1">
                        {credit.job}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
