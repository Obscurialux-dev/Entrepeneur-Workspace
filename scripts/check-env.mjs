#!/usr/bin/env node
/**
 * Environment validation (T010).
 *
 * Prints only variable NAMES and presence flags — never values — so it is safe to run in
 * CI logs. Exits non-zero when a required variable is missing.
 *
 * Usage:
 *   npm run check:env
 */

const PUBLIC_FIREBASE = [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID",
];

const SERVER_FIREBASE = [
  "FIREBASE_PROJECT_ID",
  "FIREBASE_CLIENT_EMAIL",
  "FIREBASE_PRIVATE_KEY",
];

const GOOGLE_INTEGRATION = [
  "GOOGLE_OAUTH_CLIENT_ID",
  "GOOGLE_OAUTH_CLIENT_SECRET",
  "GOOGLE_OAUTH_REDIRECT_URI",
];

const usingEmulator =
  process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === "true" ||
  Boolean(process.env.FIRESTORE_EMULATOR_HOST) ||
  Boolean(process.env.FIREBASE_AUTH_EMULATOR_HOST);

const missing = (names) => names.filter((name) => !process.env[name]);
const present = (name) => (process.env[name] ? "diisi" : "kosong");

const errors = [];
const warnings = [];

console.log("Mode:", usingEmulator ? "Firebase Emulator Suite" : "Firebase production");
console.log("Publik (browser):", PUBLIC_FIREBASE.map((n) => `${n}=${present(n)}`).join(", "));

if (usingEmulator) {
  const projectId =
    process.env.FIREBASE_PROJECT_ID ?? process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  if (!projectId) {
    errors.push("FIREBASE_PROJECT_ID atau NEXT_PUBLIC_FIREBASE_PROJECT_ID wajib diisi.");
  }

  for (const name of ["FIRESTORE_EMULATOR_HOST", "FIREBASE_AUTH_EMULATOR_HOST"]) {
    const value = process.env[name];
    if (value && !/^[^:\s]+:\d+$/.test(value)) {
      errors.push(`${name} harus berformat host:port (contoh 127.0.0.1:8080).`);
    }
  }

  if (missing(PUBLIC_FIREBASE).length > 0) {
    warnings.push(
      `Konfigurasi web Firebase belum lengkap (${missing(PUBLIC_FIREBASE).join(", ")}); ` +
        "login browser dengan emulator tidak akan berjalan.",
    );
  }
} else {
  const publicMissing = missing(PUBLIC_FIREBASE);
  if (publicMissing.length > 0) {
    errors.push(`Variabel publik hilang: ${publicMissing.join(", ")}`);
  }

  const hasServiceAccountJson = Boolean(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  const missingServer = missing(SERVER_FIREBASE);

  if (!hasServiceAccountJson && missingServer.length > 0) {
    errors.push(
      `Kredensial Admin tidak lengkap: isi FIREBASE_SERVICE_ACCOUNT_KEY atau ${missingServer.join(", ")}.`,
    );
  }
}

if (missing(GOOGLE_INTEGRATION).length > 0) {
  warnings.push(
    `Integrasi Google belum dikonfigurasi (${missing(GOOGLE_INTEGRATION).join(", ")}); ` +
      "fitur kalender/Sheets masih ditunda.",
  );
}

if (process.env.WORKSPACE_PROTOTYPE_ROLE) {
  warnings.push(
    "WORKSPACE_PROTOTYPE_ROLE aktif: sesi masih bisa jatuh ke role prototipe. " +
      "Jangan dipakai di produksi.",
  );
}

for (const warning of warnings) console.warn("PERINGATAN:", warning);

if (errors.length > 0) {
  for (const error of errors) console.error("GAGAL:", error);
  process.exit(1);
}

console.log("OK: konfigurasi environment memenuhi syarat minimum.");
