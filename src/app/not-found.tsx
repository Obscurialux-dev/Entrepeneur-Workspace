import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-sm font-medium text-primary">404</p>
      <h1 className="text-2xl font-bold tracking-tight">
        Halaman tidak ditemukan
      </h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        Tautan yang Anda buka tidak tersedia atau sudah dipindahkan.
      </p>
      <Link href="/dashboard" className={buttonVariants({ className: "mt-2" })}>
        Kembali ke Dashboard
      </Link>
    </div>
  );
}

