"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function WorkspaceError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Workspace error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-center">
      <h2 className="text-xl font-semibold tracking-tight">
        Terjadi kesalahan
      </h2>
      <p className="max-w-md text-sm text-muted-foreground">
        Halaman gagal dimuat. Coba muat ulang; jika masalah berlanjut, hubungi
        pengurus divisi.
      </p>
      {error.digest && (
        <p className="font-mono text-xs text-muted-foreground">
          Kode: {error.digest}
        </p>
      )}
      <Button onClick={reset} className="mt-2">
        Coba lagi
      </Button>
    </div>
  );
}
