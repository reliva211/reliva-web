import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const songId = searchParams.get("songId")
  const language = searchParams.get("language") || "hindi"
  const limit = searchParams.get("limit") || "20"

  try {
    let response

    if (songId) {
      // Get recommendations based on a specific song
      response = await fetch(
        `https://jiosavan-api-with-playlist.vercel.app/api/songs/${songId}/suggestions?limit=${limit}`,
      )
    } else {
      // Get trending/popular songs as general recommendations
      response = await fetch(
        `https://jiosavan-api-with-playlist.vercel.app/api/search/songs?query=trending ${language}&page=1&limit=${limit}`,
      )
    }

    if (!response.ok) {
      throw new Error("Failed to fetch recommendations")
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching recommendations:", error)
    return NextResponse.json({ error: "Failed to fetch recommendations" }, { status: 500 })
  }
}
