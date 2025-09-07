import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

// Cache for username lookups to avoid repeated database calls
const usernameCache = new Map<string, string>();

/**
 * Get username from authorId (MongoDB ID) by looking up the user profile
 * @param authorId - MongoDB authorId
 * @returns Promise<string | null> - Username if found, null otherwise
 */
export async function getUsernameFromAuthorId(authorId: string): Promise<string | null> {
  if (!authorId) return null;

  // Check cache first
  if (usernameCache.has(authorId)) {
    return usernameCache.get(authorId) || null;
  }

  try {
    // First, try to find the user in the users collection to get Firebase UID
    const usersRef = collection(db, "users");
    const userQuery = query(usersRef, where("authorId", "==", authorId));
    const userSnapshot = await getDocs(userQuery);

    if (!userSnapshot.empty) {
      const userData = userSnapshot.docs[0].data();
      const firebaseUID = userData.uid;

      // Now get the username from userProfiles collection
      const profileRef = doc(db, "userProfiles", firebaseUID);
      const profileSnap = await getDoc(profileRef);

      if (profileSnap.exists()) {
        const profileData = profileSnap.data();
        const username = profileData.username;
        
        // Cache the result
        usernameCache.set(authorId, username);
        return username;
      }
    }

    return null;
  } catch (error) {
    console.error("Error getting username from authorId:", error);
    return null;
  }
}

/**
 * Get username from Firebase UID
 * @param firebaseUID - Firebase UID
 * @returns Promise<string | null> - Username if found, null otherwise
 */
export async function getUsernameFromFirebaseUID(firebaseUID: string): Promise<string | null> {
  if (!firebaseUID) return null;

  // Check cache first
  if (usernameCache.has(firebaseUID)) {
    return usernameCache.get(firebaseUID) || null;
  }

  try {
    const profileRef = doc(db, "userProfiles", firebaseUID);
    const profileSnap = await getDoc(profileRef);

    if (profileSnap.exists()) {
      const profileData = profileSnap.data();
      const username = profileData.username;
      
      // Cache the result
      usernameCache.set(firebaseUID, username);
      return username;
    }

    return null;
  } catch (error) {
    console.error("Error getting username from Firebase UID:", error);
    return null;
  }
}

/**
 * Clear the username cache (useful for testing or when usernames change)
 */
export function clearUsernameCache(): void {
  usernameCache.clear();
}
