"use client";

import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";

interface ProfileMusicSectionProps {
  // Optional future props for wiring real data
}

// Placeholder content intentionally simple; swap with real data later
const PLACEHOLDER = {
  currentObsession: {
    title: "vertigo",
    subtitle: "khalid",
    cover: "/placeholder.svg",
  },
  favoriteArtist: {
    name: "the weeknd",
    avatar:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=240&h=240&fit=crop&crop=faces",
  },
  favoriteSong: {
    title: "Sir Ostara",
    subtitle: "Thaman S",
    cover: "/placeholder.svg",
  },
  favoriteAlbums: new Array(4).fill(0).map((_, i) => ({
    id: `alb-${i}`,
    cover: "/placeholder.svg",
  })),
  recommendations: new Array(4).fill(0).map((_, i) => ({
    id: `rec-${i}`,
    cover: "/placeholder.svg",
  })),
};

export default function ProfileMusicSection(_: ProfileMusicSectionProps) {
  return (
    <div className="space-y-5 max-w-[540px] mx-auto">
      {/* Top three tiles: current obsession, favorite artist, favorite song */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {/* current obsession */}
        <div>
          <p className="text-xs text-muted-foreground mb-2">
            current obsession
          </p>
          <Card className="shadow-none border border-border/30">
            <CardContent className="p-1.5">
              <div className="aspect-square w-full bg-muted rounded-md overflow-hidden">
                <Image
                  src={PLACEHOLDER.currentObsession.cover}
                  alt={PLACEHOLDER.currentObsession.title}
                  width={256}
                  height={256}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="mt-2">
                <p className="text-xs font-medium leading-tight">
                  {PLACEHOLDER.currentObsession.title}
                </p>
                <p className="text-[11px] text-muted-foreground truncate">
                  {PLACEHOLDER.currentObsession.subtitle}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* favorite artist with circular avatar overlay */}
        <div>
          <p className="text-xs text-muted-foreground mb-2">favorite artist</p>
          <Card className="relative shadow-none border border-border/30">
            <CardContent className="p-1.5">
              <div className="aspect-square w-full bg-muted rounded-md overflow-hidden flex items-center justify-center">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border border-border/40">
                  <Image
                    src={PLACEHOLDER.favoriteArtist.avatar}
                    alt={PLACEHOLDER.favoriteArtist.name}
                    width={96}
                    height={96}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <div className="mt-2 text-center">
                <p className="text-xs font-medium leading-tight">
                  {PLACEHOLDER.favoriteArtist.name}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* favorite song */}
        <div>
          <p className="text-xs text-muted-foreground mb-2">favorite song</p>
          <Card className="shadow-none border border-border/30">
            <CardContent className="p-1.5">
              <div className="aspect-square w-full bg-muted rounded-md overflow-hidden">
                <Image
                  src={PLACEHOLDER.favoriteSong.cover}
                  alt={PLACEHOLDER.favoriteSong.title}
                  width={256}
                  height={256}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="mt-2">
                <p className="text-xs font-medium leading-tight">
                  {PLACEHOLDER.favoriteSong.title}
                </p>
                <p className="text-[11px] text-muted-foreground truncate">
                  {PLACEHOLDER.favoriteSong.subtitle}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* playlists note */}
      <div>
        <p className="text-xs text-muted-foreground mb-2">playlists</p>
        <p className="text-[11px] text-muted-foreground">
          share your spotify, apple music, youtube music playlists (coming
          soon).
        </p>
      </div>

      {/* favorite albums */}
      <div>
        <p className="text-xs text-muted-foreground mb-2">favorite albums</p>
        <div className="grid grid-cols-4 gap-2">
          {PLACEHOLDER.favoriteAlbums.map((a, idx) => (
            <div
              key={a.id}
              className="relative aspect-square w-full bg-muted rounded-md overflow-hidden"
            >
              <Image
                src={a.cover}
                alt="album"
                width={160}
                height={160}
                className="w-full h-full object-cover"
              />
              {idx === 0 && (
                <div className="absolute bottom-1 left-1 text-[10px] leading-tight">
                  <div>My dear</div>
                  <div>melancholy</div>
                  <div className="text-muted-foreground">The weeknd</div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* recommendations */}
      <div>
        <p className="text-xs text-muted-foreground mb-2">recommendations</p>
        <div className="grid grid-cols-4 gap-2">
          {PLACEHOLDER.recommendations.map((r) => (
            <div
              key={r.id}
              className="aspect-square w-full bg-muted rounded-md"
            />
          ))}
        </div>
      </div>

      {/* rating */}
      <div>
        <p className="text-xs text-muted-foreground mb-2">rating</p>
        <div className="grid grid-cols-4 gap-2">
          {new Array(4).fill(0).map((_, i) => (
            <div
              key={`rt-${i}`}
              className="aspect-square w-full bg-muted rounded-md relative"
            >
              {i === 0 && (
                <div className="absolute bottom-1 left-1 right-1 flex justify-start gap-1 text-[10px] opacity-60">
                  <span>★</span>
                  <span>★</span>
                  <span>★</span>
                  <span>★</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
