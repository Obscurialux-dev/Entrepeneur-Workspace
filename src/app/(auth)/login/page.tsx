"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { getClientAuth } from "@/lib/firebase/client.ts";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSignInWithGoogle() {
    setError(null);
    setLoading(true);
    try {
      const auth = getClientAuth();
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);

      const user = result.user;
      const idToken = await user.getIdToken();

      const response = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data.error ?? "Gagal membuat sesi.");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      console.error("Google sign-in error:", err);
      setError("Gagal masuk dengan Google. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-full flex flex-col bg-background text-foreground">
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h1 className="text-2xl font-bold">Masuk ke Workspace</h1>
            <p className="text-muted-foreground mt-2">
              Masuk dengan akun Divisi Entrepreneur HIMA Anda untuk mengakses
              workspace.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3 rounded border border-destructive bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}

          <Button
            onClick={handleSignInWithGoogle}
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 2 5.373 2 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Memproses...
              </>
            ) : (
              <>
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  ></path>
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.49H2.18v2.84C3.99 24.53 7.7 25 12 25z"
                  ></path>
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.26-.63-.4-1.35-.4-2.09s.14-1.46.4-2.09l3.71-2.6c.3.42.69.67 1.14.82v2.77H5.84z"
                  ></path>
                  <path
                    fill="#EB4335"
                    d="M12 23c4.3 0 8.01-.47 9.82-2.58l-3.57-2.77c-.87.4-1.84.61-2.86.61-2.26 0-4.22-1.22-5.25-3.04v-2.77h3.57c.64 1.47 1.61 2.66 2.77 3.41 1.54-.12 2.7-1.35 2.7-3.04 0-1.69-.81-3.2-2.11-4.21l3.26-2.28C20.96 12.95 23 10.39 23 7.25c0-4.17-3.33-7.5-7.5-7.5-1.41 0-2.71.33-3.87.92L15.75 2.52C19.09 1.78 22.56 4.01 22.56 7.25c0 1.22-.17 2.4-.5 3.53l-3.57 2.77c.94-.64 1.5-1.72 1.5-2.95 0-2.08-1.5-3.85-3.57-4.24l-3.71 2.6c-.25-.34-.58-.65-.99-.85v-2.77H5.84c1.39 2.07 2.16 4.56 2.16 7.25 0 2.69-.77 5.18-2.03 7.15l3.26 2.28c1.26-.93 2.04-2.35 2.04-3.95 0-1.51-.64-2.89-1.72-3.82l-3.71 2.6C4.35 8.34 2 10.82 2 13.75c0 3.14 2.04 5.75 4.75 6.58l3.57-2.77c-.66.8-1.05 1.78-1.05 2.84 0 1.61 1.04 3.05 2.45 3.65 1.22-.29 2.09-.95 2.45-1.65z"
                  ></path>
                </svg>
                Masuk dengan Google
              </>
            )}
          </Button>

          <p className="mt-6 text-sm text-muted-foreground text-center">
            Belum memiliki akses? Hubungi admin Divisi Entrepreneur untuk
            mendaftarkan akun Anda.
          </p>
        </div>
      </main>
    </div>
  );
}
