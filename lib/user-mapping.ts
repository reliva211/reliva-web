import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "./firebase";

/**
 * Maps MongoDB authorId to Firebase UID by searching the users collection
 * @param authorId - MongoDB authorId from posts/comments
 * @returns Promise<string | null> - Firebase UID or null if not found
 */
export async function mapAuthorIdToFirebaseUID(
  authorId: string
): Promise<string | null> {
  if (!authorId) return null;

  try {
    // Search for user document where authorId matches
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("authorId", "==", authorId));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      return userDoc.id; // The document ID is the Firebase UID
    }

    return null;
  } catch (error) {
    console.error("Error mapping authorId to Firebase UID:", error);
    return null;
  }
}

/**
 * Maps Firebase UID to MongoDB authorId
 * @param firebaseUID - Firebase UID
 * @returns Promise<string | null> - MongoDB authorId or null if not found
 */
export async function mapFirebaseUIDToAuthorId(
  firebaseUID: string
): Promise<string | null> {
  if (!firebaseUID) return null;

  try {
    const userRef = doc(db, "users", firebaseUID);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const userData = userSnap.data();
      return userData?.authorId || null;
    }

    return null;
  } catch (error) {
    console.error("Error mapping Firebase UID to authorId:", error);
    return null;
  }
}

/**
 * Determines if an ID is a Firebase UID or MongoDB authorId
 * Firebase UIDs are typically 28 characters long and contain alphanumeric characters
 * MongoDB ObjectIds are 24 characters long and contain hexadecimal characters
 * @param id - The ID to check
 * @returns 'firebase' | 'mongodb' | 'unknown'
 */
export function identifyIdType(id: string): "firebase" | "mongodb" | "unknown" {
  if (!id) return "unknown";

  // MongoDB ObjectId pattern: 24 hex characters
  if (/^[0-9a-fA-F]{24}$/.test(id)) {
    return "mongodb";
  }

  // Firebase UID pattern: typically 28 characters, alphanumeric
  if (/^[a-zA-Z0-9]{28}$/.test(id)) {
    return "firebase";
  }

  return "unknown";
}

