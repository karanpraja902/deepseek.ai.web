import { NextResponse, NextRequest } from "next/server";

const publicRoute = new Set(["/sign-in", "/sign-up", "/"]);

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const userToken = req.cookies.get("auth_token");

  // Skip middleware for API routes and static files
  if (pathname.startsWith("/api") || 
      pathname.startsWith("/_next") || 
      pathname.startsWith("/conversation")) {
    return NextResponse.next();
  }

  // Check if user has a token and trying to access public routes like signup signin
  if (publicRoute.has(pathname) && userToken) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Allow access to public routes
  if (publicRoute.has(pathname)) {
    return NextResponse.next();
  }

  // Check if user is authenticated for protected routes
  if (!userToken) {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  return NextResponse.next();
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    "/",
    "/sign-in", 
    "/sign-up",
    "/chat/:path*",
    "/auth/:path*"
  ],
};