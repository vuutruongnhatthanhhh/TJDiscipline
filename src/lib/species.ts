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
  // Minutes of focused Pomodoro time needed to fully grow this plant —
  // only meaningful for kind: "plant", set per-species by an admin.
  growMinutes: number;
}

// Shape of a row in the `species` Supabase table.
export interface SpeciesRow {
  id: string;
  kind: SpeciesKind;
  name: string;
  tagline: string;
  description: string;
  stage_images: string[];
  grow_minutes: number;
}

export function mapSpeciesRow(row: SpeciesRow): Species {
  return {
    id: row.id,
    kind: row.kind,
    name: row.name,
    tagline: row.tagline,
    description: row.description,
    stageImages: row.stage_images,
    growMinutes: row.grow_minutes ?? DEFAULT_GROW_MINUTES,
  };
}

// Fallback when a plant row predates the grow_minutes column, or an admin
// leaves it unset — keeps the progression math well-defined either way.
export const DEFAULT_GROW_MINUTES = 60;

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

// Pet progression — driven by daily check-ins, every pet takes the same
// fixed CYCLE_LENGTH. No manual "choose a companion" and no unlock
// thresholds: pets are raised strictly in catalog order (filter `list` to
// kind: "pet" before calling). Once one is fully grown, the next one in the
// list automatically takes over. Plants use a separate, time-based track —
// see getPlantActiveIndex / getPlantProgress below.
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

// Plant progression — driven by accumulated Pomodoro focus minutes instead
// of check-ins. Unlike pets, each plant has its own admin-set grow time
// (growMinutes), so the "cycle length" varies per species and active index
// has to walk a cumulative sum rather than divide by a constant.

function plantGrowMinutes(species: Species): number {
  return species.growMinutes > 0 ? species.growMinutes : DEFAULT_GROW_MINUTES;
}

function cumulativeMinutesBefore(list: Species[], idx: number): number {
  let acc = 0;
  for (let i = 0; i < idx; i++) acc += plantGrowMinutes(list[i]);
  return acc;
}

function stageFromLocalMinutes(localMinutes: number, growMinutes: number): number {
  let stage = 0;
  for (let i = 0; i < STAGE_THRESHOLDS.length; i++) {
    const threshold = (STAGE_THRESHOLDS[i] / CYCLE_LENGTH) * growMinutes;
    if (localMinutes >= threshold) stage = i;
  }
  return stage;
}

// filter `list` to kind: "plant" before calling, same as the pet functions.
export function getPlantActiveIndex(list: Species[], totalFocusMinutes: number): number {
  if (list.length === 0) return -1;
  let acc = 0;
  for (let i = 0; i < list.length; i++) {
    acc += plantGrowMinutes(list[i]);
    if (totalFocusMinutes < acc || i === list.length - 1) return i;
  }
  return list.length - 1;
}

export interface PlantActiveProgress {
  species: Species;
  stage: number;
  localMinutes: number;
  growMinutes: number;
  isLastSpecies: boolean;
}

export function getPlantActiveProgress(list: Species[], totalFocusMinutes: number): PlantActiveProgress | undefined {
  const idx = getPlantActiveIndex(list, totalFocusMinutes);
  if (idx === -1) return undefined;
  const growMinutes = plantGrowMinutes(list[idx]);
  const localMinutes = Math.min(totalFocusMinutes - cumulativeMinutesBefore(list, idx), growMinutes);
  return {
    species: list[idx],
    stage: stageFromLocalMinutes(localMinutes, growMinutes),
    localMinutes,
    growMinutes,
    isLastSpecies: idx === list.length - 1,
  };
}

export function plantNextStageInfo(localMinutes: number, growMinutes: number): { nextThreshold: number | null; remaining: number } {
  const stage = stageFromLocalMinutes(localMinutes, growMinutes);
  const nextStageThreshold = STAGE_THRESHOLDS[stage + 1];
  if (nextStageThreshold === undefined) return { nextThreshold: null, remaining: 0 };
  const nextThresholdMinutes = (nextStageThreshold / CYCLE_LENGTH) * growMinutes;
  return { nextThreshold: nextThresholdMinutes, remaining: Math.max(0, Math.ceil(nextThresholdMinutes - localMinutes)) };
}

// Per-card progress for the collection grid / preview page — plant version
// of getSpeciesProgress above, keyed by focus minutes instead of check-ins.
export function getPlantProgress(list: Species[], totalFocusMinutes: number, speciesId: string): SpeciesProgress {
  const idx = list.findIndex((s) => s.id === speciesId);
  if (idx === -1) return { stage: 0, unlocked: false, isActive: false };

  const activeIdx = getPlantActiveIndex(list, totalFocusMinutes);
  if (idx < activeIdx) return { stage: STAGE_MAX, unlocked: true, isActive: false };
  if (idx === activeIdx) {
    const growMinutes = plantGrowMinutes(list[idx]);
    const localMinutes = Math.min(totalFocusMinutes - cumulativeMinutesBefore(list, idx), growMinutes);
    return { stage: stageFromLocalMinutes(localMinutes, growMinutes), unlocked: true, isActive: true };
  }
  return { stage: 0, unlocked: false, isActive: false };
}
