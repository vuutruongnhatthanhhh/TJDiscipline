"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import clsx from "clsx";
import CreatureStage from "@/components/creatures/CreatureStage";
import Skeleton from "@/components/Skeleton";
import { useAllSpecies, useDisciplineStore, useStoreHydrated } from "@/lib/store";
import {
  getPlantActiveProgress,
  plantNextStageInfo,
  STAGE_LABELS,
  STAGE_MAX,
  type PlantActiveProgress,
  type Species,
} from "@/lib/species";

const PRESET_MINUTES = [15, 25, 45, 60];
const MIN_MINUTES = 1;
const MAX_MINUTES = 180;

type TimerStatus = "idle" | "running" | "paused";

export default function PomodoroPage() {
  const hydrated = useStoreHydrated();
  const allSpecies = useAllSpecies();
  const { totalFocusMinutes, pomodoroMinutes } = useDisciplineStore();

  if (!hydrated) {
    return <PomodoroSkeleton />;
  }

  // Mounted only once hydration has landed, so its initial state below
  // already reflects the user's saved preference — no sync effect needed.
  return <PomodoroWorkspace initialMinutes={pomodoroMinutes} totalFocusMinutes={totalFocusMinutes} allSpecies={allSpecies} />;
}

function PomodoroWorkspace({
  initialMinutes,
  totalFocusMinutes,
  allSpecies,
}: {
  initialMinutes: number;
  totalFocusMinutes: number;
  allSpecies: Species[];
}) {
  const { setPomodoroMinutes, completeFocusSession } = useDisciplineStore();
  const [toast, setToast] = useState<string | null>(null);

  const [duration, setDuration] = useState(initialMinutes);
  const [status, setStatus] = useState<TimerStatus>("idle");
  const [remainingSeconds, setRemainingSeconds] = useState(initialMinutes * 60);
  const endTimeRef = useRef<number | null>(null);

  async function handleComplete() {
    const result = await completeFocusSession(duration);
    if (result.newSpecies) {
      setToast(`🎊 Đã nuôi xong! Chào đón ${result.newSpeciesName}!`);
    } else if (result.stageUp) {
      setToast("🌿 Cây đã lớn thêm một bậc rồi!");
    } else {
      setToast(`✅ Hoàn thành phiên tập trung ${duration} phút!`);
    }
    setTimeout(() => setToast(null), 3500);
    setRemainingSeconds(duration * 60);
  }

  useEffect(() => {
    if (status !== "running") return;
    const id = setInterval(() => {
      const endTime = endTimeRef.current;
      if (!endTime) return;
      const secondsLeft = Math.max(0, Math.round((endTime - Date.now()) / 1000));
      setRemainingSeconds(secondsLeft);
      if (secondsLeft <= 0) {
        clearInterval(id);
        setStatus("idle");
        void handleComplete();
      }
    }, 250);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  function handleStart() {
    endTimeRef.current = Date.now() + remainingSeconds * 1000;
    setStatus("running");
  }

  function handlePause() {
    setStatus("paused");
  }

  function handleResume() {
    endTimeRef.current = Date.now() + remainingSeconds * 1000;
    setStatus("running");
  }

  function handleReset() {
    setStatus("idle");
    setRemainingSeconds(duration * 60);
  }

  function handleSelectDuration(mins: number) {
    if (status !== "idle") return;
    const clamped = Math.max(MIN_MINUTES, Math.min(MAX_MINUTES, mins));
    setDuration(clamped);
    setRemainingSeconds(clamped * 60);
    void setPomodoroMinutes(clamped);
  }

  const plants = allSpecies.filter((s) => s.kind === "plant");
  const plantProgress = getPlantActiveProgress(plants, totalFocusMinutes);

  const mm = String(Math.floor(remainingSeconds / 60)).padStart(2, "0");
  const ss = String(remainingSeconds % 60).padStart(2, "0");
  const totalSeconds = Math.max(1, duration * 60);
  const progressPct = Math.max(0, Math.min(100, ((totalSeconds - remainingSeconds) / totalSeconds) * 100));
  const ringCircumference = 2 * Math.PI * 46;

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

      <header>
        <p className="text-sm font-medium text-text-muted">Pomodoro</p>
        <h1 className="font-display text-2xl font-bold text-text">Tập trung &amp; Nuôi cây</h1>
        <p className="mt-1 text-sm text-text-muted">
          Hoàn thành một phiên tập trung sẽ cộng dồn thời gian để cây cảnh lớn dần.
        </p>
      </header>

      <div className="md:grid md:grid-cols-[minmax(0,380px)_1fr] md:items-start md:gap-6">
        <div className="flex flex-col gap-4 rounded-3xl bg-surface p-5 ring-1 ring-border md:p-7">
          <div className="relative mx-auto flex h-56 w-56 items-center justify-center">
            <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="46" fill="none" stroke="var(--color-background)" strokeWidth="6" />
              <circle
                cx="50"
                cy="50"
                r="46"
                fill="none"
                stroke="url(#pomo-grad)"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={ringCircumference}
                strokeDashoffset={ringCircumference * (1 - progressPct / 100)}
                style={{ transition: "stroke-dashoffset 0.25s linear" }}
              />
              <defs>
                <linearGradient id="pomo-grad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="var(--color-primary)" />
                  <stop offset="100%" stopColor="var(--color-primary-dark)" />
                </linearGradient>
              </defs>
            </svg>
            <div className="flex flex-col items-center">
              <span className="font-display text-4xl font-bold tabular-nums text-text">
                {mm}:{ss}
              </span>
              <span className="text-xs text-text-faint">
                {status === "running" ? "Đang tập trung..." : status === "paused" ? "Tạm dừng" : "Sẵn sàng"}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            {PRESET_MINUTES.map((m) => (
              <button
                key={m}
                onClick={() => handleSelectDuration(m)}
                disabled={status !== "idle"}
                className={clsx(
                  "rounded-full px-3 py-1.5 text-xs font-bold ring-1 disabled:opacity-40",
                  duration === m ? "bg-primary text-[#2a1a14] ring-primary" : "bg-surface-elevated text-text-muted ring-border"
                )}
              >
                {m} phút
              </button>
            ))}
            <label className="flex items-center gap-1.5 rounded-full bg-surface-elevated px-3 py-1.5 ring-1 ring-border">
              <input
                type="number"
                min={MIN_MINUTES}
                max={MAX_MINUTES}
                value={duration}
                disabled={status !== "idle"}
                onChange={(e) => handleSelectDuration(Number(e.target.value) || MIN_MINUTES)}
                className="w-10 bg-transparent text-xs font-bold text-text outline-none disabled:opacity-40"
              />
              <span className="text-xs text-text-muted">phút tuỳ chỉnh</span>
            </label>
          </div>

          <div className="flex gap-2">
            {status === "idle" && (
              <button
                onClick={handleStart}
                className="flex-1 rounded-2xl bg-linear-to-br from-primary to-primary-dark py-3 font-display font-bold text-[#2a1a14] shadow-lg shadow-primary/30"
              >
                ▶️ Bắt đầu
              </button>
            )}
            {status === "running" && (
              <button
                onClick={handlePause}
                className="flex-1 rounded-2xl bg-surface-elevated py-3 font-display font-bold text-text ring-1 ring-border"
              >
                ⏸️ Tạm dừng
              </button>
            )}
            {status === "paused" && (
              <button
                onClick={handleResume}
                className="flex-1 rounded-2xl bg-linear-to-br from-primary to-primary-dark py-3 font-display font-bold text-[#2a1a14] shadow-lg shadow-primary/30"
              >
                ▶️ Tiếp tục
              </button>
            )}
            {status !== "idle" && (
              <button
                onClick={handleReset}
                className="rounded-2xl bg-surface-elevated px-4 py-3 text-sm font-bold text-text-muted ring-1 ring-border"
              >
                ↺ Đặt lại
              </button>
            )}
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-6 md:mt-0">
          {plantProgress ? (
            <ActivePlantCard progress={plantProgress} />
          ) : (
            <div className="flex flex-col items-center gap-2 rounded-3xl bg-surface p-8 text-center ring-1 ring-border">
              <p className="text-3xl">🌱</p>
              <p className="font-display font-bold text-text">Chưa có cây cảnh nào</p>
              <p className="text-sm text-text-muted">Vào trang quản trị để thêm cây đầu tiên nhé!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ActivePlantCard({ progress }: { progress: PlantActiveProgress }) {
  const { species, stage, localMinutes, growMinutes, isLastSpecies } = progress;
  const stageLabel = STAGE_LABELS[species.kind][stage];
  const isMaxStage = stage >= STAGE_MAX;
  const { remaining } = plantNextStageInfo(localMinutes, growMinutes);
  const progressPct = growMinutes === 0 ? 0 : Math.max(4, Math.min(100, (localMinutes / growMinutes) * 100));

  return (
    <div className="rounded-3xl bg-surface p-5 ring-1 ring-border md:p-7">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-display text-lg font-bold text-text">{species.name}</p>
          <p className="text-xs text-text-muted">{stageLabel}</p>
        </div>
        <span className="rounded-full bg-mint/15 px-3 py-1 text-xs font-bold text-mint">Đang nuôi</span>
      </div>

      <CreatureStage species={species} stage={stage} mood="happy" size={170} className="my-2" />

      <div className="mt-2 flex items-center justify-between text-xs">
        <span className="font-bold text-text-muted">Tiến trình</span>
        <span className="text-text-faint">
          {isMaxStage ? (isLastSpecies ? "Đã tối đa!" : "Sắp chuyển cây mới!") : `Còn ${remaining} phút tập trung`}
        </span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-background">
        <div className="h-full rounded-full bg-linear-to-r from-mint to-primary" style={{ width: `${progressPct}%` }} />
      </div>
      <p className="mt-2 text-center text-xs text-text-faint">
        {Math.round(localMinutes)}/{growMinutes} phút
      </p>
    </div>
  );
}

function PomodoroSkeleton() {
  return (
    <div className="flex flex-col gap-6 px-5 pt-6 md:mx-auto md:max-w-5xl md:px-10 md:pt-10">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-7 w-48" />
      </div>
      <div className="md:grid md:grid-cols-[minmax(0,380px)_1fr] md:items-start md:gap-6">
        <div className="rounded-3xl bg-surface p-5 ring-1 ring-border md:p-7">
          <Skeleton className="mx-auto h-56 w-56 rounded-full" />
          <Skeleton className="mx-auto mt-4 h-9 w-56 rounded-full" />
          <Skeleton className="mx-auto mt-4 h-12 w-full rounded-2xl" />
        </div>
        <div className="mt-6 flex flex-col gap-6 md:mt-0">
          <Skeleton className="h-64 rounded-3xl" />
          <Skeleton className="h-32 rounded-3xl" />
        </div>
      </div>
    </div>
  );
}
