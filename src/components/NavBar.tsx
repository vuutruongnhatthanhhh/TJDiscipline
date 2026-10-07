"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const TABS = [
  { href: "/", label: "Trang chủ", icon: "🏡" },
  { href: "/explore", label: "Khám phá", icon: "🧭" },
  { href: "/collection", label: "Bộ sưu tập", icon: "📖" },
  { href: "/settings", label: "Cài đặt", icon: "⏰" },
];

export default function NavBar() {
  const pathname = usePathname();
  const [isMenuOpen, setMenuOpen] = useState(false);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <>
      <header className="flex shrink-0 items-center justify-between border-b border-border bg-surface/90 px-4 py-3 backdrop-blur md:hidden">
        <div className="flex items-center gap-2">
          <span className="text-xl leading-none">🐾🌱</span>
          <p className="font-display text-sm font-bold leading-tight text-text">TJDiscipline</p>
        </div>
        <button
          onClick={() => setMenuOpen(true)}
          aria-label="Mở menu"
          className="flex h-9 w-9 items-center justify-center rounded-full text-xl text-text-muted ring-1 ring-border"
        >
          ☰
        </button>
      </header>

      {isMenuOpen && (
        <div className="absolute inset-0 z-40 bg-black/40 md:hidden" onClick={() => setMenuOpen(false)} />
      )}

      <div
        className={clsx(
          "absolute right-0 top-0 z-50 flex h-full w-[78%] max-w-xs flex-col bg-surface shadow-2xl shadow-black/40 ring-1 ring-border transition-transform duration-300 ease-in-out md:hidden",
          isMenuOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-xl leading-none">🐾🌱</span>
            <p className="font-display text-sm font-bold leading-tight text-text">TJDiscipline</p>
          </div>
          <button
            onClick={() => setMenuOpen(false)}
            aria-label="Đóng menu"
            className="flex h-9 w-9 items-center justify-center rounded-full text-xl text-text-muted ring-1 ring-border"
          >
            ✕
          </button>
        </div>
        <nav className="flex flex-col gap-1 px-3 py-4">
          {TABS.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              onClick={() => setMenuOpen(false)}
              className={clsx(
                "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
                isActive(tab.href) ? "bg-primary/15 text-primary-soft" : "text-text-faint hover:text-text-muted"
              )}
            >
              <span className="text-lg leading-none">{tab.icon}</span>
              {tab.label}
            </Link>
          ))}
        </nav>
      </div>

      <nav className="hidden shrink-0 flex-col gap-2 border-r border-border bg-surface px-4 py-6 md:flex md:w-56">
        <div className="mb-2 flex items-center gap-2 px-2">
          <span className="text-2xl leading-none">🐾🌱</span>
          <div>
            <p className="font-display text-sm font-bold leading-tight text-text">TJDiscipline</p>
            <p className="text-xs leading-tight text-text-muted">Dậy sớm mỗi ngày</p>
          </div>
        </div>

        {TABS.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={clsx(
              "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
              isActive(tab.href) ? "bg-primary/15 text-primary-soft" : "text-text-faint hover:text-text-muted"
            )}
          >
            <span className="text-lg leading-none">{tab.icon}</span>
            {tab.label}
          </Link>
        ))}
      </nav>
    </>
  );
}
