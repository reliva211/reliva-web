import { NextResponse } from "next/server";
import { 
  searchSaavn, 
  getSongById, 
  getAlbumById, 
  getArtistById, 
  getSongLyrics,
  getTrendingContent,
  getPlaylistById 
} from "@/lib/saavn";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");
  const query = searchParams.get("query");
  const id = searchParams.get("id");
  const type = searchParams.get("type") || "all";

  try {
    switch (action) {
      case "search":
        if (!query) {
          return NextResponse.json(
            { error: "Query parameter is required for search" },
            { status: 400 }
          );
        }
        const searchResults = await searchSaavn(query, type as any);
        return NextResponse.json(searchResults);

      case "song":
        if (!id) {
          return NextResponse.json(
            { error: "ID parameter is required for song details" },
            { status: 400 }
          );
        }
        const song = await getSongById(id);
        return NextResponse.json(song);

      case "album":
        if (!id) {
          return NextResponse.json(
            { error: "ID parameter is required for album details" },
            { status: 400 }
          );
        }
        const album = await getAlbumById(id);
        return NextResponse.json(album);

      case "artist":
        if (!id) {
          return NextResponse.json(
            { error: "ID parameter is required for artist details" },
            { status: 400 }
          );
        }
        const artist = await getArtistById(id);
        return NextResponse.json(artist);

      case "lyrics":
        if (!id) {
          return NextResponse.json(
            { error: "ID parameter is required for lyrics" },
            { status: 400 }
          );
        }
        const lyrics = await getSongLyrics(id);
        return NextResponse.json(lyrics);

      case "trending":
        const trending = await getTrendingContent(type as any);
        return NextResponse.json(trending);

      case "playlist":
        if (!id) {
          return NextResponse.json(
            { error: "ID parameter is required for playlist details" },
            { status: 400 }
          );
        }
        const playlist = await getPlaylistById(id);
        return NextResponse.json(playlist);

      default:
        return NextResponse.json(
          { error: "Invalid action parameter" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Saavn API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch data from Saavn API" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, data } = body;

    // Handle any POST operations if needed in the future
    // For now, Saavn API is primarily read-only
    
    return NextResponse.json(
      { error: "POST operations not supported yet" },
      { status: 501 }
    );
  } catch (error) {
    console.error("Saavn POST API error:", error);
    return NextResponse.json(
      { error: "Failed to process POST request" },
      { status: 500 }
    );
  }
}