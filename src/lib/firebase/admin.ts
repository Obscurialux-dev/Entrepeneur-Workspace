/**
 * Firebase Admin SDK (server-only).
 *
 * This module must ONLY be imported from server-side code (Server Actions,
 * API routes, route handlers). It initializes the Admin SDK with the service
 * account from environment variables and never leaks credentials to the client.
 *
 * Uses dynamic `import()` (with a variable module path) so Next.js/Turbopack
 * cannot statically analyze and externalize the `firebase-admin` package with
 * a hashed external identifier that the runtime cannot resolve.
 *
 * Prefer Application Default Credentials via the Firebase Emulator Suite when
 * `FIRESTORE_EMULATOR_HOST` is set; otherwise use the service account from env.
 */

import type { App, AppOptions } from "firebase-admin/app";
import type { Auth } from "firebase-admin/auth";
import type { Firestore } from "firebase-admin/firestore";

let adminAppInit: Promise<App> | null = null;
let adminAuthInit: Promise<Auth> | null = null;
let adminDbInit: Promise<Firestore> | null = null;

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

async function getAdminApp(): Promise<App> {
  if (!adminAppInit) {
    adminAppInit = (async () => {
      const firebaseAdminApp = ["firebase", "-admin", "/app"].join("");
      const { initializeApp, cert } = await import(firebaseAdminApp);
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

      return initializeApp(opts);
    })();
  }
  return adminAppInit;
}

async function getAdminAuth(): Promise<Auth> {
  if (!adminAuthInit) {
    adminAuthInit = (async () => {
      const app = await getAdminApp();
      const firebaseAdminAuth = ["firebase", "-admin", "/auth"].join("");
      const { getAuth } = await import(firebaseAdminAuth);
      return getAuth(app);
    })();
  }
  return adminAuthInit;
}

async function getAdminDb(): Promise<Firestore> {
  if (!adminDbInit) {
    adminDbInit = (async () => {
      const app = await getAdminApp();
      const firebaseAdminFirestore = ["firebase", "-admin", "/firestore"].join("");
      const { getFirestore } = await import(firebaseAdminFirestore);
      return getFirestore(app);
    })();
  }
  return adminDbInit;
}

export { getAdminApp, getAdminAuth, getAdminDb };
