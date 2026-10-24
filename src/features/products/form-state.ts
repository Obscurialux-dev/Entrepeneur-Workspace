/**
 * Shared form state for product Server Actions.
 *
 * Kept in its own module because a `"use server"` file may only export async functions.
 */

export type FormStateStatus = "idle" | "success" | "error";

export interface FormState {
  status: FormStateStatus;
  message?: string;
  fieldErrors?: Record<string, string>;
  /** Submitted raw values, echoed back so the form is not cleared on validation errors. */
  values?: Record<string, string>;
}

export const INITIAL_FORM_STATE: FormState = { status: "idle" };

export const PRODUCT_FORM_FIELDS = [
  "name",
  "sku",
  "category",
  "description",
  "sellingPriceIdr",
  "hppIdr",
  "trackInventory",
  "status",
] as const;

export const VARIANT_FORM_FIELDS = [
  "name",
  "sku",
  "sellingPriceOverrideIdr",
  "hppOverrideIdr",
  "active",
] as const;
