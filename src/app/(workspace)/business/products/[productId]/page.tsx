import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getRequestSession } from "@/lib/auth/session";
import { can } from "@/lib/permissions/policy";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ProductForm } from "@/features/products/components/product-form.tsx";
import { ProductStatusBadge } from "@/features/products/components/product-status-badge.tsx";
import { ProductStatusForm } from "@/features/products/components/product-status-form.tsx";
import { PersistenceNotice } from "@/features/products/components/persistence-notice.tsx";
import { VariantManager } from "@/features/products/components/variant-manager.tsx";
import { getProductRepository } from "@/features/products/repository.firestore.ts";
import { marginIdr, marginPercent, type Product } from "@/features/products/types.ts";

export const metadata: Metadata = { title: "Detail Produk" };

type Params = Promise<{ productId: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default function ProductDetailPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  return (
    <div className="space-y-6">
      <Link
        href="/business/products"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Kembali ke Produk
      </Link>
      <Suspense fallback={<ProductDetailSkeleton />}>
        <ProductDetail params={params} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function ProductDetail({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { productId } = await params;
  const product = await getProductRepository().getById(productId);

  if (!product) {
    notFound();
  }

  const search = await searchParams;
  const session = await getRequestSession();
  const canWrite = can(session.role, "products:write");
  const canManageStatus = can(session.role, "products:manage-status");
  const showCreatedBanner = search.created === "1";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight">{product.name}</h2>
            <ProductStatusBadge status={product.status} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            <span className="font-mono">{product.sku}</span> · {product.category}
          </p>
        </div>
      </div>

      {showCreatedBanner && (
        <p
          role="status"
          className="rounded-md bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-400"
        >
          Produk berhasil dibuat. Tambahkan varian bila produk memiliki ukuran atau model.
        </p>
      )}

      <PersistenceNotice role={session.role} isPrototype={session.isPrototype} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {canWrite ? "Detail Produk" : "Informasi Produk"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {canWrite ? (
                <ProductForm
                  mode="edit"
                  product={product}
                  cancelHref="/business/products"
                />
              ) : (
                <ReadOnlyProductSummary product={product} />
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Ringkasan Harga</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <SummaryRow label="Harga jual" value={formatCurrency(product.sellingPriceIdr)} />
              <SummaryRow label="HPP" value={formatCurrency(product.hppIdr)} />
              <SummaryRow
                label="Margin"
                value={`${formatCurrency(marginIdr(product.sellingPriceIdr, product.hppIdr))} (${
                  marginPercent(product.sellingPriceIdr, product.hppIdr)?.toLocaleString("id-ID") ?? "0"
                }%)`}
              />
              <SummaryRow
                label="Varian aktif"
                value={`${product.variants.filter((variant) => variant.active).length} / ${product.variants.length}`}
              />
              <SummaryRow
                label="Lacak inventaris"
                value={product.trackInventory ? "Ya" : "Tidak"}
              />
              <SummaryRow label="Dibuat" value={formatDate(product.createdAt)} />
              <SummaryRow label="Diperbarui" value={formatDate(product.updatedAt)} />
            </CardContent>
          </Card>

          {canManageStatus && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Status</CardTitle>
              </CardHeader>
              <CardContent>
                <ProductStatusForm product={product} />
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <VariantManager product={product} canWrite={canWrite} />
        </CardContent>
      </Card>
    </div>
  );
}

function ReadOnlyProductSummary({ product }: { product: Product }) {
  return (
    <dl className="grid gap-3 text-sm sm:grid-cols-2">
      <div>
        <dt className="text-xs uppercase tracking-wide text-muted-foreground">Nama</dt>
        <dd className="font-medium">{product.name}</dd>
      </div>
      <div>
        <dt className="text-xs uppercase tracking-wide text-muted-foreground">SKU</dt>
        <dd className="font-mono">{product.sku}</dd>
      </div>
      <div>
        <dt className="text-xs uppercase tracking-wide text-muted-foreground">Kategori</dt>
        <dd>{product.category}</dd>
      </div>
      <div>
        <dt className="text-xs uppercase tracking-wide text-muted-foreground">Status</dt>
        <dd>
          <ProductStatusBadge status={product.status} />
        </dd>
      </div>
      <div>
        <dt className="text-xs uppercase tracking-wide text-muted-foreground">Harga jual</dt>
        <dd className="font-medium">{formatCurrency(product.sellingPriceIdr)}</dd>
      </div>
      <div>
        <dt className="text-xs uppercase tracking-wide text-muted-foreground">HPP</dt>
        <dd>{formatCurrency(product.hppIdr)}</dd>
      </div>
      <div className="sm:col-span-2">
        <dt className="text-xs uppercase tracking-wide text-muted-foreground">Deskripsi</dt>
        <dd className="text-muted-foreground">
          {product.description === "" ? "—" : product.description}
        </dd>
      </div>
      <p className="sm:col-span-2 rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
        Role Anda hanya memiliki akses baca, sehingga formulir edit tidak ditampilkan. Server tetap
        menolak perubahan dari role ini.
      </p>
    </dl>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

function ProductDetailSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      <span className="sr-only">Memuat detail produk…</span>
      <div className="h-8 w-64 animate-pulse rounded-md bg-muted" />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="h-96 animate-pulse rounded-lg bg-muted lg:col-span-2" />
        <div className="h-96 animate-pulse rounded-lg bg-muted" />
      </div>
    </div>
  );
}

