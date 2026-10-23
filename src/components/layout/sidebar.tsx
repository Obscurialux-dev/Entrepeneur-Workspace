"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export interface NavItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
  badge?: string;
  children?: { label: string; href: string }[];
}

interface SidebarProps {
  items: NavItem[];
  className?: string;
  onNavigate?: () => void;
}

export function Sidebar({ items, className, onNavigate }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn("flex h-full w-64 flex-col border-r bg-card", className)}
      aria-label="Navigasi utama"
    >
      <div className="flex h-16 items-center border-b px-4">
        <Link
          href="/dashboard"
          className="text-base font-semibold tracking-tight"
          onClick={onNavigate}
        >
          Entrepreneur <span className="text-primary">Workspace</span>
        </Link>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {items.map((item) => (
          <NavItemComponent
            key={item.href}
            item={item}
            pathname={pathname}
            onNavigate={onNavigate}
          />
        ))}
      </nav>
      <div className="border-t p-4">
        <p className="text-center text-xs text-muted-foreground">
          Divisi Entrepreneur HIMA
        </p>
      </div>
    </aside>
  );
}

function NavItemComponent({
  item,
  pathname,
  onNavigate,
}: {
  item: NavItem;
  pathname: string;
  onNavigate?: () => void;
}) {
  const hasChildren = Boolean(item.children?.length);
  const isActive =
    pathname === item.href || pathname.startsWith(`${item.href}/`);
  const [isOpen, setIsOpen] = React.useState(isActive);

  const baseClasses =
    "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
  const activeClasses = "bg-primary text-primary-foreground";
  const idleClasses =
    "text-muted-foreground hover:bg-accent hover:text-foreground";

  if (hasChildren) {
    return (
      <div className="space-y-1">
        <button
          type="button"
          aria-expanded={isOpen}
          onClick={() => setIsOpen((open) => !open)}
          className={cn(
            baseClasses,
            "justify-between text-left",
            isActive ? activeClasses : idleClasses
          )}
        >
          <span className="flex items-center gap-2">
            {item.icon}
            {item.label}
          </span>
          <svg
            className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
        {isOpen && (
          <div className="ml-4 space-y-1 border-l pl-3">
            {item.children!.map((child) => (
              <Link
                key={child.href}
                href={child.href}
                onClick={onNavigate}
                className={cn(
                  "block rounded-md px-2 py-1.5 text-sm transition-colors",
                  pathname === child.href
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                {child.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(baseClasses, isActive ? activeClasses : idleClasses)}
      aria-current={isActive ? "page" : undefined}
    >
      {item.icon}
      {item.label}
      {item.badge && (
        <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
          {item.badge}
        </span>
      )}
    </Link>
  );
}
