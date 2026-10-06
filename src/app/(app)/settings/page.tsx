"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { useDisciplineStore, useStoreHydrated } from "@/lib/store";
import { createClient } from "@/lib/supabase/client";

function WakeTimeForm({ wakeTime, windowMinutes }: { wakeTime: string; windowMinutes: number }) {
  const setWakeTime = useDisciplineStore((s) => s.setWakeTime);
  const [time, setTime] = useState(wakeTime);
  const [win, setWin] = useState(windowMinutes);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    await setWakeTime(time, win);
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  }

  return (
    <div className="flex flex-col gap-4 rounded-3xl bg-surface p-5 ring-1 ring-border">
      <label className="flex flex-col gap-2">
        <span className="text-sm font-bold text-text">Giờ mong muốn</span>
        <input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="rounded-xl bg-background px-4 py-3 text-lg font-bold text-text ring-1 ring-border"
        />
      </label>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-bold text-text">Thời gian linh hoạt sau giờ đó</span>
        <div className="flex flex-wrap gap-2">
          {WINDOW_OPTIONS.map((m) => (
            <button
              key={m}
              onClick={() => setWin(m)}
              className={clsx(
                "rounded-full px-3 py-1.5 text-xs font-bold ring-1",
                win === m ? "bg-primary text-[#2a1a14] ring-primary" : "bg-surface-elevated text-text-muted ring-border"
              )}
            >
              {m} phút
            </button>
          ))}
        </div>
        <p className="text-xs text-text-faint">
          Ví dụ: {time} + {win} phút → điểm danh trước {addMinutes(time, win)} được tính đúng giờ.
        </p>
      </div>

      <button
        onClick={handleSave}
        className="mt-2 w-full rounded-2xl bg-linear-to-br from-primary to-primary-dark py-3 font-display font-bold text-[#2a1a14] shadow-lg shadow-primary/30"
      >
        {saved ? "Đã lưu ✓" : "Lưu cài đặt"}
      </button>
    </div>
  );
}

const WINDOW_OPTIONS = [15, 30, 45, 60, 90];

export default function SettingsPage() {
  const router = useRouter();
  const hydrated = useStoreHydrated();
  const { wakeTime, windowMinutes, resetProgress } = useDisciplineStore();
  const [confirmReset, setConfirmReset] = useState(false);
  const [accountEmail, setAccountEmail] = useState<string | null>(null);
  const [accountName, setAccountName] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return;
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return;
      setAccountEmail(data.user.email ?? null);
      setAccountName((data.user.user_metadata?.full_name as string | undefined) ?? null);
    });
  }, []);

  async function handleSignOut() {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6 px-5 pt-6 md:mx-auto md:max-w-2xl md:px-10 md:pt-10">
      <header>
        <p className="text-sm font-medium text-text-muted">Cài đặt</p>
        <h1 className="font-display text-2xl font-bold text-text">Khung giờ điểm danh</h1>
        <p className="mt-1 text-sm text-text-muted">
          Chọn giờ bạn muốn dậy mỗi ngày. Điểm danh trong khung giờ này sẽ được tính là đúng giờ.
        </p>
      </header>

      <WakeTimeForm key={hydrated ? "ready" : "loading"} wakeTime={wakeTime} windowMinutes={windowMinutes} />

      <div className="flex items-center justify-between rounded-3xl bg-surface p-5 ring-1 ring-border">
        <div>
          <p className="text-sm font-bold text-text">{accountName || "Tài khoản"}</p>
          <p className="text-xs text-text-muted">{accountEmail ?? "..."}</p>
        </div>
        <button
          onClick={handleSignOut}
          disabled={signingOut}
          className="rounded-full bg-surface-elevated px-4 py-2 text-xs font-bold text-text-muted ring-1 ring-border disabled:opacity-60"
        >
          {signingOut ? "Đang thoát..." : "Đăng xuất"}
        </button>
      </div>

      <Link
        href="/admin"
        className="flex items-center justify-between rounded-3xl bg-surface p-5 ring-1 ring-border"
      >
        <div>
          <p className="text-sm font-bold text-text">🛠️ Trang quản trị</p>
          <p className="text-xs text-text-muted">Thêm/sửa thú cưng &amp; cây cảnh</p>
        </div>
        <span className="text-text-faint">→</span>
      </Link>

      <div className="rounded-3xl bg-surface p-5 ring-1 ring-border">
        <p className="text-sm font-bold text-text">Thông tin hiện tại</p>
        <p className="mt-1 text-sm text-text-muted">
          Giờ đang đặt: <span className="font-bold text-text">{hydrated ? wakeTime : "--:--"}</span> • Linh hoạt:{" "}
          <span className="font-bold text-text">{hydrated ? windowMinutes : "--"} phút</span>
        </p>
      </div>

      <div className="rounded-3xl bg-surface/60 p-5 ring-1 ring-border">
        <p className="text-sm font-bold text-sad-soft">Vùng nguy hiểm</p>
        <p className="mt-1 text-xs text-text-faint">Xoá toàn bộ streak, tổng điểm danh và tiến trình nuôi thú/cây.</p>
        {confirmReset ? (
          <div className="mt-3 flex gap-2">
            <button
              onClick={async () => {
                await resetProgress();
                setConfirmReset(false);
              }}
              className="flex-1 rounded-xl bg-sad py-2 text-xs font-bold text-[#2a1016]"
            >
              Xác nhận xoá
            </button>
            <button
              onClick={() => setConfirmReset(false)}
              className="flex-1 rounded-xl bg-surface-elevated py-2 text-xs font-bold text-text-muted ring-1 ring-border"
            >
              Huỷ
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmReset(true)}
            className="mt-3 w-full rounded-xl bg-surface-elevated py-2 text-xs font-bold text-sad-soft ring-1 ring-border"
          >
            Đặt lại tiến trình
          </button>
        )}
      </div>
    </div>
  );
}

function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m + minutes, 0, 0);
  return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}
