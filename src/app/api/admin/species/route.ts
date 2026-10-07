export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { uploadSpeciesImage } from "@/lib/images";
import { slugify } from "@/lib/utils";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !user.isAdmin) {
    return NextResponse.json({ error: "Không có quyền truy cập" }, { status: 403 });
  }

  const form = await req.formData();
  const kind = String(form.get("kind") ?? "");
  const name = String(form.get("name") ?? "").trim();
  const tagline = String(form.get("tagline") ?? "").trim();
  const description = String(form.get("description") ?? "").trim();

  if ((kind !== "pet" && kind !== "plant") || !name) {
    return NextResponse.json({ error: "Thiếu thông tin bắt buộc" }, { status: 400 });
  }

  let growMinutes = 60;
  if (kind === "plant") {
    growMinutes = Number(form.get("grow_minutes"));
    if (!Number.isFinite(growMinutes) || growMinutes <= 0) {
      return NextResponse.json({ error: "Thời gian nuôi (phút) phải lớn hơn 0" }, { status: 400 });
    }
  }

  const files: File[] = [];
  for (let i = 0; i < 5; i++) {
    const f = form.get(`image${i}`);
    if (!(f instanceof File) || f.size === 0) {
      return NextResponse.json({ error: "Vui lòng chọn đủ 5 ảnh cho 5 giai đoạn" }, { status: 400 });
    }
    files.push(f);
  }

  let stageImages: string[];
  try {
    stageImages = await Promise.all(files.map((f) => uploadSpeciesImage(f)));
  } catch (err) {
    console.error("Upload ảnh thất bại:", err);
    return NextResponse.json({ error: "Tải ảnh lên thất bại" }, { status: 500 });
  }

  const admin = createAdminClient();
  const baseSlug = slugify(name) || "loai-moi";
  const { data: existingRows } = await admin.from("species").select("id");
  const existingIds = new Set((existingRows ?? []).map((r: { id: string }) => r.id));

  let id = baseSlug;
  let suffix = 1;
  while (existingIds.has(id)) {
    id = `${baseSlug}-${suffix++}`;
  }

  const { error } = await admin.from("species").insert({
    id,
    kind,
    name,
    tagline,
    description,
    grow_minutes: growMinutes,
    stage_images: stageImages,
    created_by: user.id,
  });

  if (error) {
    console.error("Tạo loài thất bại:", error);
    return NextResponse.json({ error: "Tạo loài thất bại" }, { status: 500 });
  }

  return NextResponse.json({ id });
}
