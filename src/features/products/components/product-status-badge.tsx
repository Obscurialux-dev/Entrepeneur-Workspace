import { Badge } from "@/components/ui/badge";
import type { ProductStatus } from "@/features/products/types.ts";
import { PRODUCT_STATUS_LABELS } from "@/features/products/types.ts";

const STATUS_VARIANTS: Record<ProductStatus, "outline" | "info" | "success" | "secondary"> = {
  research: "outline",
  approved: "info",
  active: "success",
  archived: "secondary",
};

export function ProductStatusBadge({ status }: { status: ProductStatus }) {
  return <Badge variant={STATUS_VARIANTS[status]}>{PRODUCT_STATUS_LABELS[status]}</Badge>;
}
