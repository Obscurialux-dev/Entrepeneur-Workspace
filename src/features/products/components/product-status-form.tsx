"use client";

import { useActionState } from "react";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/shared/submit-button";
import { cn } from "@/lib/utils";
import { setProductStatusAction } from "../actions.ts";
import { INITIAL_FORM_STATE } from "../form-state.ts";
import type { Product } from "../types.ts";
import { PRODUCT_STATUS_LABELS, PRODUCT_STATUSES } from "../types.ts";
import { selectClasses } from "./form-classes.ts";

/**
 * Status changes are gated by the `products:manage-status` permission in the Server
 * Action; this component only renders the control.
 */
export function ProductStatusForm({ product }: { product: Product }) {
  const [state, formAction] = useActionState(setProductStatusAction, INITIAL_FORM_STATE);

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="productId" value={product.id} />

      <div className="space-y-1.5">
        <Label htmlFor="product-status">Ubah status produk</Label>
        <select
          id="product-status"
          name="status"
          defaultValue={product.status}
          className={selectClasses}
        >
          {PRODUCT_STATUSES.map((status) => (
            <option key={status} value={status}>
              {PRODUCT_STATUS_LABELS[status]}
            </option>
          ))}
        </select>
      </div>

      <SubmitButton variant="outline" size="sm" pendingLabel="Menyimpan status…">
        Simpan status
      </SubmitButton>

      {state.message && (
        <p
          role={state.status === "error" ? "alert" : "status"}
          className={cn(
            "text-xs",
            state.status === "error" ? "text-destructive" : "text-emerald-700 dark:text-emerald-400",
          )}
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
