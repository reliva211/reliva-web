"use client";

import type React from "react";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Eye, EyeOff, Sparkles } from "lucide-react";
import Image from "next/image";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      // Firebase login success
      window.location.href = "/reviews";
    } catch (err) {
      console.error("Firebase login failed:", err);
      // Handle errors like "auth/user-not-found", etc.
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
        {/* Centered Login Form */}
        <div className="w-full max-w-md px-4 sm:px-6 lg:px-8">
          <div className="bg-black/80 backdrop-blur-sm border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <div className="space-y-1 text-center pb-4">
              <div className="mx-auto w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-purple-600 to-violet-600 rounded-xl flex items-center justify-center mb-2">
                <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white">
                Welcome Back
              </h2>
              <p className="text-xs sm:text-sm text-gray-400">
                Enter your email and password to access your account
              </p>
            </div>

            <div className="space-y-4 sm:space-y-5">
              <form onSubmit={handleEmailLogin} className="space-y-4">
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
                      placeholder="Enter your password"
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

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <input
                      id="remember"
                      type="checkbox"
                      className="h-3 w-3 rounded border-gray-600 bg-gray-700 text-purple-600 focus:ring-purple-500/20"
                    />
                    <Label htmlFor="remember" className="text-xs text-gray-300">
                      Remember me
                    </Label>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-9 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white font-semibold transition-all duration-300 transform hover:scale-[1.02] shadow-lg text-sm"
                  disabled={isLoading}
                >
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </div>

            <div className="flex flex-col pt-4">
              <div className="text-center text-xs text-gray-400">
                Don&apos;t have an account?{" "}
                <Link
                  href="/signup"
                  className="text-purple-400 hover:text-purple-300 font-medium transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
