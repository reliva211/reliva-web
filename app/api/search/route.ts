import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get("q")
  const page = searchParams.get("page") || "1"
  const limit = searchParams.get("limit") || "40"

  if (!query) {
    return NextResponse.json({ error: "Query parameter is required" }, { status: 400 })
  }

  try {
    // Using the new JioSaavn API endpoint with pagination
    const response = await fetch(
      `https://jiosavan-api-with-playlist.vercel.app/api/search/songs?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`,
    )

    if (!response.ok) {
      throw new Error("Failed to fetch from JioSaavn API")
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching from JioSaavn API:", error)
    return NextResponse.json({ error: "Failed to fetch music data" }, { status: 500 })
  }
}
