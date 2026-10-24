"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/auth/session";
import { ForbiddenError, type Permission } from "@/lib/permissions/policy";
import { PRODUCT_FORM_FIELDS, type FormState, VARIANT_FORM_FIELDS } from "./form-state.ts";
import { ProductRepositoryError, type ProductRepository } from "./repository.ts";
import { getProductRepository } from "./repository.firestore.ts";
import { productFormSchema, toFieldErrors, variantFormSchema } from "./schema.ts";
import type { ProductDraft, ProductStatus, VariantDraft } from "./types.ts";
import { PRODUCT_STATUSES } from "./types.ts";

/**
 * Server Actions for products and variants.
 *
 * Server Actions are reachable via direct POST, so each action re-checks authorization
 * and re-validates every submitted value. Prices/HPP/status come from the validated form
 * payload; the repository records the actor from the session, never from the form.
 */

function formValues(formData: FormData, fields: readonly string[]): Record<string, string> {
  const values: Record<string, string> = {};

  for (const field of fields) {
    const value = formData.get(field);
    if (typeof value === "string") {
      values[field] = value;
    }
  }

  return values;
}

function formObject(formData: FormData): Record<string, string> {
  const result: Record<string, string> = {};

  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") {
      result[key] = value;
    }
  }

  return result;
}

type Authorization = { ok: true; uid: string } | { ok: false; state: FormState };

async function authorize(
  permission: Permission,
  values: Record<string, string>,
): Promise<Authorization> {
  try {
    const session = await requirePermission(permission);
    return { ok: true, uid: session.uid };
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return {
        ok: false,
        state: {
          status: "error",
          message: "Anda tidak memiliki izin untuk melakukan tindakan ini.",
          values,
        },
      };
    }
    throw error;
  }
}

function repositoryFailure(error: unknown, values: Record<string, string>): FormState {
  if (error instanceof ProductRepositoryError) {
    if (error.code === "DUPLICATE_SKU") {
      return {
        status: "error",
        message: error.message,
        fieldErrors: { sku: error.message },
        values,
      };
    }

    return { status: "error", message: error.message, values };
  }

  console.error("Gagal mengakses penyimpanan produk:", error);
  return {
    status: "error",
    message: "Gagal menyimpan data. Coba lagi atau hubungi admin.",
    values,
  };
}

function revalidateProductPaths(productId?: string): void {
  revalidatePath("/business/products");
  if (productId) {
    revalidatePath(`/business/products/${productId}`);
  }
}

function requireField(formData: FormData, field: string): string {
  const value = formData.get(field);
  return typeof value === "string" ? value : "";
}

export async function createProductAction(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const values = formValues(formData, PRODUCT_FORM_FIELDS);

  const auth = await authorize("products:write", values);
  if (!auth.ok) return auth.state;

  const parsed = productFormSchema.safeParse(formObject(formData));

  if (!parsed.success) {
    return {
      status: "error",
      message: "Periksa kembali isian produk.",
      fieldErrors: toFieldErrors(parsed.error),
      values,
    };
  }

  const repository: ProductRepository = getProductRepository();
  let productId: string;

  try {
    const created = await repository.create(parsed.data as ProductDraft, auth.uid);
    productId = created.id;
  } catch (error) {
    return repositoryFailure(error, values);
  }

  revalidateProductPaths(productId);
  redirect(`/business/products/${productId}?created=1`);
}

export async function updateProductAction(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const values = formValues(formData, PRODUCT_FORM_FIELDS);
  const productId = requireField(formData, "productId");

  const auth = await authorize("products:write", values);
  if (!auth.ok) return auth.state;

  if (productId === "") {
    return { status: "error", message: "Produk tidak ditemukan.", values };
  }

  const parsed = productFormSchema.safeParse(formObject(formData));

  if (!parsed.success) {
    return {
      status: "error",
      message: "Periksa kembali isian produk.",
      fieldErrors: toFieldErrors(parsed.error),
      values,
    };
  }

  try {
    await getProductRepository().update(productId, parsed.data as ProductDraft, auth.uid);
  } catch (error) {
    return repositoryFailure(error, values);
  }

  revalidateProductPaths(productId);

  return { status: "success", message: "Perubahan produk disimpan.", values };
}

export async function setProductStatusAction(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const productId = requireField(formData, "productId");
  const status = requireField(formData, "status");
  const values = { status };

  const auth = await authorize("products:manage-status", values);
  if (!auth.ok) return auth.state;

  if (!(PRODUCT_STATUSES as readonly string[]).includes(status)) {
    return { status: "error", message: "Status produk tidak dikenal.", values };
  }

  if (productId === "") {
    return { status: "error", message: "Produk tidak ditemukan.", values };
  }

  try {
    await getProductRepository().setStatus(productId, status as ProductStatus, auth.uid);
  } catch (error) {
    return repositoryFailure(error, values);
  }

  revalidateProductPaths(productId);

  return { status: "success", message: "Status produk diperbarui.", values };
}

export async function addVariantAction(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const values = formValues(formData, VARIANT_FORM_FIELDS);
  const productId = requireField(formData, "productId");

  const auth = await authorize("products:write", values);
  if (!auth.ok) return auth.state;

  if (productId === "") {
    return { status: "error", message: "Produk tidak ditemukan.", values };
  }

  const parsed = variantFormSchema.safeParse(formObject(formData));

  if (!parsed.success) {
    return {
      status: "error",
      message: "Periksa kembali isian varian.",
      fieldErrors: toFieldErrors(parsed.error),
      values,
    };
  }

  try {
    await getProductRepository().addVariant(productId, parsed.data as VariantDraft);
  } catch (error) {
    return repositoryFailure(error, values);
  }

  revalidateProductPaths(productId);

  return { status: "success", message: "Varian ditambahkan.", values: {} };
}


export async function updateVariantAction(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const values = formValues(formData, VARIANT_FORM_FIELDS);
  const productId = requireField(formData, "productId");
  const variantId = requireField(formData, "variantId");

  const auth = await authorize("products:write", values);
  if (!auth.ok) return auth.state;

  if (productId === "" || variantId === "") {
    return { status: "error", message: "Varian tidak ditemukan.", values };
  }

  const parsed = variantFormSchema.safeParse(formObject(formData));

  if (!parsed.success) {
    return {
      status: "error",
      message: "Periksa kembali isian varian.",
      fieldErrors: toFieldErrors(parsed.error),
      values,
    };
  }

  try {
    await getProductRepository().updateVariant(
      productId,
      variantId,
      parsed.data as VariantDraft,
    );
  } catch (error) {
    return repositoryFailure(error, values);
  }

  revalidateProductPaths(productId);

  return { status: "success", message: "Varian diperbarui.", values };
}

export async function removeVariantAction(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const productId = requireField(formData, "productId");
  const variantId = requireField(formData, "variantId");

  const auth = await authorize("products:write", {});
  if (!auth.ok) return auth.state;

  if (productId === "" || variantId === "") {
    return { status: "error", message: "Varian tidak ditemukan." };
  }

  try {
    await getProductRepository().removeVariant(productId, variantId);
  } catch (error) {
    return repositoryFailure(error, {});
  }

  revalidateProductPaths(productId);

  return { status: "success", message: "Varian dihapus." };
}

