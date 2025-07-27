"use client";

import { signIn, getSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Music, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function SignIn() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if user is already signed in
    getSession().then((session) => {
      if (session) {
        router.push("/home");
      }
    });
  }, [router]);

  const handleSpotifySignIn = async () => {
    setIsLoading(true);
    try {
      await signIn("spotify", { callbackUrl: "/home" });
    } catch (error) {
      console.error("Sign in error:", error);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-4">
            <Music className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl">Welcome to Music4Life</CardTitle>
          <p className="text-muted-foreground">
            Connect your Spotify account to get started
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={handleSpotifySignIn}
            disabled={isLoading}
            className="w-full flex items-center gap-2"
            size="lg"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Music className="h-5 w-5" />
            )}
            {isLoading ? "Connecting..." : "Connect with Spotify"}
          </Button>

          <div className="text-center text-sm text-muted-foreground">
            <p>
              By connecting, you agree to share your Spotify data with
              Music4Life
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
