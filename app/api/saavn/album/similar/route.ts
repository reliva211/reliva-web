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

    console.log("🔍 Similar Albums API called with album ID:", albumId);

    // Validate album ID
    if (!albumId) {
      console.log("❌ No album ID provided");
      return NextResponse.json(
        {
          error: "Album ID is required",
          message: "Please provide a valid album ID in the query parameters",
        },
        { status: 400 }
      );
    }

    // Step 1: Fetch album details to get artist information
    console.log("📀 Fetching album details for ID:", albumId);
    const albumDetails = await fetchAlbumDetails(albumId);
    console.log("📀 Album details:", albumDetails);

    if (!albumDetails?.artists?.primary?.[0]?.id) {
      console.log("❌ No artist information found for album");
      return NextResponse.json({
        data: {
          albums: [],
          message: "No artist information found for this album",
        },
      });
    }

    // Step 2: Get the primary artist ID
    const artistId = albumDetails.artists.primary[0].id;
    const artistName = albumDetails.artists.primary[0].name;
    console.log("🎤 Found artist:", artistName, "with ID:", artistId);

    // Step 3: Fetch albums by the same artist
    console.log("🎵 Fetching albums for artist:", artistName);
    const artistAlbums = await fetchArtistAlbums(artistId);
    console.log("🎵 Artist albums found:", artistAlbums.length);

    // Step 4: Filter and process the results
    const similarAlbums = processSimilarAlbums(artistAlbums, albumId);
    console.log("🎵 Similar albums after filtering:", similarAlbums.length);

    return NextResponse.json({
      data: {
        albums: similarAlbums,
        total: similarAlbums.length,
        artist: artistName,
      },
    });
  } catch (error) {
    console.error("❌ Error fetching similar albums:", error);

    // Return fallback similar albums when API fails
    const fallbackAlbums = getFallbackAlbums();

    return NextResponse.json(
      {
        data: {
          albums: fallbackAlbums,
          total: fallbackAlbums.length,
          message:
            "Showing popular albums (similar albums temporarily unavailable)",
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
  console.log("🌐 Fetching album details from Saavn API...");
  try {
    const response = await fetch(`https://saavn.me/albums?id=${albumId}`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });

    console.log("🌐 Album API response status:", response.status);

    if (!response.ok) {
      console.error(
        "❌ Album API error:",
        response.status,
        response.statusText
      );
      throw new Error(`Album API responded with status: ${response.status}`);
    }

    // Check if response is JSON
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      console.error("❌ Album API returned non-JSON response:", contentType);
      throw new Error("Album API returned non-JSON response");
    }

    const data = await response.json();
    console.log("🌐 Album API response data:", data);

    if (!data || !data.data) {
      console.error("❌ Album API returned invalid data structure");
      throw new Error("Album API returned invalid data structure");
    }

    return data.data;
  } catch (error) {
    console.error("❌ Error fetching album details:", error);
    throw error;
  }
}

/**
 * Fetch albums by artist from Saavn API
 */
async function fetchArtistAlbums(artistId: string) {
  console.log("🌐 Fetching artist albums from Saavn API...");
  try {
    const response = await fetch(
      `https://saavn.me/artists/albums?id=${artistId}`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
      }
    );

    console.log("🌐 Artist albums API response status:", response.status);

    if (!response.ok) {
      console.error(
        "❌ Artist albums API error:",
        response.status,
        response.statusText
      );
      throw new Error(
        `Artist albums API responded with status: ${response.status}`
      );
    }

    // Check if response is JSON
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      console.error(
        "❌ Artist albums API returned non-JSON response:",
        contentType
      );
      throw new Error("Artist albums API returned non-JSON response");
    }

    const data = await response.json();
    console.log("🌐 Artist albums API response data:", data);

    if (!data || !data.data) {
      console.error("❌ Artist albums API returned invalid data structure");
      return [];
    }

    return data.data?.albums || [];
  } catch (error) {
    console.error("❌ Error fetching artist albums:", error);
    return [];
  }
}

/**
 * Process and filter similar albums
 */
function processSimilarAlbums(albums: any[], currentAlbumId: string) {
  console.log("🔧 Processing similar albums...");
  console.log("🔧 Total albums before filtering:", albums.length);
  console.log("🔧 Current album ID to exclude:", currentAlbumId);

  // Filter out the current album and limit to 12 albums
  const filteredAlbums = albums.filter((album) => album.id !== currentAlbumId);
  console.log(
    "🔧 Albums after filtering current album:",
    filteredAlbums.length
  );

  const limitedAlbums = filteredAlbums.slice(0, 12);
  console.log("🔧 Albums after limiting to 12:", limitedAlbums.length);

  const processedAlbums = limitedAlbums.map((album) => ({
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

  console.log("🔧 Final processed albums:", processedAlbums.length);
  return processedAlbums;
}

/**
 * Get fallback albums when API fails
 */
function getFallbackAlbums() {
  return [
    {
      id: "fallback-1",
      name: "Popular Hits 2024",
      year: "2024",
      language: "Hindi",
      image: [
        {
          quality: "500x500",
          url: "https://c.saavncdn.com/editorial/logo/500x500.jpg",
        },
      ],
      artists: {
        primary: [{ id: "artist-1", name: "Various Artists" }],
      },
      songCount: 15,
      playCount: 1000000,
      url: "#",
    },
    {
      id: "fallback-2",
      name: "Bollywood Classics",
      year: "2023",
      language: "Hindi",
      image: [
        {
          quality: "500x500",
          url: "https://c.saavncdn.com/editorial/logo/500x500.jpg",
        },
      ],
      artists: {
        primary: [{ id: "artist-2", name: "Bollywood Stars" }],
      },
      songCount: 20,
      playCount: 800000,
      url: "#",
    },
    {
      id: "fallback-3",
      name: "Latest Releases",
      year: "2024",
      language: "Hindi",
      image: [
        {
          quality: "500x500",
          url: "https://c.saavncdn.com/editorial/logo/500x500.jpg",
        },
      ],
      artists: {
        primary: [{ id: "artist-3", name: "New Artists" }],
      },
      songCount: 12,
      playCount: 500000,
      url: "#",
    },
  ];
}
