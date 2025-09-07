import { NextRequest, NextResponse } from "next/server";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function POST(request: NextRequest) {
  try {
    const { username } = await request.json();

    if (!username) {
      return NextResponse.json(
        { available: false, message: "Username is required" },
        { status: 400 }
      );
    }

    // Validate username format
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(username)) {
      return NextResponse.json({
        available: false,
        message: "Username must be 3-20 characters long and contain only letters, numbers, and underscores"
      });
    }

    // Check if username exists in userProfiles collection
    const profilesRef = collection(db, "userProfiles");
    const q = query(profilesRef, where("username", "==", username));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      return NextResponse.json({
        available: false,
        message: "This username is already taken"
      });
    }

    // Username is available
    return NextResponse.json({
      available: true,
      message: "Username is available"
    });

  } catch (error) {
    console.error("Error validating username:", error);
    return NextResponse.json(
      { available: false, message: "Error validating username" },
      { status: 500 }
    );
  }
}