import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  BarChart3,
  Users,
  BookOpen,
  Megaphone,
} from "lucide-react";
import type { NavItem } from "@/components/layout/sidebar";

export const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: <LayoutDashboard className="h-5 w-5" aria-hidden="true" />,
  },
  {
    label: "Bisnis",
    href: "/business",
    icon: <Package className="h-5 w-5" aria-hidden="true" />,
    children: [
      { label: "Produk", href: "/business/products" },
      { label: "Open PO", href: "/business/po-campaigns" },
      { label: "Pesanan", href: "/business/orders" },
      { label: "Inventaris", href: "/business/inventory" },
      { label: "Keuangan", href: "/business/finance" },
    ],
  },
  {
    label: "Riset",
    href: "/research",
    icon: <BookOpen className="h-5 w-5" aria-hidden="true" />,
    children: [
      { label: "Proyek Riset", href: "/research/projects" },
      { label: "Laporan Riset", href: "/research/reports" },
      { label: "Vendor", href: "/research/vendors" },
      { label: "Konten Edukasi", href: "/research/content" },
    ],
  },
  {
    label: "Marketing",
    href: "/marketing",
    icon: <Megaphone className="h-5 w-5" aria-hidden="true" />,
    children: [
      { label: "Kampanye", href: "/marketing/campaigns" },
      { label: "Kalender Publikasi", href: "/marketing/calendar" },
      { label: "Arsip Media Sosial", href: "/marketing/archive" },
    ],
  },
  {
    label: "Operasional",
    href: "/operations",
    icon: <Users className="h-5 w-5" aria-hidden="true" />,
    children: [
      { label: "Tugas", href: "/operations/tasks" },
      { label: "Timeline", href: "/operations/timeline" },
      { label: "Kalender Tim", href: "/operations/calendar" },
    ],
  },
  {
    label: "Laporan",
    href: "/reports",
    icon: <BarChart3 className="h-5 w-5" aria-hidden="true" />,
    children: [
      { label: "Ekspor Data", href: "/reports/export" },
      { label: "Dashboard Eksekutif", href: "/reports/executive" },
    ],
  },
];

export const publicNavItems: NavItem[] = [
  {
    label: "Open PO",
    href: "/po",
    icon: <ShoppingCart className="h-5 w-5" aria-hidden="true" />,
  },
];
