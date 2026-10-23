"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { Sidebar, type NavItem } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { cn } from "@/lib/utils";

interface WorkspaceLayoutProps {
  children: React.ReactNode;
  navItems: NavItem[];
  headerTitle: string;
  headerDescription?: string;
  headerActions?: React.ReactNode;
  className?: string;
}

function resolveTitle(pathname: string, navItems: NavItem[]): string | null {
  let best: { label: string; depth: number } | null = null;

  for (const item of navItems) {
    if (pathname === item.href) {
      if (!best || 1 > best.depth) best = { label: item.label, depth: 1 };
    }
    for (const child of item.children ?? []) {
      if (pathname === child.href) {
        if (!best || 2 > best.depth) best = { label: child.label, depth: 2 };
      }
    }
    if (pathname.startsWith(`${item.href}/`) && !best) {
      best = { label: item.label, depth: 1 };
    }
  }

  return best?.label ?? null;
}

export function WorkspaceLayout({
  children,
  navItems,
  headerTitle,
  headerDescription,
  headerActions,
  className,
}: WorkspaceLayoutProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const closeSidebar = React.useCallback(() => setSidebarOpen(false), []);
  const title = resolveTitle(pathname, navItems) ?? headerTitle;

  return (
    <div className={cn("flex min-h-screen bg-background", className)}>
      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={closeSidebar}
          aria-label="Tutup navigasi"
        />
      )}

      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 transition-transform duration-200 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <Sidebar items={navItems} onNavigate={closeSidebar} />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          title={title}
          description={headerDescription}
          actions={headerActions}
          onMenuClick={() => setSidebarOpen(true)}
        />
        <main className="flex-1 p-4 md:p-6">
          <div className="mx-auto w-full max-w-7xl">
            <Breadcrumb pathname={pathname} navItems={navItems} />
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

