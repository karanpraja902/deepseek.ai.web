import { NextResponse, NextRequest } from "next/server";

const publicRoutes = new Set(["/sign-in", "/sign-up", "/"]);//routes that are accessible to all users
const authOnlyRoutes = new Set(["/sign-in", "/sign-up"]); // Routes only for unauthenticated users
const authRoutes = new Set(["/auth/success"]); // Routes that need special handling during auth flow

export function middleware(req: NextRequest, res: NextResponse) {
  // console.log("middlewarettt", res);
  console.log("middleware");
  const { pathname } = req.nextUrl;
  const userToken = req.cookies.get("auth_token");
  console.log("middleware userToken", userToken);

  // Skip middleware for API routes, static files, and auth flow routes
  if (pathname.startsWith("/api") || 
      pathname.startsWith("/_next") || 
      pathname.startsWith("/conversation") ||
      authRoutes.has(pathname)) {
    return NextResponse.next();
  }
console.log("middleware pathname", pathname);
  // Redirect authenticated users away from auth-only routes (sign-in, sign-up)
  console.log("middleware authOnlyRoutes", authOnlyRoutes);
  if (authOnlyRoutes.has(pathname) && userToken) {
    console.log("after signin/signup", authOnlyRoutes.has(pathname), userToken);
    console.log("middleware redirecting authenticated user away from auth page");
    return NextResponse.next();
  }

  // Allow access to public routes (including home page)
  if (publicRoutes.has(pathname)) {
    console.log("middleware publicRoutes", publicRoutes);
    return NextResponse.next();
  }

  // Check if user is authenticated for protected routes
  if (!userToken) {
    console.log("middleware redirecting unauthenticated user to sign-in");
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
    "/auth/:path*",
    "/settings"
  ],
};