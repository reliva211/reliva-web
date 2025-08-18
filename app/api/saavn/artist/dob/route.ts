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

    console.log(`Fetching DOB for artist ID: ${id}`);

    // Fetch artist details from Saavn API
    const response = await fetch(`https://saavn.dev/api/artists?id=${id}`, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Saavn API responded with status: ${response.status}`);
    }

    const data = await response.json();

    // Extract DOB and related information
    const artistData = data.data;
    const dobInfo = {
      dob: artistData?.dob,
      name: artistData?.name,
      id: artistData?.id,
      isValid: artistData?.dob
        ? !isNaN(new Date(artistData.dob).getTime())
        : false,
    };

    console.log(
      `DOB for ${artistData?.name}: ${artistData?.dob} (Valid: ${dobInfo.isValid})`
    );

    return NextResponse.json({
      success: true,
      data: dobInfo,
    });
  } catch (error) {
    console.error("Error fetching artist DOB:", error);
    return NextResponse.json(
      { error: "Failed to fetch artist DOB" },
      { status: 500 }
    );
  }
}
