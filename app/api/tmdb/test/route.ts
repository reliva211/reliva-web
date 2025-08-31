import { NextRequest, NextResponse } from "next/server";

const TMDB_API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY || "";

export async function GET(request: NextRequest) {
  // Testing TMDB API connection

  if (!TMDB_API_KEY) {
    return NextResponse.json({
      success: false,
      error: "TMDB API key not configured",
      message:
        "Please add NEXT_PUBLIC_TMDB_API_KEY to your environment variables",
    });
  }

  try {
    // Test with a simple movie search
    const testUrl = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=inception&language=en-US&page=1&include_adult=false`;

    // Testing TMDB API with URL

    const response = await fetch(testUrl);

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({
        success: false,
        error: `TMDB API error: ${response.status}`,
        details: errorText,
      });
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      message: "TMDB API is working correctly",
      results: data.results?.length || 0,
      sample: data.results?.[0] || null,
    });
  } catch (error) {
    console.error("TMDB API test error:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to connect to TMDB API",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
