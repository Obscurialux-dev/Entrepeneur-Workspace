"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn, formatCurrency } from "@/lib/utils";
import {
  Package,
  ShoppingCart,
  DollarSign,
  Users,
  AlertCircle,
  CheckCircle,
  FileText,
  Plus,
} from "lucide-react";
import Link from "next/link";

const stats = [
  {
    label: "Total Produk",
    value: "12",
    change: "+2 dari bulan lalu",
    icon: Package,
    color: "text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400",
  },
  {
    label: "Pesanan Aktif",
    value: "8",
    change: "3 perlu verifikasi",
    icon: ShoppingCart,
    color: "text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400",
  },
  {
    label: "Omzet Bulan Ini",
    value: formatCurrency(24500000),
    change: "+15% dari bulan lalu",
    icon: DollarSign,
    color: "text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400",
  },
  {
    label: "Anggota Aktif",
    value: "24",
    change: "5 riset, 8 marketing",
    icon: Users,
    color: "text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400",
  },
];

const recentOrders = [
  {
    id: "PO-2024-001",
    customer: "Ahmad Rizki",
    product: "Kaos Polos Premium - L",
    amount: 85000,
    status: "paid" as const,
    time: "2 jam lalu",
  },
  {
    id: "PO-2024-002",
    customer: "Siti Nurhaliza",
    product: "Tote Bag Custom - M",
    amount: 120000,
    status: "pending_payment" as const,
    time: "4 jam lalu",
  },
  {
    id: "PO-2024-003",
    customer: "Budi Santoso",
    product: "Stiker Vinyl Pack - 10 pcs",
    amount: 45000,
    status: "processing" as const,
    time: "6 jam lalu",
  },
  {
    id: "PO-2024-004",
    customer: "Dewi Sartika",
    product: "Kaos Polos Premium - M",
    amount: 85000,
    status: "completed" as const,
    time: "1 hari lalu",
  },
];

const tasks = [
  {
    id: "1",
    title: "Verifikasi pembayaran PO-2024-002",
    subdivision: "marketing",
    priority: "high" as const,
    dueAt: "Hari ini",
  },
  {
    id: "2",
    title: "Finalisasi desain konten edukasi minggu depan",
    subdivision: "research",
    priority: "medium" as const,
    dueAt: "Besok",
  },
  {
    id: "3",
    title: "Update stok kaos polos premium",
    subdivision: "shared",
    priority: "low" as const,
    dueAt: "Minggu ini",
  },
  {
    id: "4",
    title: "Siapkan laporan keuangan bulanan",
    subdivision: "shared",
    priority: "high" as const,
    dueAt: "Jumat",
  },
];

const activities = [
  {
    id: "1",
    action: "Pesanan baru",
    description: "PO-2024-001 dari Ahmad Rizki",
    time: "2 jam lalu",
    type: "order",
  },
  {
    id: "2",
    action: "Pembayaran diverifikasi",
    description: "PO-2023-045 oleh Ketua Divisi",
    time: "3 jam lalu",
    type: "payment",
  },
  {
    id: "3",
    action: "Produk ditambahkan",
    description: "Tote Bag Custom baru ditambahkan",
    time: "5 jam lalu",
    type: "product",
  },
  {
    id: "4",
    action: "Riset diselesaikan",
    description: "Analisis kompetitor Q4 2024",
    time: "1 hari lalu",
    type: "research",
  },
];

