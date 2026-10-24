"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/shared/submit-button";
import { cn } from "@/lib/utils";
import { createProductAction, updateProductAction } from "../actions.ts";
import { INITIAL_FORM_STATE } from "../form-state.ts";
import { formatIdrAmount } from "../money.ts";
import { PRODUCT_STATUS_LABELS, PRODUCT_STATUSES, type Product } from "../types.ts";

interface ProductFormProps {
  mode: "create" | "edit";
  product?: Product;
  cancelHref: string;
}

const selectClasses =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

export function ProductForm({ mode, product, cancelHref }: ProductFormProps) {
  const [state, formAction] = useActionState(
    mode === "create" ? createProductAction : updateProductAction,
    INITIAL_FORM_STATE,
  );

  const fieldErrors = state.fieldErrors ?? {};
  const describedBy = (field: string) =>
    fieldErrors[field] ? `product-${field}-error` : undefined;

  return (
    <form action={formAction} className="space-y-5" noValidate>
      {mode === "edit" && product && <input type="hidden" name="productId" value={product.id} />}

      {state.status !== "idle" && state.message && (
        <p
          role={state.status === "error" ? "alert" : "status"}
          className={cn(
            "rounded-md px-3 py-2 text-sm",
            state.status === "error"
              ? "bg-destructive/10 text-destructive"
              : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
          )}
        >
          {state.message}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="name">Nama produk</Label>
          <Input
            id="name"
            name="name"
            defaultValue={product?.name ?? ""}
            placeholder="Kaos HIMA Edisi 2026"
            aria-invalid={Boolean(fieldErrors.name)}
            aria-describedby={describedBy("name")}
          />
          <FieldError id="product-name-error" message={fieldErrors.name} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="sku">SKU</Label>
          <Input
            id="sku"
            name="sku"
            defaultValue={product?.sku ?? ""}
            placeholder="K-HIMA-26"
            autoCapitalize="characters"
            aria-invalid={Boolean(fieldErrors.sku)}
            aria-describedby={describedBy("sku")}
          />
          <FieldError id="product-sku-error" message={fieldErrors.sku} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="category">Kategori</Label>
          <Input
            id="category"
            name="category"
            defaultValue={product?.category ?? ""}
            placeholder="Apparel"
            aria-invalid={Boolean(fieldErrors.category)}
            aria-describedby={describedBy("category")}
          />
          <FieldError id="product-category-error" message={fieldErrors.category} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            name="status"
            defaultValue={product?.status ?? "research"}
            className={selectClasses}
            aria-describedby={describedBy("status")}
          >
            {PRODUCT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {PRODUCT_STATUS_LABELS[status]}
              </option>
            ))}
          </select>
          <FieldError id="product-status-error" message={fieldErrors.status} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="sellingPriceIdr">Harga jual (IDR)</Label>
          <Input
            id="sellingPriceIdr"
            name="sellingPriceIdr"
            inputMode="numeric"
            defaultValue={product ? formatIdrAmount(product.sellingPriceIdr) : ""}
            placeholder="95.000"
            aria-invalid={Boolean(fieldErrors.sellingPriceIdr)}
            aria-describedby={
              describedBy("sellingPriceIdr") ?? "product-sellingPriceIdr-hint"
            }
          />
          <p id="product-sellingPriceIdr-hint" className="text-xs text-muted-foreground">
            Bilangan bulat rupiah; titik pemisah ribuan diperbolehkan.
          </p>
          <FieldError id="product-sellingPriceIdr-error" message={fieldErrors.sellingPriceIdr} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="hppIdr">HPP (IDR)</Label>
          <Input
            id="hppIdr"
            name="hppIdr"
            inputMode="numeric"
            defaultValue={product ? formatIdrAmount(product.hppIdr) : ""}
            placeholder="60.000"
            aria-invalid={Boolean(fieldErrors.hppIdr)}
            aria-describedby={describedBy("hppIdr") ?? "product-hppIdr-hint"}
          />
          <p id="product-hppIdr-hint" className="text-xs text-muted-foreground">
            Boleh 0 bila biaya produksi belum tercatat.
          </p>
          <FieldError id="product-hppIdr-error" message={fieldErrors.hppIdr} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Deskripsi</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={product?.description ?? ""}
          placeholder="Bahan, ukuran, dan catatan produksi."
          aria-invalid={Boolean(fieldErrors.description)}
          aria-describedby={describedBy("description")}
        />
        <FieldError id="product-description-error" message={fieldErrors.description} />
      </div>

      <div className="flex items-start gap-2">
        <input
          id="trackInventory"
          name="trackInventory"
          type="checkbox"
          defaultChecked={product?.trackInventory ?? true}
          className="mt-0.5 h-4 w-4 rounded border-input text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
        <div>
          <Label htmlFor="trackInventory">Lacak inventaris</Label>
          <p className="text-xs text-muted-foreground">
            Aktifkan bila stok produk ini perlu dicatat per varian.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t pt-4">
        <SubmitButton
          pendingLabel={mode === "create" ? "Menyimpan produk…" : "Memperbarui…"}
        >
          {mode === "create" ? "Simpan Produk" : "Perbarui Produk"}
        </SubmitButton>
        <Link href={cancelHref} className={buttonVariants({ variant: "ghost" })}>
          Batal
        </Link>
        <Button variant="link" className="ml-auto px-0 text-xs" type="reset">
          Reset isian
        </Button>
      </div>
    </form>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;

  return (
    <p id={id} className="text-xs text-destructive">
      {message}
    </p>
  );
}

