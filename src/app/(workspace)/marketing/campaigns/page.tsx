import type { Metadata } from "next";
import { ModulePlaceholder } from "@/components/shared/module-placeholder";

export const metadata: Metadata = { title: "Kampanye" };

export default function Page() {
  return (
    <ModulePlaceholder
      title="Kampanye"
      description="Halaman ini merupakan kerangka awal. Implementasi mengikuti backlog di docs/task.md."
      phase="Backlog"
      scope={[
        "Validasi dan otorisasi di server",
        "UI responsif dan aksesibel",
        "Integrasi Firestore setelah fondasi siap",
        "Pengujian sesuai acceptance criteria task",
      ]}
    />
  );
}
