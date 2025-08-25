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
    if (firebaseUser) {
      const userRef = doc(db, "users", firebaseUser.uid);
      const userSnap = await getDoc(userRef);

      let authorId: string | null = null;
      if (userSnap.exists()) {
        const userData = userSnap.data();
        authorId = userData?.authorId || null;
      } else {
        // optional: create Firestore user if not exists
        await setDoc(userRef, {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          authorId: null,
          username: firebaseUser.displayName || firebaseUser.email?.split("@")[0],
          fullName: firebaseUser.displayName || "",
          followers: [],
          following: [],
          createdAt: serverTimestamp(),
          spotify: { connected: false }
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
  });

  return () => unsubscribe();
}, [auth]);


  return { user, loading };
};
