/**
 * Pure mapping and serialization helpers for the Firestore product repository.
 *
 * Kept in a separate module without a Firestore instance or `@/` path aliases so the
 * behaviour can be unit tested with `node --test` without a database or emulator.
 *
 * Conventions:
 * - Money stays an integer IDR value.
 * - Timestamps are written with `FieldValue.serverTimestamp()` (server clock) and
 *   converted to ISO strings on read to match the `Product` domain type.
 * - Variant overrides use `null` to mean "inherit the product value".
 */

import { FieldValue, Timestamp } from "firebase-admin/firestore";
import type {
  Product,
  ProductDraft,
  ProductStatus,
  ProductVariant,
  VariantDraft,
} from "./types.ts";
import { PRODUCT_STATUSES } from "./types.ts";

/** Minimal structural shape shared by Admin SDK `DocumentSnapshot` values. */
export interface DocumentSnapshotLike {
  readonly id: string;
  data(): unknown;
}

export function normalizeSku(sku: string): string {
  return sku.trim().toUpperCase();
}

export function isProductStatus(value: unknown): value is ProductStatus {
  return typeof value === "string" && (PRODUCT_STATUSES as readonly string[]).includes(value);
}

/**
 * Converts a stored timestamp to an ISO string.
 *
 * Accepts Firestore `Timestamp`, `Date`, ISO strings, and timestamp-like objects
 * (for example values decoded by the emulator). Unknown values fall back to "now"
 * so a partially written document never breaks the list page.
 */
export function timestampToIso(value: unknown): string {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === "string") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
  }
  if (value !== null && typeof value === "object") {
    const candidate = value as { toDate?: unknown };
    if (typeof candidate.toDate === "function") {
      return (candidate as { toDate(): Date }).toDate().toISOString();
    }
  }
  return new Date().toISOString();
}

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

export function productFromDoc(
  productSnap: DocumentSnapshotLike,
  variants: ProductVariant[],
): Product {
  const data = asRecord(productSnap.data());

  return {
    id: productSnap.id,
    name: String(data.name ?? ""),
    sku: String(data.sku ?? ""),
    category: String(data.category ?? ""),
    description: String(data.description ?? ""),
    sellingPriceIdr: Number(data.sellingPriceIdr ?? 0),
    hppIdr: Number(data.hppIdr ?? 0),
    trackInventory: Boolean(data.trackInventory),
    status: isProductStatus(data.status) ? data.status : "research",
    variants,
    createdAt: timestampToIso(data.createdAt),
    updatedAt: timestampToIso(data.updatedAt),
    createdBy: String(data.createdBy ?? ""),
    updatedBy: String(data.updatedBy ?? ""),
  };
}

export function variantFromDoc(variantSnap: DocumentSnapshotLike): ProductVariant {
  const data = asRecord(variantSnap.data());
  const override = (value: unknown): number | null =>
    value === null || value === undefined ? null : Number(value);

  return {
    id: variantSnap.id,
    name: String(data.name ?? ""),
    sku: String(data.sku ?? ""),
    sellingPriceOverrideIdr: override(data.sellingPriceOverrideIdr),
    hppOverrideIdr: override(data.hppOverrideIdr),
    active: Boolean(data.active),
    createdAt: timestampToIso(data.createdAt),
    updatedAt: timestampToIso(data.updatedAt),
  };
}

/** Fields updated on every product write. `createdAt`/`createdBy` are never included. */
export function productUpdateData(
  draft: ProductDraft,
  actorUid: string,
): Record<string, unknown> {
  return {
    name: draft.name,
    sku: normalizeSku(draft.sku),
    category: draft.category,
    description: draft.description,
    sellingPriceIdr: draft.sellingPriceIdr,
    hppIdr: draft.hppIdr,
    trackInventory: draft.trackInventory,
    status: draft.status,
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: actorUid,
  };
}

export function productCreateData(
  draft: ProductDraft,
  actorUid: string,
): Record<string, unknown> {
  return {
    ...productUpdateData(draft, actorUid),
    createdAt: FieldValue.serverTimestamp(),
    createdBy: actorUid,
  };
}

/** Fields updated on every variant write. */
export function variantUpdateData(draft: VariantDraft): Record<string, unknown> {
  return {
    name: draft.name,
    sku: normalizeSku(draft.sku),
    sellingPriceOverrideIdr: draft.sellingPriceOverrideIdr,
    hppOverrideIdr: draft.hppOverrideIdr,
    active: draft.active,
    updatedAt: FieldValue.serverTimestamp(),
  };
}

export function variantCreateData(draft: VariantDraft): Record<string, unknown> {
  return {
    ...variantUpdateData(draft),
    createdAt: FieldValue.serverTimestamp(),
  };
}

/**
 * Case-insensitive match over name, SKU, and category.
 *
 * Firestore has no substring operator, so the repository fetches a bounded window and
 * applies this predicate in memory. Searching the full catalog needs a dedicated
 * index (for example Algolia/Typesense) before the catalog grows large.
 */
export function matchesProductSearch(data: unknown, search: string): boolean {
  const needle = search.trim().toLowerCase();
  if (needle === "") return true;

  const record = asRecord(data);
  return ["name", "sku", "category"].some((field) =>
    String(record[field] ?? "").toLowerCase().includes(needle),
  );
}
