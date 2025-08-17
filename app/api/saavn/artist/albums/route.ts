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

    // Fetch artist albums from Saavn API
    const response = await fetch(`https://saavn.dev/api/artists/${id}/albums`, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Saavn API responded with status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching artist albums:", error);
    return NextResponse.json(
      { error: "Failed to fetch artist albums" },
      { status: 500 }
    );
  }
}
