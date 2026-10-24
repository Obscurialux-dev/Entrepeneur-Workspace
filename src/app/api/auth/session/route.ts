import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebase/admin.ts";
import { sessionCookieOptions, SESSION_COOKIE } from "@/lib/auth/session.ts";

const SESSION_DURATION_MS = 5 * 24 * 60 * 60 * 1000; // 5 days

export async function POST(req: Request): Promise<Response> {
  let idToken: string | undefined;

  try {
    const body = (await req.json()) as { idToken?: string };
    idToken = body.idToken;
  } catch {
    return NextResponse.json({ error: "Request body tidak valid." }, { status: 400 });
  }

  if (!idToken || typeof idToken !== "string") {
    return NextResponse.json({ error: "ID token diperlukan." }, { status: 400 });
  }

  try {
    const auth = await getAdminAuth();
    const decoded = await auth.verifyIdToken(idToken);
    const sessionCookie = await auth.createSessionCookie(idToken, {
      expiresIn: SESSION_DURATION_MS,
    });

    const options = sessionCookieOptions();
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, sessionCookie, {
      httpOnly: options.httpOnly,
      secure: options.secure,
      sameSite: options.sameSite,
      path: options.path,
      maxAge: options.maxAge,
    });

    return NextResponse.json({ ok: true, uid: decoded.uid });
  } catch (error) {
    console.error("Gagal membuat sesi Firebase:", error);
    return NextResponse.json(
      { error: "Gagal memverifikasi identitas." },
      { status: 401 },
    );
  }
}
