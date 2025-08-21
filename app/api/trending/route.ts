import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = searchParams.get("limit") || "12";

  try {
    // Fetch trending songs from JioSaavn API
    const trendingSongsEndpoint = `https://jiosavan-api-with-playlist.vercel.app/api/modules?language=english&page=1&limit=${limit}`;

    console.log("Fetching trending songs from:", trendingSongsEndpoint);

    const response = await fetch(trendingSongsEndpoint);

    if (!response.ok) {
      throw new Error(
        `JioSaavn API error: ${response.status} - ${response.statusText}`
      );
    }

    const data = await response.json();
    console.log("JioSaavn trending response:", data);

    let results = data.data?.results || data.results || [];

    // Transform song results to include proper artist structure
    results = results.map((song: any) => {
      // Extract artist name from various possible fields
      let artistName = song.primaryArtists || song.artist || "";

      // Try to extract artist from various possible fields
      if (!artistName || artistName === "Unknown Artist") {
        artistName =
          song.primaryArtists ||
          song.artist ||
          song.artists?.primary?.[0]?.name ||
          song.artists?.name ||
          song.featuredArtists ||
          song.singer ||
          "";
      }

      // If still no artist found, try to extract from the song object itself
      if (!artistName || artistName === "Unknown Artist") {
        const possibleArtistFields = [
          song.primaryArtists,
          song.artist,
          song.artists?.primary?.[0]?.name,
          song.artists?.name,
          song.featuredArtists,
          song.singer,
          song.composer,
        ];

        artistName =
          possibleArtistFields.find(
            (field) => field && field !== "Unknown Artist"
          ) || "";
      }

      return {
        ...song,
        // Ensure primaryArtists is a string
        primaryArtists: artistName || "Unknown Artist",
        // Add artists.primary array structure if it doesn't exist
        artists: song.artists || {
          primary: artistName ? [{ id: "", name: artistName }] : [],
        },
        // Ensure album structure exists
        album: song.album || {
          name: song.albumName || "Unknown Album",
        },
        // Ensure duration is a number
        duration: song.duration || 0,
        // Ensure year is a string
        year: song.year || "Unknown",
        // Ensure language is a string
        language: song.language || "Unknown",
        // Ensure playCount is a number
        playCount: song.playCount || 0,
      };
    });

    // Transform the response to match our expected format
    const transformedData = {
      data: {
        results: results,
      },
    };

    return NextResponse.json(transformedData);
  } catch (error) {
    console.error("Error fetching trending songs:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch trending songs",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
