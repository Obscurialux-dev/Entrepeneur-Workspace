/**
 * Firestore implementation of `ProductRepository` using the Firebase Admin SDK.
 *
 * Server-only: imported by Server Actions and route handlers. The Admin SDK bypasses
 * client security rules, so authorization is enforced by the caller
 * (`requirePermission`) and by `firestore.rules` for any direct client access.
 *
 * Data model (mirrors `docs/data-model.md`):
 * - `products/{productId}` holds product-level fields.
 * - `products/{productId}/variants/{variantId}` holds variants.
 *
 * Money is stored as integer IDR. Timestamps are written with
 * `FieldValue.serverTimestamp()` and converted to ISO strings on read so the domain
 * type (`Product`) keeps ISO strings like the JSON repository.
 */

import { randomUUID } from "node:crypto";
import {
  FieldValue,
  type DocumentSnapshot,
  type Firestore,
  type Query,
} from "firebase-admin/firestore";
import { getAdminDb } from "../../lib/firebase/admin.ts";
import {
  DEFAULT_PRODUCT_PAGE_SIZE,
  MAX_PRODUCT_PAGE_SIZE,
  type ListProductsParams,
  type ProductPage,
  ProductRepositoryError,
  type ProductRepository,
} from "./repository.ts";
import {
  matchesProductSearch,
  normalizeSku,
  productCreateData,
  productFromDoc,
  productUpdateData,
  variantCreateData,
  variantFromDoc,
  variantUpdateData,
} from "./repository.firestore.mapping.ts";
import type {
  Product,
  ProductDraft,
  ProductStatus,
  ProductVariant,
  VariantDraft,
} from "./types.ts";

const PRODUCTS_COLLECTION = "products";
const VARIANTS_SUBCOLLECTION = "variants";

/**
 * Upper bound on documents read for a free-text search. Firestore has no substring
 * operator, so search runs in memory over a bounded window. Replace with a search index
 * before the catalog approaches this size.
 */
const SEARCH_SCAN_LIMIT = 500;

export class FirestoreProductRepository implements ProductRepository {
  private readonly injectedDb: Firestore | undefined;

  /**
   * @param db Optional Firestore instance (tests / emulator). Defaults to the shared
   *   Admin SDK instance from `getAdminDb()`.
   */
  constructor(db?: Firestore) {
    this.injectedDb = db;
  }

  private async db(): Promise<Firestore> {
    return this.injectedDb ?? (await getAdminDb());
  }

