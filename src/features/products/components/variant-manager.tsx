"use client";

import { useActionState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/shared/submit-button";
import { cn } from "@/lib/utils";
import { addVariantAction } from "../actions.ts";
import { INITIAL_FORM_STATE } from "../form-state.ts";
import type { Product } from "../types.ts";
import { VariantRow } from "./variant-row.tsx";

interface VariantManagerProps {
  product: Product;
  canWrite: boolean;
}

export function VariantManager({ product, canWrite }: VariantManagerProps) {
  const [addState, addAction] = useActionState(addVariantAction, INITIAL_FORM_STATE);
  const formRef = useRef<HTMLFormElement>(null);
  const errors = addState.fieldErrors ?? {};
  const activeCount = product.variants.filter((variant) => variant.active).length;

  useEffect(() => {
    if (addState.status === "success") {
      formRef.current?.reset();
    }
  }, [addState]);

  return (
    <section className="space-y-4" aria-labelledby="variants-heading">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 id="variants-heading" className="text-base font-semibold">
            Varian
          </h3>
          <p className="text-xs text-muted-foreground">
            {product.variants.length} varian · {activeCount} aktif. Harga/HPP override kosong
            berarti memakai nilai produk.
          </p>
        </div>
      </div>

      {product.variants.length === 0 ? (
        <p className="rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
          Belum ada varian. Produk dapat dijual tanpa varian, atau tambahkan varian di bawah.
        </p>
      ) : (
        <div className="space-y-3">
          {product.variants.map((variant) => (
            <VariantRow
              key={variant.id}
              product={product}
              variant={variant}
              canWrite={canWrite}
            />
          ))}
        </div>
      )}

      {canWrite && (
        <form
          ref={formRef}
          action={addAction}
          className="space-y-3 rounded-lg border border-dashed p-4"
          noValidate
        >
          <input type="hidden" name="productId" value={product.id} />

          <p className="text-sm font-medium">Tambah varian baru</p>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1">
              <Label htmlFor="new-variant-name">Nama varian</Label>
              <Input
                id="new-variant-name"
                name="name"
                placeholder="Ukuran L"
                aria-invalid={Boolean(errors.name)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="new-variant-sku">SKU</Label>
              <Input
                id="new-variant-sku"
                name="sku"
                placeholder="K-HIMA-26-L"
                autoCapitalize="characters"
                aria-invalid={Boolean(errors.sku)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="new-variant-price">Harga override</Label>
              <Input
                id="new-variant-price"
                name="sellingPriceOverrideIdr"
                inputMode="numeric"
                placeholder="Kosong = harga produk"
                aria-invalid={Boolean(errors.sellingPriceOverrideIdr)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="new-variant-hpp">HPP override</Label>
              <Input
                id="new-variant-hpp"
                name="hppOverrideIdr"
                inputMode="numeric"
                placeholder="Kosong = HPP produk"
                aria-invalid={Boolean(errors.hppOverrideIdr)}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="active"
                defaultChecked
                className="h-4 w-4 rounded border-input text-primary"
              />
              Aktif
            </label>

            <SubmitButton size="sm" pendingLabel="Menambahkan…" className="ml-auto">
              Tambah varian
            </SubmitButton>
          </div>

          {addState.message && (
            <p
              role={addState.status === "error" ? "alert" : "status"}
              className={cn(
                "text-xs",
                addState.status === "error"
                  ? "text-destructive"
                  : "text-emerald-700 dark:text-emerald-400",
              )}
            >
              {addState.message}
            </p>
          )}
        </form>
      )}
    </section>
  );
}

