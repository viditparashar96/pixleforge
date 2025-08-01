import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    // Allow access to auth pages for non-authenticated users
    if (pathname.startsWith("/auth/") && !token) {
      return NextResponse.next();
    }

    // Redirect authenticated users away from auth pages
    if (pathname.startsWith("/auth/") && token) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // Protect dashboard routes
    if (pathname.startsWith("/dashboard")) {
      if (!token) {
        return NextResponse.redirect(new URL("/auth/signin", req.url));
      }

      // Role-based access control
      const userRole = token.role as string;

      // Admin routes
      if (pathname.startsWith("/dashboard/admin") && userRole !== "ADMIN") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }

      // Project Lead routes
      if (
        pathname.startsWith("/dashboard/projects/assign") &&
        !["ADMIN", "PROJECT_LEAD"].includes(userRole)
      ) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }

      // User management routes (Admin only)
      if (pathname.startsWith("/dashboard/users") && userRole !== "ADMIN") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        // Allow access to public routes
        if (
          pathname === "/" ||
          pathname.startsWith("/auth/") ||
          pathname.startsWith("/api/auth/")
        ) {
          return true;
        }

        // Require authentication for protected routes
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth.js routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.svg$).*)",
  ],
};