"use client";

import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function AuthError() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case "Configuration":
        return "There is a problem with the server configuration.";
      case "AccessDenied":
        return "You do not have permission to sign in.";
      case "Verification":
        return "The verification token has expired or has already been used.";
      case "OAuthSignin":
        return "Error in constructing an authorization URL.";
      case "OAuthCallback":
        return "Error in handling the response from the OAuth provider.";
      case "OAuthCreateAccount":
        return "Could not create OAuth provider user in the database.";
      case "EmailCreateAccount":
        return "Could not create email provider user in the database.";
      case "Callback":
        return "Error in the OAuth callback process.";
      case "OAuthAccountNotLinked":
        return "Email on the account already exists with different provider.";
      case "EmailSignin":
        return "Check your email address.";
      case "CredentialsSignin":
        return "Sign in failed. Check the details you provided are correct.";
      case "SessionRequired":
        return "Please sign in to access this page.";
      default:
        return "An error occurred during authentication.";
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl">Authentication Error</CardTitle>
          <p className="text-muted-foreground">{getErrorMessage(error)}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Please try again or contact support if the problem persists.
            </p>
          </div>

          <div className="flex gap-2">
            <Button asChild variant="outline" className="flex-1">
              <Link href="/music">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Music
              </Link>
            </Button>
            <Button asChild className="flex-1">
              <Link href="/auth/signin">Try Again</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
