import assert from "node:assert/strict";
import test from "node:test";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import {
  isProductStatus,
  matchesProductSearch,
  normalizeSku,
  productCreateData,
  productFromDoc,
  productUpdateData,
  timestampToIso,
  variantCreateData,
  variantFromDoc,
  variantUpdateData,
} from "./repository.firestore.mapping.ts";
import type { ProductDraft, VariantDraft } from "./types.ts";

const baseDraft: ProductDraft = {
  name: "Kaos HIMA",
  sku: " k-hima-01 ",
  category: "Apparel",
  description: "Kaos cotton combed 30s",
  sellingPriceIdr: 95_000,
  hppIdr: 60_000,
  trackInventory: true,
  status: "research",
};

const baseVariant: VariantDraft = {
  name: "Ukuran L",
  sku: "k-hima-01-l",
  sellingPriceOverrideIdr: null,
  hppOverrideIdr: null,
  active: true,
};

function isServerTimestamp(value: unknown): boolean {
  return (
    value !== null &&
    typeof value === "object" &&
    typeof (value as { isEqual?: unknown }).isEqual === "function" &&
    (value as { isEqual(other: unknown): boolean }).isEqual(
      FieldValue.serverTimestamp(),
    )
  );
}

test("normalizeSku memangkas spasi dan mengubah ke huruf besar", () => {
  assert.equal(normalizeSku("  k-hima-01 "), "K-HIMA-01");
  assert.equal(normalizeSku("AbC"), "ABC");
});

test("isProductStatus hanya menerima status resmi", () => {
  assert.equal(isProductStatus("research"), true);
  assert.equal(isProductStatus("active"), true);
  assert.equal(isProductStatus("deleted"), false);
  assert.equal(isProductStatus(undefined), false);
  assert.equal(isProductStatus(null), false);
});

test("timestampToIso mengubah Timestamp, Date, dan string ISO", () => {
  const iso = "2026-01-02T03:04:05.000Z";
  const millis = Date.parse(iso);

  assert.equal(timestampToIso(Timestamp.fromMillis(millis)), iso);
  assert.equal(timestampToIso(new Date(millis)), iso);
  assert.equal(timestampToIso(iso), iso);
});

test("timestampToIso memakai toDate pada objek timestamp-like", () => {
  const iso = "2025-12-31T23:59:59.000Z";
  assert.equal(timestampToIso({ toDate: () => new Date(iso) }), iso);
});

test("timestampToIso memberi fallback aman untuk nilai tidak dikenal", () => {
  const before = Date.now();
  const parsed = Date.parse(timestampToIso(undefined));
  assert.ok(Number.isFinite(parsed));
  assert.ok(parsed >= before - 1000 && parsed <= Date.now() + 1000);

  // String tidak valid tidak menghasilkan "Invalid Date".
  assert.ok(Number.isFinite(Date.parse(timestampToIso("bukan tanggal"))));
});

test("productFromDoc memetakan dokumen Firestore ke Product", () => {
  const createdAt = Timestamp.fromMillis(Date.parse("2026-02-01T00:00:00.000Z"));
  const updatedAt = Timestamp.fromMillis(Date.parse("2026-02-02T00:00:00.000Z"));

  const product = productFromDoc(
    {
      id: "prod-1",
      data: () => ({
        name: "Kaos HIMA",
        sku: "K-HIMA-01",
        category: "Apparel",
        description: "Cotton combed 30s",
        sellingPriceIdr: 95_000,
        hppIdr: 60_000,
        trackInventory: true,
        status: "active",
        createdAt,
        updatedAt,
        createdBy: "user-1",
        updatedBy: "user-2",
      }),
    },
    [
      {
        id: "var-1",
        name: "Ukuran L",
        sku: "K-HIMA-01-L",
        sellingPriceOverrideIdr: 100_000,
        hppOverrideIdr: null,
        active: true,
        createdAt: "2026-02-01T00:00:00.000Z",
        updatedAt: "2026-02-01T00:00:00.000Z",
      },
    ],
  );

  assert.equal(product.id, "prod-1");
  assert.equal(product.name, "Kaos HIMA");
  assert.equal(product.sellingPriceIdr, 95_000);
  assert.equal(product.hppIdr, 60_000);
  assert.equal(product.trackInventory, true);
  assert.equal(product.status, "active");
  assert.equal(product.createdAt, "2026-02-01T00:00:00.000Z");
  assert.equal(product.updatedAt, "2026-02-02T00:00:00.000Z");
  assert.equal(product.createdBy, "user-1");
  assert.equal(product.updatedBy, "user-2");
  assert.equal(product.variants.length, 1);
  assert.equal(product.variants[0].id, "var-1");
});

