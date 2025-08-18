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

    console.log(`Fetching similar artists for ID: ${id}`);

    // Fetch similar artists from Saavn API
    const response = await fetch(`https://saavn.dev/api/artists?id=${id}`, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Saavn API responded with status: ${response.status}`);
    }

    const data = await response.json();

    // Debug: Log the full API response structure
    console.log("Full API response structure:", {
      success: data.success,
      hasData: !!data.data,
      dataKeys: data.data ? Object.keys(data.data) : [],
      similarArtistsKey: data.data?.similarArtists,
      similarArtistsType: typeof data.data?.similarArtists,
      similarArtistsLength: data.data?.similarArtists?.length,
    });

    // Extract only the similar artists data
    const similarArtists = data.data?.similarArtists || [];

    console.log(
      `Found ${similarArtists.length} similar artists for ${data.data?.name}`
    );
    console.log("Similar artists data:", similarArtists);

    // If no similar artists found, return empty array instead of test data
    if (similarArtists.length === 0) {
      console.log("No similar artists found in API response");
    }

    return NextResponse.json({
      success: true,
      data: similarArtists,
    });
  } catch (error) {
    console.error("Error fetching similar artists:", error);
    return NextResponse.json(
      { error: "Failed to fetch similar artists" },
      { status: 500 }
    );
  }
}
