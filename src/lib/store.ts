"use client";

import { create } from "zustand";
import { createClient } from "@/lib/supabase/client";
import { diffInDays, isWithinWindow, todayISO } from "./date";
import { getActiveProgress, getPlantActiveProgress, mapSpeciesRow, type Species } from "./species";

const HISTORY_CAP = 14;

export interface CheckInResult {
  success: boolean;
  alreadyDone?: boolean;
  outsideWindow?: boolean;
  streak?: number;
  stageUp?: boolean;
  newSpecies?: boolean;
  newSpeciesName?: string;
  streakBroken?: boolean;
}

export interface FocusSessionResult {
  success: boolean;
  minutes: number;
  totalFocusMinutes: number;
  stageUp?: boolean;
  newSpecies?: boolean;
  newSpeciesName?: string;
}

interface GameStateRow {
  wake_time: string;
  window_minutes: number;
  total_check_ins: number;
  streak: number;
  best_streak: number;
  last_check_in_date: string | null;
  history: string[];
  total_focus_minutes: number;
  pomodoro_minutes: number;
}

const DEFAULT_ROW: GameStateRow = {
  wake_time: "05:30",
  window_minutes: 45,
  total_check_ins: 0,
  streak: 0,
  best_streak: 0,
  last_check_in_date: null,
  history: [],
  total_focus_minutes: 0,
  pomodoro_minutes: 25,
};

interface DisciplineState {
  hydrated: boolean;
  wakeTime: string;
  windowMinutes: number;
  totalCheckIns: number;
  streak: number;
  bestStreak: number;
  lastCheckInDate: string | null;
  history: string[];
  totalFocusMinutes: number;
  pomodoroMinutes: number;
  species: Species[];
  loadFromServer: () => Promise<void>;
  loadSpecies: () => Promise<void>;
  setWakeTime: (wakeTime: string, windowMinutes: number) => Promise<void>;
  setPomodoroMinutes: (minutes: number) => Promise<void>;
  checkIn: () => Promise<CheckInResult>;
  completeFocusSession: (minutes: number) => Promise<FocusSessionResult>;
  resetProgress: () => Promise<void>;
}

async function persistPatch(patch: Partial<GameStateRow>) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return;
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("game_state").update(patch).eq("user_id", user.id);
}

