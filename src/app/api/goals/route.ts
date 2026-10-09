export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createGoal, listMyGoals, type TaskInput } from "@/lib/data/goals";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Không có quyền truy cập" }, { status: 401 });
  }

  try {
    const goals = await listMyGoals(user.id);
    return NextResponse.json({ goals });
  } catch (err) {
    console.error("Lấy danh sách mục tiêu thất bại:", err);
    return NextResponse.json({ error: "Không tải được danh sách mục tiêu" }, { status: 500 });
  }
}

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

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Không có quyền truy cập" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Dữ liệu không hợp lệ" }, { status: 400 });
  }

  const name = String(body.name ?? "").trim();
  const durationDays = Number(body.durationDays);
  const penaltyAmount = Number(body.penaltyAmount);
  const partnerId = String(body.partnerId ?? "");
  const tasks = parseTasks(body.tasks);

  if (!name) return NextResponse.json({ error: "Vui lòng đặt tên mục tiêu" }, { status: 400 });
  if (!Number.isFinite(durationDays) || durationDays <= 0) {
    return NextResponse.json({ error: "Số ngày thực hiện phải lớn hơn 0" }, { status: 400 });
  }
  if (!Number.isFinite(penaltyAmount) || penaltyAmount < 0) {
    return NextResponse.json({ error: "Mức phạt không hợp lệ" }, { status: 400 });
  }
  if (!partnerId || partnerId === user.id) {
    return NextResponse.json({ error: "Vui lòng chọn người chơi để mời" }, { status: 400 });
  }
  if (!tasks) {
    return NextResponse.json(
      { error: "Vui lòng thêm ít nhất 1 việc cần làm, mỗi việc cần đủ giờ/phút linh hoạt/ngày trong tuần" },
      { status: 400 }
    );
  }

  try {
    const id = await createGoal(user.id, { name, durationDays, penaltyAmount, partnerId, tasks });
    return NextResponse.json({ id });
  } catch (err) {
    console.error("Tạo mục tiêu thất bại:", err);
    return NextResponse.json({ error: "Tạo mục tiêu thất bại" }, { status: 500 });
  }
}
