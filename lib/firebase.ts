import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getStorage } from "firebase/storage"; // ✅ Add this line

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY! || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN! || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID! || "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET! || "", // ✅ Ensure this is set in .env
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID! || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID! || "",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID! || "",
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app); // ✅ Add this line

let analytics: ReturnType<typeof getAnalytics> | null = null;
if (typeof window !== "undefined") {
  isSupported().then((yes) => {
    if (yes) analytics = getAnalytics(app);
  });
}

export { app, auth, db, storage, analytics }; // ✅ Export storage
