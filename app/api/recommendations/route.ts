import { NextRequest, NextResponse } from "next/server";
import { collection, getDocs, query, where, limit, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const currentUserId = searchParams.get("userId");
    const songId = searchParams.get("songId");
    const limitParam = searchParams.get("limit");

    if (!currentUserId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    console.log(`Fetching recommendations for user: ${currentUserId}`);

    // Get current user's following list
    const currentUserRef = doc(db, "users", currentUserId);
    const currentUserSnap = await getDoc(currentUserRef);
    
    if (!currentUserSnap.exists()) {
      console.log(`User ${currentUserId} not found`);
      return NextResponse.json({ error: "Current user not found" }, { status: 404 });
    }

    const currentUserData = currentUserSnap.data();
    const followingList = currentUserData.following || [];
    
    console.log(`User ${currentUserId} is following ${followingList.length} users:`, followingList);

    // If user is not following anyone, return empty results
    if (followingList.length === 0) {
      console.log(`User ${currentUserId} is not following anyone`);
      return NextResponse.json({
        results: [],
        total: 0,
        message: "You're not following anyone yet. Follow some users to see their recommendations!"
      });
    }

    // Get only the users that the current user follows
    const followingUsersRef = collection(db, "users");
    const followingUsersSnapshot = await getDocs(followingUsersRef);
    const followingUsers = followingUsersSnapshot.docs
      .map(doc => ({ uid: doc.id, ...doc.data() }))
      .filter(user => followingList.includes(user.uid));

    console.log(`Found ${followingUsers.length} valid following users out of ${followingList.length} following IDs`);

    // Additional validation: ensure all following users are real and not test users
    const validFollowingUsers = followingUsers.filter(user => {
      const isValid = !user.uid.startsWith('test_user_') && 
                     user.uid !== 'user1' && 
                     user.uid !== 'user2' && 
                     user.uid !== 'user3' &&
                     user.uid !== 'current_user_id';
      
      if (!isValid) {
        console.log(`Filtering out test user: ${user.uid}`);
      }
      return isValid;
    });

    console.log(`After filtering test users: ${validFollowingUsers.length} valid users`);

    const recommendations = [];

    for (const user of validFollowingUsers) {
      try {
        console.log(`Fetching music collection for user: ${user.uid}`);
        
        // Fetch user's music collection
        const musicRef = collection(db, "users", user.uid, "music");
        const musicSnapshot = await getDocs(musicRef);
        const musicItems = musicSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        console.log(`User ${user.uid} has ${musicItems.length} music items`);

        if (musicItems.length > 0) {
          // Add user's music items to recommendations
          recommendations.push(...musicItems);
        }
      } catch (error) {
        console.error(`Error fetching music data for user ${user.uid}:`, error);
      }
    }

    // Apply limit if specified
    const finalResults = limitParam ? recommendations.slice(0, parseInt(limitParam)) : recommendations;

    console.log(`Returning ${finalResults.length} recommendations from ${validFollowingUsers.length} followed users`);

    return NextResponse.json({
      results: finalResults,
      total: finalResults.length,
    });
  } catch (error) {
    console.error("Error fetching recommendations:", error);
    return NextResponse.json(
      { error: "Failed to fetch recommendations" },
      { status: 500 }
    );
  }
}
