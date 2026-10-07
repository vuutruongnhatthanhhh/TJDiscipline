export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { listExplorePlayers } from "@/lib/data/explore";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Không có quyền truy cập" }, { status: 401 });
  }

  try {
    const players = await listExplorePlayers(user.id);
    return NextResponse.json({ players });
  } catch (err) {
    console.error("Lấy danh sách người chơi thất bại:", err);
    return NextResponse.json({ error: "Không tải được danh sách" }, { status: 500 });
  }
}
