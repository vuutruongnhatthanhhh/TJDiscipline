export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getExplorePlayer } from "@/lib/data/explore";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Không có quyền truy cập" }, { status: 401 });
  }

  const { id } = await params;
  const player = await getExplorePlayer(id);
  if (!player) {
    return NextResponse.json({ error: "Không tìm thấy người chơi" }, { status: 404 });
  }
  return NextResponse.json({ player });
}
