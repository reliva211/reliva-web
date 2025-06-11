import { NextResponse } from "next/server"

// MusicAPI credentials
const MUSICAPI_CLIENT_ID = "43c337fc-25f7-4e0e-a5eb-698612067682"
const MUSICAPI_CLIENT_SECRET = "4e6190bb-de37-4be6-9adc-523e84c20b84"

// Token cache
let accessToken: string | null = null
let tokenExpiry = 0

// Get access token from MusicAPI
async function getMusicAPIToken() {
  // Return cached token if it's still valid
  if (accessToken && tokenExpiry > Date.now()) {
    return accessToken
  }

  try {
    const response = await fetch("https://api.musicapi.com/auth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: MUSICAPI_CLIENT_ID,
        client_secret: MUSICAPI_CLIENT_SECRET,
        grant_type: "client_credentials",
      }),
    })

    if (!response.ok) {
      throw new Error(`Failed to get token: ${response.status}`)
    }

    const data = await response.json()
    accessToken = data.access_token
    // Set expiry time (usually 1 hour, subtract 5 minutes for safety)
    tokenExpiry = Date.now() + (data.expires_in - 300) * 1000
    return accessToken
  } catch (error) {
    console.error("Error getting MusicAPI token:", error)
    throw error
  }
}

// Get track preview URL from Spotify via MusicAPI
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const trackId = searchParams.get("trackId")

  if (!trackId) {
    return NextResponse.json({ error: "Track ID is required" }, { status: 400 })
  }

  try {
    const token = await getMusicAPIToken()

    const response = await fetch(`https://api.musicapi.com/spotify/tracks/${trackId}?fields=preview_url,name,artists`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`MusicAPI track preview failed: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error getting track preview:", error)
    return NextResponse.json({ error: "Failed to get track preview" }, { status: 500 })
  }
}
