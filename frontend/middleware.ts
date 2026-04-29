import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const protectedPrefix = "/dashboard"
const authRoutes = new Set(["/login", "/register"])

export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const token = req.cookies.get("auth_token")?.value

  if ((pathname.startsWith(protectedPrefix) || pathname === "/") && !token) {
    const loginUrl = new URL("/login", req.url)
    loginUrl.searchParams.set("redirect", pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (authRoutes.has(pathname) && token) {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
}
