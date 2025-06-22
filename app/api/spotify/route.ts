import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

// Get user data from Spotify API
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.accessToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");

  try {
    switch (action) {
      case "playlists":
        const playlistsResponse = await fetch(
          "https://api.spotify.com/v1/me/playlists?limit=50",
          {
            headers: {
              Authorization: `Bearer ${session.accessToken}`,
            },
          }
        );

        if (!playlistsResponse.ok) {
          throw new Error(`Spotify API error: ${playlistsResponse.status}`);
        }

        const playlistsData = await playlistsResponse.json();
        return NextResponse.json(playlistsData);

      case "playlist-tracks":
        const playlistId = searchParams.get("playlistId");
        if (!playlistId) {
          return NextResponse.json(
            { error: "Playlist ID is required" },
            { status: 400 }
          );
        }

        const tracksResponse = await fetch(
          `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
          {
            headers: {
              Authorization: `Bearer ${session.accessToken}`,
            },
          }
        );

        if (!tracksResponse.ok) {
          throw new Error(`Spotify API error: ${tracksResponse.status}`);
        }

        const tracksData = await tracksResponse.json();
        return NextResponse.json(tracksData);

      case "top-artists":
        const timeRange = searchParams.get("time_range") || "medium_term";
        const topArtistsResponse = await fetch(
          `https://api.spotify.com/v1/me/top/artists?time_range=${timeRange}&limit=20`,
          {
            headers: {
              Authorization: `Bearer ${session.accessToken}`,
            },
          }
        );

        if (!topArtistsResponse.ok) {
          throw new Error(`Spotify API error: ${topArtistsResponse.status}`);
        }

        const topArtistsData = await topArtistsResponse.json();
        return NextResponse.json(topArtistsData);

      case "top-tracks":
        const tracksTimeRange = searchParams.get("time_range") || "medium_term";
        const topTracksResponse = await fetch(
          `https://api.spotify.com/v1/me/top/tracks?time_range=${tracksTimeRange}&limit=20`,
          {
            headers: {
              Authorization: `Bearer ${session.accessToken}`,
            },
          }
        );

        if (!topTracksResponse.ok) {
          throw new Error(`Spotify API error: ${topTracksResponse.status}`);
        }

        const topTracksData = await topTracksResponse.json();
        return NextResponse.json(topTracksData);

      case "saved-albums":
        const savedAlbumsResponse = await fetch(
          "https://api.spotify.com/v1/me/albums?limit=50",
          {
            headers: {
              Authorization: `Bearer ${session.accessToken}`,
            },
          }
        );

        if (!savedAlbumsResponse.ok) {
          throw new Error(`Spotify API error: ${savedAlbumsResponse.status}`);
        }

        const savedAlbumsData = await savedAlbumsResponse.json();
        return NextResponse.json(savedAlbumsData);

      case "saved-tracks":
        const savedTracksResponse = await fetch(
          "https://api.spotify.com/v1/me/tracks?limit=50",
          {
            headers: {
              Authorization: `Bearer ${session.accessToken}`,
            },
          }
        );

        if (!savedTracksResponse.ok) {
          throw new Error(`Spotify API error: ${savedTracksResponse.status}`);
        }

        const savedTracksData = await savedTracksResponse.json();
        return NextResponse.json(savedTracksData);

      case "recently-played":
        const recentlyPlayedResponse = await fetch(
          "https://api.spotify.com/v1/me/player/recently-played?limit=20",
          {
            headers: {
              Authorization: `Bearer ${session.accessToken}`,
            },
          }
        );

        if (!recentlyPlayedResponse.ok) {
          throw new Error(
            `Spotify API error: ${recentlyPlayedResponse.status}`
          );
        }

        const recentlyPlayedData = await recentlyPlayedResponse.json();
        return NextResponse.json(recentlyPlayedData);

      case "user-profile":
        const userProfileResponse = await fetch(
          "https://api.spotify.com/v1/me",
          {
            headers: {
              Authorization: `Bearer ${session.accessToken}`,
            },
          }
        );

        if (!userProfileResponse.ok) {
          throw new Error(`Spotify API error: ${userProfileResponse.status}`);
        }

        const userProfileData = await userProfileResponse.json();
        return NextResponse.json(userProfileData);

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Spotify API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch from Spotify" },
      { status: 500 }
    );
  }
}

// Add/remove tracks from playlists
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.accessToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const { action, playlistId, trackId } = await request.json();

    if (!action || !playlistId || !trackId) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    let method = "POST";
    let body = null;

    switch (action) {
      case "add":
        body = JSON.stringify({ uris: [`spotify:track:${trackId}`] });
        break;
      case "remove":
        method = "DELETE";
        body = JSON.stringify({
          tracks: [{ uri: `spotify:track:${trackId}` }],
        });
        break;
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const response = await fetch(
      `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
      {
        method,
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          "Content-Type": "application/json",
        },
        body,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Spotify API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Spotify API error:", error);
    return NextResponse.json(
      { error: "Failed to perform operation" },
      { status: 500 }
    );
  }
}
