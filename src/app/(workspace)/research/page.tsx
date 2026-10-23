import type { Metadata } from "next";
import { ModulePlaceholder } from "@/components/shared/module-placeholder";

export const metadata: Metadata = { title: "Riset" };

export default function ResearchPage() {
  return (
    <ModulePlaceholder
      title="Ruang Kerja Riset"
      description="Riset produk dan pasar, analisis kompetitor, basis data vendor, laporan riset, serta produksi materi edukasi."
      phase="Phase 4"
      scope={[
        "Proyek riset dan hipotesis",
        "Laporan riset dengan sumber",
        "Basis data vendor dan lead time",
        "Perencanaan konten edukasi",
        "Serah terima materi siap publikasi ke Marketing",
      ]}
    />
  );
}
