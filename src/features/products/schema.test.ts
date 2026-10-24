import assert from "node:assert/strict";
import test from "node:test";
import {
  productFormSchema,
  productListQuerySchema,
  toFieldErrors,
  variantFormSchema,
} from "./schema.ts";

const validProduct = {
  name: "Kaos HIMA",
  sku: "k-hima-01",
  category: "Apparel",
  description: "Kaos cotton combed 30s",
  sellingPriceIdr: "95.000",
  hppIdr: "60.000",
  trackInventory: "on",
  status: "active",
};

test("productFormSchema mem-parse input valid menjadi tipe domain", () => {
  const parsed = productFormSchema.safeParse(validProduct);

  assert.equal(parsed.success, true);
  if (!parsed.success) return;

  assert.equal(parsed.data.name, "Kaos HIMA");
  assert.equal(parsed.data.sku, "K-HIMA-01");
  assert.equal(parsed.data.sellingPriceIdr, 95_000);
  assert.equal(parsed.data.hppIdr, 60_000);
  assert.equal(parsed.data.trackInventory, true);
  assert.equal(parsed.data.status, "active");
});

test("productFormSchema memperbolehkan HPP nol dan harga jual wajib > 0", () => {
  const zeroHpp = productFormSchema.safeParse({ ...validProduct, hppIdr: "0" });
  assert.equal(zeroHpp.success, true);

  const zeroPrice = productFormSchema.safeParse({ ...validProduct, sellingPriceIdr: "0" });
  assert.equal(zeroPrice.success, false);
  if (!zeroPrice.success) {
    assert.equal(toFieldErrors(zeroPrice.error).sellingPriceIdr, "Harga jual harus lebih dari 0.");
  }
});

test("productFormSchema menolak harga desimal dan non-angka", () => {
  const decimal = productFormSchema.safeParse({ ...validProduct, sellingPriceIdr: "95.000,5" });
  assert.equal(decimal.success, false);

  const text = productFormSchema.safeParse({ ...validProduct, sellingPriceIdr: "sembilan puluh" });
  assert.equal(text.success, false);
});

test("productFormSchema menormalkan SKU dan menolak karakter tidak valid", () => {
  const accepted = productFormSchema.safeParse({ ...validProduct, sku: "  abc-123  " });
  assert.equal(accepted.success, true);
  if (accepted.success) assert.equal(accepted.data.sku, "ABC-123");

  for (const sku of ["ab", "abc 123", "abc_123", "abc/123"]) {
    const rejected = productFormSchema.safeParse({ ...validProduct, sku });
    assert.equal(rejected.success, false, `SKU "${sku}" seharusnya ditolak`);
  }
});

test("productFormSchema menolak status di luar daftar resmi", () => {
  const parsed = productFormSchema.safeParse({ ...validProduct, status: "published" });
  assert.equal(parsed.success, false);
  if (!parsed.success) {
    assert.equal(toFieldErrors(parsed.error).status, "Status produk tidak dikenal.");
  }
});

test("productFormSchema menandai nama dan kategori yang terlalu pendek", () => {
  const parsed = productFormSchema.safeParse({ ...validProduct, name: "A", category: "" });
  assert.equal(parsed.success, false);
  if (!parsed.success) {
    const errors = toFieldErrors(parsed.error);
    assert.equal(errors.name, "Nama produk minimal 2 karakter.");
    assert.equal(errors.category, "Kategori minimal 2 karakter.");
  }
});

test("variantFormSchema: override kosong berarti memakai harga produk", () => {
  const parsed = variantFormSchema.safeParse({
    name: "Ukuran L",
    sku: "k-hima-l",
    sellingPriceOverrideIdr: "",
    hppOverrideIdr: "",
    active: "on",
  });

  assert.equal(parsed.success, true);
  if (!parsed.success) return;

  assert.equal(parsed.data.sellingPriceOverrideIdr, null);
  assert.equal(parsed.data.hppOverrideIdr, null);
  assert.equal(parsed.data.active, true);
  assert.equal(parsed.data.sku, "K-HIMA-L");
});

test("variantFormSchema mem-parse override nominal dan menolak nilainya bila tidak valid", () => {
  const parsed = variantFormSchema.safeParse({
    name: "Ukuran XL",
    sku: "k-hima-xl",
    sellingPriceOverrideIdr: "105.000",
    hppOverrideIdr: "65.000",
    active: "on",
  });

  assert.equal(parsed.success, true);
  if (parsed.success) {
    assert.equal(parsed.data.sellingPriceOverrideIdr, 105_000);
    assert.equal(parsed.data.hppOverrideIdr, 65_000);
  }

  const invalid = variantFormSchema.safeParse({
    name: "Ukuran XL",
    sku: "k-hima-xl",
    sellingPriceOverrideIdr: "105.000,25",
    hppOverrideIdr: "",
    active: "on",
  });
  assert.equal(invalid.success, false);
});

test("variantFormSchema memperlakukan checkbox tidak dicentang sebagai false", () => {
  const parsed = variantFormSchema.safeParse({
    name: "Ukuran M",
    sku: "k-hima-m",
    sellingPriceOverrideIdr: "",
    hppOverrideIdr: "",
  });

  assert.equal(parsed.success, true);
  if (parsed.success) assert.equal(parsed.data.active, false);
});

test("productListQuerySchema memberi nilai aman untuk query yang tidak valid", () => {
  const parsed = productListQuerySchema.parse({ q: undefined, status: "nope", page: "-3" });

  assert.deepEqual(parsed, { q: "", status: "all", page: 1 });
});

test("productListQuerySchema menerima filter status dan halaman yang valid", () => {
  const parsed = productListQuerySchema.parse({ q: " kaos ", status: "active", page: "2" });

  assert.deepEqual(parsed, { q: "kaos", status: "active", page: 2 });
});
