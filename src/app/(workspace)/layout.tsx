import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { WorkspaceLayout } from "@/components/layout/workspace-layout";
import { navItems } from "@/lib/navigation";
import { getSession } from "@/lib/auth/session.ts";

/**
 * Workspace routes are never static: navigation state (active link, breadcrumb, header
 * title) comes from `usePathname()` in the client shell, and the group is gated by
 * authentication: every request verifies the Firebase session cookie and redirects
 * anonymous visitors to /login. Server Actions enforce authorization separately via
 * `requirePermission()`.
 *
 * Dynamic segments such as `/business/products/[productId]` therefore render on every
 * request; `instant = false` opts the segment out of instant-navigation prerendering
 * instead of forcing every page into artificial Suspense boundaries.
 */
export const instant = false;

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function WorkspaceGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session.uid) {
    redirect("/login");
  }

  return (
    <WorkspaceLayout navItems={navItems} headerTitle="Entrepreneur Workspace">
      {children}
    </WorkspaceLayout>
  );
}
