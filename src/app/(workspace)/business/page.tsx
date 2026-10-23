import type { Metadata } from "next";
import { ModulePlaceholder } from "@/components/shared/module-placeholder";

export const metadata: Metadata = { title: "Bisnis" };

export default function BusinessPage() {
  return (
    <ModulePlaceholder
      title="Bisnis"
      description="Katalog produk, kampanye Open PO, pesanan, inventaris, dan pencatatan keuangan operasional."
      phase="Phase 2–3"
      scope={[
        "Produk dan varian dengan harga IDR integer",
        "Kampanye Open PO dan tautan publik",
        "Pesanan, verifikasi pembayaran, dan pemenuhan",
        "Pergerakan stok atomik dan audit",
        "Transaksi operasional: omzet, HPP, laba, kas",
      ]}
    />
  );
}
