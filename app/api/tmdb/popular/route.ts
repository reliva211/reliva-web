import { NextRequest, NextResponse } from "next/server";
import { getPopularMovies, getPopularSeries } from "@/lib/tmdb";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "movie";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");

  try {
    let results;
    let totalResults = 0;

    if (type === "movie") {
      results = await getPopularMovies(page, limit);
      totalResults = results.length;
    } else if (type === "tv") {
      results = await getPopularSeries(page, limit);
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
      page,
      type,
    });
  } catch (error) {
    console.error("TMDB popular error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch popular content",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

