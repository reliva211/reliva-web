import { NextResponse } from "next/server"

// Load credentials from environment variables (NEVER hardcode secrets)
const MUSICAPI_CLIENT_ID = process.env.MUSICAPI_CLIENT_ID!
const MUSICAPI_CLIENT_SECRET = process.env.MUSICAPI_CLIENT_SECRET!

// Utility: Generate Basic Auth header
function getBasicAuthHeader(): string {
  const credentials = `${MUSICAPI_CLIENT_ID}:${MUSICAPI_CLIENT_SECRET}`
  const base64 = Buffer.from(credentials).toString("base64")
  return `Basic ${base64}`
}

// Search tracks on Spotify via MusicAPI
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get("query")
  const type = searchParams.get("type") || "track"
  const limit = searchParams.get("limit") || "10"

  if (!query) {
    return NextResponse.json({ error: "Query parameter is required" }, { status: 400 })
  }

  try {
    const response = await fetch(
      `https://api.musicapi.com/spotify/search?q=${encodeURIComponent(query)}&type=${type}&limit=${limit}`,
      {
        headers: {
          Authorization: getBasicAuthHeader(),
          "Content-Type": "application/json",
        },
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`MusicAPI search failed: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error searching via MusicAPI:", error)
    return NextResponse.json({ error: "Failed to search music" }, { status: 500 })
  }
}

// Perform playlist-related actions
export async function POST(request: Request) {
  try {
    const { userId, action, playlistId, trackId } = await request.json()

    if (!userId || !action) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    let endpoint = ""
    let method = "GET"
    let body = null

    switch (action) {
      case "getUserPlaylists":
        endpoint = `https://api.musicapi.com/spotify/users/${userId}/playlists`
        break
      case "getPlaylistTracks":
        if (!playlistId) {
          return NextResponse.json({ error: "Playlist ID is required" }, { status: 400 })
        }
        endpoint = `https://api.musicapi.com/spotify/playlists/${playlistId}/tracks`
        break
      case "addToPlaylist":
        if (!playlistId || !trackId) {
          return NextResponse.json({ error: "Playlist ID and Track ID are required" }, { status: 400 })
        }
        endpoint = `https://api.musicapi.com/spotify/playlists/${playlistId}/tracks`
        method = "POST"
        body = JSON.stringify({ uris: [`spotify:track:${trackId}`] })
        break
      case "removeFromPlaylist":
        if (!playlistId || !trackId) {
          return NextResponse.json({ error: "Playlist ID and Track ID are required" }, { status: 400 })
        }
        endpoint = `https://api.musicapi.com/spotify/playlists/${playlistId}/tracks`
        method = "DELETE"
        body = JSON.stringify({ tracks: [{ uri: `spotify:track:${trackId}` }] })
        break
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    const response = await fetch(endpoint, {
      method,
      headers: {
        Authorization: getBasicAuthHeader(),
        "Content-Type": "application/json",
      },
      ...(body && { body }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`MusicAPI operation failed: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error with MusicAPI operation:", error)
    return NextResponse.json({ error: "Failed to perform operation" }, { status: 500 })
  }
}
