"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import clsx from "clsx";
import TaskListEditor, { type DraftTask } from "@/components/TaskListEditor";
import Skeleton from "@/components/Skeleton";
import { createClient } from "@/lib/supabase/client";
import {
  computeGoalStats,
  computeTaskDayStatus,
  formatMoney,
  type Goal,
  type GoalTask,
  type GoalTaskCheckin,
  type TaskDayStatus,
  type TaskStats,
} from "@/lib/goals";
import { formatWindowRange, weekdayShort, WEEKDAY_SHORT_VI } from "@/lib/date";

interface GoalDetailResponse {
  goal: Goal;
  creatorTasks: GoalTask[];
  partnerTasks: GoalTask[];
  creatorCheckins: GoalTaskCheckin[];
  partnerCheckins: GoalTaskCheckin[];
}

export default function GoalDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [myId, setMyId] = useState<string | null>(null);
  const [detail, setDetail] = useState<GoalDetailResponse | null | undefined>(undefined);
  const [now, setNow] = useState(() => new Date());
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 15_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setMyId(data.user?.id ?? null));
  }, []);

  useEffect(() => {
    fetch(`/api/goals/${params.id}`)
      .then((res) => (res.ok ? res.json() : Promise.resolve(null)))
      .then((data) => setDetail(data))
      .catch(() => setDetail(null));
  }, [params.id]);

  function reload() {
    fetch(`/api/goals/${params.id}`)
      .then((res) => (res.ok ? res.json() : Promise.resolve(null)))
      .then((data) => setDetail(data))
      .catch(() => setDetail(null));
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  if (detail === undefined || myId === null) {
    return <GoalDetailSkeleton />;
  }

  if (detail === null) {
    return (
      <div className="flex flex-col items-center gap-3 px-6 pt-24 text-center">
        <p className="text-4xl">🙈</p>
        <p className="font-display text-lg font-bold text-text">Không tìm thấy mục tiêu này</p>
        <Link href="/goals" className="mt-1 text-sm font-bold text-primary-soft">
          ← Về trang mục tiêu
        </Link>
      </div>
    );
  }

  const { goal, creatorTasks, partnerTasks, creatorCheckins, partnerCheckins } = detail;
  const isCreator = goal.creatorId === myId;
  const myName = isCreator ? goal.creatorName : goal.partnerName;
  const otherName = isCreator ? goal.partnerName : goal.creatorName;

  return (
    <div className="flex flex-col gap-6 px-5 pt-6 md:mx-auto md:max-w-3xl md:px-10 md:pt-10">
      {toast && (
        <div className="fixed left-1/2 top-4 z-50 w-[90%] max-w-xs -translate-x-1/2 rounded-2xl bg-surface-elevated px-4 py-3 text-center text-sm font-semibold text-text shadow-xl shadow-black/40 ring-1 ring-border md:left-[calc(50%+7rem)]">
          {toast}
        </div>
      )}

      <Link href="/goals" className="text-sm font-bold text-text-muted">
        ← Mục tiêu
      </Link>

      <header>
        <p className="text-sm font-medium text-text-muted">Mục tiêu chung</p>
        <h1 className="font-display text-2xl font-bold text-text">{goal.name}</h1>
        <p className="mt-1 text-sm text-text-muted">
          {myName} &amp; {otherName} • {goal.durationDays} ngày • Phạt {formatMoney(goal.penaltyAmount)}/việc lỡ
        </p>
      </header>

      {goal.status === "declined" && (
        <div className="rounded-3xl bg-surface p-6 text-center ring-1 ring-border">
          <p className="text-3xl">🚫</p>
          <p className="mt-2 font-display font-bold text-text">Mục tiêu này đã bị từ chối / huỷ</p>
        </div>
      )}

      {goal.status === "pending" && (
        <PendingPanel
          goal={goal}
          isCreator={isCreator}
          myTasks={isCreator ? creatorTasks : partnerTasks}
          otherTasks={isCreator ? partnerTasks : creatorTasks}
          otherName={otherName}
          onDone={reload}
          onToast={showToast}
        />
      )}

      {goal.status === "active" && goal.startDate && (
        <ActivePanel
          goal={goal}
          isCreator={isCreator}
          myName={myName}
          otherName={otherName}
          myTasks={isCreator ? creatorTasks : partnerTasks}
          creatorTasks={creatorTasks}
          partnerTasks={partnerTasks}
          creatorCheckins={creatorCheckins}
          partnerCheckins={partnerCheckins}
          now={now}
          onCheckedIn={reload}
          onToast={showToast}
        />
      )}

      {isCreator && <DeleteGoalZone goalId={goal.id} onDeleted={() => router.push("/goals")} />}
    </div>
  );
}

