import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Artist ID is required" },
        { status: 400 }
      );
    }

    console.log(`Fetching albums for artist ID: ${id}`);

    // First, get the artist details to get the name
    let artistName = "";
    try {
      const artistResponse = await fetch(
        `https://saavn.dev/api/artists?id=${id}`,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (artistResponse.ok) {
        const artistData = await artistResponse.json();
        if (artistData.data && artistData.data.name) {
          artistName = artistData.data.name;
          console.log(`Artist name: ${artistName}`);
        }
      }
    } catch (error) {
      console.log("Failed to get artist name:", error);
    }

    let allAlbums = [];

    // Approach 1: Try the direct albums endpoint
    try {
      const response = await fetch(
        `https://saavn.dev/api/artists/${id}/albums?limit=100`,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log("Direct albums response:", data);
        if (data.data && data.data.albums) {
          allAlbums = data.data.albums;
          console.log(`Found ${allAlbums.length} albums via direct endpoint`);
        }
      }
    } catch (error) {
      console.log("Direct albums endpoint failed:", error);
    }

    // Approach 2: If we have artist name, search for albums
    if (artistName && allAlbums.length < 5) {
      try {
        const searchResponse = await fetch(
          `https://saavn.dev/api/search/albums?query=${encodeURIComponent(
            artistName
          )}&page=1&limit=50`,
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (searchResponse.ok) {
          const searchData = await searchResponse.json();
          console.log("Search albums response:", searchData);
          if (searchData.data && searchData.data.results) {
            // Filter results to only include albums by this artist
            const filteredAlbums = searchData.data.results.filter(
              (album: any) =>
                album.artists &&
                album.artists.primary &&
                album.artists.primary.some(
                  (artist: any) =>
                    artist.id === id || artist.name === artistName
                )
            );
            console.log(`Found ${filteredAlbums.length} albums via search`);
            if (filteredAlbums.length > allAlbums.length) {
              allAlbums = filteredAlbums;
            }
          }
        }
      } catch (error) {
        console.log("Search albums failed:", error);
      }
    }

    // Approach 3: Try alternative API endpoint
    if (allAlbums.length < 5) {
      try {
        const altResponse = await fetch(
          `https://jiosavan-api-with-playlist.vercel.app/api/artists/${id}/albums`,
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (altResponse.ok) {
          const altData = await altResponse.json();
          console.log("Alternative API response:", altData);
          if (altData.data && altData.data.albums) {
            console.log(
              `Found ${altData.data.albums.length} albums via alternative API`
            );
            if (altData.data.albums.length > allAlbums.length) {
              allAlbums = altData.data.albums;
            }
          }
        }
      } catch (error) {
        console.log("Alternative API failed:", error);
      }
    }

    // Remove duplicate albums based on ID
    const uniqueAlbums = allAlbums.filter(
      (album: any, index: number, self: any[]) =>
        index === self.findIndex((a) => a.id === album.id)
    );

    console.log(
      `Final albums count: ${allAlbums.length}, Unique albums: ${uniqueAlbums.length}`
    );

    const data = {
      success: true,
      data: {
        total: uniqueAlbums.length,
        albums: uniqueAlbums,
      },
    };

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching artist albums:", error);
    return NextResponse.json(
      { error: "Failed to fetch artist albums" },
      { status: 500 }
    );
  }
}
