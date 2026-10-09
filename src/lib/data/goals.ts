import { createAdminClient } from "@/lib/supabase/admin";
import { getWindowBounds, isoDateOffset, todayISO } from "@/lib/date";
import type { Goal, GoalStatus, GoalTask, GoalTaskCheckin } from "@/lib/goals";

interface GoalRow {
  id: string;
  name: string;
  duration_days: number;
  penalty_amount: number;
  creator_id: string;
  partner_id: string;
  status: GoalStatus;
  start_date: string | null;
  created_at: string;
}

interface GoalTaskRow {
  id: string;
  goal_id: string;
  user_id: string;
  title: string;
  sort_order: number;
  check_time: string;
  window_minutes: number;
  check_days: number[];
}

interface GoalTaskCheckinRow {
  task_id: string;
  check_date: string;
  checked_at: string;
}

export interface TaskInput {
  title: string;
  checkTime: string;
  windowMinutes: number;
  checkDays: number[];
}

function displayName(fullName: string | undefined, id: string): string {
  const trimmed = fullName?.trim();
  return trimmed || `Người chơi #${id.slice(0, 4).toUpperCase()}`;
}

function mapGoalTask(row: GoalTaskRow): GoalTask {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    sortOrder: row.sort_order,
    checkTime: row.check_time,
    windowMinutes: row.window_minutes,
    checkDays: row.check_days,
  };
}

function mapGoalTaskCheckin(row: GoalTaskCheckinRow): GoalTaskCheckin {
  return { taskId: row.task_id, checkDate: row.check_date, checkedAt: row.checked_at };
}

async function nameMap(admin: ReturnType<typeof createAdminClient>): Promise<Map<string, string>> {
  const { data } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const map = new Map<string, string>();
  (data?.users ?? []).forEach((u) => {
    map.set(u.id, displayName(u.user_metadata?.full_name as string | undefined, u.id));
  });
  return map;
}

function mapGoal(row: GoalRow, names: Map<string, string>): Goal {
  return {
    id: row.id,
    name: row.name,
    durationDays: row.duration_days,
    penaltyAmount: row.penalty_amount,
    creatorId: row.creator_id,
    creatorName: names.get(row.creator_id) ?? "Người chơi",
    partnerId: row.partner_id,
    partnerName: names.get(row.partner_id) ?? "Người chơi",
    status: row.status,
    startDate: row.start_date,
    createdAt: row.created_at,
  };
}

function taskRowsFor(goalId: string, userId: string, tasks: TaskInput[]) {
  return tasks.map((t, i) => ({
    goal_id: goalId,
    user_id: userId,
    title: t.title,
    sort_order: i,
    check_time: t.checkTime,
    window_minutes: t.windowMinutes,
    check_days: t.checkDays,
  }));
}

export async function listMyGoals(userId: string): Promise<Goal[]> {
  const admin = createAdminClient();
  const [{ data: rows, error }, names] = await Promise.all([
    admin
      .from("goals")
      .select("*")
      .or(`creator_id.eq.${userId},partner_id.eq.${userId}`)
      .order("created_at", { ascending: false }),
    nameMap(admin),
  ]);
  if (error) throw error;
  return ((rows as GoalRow[] | null) ?? []).map((r) => mapGoal(r, names));
}

export interface InvitablePlayer {
  id: string;
  name: string;
}

