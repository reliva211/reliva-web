import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params

  if (!id) {
    return NextResponse.json({ error: "Song ID is required" }, { status: 400 })
  }

  try {
    // Get song details including download URLs from the new JioSaavn API
    const response = await fetch(`https://jiosavan-api-with-playlist.vercel.app/api/songs/${id}`)

    if (!response.ok) {
      throw new Error("Failed to fetch song details from JioSaavn API")
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching song details:", error)
    return NextResponse.json({ error: "Failed to fetch song details" }, { status: 500 })
  }
}
