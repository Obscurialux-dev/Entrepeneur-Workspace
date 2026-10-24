import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { JsonProductRepository } from "./repository.json.ts";
import { ProductRepositoryError } from "./repository.ts";
import type { ProductDraft, VariantDraft } from "./types.ts";

const baseDraft: ProductDraft = {
  name: "Kaos HIMA",
  sku: "K-HIMA-01",
  category: "Apparel",
  description: "Kaos cotton combed 30s",
  sellingPriceIdr: 95_000,
  hppIdr: 60_000,
  trackInventory: true,
  status: "research",
};

const baseVariant: VariantDraft = {
  name: "Ukuran L",
  sku: "K-HIMA-01-L",
  sellingPriceOverrideIdr: null,
  hppOverrideIdr: null,
  active: true,
};

async function withRepository(
  run: (repository: JsonProductRepository, filePath: string) => Promise<void>,
): Promise<void> {
  const dir = await mkdtemp(join(tmpdir(), "ew-products-"));
  const filePath = join(dir, "products.json");

  try {
    await run(new JsonProductRepository(filePath), filePath);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

async function expectRepositoryError(
  action: () => Promise<unknown>,
  code: ProductRepositoryError["code"],
): Promise<void> {
  await assert.rejects(action, (error: unknown) => {
    assert.ok(error instanceof ProductRepositoryError);
    assert.equal(error.code, code);
    return true;
  });
}

test("list mengembalikan halaman kosong saat data belum ada", async () => {
  await withRepository(async (repository) => {
    const page = await repository.list();

    assert.deepEqual(page.items, []);
    assert.equal(page.total, 0);
    assert.equal(page.page, 1);
    assert.equal(page.totalPages, 1);
  });
});

test("create menyimpan produk dengan audit field dan bertahan setelah ditulis ulang", async () => {
  await withRepository(async (repository, filePath) => {
    const created = await repository.create(baseDraft, "user-1");

    assert.equal(created.sku, "K-HIMA-01");
    assert.equal(created.status, "research");
    assert.deepEqual(created.variants, []);
    assert.equal(created.createdBy, "user-1");
    assert.equal(created.updatedBy, "user-1");
    assert.equal(created.createdAt, created.updatedAt);

    const reopened = new JsonProductRepository(filePath);
    const persisted = await reopened.getById(created.id);

    assert.ok(persisted);
    assert.equal(persisted.name, "Kaos HIMA");
    assert.equal(persisted.sellingPriceIdr, 95_000);

    const raw = JSON.parse(await readFile(filePath, "utf8")) as { version: number };
    assert.equal(raw.version, 1);
  });
});

test("create menolak SKU duplikat tanpa memandang huruf besar/kecil", async () => {
  await withRepository(async (repository) => {
    await repository.create(baseDraft, "user-1");

    await expectRepositoryError(
      () => repository.create({ ...baseDraft, sku: "k-hima-01" }, "user-1"),
      "DUPLICATE_SKU",
    );

    const page = await repository.list();
    assert.equal(page.total, 1);
  });
});

test("update mempertahankan createdAt/createdBy dan mengganti updatedBy", async () => {
  await withRepository(async (repository) => {
    const created = await repository.create(baseDraft, "user-1");
    const updated = await repository.update(
      created.id,
      { ...baseDraft, name: "Kaos HIMA Revisi", sellingPriceIdr: 105_000 },
      "user-2",
    );

    assert.equal(updated.id, created.id);
    assert.equal(updated.name, "Kaos HIMA Revisi");
    assert.equal(updated.sellingPriceIdr, 105_000);
    assert.equal(updated.createdAt, created.createdAt);
    assert.equal(updated.createdBy, "user-1");
    assert.equal(updated.updatedBy, "user-2");
    assert.ok(updated.updatedAt >= created.updatedAt);
  });
});

test("update boleh memakai SKU sendiri tetapi menolak SKU produk lain", async () => {
  await withRepository(async (repository) => {
    const first = await repository.create(baseDraft, "user-1");
    await repository.create({ ...baseDraft, sku: "K-HIMA-02" }, "user-1");

    const sameSku = await repository.update(first.id, { ...baseDraft, name: "Nama Baru" }, "user-1");
    assert.equal(sameSku.sku, "K-HIMA-01");

    await expectRepositoryError(
      () => repository.update(first.id, { ...baseDraft, sku: "K-HIMA-02" }, "user-1"),
      "DUPLICATE_SKU",
    );
  });
});

test("update dan setStatus menolak produk yang tidak ada", async () => {
  await withRepository(async (repository) => {
    await expectRepositoryError(() => repository.update("missing", baseDraft, "user-1"), "NOT_FOUND");
    await expectRepositoryError(
      () => repository.setStatus("missing", "active", "user-1"),
      "NOT_FOUND",
    );
    assert.equal(await repository.getById("missing"), null);
  });
});

test("setStatus mengubah status dan mencatat aktor", async () => {
  await withRepository(async (repository) => {
    const created = await repository.create(baseDraft, "user-1");
    const updated = await repository.setStatus(created.id, "active", "user-2");

    assert.equal(updated.status, "active");
    assert.equal(updated.updatedBy, "user-2");
    assert.equal(updated.createdBy, "user-1");
  });
});

test("list memfilter berdasarkan pencarian teks dan status", async () => {
  await withRepository(async (repository) => {
    await repository.create(baseDraft, "user-1");
    await repository.create(
      { ...baseDraft, name: "Tote Bag", sku: "TOTE-01", category: "Bag", status: "active" },
      "user-1",
    );

    const byName = await repository.list({ search: "tote" });
    assert.equal(byName.total, 1);
    assert.equal(byName.items[0]?.name, "Tote Bag");

    const byCategory = await repository.list({ search: "apparel" });
    assert.equal(byCategory.total, 1);
    assert.equal(byCategory.items[0]?.sku, "K-HIMA-01");

    const activeOnly = await repository.list({ status: "active" });
    assert.equal(activeOnly.total, 1);
    assert.equal(activeOnly.items[0]?.name, "Tote Bag");
  });
});


test("list memaginasi hasil dan membatasi pageSize", async () => {
  await withRepository(async (repository) => {
    for (let index = 0; index < 12; index += 1) {
      await repository.create(
        { ...baseDraft, name: `Produk ${index}`, sku: `SKU-${String(index).padStart(2, "0")}` },
        "user-1",
      );
    }

    const firstPage = await repository.list({ page: 1, pageSize: 10 });
    assert.equal(firstPage.total, 12);
    assert.equal(firstPage.items.length, 10);
    assert.equal(firstPage.totalPages, 2);

    const secondPage = await repository.list({ page: 2, pageSize: 10 });
    assert.equal(secondPage.items.length, 2);
    assert.equal(secondPage.page, 2);

    const beyond = await repository.list({ page: 9, pageSize: 10 });
    assert.equal(beyond.items.length, 0);

    const clamped = await repository.list({ pageSize: 500 });
    assert.equal(clamped.pageSize, 50);
  });
});

test("create bersamaan tetap tersimpan semua (penulisan diserialisasi)", async () => {
  await withRepository(async (repository) => {
    await Promise.all(
      Array.from({ length: 8 }, (_, index) =>
        repository.create(
          { ...baseDraft, name: `Paralel ${index}`, sku: `PAR-${index}` },
          "user-1",
        ),
      ),
    );

    const page = await repository.list({ pageSize: 50 });
    assert.equal(page.total, 8);
  });
});

test("addVariant menormalkan SKU dan menolak SKU varian duplikat", async () => {
  await withRepository(async (repository) => {
    const product = await repository.create(baseDraft, "user-1");
    const withVariant = await repository.addVariant(product.id, {
      ...baseVariant,
      sku: "k-hima-01-l",
    });

    assert.equal(withVariant.variants.length, 1);
    assert.equal(withVariant.variants[0]?.sku, "K-HIMA-01-L");
    assert.equal(withVariant.variants[0]?.sellingPriceOverrideIdr, null);

    await expectRepositoryError(
      () => repository.addVariant(product.id, { ...baseVariant, sku: "K-HIMA-01-L" }),
      "DUPLICATE_SKU",
    );

    await expectRepositoryError(() => repository.addVariant("missing", baseVariant), "NOT_FOUND");
  });
});


test("updateVariant mengubah harga override dan removeVariant menghapusnya", async () => {
  await withRepository(async (repository) => {
    const product = await repository.create(baseDraft, "user-1");
    const withVariant = await repository.addVariant(product.id, baseVariant);
    const variantId = withVariant.variants[0]?.id;
    assert.ok(variantId);

    const updated = await repository.updateVariant(product.id, variantId, {
      ...baseVariant,
      name: "Ukuran XL",
      sku: "K-HIMA-01-XL",
      sellingPriceOverrideIdr: 105_000,
      active: false,
    });

    assert.equal(updated.variants[0]?.name, "Ukuran XL");
    assert.equal(updated.variants[0]?.sku, "K-HIMA-01-XL");
    assert.equal(updated.variants[0]?.sellingPriceOverrideIdr, 105_000);
    assert.equal(updated.variants[0]?.active, false);

    const removed = await repository.removeVariant(product.id, variantId);
    assert.deepEqual(removed.variants, []);

    await expectRepositoryError(
      () => repository.removeVariant(product.id, variantId),
      "NOT_FOUND",
    );
  });
});

test("data file yang rusak dilaporkan sebagai INVALID_DATA", async () => {
  await withRepository(async (repository, filePath) => {
    await repository.create(baseDraft, "user-1");

    const { writeFile } = await import("node:fs/promises");
    await writeFile(filePath, "{ not json", "utf8");

    await expectRepositoryError(() => repository.list(), "INVALID_DATA");
  });
});

