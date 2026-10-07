"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { DEFAULT_GROW_MINUTES, STAGE_LABELS, type Species, type SpeciesKind } from "@/lib/species";

interface SpeciesFormProps {
  mode: "create" | "edit";
  initialKind: SpeciesKind;
  initial?: Species;
}

export function SpeciesForm({ mode, initialKind, initial }: SpeciesFormProps) {
  const router = useRouter();
  const [kind] = useState<SpeciesKind>(initial?.kind ?? initialKind);
  const [name, setName] = useState(initial?.name ?? "");
  const [tagline, setTagline] = useState(initial?.tagline ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [growMinutes, setGrowMinutes] = useState(initial?.growMinutes ?? DEFAULT_GROW_MINUTES);
  const [files, setFiles] = useState<(File | null)[]>([null, null, null, null, null]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stageLabels = STAGE_LABELS[kind];

  // Blob preview URLs for freshly picked files; falls back to the existing
  // stage image (edit mode) or nothing (create mode, not picked yet).
  const previews = useMemo(
    () => files.map((file, i) => (file ? URL.createObjectURL(file) : initial?.stageImages?.[i] ?? null)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [files]
  );

  useEffect(() => {
    return () => {
      previews.forEach((url, i) => {
        if (files[i] && url) URL.revokeObjectURL(url);
      });
    };
  }, [previews, files]);

  function handleFileChange(i: number, file: File | null) {
    setFiles((prev) => {
      const next = [...prev];
      next[i] = file;
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Vui lòng nhập tên");
      return;
    }
    if (mode === "create" && files.some((f) => !f)) {
      setError("Vui lòng chọn đủ 5 ảnh cho 5 giai đoạn");
      return;
    }

    setSubmitting(true);
    const form = new FormData();
    form.set("kind", kind);
    form.set("name", name.trim());
    form.set("tagline", tagline.trim());
    form.set("description", description.trim());
    if (kind === "plant") {
      form.set("grow_minutes", String(growMinutes));
    }
    files.forEach((file, i) => {
      if (file) form.set(`image${i}`, file);
    });

    const url = mode === "create" ? "/api/admin/species" : `/api/admin/species/${initial!.id}`;
    const res = await fetch(url, { method: mode === "create" ? "POST" : "PUT", body: form });
    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Có lỗi xảy ra, vui lòng thử lại");
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-3xl bg-surface p-5 ring-1 ring-border">
      {error && <div className="rounded-xl bg-sad/15 px-3 py-2 text-sm text-sad-soft">{error}</div>}

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-bold text-text">Loại</span>
        <div className="rounded-xl bg-background px-4 py-3 text-base text-text-muted ring-1 ring-border">
          {kind === "pet" ? "🐾 Thú cưng" : "🌿 Cây cảnh"}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="name" className="text-sm font-bold text-text">
          Tên *
        </label>
        <input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="VD: Sóc Bông"
          required
          className="rounded-xl bg-background px-4 py-3 text-base text-text ring-1 ring-border placeholder:text-text-faint"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="tagline" className="text-sm font-bold text-text">
          Mô tả ngắn
        </label>
        <input
          id="tagline"
          value={tagline}
          onChange={(e) => setTagline(e.target.value)}
          placeholder="VD: Nhanh nhẹn và tò mò"
          className="rounded-xl bg-background px-4 py-3 text-base text-text ring-1 ring-border placeholder:text-text-faint"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="description" className="text-sm font-bold text-text">
          Mô tả chi tiết
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="rounded-xl bg-background px-4 py-3 text-base text-text ring-1 ring-border placeholder:text-text-faint"
        />
      </div>

      {kind === "plant" && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="grow-minutes" className="text-sm font-bold text-text">
            Thời gian nuôi (phút) *
          </label>
          <input
            id="grow-minutes"
            type="number"
            min={1}
            max={10000}
            value={growMinutes}
            onChange={(e) => setGrowMinutes(Math.max(1, Number(e.target.value) || 1))}
            required
            className="rounded-xl bg-background px-4 py-3 text-base text-text ring-1 ring-border"
          />
          <p className="text-xs text-text-faint">
            Tổng số phút tập trung Pomodoro cần để cây này lớn hết 5 giai đoạn rồi mở khoá cây tiếp theo.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <span className="text-sm font-bold text-text">
          Hình ảnh 5 giai đoạn {mode === "edit" && <span className="font-normal text-text-faint">(để trống nếu giữ ảnh cũ)</span>}
        </span>
        <div className="grid grid-cols-5 gap-2">
          {stageLabels.map((label, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <div
                className={clsx(
                  "flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl bg-background ring-1 ring-border"
                )}
              >
                {previews[i] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={previews[i]!} alt="" className="h-full w-full object-contain" />
                ) : (
                  <span className="text-xs text-text-faint">#{i + 1}</span>
                )}
              </div>
              <label className="cursor-pointer rounded-full bg-surface-elevated px-2 py-1 text-[10px] font-bold text-text-muted ring-1 ring-border">
                Chọn
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => handleFileChange(i, e.target.files?.[0] ?? null)}
                />
              </label>
              <span className="text-center text-[10px] leading-tight text-text-faint">{label}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-text-faint">Ảnh sẽ được tự động chuyển sang định dạng WebP.</p>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="mt-2 w-full rounded-2xl bg-linear-to-br from-primary to-primary-dark py-3 font-display font-bold text-[#2a1a14] shadow-lg shadow-primary/30 disabled:opacity-60"
      >
        {submitting ? "Đang lưu..." : mode === "create" ? "Thêm loài mới" : "Lưu thay đổi"}
      </button>
    </form>
  );
}
