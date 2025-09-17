import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { onboardingOptions } from "@/lib/onboarding-options";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export async function POST(request: NextRequest) {
  try {
    const { firebaseUserId, preferences } = await request.json();

    if (!firebaseUserId || !preferences) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const mongoDb = client.db("Onboarding");
    const collection = mongoDb.collection("userPreferences");

    // Fetch friends from existing Firestore system
    let friendsList: string[] = [];
    try {
      const userDoc = await getDoc(doc(db, "users", firebaseUserId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        friendsList = userData.following || [];
      }
    } catch (error) {
      console.error("Error fetching friends from Firestore:", error);
      // Continue with empty friends array if Firestore fetch fails
    }

    // Convert selections to the format your friend needs
    const formattedPreferences = {
      movies: {},
      series: {},
      songs: {},
      books: {},
      friends: friendsList, // Fetch from existing following system
    };

    // Process each category
    Object.keys(preferences).forEach((category) => {
      if (onboardingOptions[category as keyof typeof onboardingOptions]) {
        preferences[category].forEach((itemId: string) => {
          const item = onboardingOptions[
            category as keyof typeof onboardingOptions
          ].find((opt: any) => opt.id === itemId);
          if (item) {
            (formattedPreferences as any)[category][item.title] = item.genres;
          }
        });
      }
    });

    // Check if user already exists
    const existingUser = await collection.findOne({ _id: firebaseUserId });

    if (existingUser) {
      // Update existing user - merge preferences directly
      await collection.updateOne(
        { _id: firebaseUserId },
        {
          $set: {
            ...formattedPreferences,
          },
        }
      );
    } else {
      // Create new user - store preferences directly
      await collection.insertOne({
        _id: firebaseUserId, // Use Firebase UID as primary key
        ...formattedPreferences, // Spread preferences directly
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving preferences:", error);
    return NextResponse.json(
      { error: "Failed to save preferences" },
      { status: 500 }
    );
  }
}
