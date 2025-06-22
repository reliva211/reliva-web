"use client";

import { useParams } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";

// This is a placeholder. In a real app, you would fetch this data.
const allSeries = [
  {
    id: 1,
    title: "Breaking Bad",
    year: 2008,
    cover: "/placeholder.svg?height=450&width=300",
    description:
      "A high school chemistry teacher diagnosed with inoperable lung cancer turns to manufacturing and selling methamphetamine in order to secure his family's future.",
    rating: 5,
    genres: ["Crime", "Drama", "Thriller"],
  },
  {
    id: 2,
    title: "Game of Thrones",
    year: 2011,
    cover: "/placeholder.svg?height=450&width=300",
    description:
      "Nine noble families fight for control over the lands of Westeros, while an ancient enemy returns after being dormant for millennia.",
    rating: 4,
    genres: ["Action", "Adventure", "Drama"],
  },
  // Add other series from your dummy data here...
];

export default function SeriesDetailPage() {
  const params = useParams();
  const seriesId = params.id;

  // Find the series from the dummy data.
  // In a real app, you'd fetch this from your API/database.
  const series = allSeries.find((s) => s.id.toString() === seriesId);

  if (!series) {
    return <div>Series not found.</div>;
  }

  return (
    <div className="container mx-auto py-12 px-4 md:px-6">
      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <Image
            src={series.cover}
            alt={series.title}
            width={300}
            height={450}
            className="rounded-lg w-full"
          />
        </div>
        <div className="md:col-span-2 space-y-4">
          <h1 className="text-4xl font-bold">{series.title}</h1>
          <div className="flex items-center gap-4 text-muted-foreground">
            <span>{series.year}</span>
            <div className="flex items-center gap-1">
              <Star className="w-5 h-5 fill-primary text-primary" />
              <span>{series.rating}/5</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {series.genres.map((genre) => (
              <Badge key={genre} variant="secondary">
                {genre}
              </Badge>
            ))}
          </div>
          <p className="text-lg">{series.description}</p>
          <div className="flex gap-4">
            <Button>Add to Watched</Button>
            <Button variant="outline">Add to Watchlist</Button>
            <Button variant="outline">Add Rating</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
