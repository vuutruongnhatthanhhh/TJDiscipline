"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const TABS = [
  { href: "/", label: "Trang chủ", icon: "🏡" },
  { href: "/collection", label: "Bộ sưu tập", icon: "📖" },
  { href: "/settings", label: "Cài đặt", icon: "⏰" },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <nav
      className={[
        "order-2 flex shrink-0 items-stretch gap-1 border-t border-border bg-surface/90 px-3 py-2 backdrop-blur",
        "md:order-1 md:w-56 md:flex-col md:items-stretch md:gap-2 md:border-t-0 md:border-r md:bg-surface md:px-4 md:py-6 md:backdrop-blur-none",
      ].join(" ")}
    >
      <div className="mb-2 hidden items-center gap-2 px-2 md:flex">
        <span className="text-2xl leading-none">🐾🌱</span>
        <div>
          <p className="font-display text-sm font-bold leading-tight text-text">TJDiscipline</p>
          <p className="text-xs leading-tight text-text-muted">Dậy sớm mỗi ngày</p>
        </div>
      </div>

      {TABS.map((tab) => {
        const active = tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={clsx(
              "flex flex-1 flex-col items-center gap-0.5 rounded-2xl py-2 text-xs font-semibold transition-colors",
              "md:flex-none md:flex-row md:justify-start md:gap-2.5 md:rounded-xl md:px-3 md:py-2.5 md:text-sm",
              active ? "bg-primary/15 text-primary-soft" : "text-text-faint hover:text-text-muted"
            )}
          >
            <span className="text-lg leading-none">{tab.icon}</span>
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
