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
}

export const useCurrentUser = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userWithId = {
          ...firebaseUser,
          id: firebaseUser.uid,
        };

        setUser(userWithId);
        setLoading(false);

        // Step: Check if user doc exists in Firestore
        const userRef = doc(db, "users", firebaseUser.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          await setDoc(userRef, {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            username: firebaseUser.displayName || firebaseUser.email?.split("@")[0],
            fullName: firebaseUser.displayName || "",
            followers: [],
            following: [],
            createdAt: serverTimestamp(),
            spotify: { connected: false }
          });
        }
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [auth]);

  return { user, loading };
};
