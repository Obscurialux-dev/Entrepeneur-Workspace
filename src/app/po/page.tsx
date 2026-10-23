import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Open PO",
  description: "Daftar kampanye Open PO Divisi Entrepreneur HIMA.",
};

const demoCampaigns = [
  {
    slug: "kaos-hima-2026",
    title: "Kaos HIMA Edisi 2026",
    description:
      "Kaos eksklusif dengan bahan cotton combed 30s. Open PO dibuka terbatas untuk anggota HIMA.",
    price: 95000,
    status: "active" as const,
    closesAt: "31 Okt 2026",
  },
  {
    slug: "tote-bag-custom",
    title: "Tote Bag Custom",
    description:
      "Tote bag kanvas dengan desain custom divisi. Tersedia dalam dua ukuran.",
    price: 75000,
    status: "scheduled" as const,
    closesAt: "7 Nov 2026",
  },
];

export default function PublicOrderPage() {
  return (
    <div className="space-y-8">
      <section className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Open PO</h1>
        <p className="max-w-2xl text-muted-foreground">
          Pesan produk resmi Divisi Entrepreneur HIMA tanpa perlu membuat akun.
          Data yang ditampilkan di sini hanya informasi publik kampanye.
        </p>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        {demoCampaigns.map((campaign) => (
          <Card key={campaign.slug}>
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
              <div>
                <CardTitle className="text-lg">{campaign.title}</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  Ditutup {campaign.closesAt}
                </p>
              </div>
              <Badge
                variant={campaign.status === "active" ? "success" : "secondary"}
              >
                {campaign.status === "active" ? "Aktif" : "Dijadwalkan"}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {campaign.description}
              </p>
              <p className="text-lg font-semibold">
                {formatCurrency(campaign.price)}
              </p>
              <p className="text-xs text-muted-foreground">
                Formulir pemesanan akan tersedia setelah backend Open PO
                diimplementasikan (Phase 2).
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
