#!/usr/bin/env node
/**
 * Assigns a workspace role to a Firebase Auth user as a custom claim.
 *
 * Roles are the *only* source of authorization (`src/lib/permissions/policy.ts`), and they
 * live in Firebase Auth custom claims so Firestore Security Rules can enforce them too.
 * There is intentionally no self-service role selection in the app.
 *
 * Usage:
 *   npm run set:role -- <uid-atau-email> <role>
 *
 * Roles: entrepreneur_admin | research | marketing | executive_viewer
 *
 * Works against the Auth emulator when FIREBASE_AUTH_EMULATOR_HOST is set. Credentials are
 * read from environment variables (`.env.local`); no secret is printed.
 */

import { getAdminAuth } from "../src/lib/firebase/admin.ts";

const ROLES = ["entrepreneur_admin", "research", "marketing", "executive_viewer"];

const [identifier, role] = process.argv.slice(2);

if (!identifier || !role || !ROLES.includes(role)) {
  console.error("Penggunaan: npm run set:role -- <uid-atau-email> <role>");
  console.error(`Role yang valid: ${ROLES.join(", ")}`);
  process.exit(1);
}

try {
  const auth = getAdminAuth();
  const user = identifier.includes("@")
    ? await auth.getUserByEmail(identifier)
    : await auth.getUser(identifier);

  await auth.setCustomUserClaims(user.uid, { role });
  // Force a token refresh so the new claim takes effect on the next sign-in.
  await auth.revokeRefreshTokens(user.uid);

  console.log(`OK: role "${role}" diberikan kepada ${user.email ?? user.uid} (uid: ${user.uid}).`);
  console.log("Minta pengguna login ulang agar custom claim berlaku pada sesi berikutnya.");
} catch (error) {
  console.error("GAGAL: tidak bisa menetapkan role.", error instanceof Error ? error.message : "");
  process.exit(1);
}
