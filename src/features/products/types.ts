/**
 * Product domain model.
 *
 * Mirrors `docs/data-model.md` (`products/{productId}` + `variants/{variantId}`).
 * All money values are **integer rupiah (IDR)** — never floating point.
 * Variants are stored nested on the product document for the local prototype;
 * the repository contract keeps the same operations a Firestore subcollection needs.
 */

export const PRODUCT_STATUSES = ["research", "approved", "active", "archived"] as const;

export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

export const PRODUCT_STATUS_LABELS: Record<ProductStatus, string> = {
  research: "Riset",
  approved: "Disetujui",
  active: "Aktif",
  archived: "Diarsipkan",
};

export interface ProductVariant {
  id: string;
  name: string;
  sku: string;
  /** `null` means "use the product-level price". */
  sellingPriceOverrideIdr: number | null;
  /** `null` means "use the product-level HPP". */
  hppOverrideIdr: number | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  description: string;
  sellingPriceIdr: number;
  hppIdr: number;
  trackInventory: boolean;
  status: ProductStatus;
  variants: ProductVariant[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

/** Data required to create a product. Timestamps/IDs/audit fields are set by the repository. */
export interface ProductDraft {
  name: string;
  sku: string;
  category: string;
  description: string;
  sellingPriceIdr: number;
  hppIdr: number;
  trackInventory: boolean;
  status: ProductStatus;
}

export type VariantDraft = Omit<ProductVariant, "id" | "createdAt" | "updatedAt">;

export function effectiveSellingPrice(product: Product, variant?: ProductVariant | null): number {
  return variant?.sellingPriceOverrideIdr ?? product.sellingPriceIdr;
}

export function effectiveHpp(product: Product, variant?: ProductVariant | null): number {
  return variant?.hppOverrideIdr ?? product.hppIdr;
}

export function marginIdr(sellingPriceIdr: number, hppIdr: number): number {
  return sellingPriceIdr - hppIdr;
}

/** Margin percentage of the selling price, rounded to one decimal. `null` when price is 0. */
export function marginPercent(sellingPriceIdr: number, hppIdr: number): number | null {
  if (sellingPriceIdr <= 0) return null;
  return Math.round(((sellingPriceIdr - hppIdr) / sellingPriceIdr) * 1000) / 10;
}

export function activeVariants(product: Product): ProductVariant[] {
  return product.variants.filter((variant) => variant.active);
}

/** Lowest effective selling price across active variants (or the product price when none). */
export function startingPriceIdr(product: Product): number {
  const variants = activeVariants(product);
  if (variants.length === 0) return product.sellingPriceIdr;
  return Math.min(...variants.map((variant) => effectiveSellingPrice(product, variant)));
}
