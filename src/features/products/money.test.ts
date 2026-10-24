import assert from "node:assert/strict";
import test from "node:test";
import { formatIdrAmount, parseIdrInput } from "./money.ts";

test("parseIdrInput menerima format umum rupiah", () => {
  assert.deepEqual(parseIdrInput("95000"), { ok: true, value: 95000 });
  assert.deepEqual(parseIdrInput("95.000"), { ok: true, value: 95000 });
  assert.deepEqual(parseIdrInput("Rp 95.000"), { ok: true, value: 95000 });
  assert.deepEqual(parseIdrInput("Rp95.000"), { ok: true, value: 95000 });
  assert.deepEqual(parseIdrInput(" 1.000.000 "), { ok: true, value: 1_000_000 });
  assert.deepEqual(parseIdrInput("0"), { ok: true, value: 0 });
});

test("parseIdrInput menolak input kosong dan desimal", () => {
  assert.equal(parseIdrInput("").ok, false);
  assert.equal(parseIdrInput("   ").ok, false);
  assert.equal(parseIdrInput("95.000,50").ok, false);
  assert.equal(parseIdrInput("95,5").ok, false);
});

test("parseIdrInput menolak teks dan angka negatif", () => {
  assert.equal(parseIdrInput("abc").ok, false);
  assert.equal(parseIdrInput("1e5").ok, false);
  assert.equal(parseIdrInput("-95000").ok, false);
  assert.equal(parseIdrInput("12x000").ok, false);
});

test("parseIdrInput menolak nominal di luar batas aman", () => {
  const result = parseIdrInput("9".repeat(20));
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.match(result.message, /terlalu besar|melebihi batas/);
  }
});

test("formatIdrAmount memakai pemisah ribuan Indonesia", () => {
  assert.equal(formatIdrAmount(95_000), "95.000");
  assert.equal(formatIdrAmount(1_250_000), "1.250.000");
  assert.equal(formatIdrAmount(0), "0");
});
