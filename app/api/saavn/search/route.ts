import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q");
  const type = searchParams.get("type") || "song"; // song, album, artist
  const page = searchParams.get("page") || "1";
  const limit = searchParams.get("limit") || "10";

  if (!query) {
    return NextResponse.json(
      { error: "Query parameter is required" },
      { status: 400 }
    );
  }

  try {
    // Use the working JioSaavn API endpoints
    let endpoint = "";

    switch (type) {
      case "song":
        endpoint = `https://jiosavan-api-with-playlist.vercel.app/api/search/songs?query=${encodeURIComponent(
          query
        )}&page=${page}&limit=${limit}`;
        break;
      case "album":
        endpoint = `https://jiosavan-api-with-playlist.vercel.app/api/search/albums?query=${encodeURIComponent(
          query
        )}&page=${page}&limit=${limit}`;
        break;
      case "artist":
        // Use a dedicated artist search endpoint if available, otherwise fallback to song search
        endpoint = `https://jiosavan-api-with-playlist.vercel.app/api/search/artists?query=${encodeURIComponent(
          query
        )}&page=${page}&limit=${limit}`;
        break;
      default:
        endpoint = `https://jiosavan-api-with-playlist.vercel.app/api/search/songs?query=${encodeURIComponent(
          query
        )}&page=${page}&limit=${limit}`;
    }

    console.log("Using JioSaavn API endpoint:", endpoint);

    const response = await fetch(endpoint);

    if (!response.ok) {
      throw new Error(
        `JioSaavn API error: ${response.status} - ${response.statusText}`
      );
    }

    const data = await response.json();
    console.log("JioSaavn API response:", data);

    let results = data.data?.results || data.results || [];

    // For artist search, transform song results to artist format
    if (type === "artist") {
      // If the artist endpoint doesn't return proper artist data, fallback to song search
      if (results.length === 0 || !results[0].name) {
        console.log(
          "Artist endpoint returned no results, falling back to song search"
        );
        const songEndpoint = `https://jiosavan-api-with-playlist.vercel.app/api/search/songs?query=${encodeURIComponent(
          query
        )}&page=${page}&limit=${limit}`;

        const songResponse = await fetch(songEndpoint);
        if (songResponse.ok) {
          const songData = await songResponse.json();
          const songResults = songData.data?.results || songData.results || [];

          const artistMap = new Map();
          songResults.forEach((song: any) => {
            if (song.primaryArtists) {
              const artistName = song.primaryArtists;
              if (!artistMap.has(artistName)) {
                artistMap.set(artistName, {
                  id: `artist_${artistName.replace(/\s+/g, "_").toLowerCase()}`,
                  name: artistName,
                  primaryArtists: artistName, // Add this for consistency
                  image: song.image || [],
                  type: "artist",
                });
              }
            }
          });
          results = Array.from(artistMap.values()).slice(0, parseInt(limit));
        }
      } else {
        // If artist endpoint returned results, format them properly
        results = results.map((artist: any) => ({
          id:
            artist.id ||
            `artist_${artist.name?.replace(/\s+/g, "_").toLowerCase()}`,
          name: artist.name || artist.title,
          primaryArtists: artist.name || artist.title, // Add this for consistency
          image: artist.image || [],
          type: "artist",
        }));
      }
    }

    // Transform the response to match our expected format
    const transformedData = {
      data: {
        results: results,
      },
    };

    return NextResponse.json(transformedData);
  } catch (error) {
    console.error("JioSaavn API failed:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch music data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
