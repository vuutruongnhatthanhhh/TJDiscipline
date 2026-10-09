"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import Skeleton from "@/components/Skeleton";
import { createClient } from "@/lib/supabase/client";
import { isGoalDurationOver, type Goal } from "@/lib/goals";

export default function GoalsPage() {
  const [myId, setMyId] = useState<string | null>(null);
  const [goals, setGoals] = useState<Goal[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setMyId(data.user?.id ?? null));

    fetch("/api/goals")
      .then((res) => {
        if (!res.ok) throw new Error("request failed");
        return res.json();
      })
      .then((data) => setGoals(data.goals ?? []))
      .catch(() => setError("Không tải được danh sách mục tiêu."));
  }, []);

  const loading = goals === null || myId === null;

  const pendingForMe = !loading ? goals.filter((g) => g.status === "pending" && g.partnerId === myId) : [];
  const pendingWaiting = !loading ? goals.filter((g) => g.status === "pending" && g.creatorId === myId) : [];
  const active = !loading
    ? goals.filter((g) => g.status === "active" && g.startDate && !isGoalDurationOver(g.startDate, g.durationDays))
    : [];
  const finished = !loading
    ? goals.filter((g) => g.status === "active" && g.startDate && isGoalDurationOver(g.startDate, g.durationDays))
    : [];
  const declined = !loading ? goals.filter((g) => g.status === "declined") : [];

  return (
    <div className="flex flex-col gap-6 px-5 pt-6 md:mx-auto md:max-w-5xl md:px-10 md:pt-10">
      <header className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-text-muted">Mục tiêu chung</p>
          <h1 className="font-display text-2xl font-bold text-text">Thử thách cùng nhau</h1>
          <p className="mt-1 text-sm text-text-muted">Rủ 1 người chơi cùng theo đuổi mục tiêu — bỏ lỡ ngày nào thì tự bị phạt.</p>
        </div>
        <Link
          href="/goals/new"
          className="shrink-0 rounded-2xl bg-linear-to-br from-primary to-primary-dark px-4 py-2.5 text-sm font-display font-bold text-[#2a1a14] shadow-lg shadow-primary/30"
        >
          + Tạo mới
        </Link>
      </header>

      {error && <p className="rounded-2xl bg-sad/15 px-4 py-3 text-sm text-sad-soft">{error}</p>}

      {loading && !error ? (
        <GoalsSkeleton />
      ) : (
        <>
          {pendingForMe.length > 0 && (
            <Section title="💌 Lời mời cho bạn">
              {pendingForMe.map((g) => (
                <GoalCard key={g.id} goal={g} myId={myId!} highlight />
              ))}
            </Section>
          )}

          {active.length > 0 && (
            <Section title="🔥 Đang diễn ra">
              {active.map((g) => (
                <GoalCard key={g.id} goal={g} myId={myId!} />
              ))}
            </Section>
          )}

          {pendingWaiting.length > 0 && (
            <Section title="⏳ Đang chờ phản hồi">
              {pendingWaiting.map((g) => (
                <GoalCard key={g.id} goal={g} myId={myId!} />
              ))}
            </Section>
          )}

          {finished.length > 0 && (
            <Section title="🏁 Đã kết thúc">
              {finished.map((g) => (
                <GoalCard key={g.id} goal={g} myId={myId!} />
              ))}
            </Section>
          )}

          {declined.length > 0 && (
            <Section title="🚫 Đã từ chối">
              {declined.map((g) => (
                <GoalCard key={g.id} goal={g} myId={myId!} />
              ))}
            </Section>
          )}

          {!loading && goals.length === 0 && (
            <div className="flex flex-col items-center gap-2 rounded-3xl bg-surface p-8 text-center ring-1 ring-border">
              <p className="text-3xl">🎯</p>
              <p className="font-display font-bold text-text">Chưa có mục tiêu chung nào</p>
              <p className="text-sm text-text-muted">Tạo mục tiêu đầu tiên và rủ bạn bè cùng thực hiện nhé!</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <p className="font-display text-sm font-bold text-text-muted">{title}</p>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">{children}</div>
    </section>
  );
}

function GoalCard({ goal, myId, highlight }: { goal: Goal; myId: string; highlight?: boolean }) {
  const otherName = goal.creatorId === myId ? goal.partnerName : goal.creatorName;

  return (
    <Link
      href={`/goals/${goal.id}`}
      className={clsx(
        "flex flex-col gap-2 rounded-3xl bg-surface p-4 ring-1 transition-colors hover:bg-surface-elevated",
        highlight ? "ring-primary" : "ring-border"
      )}
    >
      <p className="truncate font-display text-base font-bold text-text">{goal.name}</p>
      <p className="text-xs text-text-muted">Cùng {otherName}</p>
      <p className="text-xs text-text-faint">{goal.durationDays} ngày</p>
      <p className="text-xs text-text-faint">Mức phạt: {goal.penaltyAmount.toLocaleString("vi-VN")}đ/việc lỡ</p>
    </Link>
  );
}

function GoalsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
      <Skeleton className="h-32 rounded-3xl" />
      <Skeleton className="h-32 rounded-3xl" />
      <Skeleton className="h-32 rounded-3xl" />
    </div>
  );
}