test("productFromDoc memberi nilai aman untuk dokumen tidak lengkap", () => {
  const product = productFromDoc({ id: "prod-x", data: () => ({}) }, []);

  assert.equal(product.id, "prod-x");
  assert.equal(product.name, "");
  assert.equal(product.sku, "");
  assert.equal(product.sellingPriceIdr, 0);
  assert.equal(product.hppIdr, 0);
  assert.equal(product.trackInventory, false);
  assert.equal(product.status, "research");
  assert.deepEqual(product.variants, []);
  assert.ok(Number.isFinite(Date.parse(product.createdAt)));
  assert.ok(Number.isFinite(Date.parse(product.updatedAt)));
});

test("productFromDoc menolak status tidak dikenal menjadi research", () => {
  const product = productFromDoc(
    { id: "prod-y", data: () => ({ status: "deleted" }) },
    [],
  );
  assert.equal(product.status, "research");
});

test("productFromDoc menerima data non-objek tanpa melempar error", () => {
  const product = productFromDoc({ id: "prod-z", data: () => null }, []);
  assert.equal(product.name, "");
  assert.equal(product.status, "research");
});

test("variantFromDoc mempertahankan override null sebagai null", () => {
  const variant = variantFromDoc({
    id: "var-1",
    data: () => ({
      name: "Ukuran M",
      sku: "K-HIMA-01-M",
      sellingPriceOverrideIdr: null,
      hppOverrideIdr: undefined,
      active: false,
      createdAt: "2026-03-01T00:00:00.000Z",
      updatedAt: "2026-03-02T00:00:00.000Z",
    }),
  });

  assert.equal(variant.sellingPriceOverrideIdr, null);
  assert.equal(variant.hppOverrideIdr, null);
  assert.equal(variant.active, false);
  assert.equal(variant.createdAt, "2026-03-01T00:00:00.000Z");
  assert.equal(variant.updatedAt, "2026-03-02T00:00:00.000Z");
});

test("variantFromDoc mengubah override numerik menjadi number", () => {
  const variant = variantFromDoc({
    id: "var-2",
    data: () => ({ sellingPriceOverrideIdr: 110_000, hppOverrideIdr: 70_000 }),
  });

  assert.equal(variant.sellingPriceOverrideIdr, 110_000);
  assert.equal(variant.hppOverrideIdr, 70_000);
});

test("productCreateData menulis SKU normal, audit, dan server timestamp", () => {
  const data = productCreateData(baseDraft, "user-1");

  assert.equal(data.sku, "K-HIMA-01");
  assert.equal(data.createdBy, "user-1");
  assert.equal(data.updatedBy, "user-1");
  assert.equal(data.status, "research");
  assert.equal(data.sellingPriceIdr, 95_000);
  assert.ok(isServerTimestamp(data.createdAt));
  assert.ok(isServerTimestamp(data.updatedAt));
});

test("productUpdateData tidak pernah menimpa createdAt/createdBy", () => {
  const data = productUpdateData(baseDraft, "user-2");

  assert.equal(data.updatedBy, "user-2");
  assert.equal("createdAt" in data, false);
  assert.equal("createdBy" in data, false);
  assert.ok(isServerTimestamp(data.updatedAt));
});

test("variantCreateData menambahkan createdAt, variantUpdateData tidak", () => {
  const created = variantCreateData(baseVariant);
  const updated = variantUpdateData(baseVariant);

  assert.equal(created.sku, "K-HIMA-01-L");
  assert.equal(created.sellingPriceOverrideIdr, null);
  assert.ok(isServerTimestamp(created.createdAt));
  assert.ok(isServerTimestamp(created.updatedAt));

  assert.equal("createdAt" in updated, false);
  assert.ok(isServerTimestamp(updated.updatedAt));
});

test("matchesProductSearch mencari pada nama, SKU, dan kategori", () => {
  const product = {
    name: "Kaos HIMA",
    sku: "K-HIMA-01",
    category: "Apparel",
  };

  assert.equal(matchesProductSearch(product, "kaos"), true);
  assert.equal(matchesProductSearch(product, "K-HIMA"), true);
  assert.equal(matchesProductSearch(product, "apparel"), true);
  assert.equal(matchesProductSearch(product, "  APPAREL  "), true);
  assert.equal(matchesProductSearch(product, "jaket"), false);
});

test("matchesProductSearch mengembalikan semua data untuk pencarian kosong", () => {
  assert.equal(matchesProductSearch({ name: "Kaos" }, ""), true);
  assert.equal(matchesProductSearch({ name: "Kaos" }, "   "), true);
  assert.equal(matchesProductSearch(null, ""), true);
});

test("matchesProductSearch aman untuk field yang hilang atau data non-objek", () => {
  assert.equal(matchesProductSearch({ name: "Kaos" }, "sku"), false);
  assert.equal(matchesProductSearch(null, "kaos"), false);
  assert.equal(matchesProductSearch(undefined, "kaos"), false);
  assert.equal(matchesProductSearch({ sku: null }, "null"), false);
});
