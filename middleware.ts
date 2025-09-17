import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Routes that don't require onboarding check
  const publicRoutes = ["/login", "/signup", "/onboarding", "/api/auth"];

  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Check if user is authenticated and has completed onboarding
  // This would need to be implemented based on your auth system
  // For now, we'll let the onboarding page handle the redirect logic

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
