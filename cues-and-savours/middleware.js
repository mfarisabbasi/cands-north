import { NextResponse } from "next/server";
import { verifyToken } from "./lib/auth";

export function middleware(request) {
  const token = request.cookies.get("token");
  const { pathname } = request.nextUrl;

  // Define public paths (accessible without authentication)
  const publicPaths = ["/login"];
  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path));

  // Define protected paths (require authentication)
  const protectedPaths = ["/dashboard", "/staff", "/users", "/gametypes"];
  const isProtectedPath = protectedPaths.some((path) =>
    pathname.startsWith(path)
  );

  // If user is not authenticated and trying to access protected path
  if (!token && isProtectedPath) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // If user is authenticated and trying to access login page
  if (token && isPublicPath) {
    const decoded = verifyToken(token.value);
    if (decoded) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|public).*)"],
};
