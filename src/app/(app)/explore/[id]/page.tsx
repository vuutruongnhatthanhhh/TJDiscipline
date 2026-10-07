"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import clsx from "clsx";
import CreatureStage from "@/components/creatures/CreatureStage";
import Skeleton from "@/components/Skeleton";
import { useAllSpecies } from "@/lib/store";
import { getPlantProgress, getSpeciesProgress, type Species, type SpeciesProgress } from "@/lib/species";

interface ExplorePlayer {
  id: string;
  name: string;
  streak: number;
  bestStreak: number;
  totalCheckIns: number;
  totalFocusMinutes: number;
}

export default function ExplorePlayerPage() {
  const params = useParams<{ id: string }>();
  const allSpecies = useAllSpecies();
  const [player, setPlayer] = useState<ExplorePlayer | null | undefined>(undefined);

  useEffect(() => {
    fetch(`/api/explore/players/${params.id}`)
      .then((res) => {
        if (!res.ok) throw new Error("not found");
        return res.json();
      })
      .then((data) => setPlayer(data.player))
      .catch(() => setPlayer(null));
  }, [params.id]);

  if (player === undefined) {
    return <PlayerDetailSkeleton />;
  }

  if (player === null) {
    return (
      <div className="flex flex-col items-center gap-3 px-6 pt-24 text-center">
        <p className="text-4xl">🙈</p>
        <p className="font-display text-lg font-bold text-text">Không tìm thấy người chơi này</p>
        <Link href="/explore" className="mt-1 text-sm font-bold text-primary-soft">
          ← Về trang khám phá
        </Link>
      </div>
    );
  }

  const pets = allSpecies.filter((s) => s.kind === "pet");
  const plants = allSpecies.filter((s) => s.kind === "plant");

  return (
    <div className="flex flex-col gap-6 px-5 pt-6 md:mx-auto md:max-w-5xl md:px-10 md:pt-10">
      <Link href="/explore" className="text-sm font-bold text-text-muted">
        ← Khám phá
      </Link>

      <header className="flex items-center gap-3 rounded-3xl bg-surface p-4 ring-1 ring-border">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-primary to-primary-dark font-display text-xl font-bold text-[#2a1a14]">
          {player.name.trim().charAt(0).toUpperCase() || "?"}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-lg font-bold text-text">{player.name}</p>
          <p className="text-xs text-text-muted">
            🔥 Streak {player.streak} • 🏆 Kỷ lục {player.bestStreak}
          </p>
          <p className="text-xs text-text-faint">
            🗓️ {player.totalCheckIns} lần điểm danh • ⏱️ {player.totalFocusMinutes} phút tập trung
          </p>
        </div>
      </header>

      {allSpecies.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-3xl bg-surface p-8 text-center ring-1 ring-border">
          <p className="text-3xl">🌱</p>
          <p className="font-display font-bold text-text">Chưa có loài nào trong bộ sưu tập</p>
        </div>
      ) : (
        <>
          <Section title="Thú cưng" icon="🐾">
            {pets.map((s) => (
              <ReadonlySpeciesCard key={s.id} species={s} progress={getSpeciesProgress(pets, player.totalCheckIns, s.id)} />
            ))}
          </Section>

          <Section title="Cây cảnh" icon="🌿">
            {plants.map((s) => (
              <ReadonlySpeciesCard
                key={s.id}
                species={s}
                progress={getPlantProgress(plants, player.totalFocusMinutes, s.id)}
              />
            ))}
          </Section>
        </>
      )}
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

function ReadonlySpeciesCard({ species, progress }: { species: Species; progress: SpeciesProgress }) {
  const { stage, unlocked, isActive } = progress;

  return (
    <div
      className={clsx(
        "flex items-center gap-3 rounded-3xl bg-surface p-3 ring-1",
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
        <p className="truncate text-xs text-text-muted">{unlocked ? species.tagline : "Chưa tới lượt"}</p>
      </div>
    </div>
  );
}

function PlayerDetailSkeleton() {
  return (
    <div className="flex flex-col gap-6 px-5 pt-6 md:mx-auto md:max-w-5xl md:px-10 md:pt-10">
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-20 rounded-3xl" />
      <div className="flex flex-col gap-3">
        <Skeleton className="h-4 w-20" />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          <Skeleton className="h-24 rounded-3xl" />
          <Skeleton className="h-24 rounded-3xl" />
        </div>
      </div>
    </div>
  );
}
