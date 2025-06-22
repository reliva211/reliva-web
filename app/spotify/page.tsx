"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/hooks/use-current-user";
import {
  getSpotifyTokensForCurrentUser,
  storeSpotifyTokens,
} from "@/lib/spotify-tokens";
import { getUserPlaylists } from "@/lib/spotify";

const SPOTIFY_CLIENT_ID = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID!;
const REDIRECT_URI =
  typeof window !== "undefined" ? `${window.location.origin}/spotify` : "";
const SPOTIFY_AUTH_URL =
  `https://accounts.spotify.com/authorize?` +
  new URLSearchParams({
    client_id: SPOTIFY_CLIENT_ID,
    response_type: "code",
    redirect_uri: REDIRECT_URI,
    scope: "user-read-email playlist-read-private",
    show_dialog: "true",
  }).toString();

interface SpotifyPlaylist {
  id: string;
  name: string;
  images: { url: string }[];
  owner: { display_name: string };
  external_urls: { spotify: string };
}

export default function SpotifyPage() {
  const user = useCurrentUser();
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlaylists = async () => {
      setLoading(true);
      if (user) {
        const spotify = await getSpotifyTokensForCurrentUser();
        if (spotify?.accessToken) {
          const items = await getUserPlaylists(spotify.accessToken);
          setPlaylists(items);
        }
      }
      setLoading(false);
    };
    fetchPlaylists();
  }, [user]);

  // Handle Spotify OAuth callback
  useEffect(() => {
    const url = new URL(window.location.href);
    const code = url.searchParams.get("code");
    if (code && user) {
      window.history.replaceState({}, document.title, "/spotify");
      fetch("/api/spotify/callback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, redirectUri: REDIRECT_URI }),
      })
        .then((res) => res.json())
        .then(async (data) => {
          if (data.accessToken && data.refreshToken && data.expiresIn) {
            await storeSpotifyTokens(
              data.accessToken,
              data.refreshToken,
              data.expiresIn
            );
          }
        });
    }
  }, [user]);

  const handleLogin = () => {
    window.location.href = SPOTIFY_AUTH_URL;
  };

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Please log in.</div>;

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Your Playlists</h1>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {playlists.map((playlist) => (
          <div
            key={playlist.id}
            className="border p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow"
          >
            <img
              src={playlist.images?.[0]?.url || "/placeholder.svg"}
              alt={playlist.name}
              className="w-full rounded-md aspect-square object-cover"
            />
            <h2 className="mt-2 font-semibold truncate">{playlist.name}</h2>
            <p className="text-sm text-muted-foreground">
              By {playlist.owner.display_name}
            </p>
            <Button asChild variant="outline" className="mt-4 w-full">
              <a
                href={playlist.external_urls.spotify}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open in Spotify
              </a>
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
