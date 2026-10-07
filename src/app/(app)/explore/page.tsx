"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Skeleton from "@/components/Skeleton";
import { useAllSpecies } from "@/lib/store";
import { getActiveIndex, getPlantActiveIndex, type Species } from "@/lib/species";

interface ExplorePlayer {
  id: string;
  name: string;
  streak: number;
  bestStreak: number;
  totalCheckIns: number;
  totalFocusMinutes: number;
}

export default function ExplorePage() {
  const allSpecies = useAllSpecies();
  const [players, setPlayers] = useState<ExplorePlayer[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/explore/players")
      .then((res) => {
        if (!res.ok) throw new Error("request failed");
        return res.json();
      })
      .then((data) => setPlayers(data.players ?? []))
      .catch(() => setError("Không tải được danh sách người chơi."));
  }, []);

  return (
    <div className="flex flex-col gap-6 px-5 pt-6 md:mx-auto md:max-w-5xl md:px-10 md:pt-10">
      <header>
        <p className="text-sm font-medium text-text-muted">Khám phá</p>
        <h1 className="font-display text-2xl font-bold text-text">Người chơi khác</h1>
        <p className="mt-1 text-sm text-text-muted">
          Xem tiến độ điểm danh và những gì trong bộ sưu tập mà người chơi khác đã mở khóa.
        </p>
      </header>

      {error && <p className="rounded-2xl bg-sad/15 px-4 py-3 text-sm text-sad-soft">{error}</p>}

      {!error && players === null ? (
        <ExploreSkeleton />
      ) : players && players.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-3xl bg-surface p-8 text-center ring-1 ring-border">
          <p className="text-3xl">🧭</p>
          <p className="font-display font-bold text-text">Chưa có người chơi nào khác</p>
          <p className="text-sm text-text-muted">Rủ bạn bè cùng tham gia dậy sớm nhé!</p>
        </div>
      ) : players ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {players.map((p) => (
            <PlayerCard key={p.id} player={p} allSpecies={allSpecies} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function PlayerCard({ player, allSpecies }: { player: ExplorePlayer; allSpecies: Species[] }) {
  const pets = allSpecies.filter((s) => s.kind === "pet");
  const plants = allSpecies.filter((s) => s.kind === "plant");
  const petActiveIndex = getActiveIndex(pets, player.totalCheckIns);
  const plantActiveIndex = getPlantActiveIndex(plants, player.totalFocusMinutes);

  return (
    <Link
      href={`/explore/${player.id}`}
      className="flex flex-col gap-3 rounded-3xl bg-surface p-4 ring-1 ring-border transition-colors hover:bg-surface-elevated"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-primary to-primary-dark font-display text-base font-bold text-[#2a1a14]">
          {player.name.trim().charAt(0).toUpperCase() || "?"}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-sm font-bold text-text">{player.name}</p>
          <p className="text-xs text-text-muted">
            🔥 Streak {player.streak} • 🏆 Kỷ lục {player.bestStreak}
          </p>
        </div>
      </div>

      <TrackStrip icon="🐾" label="Thú cưng" list={pets} activeIndex={petActiveIndex} />
      <TrackStrip icon="🌿" label="Cây cảnh" list={plants} activeIndex={plantActiveIndex} />

      <p className="text-xs text-text-faint">
        🗓️ {player.totalCheckIns} lần điểm danh • ⏱️ {player.totalFocusMinutes} phút tập trung
      </p>
    </Link>
  );
}

const STRIP_CAP = 5;

function TrackStrip({
  icon,
  label,
  list,
  activeIndex,
}: {
  icon: string;
  label: string;
  list: Species[];
  activeIndex: number;
}) {
  if (list.length === 0) return null;
  const unlockedCount = Math.min(activeIndex + 1, list.length);
  const progressPct = Math.min(100, (unlockedCount / list.length) * 100);

  // Most recently owned first (the active species, then back toward the
  // first), capped so a big collection doesn't blow out the card.
  const ownedNewestFirst = list.slice(0, unlockedCount).reverse();
  const shown = ownedNewestFirst.slice(0, STRIP_CAP);
  const hasMore = ownedNewestFirst.length > STRIP_CAP;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-bold text-text-muted">
          {icon} {label}
        </span>
        <span className="text-text-faint">
          {unlockedCount}/{list.length} loài
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-background">
        <div className="h-full rounded-full bg-linear-to-r from-mint to-primary" style={{ width: `${progressPct}%` }} />
      </div>
      <div className="flex gap-1.5">
        {shown.map((s) => (
          <div
            key={s.id}
            className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full ring-1 ring-primary/50"
          >
            {s.stageImages[0] && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={s.stageImages[0]} alt="" className="h-full w-full object-cover" />
            )}
          </div>
        ))}
        {hasMore && (
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-background text-xs font-bold text-text-faint ring-1 ring-border">
            …
          </div>
        )}
      </div>
    </div>
  );
}

function ExploreSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
      <Skeleton className="h-44 rounded-3xl" />
      <Skeleton className="h-44 rounded-3xl" />
      <Skeleton className="h-44 rounded-3xl" />
    </div>
  );
}
