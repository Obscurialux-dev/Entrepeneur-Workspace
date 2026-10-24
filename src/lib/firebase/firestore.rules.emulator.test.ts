/**
 * Security rules tests for `firestore.rules`, executed against the Firestore emulator.
 *
 * Skipped unless `FIRESTORE_EMULATOR_HOST` is set. Run with:
 *
 *   npm run test:emulator
 *
 * The rules remain the authority for any direct client access. Server Actions use the
 * Admin SDK (which bypasses rules), so these cases document the intended client matrix.
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";

const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST;
const skip = emulatorHost
  ? false
  : "FIRESTORE_EMULATOR_HOST tidak diset. Jalankan `npm run test:emulator`.";

const [host, port] = (emulatorHost ?? "127.0.0.1:8080").split(":");
const rules = readFileSync(new URL("../../../firestore.rules", import.meta.url), "utf8");

const productPath = "products/prod-1";

function productData(actorUid: string, overrides: Record<string, unknown> = {}) {
  return {
    name: "Kaos HIMA",
    sku: "K-HIMA-01",
    category: "Apparel",
    description: "Kaos cotton combed 30s",
    sellingPriceIdr: 95_000,
    hppIdr: 60_000,
    trackInventory: true,
    status: "research",
    createdBy: actorUid,
    updatedBy: actorUid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    ...overrides,
  };
}

function variantData(overrides: Record<string, unknown> = {}) {
  return {
    name: "Ukuran L",
    sku: "K-HIMA-01-L",
    sellingPriceOverrideIdr: null,
    hppOverrideIdr: null,
    active: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    ...overrides,
  };
}

test("firestore.rules (emulator)", { skip }, async (t) => {
  const environment: RulesTestEnvironment = await initializeTestEnvironment({
    projectId: "demo-entrepreneur-workspace",
    firestore: { rules, host, port: Number(port) },
  });

  const anonymous = environment.unauthenticatedContext();
  const viewer = environment.authenticatedContext("viewer-1", {
    role: "executive_viewer",
  });
  const research = environment.authenticatedContext("research-1", { role: "research" });
  const marketing = environment.authenticatedContext("marketing-1", {
    role: "marketing",
  });
  const admin = environment.authenticatedContext("admin-1", {
    role: "entrepreneur_admin",
  });

  t.after(async () => {
    await environment.clearFirestore();
    await environment.cleanup();
  });

  await t.test("anonymous ditolak membaca dan menulis produk", async () => {
    await assertFails(getDoc(doc(anonymous.firestore(), productPath)));
    await assertFails(
      setDoc(doc(anonymous.firestore(), productPath), productData("anonymous")),
    );
  });

  await t.test("user terautentikasi tanpa izin tulis tetap boleh membaca", async () => {
    await environment.clearFirestore();
    await environment.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), productPath), productData("research-1"));
    });

    await assertSucceeds(getDoc(doc(viewer.firestore(), productPath)));
    await assertFails(
      setDoc(doc(viewer.firestore(), "products/prod-2"), productData("viewer-1")),
    );
  });

  await t.test("research boleh membuat produk yang valid", async () => {
    await environment.clearFirestore();
    await assertSucceeds(
      setDoc(doc(research.firestore(), productPath), productData("research-1")),
    );
  });

  await t.test("create ditolak bila field wajib atau tipe data salah", async () => {
    await environment.clearFirestore();
    const db = research.firestore();

    await assertFails(
      setDoc(doc(db, "products/invalid-1"), productData("research-1", { name: "" })),
    );
    await assertFails(
      setDoc(
        doc(db, "products/invalid-2"),
        productData("research-1", { sellingPriceIdr: 95_000.5 }),
      ),
    );
    await assertFails(
      setDoc(doc(db, "products/invalid-3"), productData("research-1", { status: "deleted" })),
    );
  });

  await t.test("create ditolak bila createdBy bukan penulisnya sendiri", async () => {
    await environment.clearFirestore();
    await assertFails(
      setDoc(
        doc(research.firestore(), productPath),
        productData("research-1", { createdBy: "admin-1" }),
      ),
    );
  });

  await t.test("update tidak boleh mengubah createdAt/createdBy", async () => {
    await environment.clearFirestore();
    await environment.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), productPath), productData("research-1"));
    });

    const db = research.firestore();

    await assertFails(
      updateDoc(doc(db, productPath), {
        createdAt: new Date("2020-01-01T00:00:00.000Z"),
        updatedBy: "research-1",
      }),
    );

    await assertSucceeds(
      updateDoc(doc(db, productPath), {
        name: "Kaos HIMA Edisi Baru",
        updatedAt: serverTimestamp(),
        updatedBy: "research-1",
      }),
    );
  });

  await t.test("hanya admin yang boleh menghapus produk", async () => {
    await environment.clearFirestore();
    await environment.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), productPath), productData("research-1"));
    });

    await assertFails(deleteDoc(doc(research.firestore(), productPath)));
    await assertSucceeds(deleteDoc(doc(admin.firestore(), productPath)));
  });

  await t.test("varian mengikuti izin dan validasi produk", async () => {
    await environment.clearFirestore();
    await environment.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), productPath), productData("research-1"));
    });

    const db = research.firestore();
    const variantPath = `${productPath}/variants/var-1`;

    await assertSucceeds(setDoc(doc(db, variantPath), variantData()));
    await assertFails(
      setDoc(doc(db, `${productPath}/variants/var-2`), variantData({ sku: "" })),
    );
    await assertFails(
      setDoc(
        doc(db, `${productPath}/variants/var-3`),
        variantData({ sellingPriceOverrideIdr: 100_000.5 }),
      ),
    );

    const viewerSnapshot = await getDoc(doc(viewer.firestore(), variantPath));
    assert.equal(viewerSnapshot.exists(), true);

    await assertFails(deleteDoc(doc(db, variantPath)));
    await assertSucceeds(deleteDoc(doc(admin.firestore(), variantPath)));
  });

  await t.test("marketing hanya boleh membaca produk (tanpa products:write)", async () => {
    await environment.clearFirestore();
    await environment.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), productPath), productData("research-1"));
    });

    const db = marketing.firestore();

    await assertSucceeds(getDoc(doc(db, productPath)));
    await assertFails(
      setDoc(doc(db, "products/prod-marketing"), productData("marketing-1")),
    );
    await assertFails(
      updateDoc(doc(db, productPath), {
        sellingPriceIdr: 10_000,
        updatedAt: serverTimestamp(),
        updatedBy: "marketing-1",
      }),
    );
  });

  await t.test("profil pengguna tidak bisa menaikkan role sendiri", async () => {
    await environment.clearFirestore();
    await environment.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "users/research-1"), {
        displayName: "Tim Riset",
        role: "research",
      });
    });

    const db = research.firestore();

    await assertSucceeds(updateDoc(doc(db, "users/research-1"), { displayName: "Tim Riset" }));
    await assertFails(
      updateDoc(doc(db, "users/research-1"), { role: "entrepreneur_admin" }),
    );
    await assertFails(getDoc(doc(db, "users/admin-1")));
    await assertSucceeds(getDoc(doc(admin.firestore(), "users/research-1")));
  });
});
