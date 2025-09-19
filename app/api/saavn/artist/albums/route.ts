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
    console.log(`🎤 Fetching albums for artist ID: ${id}`);

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
          console.log(`🎤 Artist found: ${artistName}`);
        }
      } else {
        console.log(
          `❌ Artist API failed with status: ${artistResponse.status}`
        );
      }
    } catch (error) {
      console.log(`❌ Failed to get artist name:`, error);
    }

    let allAlbums = [];

    // Approach 1: Try the direct albums endpoint with pagination
    console.log(
      `📀 Approach 1: Trying direct albums endpoint for ${artistName || id}`
    );
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

        console.log(`📀 Page ${page} response status: ${response.status}`);

        if (response.ok) {
          const data = await response.json();

          if (data.data && data.data.albums && data.data.albums.length > 0) {
            console.log(
              `📀 Page ${page}: Found ${data.data.albums.length} albums`
            );
            allAlbums.push(...data.data.albums);

            // Check if there are more pages - be more aggressive for international artists
            if (data.data.albums.length >= 5) {
              // Continue if we got 5 or more albums (very low threshold to be aggressive)
              page++;
              console.log(
                `📀 Page ${page - 1}: Got ${
                  data.data.albums.length
                } albums, trying next page`
              );
            } else {
              // If we got very few albums, we've likely reached the end
              console.log(
                `📀 Page ${page}: Reached end (${data.data.albums.length} < 5 albums)`
              );
              hasMorePages = false;
            }
          } else {
            // No albums returned, we've reached the end
            console.log(`📀 Page ${page}: No albums found, ending pagination`);
            hasMorePages = false;
          }
        } else {
          console.log(
            `📀 Page ${page}: API failed with status ${response.status}`
          );
          hasMorePages = false;
        }
      }
      console.log(
        `📀 Approach 1 completed: Total ${allAlbums.length} albums found`
      );
    } catch (error) {
      console.log(`❌ Approach 1 failed:`, error);
    }

    // Approach 1.5: Try different sorting options to get more albums
    if (allAlbums.length < 15) {
      console.log(
        `📀 Approach 1.5: Only ${allAlbums.length} albums found, trying different sorting options`
      );
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
      console.log(
        `🔍 Approach 2: Searching albums for artist name "${artistName}"`
      );
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
    if (allAlbums.length < 15) {
      console.log(
        `📀 Approach 3: Only ${allAlbums.length} albums found, trying alternative API`
      );
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
            console.log(
              `📀 Alternative API found ${altData.data.albums.length} albums`
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
        } else {
          console.log(
            `📀 Alternative API failed with status: ${altResponse.status}`
          );
        }
      } catch (error) {
        console.log(`❌ Alternative API error:`, error);
      }
    }

    // Approach 4: Try Saavn.me API as another fallback
    if (allAlbums.length < 20) {
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

    // Approach 5: For international artists, try additional search variations
    if (artistName && allAlbums.length < 20) {
      console.log(
        `🔍 Approach 5: Enhanced search for international artist "${artistName}"`
      );
      try {
        // Try searching with different variations for international artists
        const searchVariations = [
          artistName,
          artistName.replace(/\s+/g, ""), // Remove spaces
          artistName.toLowerCase(),
          artistName.toUpperCase(),
          // Add more variations for common international artist name patterns
          artistName.replace(/\./g, ""), // Remove dots (e.g., "A.R. Rahman" -> "AR Rahman")
          artistName.replace(/\s+/g, " "), // Normalize spaces
        ];

        for (const searchTerm of searchVariations) {
          if (allAlbums.length >= 50) break; // Stop if we have enough albums

          console.log(`🔍 Searching with variation: "${searchTerm}"`);
          const searchResponse = await fetch(
            `https://saavn.dev/api/search/albums?query=${encodeURIComponent(
              searchTerm
            )}&page=0&limit=50`,
            {
              headers: {
                "Content-Type": "application/json",
              },
            }
          );

          if (searchResponse.ok) {
            const searchData = await searchResponse.json();
            console.log(
              `🔍 Search for "${searchTerm}" returned ${
                searchData.data?.results?.length || 0
              } results`
            );

            if (
              searchData.data &&
              searchData.data.results &&
              searchData.data.results.length > 0
            ) {
              // Filter results to only include albums by this artist (more lenient matching for international artists)
              const filteredAlbums = searchData.data.results.filter(
                (album: any) => {
                  if (!album.artists || !album.artists.primary) return false;

                  return album.artists.primary.some((artist: any) => {
                    const artistNameLower = artistName.toLowerCase();
                    const searchArtistLower = artist.name.toLowerCase();

                    const matches =
                      artist.id === id ||
                      searchArtistLower === artistNameLower ||
                      searchArtistLower.includes(artistNameLower) ||
                      artistNameLower.includes(searchArtistLower);

                    return matches;
                  });
                }
              );

              console.log(
                `🔍 Filtered ${filteredAlbums.length} albums for "${searchTerm}"`
              );

              // Add new albums (avoid duplicates)
              filteredAlbums.forEach((album: any) => {
                if (
                  !allAlbums.some((existing: any) => existing.id === album.id)
                ) {
                  allAlbums.push(album);
                  console.log(
                    `📀 Added album: "${album.name}" (${
                      album.year || "Unknown year"
                    })`
                  );
                }
              });
            }
          }
        }
      } catch (error) {
        // Additional search variations failed
      }
    }

    // Approach 6: Broad search for international artists with relaxed filtering
    if (artistName && allAlbums.length < 15) {
      console.log(
        `🌐 Approach 6: Broad search for "${artistName}" with relaxed filtering`
      );
      try {
        const broadSearchResponse = await fetch(
          `https://saavn.dev/api/search/albums?query=${encodeURIComponent(
            artistName
          )}&page=0&limit=100`,
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (broadSearchResponse.ok) {
          const broadSearchData = await broadSearchResponse.json();
          console.log(
            `🌐 Broad search returned ${
              broadSearchData.data?.results?.length || 0
            } total results`
          );

          if (
            broadSearchData.data &&
            broadSearchData.data.results &&
            broadSearchData.data.results.length > 0
          ) {
            // More relaxed filtering - include albums that might be related
            const relaxedFilteredAlbums = broadSearchData.data.results.filter(
              (album: any) => {
                if (!album.artists || !album.artists.primary) return false;

                // Check if any artist in the album matches (more lenient)
                return album.artists.primary.some((artist: any) => {
                  const artistNameLower = artistName.toLowerCase();
                  const searchArtistLower = artist.name.toLowerCase();

                  // More relaxed matching criteria
                  return (
                    artist.id === id ||
                    searchArtistLower === artistNameLower ||
                    searchArtistLower.includes(artistNameLower) ||
                    artistNameLower.includes(searchArtistLower) ||
                    // Additional fuzzy matching for international artists
                    (artistNameLower.length > 3 &&
                      searchArtistLower.includes(
                        artistNameLower.substring(0, 4)
                      )) ||
                    (searchArtistLower.length > 3 &&
                      artistNameLower.includes(
                        searchArtistLower.substring(0, 4)
                      ))
                  );
                });
              }
            );

            console.log(
              `🌐 Broad search filtered to ${relaxedFilteredAlbums.length} potentially relevant albums`
            );

            // Add new albums (avoid duplicates)
            relaxedFilteredAlbums.forEach((album: any) => {
              if (
                !allAlbums.some((existing: any) => existing.id === album.id)
              ) {
                allAlbums.push(album);
                console.log(
                  `📀 Broad search added: "${album.name}" (${
                    album.year || "Unknown year"
                  })`
                );
              }
            });
          }
        }
      } catch (error) {
        console.log(`❌ Broad search failed:`, error);
      }
    }

    // Remove duplicate albums based on ID
    const uniqueAlbums = allAlbums.filter(
      (album: any, index: number, self: any[]) =>
        index === self.findIndex((a) => a.id === album.id)
    );

    // Check if this looks like an international artist and we have very few albums
    const looksLikeInternationalArtist =
      artistName &&
      /^[A-Za-z\s\-\.]+$/.test(artistName) && // Only Latin characters
      !artistName.match(/[^\x00-\x7F]/) && // No non-ASCII characters
      artistName.length > 3;

    console.log(`🎯 Final Results for ${artistName || id}:`);
    console.log(`📀 Total albums found: ${allAlbums.length}`);
    console.log(`📀 Unique albums after deduplication: ${uniqueAlbums.length}`);
    console.log(
      `🌐 Looks like international artist: ${looksLikeInternationalArtist}`
    );

    if (looksLikeInternationalArtist && uniqueAlbums.length < 15) {
      console.log(
        `⚠️ Warning: International artist "${artistName}" only has ${uniqueAlbums.length} albums. This might be due to limited Saavn data for international artists.`
      );
    }

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