function DeleteGoalZone({ goalId, onDeleted }: { goalId: string; onDeleted: () => void }) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    const res = await fetch(`/api/goals/${goalId}`, { method: "DELETE" });
    setDeleting(false);
    if (!res.ok) {
      setConfirming(false);
      return;
    }
    onDeleted();
  }

  return (
    <div className="rounded-3xl bg-surface/60 p-5 ring-1 ring-border">
      <p className="text-sm font-bold text-sad-soft">Vùng nguy hiểm</p>
      <p className="mt-1 text-xs text-text-faint">Xoá hẳn mục tiêu này — xoá luôn checklist và lịch sử điểm danh của cả 2 người.</p>
      {confirming ? (
        <div className="mt-3 flex gap-2">
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex-1 rounded-xl bg-sad py-2 text-xs font-bold text-[#2a1016] disabled:opacity-60"
          >
            {deleting ? "Đang xoá..." : "Xác nhận xoá"}
          </button>
          <button
            onClick={() => setConfirming(false)}
            disabled={deleting}
            className="flex-1 rounded-xl bg-surface-elevated py-2 text-xs font-bold text-text-muted ring-1 ring-border"
          >
            Huỷ
          </button>
        </div>
      ) : (
        <button
          onClick={() => setConfirming(true)}
          className="mt-3 w-full rounded-xl bg-surface-elevated py-2 text-xs font-bold text-sad-soft ring-1 ring-border"
        >
          Xoá mục tiêu
        </button>
      )}
    </div>
  );
}

