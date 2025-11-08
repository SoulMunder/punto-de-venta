import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const path = req.nextUrl.pathname

    // Exclude auth routes from middleware
    if (path.startsWith("/auth")) {
      return NextResponse.next()
    }

    // Admin routes protection - only admins can access
    if (path.startsWith("/admin")) {
      // Users management - admin only
      if (path.startsWith("/admin/users") && token?.role !== "admin") {
        return NextResponse.redirect(new URL("/pos", req.url))
      }

      // Other admin routes - admin and branch_manager
      if (token?.role === "cashier") {
        return NextResponse.redirect(new URL("/pos", req.url))
      }

      // Additional admin-only sections
      if (
        (path.startsWith("/admin/products") || 
         path.startsWith("/admin/purchases")) && 
        token?.role !== "admin"
      ) {
        return NextResponse.redirect(new URL("/pos", req.url))
      }
    }

    // POS routes protection - all authenticated users can access
    if (path.startsWith("/pos")) {
      if (!token?.role || !["admin", "branch_manager", "cashier"].includes(token.role as string)) {
        return NextResponse.redirect(new URL("/auth/login", req.url))
      }
    }
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname
        // Always allow access to auth routes
        if (path.startsWith("/auth")) {
          return true
        }
        // Require authentication for all other routes
        return !!token
      }
    },
    pages: {
      signIn: "/auth/login"
    }
  }
)

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ]
}
