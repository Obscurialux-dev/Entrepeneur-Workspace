import type { Product, ProductDraft, ProductStatus, VariantDraft } from "./types";

/**
 * Product persistence contract.
 *
 * The application depends on this interface, not on a concrete database. Production uses
 * `repository.firestore.ts` (Firebase Admin SDK, server-side) via `getProductRepository()`.
 * `repository.json.ts` remains as a local fallback/reference implementation for tests.
 *
 * Rules for implementers:
 * - Enforce SKU uniqueness (case-insensitive, normalized to uppercase).
 * - Never mutate an existing product's `createdAt`/`createdBy`.
 * - Store money as integer IDR.
 * - Return `ProductRepositoryError` with a stable `code` for known failure modes.
 */

export interface ListProductsParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: ProductStatus | "all";
}

export interface ProductPage {
  items: Product[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export type ProductRepositoryErrorCode = "DUPLICATE_SKU" | "NOT_FOUND" | "INVALID_DATA";

export class ProductRepositoryError extends Error {
  readonly code: ProductRepositoryErrorCode;

  constructor(code: ProductRepositoryErrorCode, message: string) {
    super(message);
    this.name = "ProductRepositoryError";
    this.code = code;
  }
}

export interface ProductRepository {
  list(params?: ListProductsParams): Promise<ProductPage>;
  getById(id: string): Promise<Product | null>;
  create(draft: ProductDraft, actorUid: string): Promise<Product>;
  update(id: string, draft: ProductDraft, actorUid: string): Promise<Product>;
  setStatus(id: string, status: ProductStatus, actorUid: string): Promise<Product>;
  addVariant(productId: string, draft: VariantDraft): Promise<Product>;
  updateVariant(productId: string, variantId: string, draft: VariantDraft): Promise<Product>;
  removeVariant(productId: string, variantId: string): Promise<Product>;
}

export const DEFAULT_PRODUCT_PAGE_SIZE = 10;
export const MAX_PRODUCT_PAGE_SIZE = 50;
