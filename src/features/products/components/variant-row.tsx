"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { SubmitButton } from "@/components/shared/submit-button";
import { cn, formatCurrency } from "@/lib/utils";
import { removeVariantAction, updateVariantAction } from "../actions.ts";
import { INITIAL_FORM_STATE } from "../form-state.ts";
import { formatIdrAmount } from "../money.ts";
import {
  effectiveHpp,
  effectiveSellingPrice,
  type Product,
  type ProductVariant,
} from "../types.ts";

interface VariantRowProps {
  product: Product;
  variant: ProductVariant;
  canWrite: boolean;
}

export function VariantRow({ product, variant, canWrite }: VariantRowProps) {
  const [updateState, updateAction] = useActionState(updateVariantAction, INITIAL_FORM_STATE);
  const [deleteState, deleteAction] = useActionState(removeVariantAction, INITIAL_FORM_STATE);
  const errors = updateState.fieldErrors ?? {};

  if (!canWrite) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border px-4 py-3 text-sm">
        <div>
          <span className="font-medium">{variant.name}</span>
          <span className="ml-2 font-mono text-xs text-muted-foreground">{variant.sku}</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>{formatCurrency(effectiveSellingPrice(product, variant))}</span>
          <Badge variant={variant.active ? "success" : "secondary"}>
            {variant.active ? "Aktif" : "Nonaktif"}
          </Badge>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <form action={updateAction} className="space-y-3 p-4" noValidate>
        <input type="hidden" name="productId" value={product.id} />
        <input type="hidden" name="variantId" value={variant.id} />

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1">
            <Label htmlFor={`variant-${variant.id}-name`}>Nama varian</Label>
            <Input
              id={`variant-${variant.id}-name`}
              name="name"
              defaultValue={variant.name}
              aria-invalid={Boolean(errors.name)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor={`variant-${variant.id}-sku`}>SKU</Label>
            <Input
              id={`variant-${variant.id}-sku`}
              name="sku"
              defaultValue={variant.sku}
              autoCapitalize="characters"
              aria-invalid={Boolean(errors.sku)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor={`variant-${variant.id}-price`}>Harga override</Label>
            <Input
              id={`variant-${variant.id}-price`}
              name="sellingPriceOverrideIdr"
              inputMode="numeric"
              defaultValue={
                variant.sellingPriceOverrideIdr === null
                  ? ""
                  : formatIdrAmount(variant.sellingPriceOverrideIdr)
              }
              placeholder="Kosong = harga produk"
              aria-invalid={Boolean(errors.sellingPriceOverrideIdr)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor={`variant-${variant.id}-hpp`}>HPP override</Label>
            <Input
              id={`variant-${variant.id}-hpp`}
              name="hppOverrideIdr"
              inputMode="numeric"
              defaultValue={
                variant.hppOverrideIdr === null ? "" : formatIdrAmount(variant.hppOverrideIdr)
              }
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
              defaultChecked={variant.active}
              className="h-4 w-4 rounded border-input text-primary"
            />
            Aktif
          </label>

          <span className="text-xs text-muted-foreground">
            Efektif: {formatCurrency(effectiveSellingPrice(product, variant))} · HPP{" "}
            {formatCurrency(effectiveHpp(product, variant))}
          </span>

          <SubmitButton size="sm" variant="outline" className="ml-auto" pendingLabel="Menyimpan…">
            Simpan varian
          </SubmitButton>
        </div>

        {updateState.message && (
          <p
            role={updateState.status === "error" ? "alert" : "status"}
            className={cn(
              "text-xs",
              updateState.status === "error"
                ? "text-destructive"
                : "text-emerald-700 dark:text-emerald-400",
            )}
          >
            {updateState.message}
          </p>
        )}
      </form>


      <form
        action={deleteAction}
        className="flex flex-wrap items-center gap-3 border-t px-4 py-2"
        onSubmit={(event) => {
          if (!window.confirm(`Hapus varian "${variant.name}"?`)) {
            event.preventDefault();
          }
        }}
      >
        <input type="hidden" name="productId" value={product.id} />
        <input type="hidden" name="variantId" value={variant.id} />
        <SubmitButton
          size="sm"
          variant="ghost"
          className="text-destructive"
          pendingLabel="Menghapus…"
        >
          Hapus varian
        </SubmitButton>
        {deleteState.message && (
          <p
            role={deleteState.status === "error" ? "alert" : "status"}
            className={cn(
              "text-xs",
              deleteState.status === "error"
                ? "text-destructive"
                : "text-emerald-700 dark:text-emerald-400",
            )}
          >
            {deleteState.message}
          </p>
        )}
      </form>
    </div>
  );
}

