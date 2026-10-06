"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import clsx from "clsx";
import CreatureStage from "@/components/creatures/CreatureStage";
import Skeleton from "@/components/Skeleton";
import { useAllSpecies, useDisciplineStore, useStoreHydrated } from "@/lib/store";
import { getSpeciesProgress, STAGE_LABELS } from "@/lib/species";
import type { Mood } from "@/lib/types";

export default function SpeciesPreviewPage() {
  const params = useParams<{ id: string }>();
  const hydrated = useStoreHydrated();
  const allSpecies = useAllSpecies();
  const { totalCheckIns } = useDisciplineStore();

  const species = allSpecies.find((s) => s.id === params.id);
  const [previewStage, setPreviewStage] = useState(0);
  const [previewMood, setPreviewMood] = useState<Mood>("happy");

  if (!hydrated) {
    return <PreviewSkeleton />;
  }

  if (!species) {
    return (
      <div className="flex flex-col items-center gap-3 px-5 pt-16 text-center">
        <p className="text-4xl">🙈</p>
        <p className="text-text-muted">Không tìm thấy bạn đồng hành này.</p>
        <Link href="/collection" className="text-sm font-bold text-primary-soft">
          ← Về bộ sưu tập
        </Link>
      </div>
    );
  }

  const { unlocked, isActive } = getSpeciesProgress(allSpecies, totalCheckIns, species.id);
  const stageLabels = STAGE_LABELS[species.kind];
  const order = allSpecies.findIndex((s) => s.id === species.id) + 1;

  return (
    <div className="flex flex-col gap-6 px-5 pt-6 md:mx-auto md:max-w-2xl md:px-10 md:pt-10">
      <Link href="/collection" className="text-sm font-bold text-text-muted">
        ← Bộ sưu tập
      </Link>

      <header>
        <h1 className="font-display text-2xl font-bold text-text">{species.name}</h1>
        <p className="text-sm text-text-muted">{species.tagline}</p>
      </header>

      <div className="rounded-3xl bg-surface p-5 ring-1 ring-border">
        <CreatureStage species={species} stage={previewStage} mood={previewMood} size={190} className="my-2" />
        <p className="text-center font-display font-bold text-text">{stageLabels[previewStage]}</p>

        <div className="mt-4 flex justify-center gap-2">
          {stageLabels.map((label, i) => (
            <button
              key={label}
              onClick={() => setPreviewStage(i)}
              className={clsx(
                "flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold ring-1",
                previewStage === i ? "bg-primary text-[#2a1a14] ring-primary" : "bg-surface-elevated text-text-muted ring-border"
              )}
            >
              {i + 1}
            </button>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-center gap-2 rounded-2xl bg-background p-1">
          <MoodToggleButton active={previewMood === "happy"} onClick={() => setPreviewMood("happy")}>
            🙂 Khoẻ mạnh
          </MoodToggleButton>
          <MoodToggleButton active={previewMood === "sad"} onClick={() => setPreviewMood("sad")}>
            {species.kind === "pet" ? "🥺 Đói bụng" : "🥀 Héo úa"}
          </MoodToggleButton>
        </div>
      </div>

      <p className="rounded-2xl bg-surface p-4 text-sm leading-relaxed text-text-muted ring-1 ring-border">
        {species.description}
      </p>

      <div className="rounded-2xl bg-surface p-4 ring-1 ring-border">
        <p className="mb-1 text-sm font-bold text-text">Thứ tự nuôi</p>
        <p className="text-sm text-text-muted">
          Loài thứ {order} trong bộ sưu tập — nuôi lần lượt từng loài, xong loài này tự chuyển sang loài tiếp theo.
        </p>
      </div>

      {isActive && (
        <p className="text-center text-sm font-bold text-primary-soft">💛 Bạn đang nuôi {species.name}</p>
      )}
      {unlocked && !isActive && (
        <p className="text-center text-sm text-text-faint">Đã nuôi xong {species.name} rồi! 🎉</p>
      )}
      {!unlocked && (
        <p className="text-center text-sm text-text-faint">
          Nuôi xong các loài trước đó để tới lượt {species.name} nhé!
        </p>
      )}
    </div>
  );
}

function PreviewSkeleton() {
  return (
    <div className="flex flex-col gap-6 px-5 pt-6 md:mx-auto md:max-w-2xl md:px-10 md:pt-10">
      <Skeleton className="h-4 w-24" />
      <div className="flex flex-col gap-2">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-56" />
      </div>
      <div className="rounded-3xl bg-surface p-5 ring-1 ring-border">
        <Skeleton className="mx-auto my-2 h-47.5 w-47.5 rounded-full" />
        <Skeleton className="mx-auto h-4 w-24" />
        <Skeleton className="mx-auto mt-4 h-9 w-56 rounded-full" />
        <Skeleton className="mx-auto mt-4 h-9 w-full rounded-2xl" />
      </div>
      <Skeleton className="h-16 rounded-2xl" />
      <Skeleton className="h-16 rounded-2xl" />
    </div>
  );
}

function MoodToggleButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "flex-1 rounded-xl py-2 text-xs font-bold transition-colors",
        active ? "bg-surface-elevated text-text shadow-sm" : "text-text-faint"
      )}
    >
      {children}
    </button>
  );
}
