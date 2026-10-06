import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { AdminTabs } from "./admin-tabs";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user || !user.isAdmin) {
    redirect("/");
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 px-5 py-8">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-text-muted">Quản trị</p>
          <h1 className="font-display text-2xl font-bold text-text">TJDiscipline</h1>
        </div>
        <div className="flex gap-2">
          <Link
            href="/"
            className="rounded-full bg-primary/15 px-4 py-2 text-sm font-bold text-primary-soft ring-1 ring-primary/30"
          >
            ☀️ Vào chơi
          </Link>
          <Link href="/settings" className="rounded-full bg-surface px-4 py-2 text-sm font-bold text-text-muted ring-1 ring-border">
            ⏰ Cài đặt
          </Link>
        </div>
      </header>
      <AdminTabs />
      {children}
    </div>
  );
}
