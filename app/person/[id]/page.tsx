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
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/4 mb-8"></div>
            <div className="flex flex-col md:flex-row gap-8">
              <div className="w-full md:w-1/3">
                <div className="aspect-[2/3] bg-muted rounded-lg"></div>
              </div>
              <div className="flex-1 space-y-4">
                <div className="h-8 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded"></div>
                  <div className="h-4 bg-muted rounded w-5/6"></div>
                  <div className="h-4 bg-muted rounded w-4/6"></div>
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Error</h1>
          <p className="text-muted-foreground mb-4">
            {error || "Failed to load person details"}
          </p>
          <Button onClick={() => router.back()}>Go Back</Button>
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
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Button variant="ghost" onClick={() => router.back()} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        {/* Person Header */}
        <div className="flex flex-col md:flex-row gap-8 mb-8">
          {/* Profile Image */}
          <div className="w-full md:w-1/3">
            <div className="aspect-[2/3] rounded-lg overflow-hidden bg-muted">
              {person.profile_path ? (
                <Image
                  src={`https://image.tmdb.org/t/p/w500${person.profile_path}`}
                  alt={person.name}
                  width={500}
                  height={750}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-4xl font-bold text-muted-foreground">
                    {person.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Person Info */}
          <div className="flex-1 space-y-6">
            <div>
              <h1 className="text-4xl font-bold mb-2">{person.name}</h1>
              <div className="flex items-center gap-4 text-muted-foreground">
                {person.birthday && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>
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
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>{person.place_of_birth}</span>
                  </div>
                )}
              </div>
            </div>

            {person.biography && (
              <div>
                <h2 className="text-xl font-semibold mb-3">Biography</h2>
                <p className="text-muted-foreground leading-relaxed">
                  {person.biography.length > 500
                    ? `${person.biography.substring(0, 500)}...`
                    : person.biography}
                </p>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{person.known_for_department}</Badge>
              {person.imdb_id && (
                <Badge variant="outline">
                  <a
                    href={`https://www.imdb.com/name/${person.imdb_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    IMDB
                  </a>
                </Badge>
              )}
              {person.homepage && (
                <Badge variant="outline">
                  <a
                    href={person.homepage}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    Website
                  </a>
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Credits Tabs */}
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList>
            <TabsTrigger value="all">
              All Credits ({allCredits.length})
            </TabsTrigger>
            <TabsTrigger value="acting">
              Acting ({castCredits.length})
            </TabsTrigger>
            <TabsTrigger value="crew">Crew ({crewCredits.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {allCredits.map((credit, index) => (
                <Card
                  key={`${credit.id}-${index}`}
                  className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
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
                  <div className="aspect-[2/3] relative">
                    {credit.poster_path ? (
                      <Image
                        src={`https://image.tmdb.org/t/p/w300${credit.poster_path}`}
                        alt={credit.title || credit.name || "Unknown"}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <span className="text-muted-foreground">No Image</span>
                      </div>
                    )}
                  </div>
                  <CardContent className="p-3">
                    <h3 className="font-medium text-sm truncate">
                      {credit.title || credit.name}
                    </h3>
                    <p className="text-xs text-muted-foreground truncate">
                      {"character" in credit ? credit.character : credit.job}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {credit.release_date || credit.first_air_date
                        ? new Date(
                            credit.release_date || credit.first_air_date!
                          ).getFullYear()
                        : "Unknown"}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="acting" className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {castCredits.map((credit, index) => (
                <Card
                  key={`cast-${credit.id}-${index}`}
                  className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
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
                  <div className="aspect-[2/3] relative">
                    {credit.poster_path ? (
                      <Image
                        src={`https://image.tmdb.org/t/p/w300${credit.poster_path}`}
                        alt={credit.title || credit.name || "Unknown"}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <span className="text-muted-foreground">No Image</span>
                      </div>
                    )}
                  </div>
                  <CardContent className="p-3">
                    <h3 className="font-medium text-sm truncate">
                      {credit.title || credit.name}
                    </h3>
                    <p className="text-xs text-muted-foreground truncate">
                      as {credit.character}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {credit.release_date || credit.first_air_date
                        ? new Date(
                            credit.release_date || credit.first_air_date!
                          ).getFullYear()
                        : "Unknown"}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="crew" className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {crewCredits.map((credit, index) => (
                <Card
                  key={`crew-${credit.id}-${index}`}
                  className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
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
                  <div className="aspect-[2/3] relative">
                    {credit.poster_path ? (
                      <Image
                        src={`https://image.tmdb.org/t/p/w300${credit.poster_path}`}
                        alt={credit.title || credit.name || "Unknown"}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <span className="text-muted-foreground">No Image</span>
                      </div>
                    )}
                  </div>
                  <CardContent className="p-3">
                    <h3 className="font-medium text-sm truncate">
                      {credit.title || credit.name}
                    </h3>
                    <p className="text-xs text-muted-foreground truncate">
                      {credit.job}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {credit.release_date || credit.first_air_date
                        ? new Date(
                            credit.release_date || credit.first_air_date!
                          ).getFullYear()
                        : "Unknown"}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
