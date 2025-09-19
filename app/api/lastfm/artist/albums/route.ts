import { NextRequest, NextResponse } from "next/server";

const LASTFM_API_KEY =
  process.env.LASTFM_API_KEY || process.env.NEXT_PUBLIC_LASTFM_API_KEY || "";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const artistName = searchParams.get("artist");

    if (!artistName) {
      return NextResponse.json(
        { error: "Artist name is required" },
        { status: 400 }
      );
    }

    if (!LASTFM_API_KEY) {
      console.log(
        "⚠️ Last.fm API key not configured. Get one at: https://www.last.fm/api/account/create"
      );
      return NextResponse.json(
        {
          error:
            "Last.fm API key not configured. Please add LASTFM_API_KEY to your environment variables. Get API key at: https://www.last.fm/api/account/create",
          data: { total: 0, albums: [] },
        },
        { status: 500 }
      );
    }

    console.log(`🎵 Fetching albums for artist "${artistName}" from Last.fm`);

    let allAlbums = [];

    // Approach 1: Get artist's top albums from Last.fm
    try {
      const topAlbumsResponse = await fetch(
        `https://ws.audioscrobbler.com/2.0/?method=artist.gettopalbums&artist=${encodeURIComponent(
          artistName
        )}&api_key=${LASTFM_API_KEY}&format=json&limit=200`,
        {
          headers: {
            "User-Agent": "Reliva Music App/1.0",
          },
        }
      );

      if (topAlbumsResponse.ok) {
        const topAlbumsData = await topAlbumsResponse.json();

        if (topAlbumsData.topalbums && topAlbumsData.topalbums.album) {
          const albums = Array.isArray(topAlbumsData.topalbums.album)
            ? topAlbumsData.topalbums.album
            : [topAlbumsData.topalbums.album];

          console.log(`🎵 Found ${albums.length} top albums from Last.fm`);

          // Transform Last.fm album data to match our format
          const transformedAlbums = albums.map((album: any, index: number) => ({
            id: `lastfm-${
              album.mbid ||
              `${artistName}-${album.name}`
                .replace(/[^a-zA-Z0-9]/g, "-")
                .toLowerCase()
            }`,
            name: album.name || "Unknown Album",
            description: "",
            year: null, // Last.fm top albums don't include year, we'll try to get it separately
            type: "album",
            playCount: parseInt(album.playcount) || 0,
            language: "Unknown",
            explicitContent: false,
            artists: {
              primary: [
                {
                  id: `lastfm-${artistName
                    .replace(/[^a-zA-Z0-9]/g, "-")
                    .toLowerCase()}`,
                  name: artistName,
                  role: "primary",
                  type: "artist",
                  image: [],
                  url: "",
                },
              ],
              featured: [],
              all: [
                {
                  id: `lastfm-${artistName
                    .replace(/[^a-zA-Z0-9]/g, "-")
                    .toLowerCase()}`,
                  name: artistName,
                  role: "primary",
                  type: "artist",
                  image: [],
                  url: "",
                },
              ],
            },
            songCount: null, // We'll try to get this from album.getInfo
            url: album.url || "",
            image: album.image
              ? album.image.map((img: any) => ({
                  quality:
                    img.size === "large"
                      ? "500x500"
                      : img.size === "medium"
                      ? "300x300"
                      : "150x150",
                  url: img["#text"] || "",
                }))
              : [],
            songs: null,
            // Last.fm specific fields
            mbid: album.mbid || "",
            lastfm_playcount: parseInt(album.playcount) || 0,
            lastfm_rank: index + 1,
          }));

          allAlbums.push(...transformedAlbums);
        }
      } else {
        console.log(
          `❌ Last.fm top albums API failed with status: ${topAlbumsResponse.status}`
        );
      }
    } catch (error) {
      console.log(`❌ Last.fm top albums API error:`, error);
    }

    // Approach 2: Try to get additional album details (year, song count) for the first 20 albums
    if (allAlbums.length > 0) {
      console.log(
        `🎵 Fetching detailed info for first ${Math.min(
          20,
          allAlbums.length
        )} albums`
      );

      for (let i = 0; i < Math.min(20, allAlbums.length); i++) {
        const album = allAlbums[i];
        try {
          const albumInfoResponse = await fetch(
            `https://ws.audioscrobbler.com/2.0/?method=album.getinfo&artist=${encodeURIComponent(
              artistName
            )}&album=${encodeURIComponent(
              album.name
            )}&api_key=${LASTFM_API_KEY}&format=json`,
            {
              headers: {
                "User-Agent": "Reliva Music App/1.0",
              },
            }
          );

          if (albumInfoResponse.ok) {
            const albumInfo = await albumInfoResponse.json();

            if (albumInfo.album) {
              // Update album with detailed info
              if (albumInfo.album.wiki && albumInfo.album.wiki.published) {
                // Extract year from published date
                const publishedDate = albumInfo.album.wiki.published;
                const yearMatch = publishedDate.match(/(\d{4})/);
                if (yearMatch) {
                  album.year = parseInt(yearMatch[1]);
                }
              }

              // Get track count
              if (albumInfo.album.tracks && albumInfo.album.tracks.track) {
                const tracks = Array.isArray(albumInfo.album.tracks.track)
                  ? albumInfo.album.tracks.track
                  : [albumInfo.album.tracks.track];
                album.songCount = tracks.length;
              }

              // Update description
              if (albumInfo.album.wiki && albumInfo.album.wiki.summary) {
                album.description = albumInfo.album.wiki.summary.replace(
                  /<[^>]*>/g,
                  ""
                ); // Remove HTML tags
              }
            }
          }
        } catch (error) {
          // Skip individual album info errors
          console.log(
            `❌ Failed to get info for album "${album.name}":`,
            error
          );
        }

        // Add small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    // Remove duplicates based on album name (case-insensitive)
    const uniqueAlbums = allAlbums.filter(
      (album: any, index: number, self: any[]) =>
        index ===
        self.findIndex((a) => a.name.toLowerCase() === album.name.toLowerCase())
    );

    console.log(`🎯 Last.fm Results for "${artistName}":`);
    console.log(`📀 Total albums found: ${allAlbums.length}`);
    console.log(`📀 Unique albums after deduplication: ${uniqueAlbums.length}`);

    const data = {
      success: true,
      data: {
        total: uniqueAlbums.length,
        albums: uniqueAlbums,
        source: "lastfm",
      },
    };

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching Last.fm artist albums:", error);
    return NextResponse.json(
      { error: "Failed to fetch artist albums from Last.fm" },
      { status: 500 }
    );
  }
}
