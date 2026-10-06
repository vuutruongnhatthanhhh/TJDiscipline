"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DeleteSpeciesButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    const res = await fetch(`/api/admin/species/${id}`, { method: "DELETE" });
    setLoading(false);
    if (!res.ok) {
      alert("Xoá thất bại, vui lòng thử lại.");
      return;
    }
    router.refresh();
  }

  if (confirming) {
    return (
      <div className="flex gap-1.5">
        <button
          onClick={handleDelete}
          disabled={loading}
          className="rounded-full bg-sad px-3 py-1.5 text-xs font-bold text-[#2a1016] disabled:opacity-60"
        >
          {loading ? "Đang xoá..." : `Xoá ${name}?`}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="rounded-full bg-surface-elevated px-3 py-1.5 text-xs font-bold text-text-muted ring-1 ring-border"
        >
          Huỷ
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="rounded-full bg-surface-elevated px-3 py-1.5 text-xs font-bold text-sad-soft ring-1 ring-border"
    >
      Xoá
    </button>
  );
}
