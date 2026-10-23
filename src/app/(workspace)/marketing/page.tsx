import type { Metadata } from "next";
import { ModulePlaceholder } from "@/components/shared/module-placeholder";

export const metadata: Metadata = { title: "Marketing" };

export default function MarketingPage() {
  return (
    <ModulePlaceholder
      title="Ruang Kerja Marketing"
      description="Perencanaan konten promosi, kampanye, jadwal publikasi Instagram, dan arsip media sosial."
      phase="Phase 4"
      scope={[
        "Perencanaan konten promosi",
        "Kampanye dan tujuan kampanye",
        "Kalender publikasi dan penugasan PIC",
        "Pencatatan tautan posting Instagram",
        "Arsip media sosial dan evaluasi performa",
      ]}
    />
  );
}
