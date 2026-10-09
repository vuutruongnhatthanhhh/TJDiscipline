"use client";

import { useState } from "react";
import clsx from "clsx";
import { WEEKDAY_SHORT_VI } from "@/lib/date";

export interface DraftTask {
  title: string;
  checkTime: string;
  windowMinutes: number;
  checkDays: number[];
}

const WINDOW_OPTIONS = [15, 30, 45, 60, 90];
const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

interface TaskListEditorProps {
  tasks: DraftTask[];
  onChange: (tasks: DraftTask[]) => void;
  disabled?: boolean;
}

export default function TaskListEditor({ tasks, onChange, disabled }: TaskListEditorProps) {
  const [title, setTitle] = useState("");
  const [checkTime, setCheckTime] = useState("21:00");
  const [windowMinutes, setWindowMinutes] = useState(45);
  const [checkDays, setCheckDays] = useState<number[]>(ALL_DAYS);

  function toggleDay(day: number) {
    setCheckDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort((a, b) => a - b)));
  }

  function addTask() {
    const trimmed = title.trim();
    if (!trimmed || checkDays.length === 0) return;
    onChange([...tasks, { title: trimmed, checkTime, windowMinutes, checkDays }]);
    setTitle("");
  }

  function removeTask(index: number) {
    onChange(tasks.filter((_, i) => i !== index));
  }

  return (
    <div className="flex flex-col gap-3">
      {tasks.map((task, i) => (
        <div
          key={i}
          className="flex items-center justify-between gap-2 rounded-xl bg-background px-3 py-2.5 ring-1 ring-border"
        >
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-text">{task.title}</p>
            <p className="truncate text-xs text-text-faint">
              {task.checkTime} (+{task.windowMinutes} phút) •{" "}
              {task.checkDays
                .slice()
                .sort((a, b) => a - b)
                .map((d) => WEEKDAY_SHORT_VI[d])
                .join(", ")}
            </p>
          </div>
          {!disabled && (
            <button type="button" onClick={() => removeTask(i)} className="shrink-0 text-xs font-bold text-sad-soft">
              Xoá
            </button>
          )}
        </div>
      ))}

      {!disabled && (
        <div className="flex flex-col gap-2 rounded-xl bg-background p-3 ring-1 ring-border">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="VD: Đọc sách 20 phút"
            className="rounded-lg bg-surface px-3 py-2 text-sm text-text ring-1 ring-border placeholder:text-text-faint"
          />

          <div className="flex flex-wrap items-center gap-2">
            <input
              type="time"
              value={checkTime}
              onChange={(e) => setCheckTime(e.target.value)}
              className="rounded-lg bg-surface px-3 py-2 text-sm font-bold text-text ring-1 ring-border"
            />
            {WINDOW_OPTIONS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setWindowMinutes(m)}
                className={clsx(
                  "rounded-full px-2.5 py-1 text-xs font-bold ring-1",
                  windowMinutes === m ? "bg-primary text-[#2a1a14] ring-primary" : "bg-surface text-text-muted ring-border"
                )}
              >
                +{m}p
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {WEEKDAY_SHORT_VI.map((label, i) => (
              <button
                key={i}
                type="button"
                onClick={() => toggleDay(i)}
                className={clsx(
                  "rounded-full px-2.5 py-1 text-xs font-bold ring-1",
                  checkDays.includes(i) ? "bg-primary text-[#2a1a14] ring-primary" : "bg-surface text-text-muted ring-border"
                )}
              >
                {label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={addTask}
            className="rounded-lg bg-surface-elevated py-2 text-sm font-bold text-text ring-1 ring-border"
          >
            + Thêm việc
          </button>
        </div>
      )}

      {tasks.length === 0 && <p className="text-xs text-text-faint">Chưa có việc nào, thêm ít nhất 1 việc nhé.</p>}
    </div>
  );
}
