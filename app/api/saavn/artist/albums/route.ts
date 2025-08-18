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

    // Try different approaches to get all albums
    let allAlbums = [];

    // Approach 0: Check if main artist endpoint has more complete album data
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
        console.log("Main artist response:", artistData);
        if (
          artistData.data &&
          artistData.data.topAlbums &&
          artistData.data.topAlbums.length > 10
        ) {
          console.log(
            "Main artist has more albums:",
            artistData.data.topAlbums.length
          );
        }
      }
    } catch (error) {
      console.log("Artist endpoint check failed:", error);
    }

    // Approach 1: Try with no pagination parameters
    try {
      const response1 = await fetch(
        `https://saavn.dev/api/artists/${id}/albums`,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response1.ok) {
        const data1 = await response1.json();
        console.log("Response 1:", data1);
        if (data1.data && data1.data.albums) {
          allAlbums = data1.data.albums;
        }
      }
    } catch (error) {
      console.log("Approach 1 failed:", error);
    }

    // Approach 2: Try with different limit parameter
    if (allAlbums.length <= 10) {
      try {
        const response2 = await fetch(
          `https://saavn.dev/api/artists/${id}/albums?limit=1000`,
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (response2.ok) {
          const data2 = await response2.json();
          console.log("Response 2:", data2);
          if (
            data2.data &&
            data2.data.albums &&
            data2.data.albums.length > allAlbums.length
          ) {
            allAlbums = data2.data.albums;
          }
        }
      } catch (error) {
        console.log("Approach 2 failed:", error);
      }
    }

    // Approach 3: Try with different endpoint structure
    if (allAlbums.length <= 10) {
      try {
        const response3 = await fetch(
          `https://saavn.dev/api/artists/${id}/albums?page=1&limit=1000&sort=year&order=desc`,
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (response3.ok) {
          const data3 = await response3.json();
          console.log("Response 3:", data3);
          if (
            data3.data &&
            data3.data.albums &&
            data3.data.albums.length > allAlbums.length
          ) {
            allAlbums = data3.data.albums;
          }
        }
      } catch (error) {
        console.log("Approach 3 failed:", error);
      }
    }

    // Approach 4: Try different endpoint - search for artist albums
    if (allAlbums.length <= 10) {
      try {
        // Get artist name first
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
            // Search for albums by artist name
            const searchResponse = await fetch(
              `https://saavn.dev/api/search/albums?query=${encodeURIComponent(
                artistData.data.name
              )}&page=1&limit=100`,
              {
                headers: {
                  "Content-Type": "application/json",
                },
              }
            );

            if (searchResponse.ok) {
              const searchData = await searchResponse.json();
              console.log("Search response:", searchData);
              if (searchData.data && searchData.data.results) {
                // Filter results to only include albums by this artist
                const filteredAlbums = searchData.data.results.filter(
                  (album: any) =>
                    album.artists &&
                    album.artists.primary &&
                    album.artists.primary.some(
                      (artist: any) => artist.id === id
                    )
                );
                console.log(
                  "Filtered albums from search:",
                  filteredAlbums.length
                );
                if (filteredAlbums.length > allAlbums.length) {
                  allAlbums = filteredAlbums;
                }
              }
            }
          }
        }
      } catch (error) {
        console.log("Approach 4 failed:", error);
      }
    }

    console.log(`Final albums count: ${allAlbums.length}`);

    const data = {
      success: true,
      data: {
        total: allAlbums.length,
        albums: allAlbums,
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
