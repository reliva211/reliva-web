"use client";

import type React from "react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "@/lib/firebase"; // Adjust the path
import { db } from "@/lib/firebase";
import { setDoc, doc, serverTimestamp } from "firebase/firestore";

export default function SignupPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Handle redirect result for mobile authentication
  useEffect(() => {
    const handleRedirectResult = async () => {
      try {
        const { getRedirectResult } = await import("firebase/auth");
        const result = await getRedirectResult(auth);

        if (result) {
          const user = result.user;

          console.log("Handling redirect result for user:", user.email);

          // Create MongoDB user first
          // Generate a unique username to avoid conflicts
          const baseUsername = user.displayName || user.email?.split("@")[0];
          const timestamp = Date.now();
          const uniqueUsername = `${baseUsername}_${timestamp}`;

          const API_BASE =
            process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080/api";
          const mongoRes = await fetch(`${API_BASE}/users`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              username: uniqueUsername,
              email: user.email,
            }),
          });

          const mongoData = await mongoRes.json();
          console.log("Redirect result MongoDB response:", mongoData);
          if (!mongoData.success) {
            console.error(
              "Redirect result MongoDB API error:",
              mongoData.error
            );
            throw new Error(mongoData.error || "MongoDB user creation failed");
          }

          const authorId = mongoData.user._id;
          console.log("Redirect result author id", authorId);

          // Create Firestore user doc with complete user data
          const firestoreUserData = {
            uid: user.uid,
            email: user.email,
            authorId: authorId,
            username: uniqueUsername,
            fullName: user.displayName || "",
            followers: [],
            following: [],
            createdAt: serverTimestamp(),
            spotify: { connected: false },
          };

          console.log("Saving redirect user to Firestore:", firestoreUserData);

          await setDoc(doc(db, "users", user.uid), firestoreUserData, {
            merge: true,
          });

          console.log(
            "Successfully saved redirect user to Firestore with authorId:",
            authorId
          );

          window.location.href = "/reviews";
        }
      } catch (error: any) {
        console.error("Redirect result error:", error);
        // Don't show alert here as it might be a normal redirect
      }
    };

    handleRedirectResult();
  }, []);

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      await updateProfile(user, {
        displayName: fullName,
      });

      console.log("Making MongoDB API call...");

      // Generate a unique username to avoid conflicts
      const baseUsername = user.displayName || user.email?.split("@")[0];
      const timestamp = Date.now();
      const uniqueUsername = `${baseUsername}_${timestamp}`;

      const API_BASE =
        process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080/api";
      const mongoRes = await fetch(`${API_BASE}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: uniqueUsername,
          email: user.email,
        }),
      });

      console.log("MongoDB response status:", mongoRes.status);
      const mongoData = await mongoRes.json();
      console.log("MongoDB response data:", mongoData);

      if (!mongoData.success) {
        console.error("MongoDB API error:", mongoData.error);
        throw new Error(mongoData.error || "MongoDB user creation failed");
      }

      const authorId = mongoData.user._id;
      console.log("author id", authorId);

      // Create Firestore user doc with complete user data
      const firestoreUserData = {
        uid: user.uid,
        email: user.email,
        authorId: authorId,
        username: uniqueUsername,
        fullName: fullName,
        followers: [],
        following: [],
        createdAt: serverTimestamp(),
        spotify: { connected: false },
      };

      console.log("Saving to Firestore:", firestoreUserData);

      await setDoc(doc(db, "users", user.uid), firestoreUserData, {
        merge: true,
      });

      console.log(
        "Successfully saved user to Firestore with authorId:",
        authorId
      );

      window.location.href = "/reviews";
    } catch (error: any) {
      console.error("Signup failed:", error.message);
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  async function handleGoogleSignup(
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ): Promise<void> {
    event.preventDefault();
    setIsLoading(true);

    try {
      const { GoogleAuthProvider, signInWithPopup, signInWithRedirect } =
        await import("firebase/auth");
      const provider = new GoogleAuthProvider();

      // Try popup first, fallback to redirect for mobile
      let googleResult;
      try {
        googleResult = await signInWithPopup(auth, provider);
      } catch (popupError: any) {
        // If popup fails (common on mobile), try redirect
        if (
          popupError.code === "auth/popup-closed-by-user" ||
          popupError.code === "auth/popup-blocked" ||
          popupError.code === "auth/unauthorized-domain"
        ) {
          await signInWithRedirect(auth, provider);
          return; // Redirect will handle the rest
        }
        throw popupError;
      }

      const googleUser = googleResult.user;

      console.log("Making MongoDB API call for Google user...");

      // Generate a unique username to avoid conflicts
      const baseUsername =
        googleUser.displayName || googleUser.email?.split("@")[0];
      const timestamp = Date.now();
      const uniqueUsername = `${baseUsername}_${timestamp}`;

      const API_BASE =
        process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080/api";
      const mongoRes = await fetch(`${API_BASE}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: uniqueUsername,
          email: googleUser.email,
        }),
      });

      console.log("MongoDB response status:", mongoRes.status);
      const mongoData = await mongoRes.json();
      console.log("MongoDB response data:", mongoData);

      if (!mongoData.success) {
        console.error("MongoDB API error:", mongoData.error);
        throw new Error(mongoData.error || "MongoDB user creation failed");
      }

      const authorId = mongoData.user._id;
      console.log("Google user author id", authorId);

      // Create Firestore user doc with complete user data
      const firestoreUserData = {
        uid: googleUser.uid,
        email: googleUser.email,
        username: uniqueUsername,
        fullName: googleUser.displayName || "",
        authorId: authorId,
        followers: [],
        following: [],
        createdAt: serverTimestamp(),
        spotify: { connected: false },
      };

      console.log("Saving Google user to Firestore:", firestoreUserData);

      await setDoc(doc(db, "users", googleUser.uid), firestoreUserData, {
        merge: true,
      });

      console.log(
        "Successfully saved Google user to Firestore with authorId:",
        authorId
      );

      window.location.href = "/reviews";
    } catch (error: any) {
      console.error("Google signup failed:", error.message);

      // Provide more helpful error messages
      let errorMessage = "Authentication failed. Please try again.";

      if (error.code === "auth/unauthorized-domain") {
        errorMessage =
          "This domain is not authorized for authentication. Please contact support or try from a different device.";
      } else if (error.code === "auth/popup-closed-by-user") {
        errorMessage = "Sign-in was cancelled. Please try again.";
      } else if (error.code === "auth/popup-blocked") {
        errorMessage =
          "Pop-up was blocked. Please allow pop-ups and try again.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }
  return (
    <div className="container flex items-center justify-center min-h-[calc(100vh-8rem)] py-8 sm:py-12 px-4">
      <Card className="mx-auto w-full max-w-sm sm:max-w-lg">
        <CardHeader className="space-y-1 px-6 sm:px-8">
          <CardTitle className="text-xl sm:text-2xl font-bold">
            Create an account
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">
            Choose your preferred signup method
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 px-6 sm:px-8">
          <Button
            variant="outline"
            className="w-full flex items-center justify-center gap-2 text-sm sm:text-base"
            onClick={handleGoogleSignup}
            disabled={isLoading}
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4 sm:h-5 sm:w-5">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          <form onSubmit={handleEmailSignup}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Enter your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="terms" />
                <label
                  htmlFor="terms"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  I agree to the{" "}
                  <Link href="/terms" className="text-primary hover:underline">
                    terms and conditions
                  </Link>
                </label>
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Creating account..." : "Create account"}
              </Button>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col px-6 sm:px-8">
          <div className="text-center text-sm">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Login
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
