import { connection } from "next/server";
import { cookies } from "next/headers";
import { ForbiddenError, type Role, can, isRole, type Permission } from "@/lib/permissions/policy";
import { getAdminAuth } from "@/lib/firebase/admin.ts";

/**
 * User session.
 *
 * When Firebase Authentication is wired (T012/T013), `getSession()` verifies the
 * `__session` cookie created by `/api/auth/session` and returns the real user's
 * uid, display name, and role from Firebase custom claims.
 *
 * Until then (local development without a valid Firebase session), it falls back
 * to the local prototype session controlled by `WORKSPACE_PROTOTYPE_ROLE`. This
 * fallback is intentionally insecure and must not be used in production.
 *
 * Everything that needs identity goes through `getSession()` / `requirePermission()`
 * so the Firebase swap happens in one place. Server Actions are reachable by direct
 * POST, so authorization stays server-side.
 */

export const SESSION_COOKIE = "__session";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 5; // 5 days

export interface WorkspaceSession {
  uid: string;
  displayName: string;
  /** `null` means anonymous (no verified identity and no development fallback). */
  role: Role | null;
  /** Marks the session as a local prototype rather than a verified identity. */
  isPrototype: boolean;
}

const PROTOTYPE_SESSION: Omit<WorkspaceSession, "role"> = {
  uid: "prototype-local-user",
  displayName: "Pengguna Prototipe",
  isPrototype: true,
};

const ANONYMOUS_SESSION: WorkspaceSession = {
  uid: "",
  displayName: "",
  role: null,
  isPrototype: false,
};

export function resolvePrototypeRole(
  rawRole: string | undefined = process.env.WORKSPACE_PROTOTYPE_ROLE,
): Role {
  return isRole(rawRole) ? rawRole : "entrepreneur_admin";
}

/**
 * The prototype fallback is only allowed in local development and only when the operator
 * opts in via `WORKSPACE_PROTOTYPE_ROLE`. It is never used in production.
 */
export function isPrototypeSessionEnabled(): boolean {
  return process.env.NODE_ENV !== "production" && Boolean(process.env.WORKSPACE_PROTOTYPE_ROLE);
}

/**
 * Verifies the Firebase session cookie and returns a verified session, or null when no
 * valid cookie exists. Never falls back to the prototype.
 */
export async function getFirebaseSession(): Promise<WorkspaceSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  return verifySessionCookie(token);
}

async function verifySessionCookie(token: string | undefined): Promise<WorkspaceSession | null> {
  if (!token) return null;

  try {
    const auth = await getAdminAuth();
    const decoded = await auth.verifySessionCookie(token, true);
    const role: Role | null = isRole(decoded.role) ? decoded.role : null;
    return {
      uid: decoded.uid,
      displayName: decoded.name ?? decoded.email ?? "",
      role,
      isPrototype: false,
    };
  } catch {
    return null;
  }
}

/**
 * Returns the current session.
 *
 * - Valid Firebase session cookie → verified session with the role from custom claims.
 * - Cookie present but invalid/expired → anonymous. Falling back to the prototype here
 *   would let anyone bypass authentication with a bogus cookie.
 * - No cookie, local development, explicit `WORKSPACE_PROTOTYPE_ROLE` → prototype session.
 * - Otherwise → anonymous.
 */
export async function getSession(): Promise<WorkspaceSession> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (token) {
    const verified = await verifySessionCookie(token);
    return verified ?? ANONYMOUS_SESSION;
  }

  if (!isPrototypeSessionEnabled()) return ANONYMOUS_SESSION;

  return {
    ...PROTOTYPE_SESSION,
    role: resolvePrototypeRole(),
  };
}

/**
 * Session for rendering role-dependent UI.
 *
 * `connection()` guarantees the decision is made per request instead of being baked into a
 * prerendered page, so changing the user's claims takes effect without a rebuild.
 * Server Actions do not need this: they always run per request.
 */
export async function getRequestSession(): Promise<WorkspaceSession> {
  await connection();
  return getSession();
}

/**
 * Requires an authenticated session (any role). Throws when the user is anonymous.
 */
export async function requireAuth(): Promise<WorkspaceSession> {
  const session = await getSession();
  if (!session.uid) {
    throw new Error("Autentikasi diperlukan.");
  }
  return session;
}

export async function requirePermission(permission: Permission): Promise<WorkspaceSession> {
  const session = await getSession();
  const role = session.role;

  if (!role || !can(role, permission)) {
    throw new ForbiddenError(role ?? "anonymous", permission);
  }

  return session;
}

export function sessionCookieOptions(): {
  httpOnly: boolean;
  secure: boolean;
  sameSite: "lax" | "strict" | "none";
  path: string;
  maxAge: number;
} {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  };
}

