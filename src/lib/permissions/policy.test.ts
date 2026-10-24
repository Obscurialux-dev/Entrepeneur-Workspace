import assert from "node:assert/strict";
import test from "node:test";
import {
  can,
  ForbiddenError,
  isRole,
  permissionsForRole,
  ROLES,
  type Role,
} from "./policy.ts";

test("isRole hanya menerima role resmi", () => {
  for (const role of ROLES) {
    assert.equal(isRole(role), true);
  }

  for (const value of ["admin", "Admin", "", null, undefined, 42, "entrepreneur_admin "]) {
    assert.equal(isRole(value), false, `nilai ${String(value)} seharusnya ditolak`);
  }
});

test("entrepreneur_admin memiliki semua permission", () => {
  const admin: Role = "entrepreneur_admin";

  assert.equal(can(admin, "products:write"), true);
  assert.equal(can(admin, "products:manage-status"), true);
  assert.equal(can(admin, "orders:read"), true);
  assert.equal(can(admin, "finance:read"), true);
  assert.equal(can(admin, "reports:read"), true);
  assert.equal(can(admin, "research:write"), true);
  assert.equal(can(admin, "marketing:write"), true);
});

test("executive_viewer hanya boleh membaca", () => {
  const viewer: Role = "executive_viewer";

  assert.equal(can(viewer, "orders:read"), true);
  assert.equal(can(viewer, "finance:read"), true);
  assert.equal(can(viewer, "reports:read"), true);
  assert.equal(can(viewer, "products:read"), true);

  assert.equal(can(viewer, "products:write"), false);
  assert.equal(can(viewer, "products:manage-status"), false);
  assert.equal(can(viewer, "research:write"), false);
  assert.equal(can(viewer, "marketing:write"), false);
});

test("research dan marketing tidak saling mewarisi izin tulis", () => {
  assert.equal(can("research", "products:write"), true);
  assert.equal(can("research", "research:write"), true);
  assert.equal(can("research", "marketing:write"), false);
  assert.equal(can("research", "finance:read"), false);

  assert.equal(can("marketing", "marketing:write"), true);
  assert.equal(can("marketing", "products:read"), true);
  assert.equal(can("marketing", "products:write"), false);
  assert.equal(can("marketing", "research:write"), false);
});

test("permissionsForRole mengembalikan daftar yang konsisten dengan can()", () => {
  for (const role of ROLES) {
    const permissions = permissionsForRole(role);
    assert.ok(permissions.length > 0);

    for (const permission of permissions) {
      assert.equal(can(role, permission), true);
    }
  }
});

test("can() menolak sesi anonim dan role tidak dikenal", () => {
  for (const permission of ["products:read", "products:write", "reports:read"] as const) {
    assert.equal(can(null, permission), false);
    assert.equal(can(undefined, permission), false);
  }

  // Nilai dari token yang tidak dikenal tidak boleh lolos sebagai izin.
  assert.equal(can("admin" as Role, "products:write"), false);
});

test("ForbiddenError membawa role dan permission yang ditolak", () => {
  const error = new ForbiddenError("executive_viewer", "products:write");

  assert.ok(error instanceof Error);
  assert.equal(error.name, "ForbiddenError");
  assert.equal(error.role, "executive_viewer");
  assert.equal(error.permission, "products:write");
  assert.match(error.message, /executive_viewer/);
});

test("ForbiddenError menerima aktor anonim", () => {
  const error = new ForbiddenError("anonymous", "products:write");

  assert.equal(error.role, "anonymous");
  assert.match(error.message, /anonymous/);
});
