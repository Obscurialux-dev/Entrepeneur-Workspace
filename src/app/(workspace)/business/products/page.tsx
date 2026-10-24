import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/shared/empty-state";
import { getRequestSession } from "@/lib/auth/session";
import { can } from "@/lib/permissions/policy";
import { cn, formatCurrency, formatRelativeTime } from "@/lib/utils";
import { selectClasses } from "@/features/products/components/form-classes.ts";
import { ProductStatusBadge } from "@/features/products/components/product-status-badge.tsx";
import { PersistenceNotice } from "@/features/products/components/persistence-notice.tsx";
import { getProductRepository } from "@/features/products/repository.firestore.ts";
import { productListQuerySchema, type ProductListQuery } from "@/features/products/schema.ts";
import {
  marginPercent,
  PRODUCT_STATUSES,
  PRODUCT_STATUS_LABELS,
} from "@/features/products/types.ts";

export const metadata: Metadata = { title: "Produk" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function ProductsPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await getRequestSession();
  const canWrite = can(session.role, "products:write");

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Produk</h2>
          <p className="text-sm text-muted-foreground">
            Katalog produk dan varian beserta harga jual, HPP, dan margin.
          </p>
        </div>
        {canWrite && (
          <Link href="/business/products/new" className={buttonVariants({ size: "sm" })}>
            + Tambah Produk
          </Link>
        )}
      </div>

      <PersistenceNotice role={session.role} isPrototype={session.isPrototype} />

      <Suspense fallback={<ProductsSkeleton />}>
        <ProductsContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function ProductsContent({ searchParams }: { searchParams: SearchParams }) {
  const raw = await searchParams;
  const query = productListQuerySchema.parse({
    q: raw.q,
    status: raw.status,
    page: raw.page,
  });

  const result = await getProductRepository().list({
    page: query.page,
    search: query.q,
    status: query.status,
  });

  const hasFilters = query.q !== "" || query.status !== "all";

  return (
    <div className="space-y-4">
      <ProductFilters query={query} />

      <Card>
        <CardContent className="p-0">
          {result.items.length === 0 ? (
            <div className="p-6">
              <EmptyState
                title={hasFilters ? "Tidak ada produk yang cocok" : "Belum ada produk"}
                description={
                  hasFilters
                    ? "Ubah kata kunci atau filter status untuk melihat produk lain."
                    : "Tambahkan produk pertama untuk mulai menyusun katalog dan Open PO."
                }
                action={
                  hasFilters
                    ? { label: "Reset filter", href: "/business/products" }
                    : { label: "Tambah Produk", href: "/business/products/new" }
                }
              />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <caption className="sr-only">Daftar produk</caption>
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <Th>Produk</Th>
                      <Th className="hidden md:table-cell">Kategori</Th>
                      <Th align="right">Harga jual</Th>
                      <Th align="right" className="hidden sm:table-cell">
                        HPP
                      </Th>
                      <Th align="right" className="hidden lg:table-cell">
                        Margin
                      </Th>
                      <Th className="hidden sm:table-cell">Varian</Th>
                      <Th>Status</Th>
                      <Th className="hidden lg:table-cell">Diperbarui</Th>
                      <Th align="right">Aksi</Th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {result.items.map((product) => {
                      const margin = marginPercent(product.sellingPriceIdr, product.hppIdr);
                      const activeVariants = product.variants.filter((variant) => variant.active);

                      return (
                        <tr key={product.id} className="hover:bg-muted/30">
                          <td className="px-4 py-3">
                            <Link
                              href={`/business/products/${product.id}`}
                              className="font-medium hover:underline"
                            >
                              {product.name}
                            </Link>
                            <p className="font-mono text-xs text-muted-foreground">
                              {product.sku}
                            </p>
                          </td>
                          <td className="hidden px-4 py-3 text-sm text-muted-foreground md:table-cell">
                            {product.category}
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-medium">
                            {formatCurrency(product.sellingPriceIdr)}
                          </td>
                          <td className="hidden px-4 py-3 text-right text-sm text-muted-foreground sm:table-cell">
                            {formatCurrency(product.hppIdr)}
                          </td>
                          <td className="hidden px-4 py-3 text-right text-sm lg:table-cell">
                            {margin === null ? (
                              <span className="text-muted-foreground">—</span>
                            ) : (
                              <span
                                className={cn(
                                  "font-medium",
                                  margin < 0 && "text-destructive",
                                  margin >= 0 &&
                                    margin < 20 &&
                                    "text-amber-600 dark:text-amber-400",
                                )}
                              >
                                {margin.toLocaleString("id-ID")}%
                              </span>
                            )}
                          </td>
                          <td className="hidden px-4 py-3 text-sm text-muted-foreground sm:table-cell">
                            {product.variants.length === 0
                              ? "—"
                              : `${activeVariants.length}/${product.variants.length} aktif`}
                          </td>
                          <td className="px-4 py-3">
                            <ProductStatusBadge status={product.status} />
                          </td>
                          <td className="hidden px-4 py-3 text-xs text-muted-foreground lg:table-cell">
                            {formatRelativeTime(product.updatedAt)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Link
                              href={`/business/products/${product.id}`}
                              className={buttonVariants({ variant: "ghost", size: "sm" })}
                            >
                              Kelola
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 border-t px-4 py-3 text-sm text-muted-foreground">
                <p>
                  Menampilkan {result.items.length} dari {result.total} produk · halaman{" "}
                  {result.page} / {result.totalPages}
                </p>
                {result.totalPages > 1 && (
                  <div className="flex items-center gap-2">
                    <PageLink query={query} page={result.page - 1} disabled={result.page <= 1}>
                      Sebelumnya
                    </PageLink>
                    <PageLink
                      query={query}
                      page={result.page + 1}
                      disabled={result.page >= result.totalPages}
                    >
                      Berikutnya
                    </PageLink>
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


function Th({
  children,
  className,
  align = "left",
}: {
  children: React.ReactNode;
  className?: string;
  align?: "left" | "right";
}) {
  return (
    <th
      scope="col"
      className={cn(
        "px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground",
        align === "right" ? "text-right" : "text-left",
        className,
      )}
    >
      {children}
    </th>
  );
}

function PageLink({
  query,
  page,
  disabled,
  children,
}: {
  query: ProductListQuery;
  page: number;
  disabled: boolean;
  children: React.ReactNode;
}) {
  if (disabled || page < 1) {
    return (
      <span
        aria-disabled="true"
        className={cn(buttonVariants({ variant: "outline", size: "sm" }), "pointer-events-none opacity-50")}
      >
        {children}
      </span>
    );
  }

  const params = new URLSearchParams();
  if (query.q !== "") params.set("q", query.q);
  if (query.status !== "all") params.set("status", query.status);
  if (page > 1) params.set("page", String(page));

  const search = params.toString();

  return (
    <Link
      href={`/business/products${search ? `?${search}` : ""}`}
      className={buttonVariants({ variant: "outline", size: "sm" })}
    >
      {children}
    </Link>
  );
}


function ProductFilters({ query }: { query: ProductListQuery }) {
  return (
    <Card>
      <CardContent className="p-4">
        <form method="get" className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="product-search">Cari produk</Label>
            <Input
              id="product-search"
              name="q"
              defaultValue={query.q}
              placeholder="Nama, SKU, atau kategori"
            />
          </div>

          <div className="space-y-1.5 sm:w-52">
            <Label htmlFor="product-status-filter">Status</Label>
            <select
              id="product-status-filter"
              name="status"
              defaultValue={query.status}
              className={selectClasses}
            >
              <option value="all">Semua status</option>
              {PRODUCT_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {PRODUCT_STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            <Button type="submit" size="sm">
              Terapkan
            </Button>
            <Link
              href="/business/products"
              className={buttonVariants({ variant: "ghost", size: "sm" })}
            >
              Reset
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function ProductsSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-live="polite">
      <span className="sr-only">Memuat daftar produk…</span>
      <div className="h-20 animate-pulse rounded-lg bg-muted" />
      <div className="h-72 animate-pulse rounded-lg bg-muted" />
    </div>
  );
}
