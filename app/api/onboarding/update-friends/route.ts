import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export async function POST(request: NextRequest) {
  try {
    const { firebaseUserId } = await request.json();

    if (!firebaseUserId) {
      return NextResponse.json(
        { error: "Firebase User ID required" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const mongoDb = client.db("Onboarding");
    const collection = mongoDb.collection("userPreferences");

    // Fetch current friends from Firestore
    let friendsList: string[] = [];
    try {
      const userDoc = await getDoc(doc(db, "users", firebaseUserId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        friendsList = userData.following || [];
      }
    } catch (error) {
      console.error("Error fetching friends from Firestore:", error);
      return NextResponse.json(
        { error: "Failed to fetch friends from Firestore" },
        { status: 500 }
      );
    }

    // Update the friends list in MongoDB
    const result = await collection.updateOne(
      { _id: firebaseUserId },
      {
        $set: {
          friends: friendsList,
        },
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "User preferences not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      friendsCount: friendsList.length,
    });
  } catch (error) {
    console.error("Error updating friends:", error);
    return NextResponse.json(
      { error: "Failed to update friends" },
      { status: 500 }
    );
  }
}
