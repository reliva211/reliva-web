import { NextRequest, NextResponse } from "next/server";

const LASTFM_API_KEY =
  process.env.LASTFM_API_KEY || process.env.NEXT_PUBLIC_LASTFM_API_KEY || "";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Album ID is required" },
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
        },
        { status: 500 }
      );
    }

    // Check if this is a Last.fm album ID
    if (!id.startsWith("lastfm-")) {
      return NextResponse.json(
        { error: "This endpoint only handles Last.fm album IDs" },
        { status: 400 }
      );
    }

    // Extract artist and album name from the Last.fm ID format
    // Format: lastfm-{mbid or artist-album-slug}
    const idPart = id.replace("lastfm-", "");

    // For now, we'll need the artist and album name to be passed as query parameters
    // since we can't reliably extract them from the generated ID
    const artistName = searchParams.get("artist");
    const albumName = searchParams.get("album");

    if (!artistName || !albumName) {
      return NextResponse.json(
        {
          error: "Artist and album names are required for Last.fm albums",
          message: "Please provide 'artist' and 'album' query parameters",
        },
        { status: 400 }
      );
    }

    console.log(
      `🎵 Fetching Last.fm album details for "${albumName}" by "${artistName}"`
    );

    try {
      // Get album info from Last.fm
      const albumInfoResponse = await fetch(
        `https://ws.audioscrobbler.com/2.0/?method=album.getinfo&artist=${encodeURIComponent(
          artistName
        )}&album=${encodeURIComponent(
          albumName
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
          // Transform Last.fm album data to match our format
          const transformedAlbum = {
            id: id,
            name: albumInfo.album.name || albumName,
            description:
              albumInfo.album.wiki?.summary?.replace(/<[^>]*>/g, "") || "",
            year: null,
            type: "album",
            playCount: parseInt(albumInfo.album.playcount) || 0,
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
            songCount: null,
            url: albumInfo.album.url || "",
            image: albumInfo.album.image
              ? albumInfo.album.image.map((img: any) => ({
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
            mbid: albumInfo.album.mbid || "",
            lastfm_playcount: parseInt(albumInfo.album.playcount) || 0,
            source: "lastfm",
          };

          // Extract year from published date if available
          if (albumInfo.album.wiki && albumInfo.album.wiki.published) {
            const publishedDate = albumInfo.album.wiki.published;
            const yearMatch = publishedDate.match(/(\d{4})/);
            if (yearMatch) {
              transformedAlbum.year = parseInt(yearMatch[1]);
            }
          }

          // Get track list if available
          if (albumInfo.album.tracks && albumInfo.album.tracks.track) {
            const tracks = Array.isArray(albumInfo.album.tracks.track)
              ? albumInfo.album.tracks.track
              : [albumInfo.album.tracks.track];

            transformedAlbum.songCount = tracks.length;

            // Transform tracks to match our song format
            transformedAlbum.songs = tracks.map(
              (track: any, index: number) => ({
                id: `lastfm-track-${
                  track.mbid ||
                  `${artistName}-${albumName}-${track.name}`
                    .replace(/[^a-zA-Z0-9]/g, "-")
                    .toLowerCase()
                }`,
                name: track.name || "Unknown Track",
                type: "song",
                year: transformedAlbum.year?.toString() || "Unknown",
                releaseDate: null,
                duration: parseInt(track.duration) || null,
                label: null,
                explicitContent: false,
                playCount: null,
                language: "Unknown",
                hasLyrics: false,
                lyricsId: null,
                url: track.url || "",
                copyright: null,
                album: {
                  id: id,
                  name: transformedAlbum.name,
                  url: transformedAlbum.url,
                },
                artists: transformedAlbum.artists,
                image: transformedAlbum.image,
                downloadUrl: [],
                // Last.fm specific fields
                mbid: track.mbid || "",
                track_number: index + 1,
                source: "lastfm",
              })
            );
          }

          console.log(
            `🎵 Last.fm album details fetched: "${
              transformedAlbum.name
            }" with ${transformedAlbum.songCount || 0} tracks`
          );

          return NextResponse.json({
            success: true,
            data: transformedAlbum,
          });
        }
      } else {
        console.log(
          `❌ Last.fm album info API failed with status: ${albumInfoResponse.status}`
        );
      }
    } catch (error) {
      console.log(`❌ Last.fm album info API error:`, error);
    }

    // If we get here, the album wasn't found
    return NextResponse.json(
      { error: "Album not found on Last.fm" },
      { status: 404 }
    );
  } catch (error) {
    console.error("Error fetching Last.fm album details:", error);
    return NextResponse.json(
      { error: "Failed to fetch album details from Last.fm" },
      { status: 500 }
    );
  }
}
