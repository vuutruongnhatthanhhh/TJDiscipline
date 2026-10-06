export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { deleteAppUser } from "@/lib/data/users";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || !user.isAdmin) {
    return NextResponse.json({ error: "Không có quyền truy cập" }, { status: 403 });
  }

  const { id } = await params;
  if (id === user.id) {
    return NextResponse.json({ error: "Không thể xoá chính tài khoản admin" }, { status: 400 });
  }

  try {
    await deleteAppUser(id);
  } catch (err) {
    console.error("Xoá người dùng thất bại:", err);
    return NextResponse.json({ error: "Xoá thất bại" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
