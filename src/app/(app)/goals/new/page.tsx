"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import clsx from "clsx";
import TaskListEditor, { type DraftTask } from "@/components/TaskListEditor";
import Skeleton from "@/components/Skeleton";

interface Player {
  id: string;
  name: string;
}

export default function NewGoalPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [durationDays, setDurationDays] = useState(21);
  const [penaltyAmount, setPenaltyAmount] = useState(20000);
  const [tasks, setTasks] = useState<DraftTask[]>([]);
  const [partnerId, setPartnerId] = useState<string | null>(null);

  const [players, setPlayers] = useState<Player[] | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/goals/players")
      .then((res) => res.json())
      .then((data) => setPlayers(data.players ?? []))
      .catch(() => setPlayers([]));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) return setError("Vui lòng đặt tên mục tiêu");
    if (tasks.length === 0) return setError("Vui lòng thêm ít nhất 1 việc cần làm");
    if (!partnerId) return setError("Vui lòng chọn người chơi để mời");

    setSubmitting(true);
    const res = await fetch("/api/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        durationDays,
        penaltyAmount,
        partnerId,
        tasks,
      }),
    });
    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Có lỗi xảy ra, vui lòng thử lại");
      return;
    }

    const data = await res.json();
    router.push(`/goals/${data.id}`);
  }

  return (
    <div className="flex flex-col gap-6 px-5 pt-6 md:mx-auto md:max-w-2xl md:px-10 md:pt-10">
      <Link href="/goals" className="text-sm font-bold text-text-muted">
        ← Mục tiêu
      </Link>

      <header>
        <h1 className="font-display text-2xl font-bold text-text">Tạo mục tiêu chung</h1>
        <p className="mt-1 text-sm text-text-muted">
          Mời 1 người chơi cùng thực hiện — mỗi việc trong checklist có khung giờ riêng, lỡ việc nào thì tự bị phạt việc đó.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {error && <div className="rounded-xl bg-sad/15 px-3 py-2 text-sm text-sad-soft">{error}</div>}

        <Field label="Tên mục tiêu *">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="VD: 21 ngày dậy sớm đọc sách"
            className="rounded-xl bg-background px-4 py-3 text-base text-text ring-1 ring-border placeholder:text-text-faint"
          />
        </Field>

        <Field label="Số ngày thực hiện *">
          <input
            type="number"
            min={1}
            max={365}
            value={durationDays}
            onChange={(e) => setDurationDays(Math.max(1, Number(e.target.value) || 1))}
            className="rounded-xl bg-background px-4 py-3 text-base text-text ring-1 ring-border"
          />
        </Field>

        <Field label="Mức phạt mỗi việc lỡ (đ) *">
          <input
            type="number"
            min={0}
            step={1000}
            value={penaltyAmount}
            onChange={(e) => setPenaltyAmount(Math.max(0, Number(e.target.value) || 0))}
            className="rounded-xl bg-background px-4 py-3 text-base text-text ring-1 ring-border"
          />
          <p className="mt-1 text-xs text-text-faint">
            Áp dụng như nhau cho cả 2 người — lỡ khung giờ của việc nào thì bị phạt đúng việc đó.
          </p>
        </Field>

        <Field label="Việc cần làm của bạn *">
          <TaskListEditor tasks={tasks} onChange={setTasks} />
          <p className="mt-1 text-xs text-text-faint">
            Mỗi việc tự đặt giờ, thời gian linh hoạt và ngày trong tuần riêng. Đối tác sẽ tự thêm checklist (và khung
            giờ) riêng của họ khi chấp nhận lời mời — 2 người có thể hoàn toàn khác nhau.
          </p>
        </Field>

        <Field label="Mời ai cùng thực hiện? *">
          {players === null ? (
            <Skeleton className="h-24 rounded-2xl" />
          ) : players.length === 0 ? (
            <p className="rounded-xl bg-background px-4 py-3 text-sm text-text-faint ring-1 ring-border">
              Chưa có người chơi nào khác trong hệ thống.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {players.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPartnerId(p.id)}
                  className={clsx(
                    "flex items-center gap-3 rounded-xl px-4 py-2.5 text-left ring-1 transition-colors",
                    partnerId === p.id ? "bg-primary/15 ring-primary" : "bg-background ring-border hover:bg-surface-elevated"
                  )}
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-primary to-primary-dark text-xs font-bold text-[#2a1a14]">
                    {p.name.trim().charAt(0).toUpperCase() || "?"}
                  </div>
                  <span className="text-sm font-semibold text-text">{p.name}</span>
                </button>
              ))}
            </div>
          )}
        </Field>

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 w-full rounded-2xl bg-linear-to-br from-primary to-primary-dark py-3 font-display font-bold text-[#2a1a14] shadow-lg shadow-primary/30 disabled:opacity-60"
        >
          {submitting ? "Đang tạo..." : "Gửi lời mời"}
        </button>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-bold text-text">{label}</span>
      {children}
    </div>
  );
}
