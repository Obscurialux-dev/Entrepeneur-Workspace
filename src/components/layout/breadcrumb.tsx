import Link from "next/link";
import type { NavItem } from "@/components/layout/sidebar";

interface BreadcrumbProps {
  pathname: string;
  navItems: NavItem[];
}

interface Crumb {
  label: string;
  href: string;
}

function buildCrumbs(pathname: string, navItems: NavItem[]): Crumb[] {
  for (const item of navItems) {
    if (pathname === item.href) {
      return [{ label: item.label, href: item.href }];
    }

    const child = item.children?.find((entry) => pathname === entry.href);
    if (child) {
      return [
        { label: item.label, href: item.href },
        { label: child.label, href: child.href },
      ];
    }

    if (pathname.startsWith(`${item.href}/`)) {
      return [{ label: item.label, href: item.href }];
    }
  }

  return [];
}

export function Breadcrumb({ pathname, navItems }: BreadcrumbProps) {
  const crumbs = buildCrumbs(pathname, navItems);
  if (crumbs.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
        <li>
          <Link href="/dashboard" className="hover:text-foreground">
            Beranda
          </Link>
        </li>
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;
          return (
            <li key={crumb.href} className="flex items-center gap-1">
              <span aria-hidden="true">/</span>
              {isLast ? (
                <span aria-current="page" className="font-medium text-foreground">
                  {crumb.label}
                </span>
              ) : (
                <Link href={crumb.href} className="hover:text-foreground">
                  {crumb.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
