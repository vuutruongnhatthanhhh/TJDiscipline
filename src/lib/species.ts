export type SpeciesKind = "pet" | "plant";

// All species are added from /admin with 5 uploaded images (one per growth
// stage, converted to webp in Supabase Storage) — there's no hardcoded
// starter catalog, the list starts empty until an admin adds the first one.
export interface Species {
  id: string;
  kind: SpeciesKind;
  name: string;
  tagline: string;
  description: string;
  stageImages: string[];
}

// Shape of a row in the `species` Supabase table.
export interface SpeciesRow {
  id: string;
  kind: SpeciesKind;
  name: string;
  tagline: string;
  description: string;
  stage_images: string[];
}

export function mapSpeciesRow(row: SpeciesRow): Species {
  return {
    id: row.id,
    kind: row.kind,
    name: row.name,
    tagline: row.tagline,
    description: row.description,
    stageImages: row.stage_images,
  };
}

export const STAGE_THRESHOLDS = [0, 3, 7, 12, 18] as const;

export const STAGE_LABELS: Record<SpeciesKind, string[]> = {
  pet: ["Mới nở", "Nhí nhảnh", "Thiếu niên", "Trưởng thành", "Huyền thoại"],
  plant: ["Hạt mầm", "Nảy mầm", "Cây non", "Trưởng thành", "Nở rộ"],
};

export const STAGE_MAX = STAGE_THRESHOLDS.length - 1;

// Total check-ins it takes to fully raise one species from stage 0 to
// STAGE_MAX — also the length of its "turn" in the collection sequence.
export const CYCLE_LENGTH = STAGE_THRESHOLDS[STAGE_MAX];

export function stageFromTotal(total: number): number {
  let stage = 0;
  for (let i = 0; i < STAGE_THRESHOLDS.length; i++) {
    if (total >= STAGE_THRESHOLDS[i]) stage = i;
  }
  return stage;
}

export function nextStageInfo(total: number): { nextThreshold: number | null; remaining: number } {
  const stage = stageFromTotal(total);
  const next = STAGE_THRESHOLDS[stage + 1];
  if (next === undefined) return { nextThreshold: null, remaining: 0 };
  return { nextThreshold: next, remaining: next - total };
}

export function getSpeciesById(id: string, list: Species[]): Species | undefined {
  return list.find((s) => s.id === id);
}

// No manual "choose a companion" and no unlock thresholds — species are
// raised strictly in collection order. Once one is fully grown (CYCLE_LENGTH
// check-ins), the next one in the list automatically takes over.
export function getActiveIndex(list: Species[], totalCheckIns: number): number {
  if (list.length === 0) return -1;
  const rawIndex = Math.floor(totalCheckIns / CYCLE_LENGTH);
  return Math.min(rawIndex, list.length - 1);
}

export interface ActiveProgress {
  species: Species;
  stage: number;
  localCheckIns: number;
  isLastSpecies: boolean;
}

export function getActiveProgress(list: Species[], totalCheckIns: number): ActiveProgress | undefined {
  const idx = getActiveIndex(list, totalCheckIns);
  if (idx === -1) return undefined;
  const localCheckIns = totalCheckIns - idx * CYCLE_LENGTH;
  return {
    species: list[idx],
    stage: stageFromTotal(localCheckIns),
    localCheckIns,
    isLastSpecies: idx === list.length - 1,
  };
}

export function getActiveSpecies(list: Species[], totalCheckIns: number): Species | undefined {
  return getActiveProgress(list, totalCheckIns)?.species;
}

export interface SpeciesProgress {
  stage: number;
  unlocked: boolean;
  isActive: boolean;
}

// Per-card progress for the collection grid / preview page: species before
// the active one are fully grown (and stay that way), the active one shows
// its current stage, everything after is locked at stage 0.
export function getSpeciesProgress(list: Species[], totalCheckIns: number, speciesId: string): SpeciesProgress {
  const idx = list.findIndex((s) => s.id === speciesId);
  if (idx === -1) return { stage: 0, unlocked: false, isActive: false };

  const activeIdx = getActiveIndex(list, totalCheckIns);
  if (idx < activeIdx) return { stage: STAGE_MAX, unlocked: true, isActive: false };
  if (idx === activeIdx) {
    const localCheckIns = totalCheckIns - idx * CYCLE_LENGTH;
    return { stage: stageFromTotal(localCheckIns), unlocked: true, isActive: true };
  }
  return { stage: 0, unlocked: false, isActive: false };
}
