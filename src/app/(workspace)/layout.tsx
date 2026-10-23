import type { Metadata } from "next";
import { WorkspaceLayout } from "@/components/layout/workspace-layout";
import { navItems } from "@/lib/navigation";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function WorkspaceGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WorkspaceLayout navItems={navItems} headerTitle="Entrepreneur Workspace">
      {children}
    </WorkspaceLayout>
  );
}
