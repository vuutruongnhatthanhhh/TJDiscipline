export type Mood = "happy" | "neutral" | "sad";

function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function todayISO(): string {
  return toISODate(new Date());
}

export function isoDateOffset(isoDate: string, offsetDays: number): string {
  const d = new Date(`${isoDate}T00:00:00`);
  d.setDate(d.getDate() + offsetDays);
  return toISODate(d);
}

export function diffInDays(fromISO: string, toISO: string): number {
  const a = new Date(`${fromISO}T00:00:00`);
  const b = new Date(`${toISO}T00:00:00`);
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

export function isWithinWindow(wakeTime: string, windowMinutes: number, now: Date = new Date()): boolean {
  const [h, m] = wakeTime.split(":").map(Number);
  const start = new Date(now);
  start.setHours(h, m, 0, 0);
  const end = new Date(start.getTime() + windowMinutes * 60_000);
  return now.getTime() >= start.getTime() && now.getTime() <= end.getTime();
}

const WEEKDAY_LONG_VI = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
const WEEKDAY_SHORT_VI = ["CN", "Th 2", "Th 3", "Th 4", "Th 5", "Th 6", "Th 7"];

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

// Weekday names are built from a fixed Vietnamese array (not Intl) because
// Node's and the browser's ICU data disagree on the "short" vi-VN weekday
// form, which breaks SSR/CSR hydration.
export function formatClock(now: Date = new Date()): string {
  return `${pad2(now.getHours())}:${pad2(now.getMinutes())}`;
}

export function formatFriendlyDate(now: Date = new Date()): string {
  return `${WEEKDAY_LONG_VI[now.getDay()]}, ${pad2(now.getDate())}/${pad2(now.getMonth() + 1)}`;
}

export function weekdayShort(isoDate: string): string {
  const d = new Date(`${isoDate}T00:00:00`);
  return WEEKDAY_SHORT_VI[d.getDay()];
}

export function startOfWeekMonday(isoDate: string = todayISO()): string {
  const d = new Date(`${isoDate}T00:00:00`);
  const day = d.getDay();
  const offsetToMonday = day === 0 ? -6 : 1 - day;
  return isoDateOffset(isoDate, offsetToMonday);
}

export function computeMood(lastCheckInDate: string | null, today: string = todayISO()): Mood {
  if (!lastCheckInDate) return "neutral";
  if (lastCheckInDate === today) return "happy";
  const gap = diffInDays(lastCheckInDate, today);
  return gap <= 1 ? "neutral" : "sad";
}
