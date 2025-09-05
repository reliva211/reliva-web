"use client";

import type React from "react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "@/lib/firebase"; // Adjust the path
import { db } from "@/lib/firebase";
import { setDoc, doc, serverTimestamp } from "firebase/firestore";
import { Eye, EyeOff, Sparkles, Heart } from "lucide-react";

export default function SignupPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Handle redirect result for mobile authentication
  useEffect(() => {
    const handleRedirectResult = async () => {
      try {
        const { getRedirectResult } = await import("firebase/auth");
        const result = await getRedirectResult(auth);

        if (result) {
          const user = result.user;

          // Handling redirect result for user

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
          if (!mongoData.success) {
            console.error(
              "Redirect result MongoDB API error:",
              mongoData.error
            );
            throw new Error(mongoData.error || "MongoDB user creation failed");
          }

          const authorId = mongoData.user._id;

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

          // Saving redirect user to Firestore

          await setDoc(doc(db, "users", user.uid), firestoreUserData, {
            merge: true,
          });

          // Successfully saved redirect user to Firestore

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

      // Making MongoDB API call

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

      // MongoDB response received
      const mongoData = await mongoRes.json();

      if (!mongoData.success) {
        console.error("MongoDB API error:", mongoData.error);
        throw new Error(mongoData.error || "MongoDB user creation failed");
      }

      const authorId = mongoData.user._id;

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

      // Saving to Firestore

      await setDoc(doc(db, "users", user.uid), firestoreUserData, {
        merge: true,
      });

      // Successfully saved user to Firestore

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

      // Making MongoDB API call for Google user

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

      // MongoDB response received
      const mongoData = await mongoRes.json();

      if (!mongoData.success) {
        console.error("MongoDB API error:", mongoData.error);
        throw new Error(mongoData.error || "MongoDB user creation failed");
      }

      const authorId = mongoData.user._id;

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

      // Saving Google user to Firestore

      await setDoc(doc(db, "users", googleUser.uid), firestoreUserData, {
        merge: true,
      });

      // Successfully saved Google user to Firestore

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
    <div className="min-h-screen relative overflow-hidden">
      {/* Full Background Image */}
      <div className="absolute inset-0">
        <img
          src="/login-gradient.jpeg"
          alt="Abstract gradient background"
          className="w-full h-full object-cover brightness-125"
        />
      </div>

      <div className="min-h-screen flex flex-col lg:flex-row relative z-10">
        {/* Left Side - Empty for image display */}
        <div className="hidden lg:flex lg:w-1/2 relative"></div>

        {/* Right Side - Transparent Signup Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center px-4 sm:px-6 lg:px-8">
          <div className="w-full max-w-sm">
            <div className="bg-black/80 backdrop-blur-sm border border-white/10 rounded-2xl p-4 sm:p-6 shadow-2xl">
              <div className="space-y-1 text-center pb-4">
                <div className="mx-auto w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-purple-600 to-violet-600 rounded-xl flex items-center justify-center mb-2">
                  <Heart className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-white">
                  Create Account
                </h2>
                <p className="text-xs sm:text-sm text-gray-400">
                  Join our community of passionate reviewers
                </p>
              </div>

              <div className="space-y-3 sm:space-y-4">
                {/* Google Sign Up */}
                <Button
                  variant="outline"
                  className="w-full h-10 bg-gray-700 border-gray-600 text-white hover:bg-gray-600 transition-all duration-300 group"
                  onClick={handleGoogleSignup}
                  disabled={isLoading}
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5 mr-3">
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
                  Sign Up with Google
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-600" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="bg-black/80 px-4 text-gray-400">
                      Or continue with email
                    </span>
                  </div>
                </div>

                <form onSubmit={handleEmailSignup} className="space-y-3">
                  <div className="space-y-1">
                    <Label
                      htmlFor="fullName"
                      className="text-white font-medium text-sm"
                    >
                      Full Name
                    </Label>
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="Enter your full name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      className="h-9 bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 focus:border-purple-500 focus:ring-purple-500/20 text-sm"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label
                      htmlFor="email"
                      className="text-white font-medium text-sm"
                    >
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-9 bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 focus:border-purple-500 focus:ring-purple-500/20 text-sm"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label
                      htmlFor="password"
                      className="text-white font-medium text-sm"
                    >
                      Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="pr-8 h-9 bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 focus:border-purple-500 focus:ring-purple-500/20 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                      >
                        {showPassword ? (
                          <EyeOff className="h-3 w-3" />
                        ) : (
                          <Eye className="h-3 w-3" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      id="terms"
                      type="checkbox"
                      className="h-3 w-3 rounded border-gray-600 bg-gray-700 text-purple-600 focus:ring-purple-500/20"
                    />
                    <label
                      htmlFor="terms"
                      className="text-xs text-gray-300 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      I agree to the{" "}
                      <Link
                        href="/terms"
                        className="text-purple-400 hover:text-purple-300 transition-colors"
                      >
                        terms and conditions
                      </Link>
                    </label>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-9 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white font-semibold transition-all duration-300 transform hover:scale-[1.02] shadow-lg text-sm"
                    disabled={isLoading}
                  >
                    {isLoading ? "Creating account..." : "Create Account"}
                  </Button>
                </form>
              </div>

              <div className="flex flex-col pt-4">
                <div className="text-center text-xs text-gray-400">
                  Already have an account?{" "}
                  <Link
                    href="/login"
                    className="text-purple-400 hover:text-purple-300 font-medium transition-colors"
                  >
                    Sign in
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