function PendingPanel({
  goal,
  isCreator,
  myTasks,
  otherTasks,
  otherName,
  onDone,
  onToast,
}: {
  goal: Goal;
  isCreator: boolean;
  myTasks: GoalTask[];
  otherTasks: GoalTask[];
  otherName: string;
  onDone: () => void;
  onToast: (msg: string) => void;
}) {
  const [tasks, setTasks] = useState<DraftTask[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function respond(action: "accept" | "decline" | "cancel") {
    setError(null);
    if (action === "accept" && tasks.length === 0) {
      setError("Vui lòng thêm ít nhất 1 việc cần làm trước khi chấp nhận");
      return;
    }
    setSubmitting(true);
    const res = await fetch(`/api/goals/${goal.id}/respond`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, tasks: action === "accept" ? tasks : undefined }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Có lỗi xảy ra");
      return;
    }
    onToast(action === "accept" ? "🎉 Đã tham gia mục tiêu!" : "Đã huỷ lời mời này");
    onDone();
  }

  if (isCreator) {
    return (
      <div className="flex flex-col gap-4 rounded-3xl bg-surface p-5 ring-1 ring-border">
        <p className="text-sm text-text-muted">
          Đang chờ <span className="font-bold text-text">{otherName}</span> phản hồi lời mời...
        </p>
        <TaskPreview title="Việc cần làm của bạn" tasks={myTasks} />
        {error && <p className="text-sm text-sad-soft">{error}</p>}
        <button
          onClick={() => respond("cancel")}
          disabled={submitting}
          className="rounded-xl bg-surface-elevated py-2.5 text-sm font-bold text-sad-soft ring-1 ring-border disabled:opacity-60"
        >
          Huỷ lời mời
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 rounded-3xl bg-surface p-5 ring-1 ring-border">
      <p className="text-sm text-text-muted">
        <span className="font-bold text-text">{otherName}</span> mời bạn cùng thực hiện mục tiêu này.
      </p>
      <TaskPreview title={`Việc cần làm của ${otherName}`} tasks={otherTasks} />

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-bold text-text">Việc cần làm của bạn *</span>
        <TaskListEditor tasks={tasks} onChange={setTasks} />
      </div>

      {error && <p className="text-sm text-sad-soft">{error}</p>}

      <div className="flex gap-2">
        <button
          onClick={() => respond("accept")}
          disabled={submitting}
          className="flex-1 rounded-xl bg-linear-to-br from-primary to-primary-dark py-2.5 text-sm font-display font-bold text-[#2a1a14] shadow-lg shadow-primary/30 disabled:opacity-60"
        >
          Chấp nhận
        </button>
        <button
          onClick={() => respond("decline")}
          disabled={submitting}
          className="rounded-xl bg-surface-elevated px-4 py-2.5 text-sm font-bold text-text-muted ring-1 ring-border disabled:opacity-60"
        >
          Từ chối
        </button>
      </div>
    </div>
  );
}

function TaskPreview({ title, tasks }: { title: string; tasks: GoalTask[] }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-bold text-text">{title}</span>
      <div className="flex flex-col gap-1.5">
        {tasks.map((t) => (
          <div key={t.id} className="rounded-xl bg-background px-3 py-2 ring-1 ring-border">
            <p className="text-sm text-text">{t.title}</p>
            <p className="text-xs text-text-faint">
              {t.checkTime} (+{t.windowMinutes} phút) •{" "}
              {t.checkDays
                .slice()
                .sort((a, b) => a - b)
                .map((d) => WEEKDAY_SHORT_VI[d])
                .join(", ")}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ActivePanel({
  goal,
  isCreator,
  myName,
  otherName,
  myTasks,
  creatorTasks,
  partnerTasks,
  creatorCheckins,
  partnerCheckins,
  now,
  onCheckedIn,
  onToast,
}: {
  goal: Goal;
  isCreator: boolean;
  myName: string;
  otherName: string;
  myTasks: GoalTask[];
  creatorTasks: GoalTask[];
  partnerTasks: GoalTask[];
  creatorCheckins: GoalTaskCheckin[];
  partnerCheckins: GoalTaskCheckin[];
  now: Date;
  onCheckedIn: () => void;
  onToast: (msg: string) => void;
}) {
  const stats = computeGoalStats(goal, creatorTasks, partnerTasks, creatorCheckins, partnerCheckins, now);
  if (!stats) return null;

  const myStats = isCreator ? stats.creator : stats.partner;
  const otherStats = isCreator ? stats.partner : stats.creator;
  const myCheckedDates = new Set((isCreator ? creatorCheckins : partnerCheckins).map((c) => `${c.taskId}:${c.checkDate}`));

  async function handleCheckin(taskId: string) {
    const res = await fetch(`/api/goals/${goal.id}/checkin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      onToast(data.error ?? "Có lỗi xảy ra");
      return;
    }
    onToast("✅ Đã điểm danh việc này!");
    onCheckedIn();
  }

  return (
    <div className="flex flex-col gap-6">
      {stats.isFinished ? (
        <SummaryBanner
          myName={myName}
          otherName={otherName}
          myMissed={myStats.missedCount}
          otherMissed={otherStats.missedCount}
          myPenalty={myStats.penalty}
          otherPenalty={otherStats.penalty}
        />
      ) : (
        <>
          <div className="flex items-center justify-between rounded-2xl bg-surface p-3 text-xs ring-1 ring-border">
            <span className="text-text-muted">
              Ngày {stats.daysElapsed}/{goal.durationDays}
            </span>
            <span className="text-text-faint">
              Phạt hiện tại — {myName}: <b className="text-sad-soft">{formatMoney(myStats.penalty)}</b> · {otherName}:{" "}
              <b className="text-sad-soft">{formatMoney(otherStats.penalty)}</b>
            </span>
          </div>

          {goal.startDate && todayDateOf(now) < goal.startDate ? (
            <div className="rounded-3xl bg-surface p-5 text-center ring-1 ring-border">
              <p className="text-sm text-text-muted">
                Mục tiêu bắt đầu tính từ ngày {goal.startDate.slice(8, 10)}/{goal.startDate.slice(5, 7)} — hôm nay chưa
                tính nhé.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3 rounded-3xl bg-surface p-5 ring-1 ring-border">
              <p className="text-sm font-bold text-text">Hôm nay</p>
              {myTasks.length === 0 && <p className="text-sm text-text-faint">Bạn chưa có việc nào.</p>}
              {myTasks.map((task) => {
                const today = todayDateOf(now);
                const checked = myCheckedDates.has(`${task.id}:${today}`);
                const status = computeTaskDayStatus(task, today, checked, now);
                return (
                  <TaskTodayRow
                    key={task.id}
                    task={task}
                    status={status}
                    penaltyAmount={goal.penaltyAmount}
                    onCheckin={() => handleCheckin(task.id)}
                  />
                );
              })}
            </div>
          )}
        </>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-3">
          <p className="font-display text-sm font-bold text-text-muted">Việc của {myName}</p>
          {myStats.tasks.map((ts) => (
            <TaskHistoryCard key={ts.task.id} stats={ts} />
          ))}
        </div>
        <div className="flex flex-col gap-3">
          <p className="font-display text-sm font-bold text-text-muted">Việc của {otherName}</p>
          {otherStats.tasks.map((ts) => (
            <TaskHistoryCard key={ts.task.id} stats={ts} />
          ))}
        </div>
      </div>
    </div>
  );
}

function todayDateOf(now: Date): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function TaskTodayRow({
  task,
  status,
  penaltyAmount,
  onCheckin,
}: {
  task: GoalTask;
  status: TaskDayStatus;
  penaltyAmount: number;
  onCheckin: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-background px-3 py-2.5 ring-1 ring-border">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-text">{task.title}</p>
        <p className="text-xs text-text-faint">{formatWindowRange(task.checkTime, task.windowMinutes)}</p>
      </div>
      {status === "not-required" && <span className="shrink-0 text-xs text-text-faint">Không cần hôm nay</span>}
      {status === "done" && <span className="shrink-0 text-xs font-bold text-mint">✅ Đã xong</span>}
      {status === "upcoming" && <span className="shrink-0 text-xs text-text-faint">⏳ Chưa tới giờ</span>}
      {status === "missed" && (
        <span className="shrink-0 text-xs font-bold text-sad-soft">😢 Lỡ rồi — phạt {formatMoney(penaltyAmount)}</span>
      )}
      {status === "open" && (
        <button
          onClick={onCheckin}
          className="shrink-0 rounded-full bg-linear-to-br from-primary to-primary-dark px-3 py-1.5 text-xs font-bold text-[#2a1a14] shadow-md shadow-primary/30"
        >
          Điểm danh
        </button>
      )}
    </div>
  );
}

const STATUS_ICON: Record<TaskDayStatus, string> = {
  "not-required": "·",
  done: "✅",
  missed: "❌",
  open: "🟡",
  upcoming: "⏳",
};

function TaskHistoryCard({ stats }: { stats: TaskStats }) {
  const { task, days, missedCount } = stats;
  return (
    <div className="rounded-2xl bg-surface p-3 ring-1 ring-border">
      <p className="truncate text-sm font-semibold text-text">{task.title}</p>
      <p className="mb-2 text-xs text-text-faint">
        {task.checkTime} (+{task.windowMinutes} phút) •{" "}
        {task.checkDays
          .slice()
          .sort((a, b) => a - b)
          .map((d) => WEEKDAY_SHORT_VI[d])
          .join(", ")}
        {missedCount > 0 && <span className="text-sad-soft"> • {missedCount} lần lỡ</span>}
      </p>
      <div className="flex flex-wrap gap-1">
        {days.map((d) => (
          <span
            key={d.date}
            title={`${weekdayShort(d.date)} ${d.date.slice(8, 10)}/${d.date.slice(5, 7)}`}
            className={clsx(
              "flex h-6 w-6 items-center justify-center rounded-full text-[11px] ring-1",
              d.status === "not-required" ? "text-text-faint ring-border" : "ring-border"
            )}
          >
            {STATUS_ICON[d.status]}
          </span>
        ))}
      </div>
    </div>
  );
}

function SummaryBanner({
  myName,
  otherName,
  myMissed,
  otherMissed,
  myPenalty,
  otherPenalty,
}: {
  myName: string;
  otherName: string;
  myMissed: number;
  otherMissed: number;
  myPenalty: number;
  otherPenalty: number;
}) {
  const verdict =
    myPenalty === otherPenalty
      ? "Hoà — cả hai cùng mức phạt!"
      : myPenalty > otherPenalty
      ? `${myName} bị phạt nhiều hơn`
      : `${otherName} bị phạt nhiều hơn`;

  return (
    <div className="flex flex-col gap-3 rounded-3xl bg-surface p-5 ring-1 ring-border">
      <p className="text-center font-display text-lg font-bold text-text">🏁 Mục tiêu đã kết thúc</p>
      <p className="text-center text-sm text-primary-soft">{verdict}</p>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-background p-3 text-center ring-1 ring-border">
          <p className="text-xs text-text-muted">{myName}</p>
          <p className="font-display text-lg font-bold text-sad-soft">{formatMoney(myPenalty)}</p>
          <p className="text-[11px] text-text-faint">{myMissed} việc lỡ</p>
        </div>
        <div className="rounded-2xl bg-background p-3 text-center ring-1 ring-border">
          <p className="text-xs text-text-muted">{otherName}</p>
          <p className="font-display text-lg font-bold text-sad-soft">{formatMoney(otherPenalty)}</p>
          <p className="text-[11px] text-text-faint">{otherMissed} việc lỡ</p>
        </div>
      </div>
    </div>
  );
}

function GoalDetailSkeleton() {
  return (
    <div className="flex flex-col gap-6 px-5 pt-6 md:mx-auto md:max-w-3xl md:px-10 md:pt-10">
      <Skeleton className="h-4 w-20" />
      <div className="flex flex-col gap-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      <Skeleton className="h-32 rounded-3xl" />
      <Skeleton className="h-64 rounded-3xl" />
    </div>
  );
}
