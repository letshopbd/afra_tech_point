import { getToken } from "next-auth/jwt"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET || "secret",
    secureCookie: process.env.NODE_ENV === "production",
  })

  const { pathname } = req.nextUrl

  // If logged in and trying to visit login page, redirect to home
  if (token && pathname === "/login") {
    return NextResponse.redirect(new URL("/", req.url))
  }

  // If not logged in and not on login page, redirect to login
  if (!token && pathname !== "/login") {
    const loginUrl = new URL("/login", req.url)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon\\.ico|favicon\\.png|logo\\.png|icon\\.png|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.svg|.*\\.gif|.*\\.webp|.*\\.ico).*)",
  ],
}