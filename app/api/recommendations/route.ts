import { NextRequest, NextResponse } from "next/server";
import { collection, getDocs, query, where, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const currentUserId = searchParams.get("userId");
    const category = searchParams.get("category") || "movies";
    const source = searchParams.get("source") || "all";

    if (!currentUserId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // Get all users (in a real app, you'd filter by friends)
    const usersRef = collection(db, "users");
    const usersSnapshot = await getDocs(usersRef);
    const allUsers = usersSnapshot.docs
      .map(doc => ({ uid: doc.id, ...doc.data() }))
      .filter(user => user.uid !== currentUserId);

    const recommendations = [];

    for (const user of allUsers) {
      try {
        // Fetch user's items based on category
        const itemsRef = collection(db, "users", user.uid, category);
        const itemsSnapshot = await getDocs(itemsRef);
        const items = itemsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        if (items.length > 0) {
          // Try to get user name from various possible fields
          let displayName = user.displayName || user.name || user.username || user.email?.split('@')[0] || `User ${user.uid.slice(0, 8)}`;
          
          recommendations.push({
            user: {
              uid: user.uid,
              displayName: displayName,
              photoURL: user.photoURL || user.avatar || user.profilePicture,
              email: user.email,
            },
            items,
            itemCount: items.length,
          });
        }
      } catch (error) {
        console.error(`Error fetching data for user ${user.uid}:`, error);
      }
    }

    return NextResponse.json({
      recommendations,
      total: recommendations.length,
    });
  } catch (error) {
    console.error("Error fetching recommendations:", error);
    return NextResponse.json(
      { error: "Failed to fetch recommendations" },
      { status: 500 }
    );
  }
}
