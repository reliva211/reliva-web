import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params

  if (!id) {
    return NextResponse.json({ error: "Album ID is required" }, { status: 400 })
  }

  try {
    // Get album details and tracks from JioSaavn API
    const response = await fetch(`https://jiosavan-api-with-playlist.vercel.app/api/albums/${id}`)

    if (!response.ok) {
      throw new Error("Failed to fetch album details from JioSaavn API")
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching album details:", error)
    return NextResponse.json({ error: "Failed to fetch album details" }, { status: 500 })
  }
}
