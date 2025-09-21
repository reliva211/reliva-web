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
import {
  Eye,
  EyeOff,
  Sparkles,
  Heart,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import { useUsernameValidation } from "@/hooks/use-username-validation";
import Image from "next/image";

export default function SignupPage() {
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Username validation hook
  const usernameValidation = useUsernameValidation(username);

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

          window.location.href = "/onboarding";
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

    // Validate username before proceeding
    if (!usernameValidation.available || usernameValidation.isValidating) {
      alert("Please choose a valid username");
      return;
    }

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

      // Use the user-chosen username
      const chosenUsername = username;

      const API_BASE =
        process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080/api";
      const mongoRes = await fetch(`${API_BASE}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: chosenUsername,
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
        username: chosenUsername,
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

      // Create user profile in userProfiles collection
      const userProfile = {
        uid: user.uid,
        displayName: fullName,
        username: chosenUsername,
        bio: "Tell us about yourself...",
        website: "",
        avatarUrl: "",
        coverImageUrl: "",
        joinDate: new Date().toISOString(),
        isPublic: true,
        socialLinks: {},
        visibleSections: {
          music: true,
          movies: true,
          series: true,
          books: true,
        },
      };

      await setDoc(doc(db, "userProfiles", user.uid), userProfile);

      // Successfully saved user to Firestore

      window.location.href = "/onboarding";
    } catch (error: any) {
      console.error("Signup failed:", error.message);
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Full Background Image */}
      <div className="absolute inset-0">
        <Image
          src="/login-gradient.jpeg"
          alt="Abstract gradient background"
          fill
          className="object-cover brightness-125"
          priority={true}
          placeholder="blur"
          blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
          quality={85}
        />
      </div>

      <div className="min-h-screen flex items-center justify-center relative z-10">
        {/* Centered Signup Form */}
        <div className="w-full max-w-md px-4 sm:px-6 lg:px-8">
          <div className="bg-black/80 backdrop-blur-sm border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
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

            <div className="space-y-4 sm:space-y-5">
              <form onSubmit={handleEmailSignup} className="space-y-4">
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
                    htmlFor="username"
                    className="text-white font-medium text-sm"
                  >
                    Username
                  </Label>
                  <div className="relative">
                    <Input
                      id="username"
                      type="text"
                      placeholder="Choose a unique username"
                      value={username}
                      onChange={(e) =>
                        setUsername(
                          e.target.value
                            .toLowerCase()
                            .replace(/[^a-zA-Z0-9_]/g, "")
                        )
                      }
                      required
                      className={`h-9 bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 focus:border-purple-500 focus:ring-purple-500/20 text-sm pr-10 ${
                        username && !usernameValidation.isValidating
                          ? usernameValidation.available
                            ? "border-green-500 focus:border-green-500"
                            : "border-red-500 focus:border-red-500"
                          : ""
                      }`}
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      {usernameValidation.isValidating && (
                        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                      )}
                      {!usernameValidation.isValidating && username && (
                        <>
                          {usernameValidation.available ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  {username && usernameValidation.message && (
                    <p
                      className={`text-xs ${
                        usernameValidation.available
                          ? "text-green-400"
                          : "text-red-400"
                      }`}
                    >
                      {usernameValidation.message}
                    </p>
                  )}
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
  );
}
