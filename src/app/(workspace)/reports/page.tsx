import type { Metadata } from "next";
import { ModulePlaceholder } from "@/components/shared/module-placeholder";

export const metadata: Metadata = { title: "Laporan" };

export default function ReportsPage() {
  return (
    <ModulePlaceholder
      title="Laporan dan Ekspor"
      description="Ekspor CSV/XLSX, rekonsiliasi laporan, dan dashboard pemantauan untuk pimpinan."
      phase="Phase 6"
      scope={[
        "Ekspor CSV pesanan dan transaksi",
        "Keputusan XLSX / Google Sheets",
        "Dashboard eksekutif dengan akses baca terbatas",
        "Filter periode dan izin ekspor",
      ]}
    />
  );
}
