"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { getClientAuth } from "@/lib/firebase/client.ts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSignIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const auth = getClientAuth();
      await signInWithEmailAndPassword(auth, email, password);

      const user = auth.currentUser;
      if (!user) {
        throw new Error("Pengguna tidak tersedia setelah login.");
      }
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
      console.error("Sign-in error:", err);
      setError("Email atau kata sandi salah. Coba lagi.");
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

          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                placeholder="nama@contoh.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Kata sandi</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Memproses..." : "Masuk"}
            </Button>
          </form>

          <p className="mt-6 text-sm text-muted-foreground text-center">
            Belum memiliki akses? Hubungi admin Divisi Entrepreneur untuk
            mendaftarkan akun Anda.
          </p>
        </div>
      </main>
    </div>
  );
}
