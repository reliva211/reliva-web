import { NextRequest, NextResponse } from "next/server";
import { getTrendingMovies, getTrendingSeries } from "@/lib/tmdb";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "movie";
  const limit = parseInt(searchParams.get("limit") || "20");

  try {
    let results;
    let totalResults = 0;

    if (type === "movie") {
      results = await getTrendingMovies(limit);
      totalResults = results.length;
    } else if (type === "tv") {
      results = await getTrendingSeries(limit);
      totalResults = results.length;
    } else {
      return NextResponse.json(
        { error: "Invalid type parameter. Use 'movie' or 'tv'" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      results,
      total_results: totalResults,
      type,
      limit,
    });
  } catch (error) {
    console.error("TMDB trending error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch trending content",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
