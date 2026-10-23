import Link from "next/link";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-4">
          <Link href="/po" className="text-base font-semibold tracking-tight">
            Entrepreneur <span className="text-primary">Open PO</span>
          </Link>
          <nav aria-label="Navigasi publik">
            <Link
              href="/po"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Kampanye Aktif
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        {children}
      </main>
      <footer className="border-t bg-card">
        <div className="mx-auto w-full max-w-5xl px-4 py-6 text-center text-xs text-muted-foreground">
          Divisi Entrepreneur HIMA · Formulir pemesanan tidak memerlukan akun internal.
        </div>
      </footer>
    </div>
  );
}
