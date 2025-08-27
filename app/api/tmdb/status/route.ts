import { NextRequest, NextResponse } from "next/server";

const TMDB_API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY || "";

export async function GET(request: NextRequest) {
  try {
    // Check if API key is configured
    if (!TMDB_API_KEY) {
      return NextResponse.json({
        status: "error",
        message: "TMDB API key not configured",
        configured: false,
        timestamp: new Date().toISOString(),
      });
    }

    // Test API connection with a simple request
    const testResponse = await fetch(
      `https://api.themoviedb.org/3/configuration?api_key=${TMDB_API_KEY}`,
      { method: "GET" }
    );

    if (!testResponse.ok) {
      return NextResponse.json({
        status: "error",
        message: `TMDB API connection failed: ${testResponse.status}`,
        configured: true,
        api_status: testResponse.status,
        api_statusText: testResponse.statusText,
        timestamp: new Date().toISOString(),
      });
    }

    const configData = await testResponse.json();

    return NextResponse.json({
      status: "success",
      message: "TMDB API is working correctly",
      configured: true,
      api_status: testResponse.status,
      api_statusText: testResponse.statusText,
      base_url: configData.images?.base_url || "Not available",
      secure_base_url: configData.images?.secure_base_url || "Not available",
      poster_sizes: configData.images?.poster_sizes || [],
      backdrop_sizes: configData.images?.backdrop_sizes || [],
      profile_sizes: configData.images?.profile_sizes || [],
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("TMDB status check error:", error);
    return NextResponse.json(
      {
        status: "error",
        message: "Failed to check TMDB API status",
        configured: !!TMDB_API_KEY,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

