import { NextRequest, NextResponse } from "next/server";
import { getMoviesByGenre, getSeriesByGenre } from "@/lib/tmdb";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "movie";
  const genreId = searchParams.get("genreId");
  const page = parseInt(searchParams.get("page") || "1");

  if (!genreId) {
    return NextResponse.json(
      { error: "genreId parameter is required" },
      { status: 400 }
    );
  }

  try {
    let results;
    let totalResults = 0;

    if (type === "movie") {
      results = await getMoviesByGenre(parseInt(genreId), page);
      totalResults = results.length;
    } else if (type === "tv") {
      results = await getSeriesByGenre(parseInt(genreId), page);
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
      genre_id: genreId,
      type,
    });
  } catch (error) {
    console.error("TMDB discover error:", error);
    return NextResponse.json(
      {
        error: "Failed to discover content",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

