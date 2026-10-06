import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { mapSpeciesRow, type SpeciesRow } from "@/lib/species";
import { SpeciesForm } from "../../../species-form";

export default async function EditSpeciesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("species").select("*").eq("id", id).maybeSingle();

  if (!data) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-3xl bg-surface p-10 text-center ring-1 ring-border">
        <p className="text-3xl">🙈</p>
        <p className="text-text-muted">Không tìm thấy loài này (hoặc đây là loài có sẵn, không chỉnh sửa được).</p>
        <Link href="/admin" className="text-sm font-bold text-primary-soft">
          ← Về danh sách
        </Link>
      </div>
    );
  }

  const species = mapSpeciesRow(data as SpeciesRow);

  return (
    <div className="flex flex-col gap-4">
      <Link href="/admin" className="text-sm font-bold text-text-muted">
        ← Danh sách
      </Link>
      <SpeciesForm mode="edit" initialKind={species.kind} initial={species} />
    </div>
  );
}
