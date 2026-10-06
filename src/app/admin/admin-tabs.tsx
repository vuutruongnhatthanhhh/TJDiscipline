"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const TABS = [
  { href: "/admin", label: "🐾 Loài", exact: true },
  { href: "/admin/users", label: "👤 Người dùng", exact: false },
];

export function AdminTabs() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-2">
      {TABS.map((tab) => {
        const active = tab.exact ? pathname === tab.href : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={clsx(
              "rounded-full px-4 py-2 text-sm font-bold ring-1",
              active ? "bg-primary/15 text-primary-soft ring-primary/40" : "bg-surface text-text-muted ring-border"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
