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
        }
      }
    } catch (error) {
      // Failed to get artist name
    }

    let allAlbums = [];

    // Approach 1: Try the direct albums endpoint with pagination
    try {
      let page = 0; // Start from page 0 as per JioSaavn API docs
      let hasMorePages = true;
      const maxPages = 50; // Increased limit to fetch more albums

      while (hasMorePages && page <= maxPages) {
        const response = await fetch(
          `https://saavn.dev/api/artists/${id}/albums?page=${page}&sortBy=popularity&sortOrder=desc`,
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (response.ok) {
          const data = await response.json();

          if (data.data && data.data.albums && data.data.albums.length > 0) {
            allAlbums.push(...data.data.albums);

            // Check if there are more pages - continue if we got a full page
            if (data.data.albums.length >= 20) {
              // If we got a full page, there might be more
              page++;
            } else {
              // If we got less than a full page, we've reached the end
              hasMorePages = false;
            }
          } else {
            // No albums returned, we've reached the end
            hasMorePages = false;
          }
        } else {
          hasMorePages = false;
        }
      }
    } catch (error) {
      // Direct albums endpoint failed
    }

    // Approach 1.5: Try different sorting options to get more albums
    if (allAlbums.length < 20) {
      try {
        const sortOptions = [
          { sortBy: "latest", sortOrder: "desc" },
          { sortBy: "alphabetical", sortOrder: "asc" },
          { sortBy: "alphabetical", sortOrder: "desc" },
        ];

        for (const sortOption of sortOptions) {
          let page = 0;
          let hasMorePages = true;
          const maxPages = 10; // Limit for additional sorting attempts

          while (hasMorePages && page <= maxPages) {
            const response = await fetch(
              `https://saavn.dev/api/artists/${id}/albums?page=${page}&sortBy=${sortOption.sortBy}&sortOrder=${sortOption.sortOrder}`,
              {
                headers: {
                  "Content-Type": "application/json",
                },
              }
            );

            if (response.ok) {
              const data = await response.json();

              if (
                data.data &&
                data.data.albums &&
                data.data.albums.length > 0
              ) {
                // Add new albums (avoid duplicates)
                data.data.albums.forEach((album: any) => {
                  if (
                    !allAlbums.some((existing: any) => existing.id === album.id)
                  ) {
                    allAlbums.push(album);
                  }
                });

                if (data.data.albums.length >= 20) {
                  page++;
                } else {
                  hasMorePages = false;
                }
              } else {
                hasMorePages = false;
              }
            } else {
              hasMorePages = false;
            }
          }
        }
      } catch (error) {
        // Different sorting options failed
      }
    }

    // Approach 2: If we have artist name, search for albums with pagination
    if (artistName) {
      try {
        let page = 0; // Start from page 0 as per JioSaavn API docs
        let hasMorePages = true;
        const maxPages = 20; // Increased limit for search pages

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

              // Add new albums (avoid duplicates)
              filteredAlbums.forEach((album: any) => {
                if (
                  !allAlbums.some((existing: any) => existing.id === album.id)
                ) {
                  allAlbums.push(album);
                }
              });

              // Check if there are more pages - continue if we got a full page
              if (searchData.data.results.length >= 20) {
                // If we got a full page, there might be more
                page++;
              } else {
                // If we got less than a full page, we've reached the end
                hasMorePages = false;
              }
            } else {
              hasMorePages = false;
            }
          } else {
            hasMorePages = false;
          }
        }
      } catch (error) {
        // Search albums failed
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
          if (altData.data && altData.data.albums) {
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
        // Alternative API failed
      }
    }

    // Approach 4: Try Saavn.me API as another fallback
    if (allAlbums.length < 50) {
      try {
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

          if (saavnMeData.data && saavnMeData.data.topAlbums) {
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
        // Saavn.me API failed
      }
    }

    // Remove duplicate albums based on ID
    const uniqueAlbums = allAlbums.filter(
      (album: any, index: number, self: any[]) =>
        index === self.findIndex((a) => a.id === album.id)
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
    return NextResponse.json(
      { error: "Failed to fetch artist albums" },
      { status: 500 }
    );
  }
}
