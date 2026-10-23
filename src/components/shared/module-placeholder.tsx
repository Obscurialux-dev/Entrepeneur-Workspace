import type { ReactNode } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ModulePlaceholderProps {
  title: string;
  description: string;
  scope: string[];
  icon?: ReactNode;
  phase?: string;
}

export function ModulePlaceholder({
  title,
  description,
  scope,
  icon,
  phase,
}: ModulePlaceholderProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            {icon}
            <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
          </div>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            {description}
          </p>
        </div>
        <Badge variant="secondary">{phase ?? "Fondasi"}</Badge>
      </div>

      <Card>
        <CardContent className="p-6">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Rencana modul
          </h3>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {scope.map((item) => (
              <li
                key={item}
                className="flex items-start gap-2 rounded-md bg-muted/40 px-3 py-2 text-sm"
              >
                <span aria-hidden="true" className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-muted-foreground">
            Modul ini belum diimplementasikan. Fondasi aplikasi, tata letak, dan
            konvensi sudah siap untuk pengembangan bertahap sesuai{" "}
            <Link href="/dashboard" className="text-primary hover:underline">
              docs/task.md
            </Link>
            .
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
