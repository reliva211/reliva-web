import { NextRequest, NextResponse } from "next/server";

/**
 * API Route: Get similar albums for a given album ID
 *
 * This endpoint fetches albums by the same artist as "similar albums"
 * since Saavn doesn't provide a direct similar albums endpoint.
 *
 * @param request - NextRequest object containing the album ID
 * @returns JSON response with similar albums data
 */
export async function GET(request: NextRequest) {
  try {
    // Extract album ID from query parameters
    const { searchParams } = new URL(request.url);
    const albumId = searchParams.get("id");

    // Validate album ID
    if (!albumId) {
      return NextResponse.json(
        {
          error: "Album ID is required",
          message: "Please provide a valid album ID in the query parameters",
        },
        { status: 400 }
      );
    }

    // Step 1: Fetch album details to get artist information
    const albumDetails = await fetchAlbumDetails(albumId);

    if (!albumDetails?.artists?.primary?.[0]?.id) {
      return NextResponse.json({
        data: {
          albums: [],
          message: "No artist information found for this album",
        },
      });
    }

    // Step 2: Get the primary artist ID
    const artistId = albumDetails.artists.primary[0].id;

    // Step 3: Fetch albums by the same artist
    const artistAlbums = await fetchArtistAlbums(artistId);

    // Step 4: Filter and process the results
    const similarAlbums = processSimilarAlbums(artistAlbums, albumId);

    return NextResponse.json({
      data: {
        albums: similarAlbums,
        total: similarAlbums.length,
        artist: albumDetails.artists.primary[0].name,
      },
    });
  } catch (error) {
    console.error("❌ Error fetching similar albums:", error);

    return NextResponse.json(
      {
        data: {
          albums: [],
          message: "Failed to fetch similar albums",
        },
      },
      { status: 200 }
    );
  }
}

/**
 * Fetch album details from Saavn API
 */
async function fetchAlbumDetails(albumId: string) {
  const response = await fetch(`https://saavn.me/albums?id=${albumId}`, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    },
  });

  if (!response.ok) {
    throw new Error(`Album API responded with status: ${response.status}`);
  }

  const data = await response.json();
  return data.data;
}

/**
 * Fetch albums by artist from Saavn API
 */
async function fetchArtistAlbums(artistId: string) {
  const response = await fetch(
    `https://saavn.me/artists/albums?id=${artistId}`,
    {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      `Artist albums API responded with status: ${response.status}`
    );
  }

  const data = await response.json();
  return data.data?.albums || [];
}

/**
 * Process and filter similar albums
 */
function processSimilarAlbums(albums: any[], currentAlbumId: string) {
  // Filter out the current album and limit to 12 albums
  return albums
    .filter((album) => album.id !== currentAlbumId)
    .slice(0, 12)
    .map((album) => ({
      id: album.id,
      name: album.name,
      year: album.year,
      language: album.language,
      image: album.image,
      artists: album.artists,
      songCount: album.songCount,
      playCount: album.playCount,
      url: album.url,
    }));
}
