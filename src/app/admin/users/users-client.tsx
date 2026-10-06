"use client";

import { useState } from "react";
import clsx from "clsx";
import type { AppUser } from "@/lib/data/users";

export function UsersClient({ initialUsers }: { initialUsers: AppUser[] }) {
  const [users, setUsers] = useState(initialUsers);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleToggleBlock(u: AppUser) {
    setError(null);
    setBusyId(u.id);
    const action = u.isBlocked ? "unblock" : "block";
    const res = await fetch(`/api/admin/users/${u.id}/${action}`, { method: "POST" });
    setBusyId(null);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Có lỗi xảy ra, vui lòng thử lại.");
      return;
    }
    setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, isBlocked: !u.isBlocked } : x)));
  }

  async function handleDelete(u: AppUser) {
    setError(null);
    setBusyId(u.id);
    const res = await fetch(`/api/admin/users/${u.id}`, { method: "DELETE" });
    setBusyId(null);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Xoá thất bại, vui lòng thử lại.");
      return;
    }
    setUsers((prev) => prev.filter((x) => x.id !== u.id));
    setConfirmDeleteId(null);
  }

  return (
    <div className="flex flex-col gap-3">
      {error && <div className="rounded-xl bg-sad/15 px-3 py-2 text-sm text-sad-soft">{error}</div>}
      <p className="text-sm text-text-muted">{users.length} người dùng</p>

      {users.length === 0 ? (
        <p className="rounded-2xl bg-surface p-4 text-sm text-text-faint ring-1 ring-border">Chưa có ai đăng ký.</p>
      ) : (
        users.map((u) => (
          <div
            key={u.id}
            className="flex flex-col gap-3 rounded-2xl bg-surface p-4 ring-1 ring-border sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate font-display font-bold text-text">{u.fullName || u.email}</p>
                {u.isAdmin && (
                  <span className="shrink-0 rounded-full bg-gold/15 px-2 py-0.5 text-[10px] font-bold text-gold">
                    Admin
                  </span>
                )}
                {u.isBlocked && (
                  <span className="shrink-0 rounded-full bg-sad/15 px-2 py-0.5 text-[10px] font-bold text-sad-soft">
                    Đã khoá
                  </span>
                )}
              </div>
              <p className="truncate text-xs text-text-muted">{u.email}</p>
              <p className="mt-1 text-xs text-text-faint">
                🔥 Streak {u.streak} · 🏆 Kỷ lục {u.bestStreak} · 🗓️ {u.totalCheckIns} lần điểm danh
              </p>
              <p className="text-xs text-text-faint">Tham gia {formatDate(u.createdAt)}</p>
            </div>

            {!u.isAdmin && (
              <div className="flex shrink-0 gap-1.5">
                <button
                  onClick={() => handleToggleBlock(u)}
                  disabled={busyId === u.id}
                  className={clsx(
                    "rounded-full px-3 py-1.5 text-xs font-bold ring-1 disabled:opacity-60",
                    u.isBlocked
                      ? "bg-mint/15 text-mint ring-mint/30"
                      : "bg-surface-elevated text-text-muted ring-border"
                  )}
                >
                  {u.isBlocked ? "Mở khoá" : "Khoá"}
                </button>
                {confirmDeleteId === u.id ? (
                  <>
                    <button
                      onClick={() => handleDelete(u)}
                      disabled={busyId === u.id}
                      className="rounded-full bg-sad px-3 py-1.5 text-xs font-bold text-[#2a1016] disabled:opacity-60"
                    >
                      Xác nhận xoá?
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      className="rounded-full bg-surface-elevated px-3 py-1.5 text-xs font-bold text-text-muted ring-1 ring-border"
                    >
                      Huỷ
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setConfirmDeleteId(u.id)}
                    className="rounded-full bg-surface-elevated px-3 py-1.5 text-xs font-bold text-sad-soft ring-1 ring-border"
                  >
                    Xoá
                  </button>
                )}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}
