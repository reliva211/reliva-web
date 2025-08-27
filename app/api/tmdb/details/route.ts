import { NextRequest, NextResponse } from "next/server";
import { getMovieDetails, getSeriesDetails } from "@/lib/tmdb";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const type = searchParams.get("type") || "movie";

  if (!id) {
    return NextResponse.json(
      { error: "ID parameter is required" },
      { status: 400 }
    );
  }

  try {
    let details;

    if (type === "movie") {
      details = await getMovieDetails(id);
    } else if (type === "tv") {
      details = await getSeriesDetails(id);
    } else {
      return NextResponse.json(
        { error: "Invalid type parameter. Use 'movie' or 'tv'" },
        { status: 400 }
      );
    }

    if (!details) {
      return NextResponse.json({ error: "Content not found" }, { status: 404 });
    }

    return NextResponse.json({
      details,
      type,
    });
  } catch (error) {
    console.error("TMDB details error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch content details",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

