/**
 * Firebase configuration (shared between client and server).
 *
 * Only public web identifiers are exposed here. Server-only Admin SDK
 * credentials (service account) live in `admin.ts` and must never be imported
 * from client components.
 *
 * Environment variables are read from `.env.local` (never committed). See
 * `.env.example` for the required placeholder names.
 */

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

/**
 * Names (never values) of required public Firebase variables that are missing.
 * Safe to log: it only reveals variable names, which are documented in `.env.example`.
 */
export function missingFirebaseEnv(): string[] {
  const missing: string[] = [];
  if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) missing.push("NEXT_PUBLIC_FIREBASE_API_KEY");
  if (!process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN) missing.push("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN");
  if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) missing.push("NEXT_PUBLIC_FIREBASE_PROJECT_ID");
  if (!process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET) missing.push("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET");
  if (!process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID) missing.push("NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID");
  if (!process.env.NEXT_PUBLIC_FIREBASE_APP_ID) missing.push("NEXT_PUBLIC_FIREBASE_APP_ID");
  return missing;
}

/**
 * Fails fast with every missing variable name at once instead of one per request.
 * Called by `getFirebaseConfig()` so misconfiguration surfaces on first use.
 */
export function assertFirebaseConfig(): void {
  const missing = missingFirebaseEnv();
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}. ` +
        "Copy `.env.example` to `.env.local` and fill in the Firebase web config.",
    );
  }
}

export function getFirebaseConfig(): FirebaseConfig {
  assertFirebaseConfig();

  return {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
  };
}

export function isFirebaseEmulator(): boolean {
  return process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === "true";
}

export function emulatorHosts(): {
  firestore?: string;
  auth?: string;
  storage?: string;
} {
  const hosts: { firestore?: string; auth?: string; storage?: string } = {};
  if (process.env.FIRESTORE_EMULATOR_HOST) {
    hosts.firestore = process.env.FIRESTORE_EMULATOR_HOST;
  }
  if (process.env.FIREBASE_AUTH_EMULATOR_HOST) {
    hosts.auth = process.env.FIREBASE_AUTH_EMULATOR_HOST;
  }
  if (process.env.FIREBASE_STORAGE_EMULATOR_HOST) {
    hosts.storage = process.env.FIREBASE_STORAGE_EMULATOR_HOST;
  }
  return hosts;
}