function StatCard({ label, value, change, icon: Icon, color }: (typeof stats)[number]) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="mt-1 truncate text-2xl font-bold tracking-tight">{value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{change}</p>
          </div>
          <div className={cn("shrink-0 rounded-xl p-3", color)}>
            <Icon className="h-6 w-6" aria-hidden="true" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const orderStatusMap = {
  pending_payment: { variant: "warning", label: "Menunggu Bayar" },
  paid: { variant: "info", label: "Dibayar" },
  processing: { variant: "secondary", label: "Diproses" },
  ready: { variant: "default", label: "Siap Kirim" },
  completed: { variant: "success", label: "Selesai" },
  cancelled: { variant: "destructive", label: "Dibatalkan" },
  payment_rejected: { variant: "destructive", label: "Ditolak" },
} as const;

type OrderStatus = keyof typeof orderStatusMap;

function StatusBadge({ status }: { status: OrderStatus }) {
  const { variant, label } = orderStatusMap[status];
  return <Badge variant={variant}>{label}</Badge>;
}

const priorityMap = {
  high: { variant: "destructive", label: "Tinggi" },
  medium: { variant: "warning", label: "Sedang" },
  low: { variant: "secondary", label: "Rendah" },
} as const;

type TaskPriority = keyof typeof priorityMap;

function PriorityBadge({ priority }: { priority: TaskPriority }) {
  const { variant, label } = priorityMap[priority];
  return <Badge variant={variant}>{label}</Badge>;
}

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Ringkasan Hari Ini</h2>
          <p className="text-sm text-muted-foreground">
            Metrik operasional dan aktivitas terbaru Divisi Entrepreneur.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm">
            <FileText className="mr-2 h-4 w-4" aria-hidden="true" />
            Ekspor Laporan
          </Button>
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
            Buat Pesanan
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg">Pesanan Terbaru</CardTitle>
              <Link href="/business/orders" className="text-sm text-primary hover:underline">
                Lihat semua
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <caption className="sr-only">Daftar pesanan terbaru</caption>
                  <thead>
                    <tr className="border-y bg-muted/50">
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Pesanan</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Pelanggan</th>
                      <th scope="col" className="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground md:table-cell">Produk</th>
                      <th scope="col" className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Total</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</th>
                      <th scope="col" className="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground sm:table-cell">Waktu</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {recentOrders.map((order) => (
                      <tr key={order.id} className="transition-colors hover:bg-muted/30">
                        <td className="px-4 py-3 font-mono text-sm">{order.id}</td>
                        <td className="px-4 py-3 text-sm font-medium">{order.customer}</td>
                        <td className="hidden px-4 py-3 text-sm text-muted-foreground md:table-cell">{order.product}</td>
                        <td className="px-4 py-3 text-right text-sm font-medium">{formatCurrency(order.amount)}</td>
                        <td className="px-4 py-3"><StatusBadge status={order.status} /></td>
                        <td className="hidden px-4 py-3 text-sm text-muted-foreground sm:table-cell">{order.time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>


        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <AlertCircle className="h-4 w-4 text-destructive" aria-hidden="true" />
                Tugas Prioritas
              </CardTitle>
              <Link href="/operations/tasks" className="text-sm text-primary hover:underline">
                Lihat semua
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {tasks.map((task) => (
                <div key={task.id} className="flex items-start gap-3 rounded-lg bg-muted/30 p-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{task.title}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <PriorityBadge priority={task.priority} />
                      <span className="text-xs text-muted-foreground">{task.dueAt}</span>
                    </div>
                  </div>
                  <CheckCircle className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
                </div>
              ))}
              <Button variant="link" className="w-full justify-start px-0">
                + Tambah Tugas
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Aktivitas Terbaru</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {activities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <div
                    className={cn(
                      "shrink-0 rounded-full p-2",
                      activity.type === "order" && "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
                      activity.type === "payment" && "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
                      activity.type === "product" && "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
                      activity.type === "research" && "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400"
                    )}
                  >
                    {activity.type === "order" && <ShoppingCart className="h-4 w-4" aria-hidden="true" />}
                    {activity.type === "payment" && <DollarSign className="h-4 w-4" aria-hidden="true" />}
                    {activity.type === "product" && <Package className="h-4 w-4" aria-hidden="true" />}
                    {activity.type === "research" && <FileText className="h-4 w-4" aria-hidden="true" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{activity.action}</p>
                    <p className="truncate text-sm text-muted-foreground">{activity.description}</p>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">{activity.time}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
