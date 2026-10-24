/**
 * Client-side Firebase app.
 *
 * Imported only from browser code (event handlers, `'use client'` components,
 * client-side auth flows). Never imports or re-exports Admin SDK credentials.
 */

import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import {
  connectAuthEmulator,
  getAuth,
  type Auth,
} from "firebase/auth";
import {
  connectFirestoreEmulator,
  getFirestore,
  type Firestore,
} from "firebase/firestore";
import {
  getFirebaseConfig,
  isFirebaseEmulator,
  emulatorHosts,
} from "./config.ts";

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

export function getFirebaseApp(): FirebaseApp {
  if (!app) {
    if (getApps().length === 0) {
      app = initializeApp(getFirebaseConfig());
    } else {
      app = getApps()[0];
    }
  }
  return app;
}

export function getClientAuth(): Auth {
  if (!auth) {
    auth = getAuth(getFirebaseApp());
    if (typeof window !== "undefined" && isFirebaseEmulator()) {
      const { auth: authHost } = emulatorHosts();
      if (authHost) {
        connectAuthEmulator(auth, `http://${authHost}`);
      }
    }
  }
  return auth;
}

export function getClientDb(): Firestore {
  if (!db) {
    db = getFirestore(getFirebaseApp());
    if (typeof window !== "undefined" && isFirebaseEmulator()) {
      const { firestore: firestoreHost } = emulatorHosts();
      if (firestoreHost) {
        const [host, port] = firestoreHost.split(":");
        connectFirestoreEmulator(db, host, Number(port));
      }
    }
  }
  return db;
}
