-- "Mục tiêu chung" — một thử thách 2 người (người tạo + 1 người được mời),
-- mỗi người có checklist việc cần làm riêng, điểm danh theo khung giờ/ngày
-- trong tuần chung, bỏ lỡ 1 ngày thì tự động tính phạt (mức phạt chung).
--
-- Không có policy RLS công khai nào ở đây — mọi đọc/ghi đều đi qua API routes
-- dùng service-role client (bypass RLS) với kiểm tra quyền truy cập thực hiện
-- trong code (chỉ creator/partner của goal mới thao tác được), giống cách
-- /api/explore và /api/admin đã làm. Bật RLS chỉ để chặn hẳn truy cập trực
-- tiếp từ client (anon/authenticated) vào các bảng này.

CREATE TABLE IF NOT EXISTS goals (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT NOT NULL,
  duration_days  INTEGER NOT NULL CHECK (duration_days > 0),
  check_time     TEXT NOT NULL,
  window_minutes INTEGER NOT NULL CHECK (window_minutes > 0),
  check_days     JSONB NOT NULL DEFAULT '[0,1,2,3,4,5,6]'::jsonb,
  penalty_amount NUMERIC NOT NULL DEFAULT 0 CHECK (penalty_amount >= 0),
  creator_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  partner_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status         TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'declined')),
  start_date     DATE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  responded_at   TIMESTAMPTZ
);

ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS goal_tasks (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id    UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE goal_tasks ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS goal_checkins (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id          UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  check_date       DATE NOT NULL,
  completed        BOOLEAN NOT NULL DEFAULT FALSE,
  checked_task_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  checked_at       TIMESTAMPTZ,
  UNIQUE (goal_id, user_id, check_date)
);

ALTER TABLE goal_checkins ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS goals_creator_idx ON goals(creator_id);
CREATE INDEX IF NOT EXISTS goals_partner_idx ON goals(partner_id);
CREATE INDEX IF NOT EXISTS goal_tasks_goal_idx ON goal_tasks(goal_id);
CREATE INDEX IF NOT EXISTS goal_checkins_goal_idx ON goal_checkins(goal_id);
