/**
 * Firebase Admin SDK (server-only).
 *
 * This module must ONLY be imported from server-side code (Server Actions,
 * API routes, route handlers). It initializes the Admin SDK with the service
 * account from environment variables and never leaks credentials to the client.
 *
 * Prefer Application Default Credentials via the Firebase Emulator Suite when
 * `FIRESTORE_EMULATOR_HOST` is set; otherwise use the service account from env.
 */

import { initializeApp, cert, type App, type AppOptions } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

let adminApp: App | null = null;
let adminAuth: Auth | null = null;
let adminDb: Firestore | null = null;

function serviceAccount() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (projectId && clientEmail && privateKey) {
    return {
      projectId,
      clientEmail,
      privateKey: privateKey.replace(/\\n/g, "\n"),
    };
  }

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY is not valid JSON.");
    }
  }

  throw new Error(
    "Missing Firebase Admin credentials. Set FIREBASE_PROJECT_ID, " +
      "FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY (or FIREBASE_SERVICE_ACCOUNT_KEY).",
  );
}

export function getAdminApp(): App {
  if (!adminApp) {
    const opts: AppOptions = {};

    if (process.env.FIRESTORE_EMULATOR_HOST || process.env.FIREBASE_AUTH_EMULATOR_HOST) {
      // Emulator: the Admin SDK connects without a service account. Only the project ID
      // is needed, and the public web config is not required on the server.
      opts.projectId =
        process.env.FIREBASE_PROJECT_ID ??
        process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ??
        "demo-entrepreneur-workspace";
    } else {
      const account = serviceAccount();
      opts.credential = cert(account);
      opts.projectId = account.projectId;
    }

    adminApp = initializeApp(opts);
  }
  return adminApp;
}

export function getAdminAuth(): Auth {
  if (!adminAuth) {
    adminAuth = getAuth(getAdminApp());
  }
  return adminAuth;
}

export function getAdminDb(): Firestore {
  if (!adminDb) {
    adminDb = getFirestore(getAdminApp());
  }
  return adminDb;
}
