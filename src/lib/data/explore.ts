import { createAdminClient } from "@/lib/supabase/admin";

export interface ExplorePlayer {
  id: string;
  name: string;
  streak: number;
  bestStreak: number;
  totalCheckIns: number;
}

interface GameStateStats {
  user_id: string;
  streak: number;
  best_streak: number;
  total_check_ins: number;
}

function isBanned(bannedUntil: string | undefined): boolean {
  return !!bannedUntil && bannedUntil !== "none" && new Date(bannedUntil).getTime() > Date.now();
}

function displayName(fullName: string | undefined, id: string): string {
  const trimmed = fullName?.trim();
  return trimmed || `Người chơi #${id.slice(0, 4).toUpperCase()}`;
}

// Other players are only discoverable once they've actually checked in at
// least once — an empty, just-registered account has nothing to show.
export async function listExplorePlayers(excludeUserId: string): Promise<ExplorePlayer[]> {
  const admin = createAdminClient();
  const [{ data: userData, error: userError }, { data: gameRows }] = await Promise.all([
    admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    admin.from("game_state").select("user_id, streak, best_streak, total_check_ins"),
  ]);
  if (userError) throw userError;

  const statsByUser = new Map((gameRows as GameStateStats[] | null ?? []).map((r) => [r.user_id, r]));

  return userData.users
    .filter((u) => u.id !== excludeUserId && !isBanned(u.banned_until))
    .map((u) => {
      const stats = statsByUser.get(u.id);
      return {
        id: u.id,
        name: displayName(u.user_metadata?.full_name as string | undefined, u.id),
        streak: stats?.streak ?? 0,
        bestStreak: stats?.best_streak ?? 0,
        totalCheckIns: stats?.total_check_ins ?? 0,
      };
    })
    .filter((p) => p.totalCheckIns > 0)
    .sort((a, b) => b.streak - a.streak || b.totalCheckIns - a.totalCheckIns);
}

export async function getExplorePlayer(id: string): Promise<ExplorePlayer | null> {
  const admin = createAdminClient();
  const [{ data: userData, error: userError }, { data: gameRow }] = await Promise.all([
    admin.auth.admin.getUserById(id),
    admin.from("game_state").select("streak, best_streak, total_check_ins").eq("user_id", id).maybeSingle(),
  ]);
  if (userError || !userData?.user || isBanned(userData.user.banned_until)) return null;

  const u = userData.user;
  return {
    id: u.id,
    name: displayName(u.user_metadata?.full_name as string | undefined, u.id),
    streak: gameRow?.streak ?? 0,
    bestStreak: gameRow?.best_streak ?? 0,
    totalCheckIns: gameRow?.total_check_ins ?? 0,
  };
}
