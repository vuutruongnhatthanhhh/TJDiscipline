"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import clsx from "clsx";
import CreatureStage from "@/components/creatures/CreatureStage";
import Skeleton from "@/components/Skeleton";
import { useAllSpecies, useDisciplineStore, useStoreHydrated } from "@/lib/store";
import { nextStageInfo, getActiveProgress, STAGE_LABELS, CYCLE_LENGTH } from "@/lib/species";
import { computeMood, formatFriendlyDate, isoDateOffset, startOfWeekMonday, todayISO, weekdayShort } from "@/lib/date";

export default function Dashboard() {
  const hydrated = useStoreHydrated();
  const allSpecies = useAllSpecies();
  const { totalCheckIns, streak, bestStreak, lastCheckInDate, history, wakeTime, checkIn } = useDisciplineStore();
  const [toast, setToast] = useState<string | null>(null);

  const progress = getActiveProgress(allSpecies, totalCheckIns);
  const mood = computeMood(lastCheckInDate);
  const checkedInToday = lastCheckInDate === todayISO();

  const weekStart = startOfWeekMonday();
  const week = Array.from({ length: 7 }, (_, i) => isoDateOffset(weekStart, i));

  if (!hydrated) {
    return <DashboardSkeleton />;
  }

  if (!progress) {
    return (
      <div className="flex flex-col items-center gap-3 px-6 pt-24 text-center">
        <p className="text-4xl">🌱</p>
        <p className="font-display text-lg font-bold text-text">Chưa có thú cưng hay cây nào</p>
        <p className="text-sm text-text-muted">Vào trang quản trị để thêm loài đầu tiên nhé!</p>
        <Link
          href="/admin"
          className="mt-2 rounded-full bg-linear-to-br from-primary to-primary-dark px-5 py-2.5 text-sm font-bold text-[#2a1a14] shadow-lg shadow-primary/30"
        >
          Vào trang quản trị
        </Link>
      </div>
    );
  }

  const { species, stage, localCheckIns, isLastSpecies } = progress;
  const { remaining } = nextStageInfo(localCheckIns);
  const isMaxStage = remaining === 0;
  const stageLabel = STAGE_LABELS[species.kind][stage];

  const handleCheckIn = async () => {
    const result = await checkIn();
    if (!result.success) {
      setToast("Bạn đã điểm danh hôm nay rồi, hẹn sáng mai nhé 🌙");
    } else if (result.newSpecies) {
      setToast(`🎊 ${species.name} đã trưởng thành hoàn toàn! Chào đón ${result.newSpeciesName}!`);
    } else if (result.stageUp) {
      setToast(`🎉 ${species.name} đã lớn thêm một bậc rồi!`);
    } else if (result.onTime) {
      setToast("Điểm danh thành công! Đúng giờ tuyệt vời ☀️");
    } else {
      setToast("Điểm danh thành công! Cố dậy sớm hơn vào ngày mai nhé 💪");
    }
    setTimeout(() => setToast(null), 3000);
  };

  const moodCopy =
    mood === "happy"
      ? `${species.name} đang rất vui vì được gặp bạn hôm nay!`
      : mood === "sad"
      ? `${species.name} đang ${species.kind === "pet" ? "đói và gầy gò" : "héo"} vì bạn đã quên điểm danh. Chăm em ngay nhé!`
      : `${species.name} đang chờ bạn điểm danh lúc ${wakeTime} sáng...`;

  return (
    <div className="flex flex-col gap-6 px-5 pt-6 md:mx-auto md:max-w-5xl md:px-10 md:pt-10">
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="fixed left-1/2 top-4 z-50 w-[90%] max-w-xs -translate-x-1/2 rounded-2xl bg-surface-elevated px-4 py-3 text-center text-sm font-semibold text-text shadow-xl shadow-black/40 ring-1 ring-border md:left-[calc(50%+7rem)]"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-text-muted capitalize">{formatFriendlyDate()}</p>
          <h1 className="font-display text-2xl font-bold text-text">TJDiscipline</h1>
        </div>
        <div className="flex items-center gap-1 rounded-full bg-surface px-3 py-1.5 text-sm font-bold text-gold ring-1 ring-border">
          🔥 {streak}
        </div>
      </header>

      <div className="md:grid md:grid-cols-[minmax(0,420px)_1fr] md:items-start md:gap-6">
        <div className="relative rounded-3xl bg-surface p-5 ring-1 ring-border md:p-7">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-display text-lg font-bold text-text">{species.name}</p>
              <p className="text-xs text-text-muted">{stageLabel}</p>
            </div>
            <span
              className={clsx(
                "rounded-full px-3 py-1 text-xs font-bold",
                mood === "happy" && "bg-mint/15 text-mint",
                mood === "neutral" && "bg-gold/15 text-gold",
                mood === "sad" && "bg-sad/15 text-sad"
              )}
            >
              {mood === "happy" ? "Vui vẻ" : mood === "neutral" ? "Đang chờ" : species.kind === "pet" ? "Đói bụng" : "Héo úa"}
            </span>
          </div>

          <CreatureStage species={species} stage={stage} mood={mood} size={190} className="my-2" />

          <p className="text-center text-sm text-text-muted">{moodCopy}</p>

          <button
            onClick={handleCheckIn}
            disabled={checkedInToday}
            className={clsx(
              "mt-4 w-full rounded-2xl py-3 text-center font-display text-base font-bold shadow-lg transition-all active:scale-[0.98]",
              checkedInToday
                ? "cursor-not-allowed bg-surface-elevated text-text-faint shadow-none ring-1 ring-border"
                : "bg-linear-to-br from-primary to-primary-dark text-[#2a1a14] shadow-primary/30 hover:brightness-105"
            )}
          >
            {checkedInToday ? "✅ Đã điểm danh hôm nay" : "☀️ Điểm danh dậy sớm"}
          </button>
        </div>

        <div className="mt-6 flex flex-col gap-6 md:mt-0">
          <div className="grid grid-cols-3 gap-3">
            <StatCard label="Streak" value={streak} icon="🔥" />
            <StatCard label="Kỷ lục" value={bestStreak} icon="🏆" />
            <StatCard label="Tổng điểm danh" value={totalCheckIns} icon="🗓️" />
          </div>

          <div className="rounded-3xl bg-surface p-4 ring-1 ring-border">
            <p className="mb-3 text-sm font-bold text-text">Tuần này</p>
            <div className="flex justify-between">
              {week.map((date) => {
                const done = history.includes(date);
                const isToday = date === todayISO();
                const dayLabel = weekdayShort(date);
                return (
                  <div key={date} className="flex flex-col items-center gap-1">
                    <div
                      className={clsx(
                        "flex h-8 w-8 items-center justify-center rounded-full text-sm ring-1",
                        done ? "bg-mint/20 text-mint ring-mint/40" : "bg-background text-text-faint ring-border",
                        isToday && "ring-2 ring-primary"
                      )}
                    >
                      {done ? "✓" : ""}
                    </div>
                    <span className="text-[10px] uppercase text-text-faint">{dayLabel}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-3xl bg-surface p-4 ring-1 ring-border">
            <div className="mb-2 flex items-center justify-between text-sm">
              <p className="font-bold text-text">Tiến trình trưởng thành</p>
              <p className="text-text-muted">
                {isMaxStage ? (isLastSpecies ? "Đã tối đa!" : "Sắp chuyển loài mới!") : `Còn ${remaining} lần`}
              </p>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-background">
              <motion.div
                className="h-full rounded-full bg-linear-to-r from-mint to-primary"
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(8, Math.min(100, (localCheckIns / CYCLE_LENGTH) * 100))}%` }}
                transition={{ duration: 0.6 }}
              />
            </div>
            {isMaxStage && !isLastSpecies && (
              <p className="mt-2 text-xs text-text-faint">
                Điểm danh thêm 1 lần nữa để chuyển sang bạn đồng hành tiếp theo.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-2xl bg-surface py-3 ring-1 ring-border">
      <span className="text-lg">{icon}</span>
      <span className="font-display text-lg font-bold text-text">{value}</span>
      <span className="text-[10px] text-text-faint">{label}</span>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6 px-5 pt-6 md:mx-auto md:max-w-5xl md:px-10 md:pt-10">
      <header className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-7 w-40" />
        </div>
        <Skeleton className="h-8 w-14 rounded-full" />
      </header>

      <div className="md:grid md:grid-cols-[minmax(0,420px)_1fr] md:items-start md:gap-6">
        <div className="rounded-3xl bg-surface p-5 ring-1 ring-border md:p-7">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-2">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
          <Skeleton className="mx-auto my-4 h-47.5 w-47.5 rounded-full" />
          <Skeleton className="mx-auto h-4 w-48" />
          <Skeleton className="mt-4 h-12 w-full rounded-2xl" />
        </div>

        <div className="mt-6 flex flex-col gap-6 md:mt-0">
          <div className="grid grid-cols-3 gap-3">
            <Skeleton className="h-20 rounded-2xl" />
            <Skeleton className="h-20 rounded-2xl" />
            <Skeleton className="h-20 rounded-2xl" />
          </div>
          <Skeleton className="h-28 rounded-3xl" />
          <Skeleton className="h-20 rounded-3xl" />
        </div>
      </div>
    </div>
  );
}
