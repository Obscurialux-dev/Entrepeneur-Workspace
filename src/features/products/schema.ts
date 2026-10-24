import { z } from "zod";
import { parseIdrInput } from "./money.ts";
import { PRODUCT_STATUSES } from "./types.ts";

/**
 * Validation schemas for product data.
 *
 * These schemas are the server boundary: Server Actions parse `FormData` through them
 * before touching the repository. The client only renders the resulting messages —
 * it is never trusted to decide prices, HPP, or status.
 */

const SKU_PATTERN = /^[A-Z0-9][A-Z0-9-]{2,31}$/;

const skuSchema = z
  .string()
  .trim()
  .min(3, "SKU minimal 3 karakter.")
  .max(32, "SKU maksimal 32 karakter.")
  .transform((value) => value.toUpperCase())
  .refine((value) => SKU_PATTERN.test(value), {
    message: "SKU hanya boleh berisi huruf, angka, dan tanda hubung.",
  });

function requiredIdr(label: string, options: { allowZero?: boolean } = {}) {
  const { allowZero = false } = options;

  return z
    .string()
    .trim()
    .min(1, `${label} wajib diisi.`)
    .superRefine((value, ctx) => {
      const parsed = parseIdrInput(value);
      if (!parsed.ok) {
        ctx.addIssue({ code: "custom", message: `${label}: ${parsed.message}` });
        return;
      }
      if (!allowZero && parsed.value === 0) {
        ctx.addIssue({ code: "custom", message: `${label} harus lebih dari 0.` });
      }
    })
    .transform((value) => {
      const parsed = parseIdrInput(value);
      return parsed.ok ? parsed.value : 0;
    });
}

function optionalIdr(label: string) {
  return z
    .string()
    .trim()
    .superRefine((value, ctx) => {
      if (value === "") return;
      const parsed = parseIdrInput(value);
      if (!parsed.ok) {
        ctx.addIssue({ code: "custom", message: `${label}: ${parsed.message}` });
      }
    })
    .transform((value) => {
      if (value === "") return null;
      const parsed = parseIdrInput(value);
      return parsed.ok ? parsed.value : null;
    });
}

const checkboxSchema = z.preprocess(
  (value) => value === "on" || value === "true" || value === true,
  z.boolean(),
);

export const productFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Nama produk minimal 2 karakter.")
    .max(120, "Nama produk maksimal 120 karakter."),
  sku: skuSchema,
  category: z
    .string()
    .trim()
    .min(2, "Kategori minimal 2 karakter.")
    .max(60, "Kategori maksimal 60 karakter."),
  description: z.string().trim().max(2000, "Deskripsi maksimal 2000 karakter."),
  sellingPriceIdr: requiredIdr("Harga jual"),
  hppIdr: requiredIdr("HPP", { allowZero: true }),
  trackInventory: checkboxSchema,
  status: z.enum(PRODUCT_STATUSES, { message: "Status produk tidak dikenal." }),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;

export const variantFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Nama varian wajib diisi.")
    .max(60, "Nama varian maksimal 60 karakter."),
  sku: skuSchema,
  sellingPriceOverrideIdr: optionalIdr("Harga jual varian"),
  hppOverrideIdr: optionalIdr("HPP varian"),
  active: checkboxSchema,
});

export type VariantFormValues = z.infer<typeof variantFormSchema>;

export const productListQuerySchema = z.object({
  q: z.string().trim().max(80).catch(""),
  status: z.enum([...PRODUCT_STATUSES, "all"]).catch("all"),
  page: z.coerce.number().int().min(1).catch(1),
});

export type ProductListQuery = z.infer<typeof productListQuerySchema>;

/** Maps Zod issues to `{ field: message }` for form rendering. */
export function toFieldErrors(error: z.ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {};

  for (const issue of error.issues) {
    const key = issue.path.length > 0 ? String(issue.path[0]) : "_form";
    if (!(key in fieldErrors)) {
      fieldErrors[key] = issue.message;
    }
  }

  return fieldErrors;
}
