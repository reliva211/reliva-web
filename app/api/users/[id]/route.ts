import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { identifyIdType } from "@/lib/user-mapping";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "User ID is required" },
        { status: 400 }
      );
    }

    // Determine if the ID is Firebase UID or MongoDB authorId
    const idType = identifyIdType(userId);
    let firebaseUID = userId;

    // If it's a MongoDB authorId, map it to Firebase UID
    if (idType === "mongodb") {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("authorId", "==", userId));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        firebaseUID = userDoc.id; // The document ID is the Firebase UID
      } else {
        // If no mapping found, return default user object
        return NextResponse.json({
          success: true,
          user: {
            _id: userId,
            username: "Unknown User",
            displayName: "Unknown User",
            avatarUrl: null,
            email: null,
            bio: null,
            createdAt: null,
            updatedAt: null,
          },
        });
      }
    }

    // Try to get user profile from Firebase using the correct UID
    const userDocRef = doc(db, "userProfiles", firebaseUID);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      const userData = userDocSnap.data();
      return NextResponse.json({
        success: true,
        user: {
          _id: userId, // Return the original ID that was requested
          username: userData.username || userData.displayName || "Unknown User",
          displayName:
            userData.displayName || userData.username || "Unknown User",
          avatarUrl: userData.avatarUrl || null,
          email: userData.email || null,
          bio: userData.bio || null,
          createdAt: userData.createdAt || null,
          updatedAt: userData.updatedAt || null,
        },
      });
    } else {
      // If no Firebase profile exists, return a default user object
      return NextResponse.json({
        success: true,
        user: {
          _id: userId,
          username: "Unknown User",
          displayName: "Unknown User",
          avatarUrl: null,
          email: null,
          bio: null,
          createdAt: null,
          updatedAt: null,
        },
      });
    }
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch user profile" },
      { status: 500 }
    );
  }
}