  async list(params: ListProductsParams = {}): Promise<ProductPage> {
    const page = Math.max(1, Math.trunc(params.page ?? 1));
    const pageSize = Math.min(
      MAX_PRODUCT_PAGE_SIZE,
      Math.max(1, Math.trunc(params.pageSize ?? DEFAULT_PRODUCT_PAGE_SIZE)),
    );
    const search = params.search?.trim().toLowerCase() ?? "";
    const status = params.status ?? "all";

    const db = await this.db();
    let base: Query = db.collection(PRODUCTS_COLLECTION);
    if (status !== "all") {
      base = base.where("status", "==", status);
    }

    const offset = (page - 1) * pageSize;
    let total: number;
    let docs: DocumentSnapshot[];

    if (search === "") {
      const countSnapshot = await base.count().get();
      total = countSnapshot.data().count;

      const pageSnapshot = await base
        .orderBy("updatedAt", "desc")
        .offset(offset)
        .limit(pageSize)
        .get();
      docs = pageSnapshot.docs;
    } else {
      const scanSnapshot = await base
        .orderBy("updatedAt", "desc")
        .limit(SEARCH_SCAN_LIMIT)
        .get();
      const matched = scanSnapshot.docs.filter((snapshot) =>
        matchesProductSearch(snapshot.data(), search),
      );
      total = matched.length;
      docs = matched.slice(offset, offset + pageSize);
    }

    const variants = await Promise.all(docs.map((snapshot) => this.fetchVariants(snapshot.id)));

    return {
      items: docs.map((snapshot, index) => productFromDoc(snapshot, variants[index])),
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  private async fetchVariants(productId: string): Promise<ProductVariant[]> {
    const db = await this.db();
    const snapshot = await db
      .collection(PRODUCTS_COLLECTION)
      .doc(productId)
      .collection(VARIANTS_SUBCOLLECTION)
      .orderBy("createdAt", "asc")
      .get();

    return snapshot.docs.map((variant) => variantFromDoc(variant));
  }

  async getById(id: string): Promise<Product | null> {
    const db = await this.db();
    const snapshot = await db.collection(PRODUCTS_COLLECTION).doc(id).get();
    if (!snapshot.exists) return null;

    return productFromDoc(snapshot, await this.fetchVariants(id));
  }

  /** Reads a product that must exist; used after a successful write. */
  private async requireProduct(id: string): Promise<Product> {
    const product = await this.getById(id);
    if (!product) {
      throw new ProductRepositoryError("NOT_FOUND", "Produk tidak ditemukan.");
    }
    return product;
  }

  async create(draft: ProductDraft, actorUid: string): Promise<Product> {
    const db = await this.db();
    const sku = normalizeSku(draft.sku);

    const duplicate = await db
      .collection(PRODUCTS_COLLECTION)
      .where("sku", "==", sku)
      .limit(1)
      .get();
    if (!duplicate.empty) {
      throw new ProductRepositoryError(
        "DUPLICATE_SKU",
        `SKU "${sku}" sudah dipakai produk lain.`,
      );
    }

    const id = randomUUID();
    await db
      .collection(PRODUCTS_COLLECTION)
      .doc(id)
      .set(productCreateData(draft, actorUid));

    return this.requireProduct(id);
  }

  async update(id: string, draft: ProductDraft, actorUid: string): Promise<Product> {
    return this.modifyProduct(id, draft, actorUid);
  }

  async setStatus(
    id: string,
    status: ProductStatus,
    actorUid: string,
  ): Promise<Product> {
    const db = await this.db();
    const ref = db.collection(PRODUCTS_COLLECTION).doc(id);
    const snapshot = await ref.get();
    if (!snapshot.exists) {
      throw new ProductRepositoryError("NOT_FOUND", "Produk tidak ditemukan.");
    }

    await ref.update({
      status,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: actorUid,
    });

    return this.requireProduct(id);
  }

  private async modifyProduct(
    id: string,
    draft: ProductDraft,
    actorUid: string,
  ): Promise<Product> {
    const db = await this.db();
    const ref = db.collection(PRODUCTS_COLLECTION).doc(id);
    const snapshot = await ref.get();
    if (!snapshot.exists) {
      throw new ProductRepositoryError("NOT_FOUND", "Produk tidak ditemukan.");
    }

    const existing = snapshot.data() ?? {};
    const sku = normalizeSku(draft.sku);

    if (sku !== String(existing.sku ?? "")) {
      const duplicate = await db
        .collection(PRODUCTS_COLLECTION)
        .where("sku", "==", sku)
        .limit(1)
        .get();
      if (!duplicate.empty) {
        throw new ProductRepositoryError(
          "DUPLICATE_SKU",
          `SKU "${sku}" sudah dipakai produk lain.`,
        );
      }
    }

    // `update` only touches the listed fields, so createdAt/createdBy stay intact.
    await ref.update(productUpdateData(draft, actorUid));

    return this.requireProduct(id);
  }

  async addVariant(productId: string, draft: VariantDraft): Promise<Product> {
    const db = await this.db();
    const productRef = db.collection(PRODUCTS_COLLECTION).doc(productId);
    const productSnapshot = await productRef.get();
    if (!productSnapshot.exists) {
      throw new ProductRepositoryError("NOT_FOUND", "Produk tidak ditemukan.");
    }

    const variantsRef = productRef.collection(VARIANTS_SUBCOLLECTION);
    const sku = normalizeSku(draft.sku);
    const duplicate = await variantsRef.where("sku", "==", sku).limit(1).get();
    if (!duplicate.empty) {
      throw new ProductRepositoryError(
        "DUPLICATE_SKU",
        `SKU varian "${sku}" sudah dipakai varian lain pada produk ini.`,
      );
    }

    await variantsRef.doc(randomUUID()).set(variantCreateData(draft));

    return this.requireProduct(productId);
  }

  async updateVariant(
    productId: string,
    variantId: string,
    draft: VariantDraft,
  ): Promise<Product> {
    const db = await this.db();
    const productRef = db.collection(PRODUCTS_COLLECTION).doc(productId);
    const productSnapshot = await productRef.get();
    if (!productSnapshot.exists) {
      throw new ProductRepositoryError("NOT_FOUND", "Produk tidak ditemukan.");
    }

    const variantsRef = productRef.collection(VARIANTS_SUBCOLLECTION);
    const variantRef = variantsRef.doc(variantId);
    const variantSnapshot = await variantRef.get();
    if (!variantSnapshot.exists) {
      throw new ProductRepositoryError("NOT_FOUND", "Varian tidak ditemukan.");
    }

    const sku = normalizeSku(draft.sku);
    const existing = variantSnapshot.data() ?? {};
    if (sku !== String(existing.sku ?? "")) {
      const duplicate = await variantsRef.where("sku", "==", sku).limit(1).get();
      if (!duplicate.empty) {
        throw new ProductRepositoryError(
          "DUPLICATE_SKU",
          `SKU varian "${sku}" sudah dipakai varian lain pada produk ini.`,
        );
      }
    }

    await variantRef.update(variantUpdateData(draft));

    return this.requireProduct(productId);
  }

  async removeVariant(productId: string, variantId: string): Promise<Product> {
    const db = await this.db();
    const productRef = db.collection(PRODUCTS_COLLECTION).doc(productId);
    const productSnapshot = await productRef.get();
    if (!productSnapshot.exists) {
      throw new ProductRepositoryError("NOT_FOUND", "Produk tidak ditemukan.");
    }

    const variantRef = productRef.collection(VARIANTS_SUBCOLLECTION).doc(variantId);
    const variantSnapshot = await variantRef.get();
    if (!variantSnapshot.exists) {
      throw new ProductRepositoryError("NOT_FOUND", "Varian tidak ditemukan.");
    }

    await variantRef.delete();

    return this.requireProduct(productId);
  }
}

let repository: FirestoreProductRepository | null = null;

/**
 * Returns the process-wide Firestore product repository.
 *
 * Kept as a factory so callers depend on the `ProductRepository` contract and tests can
 * instantiate `FirestoreProductRepository` with an injected emulator instance.
 */
export function getProductRepository(): ProductRepository {
  if (!repository) {
    repository = new FirestoreProductRepository();
  }
  return repository;
}
