import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Next.js 16 `proxy` convention (formerly `middleware`).
 *
 * This only performs a cheap presence check on the session cookie to keep anonymous
 * visitors out of internal routes. It does **not** verify the cookie: signature/expiry
 * verification requires the Admin SDK, which cannot run here. Real authorization is
 * enforced per request in `src/lib/auth/session.ts` (`getSession` returns an anonymous
 * session for an invalid cookie) and per action in `requirePermission()`.
 */

const SESSION_COOKIE = "__session";

const protectedPathPrefixes = [
  "/dashboard",
  "/business",
  "/research",
  "/marketing",
  "/operations",
  "/reports",
];

const publicPathPrefixes = ["/login", "/api", "/po"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (publicPathPrefixes.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  if (protectedPathPrefixes.some((prefix) => pathname.startsWith(prefix))) {
    const hasSession = request.cookies.has(SESSION_COOKIE);
    if (!hasSession) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
