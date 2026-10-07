"use client";

import Link from "next/link";
import clsx from "clsx";
import CreatureStage from "@/components/creatures/CreatureStage";
import Skeleton from "@/components/Skeleton";
import { useAllSpecies, useDisciplineStore, useStoreHydrated } from "@/lib/store";
import { getSpeciesProgress, getPlantProgress, type Species, type SpeciesProgress } from "@/lib/species";

export default function CollectionPage() {
  const hydrated = useStoreHydrated();
  const allSpecies = useAllSpecies();
  const { totalCheckIns, totalFocusMinutes } = useDisciplineStore();

  const pets = allSpecies.filter((s) => s.kind === "pet");
  const plants = allSpecies.filter((s) => s.kind === "plant");

  return (
    <div className="flex flex-col gap-6 px-5 pt-6 md:mx-auto md:max-w-5xl md:px-10 md:pt-10">
      <header>
        <p className="text-sm font-medium text-text-muted">Bộ sưu tập</p>
        <h1 className="font-display text-2xl font-bold text-text">Thú cưng &amp; Cây cảnh</h1>
        <p className="mt-1 text-sm text-text-muted">
          Thú cưng lớn theo điểm danh, cây cảnh lớn theo thời gian tập trung Pomodoro — mỗi loài nuôi lần lượt theo
          thứ tự của riêng mình. Chạm &quot;Xem trước&quot; để ngắm các mức trưởng thành dù chưa tới lượt.
        </p>
      </header>

      {!hydrated ? (
        <CollectionSkeleton />
      ) : (
        <>
          {allSpecies.length === 0 && (
            <div className="flex flex-col items-center gap-2 rounded-3xl bg-surface p-8 text-center ring-1 ring-border">
              <p className="text-3xl">🌱</p>
              <p className="font-display font-bold text-text">Chưa có loài nào trong bộ sưu tập</p>
              <p className="text-sm text-text-muted">Vào trang quản trị để thêm thú cưng hoặc cây cảnh đầu tiên.</p>
            </div>
          )}

          <Section title="Thú cưng" icon="🐾">
            {pets.map((s) => (
              <SpeciesCard key={s.id} species={s} progress={getSpeciesProgress(pets, totalCheckIns, s.id)} />
            ))}
          </Section>

          <Section title="Cây cảnh" icon="🌿">
            {plants.map((s) => (
              <SpeciesCard key={s.id} species={s} progress={getPlantProgress(plants, totalFocusMinutes, s.id)} />
            ))}
          </Section>
        </>
      )}
    </div>
  );
}

function CollectionSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-4 w-20" />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          <Skeleton className="h-24 rounded-3xl" />
          <Skeleton className="h-24 rounded-3xl" />
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <Skeleton className="h-4 w-20" />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          <Skeleton className="h-24 rounded-3xl" />
        </div>
      </div>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <p className="flex items-center gap-2 font-display text-sm font-bold text-text-muted">
        <span>{icon}</span> {title}
      </p>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">{children}</div>
    </section>
  );
}

function SpeciesCard({ species, progress }: { species: Species; progress: SpeciesProgress }) {
  const { stage, unlocked, isActive } = progress;

  return (
    <Link
      href={`/collection/${species.id}`}
      className={clsx(
        "flex items-center gap-3 rounded-3xl bg-surface p-3 ring-1 transition-colors hover:bg-surface-elevated",
        isActive ? "ring-primary" : "ring-border"
      )}
    >
      <div className={clsx("relative shrink-0", !unlocked && "opacity-50 grayscale")}>
        <CreatureStage species={species} stage={stage} mood="happy" size={88} />
        {!unlocked && (
          <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-background text-xs ring-1 ring-border">
            🔒
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate font-display text-base font-bold text-text">{species.name}</p>
          {isActive && (
            <span className="shrink-0 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold text-primary-soft">
              Đang nuôi
            </span>
          )}
        </div>
        <p className="truncate text-xs text-text-muted">
          {unlocked ? species.tagline : "Chưa tới lượt"}
        </p>
        <span className="mt-2 inline-block rounded-full bg-surface-elevated px-3 py-1.5 text-xs font-bold text-text ring-1 ring-border">
          Xem trước
        </span>
      </div>
    </Link>
  );
}
