import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { mapSpeciesRow, type SpeciesRow, type Species } from "@/lib/species";
import { DeleteSpeciesButton } from "./delete-species-button";

export default async function AdminSpeciesPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("species").select("*").order("created_at", { ascending: true });
  const species = ((data as SpeciesRow[]) ?? []).map(mapSpeciesRow);

  const pets = species.filter((s) => s.kind === "pet");
  const plants = species.filter((s) => s.kind === "plant");

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap gap-3">
        <Link
          href="/admin/species/new?kind=pet"
          className="rounded-2xl bg-linear-to-br from-primary to-primary-dark px-5 py-3 font-display font-bold text-[#2a1a14] shadow-lg shadow-primary/30"
        >
          + Thêm thú cưng
        </Link>
        <Link
          href="/admin/species/new?kind=plant"
          className="rounded-2xl bg-surface-elevated px-5 py-3 font-display font-bold text-text ring-1 ring-border"
        >
          + Thêm cây cảnh
        </Link>
      </div>

      <p className="rounded-2xl bg-surface p-3 text-xs text-text-muted ring-1 ring-border">
        Thú cưng và cây cảnh nuôi theo hai thứ tự riêng (theo thứ tự thêm ở đây). Thú cưng lớn theo điểm danh; nuôi
        xong thú #N thì tự chuyển sang thú #N+1. Cây cảnh lớn theo thời gian tập trung Pomodoro (phút nuôi riêng cho
        từng cây, chỉnh ở nút &quot;Sửa&quot;); nuôi xong cây #N thì tự chuyển sang cây #N+1.
      </p>

      <Section title="🐾 Thú cưng" empty={pets.length === 0}>
        {pets.map((s, i) => (
          <SpeciesRowItem key={s.id} species={s} order={i + 1} />
        ))}
      </Section>

      <Section title="🌿 Cây cảnh" empty={plants.length === 0}>
        {plants.map((s, i) => (
          <SpeciesRowItem key={s.id} species={s} order={i + 1} />
        ))}
      </Section>
    </div>
  );
}

function Section({ title, empty, children }: { title: string; empty: boolean; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <p className="font-display text-sm font-bold text-text-muted">{title}</p>
      {empty ? (
        <p className="rounded-2xl bg-surface p-4 text-sm text-text-faint ring-1 ring-border">Chưa có loài nào.</p>
      ) : (
        <div className="flex flex-col gap-2">{children}</div>
      )}
    </section>
  );
}

function SpeciesRowItem({ species, order }: { species: Species; order: number }) {
  const thumb = species.stageImages[0];

  return (
    <div className="flex items-center gap-3 rounded-2xl bg-surface p-3 ring-1 ring-border">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-background text-2xl">
        {thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumb} alt="" className="h-full w-full object-contain" />
        ) : (
          "❓"
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-display font-bold text-text">{species.name}</p>
        <p className="truncate text-xs text-text-muted">
          Thứ tự nuôi: #{order}
          {species.kind === "plant" && ` • ${species.growMinutes} phút`}
        </p>
      </div>
      <div className="flex shrink-0 gap-1.5">
        <Link
          href={`/admin/species/${species.id}/edit`}
          className="rounded-full bg-surface-elevated px-3 py-1.5 text-xs font-bold text-text ring-1 ring-border"
        >
          Sửa
        </Link>
        <DeleteSpeciesButton id={species.id} name={species.name} />
      </div>
    </div>
  );
}
