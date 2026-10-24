/**
 * Integration tests for `FirestoreProductRepository` against the Firebase Emulator Suite.
 *
 * Skipped unless `FIRESTORE_EMULATOR_HOST` is set. Run with:
 *
 *   npm run test:emulator
 *
 * The test injects its own emulator-backed Firestore instance, so it does not need real
 * credentials and never touches production data.
 */

import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { deleteApp, initializeApp } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { ProductRepositoryError } from "./repository.ts";
import { FirestoreProductRepository } from "./repository.firestore.ts";
import type { ProductDraft, VariantDraft } from "./types.ts";

const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST;
const skip = emulatorHost
  ? false
  : "FIRESTORE_EMULATOR_HOST tidak diset. Jalankan `npm run test:emulator`.";

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

function validIso(value: string): boolean {
  return Number.isFinite(Date.parse(value));
}

/** Removes every product and variant document. Tests run against the emulator only. */
async function clearProducts(db: Firestore): Promise<void> {
  const products = await db.collection("products").get();

  for (const product of products.docs) {
    const variants = await product.ref.collection("variants").get();
    await Promise.all(variants.docs.map((variant) => variant.ref.delete()));
    await product.ref.delete();
  }
}

test("FirestoreProductRepository (emulator)", { skip }, async (t) => {
  const projectId = process.env.FIRESTORE_PROJECT_ID ?? "demo-entrepreneur-workspace";
  const app = initializeApp({ projectId }, `ew-emulator-${randomUUID()}`);
  const db: Firestore = getFirestore(app);
  const repository = new FirestoreProductRepository(db);

  const clear = async (): Promise<void> => {
    await clearProducts(db);
  };

  t.after(async () => {
    await clear();
    await deleteApp(app);
  });

  await t.test("create menyimpan produk dan getById mengembalikannya", async () => {
    await clear();

    const created = await repository.create(baseDraft, "user-1");

    assert.ok(created.id);
    assert.equal(created.name, "Kaos HIMA");
    assert.equal(created.sku, "K-HIMA-01");
    assert.equal(created.sellingPriceIdr, 95_000);
    assert.equal(created.hppIdr, 60_000);
    assert.equal(created.trackInventory, true);
    assert.equal(created.status, "research");
    assert.equal(created.createdBy, "user-1");
    assert.equal(created.updatedBy, "user-1");
    assert.equal(created.variants.length, 0);
    assert.ok(validIso(created.createdAt));
    assert.ok(validIso(created.updatedAt));

    const fetched = await repository.getById(created.id);
    assert.ok(fetched);
    assert.equal(fetched?.id, created.id);
    assert.equal(fetched?.sku, "K-HIMA-01");
  });

  await t.test("getById mengembalikan null untuk produk yang tidak ada", async () => {
    await clear();
    assert.equal(await repository.getById("tidak-ada"), null);
  });

  await t.test("create menolak SKU duplikat tanpa memandang spasi dan huruf", async () => {
    await clear();
    await repository.create(baseDraft, "user-1");

    await expectRepositoryError(
      () => repository.create({ ...baseDraft, name: "Duplikat", sku: "  k-hima-01 " }, "user-1"),
      "DUPLICATE_SKU",
    );
  });

  await t.test("update mempertahankan createdAt/createdBy dan mengganti updatedBy", async () => {
    await clear();
    const created = await repository.create(baseDraft, "user-1");

    // Server timestamps have second-level resolution in the emulator; wait so the
    // updated timestamp can differ from the created timestamp.
    await new Promise((resolve) => setTimeout(resolve, 20));

    const updated = await repository.update(
      created.id,
      { ...baseDraft, name: "Kaos HIMA Edisi Baru", sellingPriceIdr: 105_000 },
      "user-2",
    );

    assert.equal(updated.name, "Kaos HIMA Edisi Baru");
    assert.equal(updated.sellingPriceIdr, 105_000);
    assert.equal(updated.createdAt, created.createdAt);
    assert.equal(updated.createdBy, "user-1");
    assert.equal(updated.updatedBy, "user-2");
  });

  await t.test("update dan setStatus menolak produk yang tidak ada", async () => {
    await clear();
    await expectRepositoryError(() => repository.update("tidak-ada", baseDraft, "user-1"), "NOT_FOUND");
    await expectRepositoryError(() => repository.setStatus("tidak-ada", "active", "user-1"), "NOT_FOUND");
  });

  await t.test("setStatus mengubah status dan updatedBy saja", async () => {
    await clear();
    const created = await repository.create(baseDraft, "user-1");

    const updated = await repository.setStatus(created.id, "active", "user-2");

    assert.equal(updated.status, "active");
    assert.equal(updated.name, created.name);
    assert.equal(updated.updatedBy, "user-2");
    assert.equal(updated.createdAt, created.createdAt);

    const fetched = await repository.getById(created.id);
    assert.equal(fetched?.status, "active");
  });

  await t.test("list memaginasi hasil sesuai pageSize", async () => {
    await clear();
    for (let index = 0; index < 12; index += 1) {
      await repository.create(
        {
          ...baseDraft,
          sku: `PAGE-${String(index).padStart(3, "0")}`,
          name: `Produk ${index}`,
        },
        "user-1",
      );
    }

    const first = await repository.list({ page: 1, pageSize: 5 });
    assert.equal(first.total, 12);
    assert.equal(first.totalPages, 3);
    assert.equal(first.items.length, 5);

    const last = await repository.list({ page: 3, pageSize: 5 });
    assert.equal(last.items.length, 2);

    const beyond = await repository.list({ page: 9, pageSize: 5 });
    assert.equal(beyond.items.length, 0);
    assert.equal(beyond.total, 12);
    assert.equal(beyond.totalPages, 3);
  });

  await t.test("list memfilter berdasarkan status", async () => {
    await clear();
    await repository.create({ ...baseDraft, sku: "ST-1", status: "active" }, "user-1");
    await repository.create({ ...baseDraft, sku: "ST-2", status: "archived" }, "user-1");
    await repository.create({ ...baseDraft, sku: "ST-3", status: "active" }, "user-1");

    assert.equal((await repository.list({ status: "active" })).total, 2);
    assert.equal((await repository.list({ status: "archived" })).total, 1);
    assert.equal((await repository.list({ status: "all" })).total, 3);
  });

  await t.test("list mencari berdasarkan nama, SKU, dan kategori", async () => {
    await clear();
    await repository.create(
      { ...baseDraft, sku: "SR-1", name: "Baju Merah", category: "Pakaian" },
      "user-1",
    );
    await repository.create(
      { ...baseDraft, sku: "SR-2", name: "Celana Hitam", category: "Pakaian" },
      "user-1",
    );
    await repository.create(
      { ...baseDraft, sku: "SR-3", name: "Topi Biru", category: "Aksesori" },
      "user-1",
    );

    const byName = await repository.list({ search: "merah" });
    assert.equal(byName.total, 1);
    assert.equal(byName.items[0].name, "Baju Merah");

    assert.equal((await repository.list({ search: "pakaian" })).total, 2);
    assert.equal((await repository.list({ search: "SR-2" })).total, 1);
    assert.equal((await repository.list({ search: "tidak-ada" })).total, 0);
  });

  await t.test("addVariant menambahkan varian dan menolak SKU duplikat", async () => {
    await clear();
    const created = await repository.create(baseDraft, "user-1");

    const withVariant = await repository.addVariant(created.id, baseVariant);
    assert.equal(withVariant.variants.length, 1);

    const variant = withVariant.variants[0];
    assert.equal(variant.name, "Ukuran L");
    assert.equal(variant.sku, "K-HIMA-01-L");
    assert.equal(variant.sellingPriceOverrideIdr, null);
    assert.equal(variant.hppOverrideIdr, null);
    assert.equal(variant.active, true);
    assert.ok(validIso(variant.createdAt));

    await expectRepositoryError(
      () => repository.addVariant(created.id, { ...baseVariant, name: "Duplikat" }),
      "DUPLICATE_SKU",
    );
  });

  await t.test("addVariant menolak produk yang tidak ada", async () => {
    await clear();
    await expectRepositoryError(
      () => repository.addVariant("tidak-ada", baseVariant),
      "NOT_FOUND",
    );
  });

  await t.test("updateVariant mengubah field dan mempertahankan createdAt", async () => {
    await clear();
    const created = await repository.create(baseDraft, "user-1");
    const withVariant = await repository.addVariant(created.id, baseVariant);
    const variant = withVariant.variants[0];

    const updated = await repository.updateVariant(created.id, variant.id, {
      ...baseVariant,
      name: "Ukuran XL",
      sellingPriceOverrideIdr: 110_000,
      active: false,
    });

    const changed = updated.variants.find((entry) => entry.id === variant.id);
    assert.ok(changed);
    assert.equal(changed?.name, "Ukuran XL");
    assert.equal(changed?.sellingPriceOverrideIdr, 110_000);
    assert.equal(changed?.active, false);
    assert.equal(changed?.createdAt, variant.createdAt);
  });

  await t.test("updateVariant dan removeVariant menolak varian yang tidak ada", async () => {
    await clear();
    const created = await repository.create(baseDraft, "user-1");

    await expectRepositoryError(
      () => repository.updateVariant(created.id, "tidak-ada", baseVariant),
      "NOT_FOUND",
    );
    await expectRepositoryError(
      () => repository.removeVariant(created.id, "tidak-ada"),
      "NOT_FOUND",
    );
  });

  await t.test("removeVariant menghapus varian dari produk", async () => {
    await clear();
    const created = await repository.create(baseDraft, "user-1");
    const withVariant = await repository.addVariant(created.id, baseVariant);

    const removed = await repository.removeVariant(created.id, withVariant.variants[0].id);
    assert.equal(removed.variants.length, 0);

    const fetched = await repository.getById(created.id);
    assert.deepEqual(fetched?.variants, []);
  });
});
