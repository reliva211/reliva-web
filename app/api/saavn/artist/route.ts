import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Artist ID is required" },
        { status: 400 }
      );
    }

    console.log(`Fetching artist details for ID: ${id}`);

    // Try primary Saavn API first
    try {
      const response = await fetch(
        `https://saavn.dev/api/artists?id=${id}`,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        
        // Check if we got valid data
        if (data.data && data.data.name) {
          console.log(`Artist found: ${data.data.name}`);
          
          // Log the data structure to verify DOB and similar artists
          console.log(`DOB: ${data.data.dob}`);
          console.log(
            `Similar Artists Count: ${data.data.similarArtists?.length || 0}`
          );

          if (data.data.similarArtists && data.data.similarArtists.length > 0) {
            console.log(
              `Similar Artists: ${data.data.similarArtists
                .map((artist: any) => artist.name)
                .join(", ")}`
            );
          }

          return NextResponse.json(data);
        }
      }
    } catch (primaryError) {
      console.log("Primary API failed, trying fallback:", primaryError);
    }

    // Fallback to alternative API
    try {
      console.log("Trying fallback API for artist ID:", id);
      const fallbackResponse = await fetch(
        `https://jiosavan-api-with-playlist.vercel.app/api/artists?id=${id}`,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (fallbackResponse.ok) {
        const fallbackData = await fallbackResponse.json();
        if (fallbackData.data && fallbackData.data.name) {
          console.log(`Artist found via fallback: ${fallbackData.data.name}`);
          return NextResponse.json(fallbackData);
        }
      }
    } catch (fallbackError) {
      console.log("Fallback API also failed:", fallbackError);
    }

    // Final fallback: Try to search for the artist by name if we have it stored
    // This is a special case for known artists like A.R. Rahman
    const knownArtists: { [key: string]: string } = {
      "456269": "A.R. Rahman",
      "ar-rahman": "A.R. Rahman",
      "rahman": "A.R. Rahman"
    };

    if (knownArtists[id]) {
      console.log(`Trying search fallback for known artist: ${knownArtists[id]}`);
      try {
        const searchResponse = await fetch(
          `https://saavn.dev/api/search/artists?query=${encodeURIComponent(knownArtists[id])}&page=1&limit=5`,
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (searchResponse.ok) {
          const searchData = await searchResponse.json();
          if (searchData.data && searchData.data.results && searchData.data.results.length > 0) {
            const foundArtist = searchData.data.results[0];
            console.log(`Found artist via search: ${foundArtist.name}`);
            return NextResponse.json({ data: foundArtist });
          }
        }
      } catch (searchError) {
        console.log("Search fallback also failed:", searchError);
      }
    }

    // If both APIs fail, return error
    console.error(`Artist not found for ID: ${id}`);
    return NextResponse.json(
      { error: "Artist not found" },
      { status: 404 }
    );
  } catch (error) {
    console.error("Error fetching artist details:", error);
    return NextResponse.json(
      { error: "Failed to fetch artist details" },
      { status: 500 }
    );
  }
}
