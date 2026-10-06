import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminEmail } from "@/lib/auth";

export interface AppUser {
  id: string;
  email: string;
  fullName: string;
  createdAt: string;
  lastSignInAt: string | null;
  isBlocked: boolean;
  isAdmin: boolean;
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

export async function listAppUsers(): Promise<AppUser[]> {
  const admin = createAdminClient();
  const [{ data: userData, error: userError }, { data: gameRows }] = await Promise.all([
    admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    admin.from("game_state").select("user_id, streak, best_streak, total_check_ins"),
  ]);
  if (userError) throw userError;

  const statsByUser = new Map((gameRows as GameStateStats[] | null ?? []).map((r) => [r.user_id, r]));

  return userData.users
    .map((u) => {
      const stats = statsByUser.get(u.id);
      const bannedUntil = u.banned_until && u.banned_until !== "none" ? new Date(u.banned_until).getTime() : 0;
      const email = u.email ?? "";
      return {
        id: u.id,
        email,
        fullName: (u.user_metadata?.full_name as string | undefined) || "",
        createdAt: u.created_at,
        lastSignInAt: u.last_sign_in_at ?? null,
        isBlocked: bannedUntil > Date.now(),
        isAdmin: isAdminEmail(email),
        streak: stats?.streak ?? 0,
        bestStreak: stats?.best_streak ?? 0,
        totalCheckIns: stats?.total_check_ins ?? 0,
      };
    })
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

const BAN_FOREVER_DURATION = "876000h"; // ~100 years

export async function setUserBlocked(id: string, blocked: boolean): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(id, {
    ban_duration: blocked ? BAN_FOREVER_DURATION : "none",
  });
  if (error) throw error;
}

export async function deleteAppUser(id: string): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(id);
  if (error) throw error;
}
