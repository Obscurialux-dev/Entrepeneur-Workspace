/**
 * IDR parsing helpers for user input.
 *
 * Money is stored as integer rupiah. Users may type "95000", "95.000", or "Rp 95.000";
 * decimals are rejected instead of being silently rounded.
 */

const MAX_IDR = 1_000_000_000_000;

export type ParseResult = { ok: true; value: number } | { ok: false; message: string };

export function parseIdrInput(raw: string): ParseResult {
  const trimmed = raw.trim();

  if (trimmed === "") {
    return { ok: false, message: "Nominal wajib diisi." };
  }

  if (trimmed.includes(",")) {
    return { ok: false, message: "Nominal harus bilangan bulat rupiah tanpa desimal." };
  }

  const digits = trimmed
    .replace(/^rp\.?/i, "")
    .replace(/[\s.\u00a0]/g, "");

  if (!/^\d+$/.test(digits)) {
    return { ok: false, message: "Nominal hanya boleh berisi angka, titik pemisah ribuan, dan awalan Rp." };
  }

  const value = Number(digits);

  if (!Number.isSafeInteger(value)) {
    return { ok: false, message: "Nominal terlalu besar." };
  }

  if (value > MAX_IDR) {
    return { ok: false, message: "Nominal melebihi batas yang diizinkan." };
  }

  return { ok: true, value };
}

/** Formats an integer IDR amount as "95.000" (no currency symbol). */
export function formatIdrAmount(amount: number): string {
  return new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(amount);
}
