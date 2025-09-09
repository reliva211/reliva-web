import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, collection, addDoc, serverTimestamp } from "firebase/firestore";

export async function POST(request: NextRequest) {
  try {
    const { currentUserId, targetUserId, action } = await request.json();

    if (!currentUserId || !targetUserId || !action) {
      return NextResponse.json(
        { success: false, error: "Missing required parameters" },
        { status: 400 }
      );
    }

    if (action !== "follow" && action !== "unfollow") {
      return NextResponse.json(
        { success: false, error: "Invalid action. Must be 'follow' or 'unfollow'" },
        { status: 400 }
      );
    }

    if (currentUserId === targetUserId) {
      return NextResponse.json(
        { success: false, error: "Cannot follow yourself" },
        { status: 400 }
      );
    }

    // Get references to both user documents
    const currentUserRef = doc(db, "users", currentUserId);
    const targetUserRef = doc(db, "users", targetUserId);

    // Check if both users exist
    const [currentUserDoc, targetUserDoc] = await Promise.all([
      getDoc(currentUserRef),
      getDoc(targetUserRef)
    ]);

    if (!currentUserDoc.exists()) {
      return NextResponse.json(
        { success: false, error: "Current user not found" },
        { status: 404 }
      );
    }

    if (!targetUserDoc.exists()) {
      return NextResponse.json(
        { success: false, error: "Target user not found" },
        { status: 404 }
      );
    }

    const currentUserData = currentUserDoc.data();
    const targetUserData = targetUserDoc.data();

    // Get current following/followers arrays
    const currentFollowing = currentUserData.following || [];
    const targetFollowers = targetUserData.followers || [];

    if (action === "follow") {
      // Check if already following
      if (currentFollowing.includes(targetUserId)) {
        return NextResponse.json(
          { success: false, error: "Already following this user" },
          { status: 400 }
        );
      }

      // Add to following/followers arrays
      await Promise.all([
        updateDoc(currentUserRef, {
          following: arrayUnion(targetUserId)
        }),
        updateDoc(targetUserRef, {
          followers: arrayUnion(currentUserId)
        })
      ]);

      // Create notification for the followed user
      try {
        const notificationData = {
          type: "follow",
          message: `${currentUserData.fullName || currentUserData.displayName || 'Someone'} started following you`,
          fromUserId: currentUserId,
          toUserId: targetUserId,
          fromUserName: currentUserData.fullName || currentUserData.displayName || 'Unknown User',
          fromUserAvatar: currentUserData.avatarUrl || '',
          actionUrl: `/user/${currentUserData.username || currentUserId}`,
          isRead: false,
          createdAt: serverTimestamp()
        };

        await addDoc(collection(db, "notifications"), notificationData);
        console.log("Follow notification created for user:", targetUserId);
      } catch (notificationError) {
        console.error("Error creating follow notification:", notificationError);
        // Don't fail the follow action if notification creation fails
      }

      return NextResponse.json({
        success: true,
        message: "Successfully followed user",
        following: [...currentFollowing, targetUserId],
        followers: [...targetFollowers, currentUserId]
      });

    } else if (action === "unfollow") {
      // Check if currently following
      if (!currentFollowing.includes(targetUserId)) {
        return NextResponse.json(
          { success: false, error: "Not following this user" },
          { status: 400 }
        );
      }

      // Remove from following/followers arrays
      await Promise.all([
        updateDoc(currentUserRef, {
          following: arrayRemove(targetUserId)
        }),
        updateDoc(targetUserRef, {
          followers: arrayRemove(currentUserId)
        })
      ]);

      return NextResponse.json({
        success: true,
        message: "Successfully unfollowed user",
        following: currentFollowing.filter(id => id !== targetUserId),
        followers: targetFollowers.filter(id => id !== currentUserId)
      });
    }

  } catch (error) {
    console.error("Error in follow/unfollow action:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
