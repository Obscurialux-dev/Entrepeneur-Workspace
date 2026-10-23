import type { Metadata } from "next";
import { ModulePlaceholder } from "@/components/shared/module-placeholder";

export const metadata: Metadata = { title: "Operasional" };

export default function OperationsPage() {
  return (
    <ModulePlaceholder
      title="Operasional"
      description="Tugas, penugasan PIC, timeline proyek, kalender tim, dan jadwal pribadi."
      phase="Phase 5"
      scope={[
        "Tugas dan penugasan lintas subdivisi",
        "Timeline proyek dan tenggat",
        "Kalender tim dan kalender pribadi",
        "Sinkronisasi satu arah ke Google Calendar",
      ]}
    />
  );
}