export async function listInvitablePlayers(excludeUserId: string): Promise<InvitablePlayer[]> {
  const admin = createAdminClient();
  const { data } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  return (data?.users ?? [])
    .filter((u) => {
      const bannedUntil = u.banned_until && u.banned_until !== "none" ? new Date(u.banned_until).getTime() : 0;
      return u.id !== excludeUserId && bannedUntil <= Date.now();
    })
    .map((u) => ({ id: u.id, name: displayName(u.user_metadata?.full_name as string | undefined, u.id) }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export interface CreateGoalInput {
  name: string;
  durationDays: number;
  penaltyAmount: number;
  partnerId: string;
  tasks: TaskInput[];
}

export async function createGoal(creatorId: string, input: CreateGoalInput): Promise<string> {
  const admin = createAdminClient();

  const { data: goalRow, error } = await admin
    .from("goals")
    .insert({
      name: input.name,
      duration_days: input.durationDays,
      penalty_amount: input.penaltyAmount,
      creator_id: creatorId,
      partner_id: input.partnerId,
      status: "pending",
    })
    .select("id")
    .single();

  if (error || !goalRow) throw error ?? new Error("Tạo mục tiêu thất bại");

  const { error: taskError } = await admin.from("goal_tasks").insert(taskRowsFor(goalRow.id, creatorId, input.tasks));
  if (taskError) throw taskError;

  return goalRow.id as string;
}

export interface GoalDetail {
  goal: Goal;
  creatorTasks: GoalTask[];
  partnerTasks: GoalTask[];
  creatorCheckins: GoalTaskCheckin[];
  partnerCheckins: GoalTaskCheckin[];
}

// Returns null if the goal doesn't exist or `userId` isn't a participant —
// callers should treat that as "not found" (don't leak existence to
// strangers).
export async function getGoalDetail(goalId: string, userId: string): Promise<GoalDetail | null> {
  const admin = createAdminClient();
  const { data: goalRow } = await admin.from("goals").select("*").eq("id", goalId).maybeSingle();
  if (!goalRow) return null;
  const row = goalRow as GoalRow;
  if (row.creator_id !== userId && row.partner_id !== userId) return null;

  const [names, { data: taskRows }, { data: checkinRows }] = await Promise.all([
    nameMap(admin),
    admin.from("goal_tasks").select("*").eq("goal_id", goalId).order("sort_order", { ascending: true }),
    admin.from("goal_task_checkins").select("task_id, check_date, checked_at").eq("goal_id", goalId),
  ]);

  const tasks = ((taskRows as GoalTaskRow[] | null) ?? []).map(mapGoalTask);
  const checkins = ((checkinRows as GoalTaskCheckinRow[] | null) ?? []).map(mapGoalTaskCheckin);
  const creatorTaskIds = new Set(tasks.filter((t) => t.userId === row.creator_id).map((t) => t.id));

  return {
    goal: mapGoal(row, names),
    creatorTasks: tasks.filter((t) => t.userId === row.creator_id),
    partnerTasks: tasks.filter((t) => t.userId === row.partner_id),
    creatorCheckins: checkins.filter((c) => creatorTaskIds.has(c.taskId)),
    partnerCheckins: checkins.filter((c) => !creatorTaskIds.has(c.taskId)),
  };
}

export interface RespondInput {
  accept: boolean;
  tasks?: TaskInput[];
}

export async function respondToGoal(goalId: string, userId: string, input: RespondInput): Promise<void> {
  const admin = createAdminClient();
  const { data: goalRow } = await admin.from("goals").select("*").eq("id", goalId).maybeSingle();
  if (!goalRow) throw new Error("Không tìm thấy mục tiêu này");
  const row = goalRow as GoalRow;
  if (row.partner_id !== userId) throw new Error("Chỉ người được mời mới phản hồi được");
  if (row.status !== "pending") throw new Error("Lời mời này đã được phản hồi rồi");

  if (!input.accept) {
    const { error } = await admin
      .from("goals")
      .update({ status: "declined", responded_at: new Date().toISOString() })
      .eq("id", goalId);
    if (error) throw error;
    return;
  }

  const tasks = (input.tasks ?? []).filter((t) => t.title.trim());
  if (tasks.length === 0) throw new Error("Cần thêm ít nhất 1 việc cần làm");

  const { error: taskError } = await admin.from("goal_tasks").insert(taskRowsFor(goalId, userId, tasks));
  if (taskError) throw taskError;

  // The day the invite is accepted doesn't count toward the goal — it
  // starts the day after, so "day 1" is always a full day both people had
  // the schedule in hand for.
  const { error } = await admin
    .from("goals")
    .update({ status: "active", start_date: isoDateOffset(todayISO(), 1), responded_at: new Date().toISOString() })
    .eq("id", goalId);
  if (error) throw error;
}

export async function cancelPendingGoal(goalId: string, userId: string): Promise<void> {
  const admin = createAdminClient();
  const { data: goalRow } = await admin.from("goals").select("*").eq("id", goalId).maybeSingle();
  if (!goalRow) throw new Error("Không tìm thấy mục tiêu này");
  const row = goalRow as GoalRow;
  if (row.creator_id !== userId) throw new Error("Chỉ người tạo mới huỷ được");
  if (row.status !== "pending") throw new Error("Mục tiêu này không còn ở trạng thái chờ");

  const { error } = await admin
    .from("goals")
    .update({ status: "declined", responded_at: new Date().toISOString() })
    .eq("id", goalId);
  if (error) throw error;
}

// Full delete (not just declining a pending invite) — only the creator can
// do this, at any status. goal_tasks/goal_task_checkins cascade via FK.
export async function deleteGoal(goalId: string, userId: string): Promise<void> {
  const admin = createAdminClient();
  const { data: goalRow } = await admin.from("goals").select("*").eq("id", goalId).maybeSingle();
  if (!goalRow) throw new Error("Không tìm thấy mục tiêu này");
  const row = goalRow as GoalRow;
  if (row.creator_id !== userId) throw new Error("Chỉ người tạo mới xoá được");

  const { error } = await admin.from("goals").delete().eq("id", goalId);
  if (error) throw error;
}

export async function recordTaskCheckin(goalId: string, userId: string, taskId: string): Promise<void> {
  const admin = createAdminClient();
  const { data: goalRow } = await admin.from("goals").select("*").eq("id", goalId).maybeSingle();
  if (!goalRow) throw new Error("Không tìm thấy mục tiêu này");
  const row = goalRow as GoalRow;
  if (row.creator_id !== userId && row.partner_id !== userId) {
    throw new Error("Bạn không phải thành viên của mục tiêu này");
  }
  if (row.status !== "active" || !row.start_date) throw new Error("Mục tiêu chưa bắt đầu");

  const today = todayISO();
  if (today < row.start_date) throw new Error("Mục tiêu chưa bắt đầu");

  const { data: taskRow } = await admin.from("goal_tasks").select("*").eq("id", taskId).maybeSingle();
  if (!taskRow) throw new Error("Không tìm thấy việc này");
  const task = taskRow as GoalTaskRow;
  if (task.goal_id !== goalId || task.user_id !== userId) throw new Error("Việc này không thuộc về bạn");

  const todayWeekday = new Date(`${today}T00:00:00`).getDay();
  if (!task.check_days.includes(todayWeekday)) throw new Error("Hôm nay không cần điểm danh cho việc này");

  const { start, end } = getWindowBounds(task.check_time, task.window_minutes, new Date(`${today}T00:00:00`));
  const now = new Date();
  if (now.getTime() < start.getTime() || now.getTime() > end.getTime()) {
    throw new Error("Ngoài khung giờ điểm danh rồi");
  }

  const { error } = await admin.from("goal_task_checkins").upsert(
    {
      goal_id: goalId,
      task_id: taskId,
      user_id: userId,
      check_date: today,
      checked_at: new Date().toISOString(),
    },
    { onConflict: "task_id,check_date" }
  );
  if (error) throw error;
}
