export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { deleteGoal, getGoalDetail } from "@/lib/data/goals";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Không có quyền truy cập" }, { status: 401 });
  }

  const { id } = await params;
  const detail = await getGoalDetail(id, user.id);
  if (!detail) {
    return NextResponse.json({ error: "Không tìm thấy mục tiêu này" }, { status: 404 });
  }
  return NextResponse.json(detail);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Không có quyền truy cập" }, { status: 401 });
  }

  const { id } = await params;
  try {
    await deleteGoal(id, user.id);
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Có lỗi xảy ra";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
