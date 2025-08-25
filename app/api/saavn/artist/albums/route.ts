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

    console.log(`🎵 Fetching ALL albums for artist ID: ${id}`);

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
          console.log(`🎤 Artist name: ${artistName}`);
        }
      }
    } catch (error) {
      console.log("❌ Failed to get artist name:", error);
    }

    let allAlbums = [];

    // Approach 1: Try the direct albums endpoint with pagination
    try {
      console.log("🔄 Attempting direct albums endpoint with pagination...");
      let page = 1;
      let hasMorePages = true;
      const maxPages = 10; // Safety limit to prevent infinite loops

      while (hasMorePages && page <= maxPages) {
        const response = await fetch(
          `https://saavn.dev/api/artists/${id}/albums?page=${page}`,
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          console.log(`📄 Page ${page} response:`, data);

          if (data.data && data.data.albums && data.data.albums.length > 0) {
            allAlbums.push(...data.data.albums);
            console.log(
              `📀 Added ${data.data.albums.length} albums from page ${page}`
            );

            // Check if there are more pages
            if (data.data.albums.length < 20) {
              // Assuming 20 is the default page size
              hasMorePages = false;
            }
            page++;
          } else {
            hasMorePages = false;
          }
        } else {
          console.log(`❌ Page ${page} failed with status:`, response.status);
          hasMorePages = false;
        }
      }

      console.log(`📊 Total albums from direct endpoint: ${allAlbums.length}`);
    } catch (error) {
      console.log("❌ Direct albums endpoint failed:", error);
    }

    // Approach 2: If we have artist name, search for albums with pagination
    if (artistName) {
      try {
        console.log(
          "🔍 Searching for albums by artist name with pagination..."
        );
        let page = 1;
        let hasMorePages = true;
        const maxPages = 5; // Limit search pages

        while (hasMorePages && page <= maxPages) {
          const searchResponse = await fetch(
            `https://saavn.dev/api/search/albums?query=${encodeURIComponent(
              artistName
            )}&page=${page}`,
            {
              headers: {
                "Content-Type": "application/json",
              },
            }
          );

          if (searchResponse.ok) {
            const searchData = await searchResponse.json();
            console.log(`🔍 Search page ${page} response:`, searchData);

            if (
              searchData.data &&
              searchData.data.results &&
              searchData.data.results.length > 0
            ) {
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

              console.log(
                `🎯 Found ${filteredAlbums.length} matching albums on search page ${page}`
              );

              // Add new albums (avoid duplicates)
              filteredAlbums.forEach((album: any) => {
                if (
                  !allAlbums.some((existing: any) => existing.id === album.id)
                ) {
                  allAlbums.push(album);
                }
              });

              if (searchData.data.results.length < 20) {
                hasMorePages = false;
              }
              page++;
            } else {
              hasMorePages = false;
            }
          } else {
            console.log(
              `❌ Search page ${page} failed with status:`,
              searchResponse.status
            );
            hasMorePages = false;
          }
        }
      } catch (error) {
        console.log("❌ Search albums failed:", error);
      }
    }

    // Approach 3: Try alternative API endpoint
    if (allAlbums.length < 5) {
      try {
        console.log("🔄 Trying alternative API endpoint...");
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
          console.log("🔄 Alternative API response:", altData);
          if (altData.data && altData.data.albums) {
            console.log(
              `📀 Found ${altData.data.albums.length} albums via alternative API`
            );

            // Add new albums (avoid duplicates)
            altData.data.albums.forEach((album: any) => {
              if (
                !allAlbums.some((existing: any) => existing.id === album.id)
              ) {
                allAlbums.push(album);
              }
            });
          }
        }
      } catch (error) {
        console.log("❌ Alternative API failed:", error);
      }
    }

    // Approach 4: Try Saavn.me API as another fallback
    if (allAlbums.length < 10) {
      try {
        console.log("🔄 Trying Saavn.me API...");
        const saavnMeResponse = await fetch(
          `https://saavn.me/artists?id=${id}`,
          {
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            },
          }
        );

        if (saavnMeResponse.ok) {
          const saavnMeData = await saavnMeResponse.json();
          console.log("🔄 Saavn.me API response:", saavnMeData);

          if (saavnMeData.data && saavnMeData.data.topAlbums) {
            console.log(
              `📀 Found ${saavnMeData.data.topAlbums.length} albums via Saavn.me`
            );

            // Add new albums (avoid duplicates)
            saavnMeData.data.topAlbums.forEach((album: any) => {
              if (
                !allAlbums.some((existing: any) => existing.id === album.id)
              ) {
                allAlbums.push(album);
              }
            });
          }
        }
      } catch (error) {
        console.log("❌ Saavn.me API failed:", error);
      }
    }

    // Remove duplicate albums based on ID
    const uniqueAlbums = allAlbums.filter(
      (album: any, index: number, self: any[]) =>
        index === self.findIndex((a) => a.id === album.id)
    );

    console.log(
      `🎉 Final results: ${allAlbums.length} total albums, ${uniqueAlbums.length} unique albums`
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
    console.error("❌ Error fetching artist albums:", error);
    return NextResponse.json(
      { error: "Failed to fetch artist albums" },
      { status: 500 }
    );
  }
}
