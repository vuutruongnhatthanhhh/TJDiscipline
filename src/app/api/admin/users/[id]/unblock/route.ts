export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { setUserBlocked } from "@/lib/data/users";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || !user.isAdmin) {
    return NextResponse.json({ error: "Không có quyền truy cập" }, { status: 403 });
  }

  const { id } = await params;

  try {
    await setUserBlocked(id, false);
  } catch (err) {
    console.error("Mở khoá tài khoản thất bại:", err);
    return NextResponse.json({ error: "Mở khoá tài khoản thất bại" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
