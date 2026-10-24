import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { getRequestSession } from "@/lib/auth/session";
import { can } from "@/lib/permissions/policy";
import { ProductForm } from "@/features/products/components/product-form.tsx";

export const metadata: Metadata = { title: "Tambah Produk" };

export default async function NewProductPage() {
  const session = await getRequestSession();

  if (!can(session.role, "products:write")) {
    redirect("/business/products");
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Link
          href="/business/products"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Kembali ke Produk
        </Link>
        <h2 className="text-2xl font-bold tracking-tight">Tambah Produk</h2>
        <p className="text-sm text-muted-foreground">
          Harga dan HPP disimpan sebagai bilangan bulat rupiah. Varian dapat ditambahkan setelah
          produk dibuat.
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          <ProductForm mode="create" cancelHref="/business/products" />
        </CardContent>
      </Card>
    </div>
  );
}
