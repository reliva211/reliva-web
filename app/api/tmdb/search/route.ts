import { NextRequest, NextResponse } from "next/server";

const TMDB_API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY || "";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");
  const type = searchParams.get("type") || "movie";

  console.log("TMDB search request:", { query, type });

  if (!query) {
    console.error("Missing query parameter");
    return NextResponse.json(
      { error: "Query parameter 'q' is required" },
      { status: 400 }
    );
  }

  if (!TMDB_API_KEY) {
    console.error("TMDB API key not configured");
    return NextResponse.json(
      {
        error:
          "TMDB API key not configured. Please add NEXT_PUBLIC_TMDB_API_KEY to your environment variables.",
      },
      { status: 500 }
    );
  }

  console.log("TMDB API key configured:", TMDB_API_KEY ? "Yes" : "No");

  try {
    let apiUrl: string;
    const page = searchParams.get("page") || "1";
    const limit = searchParams.get("limit") || "20";

    switch (type) {
      case "movie":
        apiUrl = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(
          query
        )}&language=en-US&page=${page}&include_adult=false&sort_by=popularity.desc`;
        break;
      case "person":
        apiUrl = `https://api.themoviedb.org/3/search/person?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(
          query
        )}&language=en-US&page=${page}&include_adult=false&sort_by=popularity.desc`;
        break;
      case "tv":
        apiUrl = `https://api.themoviedb.org/3/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(
          query
        )}&language=en-US&page=${page}&include_adult=false&sort_by=popularity.desc`;
        break;
      default:
        apiUrl = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(
          query
        )}&language=en-US&page=${page}&include_adult=false&sort_by=popularity.desc`;
    }

    console.log("Making request to TMDB API:", apiUrl);
    const response = await fetch(apiUrl);

    console.log("TMDB API response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("TMDB API error response:", errorText);
      throw new Error(`TMDB API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log("TMDB API response data:", data);

    // Transform the results based on type
    let results;
    if (type === "movie") {
      results = data.results.map((movie: any) => ({
        id: movie.id,
        title: movie.title,
        name: movie.title, // For consistency with other APIs
        year: parseInt(movie.release_date?.split("-")[0] || "0000", 10),
        cover: movie.poster_path
          ? `https://image.tmdb.org/t/p/w300${movie.poster_path}`
          : "/placeholder.svg?height=300&width=200",
        rating: movie.vote_average ?? 0,
        overview: movie.overview || "",
        release_date: movie.release_date || "",
        vote_average: movie.vote_average || 0,
        vote_count: movie.vote_count || 0,
        genre_ids: movie.genre_ids || [],
        type: "movie",
      }));
    } else if (type === "person") {
      results = data.results.map((person: any) => ({
        id: person.id,
        name: person.name,
        title: person.name, // For consistency
        image: person.profile_path
          ? `https://image.tmdb.org/t/p/w300${person.profile_path}`
          : "/placeholder.svg?height=300&width=200",
        known_for_department: person.known_for_department || "",
        popularity: person.popularity || 0,
        type: "person",
      }));
    } else {
      results = data.results || [];
    }

    return NextResponse.json({
      results,
      total_results: data.total_results || 0,
      total_pages: data.total_pages || 0,
    });
  } catch (error) {
    console.error("TMDB search error:", error);

    // Return mock data as fallback for development
    const mockResults =
      type === "movie"
        ? [
            {
              id: "550",
              title: "Fight Club",
              name: "Fight Club",
              year: 1999,
              cover:
                "https://image.tmdb.org/t/p/w300/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
              rating: 8.8,
              overview:
                "A ticking-time-bomb insomniac and a slippery soap salesman channel primal male aggression into a shocking new form of therapy.",
              release_date: "1999-10-15",
              vote_average: 8.8,
              vote_count: 25000,
              genre_ids: [18],
              type: "movie",
            },
            {
              id: "13",
              title: "Forrest Gump",
              name: "Forrest Gump",
              year: 1994,
              cover:
                "https://image.tmdb.org/t/p/w300/saHP97rTPS5eLmrLQEcANmKrsFl.jpg",
              rating: 8.8,
              overview:
                "A man with a low IQ has accomplished great things in his life and been present during significant historic events.",
              release_date: "1994-07-06",
              vote_average: 8.8,
              vote_count: 24000,
              genre_ids: [35, 18],
              type: "movie",
            },
          ]
        : [
            {
              id: "976",
              name: "Jason Statham",
              title: "Jason Statham",
              image:
                "https://image.tmdb.org/t/p/w300/whNwkEQYWLFJA8ij0WyOOAD5xhQ.jpg",
              known_for_department: "Acting",
              popularity: 15.5,
              type: "person",
            },
          ];

    return NextResponse.json({
      results: mockResults,
      total_results: mockResults.length,
      total_pages: 1,
      fallback: true,
      error: error instanceof Error ? error.message : "Failed to search TMDB",
    });
  }
}
