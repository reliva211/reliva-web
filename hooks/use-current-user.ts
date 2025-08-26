"use client";

import { useEffect, useState } from "react";
import {
  getAuth,
  onAuthStateChanged,
  User as FirebaseUser,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase"; // update path if needed

interface User extends FirebaseUser {
  id: string;
  authorId: string | null;
}

export const useCurrentUser = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const userRef = doc(db, "users", firebaseUser.uid);
          const userSnap = await getDoc(userRef);

          let authorId: string | null = null;
          if (userSnap.exists()) {
            const userData = userSnap.data();
            authorId = userData?.authorId || null;
            console.log("User data from Firestore:", userData);
            console.log("AuthorId from Firestore:", authorId);

            // If user exists but doesn't have authorId, create it in MongoDB
            if (!authorId) {
              console.log(
                "User exists but no authorId, creating MongoDB user..."
              );
              try {
                const baseUsername =
                  firebaseUser.displayName || firebaseUser.email?.split("@")[0];
                const timestamp = Date.now();
                const uniqueUsername = `${baseUsername}_${timestamp}`;

                const API_BASE =
                  process.env.NEXT_PUBLIC_API_BASE ||
                  "http://localhost:8080/api";
                const mongoRes = await fetch(`${API_BASE}/users`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    username: uniqueUsername,
                    email: firebaseUser.email,
                  }),
                });

                const mongoData = await mongoRes.json();
                if (mongoData.success) {
                  authorId = mongoData.user._id;
                  console.log("Created MongoDB user with authorId:", authorId);

                  // Update Firestore with the new authorId
                  await setDoc(userRef, { authorId }, { merge: true });
                  console.log("Updated Firestore with authorId:", authorId);
                } else {
                  console.error(
                    "Failed to create MongoDB user:",
                    mongoData.error
                  );
                }
              } catch (error) {
                console.error("Error creating MongoDB user:", error);
              }
            }
          } else {
            // Create Firestore user if not exists
            console.log("Creating new Firestore user...");
            await setDoc(userRef, {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              authorId: null,
              username:
                firebaseUser.displayName || firebaseUser.email?.split("@")[0],
              fullName: firebaseUser.displayName || "",
              followers: [],
              following: [],
              createdAt: serverTimestamp(),
              spotify: { connected: false },
            });
          }

          setUser({
            ...firebaseUser,
            id: firebaseUser.uid,
            authorId, // <-- add authorId here
          });
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Error in auth state change:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [auth]);

  return { user, loading };
};
