import { NextRequest, NextResponse } from "next/server";

const TMDB_API_KEY = process.env.TMDB_API_KEY || process.env.NEXT_PUBLIC_TMDB_API_KEY || "";

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string[] } }
) {
  if (!TMDB_API_KEY) {
    console.error("TMDB API key not configured");
    return NextResponse.json(
      {
        error: "TMDB API key not configured. Please add TMDB_API_KEY to your environment variables.",
      },
      { status: 500 }
    );
  }

  try {
    // Extract the path from the slug array
    const path = params.slug.join("/");
    
    // Get query parameters from the original request
    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();
    
    // Add API key to query parameters if not already present
    const separator = queryString ? "&" : "";
    const apiKeyParam = searchParams.has("api_key") ? "" : `${separator}api_key=${TMDB_API_KEY}`;
    
    // Construct the TMDB API URL
    const tmdbUrl = `https://api.themoviedb.org/3/${path}?${queryString}${apiKeyParam}`;
    
    console.log("Proxying TMDB request to:", tmdbUrl.replace(TMDB_API_KEY, "[REDACTED]"));
    
    // Make the request to TMDB
    const response = await fetch(tmdbUrl, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "User-Agent": "Reliva-Web-App/1.0",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("TMDB API error response:", response.status, errorText);
      return NextResponse.json(
        { error: `TMDB API error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Return the data with appropriate headers
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600", // Cache for 5 minutes
      },
    });
    
  } catch (error) {
    console.error("TMDB proxy error:", error);
    return NextResponse.json(
      { error: "Failed to fetch TMDB data" },
      { status: 500 }
    );
  }
}

// Support POST requests for any future TMDB endpoints that might need them
export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string[] } }
) {
  if (!TMDB_API_KEY) {
    return NextResponse.json(
      { error: "TMDB API key not configured" },
      { status: 500 }
    );
  }

  try {
    const path = params.slug.join("/");
    const body = await request.text();
    
    const tmdbUrl = `https://api.themoviedb.org/3/${path}?api_key=${TMDB_API_KEY}`;
    
    const response = await fetch(tmdbUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "User-Agent": "Reliva-Web-App/1.0",
      },
      body: body,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("TMDB API POST error:", response.status, errorText);
      return NextResponse.json(
        { error: `TMDB API error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error) {
    console.error("TMDB proxy POST error:", error);
    return NextResponse.json(
      { error: "Failed to post to TMDB" },
      { status: 500 }
    );
  }
}
