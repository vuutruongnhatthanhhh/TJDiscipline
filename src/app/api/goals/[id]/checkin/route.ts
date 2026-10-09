export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { recordTaskCheckin } from "@/lib/data/goals";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Không có quyền truy cập" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const taskId = body?.taskId;
  if (typeof taskId !== "string" || !taskId) {
    return NextResponse.json({ error: "Dữ liệu không hợp lệ" }, { status: 400 });
  }

  try {
    await recordTaskCheckin(id, user.id, taskId);
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Có lỗi xảy ra";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
