import { dateToISO, diffInDays, getWindowBounds, isoDateOffset, isPastWindowOnDate } from "./date";

export interface GoalTask {
  id: string;
  userId: string;
  title: string;
  sortOrder: number;
  checkTime: string;
  windowMinutes: number;
  checkDays: number[];
}

export interface GoalTaskCheckin {
  taskId: string;
  checkDate: string;
  checkedAt: string;
}

export type GoalStatus = "pending" | "active" | "declined";

export interface Goal {
  id: string;
  name: string;
  durationDays: number;
  penaltyAmount: number;
  creatorId: string;
  creatorName: string;
  partnerId: string;
  partnerName: string;
  status: GoalStatus;
  startDate: string | null;
  createdAt: string;
}

export function isCheckDay(checkDays: number[], dateISO: string): boolean {
  const d = new Date(`${dateISO}T00:00:00`);
  return checkDays.includes(d.getDay());
}

export function enumerateGoalDates(startDate: string, durationDays: number): string[] {
  return Array.from({ length: durationDays }, (_, i) => isoDateOffset(startDate, i));
}

export function goalEndDate(startDate: string, durationDays: number): string {
  return isoDateOffset(startDate, durationDays - 1);
}

// Lightweight check used by list views that only have the goal's duration
// (no tasks/check-ins loaded) — same "is it over" rule as computeGoalStats.
export function isGoalDurationOver(startDate: string, durationDays: number, now: Date = new Date()): boolean {
  return dateToISO(now) > goalEndDate(startDate, durationDays);
}

export type TaskDayStatus = "not-required" | "done" | "missed" | "open" | "upcoming";

// Per-task status for a single calendar day: whether that task even applied
// that day, and if so, whether it's done, missed (window closed, not done
// — this is what triggers a penalty), open (window currently running), or
// upcoming (window hasn't started yet). Each task has its own schedule, so
// this is evaluated independently per task, not once per person per day.
export function computeTaskDayStatus(
  task: Pick<GoalTask, "checkTime" | "windowMinutes" | "checkDays">,
  dateISO: string,
  checked: boolean,
  now: Date = new Date()
): TaskDayStatus {
  if (!isCheckDay(task.checkDays, dateISO)) return "not-required";
  if (checked) return "done";
  if (isPastWindowOnDate(task.checkTime, task.windowMinutes, dateISO, now)) return "missed";

  const dayStart = new Date(`${dateISO}T00:00:00`);
  const { start } = getWindowBounds(task.checkTime, task.windowMinutes, dayStart);
  return now.getTime() < start.getTime() ? "upcoming" : "open";
}

export interface TaskDayEntry {
  date: string;
  status: TaskDayStatus;
}

export interface TaskStats {
  task: GoalTask;
  days: TaskDayEntry[];
  missedCount: number;
}

export interface PersonStats {
  tasks: TaskStats[];
  missedCount: number;
  penalty: number;
}

export interface GoalStats {
  creator: PersonStats;
  partner: PersonStats;
  isFinished: boolean;
  daysElapsed: number;
  endDate: string;
}

type GoalConfig = Pick<Goal, "startDate" | "durationDays" | "penaltyAmount">;

// Pure, isomorphic derivation of a goal's per-task day-by-day status and
// penalty totals — no stored "penalty" rows; everything is computed live
// from raw task check-ins plus each task's own schedule. Missing a task's
// window counts as +1 missed instance for that task (penalty is per missed
// task-instance, not per missed day — two different tasks can each miss
// independently on the same day).
export function computeGoalStats(
  goal: GoalConfig,
  creatorTasks: GoalTask[],
  partnerTasks: GoalTask[],
  creatorCheckins: GoalTaskCheckin[],
  partnerCheckins: GoalTaskCheckin[],
  now: Date = new Date()
): GoalStats | null {
  if (!goal.startDate) return null;

  const dates = enumerateGoalDates(goal.startDate, goal.durationDays);
  const endDate = dates[dates.length - 1];
  const isFinished = dateToISO(now) > endDate;

  function computePerson(tasks: GoalTask[], checkins: GoalTaskCheckin[]): PersonStats {
    const checkinKeys = new Set(checkins.map((c) => `${c.taskId}:${c.checkDate}`));
    let missedCount = 0;

    const taskStats: TaskStats[] = tasks.map((task) => {
      let taskMissed = 0;
      const days: TaskDayEntry[] = dates.map((date) => {
        const checked = checkinKeys.has(`${task.id}:${date}`);
        const status = computeTaskDayStatus(task, date, checked, now);
        if (status === "missed") taskMissed++;
        return { date, status };
      });
      missedCount += taskMissed;
      return { task, days, missedCount: taskMissed };
    });

    return { tasks: taskStats, missedCount, penalty: missedCount * goal.penaltyAmount };
  }

  const daysElapsed = Math.min(dates.length, Math.max(0, diffInDays(goal.startDate, dateToISO(now)) + 1));

  return {
    creator: computePerson(creatorTasks, creatorCheckins),
    partner: computePerson(partnerTasks, partnerCheckins),
    isFinished,
    daysElapsed,
    endDate,
  };
}

export function formatMoney(amount: number): string {
  return `${amount.toLocaleString("vi-VN")}đ`;
}
