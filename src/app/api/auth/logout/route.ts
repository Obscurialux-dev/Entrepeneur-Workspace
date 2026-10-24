import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebase/admin.ts";
import { SESSION_COOKIE } from "@/lib/auth/session.ts";

export async function POST(): Promise<Response> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  // Revoke the server-side Firebase session (refresh tokens) when a valid
  // session cookie exists, so the identity can no longer be used. This runs
  // entirely server-side with the Admin SDK; no credentials reach the client.
  if (token) {
    try {
      const auth = getAdminAuth();
      const decoded = await auth.verifySessionCookie(token, true);
      await auth.revokeRefreshTokens(decoded.uid);
    } catch {
      // Cookie is invalid or already revoked; continue clearing it anyway.
    }
  }

  cookieStore.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return NextResponse.json({ ok: true });
}