export const useDisciplineStore = create<DisciplineState>()((set, get) => ({
  hydrated: false,
  wakeTime: DEFAULT_ROW.wake_time,
  windowMinutes: DEFAULT_ROW.window_minutes,
  totalCheckIns: DEFAULT_ROW.total_check_ins,
  streak: DEFAULT_ROW.streak,
  bestStreak: DEFAULT_ROW.best_streak,
  lastCheckInDate: DEFAULT_ROW.last_check_in_date,
  history: DEFAULT_ROW.history,
  totalFocusMinutes: DEFAULT_ROW.total_focus_minutes,
  pomodoroMinutes: DEFAULT_ROW.pomodoro_minutes,
  species: [],

  loadFromServer: async () => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      set({ hydrated: true });
      return;
    }

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      set({ hydrated: true });
      return;
    }

    const [{ data }, { data: speciesRows }] = await Promise.all([
      supabase.from("game_state").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("species").select("*").order("created_at", { ascending: true }),
    ]);

    const species = (speciesRows ?? []).map(mapSpeciesRow);

    if (data) {
      set({
        wakeTime: data.wake_time,
        windowMinutes: data.window_minutes,
        totalCheckIns: data.total_check_ins,
        streak: data.streak,
        bestStreak: data.best_streak,
        lastCheckInDate: data.last_check_in_date,
        history: data.history ?? [],
        totalFocusMinutes: data.total_focus_minutes ?? 0,
        pomodoroMinutes: data.pomodoro_minutes ?? DEFAULT_ROW.pomodoro_minutes,
        species,
        hydrated: true,
      });
      return;
    }

    // First time this account has loaded the app — create its row.
    await supabase.from("game_state").insert({ user_id: user.id, ...DEFAULT_ROW });
    set({ species, hydrated: true });
  },

  loadSpecies: async () => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return;
    const supabase = createClient();
    const { data } = await supabase.from("species").select("*").order("created_at", { ascending: true });
    set({ species: (data ?? []).map(mapSpeciesRow) });
  },

  setWakeTime: async (wakeTime, windowMinutes) => {
    set({ wakeTime, windowMinutes });
    await persistPatch({ wake_time: wakeTime, window_minutes: windowMinutes });
  },

  setPomodoroMinutes: async (minutes) => {
    set({ pomodoroMinutes: minutes });
    await persistPatch({ pomodoro_minutes: minutes });
  },

  checkIn: async () => {
    const state = get();
    const today = todayISO();

    if (state.lastCheckInDate === today) {
      return { success: false, alreadyDone: true };
    }

    // Belt-and-suspenders: the button is already disabled outside the
    // window, but guard the action itself in case it's ever called directly.
    if (!isWithinWindow(state.wakeTime, state.windowMinutes)) {
      return { success: false, outsideWindow: true };
    }

    const gap = state.lastCheckInDate ? diffInDays(state.lastCheckInDate, today) : null;
    const continuesStreak = gap !== null && gap <= 1;
    const streakBroken = gap !== null && gap > 1;
    const newStreak = continuesStreak ? state.streak + 1 : 1;
    const newTotal = state.totalCheckIns + 1;
    const newBestStreak = Math.max(state.bestStreak, newStreak);
    const pets = state.species.filter((s) => s.kind === "pet");
    const prevProgress = getActiveProgress(pets, state.totalCheckIns);
    const nextProgress = getActiveProgress(pets, newTotal);
    const newSpecies = !!(prevProgress && nextProgress && prevProgress.species.id !== nextProgress.species.id);
    const stageUp = newSpecies || !!(prevProgress && nextProgress && nextProgress.stage > prevProgress.stage);
    const newHistory = [...state.history, today].slice(-HISTORY_CAP);

    set({
      lastCheckInDate: today,
      streak: newStreak,
      bestStreak: newBestStreak,
      totalCheckIns: newTotal,
      history: newHistory,
    });

    await persistPatch({
      last_check_in_date: today,
      streak: newStreak,
      best_streak: newBestStreak,
      total_check_ins: newTotal,
      history: newHistory,
    });

    return {
      success: true,
      streak: newStreak,
      stageUp,
      newSpecies,
      newSpeciesName: newSpecies ? nextProgress?.species.name : undefined,
      streakBroken,
    };
  },

  completeFocusSession: async (minutes) => {
    const state = get();
    if (minutes <= 0) {
      return { success: false, minutes: 0, totalFocusMinutes: state.totalFocusMinutes };
    }

    const newTotal = state.totalFocusMinutes + minutes;
    const plants = state.species.filter((s) => s.kind === "plant");
    const prevProgress = getPlantActiveProgress(plants, state.totalFocusMinutes);
    const nextProgress = getPlantActiveProgress(plants, newTotal);
    const newSpecies = !!(prevProgress && nextProgress && prevProgress.species.id !== nextProgress.species.id);
    const stageUp = newSpecies || !!(prevProgress && nextProgress && nextProgress.stage > prevProgress.stage);

    set({ totalFocusMinutes: newTotal });
    await persistPatch({ total_focus_minutes: newTotal });

    return {
      success: true,
      minutes,
      totalFocusMinutes: newTotal,
      stageUp,
      newSpecies,
      newSpeciesName: newSpecies ? nextProgress?.species.name : undefined,
    };
  },

  resetProgress: async () => {
    set({
      totalCheckIns: DEFAULT_ROW.total_check_ins,
      streak: DEFAULT_ROW.streak,
      bestStreak: DEFAULT_ROW.best_streak,
      lastCheckInDate: DEFAULT_ROW.last_check_in_date,
      history: DEFAULT_ROW.history,
      totalFocusMinutes: DEFAULT_ROW.total_focus_minutes,
    });
    await persistPatch({
      total_check_ins: DEFAULT_ROW.total_check_ins,
      streak: DEFAULT_ROW.streak,
      best_streak: DEFAULT_ROW.best_streak,
      last_check_in_date: DEFAULT_ROW.last_check_in_date,
      history: DEFAULT_ROW.history,
      total_focus_minutes: DEFAULT_ROW.total_focus_minutes,
    });
  },
}));

export function useStoreHydrated(): boolean {
  return useDisciplineStore((s) => s.hydrated);
}

export function useAllSpecies(): Species[] {
  return useDisciplineStore((s) => s.species);
}
