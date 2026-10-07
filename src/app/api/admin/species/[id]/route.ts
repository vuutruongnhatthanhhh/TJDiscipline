export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { deleteSpeciesImage, uploadSpeciesImage } from "@/lib/images";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || !user.isAdmin) {
    return NextResponse.json({ error: "Không có quyền truy cập" }, { status: 403 });
  }

  const { id } = await params;
  const admin = createAdminClient();
  const { data: existing } = await admin.from("species").select("*").eq("id", id).maybeSingle();
  if (!existing) {
    return NextResponse.json({ error: "Không tìm thấy loài này" }, { status: 404 });
  }

  const form = await req.formData();
  const name = String(form.get("name") ?? "").trim();
  const tagline = String(form.get("tagline") ?? "").trim();
  const description = String(form.get("description") ?? "").trim();

  if (!name) {
    return NextResponse.json({ error: "Thiếu thông tin bắt buộc" }, { status: 400 });
  }

  let growMinutes = existing.grow_minutes as number;
  if (existing.kind === "plant") {
    growMinutes = Number(form.get("grow_minutes"));
    if (!Number.isFinite(growMinutes) || growMinutes <= 0) {
      return NextResponse.json({ error: "Thời gian nuôi (phút) phải lớn hơn 0" }, { status: 400 });
    }
  }

  const stageImages: string[] = [...(existing.stage_images as string[])];
  const oldUrlsToDelete: string[] = [];

  for (let i = 0; i < 5; i++) {
    const f = form.get(`image${i}`);
    if (f instanceof File && f.size > 0) {
      try {
        const url = await uploadSpeciesImage(f);
        oldUrlsToDelete.push(stageImages[i]);
        stageImages[i] = url;
      } catch (err) {
        console.error("Upload ảnh thất bại:", err);
        return NextResponse.json({ error: "Tải ảnh lên thất bại" }, { status: 500 });
      }
    }
  }

  const { error } = await admin
    .from("species")
    .update({
      name,
      tagline,
      description,
      grow_minutes: growMinutes,
      stage_images: stageImages,
    })
    .eq("id", id);

  if (error) {
    console.error("Cập nhật loài thất bại:", error);
    return NextResponse.json({ error: "Cập nhật thất bại" }, { status: 500 });
  }

  oldUrlsToDelete.forEach((url) => {
    deleteSpeciesImage(url).catch((err) => console.error("Xoá ảnh cũ thất bại:", err));
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || !user.isAdmin) {
    return NextResponse.json({ error: "Không có quyền truy cập" }, { status: 403 });
  }

  const { id } = await params;
  const admin = createAdminClient();
  const { data: existing } = await admin.from("species").select("*").eq("id", id).maybeSingle();
  if (!existing) {
    return NextResponse.json({ error: "Không tìm thấy loài này" }, { status: 404 });
  }

  const { error } = await admin.from("species").delete().eq("id", id);
  if (error) {
    console.error("Xoá loài thất bại:", error);
    return NextResponse.json({ error: "Xoá thất bại" }, { status: 500 });
  }

  const images = (existing.stage_images as string[]) ?? [];
  images.forEach((url) => {
    deleteSpeciesImage(url).catch((err) => console.error("Xoá ảnh thất bại:", err));
  });

  return NextResponse.json({ success: true });
}
