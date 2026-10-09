export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { cancelPendingGoal, respondToGoal, type TaskInput } from "@/lib/data/goals";

function parseTasks(value: unknown): TaskInput[] | null {
  if (!Array.isArray(value) || value.length === 0) return null;
  const tasks: TaskInput[] = [];
  for (const raw of value) {
    if (typeof raw !== "object" || raw === null) return null;
    const title = String((raw as Record<string, unknown>).title ?? "").trim();
    const checkTime = String((raw as Record<string, unknown>).checkTime ?? "");
    const windowMinutes = Number((raw as Record<string, unknown>).windowMinutes);
    const checkDays = (raw as Record<string, unknown>).checkDays;
    if (!title) return null;
    if (!/^\d{2}:\d{2}$/.test(checkTime)) return null;
    if (!Number.isFinite(windowMinutes) || windowMinutes <= 0) return null;
    if (!Array.isArray(checkDays) || checkDays.length === 0 || checkDays.some((d) => typeof d !== "number" || d < 0 || d > 6)) {
      return null;
    }
    tasks.push({ title, checkTime, windowMinutes, checkDays: checkDays as number[] });
  }
  return tasks;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Không có quyền truy cập" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const action = body?.action;

  try {
    if (action === "cancel") {
      await cancelPendingGoal(id, user.id);
      return NextResponse.json({ success: true });
    }

    if (action === "accept" || action === "decline") {
      let tasks: TaskInput[] | undefined;
      if (action === "accept") {
        const parsed = parseTasks(body?.tasks);
        if (!parsed) {
          return NextResponse.json(
            { error: "Vui lòng thêm ít nhất 1 việc cần làm, mỗi việc cần đủ giờ/phút linh hoạt/ngày trong tuần" },
            { status: 400 }
          );
        }
        tasks = parsed;
      }
      await respondToGoal(id, user.id, { accept: action === "accept", tasks });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Hành động không hợp lệ" }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Có lỗi xảy ra";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
