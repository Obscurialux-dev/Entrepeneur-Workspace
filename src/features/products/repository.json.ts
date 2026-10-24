import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import {
  DEFAULT_PRODUCT_PAGE_SIZE,
  MAX_PRODUCT_PAGE_SIZE,
  type ListProductsParams,
  type ProductPage,
  ProductRepositoryError,
  type ProductRepository,
} from "./repository.ts";
import type { Product, ProductDraft, ProductStatus, ProductVariant, VariantDraft } from "./types.ts";

/**
 * Local JSON-file implementation of `ProductRepository`.
 *
 * Real persistence for local development (survives restarts), but explicitly a prototype:
 * - Single process only. Writes are serialized in-process and committed with write+rename.
 * - No multi-user concurrency control beyond that lock.
 * - Must not be imported from client components (it depends on `node:fs`).
 *
 * Replace with a Firestore implementation before deployment.
 */

interface ProductDataFile {
  version: 1;
  products: Product[];
}

const EMPTY_DATA: ProductDataFile = { version: 1, products: [] };

let writeQueue: Promise<unknown> = Promise.resolve();

function serialize<T>(task: () => Promise<T>): Promise<T> {
  const run = writeQueue.then(task, task);
  writeQueue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

function normalizeSku(sku: string): string {
  return sku.trim().toUpperCase();
}

function nowIso(): string {
  return new Date().toISOString();
}

function cloneProduct(product: Product): Product {
  return {
    ...product,
    variants: product.variants.map((variant) => ({ ...variant })),
  };
}

export function defaultProductDataFilePath(): string {
  const dir = process.env.PRODUCTS_DATA_DIR?.trim() || join(process.cwd(), ".data");
  return join(dir, "products.json");
}

export class JsonProductRepository implements ProductRepository {
  private readonly filePath: string;

  constructor(filePath: string) {
    this.filePath = filePath;
  }

  async list(params: ListProductsParams = {}): Promise<ProductPage> {
    const page = Math.max(1, Math.trunc(params.page ?? 1));
    const requestedSize = Math.trunc(params.pageSize ?? DEFAULT_PRODUCT_PAGE_SIZE);
    const pageSize = Math.min(MAX_PRODUCT_PAGE_SIZE, Math.max(1, requestedSize));
    const search = params.search?.trim().toLowerCase() ?? "";
    const status = params.status ?? "all";

    const data = await this.readData();

    const filtered = data.products
      .filter((product) => (status === "all" ? true : product.status === status))
      .filter((product) => {
        if (search === "") return true;
        return (
          product.name.toLowerCase().includes(search) ||
          product.sku.toLowerCase().includes(search) ||
          product.category.toLowerCase().includes(search)
        );
      })
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt) || a.name.localeCompare(b.name));

    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const start = (page - 1) * pageSize;

    return {
      items: filtered.slice(start, start + pageSize).map(cloneProduct),
      total,
      page,
      pageSize,
      totalPages,
    };
  }

  async getById(id: string): Promise<Product | null> {
    const data = await this.readData();
    const product = data.products.find((entry) => entry.id === id);
    return product ? cloneProduct(product) : null;
  }

  async create(draft: ProductDraft, actorUid: string): Promise<Product> {
    return serialize(async () => {
      const data = await this.readData();
      this.assertSkuAvailable(data.products, draft.sku);

      const timestamp = nowIso();
      const product: Product = {
        id: randomUUID(),
        name: draft.name,
        sku: normalizeSku(draft.sku),
        category: draft.category,
        description: draft.description,
        sellingPriceIdr: draft.sellingPriceIdr,
        hppIdr: draft.hppIdr,
        trackInventory: draft.trackInventory,
        status: draft.status,
        variants: [],
        createdAt: timestamp,
        updatedAt: timestamp,
        createdBy: actorUid,
        updatedBy: actorUid,
      };

      data.products.push(product);
      await this.writeData(data);

      return cloneProduct(product);
    });
  }

  async update(id: string, draft: ProductDraft, actorUid: string): Promise<Product> {
    return serialize(async () => {
      const data = await this.readData();
      const product = this.findProduct(data.products, id);
      this.assertSkuAvailable(data.products, draft.sku, product.id);

      product.name = draft.name;
      product.sku = normalizeSku(draft.sku);
      product.category = draft.category;
      product.description = draft.description;
      product.sellingPriceIdr = draft.sellingPriceIdr;
      product.hppIdr = draft.hppIdr;
      product.trackInventory = draft.trackInventory;
      product.status = draft.status;
      product.updatedAt = nowIso();
      product.updatedBy = actorUid;

      await this.writeData(data);

      return cloneProduct(product);
    });
  }

  async setStatus(id: string, status: ProductStatus, actorUid: string): Promise<Product> {
    return serialize(async () => {
      const data = await this.readData();
      const product = this.findProduct(data.products, id);

      product.status = status;
      product.updatedAt = nowIso();
      product.updatedBy = actorUid;

      await this.writeData(data);

      return cloneProduct(product);
    });
  }

  async addVariant(productId: string, draft: VariantDraft): Promise<Product> {
    return serialize(async () => {
      const data = await this.readData();
      const product = this.findProduct(data.products, productId);
      this.assertVariantSkuAvailable(product, draft.sku);

      const timestamp = nowIso();
      const variant: ProductVariant = {
        id: randomUUID(),
        name: draft.name,
        sku: normalizeSku(draft.sku),
        sellingPriceOverrideIdr: draft.sellingPriceOverrideIdr,
        hppOverrideIdr: draft.hppOverrideIdr,
        active: draft.active,
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      product.variants.push(variant);
      product.updatedAt = timestamp;

      await this.writeData(data);

      return cloneProduct(product);
    });
  }


  async updateVariant(productId: string, variantId: string, draft: VariantDraft): Promise<Product> {
    return serialize(async () => {
      const data = await this.readData();
      const product = this.findProduct(data.products, productId);
      const variant = product.variants.find((entry) => entry.id === variantId);

      if (!variant) {
        throw new ProductRepositoryError("NOT_FOUND", "Varian tidak ditemukan.");
      }

      this.assertVariantSkuAvailable(product, draft.sku, variant.id);

      const timestamp = nowIso();
      variant.name = draft.name;
      variant.sku = normalizeSku(draft.sku);
      variant.sellingPriceOverrideIdr = draft.sellingPriceOverrideIdr;
      variant.hppOverrideIdr = draft.hppOverrideIdr;
      variant.active = draft.active;
      variant.updatedAt = timestamp;
      product.updatedAt = timestamp;

      await this.writeData(data);

      return cloneProduct(product);
    });
  }

  async removeVariant(productId: string, variantId: string): Promise<Product> {
    return serialize(async () => {
      const data = await this.readData();
      const product = this.findProduct(data.products, productId);
      const index = product.variants.findIndex((entry) => entry.id === variantId);

      if (index === -1) {
        throw new ProductRepositoryError("NOT_FOUND", "Varian tidak ditemukan.");
      }

      product.variants.splice(index, 1);
      product.updatedAt = nowIso();

      await this.writeData(data);

      return cloneProduct(product);
    });
  }

  private findProduct(products: Product[], id: string): Product {
    const product = products.find((entry) => entry.id === id);
    if (!product) {
      throw new ProductRepositoryError("NOT_FOUND", "Produk tidak ditemukan.");
    }
    return product;
  }

  private assertSkuAvailable(products: Product[], sku: string, excludeId?: string): void {
    const normalized = normalizeSku(sku);
    const duplicate = products.some(
      (product) => product.id !== excludeId && product.sku.toUpperCase() === normalized,
    );

    if (duplicate) {
      throw new ProductRepositoryError(
        "DUPLICATE_SKU",
        `SKU "${normalized}" sudah dipakai produk lain.`,
      );
    }
  }

  private assertVariantSkuAvailable(product: Product, sku: string, excludeId?: string): void {
    const normalized = normalizeSku(sku);
    const duplicate = product.variants.some(
      (variant) => variant.id !== excludeId && variant.sku.toUpperCase() === normalized,
    );

    if (duplicate) {
      throw new ProductRepositoryError(
        "DUPLICATE_SKU",
        `SKU varian "${normalized}" sudah dipakai varian lain pada produk ini.`,
      );
    }
  }

  private async readData(): Promise<ProductDataFile> {
    let raw: string;

    try {
      raw = await readFile(this.filePath, "utf8");
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return structuredClone(EMPTY_DATA);
      }
      throw error;
    }

    if (raw.trim() === "") {
      return structuredClone(EMPTY_DATA);
    }

    try {
      const parsed = JSON.parse(raw) as ProductDataFile;
      if (parsed.version !== 1 || !Array.isArray(parsed.products)) {
        throw new Error("unexpected shape");
      }
      return parsed;
    } catch {
      throw new ProductRepositoryError(
        "INVALID_DATA",
        `Data produk lokal tidak dapat dibaca (${this.filePath}).`,
      );
    }
  }

  private async writeData(data: ProductDataFile): Promise<void> {
    await mkdir(dirname(this.filePath), { recursive: true });

    const tempPath = `${this.filePath}.${process.pid}.${randomUUID()}.tmp`;
    await writeFile(tempPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
    await rename(tempPath, this.filePath);
  }
}

let repositoryInstance: ProductRepository | null = null;

export function getProductRepository(): ProductRepository {
  repositoryInstance ??= new JsonProductRepository(defaultProductDataFilePath());
  return repositoryInstance;
}

